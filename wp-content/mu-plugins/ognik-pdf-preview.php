<?php
/**
 * Plugin Name: Ognik – PDF preview for kreator
 * Description: Renderuje podgląd pierwszej strony PDF w kreatorze (canvas) przy uploadzie.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) { exit; }

add_action('wp_footer', function () {
    ?>
    <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.js"></script>
    <script>
    (function () {
      if (window['pdfjsLib']) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.js";
      }

      function isPdf(file) {
        return file && (
          file.type === 'application/pdf' ||
          (file.name && file.name.toLowerCase().endsWith('.pdf'))
        );
      }

      function ensurePreviewHost() {
        let host = document.getElementById('ognik-pdf-preview');
        if (!host) {
          host = document.createElement('div');
          host.id = 'ognik-pdf-preview';
          host.style.marginTop = '12px';
          host.style.display = 'flex';
          host.style.flexDirection = 'column';
          host.style.gap = '8px';

          const knownHosts = document.querySelectorAll('[data-kreator], .kreator, .designer, .canvas, #canvas, .product-designer, .fpd-container');
          if (knownHosts.length) {
            knownHosts[0].parentNode.insertBefore(host, knownHosts[0]);
          } else {
            document.body.appendChild(host);
          }

          const title = document.createElement('div');
          title.textContent = 'Podgląd PDF (strona 1)';
          title.style.fontWeight = '600';
          title.style.fontSize = '14px';
          host.appendChild(title);

          const info = document.createElement('div');
          info.id = 'ognik-pdf-info';
          info.style.fontSize = '12px';
          info.style.opacity = '0.8';
          info.textContent = 'Jeśli PDF jest wielostronicowy, pokazujemy pierwszą stronę.';
          host.appendChild(info);

          const canvas = document.createElement('canvas');
          canvas.id = 'ognik-pdf-canvas';
          canvas.style.maxWidth = '100%';
          canvas.style.border = '1px dashed #ddd';
          canvas.style.background = '#fff';
          host.appendChild(canvas);
        }
        return host;
      }

      async function renderPdfFirstPage(file) {
        try {
          if (!window['pdfjsLib']) return;
          ensurePreviewHost();
          const canvas = document.getElementById('ognik-pdf-canvas');
          const ctx = canvas.getContext('2d');
          const buf = await file.arrayBuffer();

          const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
          const page = await pdf.getPage(1);

          const desiredWidth = Math.min(1000, window.innerWidth - 48);
          const viewport = page.getViewport({ scale: 1.0 });
          const scale = desiredWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          canvas.width = scaledViewport.width | 0;
          canvas.height = scaledViewport.height | 0;

          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

          const info = document.getElementById('ognik-pdf-info');
          if (info) info.textContent = 'Podgląd wygenerowany z PDF (strona 1).';
        } catch (e) {
          const info = document.getElementById('ognik-pdf-info');
          if (info) info.textContent = 'Nie udało się wygenerować podglądu PDF. Sprawdź czy plik nie jest szyfrowany i nie jest zbyt duży.';
          console.error('Ognik PDF preview error:', e);
        }
      }

      function attachListeners(root) {
        const inputs = (root || document).querySelectorAll('input[type="file"]');
        inputs.forEach(function (inp) {
          if (inp.__ognikPdfHooked) return;
          inp.__ognikPdfHooked = true;
          inp.addEventListener('change', function (ev) {
            const file = ev.target && ev.target.files && ev.target.files[0];
            if (isPdf(file)) renderPdfFirstPage(file);
          });
        });
      }

      function init() {
        attachListeners(document);
        const obs = new MutationObserver(function (muts) {
          muts.forEach(function (m) {
            if (m.addedNodes && m.addedNodes.length) {
              m.addedNodes.forEach(function (n) {
                if (n.nodeType === 1) attachListeners(n);
              });
            }
          });
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
    </script>
    <?php
});

