<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div id="stb-root">
    <div class="stb-wrap">
        <div class="stb-card stb-grid-page">
            <div class="order-col">
                <header>
                    <h2>Konfigurator naklejek</h2>
                    <p>Wybierz parametry naklejki, a następnie otwórz kreator, aby dopracować grafikę.</p>
                </header>

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
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12l2 4v8l-2 4H6l-2-4V8z"></path></svg>
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
                                    <label class="stb-field">
                                        <span class="stb-lbl">Kolor obrysu</span>
                                        <input type="color" id="stb-outline-color" value="#ff0000">
                                    </label>
                                </div>
                                <label class="stb-field" style="margin-top:6px;">
                                    <span class="stb-lbl">Kolor tła</span>
                                    <input type="color" id="stb-color" value="#ffffff">
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
                                        <option value="Inter">Inter</option>
                                        <option value="Montserrat">Montserrat</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Lato">Lato</option>
                                        <option value="Poppins">Poppins</option>
                                        <option value="Open Sans">Open Sans</option>
                                    </select>
                                </label>
                                <label class="stb-field">
                                    <span class="stb-lbl">Kolor tekstu</span>
                                    <input type="color" id="stb-text-color" value="#111111">
                                </label>
                                <div class="stb-inline">
                                    <button type="button" class="btn" id="stb-text-clear">Wyczyść</button>
                                    <button type="button" class="btn" id="stb-text-center">Wyśrodkuj</button>
                                    <button type="button" class="btn" id="stb-text-reset">Resetuj skalę</button>
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
                                        <input type="color" id="stb-qr-dark" value="#111111">
                                    </label>
                                    <label class="stb-field">
                                        <span class="stb-lbl">Kolor tła</span>
                                        <input type="color" id="stb-qr-light" value="#ffffff">
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
                                    <span class="stb-lbl">Obrys kodu QR</span>
                                    <div class="stb-inline">
                                        <label class="stb-inline" style="gap:6px;">
                                            <input type="checkbox" id="stb-qr-outline-on">
                                            <span>Dodaj obrys</span>
                                        </label>
                                        <label class="stb-field">
                                            <span class="stb-lbl">Kolor</span>
                                            <input type="color" id="stb-qr-outline-color" value="#111111">
                                        </label>
                                        <label class="stb-field">
                                            <span class="stb-lbl">Szerokość (%)</span>
                                            <input type="number" id="stb-qr-outline-width" min="0" max="50" step="1" value="2">
                                        </label>
                                        <label class="stb-field">
                                            <span class="stb-lbl">Promień narożników (%)</span>
                                            <input type="number" id="stb-qr-outline-radius" min="0" max="50" step="1" value="0">
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
                            <span aria-hidden="true">−</span>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-zoom-in" title="Przybliż" aria-label="Przybliż">
                            <span aria-hidden="true">+</span>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-fit" title="Wycentruj i dopasuj" aria-label="Wycentruj i dopasuj">
                            <span aria-hidden="true">⤢</span>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-rot--" title="Obróć w lewo" aria-label="Obróć w lewo">
                            <span aria-hidden="true">⟲</span>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-rot-+" title="Obróć w prawo" aria-label="Obróć w prawo">
                            <span aria-hidden="true">⟳</span>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-grid" title="Pokaż/ukryj siatkę" aria-label="Pokaż lub ukryj siatkę">
                            <span aria-hidden="true">⧉</span>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-delete" title="Usuń element" aria-label="Usuń element">
                            <span aria-hidden="true">🗑</span>
                        </button>
                        <button type="button" class="btn btn-icon" id="tb-pdf" title="Eksportuj do PDF" aria-label="Eksportuj do PDF">
                            <span aria-hidden="true">⤓</span>
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
