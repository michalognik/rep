<?php
/**
 * Plugin Name: Ognik – PDF preview for kreator
 * Description: Renderuje podgląd pierwszej strony PDF w kreatorze (canvas) przy uploadzie.
 * Version: 1.0.0
 */
if (!defined('ABSPATH')) { exit; }

if (!defined('OGNIK_PDFJS_VERSION')) {
    define('OGNIK_PDFJS_VERSION', '4.6.82');
}

if (!defined('OGNIK_PDFJS_BASE')) {
    define('OGNIK_PDFJS_BASE', 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' . OGNIK_PDFJS_VERSION . '/build/');
}

function ognik_pdf_preview_enqueue_scripts() {
    static $enqueued = false;
    if ($enqueued) {
        return;
    }

    wp_enqueue_script(
        'ognik-pdfjs',
        OGNIK_PDFJS_BASE . 'pdf.min.js',
        [],
        OGNIK_PDFJS_VERSION,
        true
    );

    $worker_inline = 'if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {'
        . 'window.pdfjsLib.GlobalWorkerOptions.workerSrc = "' . OGNIK_PDFJS_BASE . 'pdf.worker.min.js";' 
        . '}';
    wp_add_inline_script('ognik-pdfjs', $worker_inline, 'after');

    wp_register_script('ognik-pdf-preview', '', ['ognik-pdfjs'], '1.0.0', true);
    wp_enqueue_script('ognik-pdf-preview');

    $inline = <<<'JS'
(function () {
  if (window.__ognikPdfPreviewInitialized) {
    return;
  }
  window.__ognikPdfPreviewInitialized = true;

  function hasPdfJs() {
    return typeof window.pdfjsLib !== 'undefined';
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
      if (knownHosts.length && knownHosts[0].parentNode) {
        knownHosts[0].parentNode.insertBefore(host, knownHosts[0]);
      } else {
        (document.body || document.documentElement).appendChild(host);
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
    if (!hasPdfJs()) {
      return;
    }

    ensurePreviewHost();
    const canvas = document.getElementById('ognik-pdf-canvas');
    const info = document.getElementById('ognik-pdf-info');
    if (!canvas) {
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      const buf = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
      const page = await pdf.getPage(1);

      const desiredWidth = Math.min(1000, (window.innerWidth || 0) - 48 || 640);
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = desiredWidth > 0 ? (desiredWidth / viewport.width) : 1;
      const scaledViewport = page.getViewport({ scale: scale > 0 ? scale : 1 });

      canvas.width = scaledViewport.width | 0;
      canvas.height = scaledViewport.height | 0;

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

      if (info) {
        info.textContent = 'Podgląd wygenerowany z PDF (strona 1).';
      }
    } catch (error) {
      console.error('Ognik PDF preview error:', error);
      if (info) {
        info.textContent = 'Nie udało się wygenerować podglądu PDF. Sprawdź czy plik nie jest szyfrowany i nie jest zbyt duży.';
      }
    }
  }

  function attachListeners(root) {
    const scope = root || document;
    if (!scope || !scope.querySelectorAll) {
      return;
    }
    scope.querySelectorAll('input[type="file"]').forEach(function (input) {
      if (input.__ognikPdfHooked) {
        return;
      }
      input.__ognikPdfHooked = true;
      input.addEventListener('change', function (event) {
        const target = event && event.target;
        const file = target && target.files && target.files[0];
        if (isPdf(file)) {
          renderPdfFirstPage(file);
        }
      });
    });
  }

  function init() {
    attachListeners(document);
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes && mutation.addedNodes.forEach(function (node) {
          if (node && node.nodeType === 1) {
            attachListeners(node);
          }
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
JS;

    wp_add_inline_script('ognik-pdf-preview', $inline);

    $enqueued = true;
}

add_action('wp_enqueue_scripts', 'ognik_pdf_preview_enqueue_scripts');
add_action('admin_enqueue_scripts', 'ognik_pdf_preview_enqueue_scripts');

