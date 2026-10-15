/* App-Shell: Modulregister, Navigation, Hash-Router */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  /* Alle geplanten Module. Ein Modul wird aktiv, sobald seine js-Datei
     APP.registerModule() aufruft. */
  APP.MODULE_META = [
    { id: 'grammatik', title: 'Grammatik', phase: 1 },
    { id: 'wortschatz', title: 'Wortschatz', phase: 2 },
    { id: 'schreiben', title: 'Schreiben', phase: 3 },
    { id: 'lesen', title: 'Lesen', phase: 4 },
    { id: 'hoeren', title: 'Hören', phase: 4 }
  ];

  APP.modules = {};
  APP.views = {};

  /**
   * Modul-Schnittstelle:
   *   id, title
   *   topics()          → [{ id, title, description }]
   *   items(topicId)    → Items eines Themas
   *   getItem(itemId)   → einzelnes Item oder null
   *   topicOf(itemId)   → Thema eines Items (für den Wartungsblock) oder null
   *   focusInfo()       → optional: Kurzinfo für die Fokuskarte
   *   enqueueOnMastery  → false, wenn das Modul seine SRS-Karten selbst anlegt
   *   render(el, params)→ Modulansicht (#/<id>/...)
   *   review: { estimateSec, render(el, itemId, done(correct, quality?)) }  → für die Wiederholung
   */
  APP.registerModule = function (mod) { APP.modules[mod.id] = mod; };
  APP.registerView = function (name, fn) { APP.views[name] = fn; };

  APP.moduleTitle = function (id) {
    var m = APP.MODULE_META.filter(function (x) { return x.id === id; })[0];
    return m ? m.title : id;
  };

  APP.navigate = function (hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  };

  function buildNav() {
    var nav = U.clear(document.getElementById('nav'));
    var focus = APP.store.state.settings.focus;
    var links = [{ href: '#/', label: 'Start', key: '' }]
      .concat(APP.MODULE_META.map(function (m) {
        return { href: '#/' + m.id, label: m.title, key: m.id, focus: m.id === focus, off: !APP.modules[m.id] };
      }))
      .concat([{ href: '#/wiederholung', label: 'Wiederholung', key: 'wiederholung' },
               { href: '#/import', label: 'Import', key: 'import' },
               { href: '#/daten', label: 'Daten', key: 'daten' }]);
    links.forEach(function (l) {
      nav.appendChild(h('a', {
        href: l.href, 'data-key': l.key,
        class: (l.off ? 'off' : '') + (l.focus ? ' is-focus' : ''),
        title: l.focus ? 'Aktueller Fokus' : null
      }, l.label));
    });
  }

  function markNav(key) {
    Array.prototype.forEach.call(document.querySelectorAll('#nav a'), function (a) {
      if (a.getAttribute('data-key') === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function placeholder(el, meta) {
    el.appendChild(h('section', { class: 'card' },
      h('h1', null, meta.title),
      h('p', { class: 'muted' }, 'Dieses Modul folgt in Phase ' + meta.phase + '.')));
  }

  function route() {
    var main = U.clear(document.getElementById('main'));
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    var key = parts[0] || '';
    buildNav();
    markNav(key);
    APP.timer.setContext(null);
    window.scrollTo(0, 0);

    if (!key) return APP.views.dashboard(main);
    if (APP.views[key]) return APP.views[key](main, parts.slice(1));
    var meta = APP.MODULE_META.filter(function (m) { return m.id === key; })[0];
    if (meta) {
      if (!APP.modules[key]) return placeholder(main, meta);
      APP.timer.setContext({ module: key });
      return APP.modules[key].render(main, parts.slice(1));
    }
    main.appendChild(h('section', { class: 'card' }, h('p', null, 'Seite nicht gefunden. '), h('a', { href: '#/' }, 'Zur Startseite')));
  }

  /** Hinweis, wenn man außerhalb des Fokus neue Themen lernt */
  APP.focusNotice = function (moduleId) {
    var focus = APP.store.state.settings.focus;
    if (focus === moduleId) return null;
    return h('div', { class: 'notice' },
      'Ihr Fokus liegt gerade auf ', h('strong', null, APP.moduleTitle(focus)),
      '. Neue Themen am besten dort – hier lieber nur kurz üben.');
  };

  APP.start = function () {
    APP.sync.captureSource();
    APP.store.load();
    APP.progress.syncSrs();
    APP.store.save();
    APP.timer.start();
    window.addEventListener('hashchange', route);
    route();
  };
})(window.APP);
