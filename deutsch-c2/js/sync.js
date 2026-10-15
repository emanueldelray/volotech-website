/* Geräte-Abgleich ohne Server: Lernstände zusammenführen, Zeit pro Gerät, App + Lernstand in einer Datei */
(function (APP) {
  'use strict';
  var U = APP.util;
  var EMBED_ID = 'deutschc2-embedded';

  function S() { return APP.store.state; }

  /* ---------- Gerät ---------- */

  function ensureDevice(state) {
    var m = state.meta;
    if (!m.deviceId) m.deviceId = 'd-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (!m.deviceName) m.deviceName = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Handy' : 'Computer';
    state.deviceTime = state.deviceTime || {};
    state.deleted = state.deleted || {};
    m.seenEmbeds = m.seenEmbeds || {};
    m.syncLog = m.syncLog || [];
  }

  /** Lernzeit eines Tages über alle Geräte: { modul: sekunden, _wartung: … } */
  function timeOfDay(day) {
    var out = {};
    function add(t) { if (t) Object.keys(t).forEach(function (k) { out[k] = (out[k] || 0) + t[k]; }); }
    add(S().time[day]);
    var dt = S().deviceTime || {};
    Object.keys(dt).forEach(function (id) { add(dt[id][day]); });
    return out;
  }

  /** Löschung merken, damit ein Abgleich gelöschte Einträge nicht zurückholt */
  function tombstone(kind, id) {
    S().deleted = S().deleted || {};
    S().deleted[kind + ':' + id] = Date.now();
  }

  function touchSettings() { S().meta.settingsAt = Date.now(); }

  /* ---------- Zusammenführen ---------- */

  function unionById(local, remote, pick, counter) {
    local = local || [];
    var idx = {};
    local.forEach(function (x, i) { idx[x.id] = i; });
    (remote || []).forEach(function (r) {
      if (!r || !r.id) return;
      if (idx[r.id] === undefined) { local.push(r); idx[r.id] = local.length - 1; if (counter) counter.n++; }
      else if (pick) local[idx[r.id]] = pick(local[idx[r.id]], r);
    });
    return local;
  }

  function maxMerge(target, src) {
    Object.keys(src || {}).forEach(function (day) {
      var t = target[day] || (target[day] = {});
      Object.keys(src[day]).forEach(function (k) { t[k] = Math.max(t[k] || 0, src[day][k]); });
    });
    return target;
  }

  function newer(a, b, key) { return (b[key] || 0) > (a[key] || 0) ? b : a; }

  /**
   * Führt einen fremden Lernstand in den lokalen ein (lokaler Zustand wird verändert).
   * Gibt eine Zusammenfassung zurück.
   */
  function mergeStates(L, R) {
    ensureDevice(L);
    R = APP.store.normalize(JSON.parse(JSON.stringify(R)));
    var sum = { attempts: 0, srs: 0, texts: { n: 0 }, articles: { n: 0 }, entries: { n: 0 }, cards: { n: 0 }, items: { n: 0 }, tasks: { n: 0 }, mastered: 0 };
    var myId = L.meta.deviceId;
    var rid = (R.meta && R.meta.deviceId) || 'unbekannt';

    // Löschungen
    Object.keys(R.deleted || {}).forEach(function (k) { L.deleted[k] = Math.max(L.deleted[k] || 0, R.deleted[k]); });

    // Antworten (Duplikate über Zeitstempel + Item erkennen)
    function akey(a) { return a.u || (a.ts + '|' + a.m + '|' + a.i + '|' + a.c); }
    var seen = {};
    L.attempts.forEach(function (a) { seen[akey(a)] = 1; });
    R.attempts.forEach(function (a) {
      var k = akey(a);
      if (!seen[k]) { seen[k] = 1; L.attempts.push(a); sum.attempts++; }
    });
    L.attempts.sort(function (a, b) { return a.ts - b.ts; });
    APP.store.trimAttempts(L);

    // Beherrschte Themen
    Object.keys(R.topics).forEach(function (k) {
      if (!L.topics[k]) { L.topics[k] = R.topics[k]; sum.mastered++; }
      else L.topics[k].masteredAt = Math.min(L.topics[k].masteredAt, R.topics[k].masteredAt);
    });

    // Wiederholungskarten: zuletzt geübte Fassung gewinnt
    Object.keys(R.srs).forEach(function (k) {
      var l = L.srs[k], r = R.srs[k];
      if (!l) { L.srs[k] = r; sum.srs++; return; }
      if ((r.last || '') > (l.last || '') || ((r.last || '') === (l.last || '') && r.reps > l.reps)) {
        var added = l.added && r.added ? (l.added < r.added ? l.added : r.added) : (l.added || r.added);
        L.srs[k] = Object.assign({}, r, added ? { added: added } : {});
        sum.srs++;
      }
    });

    Object.keys(R.verified).forEach(function (k) { if (R.verified[k]) L.verified[k] = true; });

    // Eigene und importierte Inhalte
    var LC = L.content, RC = R.content;
    if (RC.grammatik) {
      LC.grammatik = LC.grammatik || {};
      LC.grammatik.topics = unionById(LC.grammatik.topics, RC.grammatik.topics);
      LC.grammatik.items = unionById(LC.grammatik.items, RC.grammatik.items, null, sum.items);
    }
    if (RC.wortschatz) {
      LC.wortschatz = LC.wortschatz || {};
      var lw = LC.wortschatz, rw = RC.wortschatz;
      lw.decks = unionById(lw.decks, rw.decks);
      lw.cards = unionById(lw.cards, rw.cards, function (a, b) { return (b.updatedAt || b.createdAt || 0) > (a.updatedAt || a.createdAt || 0) ? b : a; }, sum.cards);
      lw.overrides = lw.overrides || {};
      Object.keys(rw.overrides || {}).forEach(function (id) {
        var a = lw.overrides[id], b = rw.overrides[id];
        lw.overrides[id] = !a ? b : newer(a, b, 'updatedAt');
      });
    }
    if (RC.schreiben) {
      LC.schreiben = LC.schreiben || {};
      LC.schreiben.tasks = unionById(LC.schreiben.tasks, RC.schreiben.tasks, null, sum.tasks);
    }

    // Texte
    L.writing.submissions = unionById(L.writing.submissions, R.writing.submissions, function (a, b) {
      var pick = a;
      if (!a.feedback && b.feedback) pick = b;
      else if (a.feedback && b.feedback && (b.feedbackAt || 0) > (a.feedbackAt || 0)) pick = b;
      var other = pick === a ? b : a;
      if (pick.feedback && other.feedback && pick.feedback.errors.length === other.feedback.errors.length) {
        pick.feedback.errors.forEach(function (e, i) {
          var oc = other.feedback.errors[i].converted;
          if (oc) e.converted = Object.assign({}, oc, e.converted);
        });
      }
      return pick;
    }, sum.texts);
    Object.keys(R.writing.drafts || {}).forEach(function (k) {
      var a = L.writing.drafts[k], b = R.writing.drafts[k];
      L.writing.drafts[k] = !a ? b : newer(a, b, 'updatedAt');
    });

    // Artikel und Hörtexte
    function mergeReading(a, b) {
      var m = Object.assign({}, a);
      if ((b.questionsAt || 0) > (a.questionsAt || 0)) { m.questions = b.questions; m.questionsAt = b.questionsAt; }
      if (!m.questions && b.questions) m.questions = b.questions;
      var runs = {};
      (a.runs || []).concat(b.runs || []).forEach(function (r) { runs[r.at] = r; });
      m.runs = Object.keys(runs).map(function (k) { return runs[k]; }).sort(function (x, y) { return x.at - y.at; });
      if (a.saved || b.saved) {
        var sv = {};
        (a.saved || []).concat(b.saved || []).forEach(function (t) { sv[t] = 1; });
        m.saved = Object.keys(sv);
      }
      if (a.segments || b.segments) m.segments = Object.assign({}, b.segments, a.segments);
      if (!m.fileName && b.fileName) m.fileName = b.fileName;
      return m;
    }
    L.reading.articles = unionById(L.reading.articles, R.reading.articles, mergeReading, sum.articles);
    L.listening.entries = unionById(L.listening.entries, R.listening.entries, mergeReading, sum.entries);

    // Lernzeit: pro Gerät, Maximum je Tag und Modul (nie doppelt gezählt)
    Object.keys(R.deviceTime || {}).forEach(function (id) {
      if (id === myId) return;
      L.deviceTime[id] = maxMerge(L.deviceTime[id] || {}, R.deviceTime[id]);
    });
    if (rid !== myId) L.deviceTime[rid] = maxMerge(L.deviceTime[rid] || {}, R.time);

    // Einstellungen: neuere gewinnen (Wiedergabegeschwindigkeit bleibt pro Gerät)
    if ((R.meta.settingsAt || 0) > (L.meta.settingsAt || 0)) {
      var rate = L.settings.audioRate;
      L.settings = Object.assign({}, L.settings, R.settings);
      if (rate) L.settings.audioRate = rate; else delete L.settings.audioRate;
      L.meta.settingsAt = R.meta.settingsAt;
    }
    L.meta.lastBackup = Math.max(L.meta.lastBackup || 0, R.meta.lastBackup || 0) || null;

    // Gelöschtes entfernen
    var del = L.deleted;
    L.writing.submissions = L.writing.submissions.filter(function (s) { return !del['text:' + s.id]; });
    L.reading.articles = L.reading.articles.filter(function (a) { return !del['article:' + a.id]; });
    L.listening.entries = L.listening.entries.filter(function (e) { return !del['entry:' + e.id]; });
    if (LC.wortschatz && LC.wortschatz.cards) {
      LC.wortschatz.cards = LC.wortschatz.cards.filter(function (c) { return !del['card:' + c.id]; });
      Object.keys(L.srs).forEach(function (k) {
        var m = k.match(/^wortschatz:(.+)#\w+$/);
        if (m && del['card:' + m[1]]) delete L.srs[k];
      });
    }

    var log = { at: Date.now(), from: R.meta.deviceName || 'unbekanntes Gerät', deviceId: rid };
    L.meta.syncLog = (L.meta.syncLog || []).concat([log]).slice(-10);

    return {
      from: log.from,
      attempts: sum.attempts, srs: sum.srs, mastered: sum.mastered,
      texts: sum.texts.n, articles: sum.articles.n, entries: sum.entries.n,
      cards: sum.cards.n, items: sum.items.n, tasks: sum.tasks.n
    };
  }

  function describe(sum) {
    var parts = [];
    if (sum.attempts) parts.push(sum.attempts + ' Antworten');
    if (sum.srs) parts.push(sum.srs + ' Wiederholungskarten aktualisiert');
    if (sum.mastered) parts.push(sum.mastered + ' beherrschte Themen');
    if (sum.texts) parts.push(sum.texts + ' Texte');
    if (sum.articles) parts.push(sum.articles + ' Artikel');
    if (sum.entries) parts.push(sum.entries + ' Hörtexte');
    if (sum.cards) parts.push(sum.cards + ' eigene Karten');
    if (sum.items) parts.push(sum.items + ' Grammatikaufgaben');
    if (sum.tasks) parts.push(sum.tasks + ' Schreibaufgaben');
    return parts.length ? 'Neu übernommen: ' + parts.join(', ') + '.' : 'Keine neuen Einträge – beide Stände waren bereits gleich.';
  }

  /* ---------- App + Lernstand in einer Datei (nur Einzeldatei-Version) ---------- */

  var sourceClone = null;

  function isBundled() { return window.APP_BUNDLED === true; }

  /** Beim Start aufrufen, bevor etwas gerendert wird */
  function captureSource() {
    if (!isBundled()) return;
    sourceClone = document.documentElement.cloneNode(true);
    var old = sourceClone.querySelector('#' + EMBED_ID);
    if (old) old.remove();
  }

  /** HTML-Text der App mit eingebettetem Lernstand */
  function buildEmbeddedHtml() {
    if (!sourceClone) return null;
    var exportId = S().meta.deviceId + '-' + Date.now().toString(36);
    S().meta.lastBackup = Date.now();
    S().meta.seenEmbeds[exportId] = true;
    APP.store.save();
    var payload = { app: 'deutsch-c2', exportId: exportId, exportedAt: new Date().toISOString(), data: S() };
    var clone = sourceClone.cloneNode(true);
    var script = document.createElement('script');
    script.type = 'application/json';
    script.id = EMBED_ID;
    script.textContent = JSON.stringify(payload).replace(/</g, '\\u003c');
    clone.querySelector('head').appendChild(script);
    return '<!doctype html>\n' + clone.outerHTML;
  }

  /** Eingebetteten Lernstand lesen, falls diese Datei einen enthält und er noch nicht übernommen wurde */
  function pendingEmbed() {
    var el = document.getElementById(EMBED_ID);
    if (!el) return null;
    var payload;
    try { payload = JSON.parse(el.textContent); } catch (e) { return null; }
    if (!payload || payload.app !== 'deutsch-c2' || !payload.data) return null;
    if (S().meta.seenEmbeds[payload.exportId]) return null;
    return payload;
  }

  function markEmbedSeen(payload) {
    S().meta.seenEmbeds[payload.exportId] = true;
    APP.store.save();
  }

  APP.sync = {
    ensureDevice: ensureDevice, timeOfDay: timeOfDay, tombstone: tombstone, touchSettings: touchSettings,
    mergeStates: mergeStates, describe: describe,
    isBundled: isBundled, captureSource: captureSource, buildEmbeddedHtml: buildEmbeddedHtml,
    pendingEmbed: pendingEmbed, markEmbedSeen: markEmbedSeen
  };
})(window.APP);
