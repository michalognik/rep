<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$stb_currency_code = 'PLN';
if ( function_exists( 'woocs_get_current_currency' ) ) {
    $stb_currency_code = woocs_get_current_currency();
} elseif ( function_exists( 'get_woocommerce_currency' ) ) {
    $stb_currency_code = get_woocommerce_currency();
}
if ( ! is_string( $stb_currency_code ) || $stb_currency_code === '' ) {
    $stb_currency_code = 'PLN';
}
$stb_currency_code = strtoupper( sanitize_text_field( $stb_currency_code ) );

$stb_currency_symbol = function_exists( 'get_woocommerce_currency_symbol' )
    ? get_woocommerce_currency_symbol( $stb_currency_code )
    : $stb_currency_code;
if ( is_string( $stb_currency_symbol ) ) {
    $stb_currency_symbol = html_entity_decode( wp_strip_all_tags( $stb_currency_symbol ) );
} else {
    $stb_currency_symbol = $stb_currency_code;
}
$stb_currency_symbol = sanitize_text_field( trim( $stb_currency_symbol ) );

$stb_currency_position      = sanitize_text_field( (string) get_option( 'woocommerce_currency_pos', 'right' ) );
$stb_currency_position_attr = strtolower( str_replace( '-', '_', $stb_currency_position ) );
$stb_rate                   = apply_filters( 'woocs_exchange_value', 1 );
if ( ! is_numeric( $stb_rate ) || floatval( $stb_rate ) <= 0 ) {
    $stb_rate = 1;
}
$stb_rate = floatval( $stb_rate );

$stb_zero_converted_val  = apply_filters( 'woocs_exchange_value', 0 );
if ( ! is_numeric( $stb_zero_converted_val ) ) {
    $stb_zero_converted_val = 0;
}
$stb_zero_converted_val = floatval( $stb_zero_converted_val );
$stb_zero_converted_str = number_format( $stb_zero_converted_val, 6, '.', '' );
$stb_rate_str            = number_format( $stb_rate, 6, '.', '' );
$stb_currency_code_clean = strtoupper( $stb_currency_code );

$stb_zero_price_markup = '';
if ( function_exists( 'wc_price' ) ) {
    $stb_zero_price_markup = wc_price( $stb_zero_converted_val );
    $stb_zero_price_markup = preg_replace(
        '/<span\s+class="woocommerce-Price-amount amount"/i',
        '<span class="woocommerce-Price-amount amount" data-woocs="price" data-price-base="0" data-price-converted="' . esc_attr( $stb_zero_converted_str ) . '" data-woocs-currency="' . esc_attr( $stb_currency_code_clean ) . '" data-woocs-symbol="' . esc_attr( $stb_currency_symbol ) . '" data-woocs-rate="' . esc_attr( $stb_rate_str ) . '" data-woocs-position="' . esc_attr( $stb_currency_position_attr ) . '"',
        $stb_zero_price_markup,
        1
    );
} else {
    $stb_number  = esc_html( number_format_i18n( $stb_zero_converted_val, 2 ) );
    $stb_symbol  = esc_html( $stb_currency_symbol );
    $stb_nbsp    = '&nbsp;';
    $stb_body    = '<bdi>' . $stb_number . $stb_nbsp . '<span class="woocommerce-Price-currencySymbol">' . $stb_symbol . '</span></bdi>';
    if ( strpos( $stb_currency_position_attr, 'left' ) === 0 ) {
        $stb_body = '<bdi><span class="woocommerce-Price-currencySymbol">' . $stb_symbol . '</span>' . $stb_nbsp . $stb_number . '</bdi>';
    }
    $stb_zero_price_markup = sprintf(
        '<span class="woocommerce-Price-amount amount" data-woocs="price" data-price-base="0" data-price-converted="%1$s" data-woocs-currency="%2$s" data-woocs-symbol="%3$s" data-woocs-rate="%4$s" data-woocs-position="%5$s">%6$s</span>',
        esc_attr( $stb_zero_converted_str ),
        esc_attr( $stb_currency_code_clean ),
        esc_attr( $stb_currency_symbol ),
        esc_attr( $stb_rate_str ),
        esc_attr( $stb_currency_position_attr ),
        $stb_body
    );
}

$stb_zero_net_markup = sprintf(
    '<span class="stb-price-prefix">%s</span> %s',
    esc_html__( 'Netto:', 'sticker-builder' ),
    $stb_zero_price_markup
);
?>
<div id="stb-root">
    <div class="stb-wrap">
        <div class="stb-steps">
            <div class="stb-card stb-step is-active" id="stb-step-1" aria-hidden="false">
                <div class="order-col">
                    <section class="list-section">
                        <span class="label">Rozmiar naklejki</span>
                        <div id="sizeList" class="opt-list">
                            <button type="button" class="opt-item" data-w="5" data-h="5" aria-pressed="false">
                                <div class="opt-line">
                                    <span class="opt-main">5 &times; 5 cm</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                            <button type="button" class="opt-item" data-w="10" data-h="10" aria-pressed="true">
                                <div class="opt-line">
                                    <span class="opt-main">10 &times; 10 cm</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                            <button type="button" class="opt-item" data-w="15" data-h="10" aria-pressed="false">
                                <div class="opt-line">
                                    <span class="opt-main">15 &times; 10 cm</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                        </div>
                        <button type="button" id="sizeCustomToggle" class="opt-toggle">Własny rozmiar</button>
                        <div id="sizeCustom" class="opt-custom is-hidden">
                            <div class="stb-inline">
                                <label class="stb-field">
                                    <span class="stb-lbl">Szerokość (cm)</span>
                                    <input type="number" id="stb-w" min="1" step="0.1" value="10">
                                </label>
                                <label class="stb-field">
                                    <span class="stb-lbl">Wysokość (cm)</span>
                                    <input type="number" id="stb-h" min="1" step="0.1" value="10">
                                </label>
                            </div>
                        </div>
                    </section>

                    <section class="list-section">
                        <span class="label">Nakład</span>
                        <div id="qtyList" class="opt-list">
                            <button type="button" class="opt-item" data-qty="10" aria-pressed="false">
                                <div class="opt-line">
                                    <span class="opt-main">10 sztuk</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                            <button type="button" class="opt-item" data-qty="50" aria-pressed="false">
                                <div class="opt-line">
                                    <span class="opt-main">50 sztuk</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                            <button type="button" class="opt-item" data-qty="100" aria-pressed="true">
                                <div class="opt-line">
                                    <span class="opt-main">100 sztuk</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                            <button type="button" class="opt-item" data-qty="200" aria-pressed="false">
                                <div class="opt-line">
                                    <span class="opt-main">200 sztuk</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                            <button type="button" class="opt-item" data-qty="1000" aria-pressed="false">
                                <div class="opt-line">
                                    <span class="opt-main">1000 sztuk</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                            <button type="button" class="opt-item" data-qty="3000" aria-pressed="false">
                                <div class="opt-line">
                                    <span class="opt-main">3000 sztuk</span>
                                    <span class="opt-right">
                                        <span class="opt-price"></span>
                                        <span class="opt-save"></span>
                                    </span>
                                </div>
                            </button>
                        </div>
                        <button type="button" id="qtyCustomToggle" class="opt-toggle">Własny nakład</button>
                        <div id="qtyCustom" class="opt-custom is-hidden">
                            <div class="stb-inline">
                                <label class="stb-field">
                                    <span class="stb-lbl">Ilość (szt.)</span>
                                    <input type="number" id="stb-qty" min="1" step="1" value="100">
                                </label>
                                <span id="qtyCustomSave" class="opt-save"></span>
                            </div>
                        </div>
                    </section>
                </div>
                <div class="step-extra" id="stb-extra">
                    <button type="button" class="step-extra-toggle" id="stb-extra-toggle" aria-expanded="false" aria-controls="stb-extra-body">
                        <span class="step-extra-label"><?php esc_html_e( 'Parametry dodatkowe', 'sticker-builder' ); ?></span>
                    </button>
                    <div class="step-extra-body" id="stb-extra-body" hidden>
                        <p class="step-extra-title"><?php esc_html_e( 'Parametry dodatkowe', 'sticker-builder' ); ?></p>
                        <div class="step-extra-select">
                            <label class="stb-field">
                                <span class="stb-lbl"><?php esc_html_e( 'Typ folii', 'sticker-builder' ); ?></span>
                                <select id="stb-extra-material" aria-label="<?php esc_attr_e( 'Typ folii', 'sticker-builder' ); ?>"></select>
                            </label>
                        </div>
                        <div class="step-extra-select">
                            <label class="stb-field">
                                <span class="stb-lbl"><?php esc_html_e( 'Kształt', 'sticker-builder' ); ?></span>
                                <select id="stb-extra-shape" aria-label="<?php esc_attr_e( 'Kształt', 'sticker-builder' ); ?>">
                                    <option value="rect"><?php esc_html_e( 'Prostokąt', 'sticker-builder' ); ?></option>
                                    <option value="circle"><?php esc_html_e( 'Koło', 'sticker-builder' ); ?></option>
                                    <option value="ellipse"><?php esc_html_e( 'Elipsa', 'sticker-builder' ); ?></option>
                                    <option value="triangle"><?php esc_html_e( 'Trójkąt', 'sticker-builder' ); ?></option>
                                    <option value="octagon"><?php esc_html_e( 'Ośmiokąt', 'sticker-builder' ); ?></option>
                                    <option value="diecut"><?php esc_html_e( 'Dowolny kształt (DIECUT)', 'sticker-builder' ); ?></option>
                                </select>
                            </label>
                        </div>
                        <div class="step-extra-select">
                            <label class="stb-field">
                                <span class="stb-lbl"><?php esc_html_e( 'Wykończenie', 'sticker-builder' ); ?></span>
                                <select id="stb-extra-finish" aria-label="<?php esc_attr_e( 'Wykończenie', 'sticker-builder' ); ?>">
                                    <option value="gloss"><?php esc_html_e( 'Połysk', 'sticker-builder' ); ?></option>
                                    <option value="mat"><?php esc_html_e( 'Mat', 'sticker-builder' ); ?></option>
                                </select>
                            </label>
                        </div>
                        <div class="step-extra-options">
                            <label class="stb-inline step-extra-option" for="stb-extra-laminate">
                                <input type="checkbox" id="stb-extra-laminate">
                                <span><?php esc_html_e( 'Wykończenie: laminat ochronny', 'sticker-builder' ); ?></span>
                            </label>
                            <label class="stb-inline step-extra-option" for="stb-extra-express">
                                <input type="checkbox" id="stb-extra-express">
                                <span><?php esc_html_e( 'Przyspiesz realizację (+15%)', 'sticker-builder' ); ?></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="step-price-panel">
                    <div class="price-box" data-stb-price-box>
                        <div class="total-val" id="stb-total" data-stb-total><?php echo wp_kses_post( $stb_zero_price_markup ); ?></div>
                        <div class="total-net" id="stb-total-net" data-stb-total-net><?php echo wp_kses_post( $stb_zero_net_markup ); ?></div>
                        <div class="total-unit">
                            <span class="total-unit-value" data-stb-total-unit><?php echo wp_kses_post( $stb_zero_price_markup ); ?></span>
                            <span class="total-unit-label"><?php esc_html_e( 'cena/szt.', 'sticker-builder' ); ?></span>
                        </div>
                        <div class="total-save" id="stb-total-save" data-stb-total-save aria-live="polite"></div>
                    </div>
                    <div class="step-config-panel" id="stb-extra-summary" hidden>
                        <div class="config-box">
                            <p class="config-box-title"><?php esc_html_e( 'Parametry naklejki', 'sticker-builder' ); ?></p>
                            <dl class="config-box-list">
                                <div class="config-box-row">
                                    <dt><?php esc_html_e( 'Kształt', 'sticker-builder' ); ?></dt>
                                    <dd id="sum-shape">&mdash;</dd>
                                </div>
                                <div class="config-box-row">
                                    <dt><?php esc_html_e( 'Typ folii', 'sticker-builder' ); ?></dt>
                                    <dd id="sum-material">&mdash;</dd>
                                </div>
                                <div class="config-box-row">
                                    <dt><?php esc_html_e( 'Wykończenie', 'sticker-builder' ); ?></dt>
                                    <dd id="sum-finish">&mdash;</dd>
                                </div>
                                <div class="config-box-row">
                                    <dt><?php esc_html_e( 'Laminat', 'sticker-builder' ); ?></dt>
                                    <dd id="sum-laminate">&mdash;</dd>
                                </div>
                                <div class="config-box-row">
                                    <dt><?php esc_html_e( 'Realizacja', 'sticker-builder' ); ?></dt>
                                    <dd id="sum-express">&mdash;</dd>
                                </div>
                            </dl>
                            <div class="config-box-shipping">
                                <span class="config-box-shipping-label"><?php esc_html_e( 'Szacowana wysyłka', 'sticker-builder' ); ?></span>
                                <span class="config-box-shipping-date" id="sum-leadtime">&mdash;</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="step-footer">
                    <button type="button" class="btn btn-primary btn-step" id="stb-step1-next">Dalej</button>
                </div>
            </div>

            <div class="stb-card stb-step" id="stb-step-2" aria-hidden="true">
                <div class="step-content">
                    <header class="step-header">
                        <button type="button" class="step-back-link" id="stb-step2-back">Wróć do parametrów</button>
                        <h2 class="step-title">Projekt naklejki</h2>
                    </header>
                    <div class="step-options">
                        <button type="button" class="btn btn-primary btn-step" id="stb-upload-trigger">
                            <span class="btn-step-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                    <path d="M12 16V5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M8 9l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                                </svg>
                            </span>
                            <span class="btn-step-label">Wgraj</span>
                        </button>
                        <button type="button" class="btn btn-primary btn-step" id="stb-open-modal">
                            <span class="btn-step-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                                    <path d="M6 18l2-5 10-10 3 3-10 10-5 2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"></path>
                                    <path d="M14 4l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                                    <path d="M5 19l4-1-3-3-1 4z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"></path>
                                </svg>
                            </span>
                            <span class="btn-step-label">Kreator</span>
                        </button>
                    </div>
                    <p class="step-file-info" id="stb-upload-summary">Brak pliku</p>
                    <div class="cta">
                        <button type="button" class="btn btn-primary btn-step" id="stb-add">Dalej</button>
                    </div>
                    <div class="step-summary">
                        <div class="price-box" data-stb-price-box>
                            <div class="total-val" data-stb-total><?php echo wp_kses_post( $stb_zero_price_markup ); ?></div>
                            <div class="total-net" data-stb-total-net><?php echo wp_kses_post( $stb_zero_net_markup ); ?></div>
                            <div class="total-unit">
                                <span class="total-unit-value" data-stb-total-unit><?php echo wp_kses_post( $stb_zero_price_markup ); ?></span>
                                <span class="total-unit-label"><?php esc_html_e( 'cena/szt.', 'sticker-builder' ); ?></span>
                            </div>
                        <div class="total-save" data-stb-total-save aria-live="polite"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div class="designer stb-card">
            <div class="stb-two">
                <div class="stb-controls acc">
                    <div class="acc__item" id="acc-shape">
                        <button type="button" class="acc__head" aria-expanded="true">Kształt i obrys</button>
                        <div class="acc__body">
                            <div class="stb-row">
                                <span class="stb-lbl">Wybierz kształt</span>
                                <div class="shape-grid" id="stb-shapes">
                                    <button type="button" class="shape-btn" data-shape="rect" aria-pressed="true">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg>
                                    </button>
                                    <button type="button" class="shape-btn" data-shape="circle" aria-pressed="false">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle></svg>
                                    </button>
                                    <button type="button" class="shape-btn" data-shape="ellipse" aria-pressed="false">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="8" ry="5"></ellipse></svg>
                                    </button>
                                    <button type="button" class="shape-btn" data-shape="triangle" aria-pressed="false">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 5 19 19 5 19"></polygon></svg>
                                    </button>
                                    <button type="button" class="shape-btn" data-shape="octagon" aria-pressed="false">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="9 3 15 3 21 9 21 15 15 21 9 21 3 15 3 9"></polygon></svg>
                                    </button>
                                    <button type="button" class="shape-btn" data-shape="diecut" aria-pressed="false">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M11.8 3.2c1.6-.3 3.3.2 4.8.9 1.4.7 2.2 1.8 3.4 2.4 1.2.6 1.9 1.6 1.6 2.9-.3 1.2-1.4 2.2-1.3 3.5.1 1.4 1.3 2.7.7 4-.6 1.4-2.1 2-3.3 2.6-1.3.6-2.7.7-3.9 1.3-1.3.7-2.1 2-3.6 2.3-1.5.3-3-.6-4-1.7-1-.9-1.1-2.3-1.8-3.4-.7-1-2.1-1.5-2.7-2.6-.6-1.1-.3-2.5-.1-3.7.3-1.3 1.1-2.3 1.4-3.5.3-1.2-.1-2.5.5-3.6.7-1.3 2.2-1.9 3.4-2.5 1.2-.6 2.3-.9 3.3-1.1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div id="stb-diecut-slot" hidden></div>
                            <div class="stb-row" id="row-ellipse" style="display:none;">
                                <label class="stb-field">
                                    <span class="stb-lbl">Proporcje elipsy: <strong id="stb-ellipse-val">100%</strong></span>
                                    <input type="range" id="stb-ellipse" min="0.4" max="1" step="0.01" value="1">
                                </label>
                            </div>
                            <div class="stb-row">
                                <label class="stb-field">
                                    <span class="stb-lbl">Zaokrąglenie rogów</span>
                                    <input type="range" id="stb-corner" min="0" max="20" step="1" value="4">
                                </label>
                            </div>
                            <div class="stb-row">
                                <div class="stb-inline outline-row">
                                    <label class="stb-inline" style="gap:6px;">
                                        <input type="checkbox" id="stb-outline-on" checked>
                                        <span>Obrys naklejki</span>
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Szerokość obrysu (mm)</span>
                                        <input type="number" id="stb-outline-mm" min="0" step="0.5" value="3">
                                    </label>
                                </div>
                                <div class="stb-inline color-row">
                                    <label class="stb-field stb-color-field">
                                        <span class="stb-lbl">Kolor obrysu</span>
                                        <div class="stb-color-input">
                                            <input type="color" id="stb-outline-color" value="#ff0000" data-default="#ff0000">
                                            <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-outline-color" aria-label="Resetuj kolor obrysu"><span aria-hidden="true">↺</span></button>
                                        </div>
                                    </label>
                                    <label class="stb-field stb-color-field">
                                        <span class="stb-lbl">Kolor tła</span>
                                        <div class="stb-color-input">
                                            <input type="color" id="stb-color" value="#ffffff" data-default="#ffffff">
                                            <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-color" aria-label="Resetuj kolor tła"><span aria-hidden="true">↺</span></button>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="acc__item" id="acc-image">
                        <button type="button" class="acc__head" aria-expanded="false">Grafika</button>
                        <div class="acc__body" hidden>
                            <div class="stb-row" id="stb-upload-row">
                                <input type="file" id="stb-image" accept="image/*,.pdf" class="stb-file-input" hidden>
                                <div class="stb-inline">
                                    <button type="button" class="btn" id="stb-upload">Wgraj plik</button>
                                    <button type="button" class="btn" id="stb-img-clear">Usuń plik</button>
                                    <span id="stb-fname">brak pliku</span>
                                </div>
                                <div class="stb-field">
                                    <span class="stb-lbl">Parametry pliku</span>
                                    <p id="stb-fmeta"></p>
                                </div>
                                <p id="stb-file-hint" class="stb-hint"></p>
                            </div>
                        </div>
                    </div>

                    <div class="acc__item" id="acc-material">
                        <button type="button" class="acc__head" aria-expanded="false">Materiał</button>
                        <div class="acc__body" hidden>
                            <div class="stb-row stb-material-row">
                                <div class="stb-material-grid-col">
                                    <span class="stb-lbl" id="stb-material-grid-label">Rodzaj folii</span>
                                    <div class="stb-material-grid-scroll" role="presentation">
                                        <div class="stb-material-grid" id="stb-material-grid" role="listbox" aria-labelledby="stb-material-grid-label"></div>
                                    </div>
                                </div>
                                <label class="stb-field" style="min-width:160px;">
                                    <span class="stb-lbl"><?php esc_html_e( 'Wykończenie', 'sticker-builder' ); ?></span>
                                    <select id="stb-finish">
                                        <option value="gloss"><?php esc_html_e( 'Połysk', 'sticker-builder' ); ?></option>
                                        <option value="mat"><?php esc_html_e( 'Mat', 'sticker-builder' ); ?></option>
                                    </select>
                                </label>
                                <label class="stb-inline" style="margin-top:6px; gap:6px;">
                                    <input type="checkbox" id="stb-laminate">
                                    <span>Laminat ochronny</span>
                                </label>
                            </div>
                            <input type="hidden" id="stb-material" value="Folia ekonomiczna">
                        </div>
                    </div>

                    <div class="acc__item" id="acc-text">
                        <button type="button" class="acc__head" aria-expanded="false">Tekst</button>
                        <div class="acc__body" hidden>
                            <div class="stb-row">
                                <label class="stb-field">
                                    <span class="stb-lbl">Treść</span>
                                    <textarea id="stb-text-input" placeholder="Dodaj własny tekst"></textarea>
                                </label>
                                <label class="stb-field">
                                    <span class="stb-lbl">Czcionka</span>
                                    <select id="stb-text-font">
                                        <option value="Inter" style="font-family: 'Inter', sans-serif;">Inter</option>
                                        <option value="Montserrat" style="font-family: 'Montserrat', sans-serif;">Montserrat</option>
                                        <option value="Roboto" style="font-family: 'Roboto', sans-serif;">Roboto</option>
                                        <option value="Lato" style="font-family: 'Lato', sans-serif;">Lato</option>
                                        <option value="Poppins" style="font-family: 'Poppins', sans-serif;">Poppins</option>
                                        <option value="Open Sans" style="font-family: 'Open Sans', sans-serif;">Open Sans</option>
                                        <option value="Pacifico" style="font-family: 'Pacifico', cursive;">Pacifico</option>
                                        <option value="Caveat" style="font-family: 'Caveat', cursive;">Caveat</option>
                                        <option value="Shadows Into Light" style="font-family: 'Shadows Into Light', cursive;">Shadows Into Light</option>
                                        <option value="Patrick Hand" style="font-family: 'Patrick Hand', cursive;">Patrick Hand</option>
                                        <option value="Dancing Script" style="font-family: 'Dancing Script', cursive;">Dancing Script</option>
                                        <option value="Amatic SC" style="font-family: 'Amatic SC', cursive;">Amatic SC</option>
                                        <option value="Gloria Hallelujah" style="font-family: 'Gloria Hallelujah', cursive;">Gloria Hallelujah</option>
                                        <option value="Great Vibes" style="font-family: 'Great Vibes', cursive;">Great Vibes</option>
                                        <option value="Permanent Marker" style="font-family: 'Permanent Marker', cursive;">Permanent Marker</option>
                                        <option value="Kalam" style="font-family: 'Kalam', cursive;">Kalam</option>
                                        <option value="Satisfy" style="font-family: 'Satisfy', cursive;">Satisfy</option>
                                        <option value="Lobster" style="font-family: 'Lobster', cursive;">Lobster</option>
                                        <option value="Indie Flower" style="font-family: 'Indie Flower', cursive;">Indie Flower</option>
                                        <option value="Handlee" style="font-family: 'Handlee', cursive;">Handlee</option>
                                    </select>
                                </label>
                                <div class="stb-text-toolbar" role="group" aria-label="Formatowanie tekstu">
                                    <button type="button" class="btn btn-icon" id="stb-text-bold" aria-pressed="false" title="Pogrubienie">
                                        <span class="icon-letter icon-letter-bold" aria-hidden="true">B</span>
                                    </button>
                                    <button type="button" class="btn btn-icon" id="stb-text-italic" aria-pressed="false" title="Pochylenie">
                                        <span class="icon-letter icon-letter-italic" aria-hidden="true">I</span>
                                    </button>
                                    <label class="stb-text-color">
                                        <span class="stb-lbl">Kolor</span>
                                        <div class="stb-color-input">
                                            <input type="color" id="stb-text-color" value="#111111" data-default="#111111">
                                            <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-text-color" aria-label="Resetuj kolor tekstu"><span aria-hidden="true">↺</span></button>
                                        </div>
                                    </label>
                                </div>
                                <label class="stb-field stb-text-size">
                                    <span class="stb-lbl">Rozmiar: <strong id="stb-text-size-val">100%</strong></span>
                                    <input type="range" id="stb-text-size" min="0.4" max="4" step="0.05" value="1">
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="acc__item" id="acc-qr">
                        <button type="button" class="acc__head" aria-expanded="false">Kod QR</button>
                        <div class="acc__body" hidden>
                            <div class="stb-row">
                                <div class="stb-inline">
                                    <button type="button" class="btn" id="stb-qr-remove-btn" style="display:none;">Usuń kod QR</button>
                                </div>
                                <div class="stb-inline">
                                    <label class="stb-field">
                                        <span class="stb-lbl">Typ kodu</span>
                                        <select id="stb-qr-type">
                                            <option value="url">Adres URL</option>
                                            <option value="wifi">Wi-Fi</option>
                                        </select>
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Kolor ciemny</span>
                                        <div class="stb-color-input">
                                            <input type="color" id="stb-qr-dark" value="#111111" data-default="#111111">
                                            <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-qr-dark" aria-label="Resetuj kolor ciemny QR"><span aria-hidden="true">↺</span></button>
                                        </div>
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Kolor tła</span>
                                        <div class="stb-color-input">
                                            <input type="color" id="stb-qr-light" value="#ffffff" data-default="#ffffff">
                                            <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-qr-light" aria-label="Resetuj kolor tła QR"><span aria-hidden="true">↺</span></button>
                                        </div>
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Poziom korekcji błędów</span>
                                        <select id="stb-qr-ecc">
                                            <option value="L">L (7%)</option>
                                            <option value="M" selected>M (15%)</option>
                                            <option value="Q">Q (25%)</option>
                                            <option value="H">H (30%)</option>
                                        </select>
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Margines (px)</span>
                                        <input type="number" id="stb-qr-quiet" min="0" step="1" value="4">
                                    </label>
                                </div>
                                <div class="stb-row" data-qr-section="url">
                                    <label class="stb-field">
                                        <span class="stb-lbl">Adres URL</span>
                                        <input type="url" id="stb-qr-url" class="stb-url-input" placeholder="https://">
                                    </label>
                                </div>
                                <div class="stb-row" data-qr-section="wifi" hidden>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Nazwa sieci (SSID)</span>
                                        <input type="text" id="stb-qr-wifi-ssid" placeholder="MojaSiec">
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Hasło</span>
                                        <input type="text" id="stb-qr-wifi-pass" placeholder="Haslo123">
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Szyfrowanie</span>
                                        <select id="stb-qr-wifi-auth">
                                            <option value="WPA">WPA/WPA2</option>
                                            <option value="WEP">WEP</option>
                                            <option value="nopass">Bez hasła</option>
                                        </select>
                                    </label>
                                    <label class="stb-inline" style="gap:6px;">
                                        <input type="checkbox" id="stb-qr-wifi-hidden">
                                        <span>Sieć ukryta</span>
                                    </label>
                                </div>
                                <div class="stb-row">
                                    <div class="stb-inline qr-frame-controls">
                                        <label class="stb-field">
                                            <span class="stb-lbl">Margines: <strong id="stb-qr-frame-pad-val">12%</strong></span>
                                            <input type="range" id="stb-qr-frame-pad" min="0" max="40" step="1" value="12">
                                        </label>
                                        <label class="stb-field">
                                            <span class="stb-lbl">Zaokrąglenie: <strong id="stb-qr-frame-radius-val">8%</strong></span>
                                            <input type="range" id="stb-qr-frame-radius" min="0" max="60" step="1" value="8">
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="preview-panel">
                    <div class="stb-toolbar">
                        <button type="button" class="btn btn-icon" id="tb-zoom-out" title="Oddal" aria-label="Oddal">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
                                <line x1="8.2" y1="10.5" x2="12.8" y2="10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="14.8" y1="14.8" x2="19.2" y2="19.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-zoom-in" title="Przybliż" aria-label="Przybliż">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
                                <line x1="10.5" y1="8.2" x2="10.5" y2="12.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="8.2" y1="10.5" x2="12.8" y2="10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="14.8" y1="14.8" x2="19.2" y2="19.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-fit" title="Wycentruj i dopasuj" aria-label="Wycentruj i dopasuj">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <polyline points="9 4 4 4 4 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="15 4 20 4 20 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="9 20 4 20 4 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="15 20 20 20 20 15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="9" y="9" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-rot--" title="Obróć w lewo" aria-label="Obróć w lewo">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <path d="M8.5 7H5.2V3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M5.5 11.5a6.5 6.5 0 1 1 1.9 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-rot-+" title="Obróć w prawo" aria-label="Obróć w prawo">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <path d="M15.5 7H18.8V3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M18.5 11.5a6.5 6.5 0 1 0-1.9 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-grid" title="Pokaż/ukryj siatkę" aria-label="Pokaż lub ukryj siatkę">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"/>
                                <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1.6"/>
                                <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.6"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-delete" title="Usuń element" aria-label="Usuń element">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <rect x="7" y="8" width="10" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                                <line x1="5" y1="5" x2="19" y2="5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="10" y1="5" x2="10" y2="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="14" y1="5" x2="14" y2="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                <line x1="10" y1="10" x2="10" y2="17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                                <line x1="14" y1="10" x2="14" y2="17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-primary stb-toolbar-download" id="tb-pdf" title="Pobierz naklejkę" aria-label="Pobierz naklejkę">POBIERZ NAKLEJKĘ</button>
                    </div>
                    <div class="canvas-box">
                        <canvas id="stb-canvas" width="520" height="520" aria-label="Podgląd naklejki"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="stb-modal" id="stb-modal" aria-hidden="true">
    <div class="stb-modal__backdrop" data-close></div>
    <div class="stb-modal__content">
        <button type="button" class="btn stb-modal__close" id="stb-close-modal">✕</button>
        <div class="stb-modal__main" id="stb-modal-main"></div>
        <div class="stb-modal__summary">
            <div class="price-box" data-stb-price-box>
                <div class="total-val" data-stb-total><?php echo wp_kses_post( $stb_zero_price_markup ); ?></div>
                <div class="total-net" data-stb-total-net><?php echo wp_kses_post( $stb_zero_net_markup ); ?></div>
                <div class="total-unit">
                    <span class="total-unit-value" data-stb-total-unit><?php echo wp_kses_post( $stb_zero_price_markup ); ?></span>
                    <span class="total-unit-label"><?php esc_html_e( 'cena/szt.', 'sticker-builder' ); ?></span>
                </div>
                <div class="total-save" data-stb-total-save aria-live="polite"></div>
            </div>
        </div>
    </div>
</div>
