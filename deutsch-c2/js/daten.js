/* Daten: Sicherung (Export/Import), Einstellungen, Zurücksetzen */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  APP.registerView('daten', function (el) {
    var state = APP.store.state;
    var last = state.meta.lastBackup;

    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Daten & Sicherung'),
      h('p', { class: 'muted' }, 'Alle Daten liegen nur in diesem Browser (localStorage). Exportieren Sie regelmäßig eine Sicherung.')));

    var status = h('p', { class: last ? '' : 'warn-text' },
      'Letzte Sicherung: ', h('strong', null, last ? U.fmtDate(last) + ', ' + new Date(last).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'noch nie'));

    el.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Exportieren'),
      status,
      h('p', { class: 'muted small' }, 'Speicherbedarf: ca. ' + APP.store.sizeKB() + ' KB'),
      h('div', { class: 'actions' },
        h('button', {
          type: 'button', class: 'btn primary',
          onclick: function () {
            var json = APP.store.exportJSON();
            U.downloadFile('deutsch-c2-sicherung-' + U.dayStr() + '.json', json);
            U.toast('Sicherung heruntergeladen.');
            APP.navigate('#/daten');
          }
        }, 'Alle Daten exportieren (JSON)'))));

    var fileInput = h('input', { type: 'file', accept: '.json,application/json', id: 'import-file' });
    var msg = h('div', { 'aria-live': 'polite' });
    fileInput.addEventListener('change', function () {
      var f = fileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        U.clear(msg);
        var res = APP.store.validateImport(String(reader.result));
        if (res.error) {
          msg.appendChild(h('div', { class: 'notice bad' }, res.error));
          return;
        }
        var d = res.data;
        var info = 'Sicherung vom ' + (res.exportedAt ? U.fmtDate(res.exportedAt) : '?') + ': ' +
          d.attempts.length + ' Antworten, ' + Object.keys(d.srs).length + ' Wiederholungskarten, ' +
          Object.keys(d.topics).length + ' beherrschte Themen.';
        msg.appendChild(h('div', { class: 'notice' },
          h('p', null, info),
          h('p', null, h('strong', null, 'Achtung: '), 'Der aktuelle Stand wird vollständig ersetzt.'),
          h('div', { class: 'actions' },
            h('button', {
              type: 'button', class: 'btn primary',
              onclick: function () {
                APP.store.replaceState(d);
                APP.progress.syncSrs();
                APP.store.save();
                U.toast('Sicherung wiederhergestellt.');
                APP.navigate('#/');
              }
            }, 'Ersetzen und wiederherstellen'),
            h('button', { type: 'button', class: 'btn ghost', onclick: function () { U.clear(msg); fileInput.value = ''; } }, 'Abbrechen'))));
      };
      reader.readAsText(f);
    });

    el.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Importieren'),
      h('p', { class: 'muted small' }, 'Eine zuvor exportierte Sicherungsdatei wählen.'),
      h('label', { class: 'file-label', for: 'import-file' }, fileInput),
      msg));

    // Einstellungen
    function numField(label, key, min, max, step, scale) {
      scale = scale || 1;
      return h('label', { class: 'field' }, h('span', null, label),
        h('input', {
          type: 'number', min: min, max: max, step: step, value: Math.round(state.settings[key] * scale),
          onchange: function (e) {
            var v = Math.min(max, Math.max(min, Number(e.target.value) || min));
            state.settings[key] = v / scale;
            APP.store.save();
            U.toast('Gespeichert.');
          }
        }));
    }
    el.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Einstellungen'),
      h('div', { class: 'fields' },
        numField('Tägliche Wiederholung (Minuten)', 'maintenanceMinutes', 3, 60, 1),
        numField('Aufgaben pro Runde', 'sessionSize', 5, 30, 1),
        numField('Ziel-Fokusanteil (%)', 'focusTarget', 50, 100, 5, 100))));

    el.appendChild(h('section', { class: 'card danger-zone' },
      h('h2', null, 'Zurücksetzen'),
      h('p', { class: 'muted small' }, 'Löscht den gesamten Lernstand in diesem Browser. Vorher exportieren!'),
      h('button', {
        type: 'button', class: 'btn bad',
        onclick: function () {
          if (window.confirm('Wirklich alle Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
            APP.store.reset();
            U.toast('Alle Daten gelöscht.');
            APP.navigate('#/');
          }
        }
      }, 'Alle Daten löschen')));
  });
})(window.APP);
