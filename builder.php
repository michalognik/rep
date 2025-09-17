<?php
/**
 * Template: Sticker Builder – akordeony, QR (davidshimjs), PDF progress + DIECUT
 * Path: wp-content/plugins/sticker-builder/templates/builder.php
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ===== Waluta (zgodność z WOOCS) ===== */
$stb_currency = [
  'code'     => get_woocommerce_currency(),
  'symbol'   => get_woocommerce_currency_symbol( get_woocommerce_currency() ),
  'rate'     => 1.0,
  'position' => get_option('woocommerce_currency_pos', 'left'),
  'locale'   => 'pl-PL',
];
if ( isset( $GLOBALS['WOOCS'] ) && is_object( $GLOBALS['WOOCS'] ) ) {
  $woocs = $GLOBALS['WOOCS'];
  $code  = $woocs->current_currency;
  $currs = $woocs->get_currencies();
  if ( ! empty( $code ) ) $stb_currency['code'] = $code;
  if ( isset( $currs[ $stb_currency['code'] ]['rate'] ) ) $stb_currency['rate'] = (float) $currs[ $stb_currency['code'] ]['rate'];
  if ( ! empty( $currs[ $stb_currency['code'] ]['symbol'] ) ) $stb_currency['symbol'] = $currs[ $stb_currency['code'] ]['symbol'];
}
?>
<script>window.STB_CURR = <?php echo wp_json_encode( $stb_currency ); ?>;</script>
<script>window.STB_CART_URL = "<?php echo esc_url( wc_get_cart_url() ); ?>";</script>

<div id="stb-root">
  <div class="stb-wrap">
    <div class="stb-grid-page">

      <!-- ===== PANEL ZAMÓWIENIA ===== -->
      <div class="stb-card order-col">
        <div class="stb-order-grid">

          <!-- ILOŚĆ -->
          <div class="list-section">
            <div class="label">Ilość</div>
            <div id="qtyList" class="opt-list" role="listbox" aria-label="Wybierz ilość">
              <?php
              // (pozostawiam zgodnie z aktualnymi ustaleniami; jeśli zmieniałeś wcześniej – nie ruszam)
              $qty_opts = [10,50,100,200,500,1000,1500,2000];
              foreach ($qty_opts as $q){
                $pressed = $q === 10 ? 'true' : 'false';
                echo '<button type="button" class="opt-item" data-qty="'.esc_attr($q).'" aria-pressed="'.$pressed.'">
                        <div class="opt-line">
                          <span class="opt-main">'.esc_html($q).'</span>
                          <span class="opt-right"><span class="opt-price">—</span><span class="opt-save"></span></span>
                        </div>
                      </button>';
              }
              ?>
            </div>
            <button type="button" id="qtyCustomToggle" class="opt-toggle">Inna ilość</button>
            <div class="opt-custom is-hidden" id="qtyCustom">
              <div class="stb-field">
                <span class="stb-lbl">Podaj ilość</span>
                <input id="stb-qty" type="number" min="1" step="1" value="10" />
              </div>
              <div id="qtyCustomSave" class="opt-save" style="text-align:right"></div>
            </div>
          </div>

          <!-- ROZMIAR -->
          <div class="list-section">
            <div class="label">Rozmiar</div>
            <div id="sizeList" class="opt-list" role="listbox" aria-label="Wybierz rozmiar">
              <?php
              $size_opts = [
                ['w'=>5,   'h'=>5],
                ['w'=>7.5, 'h'=>7.5],
                ['w'=>10,  'h'=>10],   // domyślne
                ['w'=>12.5,'h'=>12.5],
                ['w'=>15,  'h'=>10],
                ['w'=>20,  'h'=>15],
              ];
              foreach ($size_opts as $s){
                $label = rtrim(rtrim(number_format($s['w'],2,',',' '),'0'),',') . ' × ' . rtrim(rtrim(number_format($s['h'],2,',',' '),'0'),',') . ' cm';
                $pressed = ($s['w']==10 && $s['h']==10) ? 'true' : 'false';
                echo '<button type="button" class="opt-item" data-w="'.esc_attr($s['w']).'" data-h="'.esc_attr($s['h']).'" aria-pressed="'.$pressed.'">
                        <div class="opt-line">
                          <span class="opt-main">'.esc_html($label).'</span>
                          <span class="opt-right"><span class="opt-price"></span></span>
                        </div>
                      </button>';
              }
              ?>
            </div>
            <button type="button" id="sizeCustomToggle" class="opt-toggle">Własny rozmiar</button>
            <div class="opt-custom is-hidden" id="sizeCustom">
              <div class="stb-field">
                <span class="stb-lbl">Szerokość (cm)</span>
                <input id="stb-w" type="number" min="1" step="0.1" value="10" placeholder="np. 10" />
              </div>
              <div class="stb-field">
                <span class="stb-lbl">Wysokość (cm)</span>
                <input id="stb-h" type="number" min="1" step="0.1" value="10" placeholder="np. 10" />
              </div>
            </div>
          </div>

          <!-- CENA + CTA -->
          <div class="price-col price-in-order">
            <div class="price-box">
              <div class="total-val" id="stb-total">—</div>
              <div class="total-net" id="stb-total-net">— netto</div>
            </div>
            <div class="cta">
              <button id="stb-open-modal" class="btn" type="button">Kreator</button>
              <button id="stb-add" class="btn btn-primary" type="button">Dodaj do koszyka</button>
            </div>
          </div>

        </div>
      </div>

      <!-- ===== DESIGNER (w modalu) ===== -->
      <div class="stb-card designer">
        <div class="stb-two">

          <!-- LEWA KOLUMNA — AKORDEONY -->
          <div class="stb-controls acc" style="max-width:420px;">
            <!-- Kształt -->
            <div class="acc__item" id="acc-shape">
              <button class="acc__head" type="button" aria-expanded="false">Kształt</button>
              <div class="acc__body" hidden>
                <div class="stb-row">
                  <div class="label">Kształt</div>
                  <div class="shape-grid" id="stb-shapes">
                    <button type="button" class="shape-btn" data-shape="rect" aria-pressed="true" aria-label="Prostokąt" title="Prostokąt">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" ry="3"/></svg>
                    </button>
                    <button type="button" class="shape-btn" data-shape="circle" aria-pressed="false" aria-label="Koło" title="Koło">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>
                    </button>
                    <button type="button" class="shape-btn" data-shape="ellipse" aria-pressed="false" aria-label="Elipsa" title="Elipsa">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="9" ry="6"/></svg>
                    </button>
                    <button type="button" class="shape-btn" data-shape="triangle" aria-pressed="false" aria-label="Trójkąt" title="Trójkąt">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,4 20,20 4,20"/></svg>
                    </button>
                    <button type="button" class="shape-btn" data-shape="octagon" aria-pressed="false" aria-label="Ośmiokąt" title="Ośmiokąt">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <polygon points="7,3 17,3 21,7 21,17 17,21 7,21 3,17 3,7"/>
                      </svg>
                    </button>
                    <!-- DIECUT -->
                    <button type="button" class="shape-btn" data-shape="diecut" aria-pressed="false" aria-label="DIECUT" title="DIECUT (obrys po przezroczystości PNG)">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="4" y="4" width="16" height="16" rx="4" ry="4"></rect>
                        <path d="M4 12h3M17 12h3M12 4v3M12 17v3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="stb-row" id="row-ellipse" style="display:none">
                  <div class="label">Eliptyczność</div>
                  <div class="stb-inline">
                    <input id="stb-ellipse" type="range" min="0.4" max="1.0" step="0.01" value="1.0" />
                    <span class="note" id="stb-ellipse-val">100%</span>
                  </div>
                </div>

                <!-- DIECUT — ustawienia obrysu -->
                <div class="stb-row" id="row-diecut" style="display:none">
                  <div class="label">DIECUT (obrys po alfa PNG)</div>
                  <div class="stb-inline" style="flex-wrap:wrap; gap:8px;">
                    <span class="note">szerokość obrysu</span>
                    <input id="stb-diecut-outline-mm" class="fixed-num" type="number" min="0" step="0.5" value="3" />
                    <span class="note">mm</span>
                    <span class="note">• kolor obrysu</span>
                    <input id="stb-diecut-outline-color" type="color" value="#111111" />
                  </div>
                  <div class="note" style="margin-top:6px; color:#666;">W trybie DIECUT akceptujemy tylko PNG z przezroczystością.</div>
                </div>

                <div class="stb-row">
                  <div class="label">Obrys i tło</div>
                  <div class="stb-inline" style="flex-wrap:wrap; gap:8px;">
                    <label><input id="stb-outline-on" type="checkbox" /> obrys</label>
                    <input id="stb-outline-mm" class="fixed-num" type="number" min="0" step="0.5" value="3" />
                    <span class="note">mm</span>
                    <span class="note">• promień narożników</span>
                    <input id="stb-corner" class="fixed-range" type="range" min="0" max="20" step="1" value="4" />
                  </div>
                  <div class="stb-inline" style="margin-top:6px; flex-wrap:wrap; gap:12px;">
                    <div class="stb-inline" style="gap:8px;">
                      <span class="note">kolor obrysu</span>
                      <input id="stb-outline-color" type="color" value="#ffffff" />
                    </div>
                    <div class="stb-inline" style="gap:8px;">
                      <span class="note">kolor tła</span>
                      <input id="stb-color" type="color" value="#ffffff" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grafika -->
            <div class="acc__item" id="acc-image">
              <button class="acc__head" type="button" aria-expanded="false">Grafika</button>
              <div class="acc__body" hidden>
                <div class="stb-row">
                  <div class="label">Obsługiwane formaty</div>
                  <div class="note" style="margin:2px 0 8px 0; color:#666;">PNG, SVG, JPG, WEBP, PDF</div>
                  <div class="stb-inline" style="gap:8px; flex-wrap:wrap;">
                    <input id="stb-image" type="file" accept=".png,.svg,.jpg,.jpeg,.webp,.pdf" style="display:none" />
                    <button type="button" id="stb-upload" class="btn btn-primary">Wgraj plik</button>
                    <button type="button" id="stb-img-clear" class="btn">Usuń</button>
                    <span id="stb-fname" class="note">brak pliku</span>
                  </div>
                  <div class="note" id="stb-diecut-msg" style="margin-top:8px; display:none; color:#d12929; font-weight:700;">
                    Tryb DIECUT: WGRAJ TYLKO PNG — BEZ TŁA
                  </div>
                  <div class="note" id="stb-fmeta" style="margin-top:6px; color:#666;">&nbsp;</div>
                </div>
              </div>
            </div>

            <!-- Tekst -->
            <div class="acc__item" id="acc-text">
              <button class="acc__head" type="button" aria-expanded="false">Tekst</button>
              <div class="acc__body" hidden>
                <div class="stb-row" style="display:grid; gap:10px;">
                  <div class="stb-field">
                    <span class="stb-lbl">Treść</span>
                    <input id="stb-text-input" type="text" placeholder="Wpisz tekst" />
                  </div>
                  <div class="stb-inline" style="gap:8px; flex-wrap:wrap;">
                    <div class="stb-field" style="min-width:180px;">
                      <span class="stb-lbl">Czcionka</span>
                      <select id="stb-text-font" class="btn" style="height:34px;">
                        <option value="Inter" selected>Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Lato">Lato</option>
                        <option value="Oswald">Oswald</option>
                        <option value="Merriweather">Merriweather</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Raleway">Raleway</option>
                        <option value="Nunito">Nunito</option>
                        <option value="Rubik">Rubik</option>
                        <option value="Permanent Marker">Permanent Marker (odręczna)</option>
                        <option value="Pacifico">Pacifico (odręczna)</option>
                        <option value="Dancing Script">Dancing Script (odręczna)</option>
                        <option value="Caveat">Caveat (odręczna)</option>
                      </select>
                    </div>
                    <div class="stb-field" style="min-width:120px;">
                      <span class="stb-lbl">Kolor</span>
                      <input id="stb-text-color" type="color" value="#111111" />
                    </div>
                  </div>
                  <div class="stb-inline" style="gap:8px; flex-wrap:wrap;">
                    <button id="stb-text-center" class="btn" type="button">Wyśrodkuj</button>
                    <button id="stb-text-reset" class="btn" type="button">Reset skali/obrotu</button>
                    <button id="stb-text-clear" class="btn" type="button">Wyczyść</button>
                  </div>
                  <!-- usunięto notkę o skalowaniu/obrocie -->
                </div>
              </div>
            </div>

            <!-- QR kod (davidshimjs) -->
            <div class="acc__item" id="acc-qr">
              <button class="acc__head" type="button" aria-expanded="false">QR kod</button>
              <div class="acc__body" hidden>
                <div class="stb-row" style="display:grid; gap:10px;">
                  <input id="stb-qr-enabled" type="checkbox" hidden />

                  <div class="stb-inline" style="justify-content:space-between;">
                    <div class="stb-inline" style="gap:8px;">
                      <button id="stb-qr-add-btn" class="btn btn-primary" type="button">DODAJ QR</button>
                      <button id="stb-qr-remove-btn" class="btn" type="button" style="display:none;">USUŃ QR</button>
                    </div>
                    <div class="stb-inline" style="gap:10px;">
                      <label class="stb-lbl" for="stb-qr-ecc">ECC</label>
                      <select id="stb-qr-ecc" class="btn" style="height:34px;">
                        <option value="L">L</option>
                        <option value="M" selected>M</option>
                        <option value="Q">Q</option>
                        <option value="H">H</option>
                      </select>
                    </div>
                  </div>

                  <div class="stb-field">
                    <label class="stb-lbl" for="stb-qr-type">Typ danych</label>
                    <select id="stb-qr-type" class="btn" style="height:34px;">
                      <option value="url" selected>URL</option>
                      <option value="wifi">Wi-Fi</option>
                    </select>
                  </div>

                  <!-- URL -->
                  <div data-qr-section="url" class="stb-field">
                    <label class="stb-lbl" for="stb-qr-url">Adres URL</label>
                    <input id="stb-qr-url" type="text" placeholder="https://example.com" />
                  </div>

                  <!-- Wi-Fi -->
                  <div data-qr-section="wifi" hidden style="display:grid; gap:8px;">
                    <div class="stb-field">
                      <label class="stb-lbl" for="stb-qr-wifi-ssid">SSID</label>
                      <input id="stb-qr-wifi-ssid" type="text" placeholder="MojaSiec" />
                    </div>
                    <div class="stb-field">
                      <label class="stb-lbl" for="stb-qr-wifi-pass">Hasło</label>
                      <input id="stb-qr-wifi-pass" type="text" placeholder="••••••••" />
                    </div>
                    <div class="stb-inline" style="gap:8px; flex-wrap:wrap;">
                      <div class="stb-field" style="min-width:140px;">
                        <label class="stb-lbl" for="stb-qr-wifi-auth">Szyfrowanie</label>
                        <select id="stb-qr-wifi-auth" class="btn" style="height:34px;">
                          <option value="WPA" selected>WPA/WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">Brak hasła</option>
                        </select>
                      </div>
                      <label class="stb-inline" style="gap:8px;">
                        <input id="stb-qr-wifi-hidden" type="checkbox" />
                        <span>Ukryta sieć</span>
                      </label>
                    </div>
                  </div>

                  <!-- Wygląd QR -->
                  <div class="stb-inline" style="gap:10px; flex-wrap:wrap;">
                    <div class="stb-field" style="min-width:120px;">
                      <label class="stb-lbl" for="stb-qr-dark">Kolor ciemny</label>
                      <input id="stb-qr-dark" type="color" value="#111111" />
                    </div>
                    <div class="stb-field" style="min-width:120px;">
                      <label class="stb-lbl" for="stb-qr-light">Kolor jasny</label>
                      <input id="stb-qr-light" type="color" value="#ffffff" />
                    </div>
                    <div class="stb-field" style="min-width:160px;">
                      <label class="stb-lbl" for="stb-qr-quiet">Margines (quiet zone)</label>
                      <input id="stb-qr-quiet" type="range" min="0" max="32" step="1" value="4" />
                    </div>
                  </div>

                  <!-- Logo w środku QR -->
                  <div class="stb-inline" style="gap:8px; flex-wrap:wrap;">
                    <input id="stb-qr-logo" type="file" accept=".png,.svg,.jpg,.jpeg,.webp" style="display:none" />
                    <button id="stb-qr-logo-upload" type="button" class="btn">Dodaj logo</button>
                    <button id="stb-qr-logo-clear" type="button" class="btn">Usuń logo</button>
                    <span id="stb-qr-logo-name" class="note">brak pliku</span>
                  </div>

                  <!-- Obrys QR -->
                  <div class="stb-inline" style="gap:10px; flex-wrap:wrap;">
                    <label class="stb-inline" style="gap:8px; align-items:center;">
                      <input id="stb-qr-outline-on" type="checkbox" />
                      <span>Obrys wokół QR</span>
                    </label>
                    <div class="stb-field" style="min-width:120px;">
                      <label class="stb-lbl" for="stb-qr-outline-color">Kolor obrysu</label>
                      <input id="stb-qr-outline-color" type="color" value="#111111" />
                    </div>
                    <div class="stb-field" style="min-width:160px;">
                      <label class="stb-lbl" for="stb-qr-outline-width">Grubość obrysu (px)</label>
                      <input id="stb-qr-outline-width" type="number" min="0" step="1" value="0" />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- Materiał i wykończenie -->
            <div class="acc__item" id="acc-mat">
              <button class="acc__head" type="button" aria-expanded="false">Materiał i wykończenie</button>
              <div class="acc__body" hidden>
                <div class="stb-row" style="display:grid; gap:10px;">
                  <div class="stb-field">
                    <span class="stb-lbl">Materiał</span>
                    <select id="stb-material" class="btn" style="height:34px;">
                      <option value="Folia ekonomiczna">Folia ekonomiczna</option>
                      <option value="Folia długoterminowa">Folia długoterminowa</option>
                      <option value="Folia winylowa" selected>Folia winylowa</option>
                      <option value="Folia pryzmatyczna">Folia pryzmatyczna</option>
                      <option value="Folia holograficzna">Folia holograficzna</option>
                      <option value="Folia chrom">Folia chrom</option>
                      <option value="Folia świecąca">Folia świecąca</option>
                    </select>
                  </div>
                  <label class="stb-inline" style="gap:8px; align-items:center;">
                    <input id="stb-laminate" type="checkbox" />
                    <span>Laminat (+15%)</span>
                  </label>
                </div>
              </div>
            </div>
          </div><!-- /stb-controls -->

          <!-- PRAWA KOLUMNA — PODGLĄD -->
          <div class="preview-panel">
            <div class="stb-toolbar">
              <button id="tb-zoom-out" class="btn" type="button">−</button>
              <button id="tb-fit" class="btn" type="button">Dopasuj</button>
              <button id="tb-zoom-in" class="btn" type="button">+</button>
              <span class="note">|</span>
              <button id="tb-rot--" class="btn" type="button">⟲</button>
              <button id="tb-rot-+" class="btn" type="button">⟳</button>
              <span class="note">|</span>
              <button id="tb-grid" class="btn" type="button">Siatka</button>
              <span class="note">|</span>
              <button id="tb-pdf" class="btn" type="button">PDF</button>
              <!-- Pasek postępu PDF doklejany dynamicznie przez JS -->
            </div>

            <div class="canvas-box">
              <canvas id="stb-canvas" width="560" height="560" aria-label="Podgląd naklejki"></canvas>
            </div>

            <!-- MINI SUMMARY (w modalu) -->
            <div class="stb-mini-summary">
              <div class="sum-left">
                <button id="sum-dims" type="button" class="click-edit" aria-label="Edytuj rozmiar">10 × 10 cm</button>
                <div id="sum-edit-size" class="inline-edit is-hidden">
                  <input id="sum-w" type="number" min="1" step="0.1" value="10" aria-label="Szerokość (cm)" />
                  <span class="note">×</span>
                  <input id="sum-h" type="number" min="1" step="0.1" value="10" aria-label="Wysokość (cm)" />
                  <span class="note">cm</span>
                </div>
                <span>•</span>
                <button id="sum-qty" type="button" class="click-edit" aria-label="Edytuj ilość">10 szt.</button>
                <div id="sum-edit-qty" class="inline-edit is-hidden">
                  <input id="sum-qty-inp" type="number" min="1" step="1" value="10" aria-label="Ilość" />
                </div>
              </div>
              <div class="sum-right">
                <div class="sum-total" id="sum-total">—</div>
                <div class="sum-net" id="sum-net">— netto</div>
                <div class="note" id="sum-shape" style="margin-top:6px">Kształt: —</div>
                <div class="note" id="sum-material">Materiał: —</div>
                <div class="note" id="sum-laminate">Laminat: —</div>
                <div class="note" id="sum-leadtime">Wysyłka do —</div>
              </div>
              <div class="sum-cta">
                <button id="stb-add-modal" class="btn btn-primary" type="button">Dodaj do koszyka</button>
              </div>
            </div>

          </div><!-- /preview-panel -->
        </div>
      </div>

    </div>
  </div>
</div>

<!-- ===== Modal ===== -->
<div id="stb-modal" class="stb-modal" aria-hidden="true">
  <div class="stb-modal__backdrop" data-close></div>
  <div class="stb-modal__content" role="dialog" aria-modal="true" aria-label="Kreator naklejek">
    <button class="stb-modal__close btn" type="button" id="stb-close-modal" aria-label="Zamknij">✕</button>
    <!-- tutaj wpinamy .designer -->
  </div>
</div>

<!-- Ukryte pola dla Woo -->
<input type="hidden" name="<?php echo esc_attr(WC_Sticker_Builder::FIELD); ?>">
<input type="hidden" name="stb_go_cart" value="0">

<!-- Mały skrypt do pokazywania/ukrywania komunikatu DIECUT i sekcji ustawień -->
<script>
document.addEventListener('DOMContentLoaded', function(){
  const grid = document.getElementById('stb-shapes');
  const dieMsg = document.getElementById('stb-diecut-msg');
  const dieRow = document.getElementById('row-diecut');
  function updateDiecutUI(){
    const btn = grid ? grid.querySelector('.shape-btn[aria-pressed="true"]') : null;
    const isDie = !!(btn && btn.getAttribute('data-shape') === 'diecut');
    if (dieMsg) dieMsg.style.display = isDie ? '' : 'none';
    if (dieRow) dieRow.style.display = isDie ? '' : 'none';
  }
  if (grid){
    grid.addEventListener('click', function(e){
      if (e.target.closest('.shape-btn')) setTimeout(updateDiecutUI, 0);
    });
  }
  updateDiecutUI();
});
</script>
