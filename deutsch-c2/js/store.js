/* Persistenz: gesamter Zustand in einem localStorage-Schlüssel */
(function (APP) {
  'use strict';

  var KEY = 'deutschC2.state';
  var VERSION = 1;
  var MAX_ATTEMPTS_PER_TOPIC = 100;

  function defaults() {
    return {
      app: 'deutsch-c2',
      version: VERSION,
      createdAt: Date.now(),
      settings: {
        focus: 'grammatik',
        maintenanceMinutes: 10,
        focusTarget: 0.7,
        sessionSize: 10,
        vocabNewPerDay: 20
      },
      // Antwortprotokoll: { m: Modul, t: Thema, i: Item-ID, c: 1/0, d: Tag, ts, r: 1 = Wiederholung }
      attempts: [],
      // Beherrschte Themen: { 'grammatik:konj1': { masteredAt: ts } }
      topics: {},
      // SRS-Karten: { 'grammatik:g-konj1-01': { ef, reps, interval, due, last, lapses } }
      srs: {},
      // Lernzeit in Sekunden: { '2026-10-14': { grammatik: 300, _wartung: 120 } }
      time: {},
      // Vom Nutzer geprüfte Inhalte: { 'grammatik:g-konj1-01': true }
      verified: {},
      // Eigene/importierte Inhalte: { grammatik: { topics, items }, wortschatz: { decks, cards, overrides }, schreiben: { tasks } }
      content: {},
      // Schreiben: Entwürfe pro Aufgabe und abgegebene Texte mit Feedback
      writing: { drafts: {}, submissions: [] },
      meta: { lastBackup: null }
    };
  }

  function merge(base, data) {
    // flaches Auffüllen fehlender Felder (für spätere Versionen)
    Object.keys(base).forEach(function (k) {
      if (data[k] === undefined) data[k] = base[k];
      else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) &&
               k !== 'topics' && k !== 'srs' && k !== 'time' && k !== 'verified' && k !== 'content') {
        Object.keys(base[k]).forEach(function (kk) {
          if (data[k][kk] === undefined) data[k][kk] = base[k][kk];
        });
      }
    });
    return data;
  }

  var state;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) {
      console.error('Laden fehlgeschlagen', e);
      state = defaults();
    }
    return state;
  }

  var saveError = false;
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      saveError = false;
    } catch (e) {
      if (!saveError) APP.util.toast('Speichern fehlgeschlagen – Speicher voll? Bitte Daten exportieren.');
      saveError = true;
      console.error(e);
    }
  }

  function addAttempt(a) {
    state.attempts.push(a);
    // Pro Thema nur die letzten N Versuche behalten
    var key = a.m + ':' + a.t, count = 0;
    for (var i = state.attempts.length - 1; i >= 0; i--) {
      var x = state.attempts[i];
      if (x.m + ':' + x.t === key && ++count > MAX_ATTEMPTS_PER_TOPIC) {
        state.attempts.splice(i, 1);
      }
    }
  }

  function exportJSON() {
    state.meta.lastBackup = Date.now();
    save();
    return JSON.stringify({ app: 'deutsch-c2', exportedAt: new Date().toISOString(), data: state }, null, 1);
  }

  /** Gibt null bei Erfolg zurück, sonst eine Fehlermeldung. */
  function validateImport(text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { return { error: 'Die Datei ist kein gültiges JSON: ' + e.message }; }
    if (!obj || obj.app !== 'deutsch-c2' || !obj.data) {
      return { error: 'Die Datei ist keine Sicherung dieser App (Feld "app" fehlt oder ist falsch).' };
    }
    var d = obj.data;
    var problems = [];
    if (!Array.isArray(d.attempts)) problems.push('"attempts" ist keine Liste');
    ['settings', 'topics', 'srs', 'time'].forEach(function (k) {
      if (!d[k] || typeof d[k] !== 'object') problems.push('"' + k + '" fehlt');
    });
    if (typeof d.version === 'number' && d.version > VERSION) problems.push('Sicherung stammt aus einer neueren App-Version (' + d.version + ')');
    if (problems.length) return { error: 'Sicherung unvollständig: ' + problems.join(', ') + '.' };
    return { data: d, exportedAt: obj.exportedAt };
  }

  function replaceState(data) {
    state = merge(defaults(), data);
    save();
  }

  function reset() {
    state = defaults();
    save();
  }

  function sizeKB() {
    try { return Math.round((localStorage.getItem(KEY) || '').length / 1024); } catch (e) { return 0; }
  }

  APP.store = {
    load: load, save: save, get state() { return state; },
    addAttempt: addAttempt, exportJSON: exportJSON, validateImport: validateImport,
    replaceState: replaceState, reset: reset, sizeKB: sizeKB
  };
})(window.APP);
