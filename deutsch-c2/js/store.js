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
      // Lesen: eingefügte Artikel mit Fragen; Hören: Hörtexte (Audio-Dateien liegen in IndexedDB)
      reading: { articles: [] },
      listening: { entries: [] },
      // Lernzeit anderer Geräte (aus Abgleichen): { geräteId: { tag: { modul: sek } } }
      deviceTime: {},
      // Löschmarken für den Abgleich: { 'text:id': ts, 'article:id': ts, … }
      deleted: {},
      meta: { lastBackup: null }
    };
  }

  function merge(base, data) {
    // flaches Auffüllen fehlender Felder (für spätere Versionen)
    Object.keys(base).forEach(function (k) {
      if (data[k] === undefined) data[k] = base[k];
      else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) &&
               k !== 'topics' && k !== 'srs' && k !== 'time' && k !== 'verified' && k !== 'content' &&
               k !== 'deviceTime' && k !== 'deleted') {
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
    APP.sync.ensureDevice(state);
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

  /** Nach einem Abgleich: pro Thema nur die letzten N Versuche behalten */
  function trimAttempts(st) {
    var counts = {}, keep = [];
    for (var i = st.attempts.length - 1; i >= 0; i--) {
      var x = st.attempts[i], k = x.m + ':' + x.t;
      counts[k] = (counts[k] || 0) + 1;
      if (counts[k] <= MAX_ATTEMPTS_PER_TOPIC) keep.push(x);
    }
    st.attempts = keep.reverse();
  }

  /** Fremden Zustand auf das aktuelle Format bringen */
  function normalize(data) { return merge(defaults(), data); }

  function exportJSON() {
    state.meta.lastBackup = Date.now();
    save();
    // Hinweis: lokale Audiodateien (IndexedDB) sind nicht Teil der Sicherung
    return JSON.stringify({ app: 'deutsch-c2', exportedAt: new Date().toISOString(), data: state }, null, 1);
  }

  /** Gibt null bei Erfolg zurück, sonst eine Fehlermeldung. */
  function validateImport(text) {
    var obj;
    if (/^\s*</.test(text)) {
      var m = text.match(/<script[^>]*id="deutschc2-embedded"[^>]*>([\s\S]*?)<\/script>/);
      if (!m) return { error: 'Diese HTML-Datei enthält keinen Lernstand. Bitte eine mit „App + Lernstand“ exportierte Datei wählen.' };
      text = m[1];
    }
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
    return { data: d, exportedAt: obj.exportedAt, exportId: obj.exportId || null };
  }

  /** Lernstand vollständig ersetzen; dieses Gerät behält seine Kennung, Zeiten bleiben pro Gerät getrennt. */
  function replaceState(data) {
    var me = { id: state.meta.deviceId, name: state.meta.deviceName };
    var next = merge(defaults(), data);
    var rid = next.meta.deviceId;
    if (rid && rid !== me.id) {
      next.deviceTime = next.deviceTime || {};
      next.deviceTime[rid] = next.time;
      next.time = next.deviceTime[me.id] || {};
      delete next.deviceTime[me.id];
    }
    next.meta.deviceId = me.id;
    next.meta.deviceName = me.name;
    state = next;
    APP.sync.ensureDevice(state);
    save();
  }

  /** Fremden Lernstand einarbeiten; gibt die Zusammenfassung zurück */
  function mergeIn(data) {
    var sum = APP.sync.mergeStates(state, data);
    save();
    return sum;
  }

  function reset() {
    var me = { id: state.meta.deviceId, name: state.meta.deviceName };
    state = defaults();
    state.meta.deviceId = me.id;
    state.meta.deviceName = me.name;
    APP.sync.ensureDevice(state);
    save();
  }

  function sizeKB() {
    try { return Math.round((localStorage.getItem(KEY) || '').length / 1024); } catch (e) { return 0; }
  }

  APP.store = {
    load: load, save: save, get state() { return state; },
    addAttempt: addAttempt, exportJSON: exportJSON, validateImport: validateImport,
    replaceState: replaceState, mergeIn: mergeIn, reset: reset, sizeKB: sizeKB,
    trimAttempts: trimAttempts, normalize: normalize
  };
})(window.APP);
