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

    public static function init() {
        add_shortcode( 'sticker_builder', [ __CLASS__, 'render_shortcode' ] );
        add_action( 'wp_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ] );

        add_filter( 'woocommerce_add_cart_item_data', [ __CLASS__, 'add_cart_item_data' ], 10, 3 );
        add_action( 'woocommerce_before_calculate_totals', [ __CLASS__, 'override_cart_item_price' ], 10, 1 );
        add_filter( 'woocommerce_get_item_data', [ __CLASS__, 'show_item_data' ], 10, 2 );
        add_filter( 'woocommerce_cart_item_thumbnail', [ __CLASS__, 'cart_item_thumbnail' ], 10, 3 );
        add_filter( 'woocommerce_add_to_cart_redirect', [ __CLASS__, 'maybe_redirect_to_cart' ] );
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
