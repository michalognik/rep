(function(){
  document.addEventListener('DOMContentLoaded', function(){
    "use strict";

    /* ===== Konfiguracja/zgodność ===== */
    const CURR = (window.STB_CURR) || { code:'PLN', rate:1, symbol:'zł', position:'right', locale:'pl-PL' };
    const FIELD = 'stb_payload';
    const CART_URL = (window.STB_CART_URL || '');

    const PDFLib = window.PDFLib || null;         // eksport PDF
    const QRCodeLib = window.QRCode || null;      // davidshimjs

    /* ===== Shortcuts ===== */
    const $  = (sel, root=document) => root.querySelector(sel);
    const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
    const byId = (id)=> document.getElementById(id);

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

    // Materiał
    const materialEl = byId('stb-material');
    const laminateEl = byId('stb-laminate');

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

    const totalOut    = byId('stb-total');
    const totalNetOut = byId('stb-total-net');
    const addBtn      = byId('stb-add');
    const addBtnModal = byId('stb-add-modal');

    // Toolbar
    const tbZoomOut = byId('tb-zoom-out');
    const tbZoomIn  = byId('tb-zoom-in');
    const tbFit     = byId('tb-fit');
    const tbRotMinus= byId('tb-rot--');
    const tbRotPlus = byId('tb-rot-+');
    const tbGrid    = byId('tb-grid');
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
    const sumLaminateEl = byId('sum-laminate');
    const sumLeadtimeEl = byId('sum-leadtime');

    // Tekst
    const textInput   = byId('stb-text-input');
    const textFontSel = byId('stb-text-font');
    const textColorEl = byId('stb-text-color');
    const textClear   = byId('stb-text-clear');
    const textCenter  = byId('stb-text-center');
    const textReset   = byId('stb-text-reset');

    // QR — proste UI
    const qrAddBtn  = byId('stb-qr-add-btn');
    const qrRemBtn  = byId('stb-qr-remove-btn');
    const qrTypeSel = byId('stb-qr-type');   // url | wifi
    const qrDark    = byId('stb-qr-dark');
    const qrLight   = byId('stb-qr-light');
    const qrECC     = byId('stb-qr-ecc');
    const qrQuiet   = byId('stb-qr-quiet');

    // Dane QR
    const qrURL       = byId('stb-qr-url');
    const qrWifiSSID  = byId('stb-qr-wifi-ssid');
    const qrWifiPass  = byId('stb-qr-wifi-pass');
    const qrWifiAuth  = byId('stb-qr-wifi-auth');
    const qrWifiHidden= byId('stb-qr-wifi-hidden');

    // Obrys QR
    const qrOutlineOn    = byId('stb-qr-outline-on');
    const qrOutlineColor = byId('stb-qr-outline-color');
    const qrOutlineWidth = byId('stb-qr-outline-width');
    const qrOutlineRadius= byId('stb-qr-outline-radius');

    /* ===== Stan ===== */
    const parseNum = (elOrVal, def) => { const v=(typeof elOrVal==='number')?elOrVal:parseFloat(elOrVal?.value); return (isFinite(v)&&v>0)?v:def; };
    let uploaded = { name:null, type:null, size:0, dataURL:null, img:null, pdf:null };
    let transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 }; // GRAFIKA
    let cornerFactor = 0.04; // 4%
    let gridOn = false;

    // shapes: rect|circle|ellipse|triangle|octagon|diecut
    let shape='rect', ellipseRatio=1.0;

    let textObj = { text:'', font:'Inter', color:'#111111', scale:1, rotDeg:0, offsetX:0, offsetY:0 };

    // QR (davidshimjs) – generujemy offscreen canvas
    let qrObj = {
      enabled:false, dark:'#111111', light:'#ffffff', ecc:'M',
      quiet:4, scale:1, rotDeg:0, offsetX:0, offsetY:0,
      outline:{ enabled:false, color:'#111111', widthPct:2, radiusPct:0 },
      canvas:null
    };

    // Ostatni cel toolbara (image/qr)
    let lastToolTarget = 'image';

    /* ===== Akordeony ===== */
    function initAccordions(){
      const container = $('.stb-controls.acc');
      $$('.stb-controls.acc .acc__item').forEach(item=>{
        const head = $('.acc__head', item);
        const body = $('.acc__body', item);
        if (!head || !body) return;

        if (head.getAttribute('aria-expanded') !== 'true') body.setAttribute('hidden','');

        head.addEventListener('click', ()=>{
          const isOpen = head.getAttribute('aria-expanded') === 'true';
          $$('.stb-controls.acc .acc__item').forEach(other=>{
            const h=$('.acc__head',other), b=$('.acc__body',other);
            if (other===item){ return; }
            if (h&&b){ h.setAttribute('aria-expanded','false'); b.setAttribute('hidden',''); }
          });
          if (isOpen){
            head.setAttribute('aria-expanded','false');
            body.setAttribute('hidden','');
          } else {
            head.setAttribute('aria-expanded','true');
            body.removeAttribute('hidden');
            if (container && typeof head.scrollIntoView === 'function'){
              head.scrollIntoView({ block:'nearest', inline:'nearest', behavior:'smooth' });
            }
          }
        });
      });
    }

    /* ===== Utils ===== */
    const fmtMoney = (pln) => {
      const amount = (pln||0) * (CURR.rate || 1);
      try { return new Intl.NumberFormat(CURR.locale || 'pl-PL', {style:'currency', currency: CURR.code || 'PLN'}).format(amount); }
      catch(e){ return (amount||0).toFixed(2) + ' ' + (CURR.code||'PLN'); }
    };
    const prettyBytes = (b)=>{
      if (!isFinite(b) || b<=0) return '';
      const u=['B','KB','MB','GB']; let i=0;
      while(b>=1024 && i<u.length-1){ b/=1024; i++; }
      return (Math.round(b*10)/10)+' '+u[i];
    };
    const quoteFont = (f)=> (/\s/.test(f||'') ? ('"'+f+'"') : (f||''));
    const shapeLabel = (s)=>({ rect:'Prostokąt', circle:'Koło', ellipse:'Elipsa', triangle:'Trójkąt', octagon:'Ośmiokąt', diecut:'DIECUT' }[s] || '—');

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
      if (type==='url')  return (qrURL?.value||'').trim();
      if (type==='wifi'){
        const esc=(s)=> (s||'').replace(/([\\;,:"])/g,'\\$1');
        const ssid=esc(qrWifiSSID?.value), pass=esc(qrWifiPass?.value), auth=(qrWifiAuth?.value||'WPA');
        const hidden = (qrWifiHidden?.checked ? 'H:true;' : '');
        const pwd = (auth==='nopass') ? '' : `P:${pass};`;
        return `WIFI:S:${ssid};T:${auth};${pwd}${hidden};`;
      }
      return '';
    }
    function updateQRTypeUI(){
      const typ = (qrTypeSel?.value || 'url');
      $$('[data-qr-section]').forEach(el=>{ el.hidden = (el.getAttribute('data-qr-section') !== typ); });
      rebuildQR();
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
    function buildRingFromMask(mask, ringPx, color, radiusSoft){
      const w = mask.width, h = mask.height;
      const spread = Math.max(1, Math.ceil(Math.max(0, ringPx || 0)));

      const out = document.createElement('canvas');
      out.width = w + 2*spread;
      out.height = h + 2*spread;
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = false;

      const colored = document.createElement('canvas');
      colored.width = w; colored.height = h;
      const cctx = colored.getContext('2d');
      cctx.imageSmoothingEnabled = false;
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

      const soft = Math.max(0, parseFloat(radiusSoft||0));
      if (soft > 0){
        const tmp = document.createElement('canvas');
        tmp.width = out.width; tmp.height = out.height;
        const tctx = tmp.getContext('2d');
        tctx.imageSmoothingEnabled = false;
        tctx.filter = `blur(${Math.min(20, soft)}px)`;
        tctx.drawImage(out, 0, 0);
        octx.clearRect(0, 0, out.width, out.height);
        octx.drawImage(tmp, 0, 0);
      }

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
      const side = Math.min(r.w, r.h) * 0.38 * (qrObj.scale || 1);
      const cx = r.x + r.w/2 + (qrObj.offsetX||0);
      const cy = r.y + r.h/2 + (qrObj.offsetY||0);

      ctx.save();
      ctx.beginPath(); const path=shapePath(); path(); ctx.closePath(); ctx.clip();

      ctx.translate(cx, cy);
      ctx.rotate((qrObj.rotDeg||0) * Math.PI/180);
      ctx.drawImage(qrObj.canvas, -side/2, -side/2, side, side);

      if (qrObj.outline?.enabled){
        const lw = Math.max(1, side * (Math.max(0, qrObj.outline.widthPct||0)/100));
        ctx.lineWidth = lw;
        ctx.strokeStyle = qrObj.outline.color || '#111111';
        const rad = Math.max(0, (qrObj.outline.radiusPct||0)/100) * (side/2);
        if (rad>0){
          const r2 = side/2;
          const x = -r2, y = -r2, w = side, h = side;
          const rr = Math.min(rad, r2);
          ctx.beginPath();
          ctx.moveTo(x+rr,y);
          ctx.arcTo(x+w,y,x+w,y+h,rr);
          ctx.arcTo(x+w,y+h,x,y+h,rr);
          ctx.arcTo(x,y+h,x,y,rr);
          ctx.arcTo(x,y,x+w,y,rr);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(-side/2, -side/2, side, side);
        }
      }

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
            ringCanvas = buildRingFromMask(mask, outlinePx, ringColor, 0);
            pad = Math.max(1, Math.ceil(outlinePx));
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
        ctx.font = `${Math.max(6, fontPx).toFixed(0)}px ${quoteFont(textObj.font || 'Inter')}, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
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

      refreshQtyPrices();
      updatePriceAndJSON();
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
      ctx.save(); ctx.font = `${Math.max(6, fontPx).toFixed(0)}px ${quoteFont(textObj.font||'Inter')}, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
      const m = ctx.measureText(textObj.text); ctx.restore();
      const w = Math.max(10, (m.width||0));
      const h = Math.max(10, fontPx*1.2);
      const cx = r.x + r.w/2 + (textObj.offsetX||0);
      const cy = r.y + r.h/2 + (textObj.offsetY||0);
      const rot = (textObj.rotDeg||0)*(Math.PI/180);
      return { cx, cy, w, h, rot };
    }
    function qrBoundingBox(){
      if (!qrObj.enabled || !qrObj.canvas) return null;
      const r = getDrawRect();
      const side = Math.min(r.w, r.h) * 0.38 * (qrObj.scale || 1);
      const cx = r.x + r.w/2 + (qrObj.offsetX||0);
      const cy = r.y + r.h/2 + (qrObj.offsetY||0);
      const rot = (qrObj.rotDeg||0) * Math.PI/180;
      return { cx, cy, w: side, h: side, rot };
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

      lastToolTarget = (dragMode==='qr') ? 'qr' : (dragMode==='image' ? 'image' : lastToolTarget);

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
      e.preventDefault();
    }
    function endDrag(){ dragMode=null; }

    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('touchstart', startDrag, {passive:false});
    window.addEventListener('mousemove', moveDrag, {passive:false});
    window.addEventListener('touchmove', moveDrag, {passive:false});
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

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
    function clearImage(){
      uploaded={ name:null, type:null, size:0, dataURL:null, img:null, pdf:null };
      if (imgEl) imgEl.value='';
      if (fName) fName.textContent='brak pliku';
      if (fMeta) fMeta.textContent='';
      transform={scale:1,offsetX:0,offsetY:0,rotDeg:0};
      requestDraw();
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
      if (fName) fName.textContent = name;

      // jeśli diecut — tylko PNG z przezroczystością
      if (shape==='diecut'){
        const isPNG = (f.type && f.type.toLowerCase().includes('png')) || /\.png$/i.test(name);
        if (!isPNG){
          alert('Tryb DIECUT: wgraj plik PNG z przezroczystym tłem.');
          clearImage();
          return;
        }
      }

      // PDF preview via PDF.js (first page)
      const isPDF = (f.type && f.type.toLowerCase().includes('pdf')) || /\.pdf$/i.test(name);
      if (isPDF){
        if (shape==='diecut'){
          alert('Tryb DIECUT wspiera tylko PNG z przezroczystością.');
          clearImage(); return;
        }
        if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument!=='function'){
          alert('Podgląd PDF wymaga PDF.js (brak biblioteki).');
          clearImage(); return;
        }
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
            uploaded = { name, type:(f.type||'application/pdf'), size:(f.size||0), dataURL, img, pdf:{ numPages: pdf.numPages||1 } };
            transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 };
            updateFileMeta(c.width, c.height, (f.type||'application/pdf'), (f.size||0), `PDF • ${pdf.numPages||1} str.`);
            requestDraw();
          };
          img.src = dataURL;
        }catch(err){
          console.error('PDF preview error:', err);
          alert('Nie udało się wczytać PDF (szczegóły w konsoli).');
          clearImage();
        }
        return;
      }

      // Image / SVG / PNG
      const rd = new FileReader();
      rd.onload = (ev)=>{
        const dataURL = String(ev.target.result);
        const img = new Image();
        img.onload = ()=>{
          uploaded = { name, type:(f.type||''), size:(f.size||0), dataURL, img, pdf:null };
          transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 };
          updateFileMeta(img.naturalWidth||img.width, img.naturalHeight||img.height, (f.type||''), (f.size||0));
          requestDraw();
        };
        img.src = dataURL;
      };
      rd.readAsDataURL(f);
    });

    /* ===== Kontrolki: Kształt ===== */
    function updateShapeUI(){
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
      updateSummaryMeta();
      requestDraw();
    }
    if (shapeGrid){
      shapeGrid.addEventListener('click', (e)=>{
        const btn = e.target.closest('.shape-btn'); if(!btn) return;
        $$('.shape-btn', shapeGrid).forEach(b=>b.setAttribute('aria-pressed','false'));
        btn.setAttribute('aria-pressed','true');
        shape = btn.getAttribute('data-shape') || 'rect';
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

    /* ===== Materiał ===== */
    function materialMultiplier(){
      const v = (materialEl && (materialEl.value||'')).toLowerCase();
      if (v.indexOf('długo') !== -1 || v.indexOf('dlugo') !== -1) return 1.5; // folia długowieczna
      return 1.0; // ekonomiczna lub inne
    }
    if (materialEl) materialEl.addEventListener('change', ()=>{ updatePriceAndJSON(); refreshQtyPrices(); updateSummaryMeta(); });
    if (laminateEl) laminateEl.addEventListener('change', ()=>{ updatePriceAndJSON(); refreshQtyPrices(); updateSummaryMeta(); requestDraw(); });

    /* ===== Tekst ===== */
    if (textInput){ textInput.addEventListener('input', ()=>{ textObj.text = textInput.value || ''; requestDraw(); }); }
    if (textFontSel){ textFontSel.addEventListener('change', ()=>{ textObj.font = textFontSel.value || 'Inter'; requestDraw(); }); }
    if (textColorEl){ textColorEl.addEventListener('input', ()=>{ textObj.color = textColorEl.value || '#111111'; requestDraw(); }); }
    if (textClear){
      textClear.addEventListener('click', ()=>{
        textObj = { text:'', font:(textFontSel?.value||'Inter'), color:(textColorEl?.value||'#111111'), scale:1, rotDeg:0, offsetX:0, offsetY:0 };
        if (textInput) textInput.value = '';
        requestDraw();
      });
    }
    if (textCenter){ textCenter.addEventListener('click', ()=>{ textObj.offsetX=0; textObj.offsetY=0; requestDraw(); }); }
    if (textReset){
      textReset.addEventListener('click', ()=>{
        textObj.scale=1; textObj.rotDeg=0;
        requestDraw();
      });
    }

    /* ===== QR UI ===== */
    function bindQR(){
      if (qrAddBtn){
        qrAddBtn.addEventListener('click', ()=>{
          if (!QRCodeLib){
            alert('Nie można dodać QR: biblioteka QR (davidshimjs) nie została wczytana.');
            return;
          }
          qrObj.enabled = true;
          if (qrAddBtn)  qrAddBtn.style.display = 'none';
          if (qrRemBtn)  qrRemBtn.style.display = '';
          rebuildQR();
        });
      }
      if (qrRemBtn){
        qrRemBtn.addEventListener('click', ()=>{
          qrObj.enabled = false;
          qrObj.canvas = null;
          if (qrAddBtn)  qrAddBtn.style.display = '';
          if (qrRemBtn)  qrRemBtn.style.display = 'none';
          requestDraw();
        });
      }
      if (qrTypeSel) qrTypeSel.addEventListener('change', updateQRTypeUI);

      // Kolory/ECC/quiet
      [qrDark, qrLight, qrECC, qrQuiet].forEach(el=>{
        if (!el) return;
        const evt = (el.type==='range' || el.type==='color' || el.tagName==='SELECT') ? 'input' : 'change';
        el.addEventListener(evt, rebuildQR);
      });

      // Dane
      [qrURL, qrWifiSSID, qrWifiPass, qrWifiAuth, qrWifiHidden].forEach(el=>{
        if (!el) return;
        const evt = (el.type==='checkbox' || el.tagName==='SELECT') ? 'change' : 'input';
        el.addEventListener(evt, rebuildQR);
      });

      // Obrys QR
      if (qrOutlineOn) qrOutlineOn.addEventListener('change', ()=>{ qrObj.outline.enabled = !!qrOutlineOn.checked; requestDraw(); });
      if (qrOutlineColor) qrOutlineColor.addEventListener('input', ()=>{ qrObj.outline.color = qrOutlineColor.value || '#111111'; requestDraw(); });
      if (qrOutlineWidth) qrOutlineWidth.addEventListener('input', ()=>{ qrObj.outline.widthPct = Math.max(0, parseFloat(qrOutlineWidth.value||'0')); requestDraw(); });
      if (qrOutlineRadius) qrOutlineRadius.addEventListener('input', ()=>{ qrObj.outline.radiusPct = Math.max(0, parseFloat(qrOutlineRadius.value||'0')); requestDraw(); });

      if (qrAddBtn)  qrAddBtn.style.display = qrObj.enabled ? 'none' : '';
      if (qrRemBtn)  qrRemBtn.style.display = qrObj.enabled ? '' : 'none';

      updateQRTypeUI();
    }
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
      const net=total/1.23;
      return { total, net, rate, areaOne, total_area, qty };
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
        if (priceEl) priceEl.textContent = fmtMoney(calcB.total);
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

    function updateSummaryMeta(calc){
      if (sumShapeEl)    sumShapeEl.textContent = 'Kształt: ' + shapeLabel(shape);
      if (sumMaterialEl) sumMaterialEl.textContent = 'Materiał: ' + (materialEl?.value || 'Folia ekonomiczna');
      if (sumLaminateEl) sumLaminateEl.textContent = 'Laminat: ' + (laminateEl?.checked ? 'tak' : 'nie');

      const qty = getCurrentQty();
      const c = calc || computeTotalForQty(qty);
      const days = leadTimeBusinessDays(c.total_area || 0);
      const target = addBusinessDays(new Date(), days);
      if (sumLeadtimeEl) sumLeadtimeEl.textContent = 'Wysyłka do ' + formatPLDateOnly(target);
    }

    // popup do wyceny
    function ensureQuotePopup(){
      let modal = byId('stb-quote-popup');
      if (modal) return modal;
      modal = document.createElement('div');
      modal.id = 'stb-quote-popup';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9999999;display:none;';
      modal.innerHTML = `
        <div style="position:absolute;inset:0;background:rgba(0,0,0,.6)"></div>
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border-radius:12px;max-width:520px;width:92%;padding:16px;border:1px solid #e5eaf5">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong style="font-size:18px">WYCENA INDYWIDUALNA</strong>
            <button type="button" id="stb-quote-close" class="btn" style="border-radius:999px">✕</button>
          </div>
          <p>Powierzchnia naklejek przekracza 100 m². Napisz do nas, a przygotujemy ofertę.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
            <a class="btn btn-primary" href="/kontakt/">Przejdź do kontaktu</a>
            <button class="btn" type="button" id="stb-quote-stay">Zostań w kreatorze</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e)=>{ if (e.target===modal.firstElementChild) modal.style.display='none'; });
      $('#stb-quote-close', modal)?.addEventListener('click', ()=> modal.style.display='none');
      $('#stb-quote-stay', modal)?.addEventListener('click', ()=> modal.style.display='none');
      return modal;
    }

    function updatePriceAndJSON(){
      const qty = getCurrentQty();
      const calc = computeTotalForQty(qty);

      if (totalOut)    totalOut.textContent = (calc.total_area >= 100 ? 'WYCENA INDYWIDUALNA' : fmtMoney(calc.total));
      if (totalNetOut) totalNetOut.textContent = (calc.total_area >= 100 ? '' : (fmtMoney(calc.net) + ' netto'));

      const w_cm=parseNum(wEl,10), h_cm=parseNum(hEl,10);
      if (sumDims)  sumDims.textContent = `${(w_cm).toString().replace('.',',')} × ${(h_cm).toString().replace('.',',')} cm`;
      if (sumQty)   sumQty.textContent  = `${qty} szt.`;
      if (sumTotal) sumTotal.textContent= (calc.total_area >= 100 ? 'WYCENA INDYWIDUALNA' : fmtMoney(calc.total));
      if (sumNet)   sumNet.textContent  = (calc.total_area >= 100 ? '' : (fmtMoney(calc.net) + ' netto'));

      updateSummaryMeta(calc);

      // Popup jeśli >= 100 m2
      if (calc.total_area >= 100){
        const m = ensureQuotePopup();
        if (m) m.style.display = 'block';
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
          laminate: !!(laminateEl && laminateEl.checked),
          file: uploaded.name ? { name: uploaded.name, type: uploaded.type, size: uploaded.size } : null,
          text: {
            value: textObj.text || '',
            font: textObj.font || 'Inter',
            color: textObj.color || '#111111',
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
            outline: { enabled: !!(qrOutlineOn && qrOutlineOn.checked), color: (qrOutlineColor?.value || '#111111'), widthPct: +(qrObj.outline.widthPct||0), radiusPct: +(qrObj.outline.radiusPct||0) }
          },
          preview_png: safePreview()
        };
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
      if (lastToolTarget==='qr' && qrObj.enabled) return 'qr';
      if (uploaded.img) return 'image';
      if (qrObj.enabled) return 'qr';
      return 'image';
    }
    function applyZoom(delta){
      const tgt = toolbarTarget();
      if (tgt==='qr'){
        const ns = (qrObj.scale || 1) * (1 + delta);
        qrObj.scale = Math.max(0.1, Math.min(6, ns));
      }else{
        const ns = (transform.scale || 1) * (1 + delta);
        transform.scale = Math.max(0.1, Math.min(6, ns));
      }
      requestDraw();
    }
    function applyRotate(deltaDeg){
      const tgt = toolbarTarget();
      if (tgt==='qr'){
        qrObj.rotDeg = (qrObj.rotDeg || 0) + deltaDeg;
      }else{
        transform.rotDeg = (transform.rotDeg || 0) + deltaDeg;
      }
      requestDraw();
    }
    function applyFit(){
      const tgt = toolbarTarget();
      if (tgt==='qr'){
        qrObj.offsetX = 0; qrObj.offsetY = 0; qrObj.scale = 1; qrObj.rotDeg = 0;
      }else{
        transform = { scale:1, offsetX:0, offsetY:0, rotDeg:0 };
      }
      requestDraw();
    }

    if (tbZoomOut) tbZoomOut.addEventListener('click', ()=> applyZoom(-0.1));
    if (tbZoomIn)  tbZoomIn .addEventListener('click', ()=> applyZoom(+0.1));
    if (tbRotMinus)tbRotMinus.addEventListener('click', ()=> applyRotate(-5));
    if (tbRotPlus) tbRotPlus .addEventListener('click', ()=> applyRotate(+5));
    if (tbFit)     tbFit    .addEventListener('click', applyFit);
    if (tbGrid)    tbGrid   .addEventListener('click', ()=>{ gridOn=!gridOn; requestDraw(); });

    /* ===== PDF 300 DPI ===== */
    let exportQRPromises = [];

    function renderExportBase(ctx2, W, H, bgCol){
      ctx2.clearRect(0,0,W,H);
      ctx2.fillStyle = bgCol||'#ffffff';
      ctx2.fillRect(0,0,W,H);
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
                ringCanvas = buildRingFromMask(mask, ringPxOut, outColorEl?.value || '#ff0000', 0);
              }
              pad = Math.max(1, Math.ceil(ringPxOut));
            }

            const cxPrev = rPrev.x + rPrev.w/2 + fit.clampOffsetX(transform.offsetX||0);
            const cyPrev = rPrev.y + rPrev.h/2 + fit.clampOffsetY(transform.offsetY||0);

            const cx = cxPrev * kx;
            const cy = cyPrev * ky;

            const rot = (transform.rotDeg||0) * Math.PI/180;

            // obraz
            octx.save();
            octx.translate(cx, cy);
            octx.rotate(rot);
            octx.drawImage(uploaded.img, -dwExport/2, -dhExport/2, dwExport, dhExport);
            octx.restore();

            if (ringCanvas){
              octx.save();
              octx.translate(cx, cy);
              octx.rotate(rot);
              octx.drawImage(ringCanvas, -(dwExport/2 + pad), -(dhExport/2 + pad), dwExport + 2*pad, dhExport + 2*pad);
              octx.restore();
            }

          } else {
            // inne kształty — jak w podglądzie
            const iw=uploaded.img.width, ih=uploaded.img.height;
            const base=Math.max(pxW/iw, pxH/ih)*(transform.scale||1);
            const dw=iw*base, dh=ih*base, cx=pxW/2 + (transform.offsetX||0)*kx, cy=pxH/2 + (transform.offsetY||0)*ky;
            octx.save();
            octx.translate(cx, cy);
            octx.rotate(((transform.rotDeg||0)*Math.PI)/180);
            octx.drawImage(uploaded.img, -dw/2, -dh/2, dw, dh);
            octx.restore();
          }
        }

        // tekst
        if (textObj.text && textObj.text.trim().length){
          const basePx  = Math.min(pxW, pxH) * 0.18;
          const fontPx  = basePx * (textObj.scale || 1);
          const cx = pxW/2 + (textObj.offsetX || 0)*kx;
          const cy = pxH/2 + (textObj.offsetY || 0)*ky;
          octx.save();
          octx.translate(cx, cy);
          octx.rotate(((textObj.rotDeg || 0) * Math.PI)/180);
          octx.textAlign = 'center'; octx.textBaseline = 'middle';
          octx.fillStyle = textObj.color || '#111111';
          octx.font = `${Math.max(6, fontPx).toFixed(0)}px ${quoteFont(textObj.font || 'Inter')}, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
          octx.fillText(textObj.text, 0, 0);
          octx.restore();
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

            octx.save();
            octx.translate(cx, cy);
            octx.rotate((qrObj.rotDeg||0) * Math.PI/180);
            octx.drawImage(offCanvas || qrObj.canvas, -side/2, -side/2, side, side);

            if (qrObj.outline?.enabled){
              octx.lineWidth = Math.max(1, side * (Math.max(0, qrObj.outline.widthPct||0)/100));
              octx.strokeStyle = qrObj.outline.color || '#111111';
              const rad = Math.max(0, (qrObj.outline.radiusPct||0)/100) * (side/2);
              if (rad>0){
                const r2 = side/2; const x=-r2,y=-r2,w=side,h=side, rr=Math.min(rad, r2);
                octx.beginPath();
                octx.moveTo(x+rr,y);
                octx.arcTo(x+w,y,x+w,y+h,rr);
                octx.arcTo(x+w,y+h,x,y+h,rr);
                octx.arcTo(x,y+h,x,y,rr);
                octx.arcTo(x,y,x+w,y,rr);
                octx.closePath();
                octx.stroke();
              } else {
                octx.strokeRect(-side/2, -side/2, side, side);
              }
            }

            octx.restore();
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
    if (addBtnModal) addBtnModal.addEventListener('click', handleAddToCart);

    /* ===== Modal ===== */
    const modal = byId('stb-modal');
    const modalContent = modal ? modal.querySelector('.stb-modal__content') : null;
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
      if (!modal || !modalContent || !designer) return;
      if (!placeholder.parentNode){ designer.parentNode.insertBefore(placeholder, designer); }
      modalContent.appendChild(designer);
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
    requestDraw();

    if (!QRCodeLib) console.warn('Uwaga: biblioteka QR (davidshimjs) nie została wykryta.');
    if (!PDFLib) console.warn('Uwaga: biblioteka PDF-Lib nie została wykryta — eksport PDF nie zadziała.');
  });
})();
