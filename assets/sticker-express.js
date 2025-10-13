(function(){
  document.addEventListener('DOMContentLoaded', function(){
    "use strict";

    const root = document.getElementById('stb-express-root');
    if (!root) return;

    const TIMEZONE = 'Europe/Warsaw';
    const VAT_RATE = 0.23;

    function parseConfig(){
      const raw = root.dataset.expressConfig;
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch(err){
        console.error('[sticker-express] Nie można zdekodować konfiguracji', err);
        return {};
      }
    }

    const config = parseConfig();
    const state = {
      preset:null,
      quantity:null,
      express:true,
      file:null
    };

    const presetList    = root.querySelector('[data-express-preset-list]');
    const stepSection   = root.querySelector('[data-express-step]');
    const qtyList       = root.querySelector('[data-express-qty-list]');
    const toggle        = root.querySelector('#stb-express-toggle');
    const etaEl         = root.querySelector('[data-express-eta]');
    const priceEl       = root.querySelector('[data-express-price]');
    const priceNetEl    = root.querySelector('[data-express-price-net]');
    const payloadField  = root.querySelector('[data-express-payload]');
    const errorEl       = root.querySelector('[data-express-error]');
    const fileInput     = root.querySelector('[data-express-file]');
    const preflightList = root.querySelector('[data-express-preflight]');
    const backBtn       = root.querySelector('[data-express-back]');
    const form          = root.querySelector('[data-express-form]');
    const heroDeadline  = root.querySelector('[data-express-hero-deadline]');
    const nameEl        = root.querySelector('[data-express-selected-name]');
    const sizeEl        = root.querySelector('[data-express-selected-size]');
    const materialEl    = root.querySelector('[data-express-selected-material]');

    const allowedExt = Array.isArray(config.uploadExtensions) ? config.uploadExtensions.map(ext => String(ext).toLowerCase()) : ['pdf','ai','eps','svg'];
    const expressSurcharge = Number(config.expressSurcharge) || 0;

    function escapeHtml(value){
      if (value == null) return '';
      return String(value).replace(/[&<>"']/g, function(ch){
        switch(ch){
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          default: return '&#039;';
        }
      });
    }

    function currencyContext(){
      if (!config || typeof config.currency !== 'object') return { code:'PLN', symbol:'zł', position:'right', rate:1, locale:'pl-PL' };
      const ctx = Object.assign({ code:'PLN', symbol:'zł', position:'right', rate:1, locale:'pl-PL' }, config.currency);
      if (typeof ctx.code !== 'string' || !ctx.code){ ctx.code = 'PLN'; }
      if (typeof ctx.symbol !== 'string' || !ctx.symbol){ ctx.symbol = ctx.code; }
      const rate = Number(ctx.rate);
      ctx.rate = Number.isFinite(rate) && rate > 0 ? rate : 1;
      if (typeof ctx.position !== 'string' || !ctx.position){ ctx.position = 'right'; }
      if (typeof ctx.locale !== 'string' || !ctx.locale){ ctx.locale = 'pl-PL'; }
      return ctx;
    }

    const currency = currencyContext();

    function formatPrice(amount){
      const base = Number(amount);
      const converted = Number.isFinite(base) ? base * currency.rate : 0;
      let numberStr;
      try {
        numberStr = new Intl.NumberFormat(currency.locale, { minimumFractionDigits:2, maximumFractionDigits:2 }).format(converted);
      } catch(err){
        numberStr = converted.toFixed(2);
      }
      const symbol = currency.symbol || currency.code || 'PLN';
      const position = String(currency.position || 'right').toLowerCase();
      const hasSpace = position.includes('space');
      const spacer = hasSpace ? '&nbsp;' : '';
      const numberHtml = escapeHtml(numberStr);
      const symbolHtml = `<span class="woocommerce-Price-currencySymbol">${escapeHtml(symbol)}</span>`;
      let body;
      if (position.startsWith('left')){
        body = `${symbolHtml}${spacer}${numberHtml}`;
      } else if (position.startsWith('right')){
        body = `${numberHtml}${spacer}${symbolHtml}`;
      } else {
        body = `${numberHtml}${spacer}${symbolHtml}`;
      }
      return `<span class="woocommerce-Price-amount amount"><bdi>${body}</bdi></span>`;
    }

    function pushEvent(name, detail){
      if (!name) return;
      const eventName = detail && detail.event ? detail.event : name;
      const payload = Object.assign({ event: eventName }, detail || {});
      if (Array.isArray(window.dataLayer)){
        window.dataLayer.push(payload);
      } else {
        window.dataLayer = [ payload ];
      }
    }

    function toTimeZone(date, timeZone){
      const input = date instanceof Date ? new Date(date.getTime()) : new Date(date);
      if (Number.isNaN(input.getTime())) return new Date();
      const parts = new Date(input.toLocaleString('en-US', { timeZone }));
      const diff = input.getTime() - parts.getTime();
      return new Date(input.getTime() - diff);
    }

    function isWeekend(date){
      const day = date.getDay();
      return day === 0 || day === 6;
    }

    function ensureBusiness(date){
      const d = new Date(date.getTime());
      while (isWeekend(d)){
        d.setDate(d.getDate() + 1);
      }
      return d;
    }

    function nextBusinessDay(date){
      const d = new Date(date.getTime());
      do {
        d.setDate(d.getDate() + 1);
      } while (isWeekend(d));
      return d;
    }

    function computeExpressShipDate(options){
      const opts = options || {};
      const expressEnabled = opts.expressEnabled !== false;
      let order = toTimeZone(opts.baseDate || new Date(), TIMEZONE);
      order = ensureBusiness(order);

      if (opts.assumeCutoff && order.getHours() >= 12){
        order = ensureBusiness(nextBusinessDay(order));
        order.setHours(9, 0, 0, 0);
      }

      const cutoff = new Date(order.getTime());
      cutoff.setHours(12, 0, 0, 0);

      let ship = nextBusinessDay(order);
      if (order.getTime() > cutoff.getTime()){
        ship = nextBusinessDay(ship);
      }

      if (!expressEnabled){
        ship = nextBusinessDay(ship);
      }

      ship = ensureBusiness(ship);
      ship.setHours(9, 0, 0, 0);
      return ship;
    }

    function formatShortDate(date){
      try {
        const formatter = new Intl.DateTimeFormat('pl-PL', {
          timeZone: TIMEZONE,
          weekday: 'short',
          day: '2-digit',
          month: '2-digit'
        });
        const parts = formatter.formatToParts(date);
        let weekday = '';
        let day = '';
        let month = '';
        parts.forEach(function(part){
          if (part.type === 'weekday'){ weekday = part.value; }
          if (part.type === 'day'){ day = part.value; }
          if (part.type === 'month'){ month = part.value; }
        });
        weekday = weekday.replace(/\.$/, '').replace(/\s+/g, '');
        if (!weekday){
          const fallback = formatter.format(date).split(',')[0] || '';
          weekday = fallback.replace(/\.$/, '').trim();
        }
        const tidyWeekday = weekday || '';
        const tidyDay = day || String(date.getDate()).padStart(2, '0');
        const tidyMonth = month || String(date.getMonth() + 1).padStart(2, '0');
        return `${tidyWeekday}, ${tidyDay}.${tidyMonth}`;
      } catch(err){
        const weekdays = ['nd', 'pon', 'wt', 'śr', 'czw', 'pt', 'sob'];
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        return `${weekdays[date.getDay()]}, ${dd}.${mm}`;
      }
    }

    function formatEta(shipDate, expressEnabled){
      const tidy = formatShortDate(shipDate);
      if (expressEnabled){
        return `Wysyłka: ${tidy} • Dostawa +1 dzień`;
      }
      return `Standard: ${tidy} • Dostawa +1–2 dni`;
    }

    function updateHeroDeadline(){
      if (!heroDeadline) return;
      const ship = computeExpressShipDate({ assumeCutoff:true, expressEnabled:true });
      heroDeadline.textContent = formatShortDate(ship);
    }

    function presetButtons(){
      if (!presetList) return [];
      return Array.from(presetList.querySelectorAll('.stb-express-preset'));
    }

    function highlightPreset(id){
      presetButtons().forEach(btn => {
        if (!(btn instanceof HTMLElement)) return;
        const match = btn.dataset.presetId === id;
        btn.classList.toggle('is-active', match);
        btn.setAttribute('aria-pressed', match ? 'true' : 'false');
      });
    }

    function renderQuantities(preset){
      if (!qtyList) return;
      qtyList.innerHTML = '';
      if (!preset || !Array.isArray(preset.quantities)) return;
      preset.quantities.forEach((qty)=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'stb-express-qty__btn';
        btn.textContent = `${qty} szt.`;
        btn.dataset.qty = String(qty);
        btn.setAttribute('aria-pressed', state.quantity === qty ? 'true' : 'false');
        btn.addEventListener('click', function(){
          selectQuantity(qty);
        });
        qtyList.appendChild(btn);
      });
    }

    function computeBaseTotal(preset, quantity){
      if (!preset) return 0;
      const idx = Array.isArray(preset.quantities) ? preset.quantities.indexOf(quantity) : -1;
      const multiplier = Array.isArray(preset.multipliers) && idx >= 0 ? Number(preset.multipliers[idx]) : 1;
      const basePrice = Number(preset.basePrice) || 0;
      const factor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
      return basePrice * factor;
    }

    function computeTotals(){
      if (!state.preset || !state.quantity) return null;
      const baseTotal = computeBaseTotal(state.preset, state.quantity);
      let gross = baseTotal;
      if (state.express){
        gross = baseTotal * (1 + expressSurcharge);
      }
      const net = gross / (1 + VAT_RATE);
      return { base: baseTotal, gross, net };
    }

    function updatePrice(){
      const totals = computeTotals();
      if (!totals){
        if (priceEl) priceEl.textContent = '—';
        if (priceNetEl) priceNetEl.textContent = '';
        return;
      }
      if (priceEl){
        priceEl.innerHTML = formatPrice(totals.gross);
      }
      if (priceNetEl){
        priceNetEl.innerHTML = `<span class="stb-price-prefix">Netto:</span> ${formatPrice(totals.net)}`;
      }
    }

    function updateEta(){
      if (!etaEl) return;
      if (!state.preset || !state.quantity){
        etaEl.textContent = 'Wysyłka: —';
        return;
      }
      const ship = computeExpressShipDate({ expressEnabled: state.express });
      etaEl.textContent = formatEta(ship, state.express);
    }

    function updatePreflight(file){
      if (!preflightList) return;
      preflightList.innerHTML = '';
      const items = [];
      if (file){
        const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
        const ok = allowedExt.includes(ext);
        items.push({
          status: ok ? 'ok' : 'fail',
          text: ok ? `Format: ${ext.toUpperCase()} — OK` : `Format ${ext ? ext.toUpperCase() : '—'} nieobsługiwany`
        });
      } else {
        items.push({ status:'warn', text:'Dodaj plik w PDF / AI / EPS / SVG.' });
      }
      items.push({ status:'info', text:'Sprawdź spad 2 mm i kolory CMYK przed wysyłką.' });
      items.push({ status:'info', text:'Teksty na krzywych, minimalny element ≥15–20 mm.' });

      items.forEach(item => {
        const li = document.createElement('li');
        li.className = `stb-preflight-item is-${item.status}`;
        li.textContent = item.text;
        preflightList.appendChild(li);
      });
    }

    function clearError(){
      if (errorEl) errorEl.textContent = '';
    }

    function showError(message){
      if (errorEl){
        errorEl.textContent = message;
      }
    }

    function selectQuantity(qty){
      state.quantity = qty;
      if (state.preset && Array.isArray(state.preset.quantities)){
        state.preset.quantities.forEach((value)=>{
          const btn = qtyList ? qtyList.querySelector(`[data-qty="${value}"]`) : null;
          if (btn){
            btn.classList.toggle('is-active', value === qty);
            btn.setAttribute('aria-pressed', value === qty ? 'true' : 'false');
          }
        });
      }
      updatePrice();
      updateEta();
      clearError();
    }

    function selectPreset(preset){
      if (!preset) return;
      state.preset = preset;
      state.quantity = Array.isArray(preset.quantities) ? preset.quantities[0] : null;
      state.express = true;
      if (toggle){
        toggle.checked = true;
      }
      if (nameEl) nameEl.textContent = preset.name || '';
      if (sizeEl) sizeEl.textContent = preset.size || '';
      if (materialEl) materialEl.textContent = preset.material || '';
      renderQuantities(preset);
      selectQuantity(state.quantity);
      updateEta();
      updatePrice();
      updatePreflight(state.file);
      highlightPreset(preset.id);
      if (stepSection){
        stepSection.hidden = false;
        stepSection.classList.add('is-active');
        if (typeof stepSection.scrollIntoView === 'function'){
          stepSection.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      }
      pushEvent('stb_express_preset_click', {
        event: config.analyticsPrefix ? `${config.analyticsPrefix}_preset_click` : 'stb_express_preset_click',
        preset_id: preset.id,
        preset_name: preset.name
      });
    }

    if (presetList){
      presetList.addEventListener('click', function(event){
        const target = event.target.closest('.stb-express-preset');
        if (!target) return;
        const raw = target.dataset.preset;
        if (!raw) return;
        try {
          const preset = JSON.parse(raw);
          preset.quantities = Array.isArray(preset.quantities) ? preset.quantities.map(Number) : [];
          preset.multipliers = Array.isArray(preset.multipliers) ? preset.multipliers.map(Number) : [];
          selectPreset(preset);
        } catch(err){
          console.error('[sticker-express] Nie można odczytać preset', err);
        }
      });
    }

    if (backBtn){
      backBtn.addEventListener('click', function(){
        if (stepSection){
          stepSection.hidden = true;
          stepSection.classList.remove('is-active');
        }
        state.preset = null;
        state.quantity = null;
        highlightPreset('');
      });
    }

    if (toggle){
      toggle.addEventListener('change', function(){
        state.express = toggle.checked;
        updatePrice();
        updateEta();
        pushEvent('stb_express_toggle', {
          event: config.analyticsPrefix ? `${config.analyticsPrefix}_toggle` : 'stb_express_toggle',
          express_enabled: state.express
        });
      });
    }

    if (fileInput){
      fileInput.addEventListener('change', function(){
        state.file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
        updatePreflight(state.file);
        pushEvent('stb_express_upload', {
          event: config.analyticsPrefix ? `${config.analyticsPrefix}_upload` : 'stb_express_upload',
          file_name: state.file ? state.file.name : null,
          file_type: state.file ? state.file.type : null
        });
      });
      updatePreflight(null);
    }

    if (form){
      form.addEventListener('submit', function(event){
        clearError();
        if (!state.preset || !state.quantity){
          event.preventDefault();
          showError('Wybierz preset oraz nakład.');
          return;
        }
        if (!state.file){
          event.preventDefault();
          showError('Dodaj plik do druku (PDF, AI, EPS, SVG).');
          return;
        }
        if (!payloadField){
          return;
        }
        const totals = computeTotals();
        const ship = computeExpressShipDate({ expressEnabled: state.express });
        const payload = {
          mode: 'express-48h',
          preset_id: state.preset.id,
          preset_name: state.preset.name,
          size: state.preset.size,
          material: state.preset.material,
          quantity: state.quantity,
          express_enabled: state.express,
          express_surcharge: expressSurcharge,
          base_price_pln: totals ? Number(totals.base) : 0,
          total_price_pln: totals ? Number(totals.gross) : 0,
          eta: {
            label: formatEta(ship, state.express),
            ship_date: ship.toISOString()
          },
          currency: currency,
          upload: state.file ? {
            name: state.file.name,
            size: state.file.size,
            type: state.file.type
          } : null,
          generated_at: new Date().toISOString()
        };
        try {
          payloadField.value = JSON.stringify(payload);
        } catch(err){
          console.error('[sticker-express] Nie można serializować payload', err);
          payloadField.value = '';
        }
        pushEvent('stb_express_add_to_cart', {
          event: config.analyticsPrefix ? `${config.analyticsPrefix}_add_to_cart` : 'stb_express_add_to_cart',
          preset_id: state.preset.id,
          quantity: state.quantity,
          express_enabled: state.express
        });
      });
    }

    updateHeroDeadline();
  });
})();
