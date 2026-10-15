/* Daten: Sicherung (Export/Import), Einstellungen, Zurücksetzen */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  function slugName(n) {
    return String(n || 'geraet').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'geraet';
  }

  function describeSource(res) {
    var d = res.data;
    var from = d.meta && d.meta.deviceName ? '„' + d.meta.deviceName + '“' : 'unbekanntes Gerät';
    var same = d.meta && d.meta.deviceId === APP.store.state.meta.deviceId;
    return (same ? 'Eigene Sicherung' : 'Lernstand von ' + from) + ', exportiert am ' + (res.exportedAt ? U.fmtDate(res.exportedAt) + ', ' + new Date(res.exportedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '?') + ': ' +
      d.attempts.length + ' Antworten, ' + Object.keys(d.srs).length + ' Wiederholungskarten, ' +
      Object.keys(d.topics).length + ' beherrschte Themen' +
      (d.writing && d.writing.submissions ? ', ' + d.writing.submissions.length + ' Texte' : '') + '.';
  }

  /** Auswahl „Zusammenführen“ / „Ersetzen“ für einen geprüften Lernstand */
  function mergeChoice(res, onCancel, cancelLabel) {
    var out = h('div', { class: 'notice' });
    out.appendChild(h('p', null, describeSource(res)));
    out.appendChild(h('p', { class: 'small' }, h('strong', null, 'Zusammenführen'), ' übernimmt alles Neue vom anderen Gerät und behält Ihren Stand hier (empfohlen, wenn Sie auf beiden Geräten lernen). ',
      h('strong', null, 'Ersetzen'), ' verwirft den Stand auf diesem Gerät.'));
    out.appendChild(h('div', { class: 'actions' },
      h('button', {
        type: 'button', class: 'btn primary', onclick: function () {
          var sum = APP.store.mergeIn(res.data);
          APP.progress.syncSrs();
          APP.store.save();
          if (res.exportId) APP.sync.markEmbedSeen({ exportId: res.exportId });
          U.clear(out).className = 'notice ok';
          out.appendChild(h('p', null, h('strong', null, 'Zusammengeführt mit „' + sum.from + '“. '), APP.sync.describe(sum)));
          out.appendChild(h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/' }, 'Zur Startseite')));
          U.toast('Lernstände zusammengeführt.');
        }
      }, 'Zusammenführen'),
      h('button', {
        type: 'button', class: 'btn bad', onclick: function () {
          if (!window.confirm('Den Lernstand auf diesem Gerät wirklich vollständig ersetzen?')) return;
          APP.store.replaceState(res.data);
          APP.progress.syncSrs();
          APP.store.save();
          if (res.exportId) APP.sync.markEmbedSeen({ exportId: res.exportId });
          U.toast('Lernstand ersetzt.');
          APP.navigate('#/');
        }
      }, 'Ersetzen'),
      onCancel ? h('button', { type: 'button', class: 'btn ghost', onclick: onCancel }, cancelLabel || 'Abbrechen') : null));
    return out;
  }

  APP.dataUi = { mergeChoice: mergeChoice };

  APP.registerView('daten', function (el) {
    var state = APP.store.state;
    var last = state.meta.lastBackup;

    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Daten & Abgleich'),
      h('p', { class: 'muted' }, 'Alle Daten liegen nur in diesem Browser. Für Sicherung und für die Arbeit auf mehreren Geräten (z. B. Handy und Laptop) exportieren Sie Ihren Lernstand und führen ihn auf dem anderen Gerät zusammen.')));

    // Dieses Gerät
    var nameIn = h('input', { type: 'text', value: state.meta.deviceName, maxlength: 40, 'aria-label': 'Gerätename' });
    nameIn.addEventListener('change', function () {
      state.meta.deviceName = nameIn.value.trim() || 'Gerät';
      APP.store.save();
      U.toast('Gerätename gespeichert.');
    });
    var log = (state.meta.syncLog || []).slice(-3).reverse();
    el.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Dieses Gerät'),
      h('label', { class: 'field' }, h('span', null, 'Name (erscheint beim Abgleich auf dem anderen Gerät)'), nameIn),
      log.length
        ? h('p', { class: 'muted small' }, 'Zuletzt zusammengeführt: ' + log.map(function (l) { return '„' + l.from + '“ am ' + U.fmtDate(l.at) + ', ' + new Date(l.at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }).join(' · '))
        : h('p', { class: 'muted small' }, 'Noch kein Abgleich mit einem anderen Gerät.')));

    var status = h('p', { class: last ? '' : 'warn-text' },
      'Letzte Sicherung: ', h('strong', null, last ? U.fmtDate(last) + ', ' + new Date(last).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'noch nie'));

    var bundled = APP.sync.isBundled();
    el.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Exportieren'),
      status,
      h('div', { class: 'export-options' },
        h('div', { class: 'export-option' },
          h('button', {
            type: 'button', class: 'btn primary', disabled: !bundled || null,
            onclick: function () {
              var html = APP.sync.buildEmbeddedHtml();
              if (!html) return;
              U.downloadFile('deutsch-c2-' + slugName(state.meta.deviceName) + '-' + U.dayStr() + '.html', html, 'text/html');
              U.toast('App mit Lernstand gespeichert.');
              APP.navigate('#/daten');
            }
          }, 'App + Lernstand als eine Datei'),
          h('p', { class: 'muted small' }, bundled
            ? 'Eine HTML-Datei, die App und Ihren Lernstand enthält. Auf dem anderen Gerät einfach öffnen – die App bietet an, den Lernstand zusammenzuführen.'
            : 'Nur in der Einzeldatei-Version verfügbar (deutsch-c2-einzeldatei.html). In dieser Ordner-Version bitte die JSON-Datei verwenden.')),
        h('div', { class: 'export-option' },
          h('button', {
            type: 'button', class: 'btn' + (bundled ? '' : ' primary'),
            onclick: function () {
              var json = APP.store.exportJSON();
              U.downloadFile('deutsch-c2-' + slugName(state.meta.deviceName) + '-' + U.dayStr() + '.json', json);
              U.toast('Lernstand heruntergeladen.');
              APP.navigate('#/daten');
            }
          }, 'Nur Lernstand (JSON)'),
          h('p', { class: 'muted small' }, 'Kleine Datei, ideal als Sicherung oder wenn die App auf dem anderen Gerät schon vorhanden ist.'))),
      h('p', { class: 'muted small' }, 'Speicherbedarf: ca. ' + APP.store.sizeKB() + ' KB. Nicht enthalten: lokal gewählte Audiodateien (Hören) – diese auf dem anderen Gerät erneut auswählen.')));

    var fileInput = h('input', { type: 'file', accept: '.json,.html,.htm,application/json,text/html', id: 'import-file' });
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
        msg.appendChild(APP.dataUi.mergeChoice(res, function () { U.clear(msg); fileInput.value = ''; }));
      };
      reader.readAsText(f);
    });

    el.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Importieren / zusammenführen'),
      h('p', { class: 'muted small' }, 'Eine exportierte JSON-Datei oder eine „App + Lernstand“-HTML-Datei wählen.'),
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
            APP.sync.touchSettings();
            APP.store.save();
            U.toast('Gespeichert.');
          }
        }));
    }
    el.appendChild(h('section', { class: 'card' },
      h('h2', null, 'Einstellungen'),
      h('div', { class: 'fields' },
        numField('Tägliche Wiederholung (Minuten)', 'maintenanceMinutes', 3, 60, 1),
        numField('Aufgaben pro Runde (Grammatik)', 'sessionSize', 5, 30, 1),
        numField('Neue Wortschatzkarten pro Tag', 'vocabNewPerDay', 0, 100, 5),
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
