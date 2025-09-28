<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div id="stb-root">
    <div class="stb-wrap">
        <div class="stb-card stb-grid-page">
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

            <div class="price-col price-in-order">
                <div class="price-box">
                    <span class="label">Podsumowanie</span>
                    <p>Sprawdź cenę i otwórz kreator, aby dopracować projekt.</p>
                    <div class="total-val" id="stb-total">0,00 zł</div>
                    <div class="total-net" id="stb-total-net">Netto: 0,00 zł</div>
                </div>
                <div class="cta">
                    <button type="button" class="btn" id="stb-open-modal">Otwórz kreator</button>
                    <button type="button" class="btn btn-primary" id="stb-add">Dodaj do koszyka</button>
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
                                        <span class="shape-label">DIECUT</span>
                                    </button>
                                </div>
                            </div>
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
                                <div class="stb-inline">
                                    <label class="stb-inline" style="gap:6px;">
                                        <input type="checkbox" id="stb-outline-on" checked>
                                        <span>Obrys naklejki</span>
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Szerokość obrysu (mm)</span>
                                        <input type="number" id="stb-outline-mm" min="0" step="0.5" value="3">
                                    </label>
                                    <label class="stb-field stb-color-field">
                                        <span class="stb-lbl">Kolor obrysu</span>
                                        <div class="stb-color-input">
                                            <input type="color" id="stb-outline-color" value="#ff0000" data-default="#ff0000">
                                            <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-outline-color" aria-label="Resetuj kolor obrysu"><span aria-hidden="true">↺</span></button>
                                        </div>
                                    </label>
                                </div>
                                <label class="stb-field stb-color-field" style="margin-top:6px;">
                                    <span class="stb-lbl">Kolor tła</span>
                                    <div class="stb-color-input">
                                        <input type="color" id="stb-color" value="#ffffff" data-default="#ffffff">
                                        <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-color" aria-label="Resetuj kolor tła"><span aria-hidden="true">↺</span></button>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="acc__item" id="acc-image">
                        <button type="button" class="acc__head" aria-expanded="false">Grafika</button>
                        <div class="acc__body" hidden>
                            <div class="stb-row">
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
                            <div class="stb-row">
                                <label class="stb-field" style="flex:1 1 auto;">
                                    <span class="stb-lbl">Rodzaj folii</span>
                                    <select id="stb-material">
                                        <option value="Folia ekonomiczna">Folia ekonomiczna (monomeryczna)</option>
                                        <option value="Folia długowieczna">Folia długowieczna (polimerowa)</option>
                                    </select>
                                </label>
                                <label class="stb-inline" style="margin-top:6px; gap:6px;">
                                    <input type="checkbox" id="stb-laminate">
                                    <span>Laminat ochronny</span>
                                </label>
                            </div>
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
                                <label class="stb-field stb-color-field">
                                    <span class="stb-lbl">Kolor tekstu</span>
                                    <div class="stb-color-input">
                                        <input type="color" id="stb-text-color" value="#111111" data-default="#111111">
                                        <button type="button" class="btn btn-icon color-reset" data-reset-color="stb-text-color" aria-label="Resetuj kolor tekstu"><span aria-hidden="true">↺</span></button>
                                    </div>
                                </label>
                                <div class="stb-text-toolbar" role="group" aria-label="Formatowanie tekstu">
                                    <button type="button" class="btn btn-icon" id="stb-text-bold" aria-pressed="false" title="Pogrubienie">
                                        <span class="icon-letter icon-letter-bold" aria-hidden="true">B</span>
                                    </button>
                                    <button type="button" class="btn btn-icon" id="stb-text-italic" aria-pressed="false" title="Pochylenie">
                                        <span class="icon-letter icon-letter-italic" aria-hidden="true">I</span>
                                    </button>
                                </div>
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
                                        <input type="url" id="stb-qr-url" placeholder="https://">
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
                        <button type="button" class="btn btn-icon" id="tb-pdf" title="Eksportuj do PDF" aria-label="Eksportuj do PDF">
                            <svg viewBox="0 0 24 24" class="stb-icon" aria-hidden="true" focusable="false">
                                <path d="M12 3v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                                <polyline points="8.5 11 12 14.5 15.5 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                <rect x="6" y="16" width="12" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/>
                            </svg>
                        </button>
                    </div>
                    <div class="canvas-box">
                        <canvas id="stb-canvas" width="520" height="520" aria-label="Podgląd naklejki"></canvas>
                    </div>
                    <div class="stb-mini-summary">
                        <div class="sum-left">
                            <div class="sum-section">
                                <button type="button" class="sum-link" id="sum-dims">Wymiary: <strong>10 &times; 10 cm</strong></button>
                                <div id="sum-edit-size" class="sum-edit is-hidden">
                                    <div class="stb-inline">
                                        <label class="stb-field">
                                            <span class="stb-lbl">Szerokość (cm)</span>
                                            <input type="number" id="sum-w" min="1" step="0.1" value="10">
                                        </label>
                                        <label class="stb-field">
                                            <span class="stb-lbl">Wysokość (cm)</span>
                                            <input type="number" id="sum-h" min="1" step="0.1" value="10">
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="sum-section">
                                <button type="button" class="sum-link" id="sum-qty">Nakład: <strong>100 szt.</strong></button>
                                <div id="sum-edit-qty" class="sum-edit is-hidden">
                                    <label class="stb-field">
                                        <span class="stb-lbl">Ilość (szt.)</span>
                                        <input type="number" id="sum-qty-inp" min="1" step="1" value="100">
                                    </label>
                                </div>
                            </div>
                            <div class="sum-meta">
                                <span id="sum-shape">Kształt: Prostokąt</span>
                                <span id="sum-material">Materiał: Folia ekonomiczna</span>
                                <span id="sum-laminate">Laminat: nie</span>
                                <span id="sum-leadtime">Wysyłka: wkrótce</span>
                            </div>
                        </div>
                        <div class="sum-right">
                            <div class="sum-total" id="sum-total">0,00 zł</div>
                            <div class="sum-net" id="sum-net">Netto: 0,00 zł</div>
                        </div>
                        <div class="sum-cta">
                            <button type="button" class="btn btn-primary" id="stb-add-modal">Dodaj do koszyka</button>
                        </div>
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
    </div>
</div>
