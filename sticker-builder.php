<?php
/**
 * Plugin Name: Sticker Builder
 * Description: Konfigurator naklejek dla WooCommerce + dynamiczne ceny.
 * Version:     1.0.2
 * Author:      You
 * License:     GPL-2.0+
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

final class WC_Sticker_Builder {

    const FIELD = 'stb_payload';
    const MAX_UPLOAD_MB = 25;

    public static function init() {
        add_shortcode( 'sticker_builder', [ __CLASS__, 'render_shortcode' ] );
        add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ] );

        add_filter( 'woocommerce_add_cart_item_data', [ __CLASS__, 'add_cart_item_data' ], 10, 3 );
        add_action( 'woocommerce_before_calculate_totals', [ __CLASS__, 'override_cart_item_price' ], 10, 1 );
        add_filter( 'woocommerce_get_item_data', [ __CLASS__, 'show_item_data' ], 10, 2 );
        add_filter( 'woocommerce_cart_item_thumbnail', [ __CLASS__, 'cart_item_thumbnail' ], 10, 3 );
        add_filter( 'woocommerce_add_to_cart_redirect', [ __CLASS__, 'maybe_redirect_to_cart' ] );

        add_action( 'wp_ajax_stb_upload_file', [ __CLASS__, 'ajax_upload_file' ] );
        add_action( 'wp_ajax_nopriv_stb_upload_file', [ __CLASS__, 'ajax_upload_file' ] );
        add_action( 'woocommerce_checkout_create_order_line_item', [ __CLASS__, 'add_order_line_item_meta' ], 10, 4 );

        add_action( 'init', [ __CLASS__, 'maybe_schedule_cleanup' ] );
        add_action( 'stb_cleanup_uploads', [ __CLASS__, 'cleanup_stale_uploads' ] );
    }

    protected static function upload_nonce_action() {
        return 'stb-upload';
    }

    public static function max_upload_bytes() {
        $limit = absint( self::MAX_UPLOAD_MB ) * 1024 * 1024;

        $ini_limits = [
            wp_convert_hr_to_bytes( ini_get( 'upload_max_filesize' ) ),
            wp_convert_hr_to_bytes( ini_get( 'post_max_size' ) ),
        ];

        foreach ( $ini_limits as $ini_limit ) {
            if ( $ini_limit > 0 ) {
                $limit = $limit > 0 ? min( $limit, $ini_limit ) : $ini_limit;
            }
        }

        return max( 0, $limit );
    }

    protected static function allowed_mimes() {
        $mimes = [
            'jpg|jpeg|jpe' => 'image/jpeg',
            'png'          => 'image/png',
            'webp'         => 'image/webp',
            'svg'          => 'image/svg+xml',
            'pdf'          => 'application/pdf',
        ];

        return apply_filters( 'stb_allowed_mimes', $mimes );
    }

    protected static function upload_error_message( $code ) {
        switch ( intval( $code ) ) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return __( 'Przekroczono maksymalny rozmiar pliku.', 'stb' );
            case UPLOAD_ERR_PARTIAL:
                return __( 'Plik został przesłany tylko częściowo.', 'stb' );
            case UPLOAD_ERR_NO_FILE:
                return __( 'Nie otrzymano pliku do przesłania.', 'stb' );
            case UPLOAD_ERR_NO_TMP_DIR:
                return __( 'Brak katalogu tymczasowego na serwerze.', 'stb' );
            case UPLOAD_ERR_CANT_WRITE:
                return __( 'Nie udało się zapisać pliku na dysku.', 'stb' );
            case UPLOAD_ERR_EXTENSION:
                return __( 'Przesyłanie pliku zostało zablokowane przez rozszerzenie PHP.', 'stb' );
            default:
                return __( 'Nie udało się przesłać pliku.', 'stb' );
        }
    }

    public static function ajax_upload_file() {
        check_ajax_referer( self::upload_nonce_action(), 'nonce' );

        if ( empty( $_FILES['stb_file'] ) || ! is_array( $_FILES['stb_file'] ) ) {
            wp_send_json_error( [ 'message' => __( 'Brak pliku w żądaniu.', 'stb' ) ] );
        }

        $file = $_FILES['stb_file'];
        if ( ! empty( $file['error'] ) ) {
            wp_send_json_error( [ 'message' => self::upload_error_message( $file['error'] ) ] );
        }

        $limit = self::max_upload_bytes();
        if ( $limit > 0 && ! empty( $file['size'] ) && intval( $file['size'] ) > $limit ) {
            wp_send_json_error(
                [
                    'message' => sprintf(
                        __( 'Plik przekracza limit %s.', 'stb' ),
                        size_format( $limit )
                    ),
                ]
            );
        }

        $file['name'] = isset( $file['name'] ) ? sanitize_file_name( $file['name'] ) : 'upload';

        $allowed_mimes = self::allowed_mimes();
        $checked       = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'], $allowed_mimes );

        if ( empty( $checked['type'] ) || empty( $checked['ext'] ) ) {
            wp_send_json_error( [ 'message' => __( 'Nieobsługiwany typ pliku.', 'stb' ) ] );
        }

        if ( ! empty( $checked['proper_filename'] ) ) {
            $file['name'] = sanitize_file_name( $checked['proper_filename'] );
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';

        $upload = wp_handle_upload(
            $file,
            [
                'test_form' => false,
                'mimes'     => $allowed_mimes,
                'test_type' => true,
            ]
        );

        if ( isset( $upload['error'] ) && $upload['error'] ) {
            wp_send_json_error( [ 'message' => $upload['error'] ] );
        }

        $attachment_id = 0;
        $mime_type     = ! empty( $upload['type'] ) ? $upload['type'] : $checked['type'];

        if ( ! empty( $upload['file'] ) ) {
            $attachment = [
                'post_title'     => sanitize_text_field( pathinfo( $file['name'], PATHINFO_FILENAME ) ),
                'post_content'   => '',
                'post_status'    => 'inherit',
                'post_mime_type' => $mime_type,
                'post_parent'    => 0,
            ];

            $attachment_id = wp_insert_attachment( $attachment, $upload['file'] );

            if ( is_wp_error( $attachment_id ) ) {
                $attachment_id = 0;
            } elseif ( $attachment_id ) {
                if ( wp_attachment_is_image( $attachment_id ) ) {
                    $metadata = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
                    if ( ! is_wp_error( $metadata ) && ! empty( $metadata ) ) {
                        wp_update_attachment_metadata( $attachment_id, $metadata );
                    }
                }

                update_post_meta( $attachment_id, '_stb_temp_upload', time() );
            }
        }

        $size = isset( $file['size'] ) ? intval( $file['size'] ) : 0;
        if ( ! $size && ! empty( $upload['file'] ) && file_exists( $upload['file'] ) ) {
            $size = intval( filesize( $upload['file'] ) );
        }

        wp_send_json_success(
            [
                'id'   => $attachment_id,
                'url'  => ! empty( $upload['url'] ) ? esc_url_raw( $upload['url'] ) : '',
                'size' => $size,
                'type' => $mime_type,
                'name' => sanitize_file_name( basename( ! empty( $upload['file'] ) ? $upload['file'] : $file['name'] ) ),
            ]
        );
    }

    public static function maybe_schedule_cleanup() {
        if ( ! wp_next_scheduled( 'stb_cleanup_uploads' ) ) {
            wp_schedule_event( time() + DAY_IN_SECONDS, 'daily', 'stb_cleanup_uploads' );
        }
    }

    public static function cleanup_stale_uploads() {
        $age       = apply_filters( 'stb_upload_cleanup_age', DAY_IN_SECONDS * 3 );
        $threshold = time() - absint( $age );

        $attachments = get_posts(
            [
                'post_type'      => 'attachment',
                'post_status'    => 'inherit',
                'posts_per_page' => 50,
                'fields'         => 'ids',
                'no_found_rows'  => true,
                'post_parent'    => 0,
                'meta_query'     => [
                    [
                        'key'     => '_stb_temp_upload',
                        'value'   => $threshold,
                        'compare' => '<=',
                        'type'    => 'NUMERIC',
                    ],
                ],
            ]
        );

        if ( empty( $attachments ) ) {
            return;
        }

        foreach ( $attachments as $attachment_id ) {
            wp_delete_attachment( $attachment_id, true );
        }
    }

    public static function add_order_line_item_meta( $item, $cart_item_key, $values, $order ) {
        if ( empty( $values['stb'] ) || empty( $values['stb']['payload'] ) ) { return; }

        $payload = $values['stb']['payload'];

        $attachment_id = 0;
        $url           = '';

        if ( ! empty( $values['stb']['file_upload_id'] ) ) {
            $attachment_id = absint( $values['stb']['file_upload_id'] );
        } elseif ( ! empty( $payload['file_upload_id'] ) ) {
            $attachment_id = absint( $payload['file_upload_id'] );
        }

        if ( ! empty( $values['stb']['file_url'] ) ) {
            $url = esc_url_raw( $values['stb']['file_url'] );
        } elseif ( ! empty( $payload['file_url'] ) ) {
            $url = esc_url_raw( $payload['file_url'] );
        }

        if ( $attachment_id && ! $url ) {
            $maybe_url = wp_get_attachment_url( $attachment_id );
            if ( $maybe_url ) {
                $url = esc_url_raw( $maybe_url );
            }
        }

        if ( $url ) {
            $item->add_meta_data( __( 'Plik klienta', 'stb' ), $url, true );
        }

        if ( $attachment_id ) {
            $item->add_meta_data( '_stb_file_upload_id', $attachment_id, true );

            $order_id = ( is_object( $order ) && method_exists( $order, 'get_id' ) ) ? intval( $order->get_id() ) : 0;
            if ( $order_id ) {
                wp_update_post(
                    [
                        'ID'          => $attachment_id,
                        'post_parent' => $order_id,
                    ]
                );
            }

            delete_post_meta( $attachment_id, '_stb_temp_upload' );
        }
    }

    public static function plugin_path( $append = '' ) {
        $base = plugin_dir_path( __FILE__ );
        return $append ? $base . ltrim( $append, '/\\' ) : $base;
    }

    public static function plugin_url( $append = '' ) {
        $base = plugin_dir_url( __FILE__ );
        return $append ? $base . ltrim( $append, '/\\' ) : $base;
    }

    public static function enqueue_assets() {
        if ( ! is_product() ) { return; }

        /* ===== CSS ===== */
        $css_rel = 'assets/sticker-builder.css';
        $css_abs = self::plugin_path( $css_rel );
        $ver_css = file_exists( $css_abs ) ? filemtime( $css_abs ) : '1.0.0';
        wp_enqueue_style( 'sticker-builder', self::plugin_url( $css_rel ), [], $ver_css );

        /* ===== JS vendor: PDF-Lib (eksport PDF) ===== */
        $pdf_lib_rel = 'assets/vendor/pdf-lib.min.js';
        $pdf_lib_abs = self::plugin_path( $pdf_lib_rel );
        if ( file_exists( $pdf_lib_abs ) ) {
            wp_enqueue_script(
                'stb-pdf-lib',
                self::plugin_url( $pdf_lib_rel ),
                [],
                filemtime( $pdf_lib_abs ) ?: '1.17.1',
                true
            );
        }

        /* ===== JS vendor: PDF.js (podgląd PDF w canvasie) =====
           Używamy buildów UMD: pdf.min.js + pdf.worker.min.js w tym samym katalogu. */
        $pdfjs_rel_dir   = 'assets/vendor/pdfjs/';
        $pdfjs_main_rel  = $pdfjs_rel_dir . 'pdf.min.js';
        $pdfjs_worker_rel= $pdfjs_rel_dir . 'pdf.worker.min.js';
        $pdfjs_main_abs  = self::plugin_path( $pdfjs_main_rel );
        $pdfjs_worker_abs= self::plugin_path( $pdfjs_worker_rel );
        $have_pdfjs = file_exists( $pdfjs_main_abs ) && file_exists( $pdfjs_worker_abs );

        if ( $have_pdfjs ) {
            wp_enqueue_script(
                'stb-pdfjs',
                self::plugin_url( $pdfjs_main_rel ),
                [],
                filemtime( $pdfjs_main_abs ) ?: '4.6.82',
                true
            );
            // Ustaw poprawny workerSrc, żeby PDF.js mógł wczytać worker z tej samej wtyczki:
            $worker_url = self::plugin_url( $pdfjs_worker_rel );
            $inline = 'if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "'. esc_url( $worker_url ) .'"; }';
            wp_add_inline_script( 'stb-pdfjs', $inline, 'after' );
        }

        /* ===== (Opcjonalnie) QRCode (davidshimjs) ===== */
        $qr_rel = 'assets/vendor/qrcode.min.js';
        $qr_abs = self::plugin_path( $qr_rel );
        $have_qr = file_exists( $qr_abs );
        if ( $have_qr ) {
            wp_enqueue_script(
                'stb-qrcodejs',
                self::plugin_url( $qr_rel ),
                [],
                filemtime( $qr_abs ) ?: '1.0.0',
                true
            );
        }

        /* ===== Główny skrypt ===== */
        $main_rel = 'assets/sticker-builder.js';
        $main_abs = self::plugin_path( $main_rel );
        $deps = [];
        if ( file_exists( $pdf_lib_abs ) ) { $deps[] = 'stb-pdf-lib'; }
        if ( $have_pdfjs )               { $deps[] = 'stb-pdfjs'; }
        if ( $have_qr )                  { $deps[] = 'stb-qrcodejs'; }

        wp_enqueue_script(
            'sticker-builder',
            self::plugin_url( $main_rel ),
            $deps,
            file_exists( $main_abs ) ? filemtime( $main_abs ) : '1.0.0',
            true
        );

        $currency_code = 'PLN';
        if ( function_exists( 'woocs_get_current_currency' ) ) {
            $currency_code = woocs_get_current_currency();
        } elseif ( function_exists( 'get_woocommerce_currency' ) ) {
            $currency_code = get_woocommerce_currency();
        }
        if ( ! is_string( $currency_code ) || $currency_code === '' ) {
            $currency_code = 'PLN';
        }
        $currency_code = strtoupper( sanitize_text_field( $currency_code ) );

        $currency_symbol = function_exists( 'get_woocommerce_currency_symbol' )
            ? get_woocommerce_currency_symbol( $currency_code )
            : $currency_code;
        if ( is_string( $currency_symbol ) ) {
            $currency_symbol = html_entity_decode( wp_strip_all_tags( $currency_symbol ) );
        } else {
            $currency_symbol = $currency_code;
        }
        $currency_symbol = sanitize_text_field( trim( $currency_symbol ) );

        $currency_position = sanitize_text_field( (string) get_option( 'woocommerce_currency_pos', 'right' ) );

        $rate = apply_filters( 'woocs_exchange_value', 1 );
        if ( ! is_numeric( $rate ) || floatval( $rate ) <= 0 ) {
            $rate = 1;
        }

        $locale = function_exists( 'determine_locale' ) ? determine_locale() : get_locale();
        if ( ! is_string( $locale ) || $locale === '' ) {
            $locale = 'pl_PL';
        }
        $locale = sanitize_text_field( $locale );

        wp_localize_script(
            'sticker-builder',
            'STB_CURR',
            [
                'code'     => $currency_code,
                'symbol'   => $currency_symbol,
                'position' => $currency_position,
                'rate'     => floatval( $rate ),
                'locale'   => $locale,
            ]
        );

        wp_localize_script(
            'sticker-builder',
            'STB_UPLOAD',
            [
                'ajax_url'         => admin_url( 'admin-ajax.php' ),
                'nonce'            => wp_create_nonce( self::upload_nonce_action() ),
                'max_upload_bytes' => self::max_upload_bytes(),
            ]
        );
    }

    public static function render_shortcode( $atts = [], $content = '' ) {
        ob_start();
        $tpl = self::plugin_path( 'templates/builder.php' );
        if ( file_exists( $tpl ) ) {
            include $tpl;
        } else {
            echo '<p>Brak pliku szablonu konfiguratora.</p>';
        }
        return ob_get_clean();
    }

    public static function add_cart_item_data( $cart_item_data, $product_id, $variation_id ) {
        if ( empty( $_POST[ self::FIELD ] ) ) { return $cart_item_data; }
        $raw = wp_unslash( $_POST[ self::FIELD ] );
        $payload = json_decode( $raw, true );

        if ( is_array( $payload ) ) {
            $price_pln = isset( $payload['total_price_pln'] ) ? floatval( $payload['total_price_pln'] ) : 0.0;
            $qty       = isset( $payload['quantity'] ) ? max( 1, intval( $payload['quantity'] ) ) : 1;

            $cart_item_data['stb'] = [
                'payload'   => $payload,
                'price_pln' => $price_pln,
                'qty'       => $qty,
            ];
            $cart_item_data['stb_key'] = md5( microtime() . wp_rand() );

            if ( ! empty( $payload['file_upload_id'] ) ) {
                $cart_item_data['stb']['file_upload_id'] = absint( $payload['file_upload_id'] );
                $cart_item_data['stb']['payload']['file_upload_id'] = $cart_item_data['stb']['file_upload_id'];
            }

            if ( ! empty( $payload['file_url'] ) ) {
                $cart_item_data['stb']['file_url'] = esc_url_raw( $payload['file_url'] );
                $cart_item_data['stb']['payload']['file_url'] = $cart_item_data['stb']['file_url'];
            }

            if ( isset( $payload['file_upload_size'] ) ) {
                $cart_item_data['stb']['file_upload_size'] = max( 0, intval( $payload['file_upload_size'] ) );
                $cart_item_data['stb']['payload']['file_upload_size'] = $cart_item_data['stb']['file_upload_size'];
            }
        }

        return $cart_item_data;
    }

    public static function override_cart_item_price( $cart ) {
        if ( is_admin() && ! defined( 'DOING_AJAX' ) ) { return; }
        if ( empty( $cart ) || ! method_exists( $cart, 'get_cart' ) ) { return; }

        foreach ( $cart->get_cart() as $item ) {
            if ( empty( $item['stb']['price_pln'] ) ) { continue; }
            $total_price = floatval( $item['stb']['price_pln'] );
            $qty         = max( 1, intval( $item['quantity'] ) );
            $unit_price  = $total_price / $qty;
            if ( $unit_price > 0 && isset( $item['data'] ) ) {
                $item['data']->set_price( $unit_price );
            }
        }
    }

    public static function show_item_data( $item_data, $cart_item ) {
        if ( empty( $cart_item['stb']['payload'] ) ) { return $item_data; }
        $p = $cart_item['stb']['payload'];

        if ( isset( $p['width_cm'], $p['height_cm'] ) ) {
            $item_data[] = [
                'key'   => __( 'Rozmiar', 'stb' ),
                'value' => wc_clean( rtrim( rtrim( (string) $p['width_cm'], '0' ), '.' ) . ' × ' . rtrim( rtrim( (string) $p['height_cm'], '0' ), '.' ) . ' cm' ),
            ];
        }
        if ( isset( $p['quantity'] ) ) {
            $item_data[] = [
                'key'   => __( 'Ilość (w kreatorze)', 'stb' ),
                'value' => intval( $p['quantity'] ),
            ];
        }
        if ( isset( $p['material'] ) ) {
            $item_data[] = [
                'key'   => __( 'Materiał', 'stb' ),
                'value' => sanitize_text_field( $p['material'] ),
            ];
        }
        if ( isset( $p['laminate'] ) ) {
            $item_data[] = [
                'key'   => __( 'Laminat', 'stb' ),
                'value' => $p['laminate'] ? 'tak' : 'nie',
            ];
        }

        return $item_data;
    }

    public static function cart_item_thumbnail( $thumb, $cart_item ) {
        if ( empty( $cart_item['stb']['payload']['preview_png'] ) ) { return $thumb; }
        $src = $cart_item['stb']['payload']['preview_png'];
        $safe = esc_url( $src );
        if ( strpos( $src, 'data:image' ) === 0 ) { $safe = $src; }
        return '<img src="' . $safe . '" alt="' . esc_attr__( 'Podgląd', 'stb' ) . '" style="width:70px;height:auto;border-radius:6px;border:1px solid #e5e5e5;" />';
    }

    public static function maybe_redirect_to_cart( $url ) {
        if ( isset( $_POST['stb_go_cart'] ) && $_POST['stb_go_cart'] === '1' ) {
            return wc_get_cart_url();
        }
        return $url;
    }
}

WC_Sticker_Builder::init();
