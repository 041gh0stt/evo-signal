// Pingo Site Pixel — carregado como script externo
// Lê window.pingo.workspaceId definido pelo snippet do usuário
(function (w, d) {
  'use strict';

  var workspaceId = (w.pingo && w.pingo.workspaceId) || '';
  if (!workspaceId) return;

  // Deriva a base da URL a partir da tag <script> que carregou este arquivo
  var currentScript = d.currentScript || (function () {
    var s = d.getElementsByTagName('script');
    return s[s.length - 1];
  })();
  var API_BASE = currentScript
    ? currentScript.src.replace(/\/pingo-pixel\.js(\?.*)?$/, '')
    : '';

  // ── Cookie helpers ──────────────────────────────────────────────────────────
  function getCookie(name) {
    var m = d.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setCookie(name, value, days) {
    var exp = new Date(Date.now() + days * 864e5).toUTCString();
    // Tenta setar no domínio raiz (ex: .meusite.com.br) para funcionar em subdomínios
    var parts = location.hostname.split('.');
    var rootDomain = parts.length > 2 ? '.' + parts.slice(-2).join('.') : location.hostname;
    d.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + exp + '; path=/; domain=' + rootDomain + '; SameSite=Lax';
    // Fallback sem domain se o cookie não foi salvo
    if (!getCookie(name)) {
      d.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + exp + '; path=/; SameSite=Lax';
    }
  }

  // ── Captura parâmetros da URL atual ────────────────────────────────────────
  var _params;
  try { _params = new URLSearchParams(location.search); } catch (e) { _params = { get: function () { return null; } }; }
  function param(name) { return _params.get ? _params.get(name) : null; }

  // ── Meta click ID (fbclid → _fbc cookie) ──────────────────────────────────
  var fbclid = param('fbclid');
  if (fbclid) setCookie('_fbc', 'fb.1.' + Date.now() + '.' + fbclid, 90);
  var fbc = getCookie('_fbc');

  // ── Google click ID (gclid → _gclid cookie) ───────────────────────────────
  var gclid = param('gclid') || getCookie('_gclid');
  if (param('gclid')) setCookie('_gclid', param('gclid'), 90);

  // ── Envia evento para a API do Pingo ──────────────────────────────────────
  function send(eventName, customData) {
    var payload = JSON.stringify({
      eventName: eventName,
      url: location.href,
      referrer: d.referrer || null,
      fbclid: fbclid || null,
      fbc: fbc || null,
      gclid: gclid || null,
      utmSource: param('utm_source'),
      utmMedium: param('utm_medium'),
      utmCampaign: param('utm_campaign'),
      customData: customData || null,
    });
    var url = API_BASE + '/api/pixel/' + workspaceId + '/event';
    try {
      if (navigator.sendBeacon) {
        // sendBeacon é não-bloqueante e sobrevive a navegação de página
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch (e) { /* silencioso */ }
  }

  // ── API pública: Pingo.track('EventName', { chave: valor }) ───────────────
  w.Pingo = { track: send };

  // ── Disparo automático: PageView ───────────────────────────────────────────
  send('PageView');

  // ── Disparo automático: clique em link do WhatsApp ─────────────────────────
  // Sobe até 5 níveis no DOM para capturar cliques em elementos dentro de <a>
  d.addEventListener('click', function (e) {
    var el = e.target;
    for (var i = 0; i < 5 && el; i++, el = el.parentElement) {
      if (el.tagName === 'A') {
        var href = el.getAttribute('href') || '';
        if (/wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(href)) {
          send('WhatsAppClick', { link: href });
        }
        break;
      }
    }
  }, true);

}(window, document));
