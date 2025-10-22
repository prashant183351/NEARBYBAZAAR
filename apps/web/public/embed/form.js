// NearbyBazaar Form Embed Widget
// Usage: <script src="https://yourdomain.com/embed/form.js" data-form-id="FORM_ID"></script>
(function () {
  var script = document.currentScript || document.querySelector('script[data-form-id]');
  var formId = script && script.getAttribute('data-form-id');
  if (!formId) return;
  var iframe = document.createElement('iframe');
  iframe.src = 'https://yourdomain.com/forms/embed/' + encodeURIComponent(formId);
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  iframe.onload = function () {
    window.postMessage({ type: 'form-embed-loaded', formId }, '*');
  };
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'form-embed-resize' && e.data.height) {
      iframe.style.height = e.data.height + 'px';
    }
    if (e.data && e.data.type === 'form-embed-submit') {
      // Optionally handle submission event in parent
      if (typeof window.onFormEmbedSubmit === 'function') {
        window.onFormEmbedSubmit(e.data);
      }
    }
  });
  script.parentNode.insertBefore(iframe, script.nextSibling);
})();
