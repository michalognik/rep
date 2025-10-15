<?php
/**
 * Plugin Name: Ognik – PDF preview for kreator
 * Description: Wyświetla prosty podgląd wybranego PDF w kreatorze bez wysyłania pliku na serwer.
 * Version: 1.1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

function ognik_pdf_preview_enqueue_scripts() {
    wp_register_script('ognik-pdf-preview-simple', '', [], '1.0.0', true);
    wp_enqueue_script('ognik-pdf-preview-simple');

    $inline = <<<'JS'
(function () {
  if (window.__ognikSimplePdfPreviewInitialized) {
    return;
  }
  window.__ognikSimplePdfPreviewInitialized = true;

  const previews = new WeakMap();

  function isPdf(file) {
    return !!file && (
      file.type === 'application/pdf' ||
      (file.name && file.name.toLowerCase().endsWith('.pdf'))
    );
  }

  function createContainer(input) {
    const wrapper = document.createElement('div');
    wrapper.style.marginTop = '16px';
    wrapper.style.padding = '12px';
    wrapper.style.border = '1px solid #ddd';
    wrapper.style.background = '#fafafa';
    wrapper.style.borderRadius = '4px';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '8px';

    const title = document.createElement('div');
    title.textContent = 'Podgląd PDF';
    title.style.fontWeight = '600';
    wrapper.appendChild(title);

    const frame = document.createElement('embed');
    frame.type = 'application/pdf';
    frame.style.width = '100%';
    frame.style.minHeight = '360px';
    frame.style.border = '1px solid #ccc';
    frame.style.backgroundColor = '#fff';
    wrapper.appendChild(frame);

    const info = document.createElement('div');
    info.style.fontSize = '12px';
    info.style.opacity = '0.75';
    info.textContent = 'Wybierz plik PDF, aby zobaczyć jego podgląd (pliku nie wysyłamy na serwer).';
    wrapper.appendChild(info);

    if (input.parentNode) {
      input.parentNode.insertBefore(wrapper, input.nextSibling);
    } else {
      input.insertAdjacentElement('afterend', wrapper);
    }

    const state = { wrapper, frame, info, url: null };
    previews.set(input, state);
    return state;
  }

  function ensureContainer(input) {
    let state = previews.get(input);
    if (!state || !state.wrapper.isConnected) {
      state = createContainer(input);
    }
    return state;
  }

  function updateInfo(state, message) {
    if (state && state.info) {
      state.info.textContent = message;
    }
  }

  function clearPreview(state, message) {
    if (!state) {
      return;
    }
    if (state.frame) {
      state.frame.removeAttribute('src');
    }
    if (state.url) {
      URL.revokeObjectURL(state.url);
      state.url = null;
    }
    updateInfo(state, message || 'Wybierz plik PDF, aby zobaczyć jego podgląd (pliku nie wysyłamy na serwer).');
  }

  function showPreview(input, file) {
    const state = ensureContainer(input);
    clearPreview(state);
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    state.url = url;
    state.frame.src = url;
    updateInfo(state, 'Podgląd został wygenerowany lokalnie — plik nie został wysłany na serwer.');
  }

  document.addEventListener('change', function (event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file') {
      return;
    }

    const file = input.files && input.files[0];
    const state = ensureContainer(input);

    if (file && isPdf(file)) {
      showPreview(input, file);
    } else {
      clearPreview(state, file ? 'Wybrany plik nie jest w formacie PDF.' : 'Wybierz plik PDF, aby zobaczyć jego podgląd (pliku nie wysyłamy na serwer).');
    }
  });
})();
JS;

    wp_add_inline_script('ognik-pdf-preview-simple', $inline);
}

add_action('wp_enqueue_scripts', 'ognik_pdf_preview_enqueue_scripts');
add_action('admin_enqueue_scripts', 'ognik_pdf_preview_enqueue_scripts');
