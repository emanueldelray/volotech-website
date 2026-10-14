/* Startseite / Dashboard */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  function tile(label, value, sub, cls) {
    return h('div', { class: 'tile ' + (cls || '') },
      h('div', { class: 'tile-label' }, label),
      h('div', { class: 'tile-value' }, value),
      sub ? h('div', { class: 'tile-sub' }, sub) : null);
  }

  function backupInfo() {
    var last = APP.store.state.meta.lastBackup;
    if (!last) return { text: 'Noch nie', sub: 'Jetzt sichern', warn: true };
    var days = U.daysBetween(U.dayStr(new Date(last)), U.dayStr());
    return {
      text: U.fmtDate(last),
      sub: days === 0 ? 'heute' : days === 1 ? 'gestern' : 'vor ' + days + ' Tagen',
      warn: days > 7
    };
  }

  function recommendedTopic(mod) {
    var ts = mod.topics();
    var work = ts.filter(function (t) {
      return !APP.progress.isMastered(mod.id, t.id) && APP.progress.topicStats(mod.id, t.id).total > 0;
    });
    if (work.length) {
      // zuletzt nicht heute geübtes Thema mit dem größten Fortschritt
      work.sort(function (a, b) { return APP.progress.topicStats(mod.id, b.id).progress - APP.progress.topicStats(mod.id, a.id).progress; });
      return work[0];
    }
    return ts.filter(function (t) { return !APP.progress.isMastered(mod.id, t.id); })[0] || null;
  }

  function focusCard(state) {
    var focusId = state.settings.focus;
    var mod = APP.modules[focusId];
    var card = h('section', { class: 'card focus-card' });

    var select = h('select', {
      id: 'focus-select', 'aria-label': 'Fokusmodul wählen',
      onchange: function (e) {
        state.settings.focus = e.target.value;
        APP.store.save();
        APP.navigate('#/');
      }
    }, APP.MODULE_META.map(function (m) {
      return h('option', { value: m.id, selected: m.id === focusId || null, disabled: !APP.modules[m.id] || null },
        m.title + (APP.modules[m.id] ? '' : ' (ab Phase ' + m.phase + ')'));
    }));

    card.appendChild(h('div', { class: 'focus-head' },
      h('div', null,
        h('div', { class: 'eyebrow' }, 'Fokus'),
        h('h2', null, APP.moduleTitle(focusId))),
      h('label', { class: 'focus-switch small muted' }, 'Fokus wechseln ', select)));

    // Fokusanteil der letzten 7 Tage
    var week = APP.progress.timeByModule(7);
    var total = Object.keys(week).reduce(function (s, k) { return s + week[k]; }, 0);
    var share = total ? (week[focusId] || 0) / total : null;
    var target = state.settings.focusTarget;
    if (share !== null) {
      card.appendChild(h('p', { class: 'small ' + (share < target ? 'warn-text' : 'muted') },
        'Fokusanteil der letzten 7 Tage: ' + Math.round(share * 100) + ' % (Ziel ≥ ' + Math.round(target * 100) + ' %)' +
        (share < target ? ' – mehr Zeit in ' + APP.moduleTitle(focusId) + ' einplanen.' : '')));
    }

    if (!mod) return card;
    var rec = recommendedTopic(mod);
    var topicsAll = mod.topics();
    var mastered = topicsAll.filter(function (t) { return APP.progress.isMastered(mod.id, t.id); }).length;
    card.appendChild(h('p', { class: 'muted small' }, mastered + ' von ' + topicsAll.length + ' Themen beherrscht'));

    if (rec) {
      card.appendChild(h('div', { class: 'actions' },
        h('a', { class: 'btn primary', href: '#/' + mod.id + '/ueben/' + encodeURIComponent(rec.id) }, 'Weiter: ' + rec.title),
        h('a', { class: 'btn ghost', href: '#/' + mod.id }, 'Alle Themen')));
    }

    var list = h('div', { class: 'topic-list compact' });
    topicsAll.forEach(function (t) {
      list.appendChild(APP.ui.masteryRow(mod.id, t, { href: '#/' + mod.id + '/ueben/' + encodeURIComponent(t.id) }));
    });
    card.appendChild(h('details', { class: 'topic-details', open: true },
      h('summary', null, 'Beherrschung pro Thema'), list));
    return card;
  }

  function maintenanceCard() {
    var plan = APP.progress.maintenancePlan();
    var b = plan.budget;
    var card = h('section', { class: 'card' },
      h('div', { class: 'eyebrow' }, 'Tägliche Wiederholung'));
    if (!plan.dueTotal) {
      card.appendChild(h('p', null, 'Heute ist nichts fällig.'));
      card.appendChild(h('p', { class: 'muted small' }, 'Beherrschte Themen erscheinen hier automatisch.'));
      return card;
    }
    if (!plan.cards.length) {
      card.appendChild(h('p', null, 'Wartungsblock erledigt (' + U.fmtMinutes(b.done) + ').'));
      card.appendChild(h('p', { class: 'muted small' }, plan.dueTotal + ' weitere Karten fällig – sie warten bis morgen.'));
      return card;
    }
    card.appendChild(h('p', null, plan.cards.length + ' Karten · ca. ' + Math.max(1, Math.round(plan.estSec / 60)) + ' Min.'));
    card.appendChild(h('div', { class: 'bar' }, h('span', { style: { width: Math.round(b.done / b.cap * 100) + '%' } })));
    card.appendChild(h('p', { class: 'muted small' }, 'Heute ' + U.fmtMinutes(b.done) + ' von ' + U.fmtMinutes(b.cap) +
      (plan.dueTotal > plan.cards.length ? ' · insgesamt ' + plan.dueTotal + ' fällig' : '')));
    card.appendChild(h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/wiederholung' }, 'Wiederholung starten')));
    return card;
  }

  /* Lernzeit pro Modul (30 Tage): Balken je Modul + Tagesverlauf */
  function timeCard() {
    var days = U.lastNDays(30);
    var byMod = APP.progress.timeByModule(30);
    var total = Object.keys(byMod).reduce(function (s, k) { return s + byMod[k]; }, 0);
    var card = h('section', { class: 'card' },
      h('div', { class: 'eyebrow' }, 'Lernzeit · letzte 30 Tage'),
      h('p', { class: 'big-number' }, U.fmtMinutes(total)));

    var max = Math.max.apply(null, APP.MODULE_META.map(function (m) { return byMod[m.id] || 0; }).concat([1]));
    var focus = APP.store.state.settings.focus;
    var bars = h('div', { class: 'hbars', role: 'list' });
    APP.MODULE_META.forEach(function (m) {
      var v = byMod[m.id] || 0;
      bars.appendChild(h('div', { class: 'hbar' + (m.id === focus ? ' is-focus' : ''), role: 'listitem', title: m.title + ': ' + U.fmtMinutes(v) },
        h('span', { class: 'hbar-label' }, m.title),
        h('span', { class: 'hbar-track' }, h('span', { class: 'hbar-fill', style: { width: (v / max * 100) + '%' } })),
        h('span', { class: 'hbar-value' }, Math.round(v / 60) + ' Min.')));
    });
    card.appendChild(bars);

    // Tagesverlauf
    var daily = days.map(function (d) { return APP.progress.dayTotal(d); });
    var dmax = Math.max.apply(null, daily.concat([60]));
    var cols = h('div', { class: 'cols', 'aria-label': 'Lernminuten pro Tag, letzte 30 Tage' });
    days.forEach(function (d, i) {
      var t = APP.store.state.time[d] || {};
      var parts = APP.MODULE_META.filter(function (m) { return t[m.id]; })
        .map(function (m) { return m.title + ' ' + Math.round(t[m.id] / 60); }).join(', ');
      var label = U.fmtDate(U.parseDay(d)) + ': ' + Math.round(daily[i] / 60) + ' Min.' + (parts ? ' (' + parts + ')' : '');
      cols.appendChild(h('div', { class: 'col', title: label, tabindex: 0, 'aria-label': label },
        h('span', { style: { height: (daily[i] / dmax * 100) + '%' } })));
    });
    card.appendChild(cols);
    card.appendChild(h('div', { class: 'cols-axis muted small' },
      h('span', null, U.fmtDate(U.parseDay(days[0])).slice(0, 6)), h('span', null, 'heute')));
    return card;
  }

  APP.registerView('dashboard', function (el) {
    var state = APP.store.state;
    var st = APP.progress.streak();
    var plan = APP.progress.maintenancePlan();
    var bk = backupInfo();
    var todaySec = APP.progress.dayTotal(U.dayStr());

    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Deutsch C2'),
      h('p', { class: 'muted' }, 'Orientierung: Goethe-Zertifikat C2 (GDS)')));

    el.appendChild(h('div', { class: 'tiles' },
      tile('Serie', st.days + (st.days === 1 ? ' Tag' : ' Tage'), st.todayDone ? 'heute erledigt' : 'heute noch offen'),
      tile('Heute', U.fmtMinutes(todaySec), 'Lernzeit'),
      tile('Fällig', String(plan.dueTotal), 'Wiederholungen'),
      h('a', { href: '#/daten', class: 'tile tile-link ' + (bk.warn ? 'is-warn' : '') },
        h('div', { class: 'tile-label' }, 'Letzte Sicherung'),
        h('div', { class: 'tile-value' }, bk.text),
        h('div', { class: 'tile-sub' }, bk.sub))));

    el.appendChild(focusCard(state));
    el.appendChild(h('div', { class: 'grid-2' }, maintenanceCard(), timeCard()));
  });
})(window.APP);
