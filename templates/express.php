<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$express_config = isset( $express_config ) && is_array( $express_config ) ? $express_config : [];
$wrapper_class  = isset( $wrapper_class ) ? $wrapper_class : '';
$express_json   = wp_json_encode( $express_config );
if ( false === $express_json ) {
    $express_json = '{}';
}

$classes = trim( 'stb-express-root ' . $wrapper_class );
$standard_url = ! empty( $express_config['standardUrl'] ) ? esc_url( $express_config['standardUrl'] ) : '#';
$currency_symbol = isset( $express_config['currency']['symbol'] ) ? $express_config['currency']['symbol'] : 'zł';
$currency_code   = isset( $express_config['currency']['code'] ) ? $express_config['currency']['code'] : 'PLN';

$format_price = function( $amount ) use ( $express_config, $currency_symbol, $currency_code ) {
    $amount = floatval( $amount );
    if ( function_exists( 'wc_price' ) ) {
        return wc_price( $amount );
    }
    $formatted = number_format_i18n( $amount, 2 );
    $symbol    = $currency_symbol ? $currency_symbol : $currency_code;
    return esc_html( $formatted . ' ' . $symbol );
};
?>
<div id="stb-express-root" class="<?php echo esc_attr( $classes ); ?>" data-express-config="<?php echo esc_attr( $express_json ); ?>">
    <section class="stb-express-hero">
        <div class="stb-express-hero__copy">
            <h1>Winylowe etykiety wodoodporne? <strong>Wysyłka w 48h</strong></h1>
            <p class="stb-express-hero__lead">Zamów do <strong>12:00</strong> — nadamy <span data-express-hero-deadline>najbliższy dzień roboczy</span>.</p>
            <ul class="stb-express-hero__sla" aria-label="Warunki SLA">
                <li>Format z listy</li>
                <li>Gotowy plik do druku</li>
                <li>Płatność online</li>
                <li><strong>Bez laminacji w ekspresie</strong></li>
            </ul>
        </div>
    </section>

    <section class="stb-express-mode" aria-label="Wybór trybu">
        <div class="stb-express-mode__grid">
            <div class="stb-express-mode__card is-active" aria-pressed="true">
                <header>
                    <p class="stb-express-mode__eyebrow">Ekspres 48h</p>
                    <h2>Presety • pewny termin</h2>
                </header>
                <ul>
                    <li>Stałe formaty na winylu</li>
                    <li>Cutoff: zamów do 12:00</li>
                    <li>Dopłata ekspres: +15%</li>
                </ul>
            </div>
            <a class="stb-express-mode__card" href="<?php echo $standard_url; ?>">
                <header>
                    <p class="stb-express-mode__eyebrow">Tryb standard</p>
                    <h2>Dowolne kształty/opcje + laminacja</h2>
                </header>
                <p>Pełny konfigurator • terminy standard</p>
            </a>
        </div>
    </section>

    <section class="stb-express-presets" aria-label="Presety ekspresowe">
        <header class="stb-express-presets__header">
            <h2>Wybierz format z listy</h2>
            <p>Stałe konfiguracje na winylu — tylko kilka kliknięć do koszyka.</p>
        </header>
        <div class="stb-express-presets__grid" data-express-preset-list>
            <?php if ( ! empty( $express_config['presets'] ) ) : ?>
                <?php foreach ( $express_config['presets'] as $preset ) :
                    $preset_quantities = isset( $preset['quantities'] ) ? array_map( 'intval', (array) $preset['quantities'] ) : [];
                    $preset_price      = isset( $preset['basePrice'] ) ? floatval( $preset['basePrice'] ) : 0;
                    $preset_id         = isset( $preset['id'] ) ? $preset['id'] : '';
                    $multipliers       = isset( $preset['multipliers'] ) ? array_map( 'floatval', (array) $preset['multipliers'] ) : [];
                    ?>
                    <button type="button"
                        class="stb-express-preset"
                        data-preset-id="<?php echo esc_attr( $preset_id ); ?>"
                        data-preset='<?php echo esc_attr( wp_json_encode( [
                            'id'          => $preset_id,
                            'name'        => $preset['name'],
                            'size'        => $preset['size'],
                            'material'    => $preset['material'],
                            'quantities'  => $preset_quantities,
                            'basePrice'   => $preset_price,
                            'multipliers' => $multipliers,
                        ] ) ); ?>'>
                        <span class="stb-express-preset__badge">48h</span>
                        <span class="stb-express-preset__name"><?php echo esc_html( $preset['name'] ); ?></span>
                        <span class="stb-express-preset__size"><?php echo esc_html( $preset['size'] ); ?></span>
                        <span class="stb-express-preset__material"><?php echo esc_html( $preset['material'] ); ?></span>
                        <span class="stb-express-preset__price">od <?php echo $format_price( $preset_price ); ?></span>
                    </button>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </section>

    <section class="stb-express-step" data-express-step hidden>
        <button type="button" class="stb-express-step__back" data-express-back>← Wróć do listy presetów</button>
        <header class="stb-express-step__header">
            <h2 data-express-selected-name>Wybierz preset</h2>
            <p class="stb-express-step__meta">
                <span data-express-selected-size></span>
                <span class="separator">•</span>
                <span data-express-selected-material></span>
            </p>
        </header>
        <div class="stb-express-step__content">
            <div class="stb-express-step__left">
                <h3>1. Nakład</h3>
                <div class="stb-express-qty" data-express-qty-list aria-label="Dostępne nakłady"></div>
                <div class="stb-express-toggle">
                    <label class="stb-express-toggle__label">
                        <input type="checkbox" id="stb-express-toggle" checked aria-describedby="stb-express-toggle-hint">
                        <span>Ekspres 48h (+15%)</span>
                    </label>
                    <p id="stb-express-toggle-hint" class="stb-express-toggle__hint">Domyślnie aktywny — gwarantuje wysyłkę w 48h.</p>
                </div>
                <p class="stb-express-eta" data-express-eta>Wysyłka: —</p>
            </div>
            <div class="stb-express-step__right">
                <form class="stb-express-form" method="post" enctype="multipart/form-data" data-express-form>
                    <?php wp_nonce_field( 'stb_express_submit', 'stb_express_nonce' ); ?>
                    <?php if ( ! empty( $express_config['productId'] ) ) : ?>
                        <input type="hidden" name="add-to-cart" value="<?php echo esc_attr( $express_config['productId'] ); ?>" data-express-product>
                    <?php endif; ?>
                    <input type="hidden" name="<?php echo esc_attr( WC_Sticker_Builder::FIELD ); ?>" value="" data-express-payload>
                    <div class="stb-express-upload">
                        <label for="stb-express-file" class="stb-express-upload__label">2. Dodaj plik do druku</label>
                        <input type="file" id="stb-express-file" name="stb_express_file" accept=".pdf,.ai,.eps,.svg" data-express-file>
                        <p class="stb-express-upload__hint">Spad <strong>2 mm</strong>, <strong>CMYK</strong>, teksty na krzywych; obrys cięcia (<code>CutContour</code>) dla kształtów nieregularnych. Minimalny element ≥15–20 mm, odstęp od linii cięcia ≥1,5 mm.</p>
                        <ul class="stb-express-preflight" data-express-preflight aria-live="polite"></ul>
                    </div>
                    <div class="stb-express-summary">
                        <?php if ( empty( $express_config['productId'] ) ) : ?>
                            <p class="stb-express-warning">Uwaga: przypisz produkt WooCommerce do shortcodu <code>[sticker_express]</code>, aby włączyć dodawanie do koszyka.</p>
                        <?php endif; ?>
                        <div class="stb-express-price" data-express-price>—</div>
                        <div class="stb-express-price" data-express-price-net></div>
                        <ul class="stb-express-benefits">
                            <li><strong>Wodoodporne</strong> – na szkło, plastik, metal</li>
                            <li><strong>Mocny klej (szary)</strong> – mniejsze przebijanie tła</li>
                            <li><strong>Outdoor-ready</strong> – krótko/średnioterminowe ekspozycje</li>
                        </ul>
                        <p class="stb-express-error" data-express-error aria-live="assertive"></p>
                        <button type="submit" class="btn btn-primary stb-express-submit">Dodaj do koszyka</button>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <section class="stb-express-faq" aria-label="FAQ ekspres 48h">
        <h2>FAQ 48h</h2>
        <dl>
            <div>
                <dt>Cutoff zamówień</dt>
                <dd><strong>Do 12:00</strong> w dni robocze. Po 12:00 liczymy jako złożone następnego dnia.</dd>
            </div>
            <div>
                <dt>Warunki 48h</dt>
                <dd>Preset z listy, gotowy plik, płatność online, <strong>bez laminacji</strong>.</dd>
            </div>
            <div>
                <dt>Dostawa</dt>
                <dd>Wysyłka w 48h, doręczenie zwykle następnego dnia roboczego (Kurier / InPost).</dd>
            </div>
        </dl>
    </section>
</div>
