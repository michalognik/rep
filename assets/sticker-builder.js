(function(){
  document.addEventListener('DOMContentLoaded', function(){
    "use strict";

    /* ===== Konfiguracja/zgodność ===== */
    const DEFAULT_CURRENCY = { code:'PLN', rate:1, symbol:'zł', position:'right', locale:'pl-PL' };

    function parseRateValue(rawRate){
      if (rawRate == null) return null;
      if (typeof rawRate === 'number' && Number.isFinite(rawRate) && rawRate > 0){
        return rawRate;
      }
      if (typeof rawRate === 'string'){
        const normalized = rawRate.replace(',', '.').trim();
        if (!normalized) return null;
        const parsed = parseFloat(normalized);
        if (Number.isFinite(parsed) && parsed > 0){
          return parsed;
        }
      }
      return null;
    }

    function mergeCurrency(base, patch){
      if (!patch || typeof patch !== 'object') return base;
      const out = { ...base };
      if (typeof patch.code === 'string' && patch.code){ out.code = patch.code.toUpperCase(); }
      if (typeof patch.currency === 'string' && patch.currency){ out.code = patch.currency.toUpperCase(); }
      if (typeof patch.symbol === 'string' && patch.symbol){ out.symbol = patch.symbol; }
      if (typeof patch.currency_symbol === 'string' && patch.currency_symbol){ out.symbol = patch.currency_symbol; }
      if (typeof patch.symbol_left === 'string' && patch.symbol_left){ out.symbol = patch.symbol_left; out.position = 'left'; }
      if (typeof patch.symbol_right === 'string' && patch.symbol_right){ out.symbol = patch.symbol_right; out.position = 'right'; }
      if (typeof patch.position === 'string' && patch.position){ out.position = patch.position; }
      if (typeof patch.currency_pos === 'string' && patch.currency_pos){ out.position = patch.currency_pos; }
      if (typeof patch.locale === 'string' && patch.locale){ out.locale = patch.locale; }
      if (typeof patch.lang === 'string' && patch.lang){ out.locale = patch.lang; }
      const rate = parseRateValue(patch.rate != null ? patch.rate : patch.multiplier != null ? patch.multiplier : patch.currency_rate);
      if (rate) out.rate = rate;
      return out;
    }

    function pickWoocsCurrency(){
      const win = window;
      const woocs = win.WOOCS || win.woocs_params || {};
      const result = {};

      const code = [
        win.WOOCS_CURRENT_CURRENCY,
        win.woocs_current_currency,
        woocs.current_currency,
        woocs.currency,
        woocs.currency_code,
        woocs.default_currency
      ].find(val => typeof val === 'string' && val.trim().length);
      if (code){ result.code = code.trim().toUpperCase(); }

      const symbol = [
        win.WOOCS_CURRENT_SYMBOL,
        win.woocs_current_currency_symbol,
        woocs.currency_symbol,
        woocs.symbol,
        woocs.symbol_left,
        woocs.symbol_right
      ].find(val => typeof val === 'string' && val.trim().length);
      if (symbol){ result.symbol = symbol; }

      const position = [
        win.WOOCS_CURRENT_POSITION,
        win.woocs_current_currency_position,
        woocs.currency_pos,
        woocs.position
      ].find(val => typeof val === 'string' && val.trim().length);
      if (position){ result.position = position; }

      const locale = [ woocs.locale, woocs.lang, woocs.language ].find(val => typeof val === 'string' && val.trim().length);
      if (locale){ result.locale = locale; }

      let rate = parseRateValue(
        win.woocs_current_currency_rate != null ? win.woocs_current_currency_rate :
        win.WOOCS_CURRENT_RATE != null ? win.WOOCS_CURRENT_RATE :
        win.WOOCS_RATE
      );

      const codeForRate = result.code;
      const rateMaps = [
        win.woocs_currency_rates,
        win.WOOCS_RATES,
        woocs.currency_rates,
        woocs.rates,
        (document.body && document.body.dataset ? document.body.dataset : null)
      ];

      if (!rate && codeForRate){
        for (const map of rateMaps){
          if (!map) continue;
          let fromMap = map[codeForRate];
          if (fromMap == null && typeof codeForRate === 'string'){
            const lower = codeForRate.toLowerCase();
            const upper = codeForRate.toUpperCase();
            if (lower !== codeForRate){ fromMap = map[lower]; }
            if (fromMap == null && upper !== codeForRate){ fromMap = map[upper]; }
          }
          const parsed = parseRateValue(fromMap);
          if (parsed){ rate = parsed; break; }
        }
      }

      if (rate){ result.rate = rate; }

      if (!result.symbol && woocs.currencies && codeForRate && typeof woocs.currencies === 'object'){
        const curr = woocs.currencies[codeForRate];
        if (curr){
          if (curr.symbol){ result.symbol = curr.symbol; }
          if (curr.symbol_left){ result.symbol = curr.symbol_left; result.position = 'left'; }
          if (curr.symbol_right){ result.symbol = curr.symbol_right; result.position = 'right'; }
          if (!result.position && typeof curr.position === 'string' && curr.position){ result.position = curr.position; }
          if (!rate && curr.rate != null){
            const fromCurr = parseRateValue(curr.rate);
            if (fromCurr){ rate = fromCurr; result.rate = rate; }
          }
        }
      }

      return result;
    }

    function currentCurrency(){
      let curr = { ...DEFAULT_CURRENCY };
      curr = mergeCurrency(curr, window.STB_CURR || null);
      const woocsCurr = pickWoocsCurrency();
      curr = mergeCurrency(curr, woocsCurr);
      return curr;
    }
    const FIELD = 'stb_payload';
    const CART_URL = (window.STB_CART_URL || '');
    const uploadConfig = window.STB_UPLOAD || {};
    const parsedUploadLimit = Number(uploadConfig.max_upload_bytes);
    const MAX_UPLOAD_BYTES = (Number.isFinite(parsedUploadLimit) && parsedUploadLimit > 0) ? parsedUploadLimit : (25 * 1024 * 1024);
    const allowedMimeList = Array.isArray(uploadConfig.allowed_mimes) ? uploadConfig.allowed_mimes : [];
    const allowedExtList = Array.isArray(uploadConfig.allowed_exts) ? uploadConfig.allowed_exts : [];
    const disallowedExtList = Array.isArray(uploadConfig.disallowed_exts) ? uploadConfig.disallowed_exts : [];
    const allowedMimeSet = new Set(allowedMimeList.map(val => String(val || '').toLowerCase()).filter(Boolean));
    const allowedExtSet = new Set(allowedExtList.map(val => String(val || '').toLowerCase()).filter(Boolean));
    if (!allowedMimeSet.size){
      allowedMimeSet.add('image/jpeg');
      allowedMimeSet.add('image/png');
      allowedMimeSet.add('application/pdf');
      allowedMimeSet.add('image/pjpeg');
    } else {
      allowedMimeSet.add('image/pjpeg');
    }
    if (!allowedExtSet.size){
      ['jpg','jpeg','jpe','png','pdf'].forEach(ext => allowedExtSet.add(ext));
    }
    const disallowedExtSet = new Set(disallowedExtList.map(val => String(val || '').toLowerCase()).filter(Boolean));
    if (!disallowedExtSet.size){
      ['svg','svgz','zip','rar','7z','php','phtml','phar','js','cgi','pl','asp','aspx'].forEach(ext => disallowedExtSet.add(ext));
    }

    const PDFLib = window.PDFLib || null;         // eksport PDF
    const QRCodeLib = window.QRCode || null;      // davidshimjs

    /* ===== Shortcuts ===== */
    const $  = (sel, root=document) => root.querySelector(sel);
    const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
    const byId = (id)=> document.getElementById(id);
    const stbRoot = byId('stb-root');

    /* ===== Canvas (retina) ===== */
    const canvas = byId('stb-canvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = canvas.width, cssH = canvas.height;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    ctx.scale(dpr, dpr);

    /* ===== UI referencje ===== */
    // Kształt / obrys / tło
    const shapeGrid   = byId('stb-shapes');
    const ellipseRow  = byId('row-ellipse');
    const ellipseEl   = byId('stb-ellipse');
    const ellipseVal  = byId('stb-ellipse-val');
    const outOnEl     = byId('stb-outline-on');
    const outMMEl     = byId('stb-outline-mm');
    const outColorEl  = byId('stb-outline-color');
    const colorEl     = byId('stb-color');
    const cornerEl    = byId('stb-corner');

    // Usuń stary kontener DIECUT (obrys po alfa PNG) – zostawiamy tylko sekcję „obrys i tło”
    (function removeLegacyDiecutBox(){
      const root = document.getElementById('stb-root') || document;
      if (!root) return;

      const titleMatcher = /die[\s-]*cut\s*\(obrys po alfa png\)/i;
      const hintMatcher  = /trybie\s+die[\s-]*cut\s+akceptujemy\s+tylko\s+png/i;

      function collectLegacyNodes(){
        const nodes = new Set();
        root.querySelectorAll('*').forEach(el => {
          if (!el || el.children?.length > 150) return;
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (!text) return;
          if (!titleMatcher.test(text) && !hintMatcher.test(text)) return;
          const removable = el.closest(
            '.stb-row, .acc__item, .stb-section, .stb-box, .stb-field, fieldset, .elementor-widget'
          ) || el;
          if (!removable || removable.dataset?.stbLegacyDiecutRemoved === '1') return;
          nodes.add(removable);
        });
        return nodes;
      }

      function purge(){
        const nodes = collectLegacyNodes();
        if (!nodes || !nodes.size) return;
        nodes.forEach(node => {
          node.dataset.stbLegacyDiecutRemoved = '1';
          node.remove();
        });
      }

      purge();

      // Na stronach z builderem HTML potrafi być przepisywany dynamicznie (np. Elementor)
      // — dla pewności obserwujemy zmiany DOM i reagujemy tylko raz na znalezione elementy.
      const observer = new MutationObserver(() => {
        const nodes = collectLegacyNodes();
        if (!nodes || !nodes.size) return;
        nodes.forEach(node => node.remove());
      });

      observer.observe(root, { childList:true, subtree:true });

      // Odłącz observer, gdy builder zostanie usunięty z DOM (np. zmiana widoku SPA).
      const stop = () => observer.disconnect();
      window.addEventListener('beforeunload', stop, { once:true });
    })();

    // Grafika
    const imgEl    = byId('stb-image');
    const upBtn    = byId('stb-upload');
    const delBtn   = byId('stb-img-clear');
    const fName    = byId('stb-fname');
    const fMeta    = byId('stb-fmeta');
    const uploadRow= byId('stb-upload-row');
    const diecutSlot = byId('stb-diecut-slot');
    const accImageItem = byId('acc-image');
    let uploadPlaceholder = null;
    if (uploadRow){
      uploadPlaceholder = document.createElement('div');
      uploadPlaceholder.id = 'stb-upload-placeholder';
      uploadPlaceholder.style.display = 'none';
      uploadRow.parentNode.insertBefore(uploadPlaceholder, uploadRow.nextSibling);
    }

    // Materiał
    const materialEl = byId('stb-material');
    const materialGridEl = byId('stb-material-grid');
    const laminateEl = byId('stb-laminate');
    const finishEl = byId('stb-finish');
    const extraMaterialSel = byId('stb-extra-material');
    const extraMaterialGridEl = byId('stb-extra-material-grid');
    const extraLaminateEl = byId('stb-extra-laminate');
    const expressEl = byId('stb-extra-express');
    const extraShapeSel = byId('stb-extra-shape');
    const extraFinishSel = byId('stb-extra-finish');
    const extraSummaryWrap = byId('stb-extra-summary');

    // Rozmiary / ilość / cena
    const sizeList = byId('sizeList');
    const sizeCustomToggle = byId('sizeCustomToggle');
    const sizeCustom = byId('sizeCustom');
    let   wEl = byId('stb-w');
    let   hEl = byId('stb-h');

    const qtyList = byId('qtyList');
    const qtyCustomToggle = byId('qtyCustomToggle');
    const qtyCustom = byId('qtyCustom');
    const qtyEl  = byId('stb-qty');
    const qtyCustomSave = byId('qtyCustomSave');

    const totalOutEls     = $$('[data-stb-total]');
    const totalNetOutEls  = $$('[data-stb-total-net]');
    const totalVatOutEls  = $$('[data-stb-total-vat]');
    const totalUnitOutEls = $$('[data-stb-total-unit]');
    const totalSaveOutEls = $$('[data-stb-total-save]');
    const addBtn      = byId('stb-add');

    const step1       = byId('stb-step-1');
    const step2       = byId('stb-step-2');
    const step3       = byId('stb-step-3');
    const step1Next   = byId('stb-step1-next');
    const step2Back   = byId('stb-step2-back');
    const step2Next   = byId('stb-step2-next');
    const step3Back   = byId('stb-step3-back');
    const uploadTrigger = byId('stb-upload-trigger');
    const uploadSummary = byId('stb-upload-summary');

    const uploadLockEls = [imgEl, upBtn, delBtn, addBtn, step3Back].filter(Boolean);
    let activeUploadXhr = null;

    function setUploadBusy(busy){
      uploadLockEls.forEach(el => {
        if (!el) return;
        if ('disabled' in el){
          if (busy){
            el.dataset.stbWasDisabled = el.disabled ? '1' : '0';
            el.disabled = true;
          } else {
            if (el.dataset.stbWasDisabled === '1'){
              el.disabled = true;
            } else {
              el.disabled = false;
            }
            delete el.dataset.stbWasDisabled;
          }
        }
        if (el.classList){
          if (busy){ el.classList.add('is-loading'); } else { el.classList.remove('is-loading'); }
        }
      });
      if (uploadTrigger){
        if (busy){
          uploadTrigger.classList.add('is-disabled');
          uploadTrigger.setAttribute('aria-disabled', 'true');
        } else {
          uploadTrigger.classList.remove('is-disabled');
          uploadTrigger.removeAttribute('aria-disabled');
        }
      }
    }

    function abortActiveUpload(options={}){
      if (activeUploadXhr){
        if (options.silent){ activeUploadXhr.__stbSilentAbort = true; }
        try { activeUploadXhr.abort(); } catch(err){}
      }
    }

    function uploadMessage(msg){
      if (!uploadSummary) return;
      if (typeof msg === 'string'){ uploadSummary.textContent = msg; }
    }

    function uploadFileToServer(file){
      if (!uploadConfig || !uploadConfig.ajax_url){
        uploadMessage('Brak konfiguracji przesyłania plików.');
        return Promise.resolve(null);
      }

      abortActiveUpload({ silent:true });

      return new Promise((resolve)=>{
        const xhr = new XMLHttpRequest();
        activeUploadXhr = xhr;
        xhr.open('POST', String(uploadConfig.ajax_url), true);
        xhr.responseType = 'json';
        xhr.timeout = 5 * 60 * 1000; // 5 minut

        const finalize = (result) => {
          if (activeUploadXhr === xhr){ activeUploadXhr = null; }
          setUploadBusy(false);
          resolve(result);
        };

        xhr.upload.onprogress = (ev)=>{
          if (!uploadSummary) return;
          if (ev && ev.lengthComputable){
            const pct = Math.round((ev.loaded / Math.max(1, ev.total)) * 100);
            uploadSummary.textContent = `Wysyłanie pliku… ${pct}%`;
          } else {
            uploadSummary.textContent = 'Wysyłanie pliku…';
          }
        };

        const handleError = (message, silent=false)=>{
          if (!silent){
            uploadMessage(message || 'Nie udało się przesłać pliku.');
          }
          finalize(null);
        };

        xhr.onload = ()=>{
          let response = xhr.response;
          if (!response && xhr.responseText){
            try { response = JSON.parse(xhr.responseText); } catch(err){}
          }

          if (xhr.status >= 200 && xhr.status < 300 && response && response.success && response.data){
            const data = response.data || {};
            finalize({
              uploadId: Number.isFinite(Number(data.id)) ? Number(data.id) : 0,
              url: typeof data.url === 'string' ? data.url : '',
              size: Number.isFinite(Number(data.size)) ? Number(data.size) : (file?.size || 0),
              type: typeof data.type === 'string' ? data.type : (file?.type || ''),
              name: typeof data.name === 'string' ? data.name : (file?.name || ''),
            });
            return;
          }

          const silent = !!xhr.__stbSilentAbort;
          const message = response?.data?.message || response?.message || (xhr.status === 413 ? 'Plik jest zbyt duży.' : null);
          handleError(message || 'Nie udało się przesłać pliku.', silent);
        };

        xhr.onerror = ()=>{
          const silent = !!xhr.__stbSilentAbort;
          handleError('Błąd połączenia podczas przesyłania pliku.', silent);
        };

        xhr.onabort = ()=>{
          const silent = !!xhr.__stbSilentAbort;
          handleError(silent ? '' : 'Przesyłanie pliku przerwane.', silent);
        };

        xhr.ontimeout = ()=>{
          handleError('Limit czasu przesyłania pliku został przekroczony.');
        };

        const formData = new FormData();
        formData.append('action', 'stb_upload_file');
        if (uploadConfig.nonce){ formData.append('nonce', uploadConfig.nonce); }
        formData.append('stb_file', file, file?.name || 'upload');

        setUploadBusy(true);
        uploadMessage('Rozpoczynam przesyłanie pliku…');
        xhr.send(formData);
      });
    }

    const hasSvgElement = typeof SVGElement !== 'undefined';

    function enforceStepButtonInk(){
      const scope = stbRoot || document;
      const buttons = scope.querySelectorAll('.btn-step');
      buttons.forEach(btn => {
        if (!(btn instanceof HTMLElement)) return;
        btn.style.setProperty('color', '#fff', 'important');
        btn.style.setProperty('-webkit-text-fill-color', '#fff', 'important');
        btn.querySelectorAll('*').forEach(node => {
          if (!(node instanceof Element)) return;
          node.style.setProperty('color', '#fff', 'important');
          node.style.setProperty('-webkit-text-fill-color', '#fff', 'important');
          if (hasSvgElement && node instanceof SVGElement){
            node.style.setProperty('stroke', 'currentColor');
          }
        });
      });
    }

    enforceStepButtonInk();
    const btnInkObserver = new MutationObserver(enforceStepButtonInk);
    if (stbRoot){
      btnInkObserver.observe(stbRoot, { childList:true, subtree:true, characterData:true });
    } else {
      btnInkObserver.observe(document.body || document.documentElement || document, { childList:true, subtree:true, characterData:true });
    }
    window.addEventListener('beforeunload', () => btnInkObserver.disconnect(), { once:true });
    ['languagechange','gtranslate_language_changed','gt_language_changed'].forEach(evt => {
      window.addEventListener(evt, enforceStepButtonInk);
      document.addEventListener(evt, enforceStepButtonInk);
    });

    // Toolbar
    const tbZoomOut = byId('tb-zoom-out');
    const tbZoomIn  = byId('tb-zoom-in');
    const tbFit     = byId('tb-fit');
    const tbRotMinus= byId('tb-rot--');
    const tbRotPlus = byId('tb-rot-+');
    const tbGrid    = byId('tb-grid');
    const tbDelete  = byId('tb-delete');
    const tbPDF     = byId('tb-pdf');

    // Pasek postępu PDF
    let pdfProgWrap = null, pdfProgBar = null, pdfProgPct = null;
    function ensurePdfProgressUI(){
      if (!tbPDF || pdfProgWrap) return;
      pdfProgWrap = document.createElement('div');
      pdfProgWrap.className = 'stb-pdf-progress';
      pdfProgWrap.style.display = 'none';

      const track = document.createElement('div');
      track.className = 'track';
      const bar = document.createElement('div');
      bar.className = 'bar';
      track.appendChild(bar);

      const pct = document.createElement('span');
      pct.className = 'pct';
      pct.textContent = '0%';

      tbPDF.parentNode.insertBefore(pdfProgWrap, tbPDF.nextSibling);
      pdfProgWrap.appendChild(track);
      pdfProgWrap.appendChild(pct);

      pdfProgBar = bar; pdfProgPct = pct;
    }
    function showPdfProgress(show){ ensurePdfProgressUI(); if (pdfProgWrap) pdfProgWrap.style.display = show ? 'inline-flex' : 'none'; }
    function setPdfProgress(p){ ensurePdfProgressUI(); const v = Math.max(0, Math.min(100, Math.round(p))); if (pdfProgBar) pdfProgBar.style.width = v + '%'; if (pdfProgPct) pdfProgPct.textContent = v + '%'; }

    // Mini summary
    const sumDims = byId('sum-dims');
    const sumQty  = byId('sum-qty');
    const sumTotal= byId('sum-total');
    const sumNet  = byId('sum-net');

    const sumSizeBox = byId('sum-edit-size');
    const sumW = byId('sum-w');
    const sumH = byId('sum-h');
    const sumQtyBox = byId('sum-edit-qty');
    const sumQtyInp = byId('sum-qty-inp');

    // Rozszerzone podsumowanie
    const sumShapeEl    = byId('sum-shape');
    const sumMaterialEl = byId('sum-material');
    const sumFinishEl   = byId('sum-finish');
    const sumLaminateEl = byId('sum-laminate');
    const sumExpressEl  = byId('sum-express');
    const sumLeadtimeEl = byId('sum-leadtime');

    const EXPRESS_MULTIPLIER = 1.15;

    /* ===== Kroki ===== */
    const steps = [step1, step2, step3].filter(Boolean);
    let currentStep = steps.length ? 1 : 0;

    function showStep(stepNumber){
      if (!steps.length) return;
      const max = steps.length;
      const targetStep = Math.min(Math.max(stepNumber, 1), max);
      currentStep = targetStep;
      steps.forEach((step, idx) => {
        if (!step) return;
        const isCurrent = (idx + 1) === targetStep;
        step.classList.toggle('is-active', isCurrent);
        step.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
      });
    }

    function focusFirstInteractive(stepEl){
      if (!stepEl) return;
      const focusable = stepEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable){ focusable.focus({ preventScroll:true }); }
    }

    if (step1Next && step2){
      step1Next.addEventListener('click', ()=>{
        updatePriceAndJSON();
        showStep(2);
        if (typeof step2.scrollIntoView === 'function'){
          step2.scrollIntoView({ behavior:'smooth', block:'start' });
        }
        window.requestAnimationFrame(()=> focusFirstInteractive(step2));
      });
    }

    if (step2Back && step1){
      step2Back.addEventListener('click', ()=>{
        showStep(1);
        if (typeof step1.scrollIntoView === 'function'){
          step1.scrollIntoView({ behavior:'smooth', block:'start' });
        }
        window.requestAnimationFrame(()=> focusFirstInteractive(step1));
      });
    }

    if (step2Next && step3){
      step2Next.addEventListener('click', ()=>{
        updatePriceAndJSON();
        showStep(3);
        if (typeof step3.scrollIntoView === 'function'){
          step3.scrollIntoView({ behavior:'smooth', block:'start' });
        }
        window.requestAnimationFrame(()=> focusFirstInteractive(step3));
      });
    }

    if (step3Back && step2){
      step3Back.addEventListener('click', ()=>{
        showStep(2);
        if (typeof step2.scrollIntoView === 'function'){
          step2.scrollIntoView({ behavior:'smooth', block:'start' });
        }
        window.requestAnimationFrame(()=> focusFirstInteractive(step2));
      });
    }

    if (uploadTrigger && upBtn){
      uploadTrigger.addEventListener('click', (ev)=>{
        ev.preventDefault();
        upBtn.click();
      });
    }

    showStep(currentStep || 1);

    // Tekst
    const textInput     = byId('stb-text-input');
    const textFontSel   = byId('stb-text-font');
    const textColorEl   = byId('stb-text-color');
    const textBoldBtn   = byId('stb-text-bold');
    const textItalicBtn = byId('stb-text-italic');
    const textSizeInput = byId('stb-text-size');
    const textSizeVal   = byId('stb-text-size-val');

    // QR — proste UI
    const qrRemBtn  = byId('stb-qr-remove-btn');
    const qrTypeSel = byId('stb-qr-type');   // url | wifi
    const qrDark    = byId('stb-qr-dark');
    const qrLight   = byId('stb-qr-light');
    const qrECC     = byId('stb-qr-ecc');
    const qrQuiet   = byId('stb-qr-quiet');
    const qrFramePad    = byId('stb-qr-frame-pad');
    const qrFramePadVal = byId('stb-qr-frame-pad-val');
    const qrFrameRadius    = byId('stb-qr-frame-radius');
    const qrFrameRadiusVal = byId('stb-qr-frame-radius-val');

    // Dane QR
    const qrURL       = byId('stb-qr-url');
    const qrWifiSSID  = byId('stb-qr-wifi-ssid');
    const qrWifiPass  = byId('stb-qr-wifi-pass');
    const qrWifiAuth  = byId('stb-qr-wifi-auth');
    const qrWifiHidden= byId('stb-qr-wifi-hidden');

    /* ===== Stan ===== */
    const parseNum = (elOrVal, def) => { const v=(typeof elOrVal==='number')?elOrVal:parseFloat(elOrVal?.value); return (isFinite(v)&&v>0)?v:def; };
    let uploaded = { name:null, type:null, size:0, dataURL:null, img:null, pdf:null, uploadId:null, url:null, uploadBytes:0 };
    let transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 }; // GRAFIKA
    let cornerFactor = 0.04; // 4%
    let gridOn = false;

    // shapes: rect|circle|ellipse|triangle|octagon|diecut
    let shape='rect', ellipseRatio=1.0;
    const defaultShapeValue = shape;
    const defaultLaminateValue = !!(laminateEl && laminateEl.checked);
    const defaultExpressValue = !!(expressEl && expressEl.checked);
    let defaultMaterialValue = materialEl ? (materialEl.value || '') : '';
    const currentFinishValue = ()=>{
      if (finishEl && typeof finishEl.value === 'string' && finishEl.value !== ''){ return finishEl.value; }
      if (extraFinishSel && typeof extraFinishSel.value === 'string' && extraFinishSel.value !== ''){ return extraFinishSel.value; }
      return 'gloss';
    };
    const finishLabel = (value)=>{
      const val = (typeof value === 'string' && value) ? value : currentFinishValue();
      const source = finishEl || extraFinishSel;
      if (source && source.options){
        const opts = Array.from(source.options);
        const match = opts.find(opt => opt && opt.value === val);
        if (match && typeof match.textContent === 'string'){ return match.textContent.trim(); }
      }
      if (val === 'mat') return 'Mat';
      if (val === 'gloss') return 'Połysk';
      return val || '—';
    };
    const defaultFinishValue = currentFinishValue();

    const defaultTextObj = ()=>({
      text:'',
      font:(textFontSel?.value||'Inter'),
      color:(textColorEl?.value||'#111111'),
      weight:'normal',
      italic:false,
      scale:1,
      rotDeg:0,
      offsetX:0,
      offsetY:0
    });

    let textObj = defaultTextObj();

    function textSizeBounds(){
      if (!textSizeInput) return { min:0.4, max:4 };
      const min = parseFloat(textSizeInput.min);
      const max = parseFloat(textSizeInput.max);
      return {
        min: Number.isFinite(min) ? min : 0.4,
        max: Number.isFinite(max) ? max : 4
      };
    }
    function clampTextScale(val){
      const num = parseFloat(val);
      if (!Number.isFinite(num)) return 1;
      return Math.max(0.1, Math.min(6, num));
    }
    function updateTextSizeUI(){
      if (!textSizeInput) return;
      const bounds = textSizeBounds();
      const current = clampTextScale(textObj?.scale ?? 1);
      const sliderVal = Math.max(bounds.min, Math.min(bounds.max, current));
      textSizeInput.value = (Math.round(sliderVal * 100) / 100).toString();
      if (textSizeVal){
        textSizeVal.textContent = Math.round(current * 100) + '%';
      }
    }

    // QR (davidshimjs) – generujemy offscreen canvas
    let qrObj = {
      enabled:false, dark:'#111111', light:'#ffffff', ecc:'M',
      quiet:4, scale:1, rotDeg:0, offsetX:0, offsetY:0,
      framePadPct:12, frameRadiusPct:8,
      canvas:null
    };

    let lastToolTarget = 'image';
    let qrLibMissingWarned = false;

    const hasText = ()=> !!(textObj.text && textObj.text.trim().length);
    const TEXT_FONT_FALLBACK = ", system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    const textFontString = (px)=>{
      const size = Math.max(6, px).toFixed(0);
      const italic = textObj.italic ? 'italic ' : '';
      const weight = (textObj.weight === 'bold') ? '700 ' : '400 ';
      return `${italic}${weight}${size}px ${quoteFont(textObj.font || 'Inter')}${TEXT_FONT_FALLBACK}`;
    };

    /* ===== HUD dla uchwytów skali/rotacji ===== */
    const canvasBox = canvas ? (canvas.closest('.canvas-box') || canvas.parentElement) : null;
    const handleState = {
      layer:null,
      panel:null,
      btnZoomOut:null,
      btnZoomIn:null,
      btnRotLeft:null,
      btnRotRight:null
    };

    function ensureHandleUI(){
      if (!canvasBox || handleState.layer) return;
      const layer = document.createElement('div');
      layer.className = 'stb-handle-layer';
      const panel = document.createElement('div');
      panel.className = 'stb-handle-panel';
      panel.style.display = 'none';

      const pad = document.createElement('div');
      pad.className = 'stb-handle-pad';

      const zoomOutBtn = document.createElement('button');
      zoomOutBtn.type = 'button';
      zoomOutBtn.className = 'stb-handle-btn stb-handle-btn--zoom-out';
      zoomOutBtn.setAttribute('aria-label', 'Pomniejsz element');
      zoomOutBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

      const zoomInBtn = document.createElement('button');
      zoomInBtn.type = 'button';
      zoomInBtn.className = 'stb-handle-btn stb-handle-btn--zoom-in';
      zoomInBtn.setAttribute('aria-label', 'Powiększ element');
      zoomInBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

      const rotLeftBtn = document.createElement('button');
      rotLeftBtn.type = 'button';
      rotLeftBtn.className = 'stb-handle-btn stb-handle-btn--rot-left';
      rotLeftBtn.setAttribute('aria-label', 'Obróć element w lewo');
      rotLeftBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8.8 6.5H5.5V3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5.5 11.5a6.5 6.5 0 1 1 1.9 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

      const rotRightBtn = document.createElement('button');
      rotRightBtn.type = 'button';
      rotRightBtn.className = 'stb-handle-btn stb-handle-btn--rot-right';
      rotRightBtn.setAttribute('aria-label', 'Obróć element w prawo');
      rotRightBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15.2 6.5h3.3V3.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M18.5 11.5a6.5 6.5 0 1 0-1.9 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

      pad.appendChild(zoomOutBtn);
      pad.appendChild(zoomInBtn);
      pad.appendChild(rotLeftBtn);
      pad.appendChild(rotRightBtn);

      panel.appendChild(pad);
      layer.appendChild(panel);
      canvasBox.appendChild(layer);

      handleState.layer = layer;
      handleState.panel = panel;
      handleState.btnZoomOut = zoomOutBtn;
      handleState.btnZoomIn = zoomInBtn;
      handleState.btnRotLeft = rotLeftBtn;
      handleState.btnRotRight = rotRightBtn;
    }

    ensureHandleUI();

    function defaultToolTarget(){
      if (uploaded.img) return 'image';
      if (hasText()) return 'text';
      if (qrObj.enabled) return 'qr';
      return 'image';
    }

    function setToolTarget(target){
      if (target === 'image' && uploaded.img){ lastToolTarget = 'image'; updateHandles(); return lastToolTarget; }
      if (target === 'text' && hasText()){ lastToolTarget = 'text'; updateHandles(); return lastToolTarget; }
      if (target === 'qr' && qrObj.enabled){ lastToolTarget = 'qr'; updateHandles(); return lastToolTarget; }
      lastToolTarget = defaultToolTarget();
      updateHandles();
      return lastToolTarget;
    }

    /* ===== Akordeony ===== */
    function initAccordions(){
      const container = $('.stb-controls.acc');
      $$('.stb-controls.acc .acc__item').forEach(item=>{
        const head = $('.acc__head', item);
        const body = $('.acc__body', item);
        if (!head || !body) return;

        if (head.getAttribute('aria-expanded') === 'true'){
          body.removeAttribute('hidden');
          item.classList.add('is-active');
        } else {
          body.setAttribute('hidden','');
          item.classList.remove('is-active');
        }

        head.addEventListener('click', ()=>{
          const isOpen = head.getAttribute('aria-expanded') === 'true';
          $$('.stb-controls.acc .acc__item').forEach(other=>{
            const h=$('.acc__head',other), b=$('.acc__body',other);
            if (!h || !b) return;
            if (other===item){ return; }
            h.setAttribute('aria-expanded','false');
            b.setAttribute('hidden','');
            other.classList.remove('is-active');
          });
          if (isOpen){
            head.setAttribute('aria-expanded','false');
            body.setAttribute('hidden','');
            item.classList.remove('is-active');
          } else {
            head.setAttribute('aria-expanded','true');
            body.removeAttribute('hidden');
            item.classList.add('is-active');
            if (container && typeof head.scrollIntoView === 'function'){
              head.scrollIntoView({ block:'nearest', inline:'nearest', behavior:'smooth' });
            }
          }
        });
      });
    }

    /* ===== Utils ===== */
    const escapeHtml = (value)=>{
      if (value == null) return '';
      return String(value).replace(/[&<>"']/g, (ch)=>{
        switch (ch){
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          default: return '&#039;';
        }
      });
    };

    const escapeAttr = (value)=>{
      if (value == null) return '';
      return String(value).replace(/[&<>"']/g, (ch)=>{
        switch (ch){
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          default: return '&#039;';
        }
      });
    };

    const decodeHtml = (()=>{
      const txt = document.createElement('textarea');
      return (value)=>{
        if (value == null) return '';
        txt.innerHTML = String(value);
        return txt.value;
      };
    })();

    const normalizeCurrencyPosition = (pos)=>{
      if (pos == null) return 'right';
      return String(pos).toLowerCase().replace(/\s+/g, '_').replace(/-+/g, '_');
    };

    function buildWooPrice(amountPln){
      const baseValue = Number(amountPln);
      const base = Number.isFinite(baseValue) ? baseValue : 0;
      const curr = currentCurrency();
      const rawRate = Number(curr.rate);
      const rate = (Number.isFinite(rawRate) && rawRate > 0) ? rawRate : 1;
      const converted = base * rate;
      const locale = curr.locale || 'pl-PL';
      let numberStr;
      try {
        numberStr = new Intl.NumberFormat(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(converted);
      } catch(err){
        numberStr = converted.toFixed(2);
      }

      const symbolRaw = decodeHtml(
        curr.symbol != null ? curr.symbol :
        curr.currency_symbol != null ? curr.currency_symbol :
        curr.symbol_left != null ? curr.symbol_left :
        curr.symbol_right != null ? curr.symbol_right :
        ''
      );
      const symbol = symbolRaw || (curr.code || 'PLN');
      const position = normalizeCurrencyPosition(curr.position || curr.currency_pos || 'right');
      const hasSpace = position.includes('space');
      const spacer = symbol ? (hasSpace ? '&nbsp;' : '') : '';
      const htmlSymbol = symbol ? `<span class="woocommerce-Price-currencySymbol">${escapeHtml(symbol)}</span>` : '';

      let body;
      const numberHtml = escapeHtml(numberStr);
      if (!htmlSymbol){
        body = `<bdi>${numberHtml}</bdi>`;
      } else if (position.startsWith('left')){
        body = `<bdi>${htmlSymbol}${spacer}${numberHtml}</bdi>`;
      } else if (position.startsWith('right')){
        body = `<bdi>${numberHtml}${spacer}${htmlSymbol}</bdi>`;
      } else {
        body = `<bdi>${htmlSymbol}${spacer}${numberHtml}</bdi>`;
      }

      const code = (curr.code || 'PLN').toUpperCase();
      const baseFixed = base.toFixed(6);
      const convertedFixed = converted.toFixed(6);
      const rateFixed = rate.toFixed(6);

      const attrs = [
        'class="woocommerce-Price-amount amount"',
        'data-woocs="price"',
        `data-price-base="${escapeAttr(baseFixed)}"`,
        `data-price-converted="${escapeAttr(convertedFixed)}"`,
        `data-woocs-currency="${escapeAttr(code)}"`,
        `data-woocs-symbol="${escapeAttr(symbol)}"`,
        `data-woocs-rate="${escapeAttr(rateFixed)}"`,
        `data-woocs-position="${escapeAttr(position)}"`
      ];

      const textValue = symbol
        ? (position.startsWith('left') ? `${symbol} ${numberStr}` : `${numberStr} ${symbol}`)
        : numberStr;

      return {
        html: `<span ${attrs.join(' ')}>${body}</span>`,
        text: textValue,
        base,
        baseFixed,
        converted,
        convertedFixed,
        rate,
        rateFixed,
        code,
        symbol,
        position
      };
    }

    function renderWooPrice(el, amountPln, options){
      if (!el) return;
      const opts = options || {};
      const baseValue = Number(amountPln);
      if (!Number.isFinite(baseValue)){
        clearWooPrice(el, opts.fallback || '');
        return;
      }
      const price = buildWooPrice(baseValue);
      let html = price.html;
      if (opts.prefix){
        html = `<span class="stb-price-prefix">${escapeHtml(opts.prefix)}</span> ${html}`;
      }
      if (opts.suffix){
        html = `${html} <span class="stb-price-suffix">${escapeHtml(opts.suffix)}</span>`;
      }
      el.innerHTML = html;
      el.dataset.priceBase = price.baseFixed;
      el.dataset.priceConverted = price.convertedFixed;
      el.dataset.woocsCurrency = price.code;
      el.dataset.woocsSymbol = price.symbol;
      el.dataset.woocsRate = price.rateFixed;
      el.dataset.woocsPosition = price.position;
    }

    function clearWooPrice(el, text){
      if (!el) return;
      el.textContent = text || '';
      delete el.dataset.priceBase;
      delete el.dataset.priceConverted;
      delete el.dataset.woocsCurrency;
      delete el.dataset.woocsSymbol;
      delete el.dataset.woocsRate;
      delete el.dataset.woocsPosition;
    }
    const prettyBytes = (b)=>{
      if (!isFinite(b) || b<=0) return '';
      const u=['B','KB','MB','GB']; let i=0;
      while(b>=1024 && i<u.length-1){ b/=1024; i++; }
      return (Math.round(b*10)/10)+' '+u[i];
    };
    const quoteFont = (f)=> (/\s/.test(f||'') ? ('"'+f+'"') : (f||''));
    const parseHexColor = (hex)=>{
      if (typeof hex !== 'string') return null;
      const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (!m) return null;
      let v = m[1];
      if (v.length === 3){ v = v.split('').map(ch=>ch+ch).join(''); }
      const num = parseInt(v, 16);
      return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
    };
    const relativeLuma = (rgb)=>{
      if (!rgb) return null;
      const toLin = (c)=>{ const n=c/255; return (n<=0.03928)?(n/12.92):Math.pow((n+0.055)/1.055, 2.4); };
      const r=toLin(rgb.r), g=toLin(rgb.g), b=toLin(rgb.b);
      return 0.2126*r + 0.7152*g + 0.0722*b;
    };
    const colorDistance = (a,b)=>{
      if (!a || !b) return Infinity;
      const dr=a.r-b.r, dg=a.g-b.g, db=a.b-b.b;
      return Math.sqrt(dr*dr + dg*dg + db*db);
    };
    const needsEdgeHighlight = (outlineColor, backgroundColor)=>{
      const o=parseHexColor(outlineColor); const bg=parseHexColor(backgroundColor);
      if (!o || !bg) return false;
      const lO=relativeLuma(o), lB=relativeLuma(bg);
      if (lO==null || lB==null) return false;
      const contrast = (Math.max(lO,lB)+0.05)/(Math.min(lO,lB)+0.05);
      if (contrast > 1.6) return false;
      return colorDistance(o,bg) < 80;
    };
    const shapeLabel = (s)=>({ rect:'Prostokąt', circle:'Koło', ellipse:'Elipsa', triangle:'Trójkąt', octagon:'Ośmiokąt', diecut:'Dowolny kształt (DIECUT)' }[s] || '—');

    /* ===== Geometria ===== */
    function polygonPath(c, points, radius){
      const n = points.length; if (n<2) return;
      const r = Math.max(0, radius||0);
      c.moveTo(points[n-1].x, points[n-1].y);
      for (let i=0; i<n; i++){
        const p1 = points[i];
        const p2 = points[(i+1)%n];
        c.arcTo(p1.x, p1.y, p2.x, p2.y, r);
      }
      c.closePath();
    }
    function getDrawRect(){
      const pad=16, maxW=cssW-pad*2, maxH=cssH-pad*2;
      const w_cm=parseNum(wEl,10), h_cm=parseNum(hEl,10);
      const ratio=w_cm/h_cm; let drawW, drawH;
      if (ratio>=1){ drawW=maxW; drawH=maxW/ratio; if(drawH>maxH){ drawH=maxH; drawW=maxH*ratio; } }
      else { drawH=maxH; drawW=maxH*ratio; if(drawW>maxW){ drawW=maxW; drawH=maxW/ratio; } }
      return { x:(cssW-drawW)/2, y:(cssH-drawH)/2, w:drawW, h:drawH };
    }
    function shapePath(){
      const r=getDrawRect();
      const rad = Math.max(0, Math.min(r.w,r.h) * cornerFactor);
      if (shape==='circle'){ const R=Math.min(r.w,r.h)/2; return ()=>{ ctx.arc(r.x+r.w/2, r.y+r.h/2, R, 0, Math.PI*2); }; }
      if (shape==='ellipse'){
        const rx = r.w/2; const ry = (r.h/2)*(ellipseRatio||1);
        return ()=>{ ctx.ellipse(r.x+r.w/2, r.y+r.h/2, rx, ry, 0, 0, Math.PI*2); };
      }
      if (shape==='triangle'){
        const p = [ {x:r.x+r.w/2,y:r.y}, {x:r.x+r.w,y:r.y+r.h}, {x:r.x,y:r.y+r.h} ];
        return ()=> polygonPath(ctx, p, rad);
      }
      if (shape==='octagon'){
        const o=Math.min(r.w,r.h)*0.2;
        const p=[ {x:r.x+o,y:r.y},{x:r.x+r.w-o,y:r.y},{x:r.x+r.w,y:r.y+o},{x:r.x+r.w,y:r.y+r.h-o},
                  {x:r.x+r.w-o,y:r.y+r.h},{x:r.x+o,y:r.y+r.h},{x:r.x,y:r.y+r.h-o},{x:r.x,y:r.y+o} ];
        return ()=> polygonPath(ctx, p, rad);
      }
      // DIECUT używa prostokątnego obszaru podglądu (rysujemy specjalnie w draw)
      return ()=> polygonPath(ctx, [ {x:r.x,y:r.y}, {x:r.x+r.w,y:r.y}, {x:r.x+r.w,y:r.y+r.h}, {x:r.x,y:r.y+r.h} ], rad);
    }
    function exportShapePath(targetCtx, rect){
      const rad = Math.max(0, Math.min(rect.w, rect.h) * cornerFactor);
      if (shape === 'circle'){
        targetCtx.beginPath();
        targetCtx.arc(rect.x + rect.w/2, rect.y + rect.h/2, Math.min(rect.w, rect.h)/2, 0, Math.PI*2);
        targetCtx.closePath();
        return;
      }
      if (shape === 'ellipse'){
        targetCtx.beginPath();
        targetCtx.ellipse(rect.x + rect.w/2, rect.y + rect.h/2, rect.w/2, (rect.h/2)*(ellipseRatio||1), 0, 0, Math.PI*2);
        targetCtx.closePath();
        return;
      }
      if (shape === 'triangle'){
        targetCtx.beginPath();
        polygonPath(targetCtx, [
          {x:rect.x + rect.w/2, y:rect.y},
          {x:rect.x + rect.w, y:rect.y + rect.h},
          {x:rect.x, y:rect.y + rect.h}
        ], rad);
        targetCtx.closePath();
        return;
      }
      if (shape === 'octagon'){
        const o = Math.min(rect.w, rect.h) * 0.2;
        targetCtx.beginPath();
        polygonPath(targetCtx, [
          {x:rect.x + o, y:rect.y},
          {x:rect.x + rect.w - o, y:rect.y},
          {x:rect.x + rect.w, y:rect.y + o},
          {x:rect.x + rect.w, y:rect.y + rect.h - o},
          {x:rect.x + rect.w - o, y:rect.y + rect.h},
          {x:rect.x + o, y:rect.y + rect.h},
          {x:rect.x, y:rect.y + rect.h - o},
          {x:rect.x, y:rect.y + o}
        ], rad);
        targetCtx.closePath();
        return;
      }
      targetCtx.beginPath();
      polygonPath(targetCtx, [
        {x:rect.x, y:rect.y},
        {x:rect.x + rect.w, y:rect.y},
        {x:rect.x + rect.w, y:rect.y + rect.h},
        {x:rect.x, y:rect.y + rect.h}
      ], rad);
      targetCtx.closePath();
    }
    function roundedRectPath(c, x, y, w, h, radius){
      const r = Math.max(0, Math.min(radius || 0, Math.min(w, h)/2));
      c.beginPath();
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.arcTo(x + w, y, x + w, y + r, r);
      c.lineTo(x + w, y + h - r);
      c.arcTo(x + w, y + h, x + w - r, y + h, r);
      c.lineTo(x + r, y + h);
      c.arcTo(x, y + h, x, y + h - r, r);
      c.lineTo(x, y + r);
      c.arcTo(x, y, x + r, y, r);
      c.closePath();
    }
    function pxPerCm(rect){
      const w_cm=parseNum(wEl,10), h_cm=parseNum(hEl,10);
      const pxW=rect.w/w_cm, pxH=rect.h/h_cm; return (pxW+pxH)/2;
    }

    /* ===== Siatka ===== */
    function drawGrid(rect){
      if (!gridOn || shape==='diecut') return;
      ctx.save();
      ctx.beginPath(); const path=shapePath(); path(); ctx.closePath(); ctx.clip();
      const stepPx = pxPerCm(rect) * 0.5; // 5 mm
      ctx.lineWidth=1; ctx.strokeStyle='rgba(0,0,0,.08)';
      for (let x=rect.x; x<=rect.x+rect.w; x+=stepPx){ ctx.beginPath(); ctx.moveTo(x, rect.y); ctx.lineTo(x, rect.y+rect.h); ctx.stroke(); }
      for (let y=rect.y; y<=rect.y+rect.h; y+=stepPx){ ctx.beginPath(); ctx.moveTo(rect.x, y); ctx.lineTo(rect.x+rect.w, y); ctx.stroke(); }
      ctx.restore();
    }

    const safePreview = ()=>{ try{ return canvas.toDataURL('image/png'); }catch(e){ return null; } };

    /* ===== QR (davidshimjs) ===== */
    function currentQRText(){
      const type = (qrTypeSel?.value || 'url');
      if (type==='url'){
        const url = (qrURL?.value || '').trim();
        return url;
      }
      if (type==='wifi'){
        const rawSSID = (qrWifiSSID?.value || '').trim();
        const rawPass = (qrWifiPass?.value || '').trim();
        if (!rawSSID) return '';
        const esc=(s)=> (s||'').replace(/([\\;,:"])/g,'\\$1');
        const ssid=esc(rawSSID);
        const pass=esc(rawPass);
        const auth=(qrWifiAuth?.value||'WPA');
        const hidden = (qrWifiHidden?.checked ? 'H:true;' : '');
        const pwd = (auth==='nopass' || !rawPass) ? '' : `P:${pass};`;
        return `WIFI:S:${ssid};T:${auth};${pwd}${hidden};`;
      }
      return '';
    }
    function syncQRStateFromInputs(){
      const content = currentQRText();
      const shouldEnable = !!content;
      const wasEnabled = qrObj.enabled;
      qrObj.enabled = shouldEnable;
      if (shouldEnable){
        setToolTarget('qr');
      } else if (wasEnabled && lastToolTarget === 'qr'){
        setToolTarget(null);
      }
      if (shouldEnable && !QRCodeLib && !qrLibMissingWarned){
        alert('Nie można wygenerować QR: biblioteka QR (davidshimjs) nie została wczytana.');
        qrLibMissingWarned = true;
      }
      if (qrRemBtn) qrRemBtn.style.display = shouldEnable ? '' : 'none';
      rebuildQR();
    }

    function updateQRTypeUI(){
      const typ = (qrTypeSel?.value || 'url');
      $$('[data-qr-section]').forEach(el=>{ el.hidden = (el.getAttribute('data-qr-section') !== typ); });
      syncQRStateFromInputs();
    }

    // davidshimjs nie ma natywnego „quiet zone”, więc dodamy margines sami
    function drawWithQuietZone(srcCanvas, side, quiet, dark, light){
      const m = Math.max(0, quiet|0);
      const out = document.createElement('canvas');
      out.width = side + m*2;
      out.height = side + m*2;
      const octx = out.getContext('2d');
      octx.fillStyle = light || '#ffffff';
      octx.fillRect(0,0,out.width,out.height);
      octx.drawImage(srcCanvas, m, m, side, side);
      return out;
    }

    async function buildQRCanvas_Davidshim(content, sidePx, ecc, dark, light, quiet){
      if (!QRCodeLib) return null;
      if (!content) return null;

      const holder = document.createElement('div');
      holder.style.cssText = 'position:fixed;left:-10000px;top:-10000px;width:'+sidePx+'px;height:'+sidePx+'px;';
      document.body.appendChild(holder);

      let level = QRCodeLib.CorrectLevel.M;
      if (ecc === 'L') level = QRCodeLib.CorrectLevel.L;
      else if (ecc === 'Q') level = QRCodeLib.CorrectLevel.Q;
      else if (ecc === 'H') level = QRCodeLib.CorrectLevel.H;

      new QRCodeLib(holder, {
        text: content,
        width: sidePx,
        height: sidePx,
        colorDark: dark || '#111111',
        colorLight: light || '#ffffff',
        correctLevel: level
      });

      await new Promise(res => setTimeout(res, 0));

      let srcCanvas = holder.querySelector('canvas');
      const img = (!srcCanvas ? holder.querySelector('img') : null);

      if (!srcCanvas && img){
        srcCanvas = document.createElement('canvas');
        srcCanvas.width = sidePx; srcCanvas.height = sidePx;
        const cctx = srcCanvas.getContext('2d');
        await new Promise(r=>{ if (img.complete) r(); else { img.onload=r; img.onerror=r; } });
        cctx.drawImage(img, 0,0, sidePx, sidePx);
      }

      holder.innerHTML = '';
      holder.remove();

      if (!srcCanvas) return null;

      if (quiet && quiet>0){
        return drawWithQuietZone(srcCanvas, sidePx, quiet, dark, light);
      }
      return srcCanvas;
    }

    async function rebuildQR(){
      qrObj.canvas = null;
      if (!qrObj.enabled) { requestDraw(); return; }
      const content = currentQRText();
      if (!content){ requestDraw(); return; }

      try{
        const side = 512;
        qrObj.canvas = await buildQRCanvas_Davidshim(
          content,
          side,
          (qrECC?.value || qrObj.ecc || 'M'),
          (qrDark?.value || qrObj.dark || '#111111'),
          (qrLight?.value || qrObj.light || '#ffffff'),
          Math.max(0, parseInt(qrQuiet?.value || qrObj.quiet || '4', 10))
        );
      }catch(err){
        console.warn('QR build failed:', err);
        qrObj.canvas = null;
      }
      requestDraw();
    }

    /* ===== DIECUT — helpery ===== */

    // 360° dylatacja z marginesem, by ring nie był ucinany na krawędziach
    function buildRingFromMask(mask, ringPx, color){
      const w = mask.width, h = mask.height;
      const spread = Math.max(1, Math.ceil(Math.max(0, ringPx || 0)));

      const out = document.createElement('canvas');
      out.width = w + 2*spread;
      out.height = h + 2*spread;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = true;

      const colored = document.createElement('canvas');
      colored.width = w; colored.height = h;
      const cctx = colored.getContext('2d');
      cctx.imageSmoothingEnabled = true;
      cctx.drawImage(mask, 0, 0);
      cctx.globalCompositeOperation = 'source-in';
      cctx.fillStyle = color || '#111111';
      cctx.fillRect(0, 0, w, h);
      cctx.globalCompositeOperation = 'source-over';

      for (let dy = -spread; dy <= spread; dy++){
        const dxLim = Math.floor(Math.sqrt(spread*spread - dy*dy));
        for (let dx = -dxLim; dx <= dxLim; dx++){
          octx.drawImage(colored, spread + dx, spread + dy);
        }
      }

      // usuń wypełnienie z wnętrza — zostaw tylko obrys
      octx.globalCompositeOperation = 'destination-out';
      octx.drawImage(mask, spread, spread);
      octx.globalCompositeOperation = 'source-over';

      return out;
    }

    // oblicza bezpieczną skalę/offset pod obrys
    function diecutSafePlacement(rect, img, userScale, rotDeg, ringPx, padPx){
      const iw = img.width, ih = img.height;
      const base = Math.max(rect.w/iw, rect.h/ih);
      const theta = (rotDeg||0) * Math.PI/180;
      const cos = Math.abs(Math.cos(theta)), sin = Math.abs(Math.sin(theta));

      const availW = Math.max(1, rect.w - 2*(ringPx + (padPx||0)));
      const availH = Math.max(1, rect.h - 2*(ringPx + (padPx||0)));

      const ow0 = iw * base * (userScale||1);
      const oh0 = ih * base * (userScale||1);
      const rotW = cos*ow0 + sin*oh0;
      const rotH = sin*ow0 + cos*oh0;

      const kx = availW / Math.max(1, rotW);
      const ky = availH / Math.max(1, rotH);
      const clampK = Math.min(1, kx, ky);

      const effScale = (userScale||1) * clampK;

      const ow = iw * base * effScale;
      const oh = ih * base * effScale;
      const rotW2 = cos*ow + sin*oh;
      const rotH2 = sin*ow + cos*oh;

      const maxDx = Math.max(0, (rect.w - (rotW2 + 2*ringPx + 2*(padPx||0))) / 2);
      const maxDy = Math.max(0, (rect.h - (rotH2 + 2*ringPx + 2*(padPx||0))) / 2);

      return {
        scale: effScale,
        clampOffsetX: (ox)=> Math.min(Math.max(ox||0, -maxDx), maxDx),
        clampOffsetY: (oy)=> Math.min(Math.max(oy||0, -maxDy), maxDy)
      };
    }

    /* ===== Rysowanie ===== */
    function drawQR(){
      if (!qrObj.enabled || !qrObj.canvas) return;
      const r=getDrawRect();
      const baseSide = Math.min(r.w, r.h) * 0.38 * (qrObj.scale || 1);
      if (!(baseSide > 0)) return;
      const padPct = Math.max(0, qrObj.framePadPct || 0);
      const pad = baseSide * (padPct/100);
      const totalSide = baseSide + pad*2;
      const radiusPct = Math.max(0, qrObj.frameRadiusPct || 0);
      const frameRadius = (radiusPct/100) * (totalSide/2);
      const cx = r.x + r.w/2 + (qrObj.offsetX||0);
      const cy = r.y + r.h/2 + (qrObj.offsetY||0);
      const frameColor = qrLight?.value || qrObj.light || '#ffffff';

      ctx.save();
      ctx.beginPath(); const path=shapePath(); path(); ctx.closePath(); ctx.clip();

      ctx.translate(cx, cy);
      ctx.rotate((qrObj.rotDeg||0) * Math.PI/180);

      if (pad > 0.1){
        ctx.save();
        roundedRectPath(ctx, -totalSide/2, -totalSide/2, totalSide, totalSide, frameRadius);
        ctx.fillStyle = frameColor;
        ctx.fill();
        ctx.lineWidth = Math.max(1, totalSide * 0.012);
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        roundedRectPath(ctx, -totalSide/2, -totalSide/2, totalSide, totalSide, frameRadius);
        ctx.stroke();
        ctx.restore();
      }

      ctx.drawImage(qrObj.canvas, -baseSide/2, -baseSide/2, baseSide, baseSide);

      ctx.restore();
    }

    function draw(){
      const bg=colorEl?.value||'#fff';
      const r=getDrawRect();

      const outlineOn=!!outOnEl?.checked;
      const outlineMM=Math.max(0, parseFloat(outMMEl?.value)||0);
      const outlinePx = outlineOn ? (pxPerCm(r) * (outlineMM/10)) : 0;
      const outlineColor = outColorEl?.value || '#ffffff';

      ctx.clearRect(0,0,cssW,cssH);

      // Tło kształtu (dla wszystkich poza diecut)
      if (shape!=='diecut'){
        ctx.save();
        ctx.beginPath(); const path=shapePath(); path(); ctx.closePath();
        ctx.fillStyle=bg; ctx.fill();
        ctx.restore();
      } else {
        // diecut: neutralne tło (biały)
        ctx.save();
        ctx.fillStyle = bg;
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
      }

      // ----- GRAFIKA -----
      if (shape === 'diecut' && uploaded.img){
        const fit = diecutSafePlacement(r, uploaded.img, (transform.scale||1), (transform.rotDeg||0), outlinePx, 2);
        const effScale = fit.scale;
        const offX = fit.clampOffsetX(transform.offsetX||0);
        const offY = fit.clampOffsetY(transform.offsetY||0);

        const iw = uploaded.img.width, ih = uploaded.img.height;
        const base = Math.max(r.w/iw, r.h/ih);
        const dw = Math.max(1, Math.round(iw * base * effScale));
        const dh = Math.max(1, Math.round(ih * base * effScale));

        let ringCanvas = null;
        let ringHighlight = null;
        let pad = 0;
        if (outlinePx > 0){
          const mask = document.createElement('canvas');
          mask.width = dw; mask.height = dh;
          const mctx = mask.getContext('2d');
          mctx.imageSmoothingEnabled = false;
          mctx.drawImage(uploaded.img, 0, 0, dw, dh);

          let maskReady = true;
          // Zamień kanał alfa na binarną maskę (każdy piksel widoczny -> 1)
          try {
            const imgData = mctx.getImageData(0, 0, dw, dh);
            const buf = imgData.data;
            let hasOpaque = false;
            for (let i = 0; i < buf.length; i += 4){
              const alpha = buf[i + 3];
              if (alpha > 0){
                buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = 255;
                hasOpaque = true;
              } else {
                buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
              }
            }
            if (hasOpaque){
              mctx.putImageData(imgData, 0, 0);
            } else {
              maskReady = false;
            }
          } catch (err){
            console.warn('diecut mask read failed', err);
            maskReady = false;
          }

          if (maskReady){
            const ringColor = outColorEl?.value || '#ff0000'; // sterujesz pickerem obrysu
            ringCanvas = buildRingFromMask(mask, outlinePx, ringColor);
            pad = Math.max(1, Math.ceil(outlinePx));
            if (needsEdgeHighlight(ringColor, bg)){
              ringHighlight = document.createElement('canvas');
              ringHighlight.width = ringCanvas.width;
              ringHighlight.height = ringCanvas.height;
              const hctx = ringHighlight.getContext('2d');
              hctx.imageSmoothingEnabled = true;
              hctx.filter = 'blur(1.2px)';
              hctx.drawImage(ringCanvas, 0, 0);
              hctx.globalCompositeOperation = 'source-in';
              hctx.fillStyle = 'rgba(0,0,0,0.35)';
              hctx.fillRect(0, 0, ringHighlight.width, ringHighlight.height);
              hctx.globalCompositeOperation = 'source-over';
            }
          }
        }

        ctx.save();
        ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();

        const cx = r.x + r.w/2 + offX;
        const cy = r.y + r.h/2 + offY;
        const rot = (transform.rotDeg||0) * Math.PI/180;

        // obraz
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.drawImage(uploaded.img, -dw/2, -dh/2, dw, dh);
        ctx.restore();

        if (ringHighlight){
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.globalAlpha = 0.55;
          ctx.drawImage(ringHighlight, -(dw/2 + pad), -(dh/2 + pad), dw + 2*pad, dh + 2*pad);
          ctx.restore();
        }

        if (ringCanvas){
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.drawImage(ringCanvas, -(dw/2 + pad), -(dh/2 + pad), dw + 2*pad, dh + 2*pad);
          ctx.restore();
        }

        ctx.restore();
      } else if (uploaded.img){
        ctx.save();
        ctx.beginPath(); const path=shapePath(); path(); ctx.closePath(); ctx.clip();
        const iw=uploaded.img.width, ih=uploaded.img.height;
        const base=Math.max(r.w/iw, r.h/ih), scale=base*(transform.scale||1);
        const dw=iw*scale, dh=ih*scale, cx=r.x+r.w/2, cy=r.y+r.h/2;
        ctx.translate(cx + (transform.offsetX||0), cy + (transform.offsetY||0));
        ctx.rotate(((transform.rotDeg||0) * Math.PI)/180);
        ctx.drawImage(uploaded.img, -dw/2, -dh/2, dw, dh);
        ctx.restore();
      }

      // Tekst
      if (textObj.text && textObj.text.trim().length){
        ctx.save();
        ctx.beginPath(); const path=shapePath(); path(); ctx.closePath(); ctx.clip();
        const basePx  = Math.min(r.w, r.h) * 0.18;
        const fontPx  = basePx * (textObj.scale || 1);
        const cx = r.x + r.w/2 + (textObj.offsetX || 0);
        const cy = r.y + r.h/2 + (textObj.offsetY || 0);

        ctx.translate(cx, cy);
        ctx.rotate(((textObj.rotDeg || 0) * Math.PI)/180);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textObj.color || '#111111';
        ctx.font = textFontString(fontPx);
        ctx.fillText(textObj.text, 0, 0);
        ctx.restore();
      }

      // QR
      drawQR();

      // OBRYS naklejki (inner stroke) — nie dla diecut (tam rysujemy własny ring)
      if (shape!=='diecut' && outlineOn && outlinePx>0){
        ctx.save();
        ctx.beginPath(); const path=shapePath(); path(); ctx.closePath(); ctx.clip();
        ctx.lineWidth = outlinePx*2;
        ctx.strokeStyle = outlineColor;
        ctx.beginPath(); path(); ctx.closePath(); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); path(); ctx.closePath(); ctx.stroke();
        ctx.restore();
      }

      // Siatka
      drawGrid(r);

      // Podgląd granicy kształtu (nie dotyczy diecut)
      if (shape!=='diecut'){
        ctx.save();
        ctx.setLineDash([4,4]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,.25)';
        ctx.beginPath(); const path2=shapePath(); path2(); ctx.closePath(); ctx.stroke();
        ctx.restore();
      }

      if (delBtn){
        delBtn.disabled = !uploaded.img;
        delBtn.style.opacity = uploaded.img ? '1' : '.6';
      }

      updateTextSizeUI();
      refreshQtyPrices();
      updatePriceAndJSON();
      updateHandles();
    }

    /* ===== rAF throttle ===== */
    let rafPending = false;
    function requestDraw(){
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(()=>{ rafPending=false; draw(); });
    }

    /* ===== Drag & drop ===== */
    function getPos(evt){
      if (evt.touches && evt.touches[0]) return {x:evt.touches[0].clientX,y:evt.touches[0].clientY};
      return {x:evt.clientX,y:evt.clientY};
    }
    function canvasRect(){ return canvas.getBoundingClientRect(); }
    function getCanvasScale(){
      const r = canvasRect();
      return { sx: r.width/cssW, sy: r.height/cssH };
    }
    function toCanvasXY(client){
      const r=canvasRect(); const sc=getCanvasScale();
      return { x: (client.x - r.left) / (sc.sx||1), y: (client.y - r.top) / (sc.sy||1) };
    }
    function textBoundingBox(){
      if (!textObj.text || !textObj.text.trim().length) return null;
      const r = getDrawRect();
      const basePx = Math.min(r.w, r.h)*0.18, fontPx = basePx*(textObj.scale||1);
      ctx.save(); ctx.font = textFontString(fontPx);
      const m = ctx.measureText(textObj.text); ctx.restore();
      const w = Math.max(10, (m.width||0));
      const h = Math.max(10, fontPx*1.2);
      const cx = r.x + r.w/2 + (textObj.offsetX||0);
      const cy = r.y + r.h/2 + (textObj.offsetY||0);
      const rot = (textObj.rotDeg||0)*(Math.PI/180);
      return { cx, cy, w, h, rot };
    }
    function imageBoundingBox(){
      if (!uploaded.img) return null;
      const r = getDrawRect();
      const outlineOn = !!outOnEl?.checked;
      const outlineMM = Math.max(0, parseFloat(outMMEl?.value)||0);
      const outlinePx = outlineOn ? (pxPerCm(r) * (outlineMM/10)) : 0;
      const iw = uploaded.img.width;
      const ih = uploaded.img.height;
      if (!iw || !ih) return null;
      let scale = 1;
      let offX = transform.offsetX || 0;
      let offY = transform.offsetY || 0;
      const base = Math.max(r.w/iw, r.h/ih);
      if (shape === 'diecut'){
        const fit = diecutSafePlacement(r, uploaded.img, (transform.scale||1), (transform.rotDeg||0), outlinePx, 2);
        scale = Math.max(0.01, fit.scale || 1);
        offX = fit.clampOffsetX(transform.offsetX||0);
        offY = fit.clampOffsetY(transform.offsetY||0);
      } else {
        scale = Math.max(0.01, (transform.scale || 1));
      }
      const dw = (shape === 'diecut') ? Math.max(1, Math.round(iw * base * scale)) : iw * base * scale;
      const dh = (shape === 'diecut') ? Math.max(1, Math.round(ih * base * scale)) : ih * base * scale;
      const cx = r.x + r.w/2 + offX;
      const cy = r.y + r.h/2 + offY;
      const rot = (transform.rotDeg || 0) * Math.PI/180;
      return { cx, cy, w: dw, h: dh, rot };
    }
    function qrBoundingBox(){
      if (!qrObj.enabled || !qrObj.canvas) return null;
      const r = getDrawRect();
      const base = Math.min(r.w, r.h) * 0.38 * (qrObj.scale || 1);
      const pad = base * (Math.max(0, qrObj.framePadPct || 0) / 100);
      const total = base + pad * 2;
      const cx = r.x + r.w/2 + (qrObj.offsetX||0);
      const cy = r.y + r.h/2 + (qrObj.offsetY||0);
      const rot = (qrObj.rotDeg||0) * Math.PI/180;
      return { cx, cy, w: total, h: total, rot };
    }
    function pointInRotatedBox(px, py, box){
      const s = Math.sin(-box.rot), c = Math.cos(-box.rot);
      const dx = px - box.cx, dy = py - box.cy;
      const rx = dx*c - dy*s, ry = dx*s + dy*c;
      return Math.abs(rx) <= box.w/2 && Math.abs(ry) <= box.h/2;
    }

    let dragMode = null; // 'qr' | 'text' | 'image' | null
    let dragStart={x:0,y:0}, offsetStart={x:0,y:0};

    function startDrag(e){
      const p = getPos(e), cv = toCanvasXY(p);
      dragMode = null;

      const qb = qrBoundingBox();
      if (qb && pointInRotatedBox(cv.x, cv.y, qb)) dragMode = 'qr';
      else {
        const tb = textBoundingBox();
        if (tb && pointInRotatedBox(cv.x, cv.y, tb)) dragMode = 'text';
        else if (uploaded.img) dragMode = 'image';
      }
      if (!dragMode) return;

      setToolTarget(dragMode);

      dragStart = p;
      if (dragMode==='qr') offsetStart = { x: qrObj.offsetX, y: qrObj.offsetY };
      else if (dragMode==='text') offsetStart = { x: textObj.offsetX, y: textObj.offsetY };
      else offsetStart = { x: transform.offsetX, y: transform.offsetY };
      e.preventDefault();
    }
    function moveDrag(e){
      if (!dragMode) return;
      const p = getPos(e);
      const dx_screen = p.x - dragStart.x, dy_screen = p.y - dragStart.y;
      const sc = getCanvasScale();
      const dx = Math.round((dx_screen / (sc.sx||1))*2)/2;
      const dy = Math.round((dy_screen / (sc.sy||1))*2)/2;

      if (dragMode==='qr'){
        qrObj.offsetX = offsetStart.x + dx;
        qrObj.offsetY = offsetStart.y + dy;
      } else if (dragMode==='text'){
        textObj.offsetX = offsetStart.x + dx;
        textObj.offsetY = offsetStart.y + dy;
      } else {
        transform.offsetX = offsetStart.x + dx;
        transform.offsetY = offsetStart.y + dy;
      }
      requestDraw();
      updateHandles();
      e.preventDefault();
    }
    function endDrag(){ dragMode=null; }

    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('touchstart', startDrag, {passive:false});
    window.addEventListener('mousemove', moveDrag, {passive:false});
    window.addEventListener('touchmove', moveDrag, {passive:false});
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    function selectByPoint(e){
      const p = getPos(e);
      const cv = toCanvasXY(p);
      const qb = qrBoundingBox();
      if (qb && pointInRotatedBox(cv.x, cv.y, qb)){ setToolTarget('qr'); return; }
      const tb = textBoundingBox();
      if (tb && pointInRotatedBox(cv.x, cv.y, tb)){ setToolTarget('text'); return; }
      if (uploaded.img) setToolTarget('image');
      else setToolTarget(null);
    }
    canvas.addEventListener('click', selectByPoint);

    /* ===== Uchwyt rotacji ===== */
    function activeTarget(){
      if (lastToolTarget==='image' && uploaded.img) return 'image';
      if (lastToolTarget==='text' && hasText()) return 'text';
      if (lastToolTarget==='qr' && qrObj.enabled) return 'qr';
      if (uploaded.img) return 'image';
      if (hasText()) return 'text';
      if (qrObj.enabled) return 'qr';
      return null;
    }

    function targetBoundingBox(t){
      if (t==='image') return imageBoundingBox();
      if (t==='text') return textBoundingBox();
      if (t==='qr') return qrBoundingBox();
      return null;
    }

    function targetScale(t){
      if (t==='qr') return qrObj.scale || 1;
      if (t==='text') return textObj.scale || 1;
      return transform.scale || 1;
    }

    function setTargetScale(t, val){
      const clamped = Math.max(0.1, Math.min(6, val));
      if (t==='qr'){ qrObj.scale = clamped; }
      else if (t==='text'){ textObj.scale = clamped; updateTextSizeUI(); }
      else { transform.scale = clamped; }
    }

    function targetRotation(t){
      if (t==='qr') return qrObj.rotDeg || 0;
      if (t==='text') return textObj.rotDeg || 0;
      return transform.rotDeg || 0;
    }

    function setTargetRotation(t, deg){
      if (t==='qr'){ qrObj.rotDeg = deg; }
      else if (t==='text'){ textObj.rotDeg = deg; }
      else { transform.rotDeg = deg; }
    }

    function cornerForBox(box){
      if (!box) return null;
      const rot = box.rot || 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const dx = box.w/2;
      const dy = -box.h/2;
      return {
        x: box.cx + dx * cos - dy * sin,
        y: box.cy + dx * sin + dy * cos
      };
    }

    function updateHandles(){
      ensureHandleUI();
      if (!handleState.panel || !handleState.layer) return;
      const panel = handleState.panel;
      const target = activeTarget();
      if (!target){
        panel.style.display = 'none';
        return;
      }
      const box = targetBoundingBox(target);
      if (!box){
        panel.style.display = 'none';
        return;
      }
      const sc = getCanvasScale();
      const corner = cornerForBox(box);
      if (!corner){
        panel.style.display = 'none';
        return;
      }

      panel.dataset.target = target;
      panel.style.display = 'block';
      const rect = canvasRect();
      if (!rect || !rect.width || !rect.height){
        panel.style.display = 'none';
        return;
      }
      const w = panel.offsetWidth || 0;
      const h = panel.offsetHeight || 0;
      const sx = sc.sx || 1;
      const sy = sc.sy || 1;
      let left = (corner.x * sx) + 10;
      let top = (corner.y * sy) - h - 10;
      const maxLeft = rect.width - w - 8;
      const maxTop = rect.height - h - 8;
      if (left > maxLeft) left = Math.max(8, maxLeft);
      if (left < 8) left = 8;
      if (top < 8) top = 8;
      if (top > maxTop) top = Math.max(8, maxTop);
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
    }

    function adjustHandleScale(direction){
      const target = activeTarget();
      if (!target) return;
      const current = Math.max(0.1, Math.min(6, targetScale(target) || 1));
      const factor = direction > 0 ? 1.1 : (1/1.1);
      let next = current * factor;
      if (!isFinite(next)) next = current;
      next = Math.max(0.1, Math.min(6, next));
      next = Math.round(next * 100) / 100;
      setToolTarget(target);
      setTargetScale(target, next);
      requestDraw();
      updateHandles();
    }

    function adjustHandleRotation(stepDeg){
      const target = activeTarget();
      if (!target) return;
      const current = targetRotation(target) || 0;
      let next = current + stepDeg;
      if (!isFinite(next)) next = current;
      setToolTarget(target);
      setTargetRotation(target, next);
      requestDraw();
      updateHandles();
    }

    if (handleState.btnZoomOut){
      handleState.btnZoomOut.addEventListener('click', ()=> adjustHandleScale(-1));
    }
    if (handleState.btnZoomIn){
      handleState.btnZoomIn.addEventListener('click', ()=> adjustHandleScale(1));
    }
    if (handleState.btnRotLeft){
      handleState.btnRotLeft.addEventListener('click', ()=> adjustHandleRotation(-5));
    }
    if (handleState.btnRotRight){
      handleState.btnRotRight.addEventListener('click', ()=> adjustHandleRotation(5));
    }

    window.addEventListener('resize', updateHandles);

    /* ===== Upload/Pliki ===== */
    function prettyMeta(pxW, pxH, mime, sizeBytes, extra=''){
      const w_cm=parseNum(wEl,10), h_cm=parseNum(hEl,10);
      const dpiX = w_cm>0 ? (pxW / (w_cm/2.54)) : 0;
      const dpiY = h_cm>0 ? (pxH / (h_cm/2.54)) : 0;
      const type = (mime||'').split('/').pop()?.toUpperCase() || '';
      const bits = [];
      if (pxW && pxH) bits.push(`${pxW}×${pxH} px`);
      if (dpiX && dpiY) bits.push(`~${Math.round(dpiX)}×${Math.round(dpiY)} DPI @ ${w_cm}×${h_cm} cm`);
      if (type) bits.push(type);
      if (isFinite(sizeBytes) && sizeBytes>0) bits.push(prettyBytes(sizeBytes));
      if (extra) bits.push(extra);
      return bits.join(' • ');
    }
    function updateFileMeta(pxW, pxH, mime, sizeBytes, extra=''){
      if (!fMeta) return;
      fMeta.textContent = prettyMeta(pxW, pxH, mime, sizeBytes, extra);
    }
    function clearImage(arg){
      const isEvent = arg && typeof arg === 'object' && typeof arg.preventDefault === 'function';
      if (isEvent){ try { arg.preventDefault(); } catch(err){} }
      const options = (!isEvent && arg && typeof arg === 'object') ? arg : {};
      const keepSummary = !!options.keepSummary;

      abortActiveUpload({ silent:true });
      setUploadBusy(false);

      uploaded = { name:null, type:null, size:0, dataURL:null, img:null, pdf:null, uploadId:null, url:null, uploadBytes:0 };
      if (imgEl) imgEl.value='';
      if (fName) fName.textContent='brak pliku';
      if (uploadSummary && !keepSummary) uploadSummary.textContent='Brak pliku';
      if (fMeta) fMeta.textContent='';
      transform={scale:1,offsetX:0,offsetY:0,rotDeg:0};
      if (lastToolTarget === 'image') setToolTarget(null);
      requestDraw();
      updatePriceAndJSON();
    }
    if (upBtn){
      upBtn.addEventListener('click', ()=> imgEl && imgEl.click());
      try{ upBtn.classList.add('btn-primary'); }catch(e){}
    }
    if (delBtn) delBtn.addEventListener('click', clearImage);

    if (imgEl) imgEl.addEventListener('change', async (e)=>{
      const f = e.target.files && e.target.files[0];
      if (!f){ clearImage(); return; }
      const name = f.name || '';
      if (fName) fName.textContent = name || 'brak pliku';

      const lowerName = (name || '').toLowerCase();
      const ext = lowerName.includes('.') ? lowerName.split('.').pop() : '';
      const typeLower = (f.type || '').toLowerCase();

      const hitsDisallowed = (()=>{
        if (ext && disallowedExtSet.has(ext)) return true;
        for (const bad of disallowedExtSet){
          if (!bad) continue;
          if (typeLower && typeLower.includes(bad)) return true;
          if (lowerName.endsWith('.' + bad)) return true;
        }
        return false;
      })();
      if (hitsDisallowed){
        clearImage({ keepSummary:true });
        if (uploadSummary){
          uploadSummary.textContent = 'Ten typ pliku jest zablokowany. Dozwolone formaty: JPG, PNG lub PDF.';
        }
        return;
      }

      const allowedByExt = ext && allowedExtSet.has(ext);
      const allowedByMime = typeLower && allowedMimeSet.has(typeLower);
      if (!allowedByExt && !allowedByMime){
        clearImage({ keepSummary:true });
        if (uploadSummary){
          uploadSummary.textContent = 'Nieobsługiwany format pliku. Wgraj JPG, PNG lub PDF.';
        }
        return;
      }

      // jeśli diecut — tylko PNG z przezroczystością
      if (shape==='diecut'){
        const isPNG = (f.type && f.type.toLowerCase().includes('png')) || /\.png$/i.test(name);
        if (!isPNG){
          alert('Tryb DIECUT: wgraj plik PNG z przezroczystym tłem.');
          clearImage();
          return;
        }
      }

      const limitBytes = (Number.isFinite(MAX_UPLOAD_BYTES) && MAX_UPLOAD_BYTES > 0) ? MAX_UPLOAD_BYTES : null;
      if (limitBytes && Number.isFinite(f.size) && f.size > limitBytes){
        clearImage({ keepSummary:true });
        if (uploadSummary){
          const limitLabel = prettyBytes(limitBytes);
          const sizeLabel = prettyBytes(f.size || 0);
          uploadSummary.innerHTML = `Plik ma ${sizeLabel} i przekracza limit ${limitLabel}.<br>Większe pliki prześlij proszę przez <a href="https://wetransfer.com/" target="_blank" rel="noopener">WeTransfer</a> i dołącz link w uwagach do zamówienia.`;
        }
        return;
      }

      const isPDF = (f.type && f.type.toLowerCase().includes('pdf')) || /\.pdf$/i.test(name);
      if (isPDF){
        if (shape==='diecut'){
          alert('Tryb DIECUT wspiera tylko PNG z przezroczystością.');
          clearImage();
          return;
        }
        if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument!=='function'){
          alert('Podgląd PDF wymaga PDF.js (brak biblioteki).');
          clearImage();
          return;
        }
      }

      const uploadInfo = await uploadFileToServer(f);
      if (!uploadInfo){
        clearImage({ keepSummary:true });
        return;
      }

      const uploadedSize = uploadInfo.size || f.size || 0;
      const uploadedType = uploadInfo.type || f.type || '';
      const uploadedUrl  = uploadInfo.url || '';
      const uploadedId   = uploadInfo.uploadId || 0;

      if (uploadSummary){
        uploadSummary.textContent = `${name || 'Plik'} • ${prettyBytes(uploadedSize)}`;
      }

      if (isPDF){
        try{
          const buf = await f.arrayBuffer();
          const pdfTask = window.pdfjsLib.getDocument({ data: new Uint8Array(buf) });
          const pdf = await pdfTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2 });
          const c = document.createElement('canvas');
          const cctx = c.getContext('2d');
          c.width  = Math.max(1, Math.ceil(viewport.width));
          c.height = Math.max(1, Math.ceil(viewport.height));
          await page.render({ canvasContext: cctx, viewport }).promise;

          const dataURL = c.toDataURL('image/png');
          const img = new Image();
          img.onload = ()=>{
            uploaded = {
              name,
              type:(uploadedType || 'application/pdf'),
              size:uploadedSize,
              dataURL,
              img,
              pdf:{ numPages: pdf.numPages||1 },
              uploadId:uploadedId,
              url:uploadedUrl,
              uploadBytes:uploadedSize
            };
            transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 };
            updateFileMeta(c.width, c.height, (uploadedType || 'application/pdf'), uploadedSize, `PDF • ${pdf.numPages||1} str.`);
            setToolTarget('image');
            requestDraw();
            updatePriceAndJSON();
          };
          img.src = dataURL;
        }catch(err){
          console.error('PDF preview error:', err);
          alert('Nie udało się wczytać PDF (szczegóły w konsoli).');
          clearImage();
        }
        return;
      }

      const rd = new FileReader();
      rd.onload = (ev)=>{
        const dataURL = String(ev.target.result);
        const img = new Image();
        img.onload = ()=>{
          uploaded = {
            name,
            type:(uploadedType || ''),
            size:uploadedSize,
            dataURL,
            img,
            pdf:null,
            uploadId:uploadedId,
            url:uploadedUrl,
            uploadBytes:uploadedSize
          };
          transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 };
          updateFileMeta(img.naturalWidth||img.width, img.naturalHeight||img.height, (uploadedType || ''), uploadedSize);
          setToolTarget('image');
          requestDraw();
          updatePriceAndJSON();
        };
        img.src = dataURL;
      };
      rd.readAsDataURL(f);
    });

    /* ===== Kontrolki: Kształt ===== */
    function relocateUploadRow(toDiecut){
      if (!uploadRow || !uploadPlaceholder || !diecutSlot) return;
      if (toDiecut){
        diecutSlot.appendChild(uploadRow);
        diecutSlot.removeAttribute('hidden');
        uploadRow.classList.add('is-diecut');
        if (accImageItem) accImageItem.setAttribute('hidden', '');
      } else {
        if (accImageItem) accImageItem.removeAttribute('hidden');
        if (uploadPlaceholder.parentNode){
          uploadPlaceholder.parentNode.insertBefore(uploadRow, uploadPlaceholder);
        }
        diecutSlot.setAttribute('hidden', '');
        uploadRow.classList.remove('is-diecut');
      }
    }

    function updateShapeUI(){
      if (shapeGrid){
        $$('.shape-btn', shapeGrid).forEach(btn => {
          const val = btn.getAttribute('data-shape') || 'rect';
          const isActive = val === shape;
          btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
      }
      if (extraShapeSel){
        const options = Array.from(extraShapeSel.options || []);
        const hasOption = options.some(opt => opt.value === shape);
        if (!hasOption && shape){
          const opt = document.createElement('option');
          opt.value = shape;
          opt.textContent = shapeLabel(shape);
          extraShapeSel.appendChild(opt);
        }
        if (extraShapeSel.value !== shape){
          extraShapeSel.value = shape;
        }
      }

      const dis = (shape==='ellipse' || shape==='circle' || shape==='diecut');
      if (cornerEl) cornerEl.disabled = dis;
      if (ellipseRow) ellipseRow.style.display = (shape==='ellipse') ? '' : 'none';

      // komunikat przy diecut
      const warn = byId('stb-file-hint');
      if (warn){
        warn.textContent = (shape==='diecut')
          ? 'Tryb DIECUT: wgraj TYLKO PNG (przezroczyste tło).'
          : '';
      }
      relocateUploadRow(shape === 'diecut');
      updateSummaryMeta();
      requestDraw();
    }
    if (shapeGrid){
      shapeGrid.addEventListener('click', (e)=>{
        const btn = e.target.closest('.shape-btn'); if(!btn) return;
        shape = btn.getAttribute('data-shape') || 'rect';
        updateShapeUI();
      });
    }
    if (extraShapeSel){
      extraShapeSel.addEventListener('change', ()=>{
        markExtraUsed();
        const next = extraShapeSel.value || 'rect';
        shape = next;
        updateShapeUI();
      });
    }
    if (ellipseEl){
      ellipseEl.addEventListener('input', ()=>{
        ellipseRatio = Math.max(0.4, Math.min(1.0, parseFloat(ellipseEl.value||'1')));
        if (ellipseVal) ellipseVal.textContent = Math.round(ellipseRatio*100) + '%';
        requestDraw();
      });
    }
    if (cornerEl){
      cornerEl.addEventListener('input', ()=>{
        const v = Math.max(0, Math.min(20, parseFloat(cornerEl.value||'0')));
        cornerFactor = v / 100; requestDraw();
      });
    }
    if (outOnEl) outOnEl.addEventListener('change', requestDraw);
    if (outMMEl) outMMEl.addEventListener('input', requestDraw);
    if (outColorEl) outColorEl.addEventListener('input', requestDraw);
    if (colorEl)  colorEl.addEventListener('input', requestDraw);

    updateShapeUI();

    /* ===== Materiał ===== */
    const normalizeMaterialOption = (opt, idx) => {
      if (!opt) return null;
      const rawValue = (opt.value || opt.label || '').trim();
      const rawLabel = (opt.label || opt.value || '').trim();
      if (!rawValue || !rawLabel) return null;
      const idBase = opt.id || rawValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const id = idBase ? `stb-material-${idBase}` : `stb-material-${idx || 0}`;
      return {
        id,
        value: rawValue,
        label: rawLabel,
        note: opt.note || opt.subtitle || opt.subLabel || '',
        image: opt.image || opt.src || '',
        shortLabel: opt.shortLabel || opt.short || ''
      };
    };

    const defaultMaterialOptions = [
      { id:'foil-economy', value:'Folia ekonomiczna', label:'Folia ekonomiczna', note:'Monomeryczna' },
      { id:'foil-longlife', value:'Folia długowieczna', label:'Folia długowieczna', note:'Polimerowa' },
      { id:'foil-transparent', value:'Folia transparentna', label:'Folia transparentna', note:'' },
      { id:'foil-whiteback', value:'Folia transparentna z białym podkładem', label:'Folia transparentna z białym podkładem', shortLabel:'Folia transparentna', note:'Z białym podkładem' },
      { id:'foil-matte', value:'Folia matowa', label:'Folia matowa', note:'' },
      { id:'foil-glossy', value:'Folia błyszcząca', label:'Folia błyszcząca', note:'' },
      { id:'foil-metallic', value:'Folia metaliczna', label:'Folia metaliczna', note:'' },
      { id:'foil-gold', value:'Folia złota', label:'Folia złota', note:'' },
      { id:'foil-silver', value:'Folia srebrna', label:'Folia srebrna', note:'' },
      { id:'foil-holo', value:'Folia holograficzna', label:'Folia holograficzna', note:'' },
      { id:'foil-reflective', value:'Folia odblaskowa', label:'Folia odblaskowa', note:'' },
      { id:'foil-fluo', value:'Folia fluorescencyjna', label:'Folia fluorescencyjna', note:'' }
    ];

    const materialOptions = (() => {
      if (Array.isArray(window.STB_MATERIAL_OPTIONS) && window.STB_MATERIAL_OPTIONS.length){
        return window.STB_MATERIAL_OPTIONS
          .map((opt, idx) => normalizeMaterialOption(opt, idx))
          .filter(Boolean);
      }
      return defaultMaterialOptions.map((opt, idx) => normalizeMaterialOption(opt, idx)).filter(Boolean);
    })();

    if (materialEl && materialOptions.length){
      const currentValue = (materialEl.value || '').trim();
      const hasCurrent = currentValue && materialOptions.some(opt => opt.value === currentValue);
      if (!hasCurrent && currentValue){
        const fallbackOption = normalizeMaterialOption({ value: currentValue, label: currentValue }, 'current');
        if (fallbackOption) materialOptions.unshift(fallbackOption);
      }
      if (!materialEl.value){
        materialEl.value = materialOptions[0].value;
      }
    }

    if (materialEl && !defaultMaterialValue){
      defaultMaterialValue = materialEl.value || '';
    }

    const materialTiles = [];
    const syncQuickMaterial = (value) => {
      if (!extraMaterialSel) return;
      const target = value || '';
      if (extraMaterialSel.value === target) return;
      let hasOption = false;
      const options = Array.from(extraMaterialSel.options || []);
      for (const opt of options){
        if (opt.value === target){ hasOption = true; break; }
      }
      if (!hasOption && target){
        const optEl = document.createElement('option');
        optEl.value = target;
        optEl.textContent = target;
        extraMaterialSel.appendChild(optEl);
        hasOption = true;
      }
      if (hasOption){
        extraMaterialSel.value = target;
      } else if (extraMaterialSel.options.length){
        extraMaterialSel.value = extraMaterialSel.options[0].value;
      }
    };

    const updateMaterialTiles = (value) => {
      const target = (value || '').toLowerCase();
      const activeMap = new Map();
      materialTiles.forEach(({ option, el, grid }) => {
        const isActive = option.value.toLowerCase() === target;
        el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        el.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive && grid){
          activeMap.set(grid, el.id);
        }
      });
      [materialGridEl, extraMaterialGridEl].forEach((grid) => {
        if (!grid) return;
        const activeId = activeMap.get(grid);
        if (activeId){ grid.setAttribute('aria-activedescendant', activeId); }
        else { grid.removeAttribute('aria-activedescendant'); }
      });
      syncQuickMaterial(value);
    };

    const setMaterialValue = (value, { triggerChange = true } = {}) => {
      if (!materialEl) return;
      if (materialEl.value !== value){
        materialEl.value = value;
      }
      updateMaterialTiles(value);
      if (triggerChange){
        materialEl.dispatchEvent(new Event('change', { bubbles:true }));
      }
    };

    const buildMaterialTile = (option, index, gridEl, suffix = '') => {
      if (!gridEl || !option) return;
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'material-tile';
      const baseId = option.id || `stb-material-${index}`;
      tile.id = suffix ? `${baseId}-${suffix}` : baseId;
      tile.dataset.value = option.value;
      tile.setAttribute('role', 'option');
      tile.setAttribute('aria-pressed', 'false');
      tile.setAttribute('aria-selected', 'false');
      tile.setAttribute('aria-label', option.label);
      tile.dataset.image = option.image || '';
      if (option.image){
        tile.style.setProperty('--material-image', `url("${option.image}")`);
      }

      const image = document.createElement('span');
      image.className = 'material-tile__image';
      tile.appendChild(image);

      const caption = document.createElement('span');
      caption.className = 'material-tile__name';
      const primaryText = option.shortLabel || option.label;
      const strongLine = document.createElement('strong');
      strongLine.textContent = primaryText;
      caption.appendChild(strongLine);
      if (option.note){
        const noteLine = document.createElement('small');
        noteLine.textContent = option.note;
        caption.appendChild(noteLine);
      }
      tile.title = option.note ? `${option.label} — ${option.note}` : option.label;
      tile.appendChild(caption);

      tile.addEventListener('click', () => setMaterialValue(option.value));

      materialTiles.push({ option, el: tile, grid: gridEl });
      gridEl.appendChild(tile);
    };

    if (materialGridEl && materialOptions.length){
      materialGridEl.setAttribute('aria-multiselectable', 'false');
      materialGridEl.innerHTML = '';
      materialOptions.forEach((option, index) => {
        if (!option) return;
        buildMaterialTile(option, index, materialGridEl);
      });
      updateMaterialTiles(materialEl ? materialEl.value : '');
    }

    if (extraMaterialGridEl && materialOptions.length){
      extraMaterialGridEl.setAttribute('aria-multiselectable', 'false');
      extraMaterialGridEl.innerHTML = '';
      materialOptions.forEach((option, index) => {
        if (!option) return;
        buildMaterialTile(option, index, extraMaterialGridEl, 'extra');
      });
    }

    if (extraMaterialSel && materialOptions.length){
      extraMaterialSel.innerHTML = '';
      materialOptions.forEach((option)=>{
        if (!option) return;
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        extraMaterialSel.appendChild(opt);
      });
      syncQuickMaterial(materialEl ? materialEl.value : extraMaterialSel.value);
      extraMaterialSel.addEventListener('change', ()=>{
        markExtraUsed();
        setMaterialValue(extraMaterialSel.value);
      });
    } else if (extraMaterialSel){
      extraMaterialSel.addEventListener('change', ()=>{
        markExtraUsed();
        setMaterialValue(extraMaterialSel.value);
      });
    }

    function materialMultiplier(){
      const v = (materialEl && (materialEl.value||'')).toLowerCase();
      if (v.indexOf('długo') !== -1 || v.indexOf('dlugo') !== -1) return 1.5; // folia długowieczna
      return 1.0; // ekonomiczna lub inne
    }
    if (materialEl){
      materialEl.addEventListener('change', ()=>{
        updateMaterialTiles(materialEl.value);
        updatePriceAndJSON();
        refreshQtyPrices();
        updateSummaryMeta();
      });
      syncQuickMaterial(materialEl.value);
    }

    const syncExtraFinish = ()=>{
      if (!extraFinishSel) return;
      const val = currentFinishValue();
      if (val){ extraFinishSel.value = val; }
    };

    if (finishEl){
      finishEl.addEventListener('change', ()=>{
        syncExtraFinish();
        updatePriceAndJSON();
        refreshQtyPrices();
        updateSummaryMeta();
      });
      syncExtraFinish();
    }

    if (extraFinishSel){
      extraFinishSel.addEventListener('change', ()=>{
        markExtraUsed();
        if (finishEl && finishEl.value !== extraFinishSel.value){
          finishEl.value = extraFinishSel.value;
          finishEl.dispatchEvent(new Event('change', { bubbles:true }));
          return;
        }
        updatePriceAndJSON();
        refreshQtyPrices();
        updateSummaryMeta();
      });
      if (!finishEl){ syncExtraFinish(); }
    }

    const syncQuickLaminate = ()=>{
      if (!extraLaminateEl) return;
      extraLaminateEl.checked = !!(laminateEl && laminateEl.checked);
    };

    if (laminateEl){
      laminateEl.addEventListener('change', ()=>{
        syncQuickLaminate();
        updatePriceAndJSON();
        refreshQtyPrices();
        updateSummaryMeta();
        requestDraw();
      });
      syncQuickLaminate();
    }
    if (extraLaminateEl){
      extraLaminateEl.addEventListener('change', ()=>{
        markExtraUsed();
        if (laminateEl && laminateEl.checked !== extraLaminateEl.checked){
          laminateEl.checked = extraLaminateEl.checked;
          laminateEl.dispatchEvent(new Event('change', { bubbles:true }));
        } else {
          updatePriceAndJSON();
          refreshQtyPrices();
          updateSummaryMeta();
          requestDraw();
        }
      });
      if (!laminateEl){
        syncQuickLaminate();
      }
    }

    if (expressEl){
      expressEl.addEventListener('change', ()=>{
        markExtraUsed();
        updatePriceAndJSON();
        refreshQtyPrices();
        updateSummaryMeta();
      });
    }

    /* ===== Tekst ===== */
    const refreshFontPreview = ()=>{
      if (!textFontSel) return;
      const font = textFontSel.value || 'Inter';
      textFontSel.style.fontFamily = `${quoteFont(font)}, system-ui, -apple-system, 'Segoe UI', sans-serif`;
    };

    if (textInput){
      textInput.addEventListener('focus', ()=> setToolTarget('text'));
      textInput.addEventListener('input', ()=>{
        textObj.text = textInput.value || '';
        if (hasText()) setToolTarget('text');
        else if (lastToolTarget === 'text') setToolTarget(null);
        requestDraw();
      });
    }
    if (textFontSel){
      textFontSel.addEventListener('change', ()=>{
        textObj.font = textFontSel.value || 'Inter';
        refreshFontPreview();
        if (hasText()) setToolTarget('text');
        requestDraw();
      });
      refreshFontPreview();
    }
    if (textColorEl){
      textColorEl.addEventListener('input', ()=>{
        textObj.color = textColorEl.value || '#111111';
        if (hasText()) setToolTarget('text');
        requestDraw();
      });
    }
    if (textSizeInput){
      textSizeInput.addEventListener('input', ()=>{
        const bounds = textSizeBounds();
        const raw = parseFloat(textSizeInput.value);
        if (!Number.isFinite(raw)) return;
        const clamped = Math.max(bounds.min, Math.min(bounds.max, raw));
        textObj.scale = clampTextScale(clamped);
        updateTextSizeUI();
        if (hasText()) setToolTarget('text');
        requestDraw();
      });
    }

    const updateTextStyleButtons = ()=>{
      if (textBoldBtn){
        const isBold = textObj.weight === 'bold';
        textBoldBtn.setAttribute('aria-pressed', isBold ? 'true' : 'false');
        textBoldBtn.classList.toggle('is-active', isBold);
      }
      if (textItalicBtn){
        const isItalic = !!textObj.italic;
        textItalicBtn.setAttribute('aria-pressed', isItalic ? 'true' : 'false');
        textItalicBtn.classList.toggle('is-active', isItalic);
      }
      updateTextSizeUI();
    };

    if (textBoldBtn){
      textBoldBtn.addEventListener('click', ()=>{
        textObj.weight = (textObj.weight === 'bold') ? 'normal' : 'bold';
        updateTextStyleButtons();
        if (hasText()) setToolTarget('text');
        requestDraw();
      });
    }
    if (textItalicBtn){
      textItalicBtn.addEventListener('click', ()=>{
        textObj.italic = !textObj.italic;
        updateTextStyleButtons();
        if (hasText()) setToolTarget('text');
        requestDraw();
      });
    }
    updateTextStyleButtons();

    function initColorResets(){
      $$('.color-reset[data-reset-color]').forEach(btn=>{
        const targetId = btn.getAttribute('data-reset-color');
        if (!targetId) return;
        const target = byId(targetId);
        if (!target) return;
        const base = target.dataset?.default || target.getAttribute('value') || '#ffffff';
        btn.addEventListener('click', ()=>{
          const def = target.dataset?.default || base;
          if (!def) return;
          target.value = def;
          target.dispatchEvent(new Event('input', { bubbles:true }));
          target.dispatchEvent(new Event('change', { bubbles:true }));
        });
      });
    }

    /* ===== QR UI ===== */
    function bindQR(){
      if (qrRemBtn){
        qrRemBtn.addEventListener('click', ()=>{
          qrObj.enabled = false;
          qrObj.canvas = null;
          if (qrURL) qrURL.value = '';
          if (qrWifiSSID) qrWifiSSID.value = '';
          if (qrWifiPass) qrWifiPass.value = '';
          if (qrWifiHidden) qrWifiHidden.checked = false;
          setToolTarget(null);
          syncQRStateFromInputs();
        });
      }
      if (qrTypeSel) qrTypeSel.addEventListener('change', updateQRTypeUI);

      // Kolory/ECC/quiet
      [qrDark, qrLight, qrECC, qrQuiet].forEach(el=>{
        if (!el) return;
        const evt = (el.type==='range' || el.type==='color' || el.tagName==='SELECT') ? 'input' : 'change';
        el.addEventListener(evt, ()=>{
          if (el === qrDark) qrObj.dark = qrDark.value || '#111111';
          if (el === qrLight) qrObj.light = qrLight.value || '#ffffff';
          if (el === qrECC) qrObj.ecc = qrECC.value || 'M';
          if (el === qrQuiet) qrObj.quiet = Math.max(0, parseInt(qrQuiet.value||'0', 10));
          if (qrObj.enabled){
            setToolTarget('qr');
            rebuildQR();
          }
        });
      });
      if (qrDark)  qrObj.dark  = qrDark.value || qrObj.dark;
      if (qrLight) qrObj.light = qrLight.value || qrObj.light;
      if (qrECC)   qrObj.ecc   = qrECC.value || qrObj.ecc;
      if (qrQuiet) qrObj.quiet = Math.max(0, parseInt(qrQuiet.value||qrObj.quiet||'0', 10));

      // Dane
      [qrURL, qrWifiSSID, qrWifiPass, qrWifiAuth, qrWifiHidden].forEach(el=>{
        if (!el) return;
        const evt = (el.type==='checkbox' || el.tagName==='SELECT') ? 'change' : 'input';
        el.addEventListener(evt, syncQRStateFromInputs);
      });

      const updateFramePad = ()=>{
        if (!qrFramePad) return;
        const val = Math.max(0, parseFloat(qrFramePad.value||'0'));
        qrObj.framePadPct = val;
        if (qrFramePadVal) qrFramePadVal.textContent = Math.round(val) + '%';
        if (qrObj.enabled) setToolTarget('qr');
        requestDraw();
      };
      const updateFrameRadius = ()=>{
        if (!qrFrameRadius) return;
        const val = Math.max(0, parseFloat(qrFrameRadius.value||'0'));
        qrObj.frameRadiusPct = val;
        if (qrFrameRadiusVal) qrFrameRadiusVal.textContent = Math.round(val) + '%';
        if (qrObj.enabled) setToolTarget('qr');
        requestDraw();
      };
      if (qrFramePad){
        qrFramePad.addEventListener('input', updateFramePad);
        updateFramePad();
      }
      if (qrFrameRadius){
        qrFrameRadius.addEventListener('input', updateFrameRadius);
        updateFrameRadius();
      }

      updateQRTypeUI();
    }
    initColorResets();
    bindQR();

    /* ===== Cennik + czas realizacji (dni robocze) ===== */
    function computeAreaM2(){ const w_cm=parseNum(wEl,10), h_cm=parseNum(hEl,10); return (w_cm/100)*(h_cm/100); }
    function computeTotalForQty(q){
      const areaOne=computeAreaM2(); const qty=Math.max(1, Math.floor(q||1)); const total_area=areaOne*qty;
      let rate; if (total_area<=2){ rate=200; } else if (total_area<=10){ rate=100; } else { rate=70; }
      let total=total_area*rate;

      // materiał (długowieczna x1.5)
      total *= materialMultiplier();

      if (total<99) total=99;
      if (laminateEl && laminateEl.checked){ total *= 1.15; } // LAMINAT +15%
      const expressEnabled = !!(expressEl && expressEl.checked);
      if (expressEnabled){ total *= EXPRESS_MULTIPLIER; }
      const net=total/1.23;
      return { total, net, rate, areaOne, total_area, qty, express: expressEnabled, express_multiplier: expressEnabled ? EXPRESS_MULTIPLIER : 1 };
    }
    function computeBaselineA(q){ const areaOne=computeAreaM2(); const qty=Math.max(1, Math.floor(q||1)); return areaOne*200*qty; }

    function getCurrentQty(){
      if (qtyCustom && !qtyCustom.classList.contains('is-hidden')) return Math.max(1, Math.floor(parseNum(qtyEl,1)));
      const active = qtyList ? qtyList.querySelector('.opt-item[aria-pressed="true"][data-qty]') : null;
      return active ? (parseInt(active.getAttribute('data-qty'),10)||1) : 1;
    }

    function refreshQtyPrices(){
      if (!qtyList) return;
      $$('.opt-item[data-qty]', qtyList).forEach(btn=>{
        const q = parseInt(btn.getAttribute('data-qty'),10)||1;
        const calcB = computeTotalForQty(q), A = computeBaselineA(q);
        const priceEl = btn.querySelector('.opt-price'), saveEl = btn.querySelector('.opt-save');
        if (priceEl) renderWooPrice(priceEl, calcB.total);
        let pctSave = 0; if (A>0.0001){ const ratioPct=(calcB.total/A)*100; pctSave=Math.max(0,100-ratioPct); }
        if (saveEl) saveEl.textContent = (pctSave>=0.5)?('oszczędzasz '+Math.round(pctSave)+'%'):'';
      });
      if (qtyCustom && !qtyCustom.classList.contains('is-hidden') && qtyCustomSave){
        const qC = Math.max(1, Math.floor(parseNum(qtyEl,1)));
        const calcB = computeTotalForQty(qC), A = computeBaselineA(qC);
        let pctSave = 0; if (A>0.0001){ const ratioPct=(calcB.total/A)*100; pctSave=Math.max(0,100-ratioPct); }
        qtyCustomSave.textContent = (pctSave>=0.5)?('oszczędzasz '+Math.round(pctSave)+'%'):'';
      } else if (qtyCustomSave){ qtyCustomSave.textContent=''; }
    }

    // dni robocze
    function addBusinessDays(date, days){
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let added = 0;
      while(added < days){
        d.setDate(d.getDate()+1);
        const w = d.getDay(); // 0 nd, 6 sob
        if (w !== 0 && w !== 6) added++;
      }
      return d;
    }
    function leadTimeBusinessDays(totalArea){
      if (totalArea <= 3) return 2;
      if (totalArea < 20) return 5;
      return 7;
    }
    function formatPLDateOnly(dt){
      try{
        return dt.toLocaleDateString('pl-PL', {
          weekday:'long', year:'numeric', month:'long', day:'numeric'
        });
      }catch(e){
        return dt.toISOString().slice(0,10);
      }
    }

    function formatPLTimeOnly(dt){
      try{
        return dt.toLocaleTimeString('pl-PL', { hour:'2-digit', minute:'2-digit' });
      }catch(e){
        const h = dt.getHours().toString().padStart(2, '0');
        const m = dt.getMinutes().toString().padStart(2, '0');
        return h + ':' + m;
      }
    }

    function updateConfigSummary(calc){
      if (!extraSummaryWrap) return;
      extraSummaryWrap.hidden = false;
      const qty = getCurrentQty();
      const summaryCalc = calc || computeTotalForQty(qty);
      const expressEnabled = !!(expressEl && expressEl.checked);

      if (sumShapeEl) sumShapeEl.textContent = shapeLabel(shape);
      if (sumMaterialEl) sumMaterialEl.textContent = materialEl?.value || 'Folia ekonomiczna';
      if (sumFinishEl) sumFinishEl.textContent = finishLabel();
      if (sumLaminateEl) sumLaminateEl.textContent = (laminateEl && laminateEl.checked) ? 'Tak' : 'Nie';
      if (sumExpressEl) sumExpressEl.textContent = expressEnabled ? 'Przyspieszona (+15%)' : 'Standardowa';

      let leadDays = leadTimeBusinessDays(summaryCalc.total_area || 0);
      if (expressEnabled){ leadDays = Math.max(0, leadDays - 1); }
      else if (leadDays < 0){ leadDays = 0; }

      if (sumLeadtimeEl){
        const shipDate = addBusinessDays(new Date(), leadDays);
        sumLeadtimeEl.textContent = formatPLDateOnly(shipDate);
        if (expressEnabled){ sumLeadtimeEl.dataset.express = '1'; }
        else { delete sumLeadtimeEl.dataset.express; }
      }
    }

    const markExtraUsed = ()=>{
      updateConfigSummary();
    };

    function updateSummaryMeta(calc){
      if (sumShapeEl)    sumShapeEl.textContent = shapeLabel(shape);
      if (sumMaterialEl) sumMaterialEl.textContent = materialEl?.value || 'Folia ekonomiczna';
      if (sumFinishEl)   sumFinishEl.textContent = finishLabel();
      if (sumLaminateEl) sumLaminateEl.textContent = (laminateEl && laminateEl.checked) ? 'Tak' : 'Nie';

      const qty = getCurrentQty();
      const c = calc || computeTotalForQty(qty);
      const expressEnabled = !!(expressEl && expressEl.checked);
      if (sumExpressEl) sumExpressEl.textContent = expressEnabled ? 'Przyspieszona (+15%)' : 'Standardowa';
      if (sumLeadtimeEl){
        sumLeadtimeEl.textContent = '';
        delete sumLeadtimeEl.dataset.express;
      }

      updateConfigSummary(c);
    }

    // popup do wyceny
    function hideQuotePopup(){
      const modal = byId('stb-quote-popup');
      if (!modal) return;
      modal.classList.remove('is-visible');
      modal.setAttribute('aria-hidden', 'true');
      if (modal.__escHandler){
        document.removeEventListener('keydown', modal.__escHandler);
        modal.__escHandler = null;
      }
    }

    function ensureQuotePopup(){
      let modal = byId('stb-quote-popup');
      if (modal) return modal;
      modal = document.createElement('div');
      modal.id = 'stb-quote-popup';
      modal.className = 'stb-quote-popup';
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="stb-quote-popup__backdrop" data-quote-close></div>
        <div class="stb-quote-popup__dialog" role="dialog" aria-modal="true" aria-labelledby="stb-quote-title" tabindex="-1">
          <div class="stb-quote-popup__header">
            <h2 id="stb-quote-title" class="stb-quote-popup__title">Wycena indywidualna</h2>
            <button type="button" class="btn btn-icon stb-quote-popup__close" data-quote-close aria-label="Zamknij okno">
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <div class="stb-quote-popup__body">
            <p>Powierzchnia naklejek przekracza 100 m². Napisz do nas, a przygotujemy ofertę.</p>
          </div>
          <div class="stb-quote-popup__actions">
            <a class="btn btn-primary" href="/kontakt/">Przejdź do kontaktu</a>
            <button class="btn" type="button" data-quote-close>Zostań w kreatorze</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      const closeEls = modal.querySelectorAll('[data-quote-close]');
      closeEls.forEach((el)=>{
        el.addEventListener('click', (ev)=>{
          ev.preventDefault();
          hideQuotePopup();
        });
      });
      return modal;
    }

    function showQuotePopup(){
      const modal = ensureQuotePopup();
      if (!modal) return;
      modal.classList.add('is-visible');
      modal.setAttribute('aria-hidden', 'false');
      const dialog = modal.querySelector('.stb-quote-popup__dialog');
      if (dialog){ dialog.focus(); }
      if (!modal.__escHandler){
        modal.__escHandler = (ev)=>{ if (ev.key === 'Escape'){ hideQuotePopup(); } };
      }
      document.addEventListener('keydown', modal.__escHandler);
    }

    function updatePriceAndJSON(){
      const qty = getCurrentQty();
      const calc = computeTotalForQty(qty);
      const expressEnabled = !!calc.express;
      let leadDays = leadTimeBusinessDays(calc.total_area || 0);
      if (expressEnabled){ leadDays = Math.max(0, leadDays - 1); }
      const finishValue = currentFinishValue();
      const finishLabelText = finishLabel(finishValue);
      const baseline = computeBaselineA(qty);
      let pctSave = 0;
      if (baseline > 0.0001){
        const ratioPct = (calc.total / baseline) * 100;
        pctSave = Math.max(0, 100 - ratioPct);
      }

      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0;

      if (calc.total_area >= 100){
        totalOutEls.forEach((el)=> clearWooPrice(el, 'WYCENA INDYWIDUALNA'));
        totalNetOutEls.forEach((el)=> clearWooPrice(el, ''));
        totalVatOutEls.forEach((el)=> clearWooPrice(el, ''));
        totalUnitOutEls.forEach((el)=> clearWooPrice(el, ''));
      } else {
        totalOutEls.forEach((el)=> renderWooPrice(el, calc.total));
        totalNetOutEls.forEach((el)=>{
          if (!el) return;
          if (el.dataset && el.dataset.stbNetPlain === '1'){
            renderWooPrice(el, calc.net);
            return;
          }
          const prefix = (el.dataset && el.dataset.stbNetPrefix) ? String(el.dataset.stbNetPrefix) : 'Netto:';
          const opts = prefix ? { prefix } : {};
          renderWooPrice(el, calc.net, opts);
        });
        const vatAmount = Math.max(0, calc.total - calc.net);
        totalVatOutEls.forEach((el)=>{
          if (!el) return;
          const label = (el.dataset && el.dataset.stbVatLabel) ? String(el.dataset.stbVatLabel) : 'VAT (23%):';
          const opts = label ? { prefix: label } : {};
          renderWooPrice(el, vatAmount, opts);
        });
        if (safeQty > 0){
          const unitNet = calc.net / safeQty;
          totalUnitOutEls.forEach((el)=> renderWooPrice(el, unitNet));
        } else {
          totalUnitOutEls.forEach((el)=> clearWooPrice(el, ''));
        }
      }
      const saveText = (pctSave >= 0.5) ? ('Oszczędzasz ' + Math.round(pctSave) + '%') : '';
      totalSaveOutEls.forEach((el)=>{ el.textContent = saveText; });

      const w_cm=parseNum(wEl,10), h_cm=parseNum(hEl,10);
      if (sumDims)  sumDims.textContent = `${(w_cm).toString().replace('.',',')} × ${(h_cm).toString().replace('.',',')} cm`;
      if (sumQty)   sumQty.textContent  = `${qty} szt.`;
      if (calc.total_area >= 100){
        if (sumTotal) clearWooPrice(sumTotal, 'WYCENA INDYWIDUALNA');
        if (sumNet) clearWooPrice(sumNet, '');
      } else {
        if (sumTotal) renderWooPrice(sumTotal, calc.total);
        if (sumNet) renderWooPrice(sumNet, calc.net, { suffix: 'netto' });
      }

      updateSummaryMeta(calc);

      // Popup jeśli >= 100 m2
      if (calc.total_area >= 100){
        showQuotePopup();
      } else {
        hideQuotePopup();
      }

      // Payload do Woo (w PLN)
      const form = document.querySelector('form.cart');
      if (form){
        let hidden = form.querySelector(`input[name="${FIELD}"]`);
        if (!hidden){ hidden = document.createElement('input'); hidden.type='hidden'; hidden.name=FIELD; form.appendChild(hidden); }
        const payload = {
          shape,
          ellipse_ratio: +(ellipseRatio).toFixed(3),
          width_cm: w_cm,
          height_cm: h_cm,
          background: colorEl?.value || '#ffffff',
          outline: { enabled: !!outOnEl?.checked, width_mm: parseFloat((outMMEl?.value||0).toString()), color: outColorEl?.value || '#ffffff' },
          corner_factor: +( (shape==='ellipse'||shape==='circle'||shape==='diecut') ? 0 : cornerFactor ).toFixed(4),
          area_m2: +computeAreaM2().toFixed(6),
          quantity: qty,
          total_area_m2: +((computeAreaM2())*qty).toFixed(6),
          rate_per_m2_pln: calc.rate * materialMultiplier(),
          total_price_pln: +calc.total.toFixed(2),
          total_price_net_pln: +calc.net.toFixed(2),
          material: (materialEl && materialEl.value) ? materialEl.value : 'Folia ekonomiczna',
          finish: finishValue,
          finish_label: finishLabelText,
          laminate: !!(laminateEl && laminateEl.checked),
          express_production: expressEnabled,
          express_multiplier: calc.express_multiplier || 1,
          lead_time_business_days: leadDays,
          file: uploaded.name ? { name: uploaded.name, type: uploaded.type, size: uploaded.size, url: uploaded.url || null, upload_id: uploaded.uploadId || null } : null,
          text: {
            value: textObj.text || '',
            font: textObj.font || 'Inter',
            color: textObj.color || '#111111',
            weight: textObj.weight === 'bold' ? 'bold' : 'normal',
            italic: !!textObj.italic,
            scale: +(textObj.scale||1),
            rotDeg: +(textObj.rotDeg||0),
            offsetX: +(textObj.offsetX||0),
            offsetY: +(textObj.offsetY||0)
          },
          qr: {
            enabled: !!qrObj.enabled,
            dark: qrDark?.value || qrObj.dark || '#111111',
            light: qrLight?.value || qrObj.light || '#ffffff',
            ecc: qrECC?.value || qrObj.ecc || 'M',
            quiet: Math.max(0, parseInt(qrQuiet?.value || qrObj.quiet || '4',10)),
            type: qrTypeSel?.value || 'url',
            data: currentQRText(),
            scale: +(qrObj.scale||1),
            rotDeg: +(qrObj.rotDeg||0),
            offsetX: +(qrObj.offsetX||0),
            offsetY: +(qrObj.offsetY||0),
            framePadPct: +(qrObj.framePadPct||0),
            frameRadiusPct: +(qrObj.frameRadiusPct||0)
          },
          preview_png: safePreview()
        };
        if (uploaded.uploadId){ payload.file_upload_id = uploaded.uploadId; }
        if (uploaded.url){ payload.file_url = uploaded.url; }
        if (uploaded.uploadBytes){ payload.file_upload_size = uploaded.uploadBytes; }
        hidden.value = JSON.stringify(payload);
      }
    }

    /* ===== Rozmiary & ilość + edycje inline ===== */
    if (sizeList) sizeList.addEventListener('click', (e)=>{
      const item = e.target.closest('.opt-item[data-w][data-h]'); if(!item) return;
      if (sizeCustom) sizeCustom.classList.add('is-hidden');
      $$('.opt-item[data-w]', sizeList).forEach(b=>b.setAttribute('aria-pressed','false'));
      item.setAttribute('aria-pressed','true');
      if (wEl) wEl.value = String(parseFloat(item.getAttribute('data-w')) || 10);
      if (hEl) hEl.value = String(parseFloat(item.getAttribute('data-h')) || 10);
      if (uploaded.img){
        updateFileMeta(uploaded.img.width, uploaded.img.height, uploaded.type, uploaded.size,
          uploaded.pdf ? `PDF • ${(uploaded.pdf.numPages||1)} str.` : '');
      }
      rebuildQR(); requestDraw();
    });
    if (sizeCustomToggle) sizeCustomToggle.addEventListener('click', ()=>{
      if (!sizeList || !sizeCustom) return;
      $$('.opt-item[data-w]', sizeList).forEach(b=>b.setAttribute('aria-pressed','false'));
      sizeCustom.classList.toggle('is-hidden'); requestDraw();
    });
    const sizeCustomBox = byId('sizeCustom');
    if (sizeCustomBox) sizeCustomBox.addEventListener('input', (e)=>{
      if (e.target.matches('input')){
        if (uploaded.img){
          updateFileMeta(uploaded.img.width, uploaded.img.height, uploaded.type, uploaded.size,
            uploaded.pdf ? `PDF • ${(uploaded.pdf.numPages||1)} str.` : '');
        }
        rebuildQR(); requestDraw();
      }
    });

    if (qtyList) qtyList.addEventListener('click', (e)=>{
      const item = e.target.closest('.opt-item[data-qty]'); if(!item) return;
      if (qtyCustom) qtyCustom.classList.add('is-hidden');
      $$('.opt-item[data-qty]', qtyList).forEach(b=>b.setAttribute('aria-pressed','false'));
      item.setAttribute('aria-pressed','true');
      refreshQtyPrices(); updatePriceAndJSON(); requestDraw();
    });
    if (qtyCustomToggle) qtyCustomToggle.addEventListener('click', ()=>{
      if (!qtyList || !qtyCustom) return;
      $$('.opt-item[data-qty]', qtyList).forEach(b=>b.setAttribute('aria-pressed','false'));
      qtyCustom.classList.toggle('is-hidden'); refreshQtyPrices(); updatePriceAndJSON(); requestDraw();
    });
    if (qtyEl) qtyEl.addEventListener('input', ()=>{ refreshQtyPrices(); updatePriceAndJSON(); });

    function show(el){ if(el) el.classList.remove('is-hidden'); }
    function hide(el){ if(el) el.classList.add('is-hidden'); }

    if (sumDims){
      sumDims.addEventListener('click', ()=>{
        if (!sumSizeBox || !sumW || !sumH) return;
        sumW.value = String(parseNum(wEl,10));
        sumH.value = String(parseNum(hEl,10));
        show(sumSizeBox); sumW.focus(); sumW.select();
      });
    }
    const onSizeInput = ()=>{
      const w = Math.max(1, parseFloat(sumW.value||'10'));
      const h = Math.max(1, parseFloat(sumH.value||'10'));
      if (wEl) wEl.value = String(w);
      if (hEl) hEl.value = String(h);
      if (sizeList){ $$('.opt-item[data-w]', sizeList).forEach(b=>b.setAttribute('aria-pressed','false')); }
      if (uploaded.img){
        updateFileMeta(uploaded.img.width, uploaded.img.height, uploaded.type, uploaded.size,
          uploaded.pdf ? `PDF • ${(uploaded.pdf.numPages||1)} str.` : '');
      }
      rebuildQR(); requestDraw();
    };
    if (sumW) sumW.addEventListener('input', onSizeInput);
    if (sumH) sumH.addEventListener('input', onSizeInput);

    if (sumQty){
      sumQty.addEventListener('click', ()=>{
        if (!sumQtyBox || !sumQtyInp) return;
        sumQtyInp.value = String(getCurrentQty());
        show(sumQtyBox); sumQtyInp.focus(); sumQtyInp.select();
      });
    }
    if (sumQtyInp){
      sumQtyInp.addEventListener('input', ()=>{
        const q = Math.max(1, Math.floor(parseFloat(sumQtyInp.value||'1')));
        if (qtyCustom) qtyCustom.classList.remove('is-hidden');
        if (qtyEl) qtyEl.value = String(q);
        if (qtyList){ $$('.opt-item[data-qty]', qtyList).forEach(b=>b.setAttribute('aria-pressed','false')); }
        refreshQtyPrices(); updatePriceAndJSON();
      });
    }

    document.addEventListener('click', (e)=>{
      if (sumSizeBox && !sumSizeBox.contains(e.target) && e.target!==sumDims) hide(sumSizeBox);
      if (sumQtyBox  && !sumQtyBox.contains(e.target)  && e.target!==sumQty)  hide(sumQtyBox);
    });

    /* ===== Toolbar ===== */
    function toolbarTarget(){
      if (lastToolTarget==='image' && uploaded.img) return 'image';
      if (lastToolTarget==='text' && hasText()) return 'text';
      if (lastToolTarget==='qr' && qrObj.enabled) return 'qr';
      return defaultToolTarget();
    }
    function applyZoom(delta){
      const tgt = toolbarTarget();
      setToolTarget(tgt);
      if (tgt==='qr'){
        const ns = (qrObj.scale || 1) * (1 + delta);
        qrObj.scale = Math.max(0.1, Math.min(6, ns));
      } else if (tgt==='text'){
        const ns = (textObj.scale || 1) * (1 + delta);
        textObj.scale = Math.max(0.1, Math.min(6, ns));
        updateTextSizeUI();
      } else {
        const ns = (transform.scale || 1) * (1 + delta);
        transform.scale = Math.max(0.1, Math.min(6, ns));
      }
      requestDraw();
    }
    function applyRotate(deltaDeg){
      const tgt = toolbarTarget();
      setToolTarget(tgt);
      if (tgt==='qr'){
        qrObj.rotDeg = (qrObj.rotDeg || 0) + deltaDeg;
      } else if (tgt==='text'){
        textObj.rotDeg = (textObj.rotDeg || 0) + deltaDeg;
      } else {
        transform.rotDeg = (transform.rotDeg || 0) + deltaDeg;
      }
      requestDraw();
    }
    function applyFit(){
      const tgt = toolbarTarget();
      setToolTarget(tgt);
      if (tgt==='qr'){
        qrObj.offsetX = 0; qrObj.offsetY = 0; qrObj.scale = 1; qrObj.rotDeg = 0;
      } else if (tgt==='text'){
        textObj.offsetX = 0; textObj.offsetY = 0; textObj.scale = 1; textObj.rotDeg = 0;
        updateTextSizeUI();
      } else {
        transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 };
      }
      requestDraw();
    }

    function deleteCurrentTarget(){
      const tgt = toolbarTarget();
      if (tgt === 'qr'){
        setToolTarget('qr');
        if (qrRemBtn) qrRemBtn.click();
        else {
          qrObj.enabled = false; qrObj.canvas = null;
          if (qrURL) qrURL.value = '';
          if (qrWifiSSID) qrWifiSSID.value = '';
          if (qrWifiPass) qrWifiPass.value = '';
          if (qrWifiHidden) qrWifiHidden.checked = false;
          setToolTarget(null);
          syncQRStateFromInputs();
        }
        return;
      }
      if (tgt === 'text'){
        setToolTarget('text');
        textObj = defaultTextObj();
        if (textInput) textInput.value='';
        updateTextStyleButtons();
        setToolTarget(null);
        requestDraw();
        return;
      }
      if (uploaded.img){
        clearImage();
      }
    }

    if (tbZoomOut) tbZoomOut.addEventListener('click', ()=> applyZoom(-0.1));
    if (tbZoomIn)  tbZoomIn .addEventListener('click', ()=> applyZoom(+0.1));
    if (tbRotMinus)tbRotMinus.addEventListener('click', ()=> applyRotate(-5));
    if (tbRotPlus) tbRotPlus .addEventListener('click', ()=> applyRotate(+5));
    if (tbFit)     tbFit    .addEventListener('click', applyFit);
    if (tbGrid)    tbGrid   .addEventListener('click', ()=>{ gridOn=!gridOn; requestDraw(); });
    if (tbDelete)  tbDelete .addEventListener('click', deleteCurrentTarget);

    /* ===== PDF 300 DPI ===== */
    let exportQRPromises = [];

    function renderExportBase(ctx2, W, H, bgCol){
      ctx2.clearRect(0,0,W,H);
      const fill = bgCol || '#ffffff';
      if (shape === 'diecut'){
        ctx2.fillStyle = fill;
        ctx2.fillRect(0,0,W,H);
        return;
      }
      ctx2.save();
      exportShapePath(ctx2, { x:0, y:0, w:W, h:H });
      ctx2.fillStyle = fill;
      ctx2.fill();
      ctx2.restore();
    }
    function exportShapeClip(ctx2, W, H, drawFn){
      ctx2.save();
      exportShapePath(ctx2, { x:0, y:0, w:W, h:H });
      ctx2.clip();
      try{ drawFn(); }
      finally{ ctx2.restore(); }
    }

    async function exportPDF300(){
      try{
        if (!PDFLib){ alert('Brak biblioteki PDF (PDF-Lib). Upewnij się, że assets/vendor/pdf-lib.min.js jest załadowany.'); return; }
        showPdfProgress(true); setPdfProgress(8);

        const w_cm = parseNum(wEl,10), h_cm = parseNum(hEl,10);
        const DPI  = 300;
        const w_in = w_cm/2.54, h_in = h_cm/2.54;
        let pxW = Math.round(w_in * DPI);
        let pxH = Math.round(h_in * DPI);

        const MAX_SIDE = 8000;
        const clampK = Math.min(1, MAX_SIDE / Math.max(pxW, pxH));
        if (clampK < 1){
          pxW = Math.round(pxW*clampK);
          pxH = Math.round(pxH*clampK);
          alert('Aby zachować stabilność przeglądarki, obraz został delikatnie przeskalowany (limit rozmiaru).');
        }

        setPdfProgress(55);

        const off = document.createElement('canvas');
        off.width = pxW; off.height = pxH;
        const octx = off.getContext('2d', { willReadFrequently: false });
        octx.imageSmoothingEnabled = false;

        renderExportBase(octx, pxW, pxH, colorEl?.value || '#ffffff');

        const rPrev = getDrawRect();
        const kx = pxW/(rPrev.w||1);
        const ky = pxH/(rPrev.h||1);

        // grafika
        if (uploaded.img){
          if (shape==='diecut'){
            exportShapeClip(octx, pxW, pxH, ()=>{
              const outlineEnabled = !!outOnEl?.checked;
              const outlineMM = Math.max(0, parseFloat(outMMEl?.value||'3'));
              const ringPxPrev = outlineEnabled ? (pxPerCm(rPrev) * (outlineMM/10)) : 0;
              const ringPxOut  = ringPxPrev > 0 ? Math.max(1, Math.round(ringPxPrev * ((kx+ky)/2))) : 0;

              const iw = uploaded.img.width, ih = uploaded.img.height;
              const basePrev = Math.max(rPrev.w/iw, rPrev.h/ih);

              const fit = diecutSafePlacement(rPrev, uploaded.img, (transform.scale||1), (transform.rotDeg||0), ringPxPrev, 2);
              const effScale = fit.scale;

              const dwPrev = Math.max(1, Math.round(iw * basePrev * effScale));
              const dhPrev = Math.max(1, Math.round(ih * basePrev * effScale));

              const dwExport = Math.max(1, Math.round(dwPrev * ((kx+ky)/2)));
              const dhExport = Math.max(1, Math.round(dhPrev * ((kx+ky)/2)));

              let ringCanvas = null;
              let ringHighlight = null;
              let pad = 0;
              if (ringPxOut > 0){
                const mask = document.createElement('canvas');
                mask.width = dwExport; mask.height = dhExport;
                const mctx = mask.getContext('2d');
                mctx.imageSmoothingEnabled = false;
                mctx.drawImage(uploaded.img, 0, 0, dwExport, dhExport);

                let maskReady = true;
                try {
                  const imgData = mctx.getImageData(0, 0, dwExport, dhExport);
                  const buf = imgData.data;
                  let hasOpaque = false;
                  for (let i = 0; i < buf.length; i += 4){
                    const alpha = buf[i + 3];
                    if (alpha > 0){
                      buf[i] = 255; buf[i + 1] = 255; buf[i + 2] = 255; buf[i + 3] = 255;
                      hasOpaque = true;
                    } else {
                      buf[i] = 0; buf[i + 1] = 0; buf[i + 2] = 0; buf[i + 3] = 0;
                    }
                  }
                  if (hasOpaque){
                    mctx.putImageData(imgData, 0, 0);
                  } else {
                    maskReady = false;
                  }
                } catch(err){
                  console.warn('diecut export mask read failed', err);
                  maskReady = false;
                }

                if (maskReady){
                  const ringColor = outColorEl?.value || '#ff0000';
                  ringCanvas = buildRingFromMask(mask, ringPxOut, ringColor);
                  pad = Math.max(1, Math.ceil(ringPxOut));
                  if (needsEdgeHighlight(ringColor, colorEl?.value || '#ffffff')){
                    ringHighlight = document.createElement('canvas');
                    ringHighlight.width = ringCanvas.width;
                    ringHighlight.height = ringCanvas.height;
                    const hctx = ringHighlight.getContext('2d');
                    hctx.imageSmoothingEnabled = true;
                    hctx.filter = 'blur(1.2px)';
                    hctx.drawImage(ringCanvas, 0, 0);
                    hctx.globalCompositeOperation = 'source-in';
                    hctx.fillStyle = 'rgba(0,0,0,0.35)';
                    hctx.fillRect(0, 0, ringHighlight.width, ringHighlight.height);
                    hctx.globalCompositeOperation = 'source-over';
                  }
                }
              }

              const cxPrev = rPrev.x + rPrev.w/2 + fit.clampOffsetX(transform.offsetX||0);
              const cyPrev = rPrev.y + rPrev.h/2 + fit.clampOffsetY(transform.offsetY||0);

              const cx = cxPrev * kx;
              const cy = cyPrev * ky;

              const rot = (transform.rotDeg||0) * Math.PI/180;

              octx.save();
              octx.translate(cx, cy);
              octx.rotate(rot);
              octx.drawImage(uploaded.img, -dwExport/2, -dhExport/2, dwExport, dhExport);
              octx.restore();

              if (ringHighlight){
                octx.save();
                octx.translate(cx, cy);
                octx.rotate(rot);
                octx.globalAlpha = 0.55;
                octx.drawImage(ringHighlight, -(dwExport/2 + pad), -(dhExport/2 + pad), dwExport + 2*pad, dhExport + 2*pad);
                octx.restore();
              }

              if (ringCanvas){
                octx.save();
                octx.translate(cx, cy);
                octx.rotate(rot);
                octx.drawImage(ringCanvas, -(dwExport/2 + pad), -(dhExport/2 + pad), dwExport + 2*pad, dhExport + 2*pad);
                octx.restore();
              }
            });
          } else {
            exportShapeClip(octx, pxW, pxH, ()=>{
              const iw=uploaded.img.width, ih=uploaded.img.height;
              const base=Math.max(pxW/iw, pxH/ih)*(transform.scale||1);
              const dw=iw*base, dh=ih*base;
              const cx=pxW/2 + (transform.offsetX||0)*kx;
              const cy=pxH/2 + (transform.offsetY||0)*ky;
              octx.save();
              octx.translate(cx, cy);
              octx.rotate(((transform.rotDeg||0)*Math.PI)/180);
              octx.drawImage(uploaded.img, -dw/2, -dh/2, dw, dh);
              octx.restore();
            });
          }
        }

        // tekst
        if (textObj.text && textObj.text.trim().length){
          const basePx  = Math.min(pxW, pxH) * 0.18;
          const fontPx  = basePx * (textObj.scale || 1);
          const cx = pxW/2 + (textObj.offsetX || 0)*kx;
          const cy = pxH/2 + (textObj.offsetY || 0)*ky;
          exportShapeClip(octx, pxW, pxH, ()=>{
            octx.save();
            octx.translate(cx, cy);
            octx.rotate(((textObj.rotDeg || 0) * Math.PI)/180);
            octx.textAlign = 'center'; octx.textBaseline = 'middle';
            octx.fillStyle = textObj.color || '#111111';
            octx.font = textFontString(fontPx);
            octx.fillText(textObj.text, 0, 0);
            octx.restore();
          });
        }

        // QR — render w skali eksportu
        if (qrObj.enabled){
          const sidePrev = Math.min(rPrev.w, rPrev.h) * 0.38 * (qrObj.scale || 1);
          const side = Math.max(64, Math.round(sidePrev * ((kx+ky)/2)));
          const content = currentQRText();
          if (content && QRCodeLib){
            const offCanvas = await buildQRCanvas_Davidshim(
              content, side, (qrECC?.value || qrObj.ecc || 'M'),
              (qrDark?.value || qrObj.dark || '#111111'),
              (qrLight?.value || qrObj.light || '#ffffff'),
              Math.max(0, parseInt(qrQuiet?.value || qrObj.quiet || '4', 10))
            );

            const cx = pxW/2 + (qrObj.offsetX||0)*kx;
            const cy = pxH/2 + (qrObj.offsetY||0)*ky;
            const pad = side * (Math.max(0, qrObj.framePadPct || 0) / 100);
            const totalSide = side + pad*2;
            const frameRadius = Math.max(0, (qrObj.frameRadiusPct || 0) / 100) * (totalSide/2);
            const frameColor = qrLight?.value || qrObj.light || '#ffffff';

            exportShapeClip(octx, pxW, pxH, ()=>{
              octx.save();
              octx.translate(cx, cy);
              octx.rotate((qrObj.rotDeg||0) * Math.PI/180);

              if (pad > 0.1){
                roundedRectPath(octx, -totalSide/2, -totalSide/2, totalSide, totalSide, frameRadius);
                octx.fillStyle = frameColor;
                octx.fill();
                octx.lineWidth = Math.max(1, totalSide * 0.012);
                octx.strokeStyle = 'rgba(0,0,0,0.14)';
                roundedRectPath(octx, -totalSide/2, -totalSide/2, totalSide, totalSide, frameRadius);
                octx.stroke();
              }

              octx.drawImage(offCanvas || qrObj.canvas, -side/2, -side/2, side, side);

              octx.restore();
            });
          }
        }

        setPdfProgress(82);

        const pngBlob = await new Promise(res=> off.toBlob(res, 'image/png') );
        const pngBytes = await pngBlob.arrayBuffer();

        const pdf = await PDFLib.PDFDocument.create();
        const wPt = w_in * 72, hPt = h_in * 72;
        const page = pdf.addPage([wPt, hPt]);
        const png = await pdf.embedPng(pngBytes);
        page.drawImage(png, { x:0, y:0, width:wPt, height:hPt });

        setPdfProgress(95);
        const pdfBytes = await pdf.save({ useObjectStreams: false });
        setPdfProgress(100);

        const blob = new Blob([pdfBytes], {type:'application/pdf'});
        const name = `naklejka_${String(w_cm).replace('.',',')}x${String(h_cm).replace('.',',')}cm_${DPI}dpi.pdf`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); showPdfProgress(false); setPdfProgress(0); }, 1200);
      }catch(err){
        console.error('PDF export error:', err);
        alert('Nie udało się wygenerować PDF (szczegóły w konsoli).');
        showPdfProgress(false); setPdfProgress(0);
      }
    }
    if (tbPDF) tbPDF.addEventListener('click', exportPDF300);

    /* ===== Koszyk ===== */
    const handleAddToCart = ()=>{
      const form = document.querySelector('form.cart');
      if (!form){ alert('Nie znaleziono formularza koszyka.'); return; }
      updatePriceAndJSON();
      let goCart = form.querySelector('input[name="stb_go_cart"]');
      if (!goCart) { goCart = document.createElement('input'); goCart.type='hidden'; goCart.name='stb_go_cart'; form.appendChild(goCart); }
      goCart.value = '1';
      if (window.jQuery) {
        const $ = window.jQuery;
        $(document.body).off('.stbGoCart');
        $(document.body).on('added_to_cart.stbGoCart', function(){
          if (CART_URL) window.location.href = CART_URL;
        });
      }
      const wooBtn = form.querySelector('.single_add_to_cart_button');
      if (wooBtn){ wooBtn.click(); } else { form.submit(); }
    };
    if (addBtn)      addBtn.addEventListener('click', handleAddToCart);

    /* ===== Waluty ===== */
    let lastCurrencySignature = null;

    function captureCurrencySignature(){
      const curr = currentCurrency();
      const rate = (curr && typeof curr.rate === 'number' && Number.isFinite(curr.rate)) ? curr.rate : '';
      return [
        curr && curr.code ? curr.code : '',
        curr && curr.symbol ? curr.symbol : '',
        curr && curr.position ? curr.position : '',
        curr && curr.locale ? curr.locale : '',
        rate === '' ? '' : String(rate)
      ].join('|');
    }

    function applyCurrencyRefresh(){
      refreshQtyPrices();
      updatePriceAndJSON();
    }

    function ensureCurrencySync(force){
      const signature = captureCurrencySignature();
      if (!force && signature === lastCurrencySignature){ return; }
      applyCurrencyRefresh();
      lastCurrencySignature = captureCurrencySignature();
    }

    function refreshCurrencyUI(){
      applyCurrencyRefresh();
      lastCurrencySignature = captureCurrencySignature();
    }

    const currencyEvents = [
      'stb:currency-change',
      'stb:update-currency',
      'stbCurrencyChange',
      'woocommerce_currency_set',
      'currency_switcher_refreshed',
      'woocs_currency_changed',
      'woocs_conversion_done'
    ];

    const handleCurrencyEvent = ()=>{
      ensureCurrencySync(true);
      window.setTimeout(()=> ensureCurrencySync(), 25);
      window.setTimeout(()=> ensureCurrencySync(), 200);
    };

    currencyEvents.forEach(evt=>{
      window.addEventListener(evt, handleCurrencyEvent, true);
      document.addEventListener(evt, handleCurrencyEvent, true);
    });

    if (window.jQuery && typeof window.jQuery === 'function'){
      try {
        window.jQuery(document).on('woocs_currency_changed woocs_conversion_done woocs_rates_updated', handleCurrencyEvent);
      } catch(err){
        console.error('WOOCS hook error:', err);
      }
    }

    if (typeof window.STB_refreshCurrency === 'function'){
      const prevCurrencyHook = window.STB_refreshCurrency;
      window.STB_refreshCurrency = function(){
        try { prevCurrencyHook.apply(window, arguments); }
        catch(err){ console.error('STB_refreshCurrency legacy hook error:', err); }
        handleCurrencyEvent();
      };
    } else {
      window.STB_refreshCurrency = handleCurrencyEvent;
    }

    if (typeof window.woocs_set_currency === 'function'){
      const prevWoocsSet = window.woocs_set_currency;
      window.woocs_set_currency = function(){
        const result = prevWoocsSet.apply(this, arguments);
        handleCurrencyEvent();
        return result;
      };
    }

    let currencyObserverBody = null;
    let currencyObserverHtml = null;

    if (window.MutationObserver){
      const observerCfg = { attributes:true, attributeFilter:['data-woocs-currency','data-woocs-rate','data-currency','data-woocs-symbol'] };
      if (document.body){
        currencyObserverBody = new MutationObserver(handleCurrencyEvent);
        currencyObserverBody.observe(document.body, observerCfg);
      }
      if (document.documentElement){
        currencyObserverHtml = new MutationObserver(handleCurrencyEvent);
        currencyObserverHtml.observe(document.documentElement, observerCfg);
      }
    }

    const currencyPollId = window.setInterval(()=> ensureCurrencySync(), 1500);
    window.addEventListener('focus', ()=> window.setTimeout(()=> ensureCurrencySync(), 30));
    window.addEventListener('beforeunload', ()=>{
      if (currencyObserverBody){ currencyObserverBody.disconnect(); currencyObserverBody = null; }
      if (currencyObserverHtml){ currencyObserverHtml.disconnect(); currencyObserverHtml = null; }
      if (currencyPollId){ window.clearInterval(currencyPollId); }
    });

    /* ===== Modal ===== */
    const modal = byId('stb-modal');
    const modalContent = modal ? modal.querySelector('.stb-modal__content') : null;
    const modalMain = byId('stb-modal-main');
    const openBtn = byId('stb-open-modal');
    const closeBtn = byId('stb-close-modal');
    const backdrop = modal ? modal.querySelector('[data-close]') : null;
    const designer = document.querySelector('#stb-root .designer');
    const placeholder = document.createElement('div'); placeholder.id='stb-designer-placeholder';

    function ensureModalInBody(){
      if (modal && modal.parentNode !== document.body){
        document.body.appendChild(modal);
      }
    }
    function openModal(){
      ensureModalInBody();
      const host = modalMain || modalContent;
      if (!modal || !host || !designer) return;
      if (!placeholder.parentNode){ designer.parentNode.insertBefore(placeholder, designer); }
      host.appendChild(designer);
      window.scrollTo(0,0);
      const sb = window.innerWidth - document.documentElement.clientWidth;
      if (sb>0) document.body.style.paddingRight = sb + 'px';
      modal.setAttribute('aria-hidden','false');
      document.body.classList.add('stb-lock');
      setTimeout(()=>{ requestDraw(); refreshQtyPrices(); updatePriceAndJSON(); },50);
      document.addEventListener('keydown', onEsc);
    }
    function closeModal(){
      if (!modal || !designer) return;
      if (placeholder.parentNode){ placeholder.parentNode.insertBefore(designer, placeholder.nextSibling); placeholder.remove(); }
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('stb-lock');
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', onEsc);
      setTimeout(()=>{ requestDraw(); refreshQtyPrices(); updatePriceAndJSON(); },50);
    }
    function onEsc(e){ if (e.key==='Escape') closeModal(); }
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    /* ===== Start ===== */
    initAccordions();
    if (!wEl){ wEl=document.createElement('input'); wEl.type='number'; wEl.value='10'; wEl.id='stb-w'; wEl.style.display='none'; document.body.appendChild(wEl); }
    if (!hEl){ hEl=document.createElement('input'); hEl.type='number'; hEl.value='10'; hEl.id='stb-h'; hEl.style.display='none'; document.body.appendChild(hEl); }
    if (ellipseVal) ellipseVal.textContent = Math.round((ellipseRatio||1)*100)+'%';
    if (cornerEl){ cornerEl.value = String(Math.round(cornerFactor*100)); }

    if (delBtn){ delBtn.disabled = true; delBtn.style.opacity = '.6'; }
    if (document.fonts && document.fonts.ready){ document.fonts.ready.then(()=> requestDraw() ).catch(()=>{}); }

    refreshQtyPrices();
    updatePriceAndJSON();
    lastCurrencySignature = captureCurrencySignature();
    requestDraw();

    if (!QRCodeLib) console.warn('Uwaga: biblioteka QR (davidshimjs) nie została wykryta.');
    if (!PDFLib) console.warn('Uwaga: biblioteka PDF-Lib nie została wykryta — eksport PDF nie zadziała.');
  });
})();
