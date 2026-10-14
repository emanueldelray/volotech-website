/* Zeiterfassung: zählt aktive Lernzeit pro Modul und Tag */
(function (APP) {
  'use strict';
  var U = APP.util;

  var TICK = 5;          // Sekunden
  var IDLE_LIMIT = 90;   // ohne Eingabe gilt man nach 90 s als inaktiv
  var ctx = null;        // { module: 'grammatik', maintenance: bool }
  var lastActivity = Date.now();
  var unsaved = 0;

  function setContext(c) { ctx = c; lastActivity = Date.now(); }

  function activity() { lastActivity = Date.now(); }

  function tick() {
    if (!ctx || document.hidden) return;
    if ((Date.now() - lastActivity) / 1000 > IDLE_LIMIT) return;
    var s = APP.store.state;
    var day = U.dayStr();
    var t = s.time[day] || (s.time[day] = {});
    t[ctx.module] = (t[ctx.module] || 0) + TICK;
    if (ctx.maintenance) t._wartung = (t._wartung || 0) + TICK;
    unsaved += TICK;
    if (unsaved >= 15) flush();
  }

  function flush() {
    if (unsaved) { APP.store.save(); unsaved = 0; }
  }

  function start() {
    ['pointerdown', 'keydown', 'scroll', 'input'].forEach(function (ev) {
      window.addEventListener(ev, activity, { passive: true, capture: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) flush(); else activity();
    });
    window.addEventListener('pagehide', flush);
    setInterval(tick, TICK * 1000);
  }

  APP.timer = { start: start, setContext: setContext, flush: flush };
})(window.APP);
