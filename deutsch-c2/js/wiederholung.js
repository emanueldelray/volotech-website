/* Täglicher Wartungsblock: fällige SRS-Karten aller Module, max. ~10 Minuten */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  APP.registerView('wiederholung', function (el, params) {
    var extra = params[0] === 'mehr';
    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Wiederholung'),
      h('p', { class: 'muted' }, 'Beherrschte Themen bleiben hier im Gedächtnis. Tägliches Limit: ' +
        APP.store.state.settings.maintenanceMinutes + ' Minuten.')));

    var budgetLine = h('p', { class: 'muted small' });
    var stage = h('div');
    el.appendChild(budgetLine);
    el.appendChild(stage);

    var queue = extra ? APP.progress.dueCards() : APP.progress.maintenancePlan().cards;
    var done = 0, correct = 0;

    function updateBudget() {
      var b = APP.progress.maintenanceBudget();
      budgetLine.textContent = 'Heute: ' + U.fmtMinutes(b.done) + ' von ' + U.fmtMinutes(b.cap) +
        ' · noch fällig: ' + APP.progress.dueCards().length;
    }

    function finished(reason) {
      APP.timer.setContext(null);
      updateBudget();
      U.clear(stage);
      var due = APP.progress.dueCards().length;
      var card = h('section', { class: 'card' });
      if (done) card.appendChild(h('p', { class: 'big-number' }, correct + ' / ' + done, h('span', { class: 'muted small' }, ' richtig')));
      card.appendChild(h('p', null, reason));
      var row = h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/' }, 'Zur Startseite'));
      if (due) row.appendChild(h('a', { class: 'btn ghost', href: '#/wiederholung/mehr' }, 'Trotzdem weiter (' + due + ' fällig)'));
      card.appendChild(row);
      stage.appendChild(card);
    }

    function next() {
      updateBudget();
      if (!extra && done > 0 && APP.progress.maintenanceBudget().left <= 0) {
        return finished('Zeitlimit für heute erreicht. Gute Arbeit – der Rest kommt morgen.');
      }
      if (!queue.length) {
        if (!done) {
          var b = APP.progress.maintenanceBudget();
          return finished(b.left <= 0 && APP.progress.dueCards().length
            ? 'Der Wartungsblock für heute ist bereits erledigt.'
            : 'Heute ist nichts fällig. Wiederholungen entstehen, sobald Sie ein Thema beherrschen.');
        }
        return finished('Alle Karten für heute erledigt.');
      }
      var key = queue.shift();
      var p = key.indexOf(':');
      var mod = APP.modules[key.slice(0, p)];
      APP.timer.setContext({ module: mod.id, maintenance: true });
      var wrap = h('div');
      U.clear(stage);
      stage.appendChild(h('div', { class: 'counter muted small' }, mod.title + ' · ' + (done + 1) + '. Karte'));
      stage.appendChild(wrap);
      mod.review.render(wrap, key.slice(p + 1), function (ok) {
        APP.progress.reviewCard(key, ok ? 4 : 1);
        done++;
        if (ok) correct++;
        next();
      });
    }

    next();
  });
})(window.APP);
