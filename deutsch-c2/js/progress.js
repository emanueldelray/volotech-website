/* Lernfortschritt: Beherrschung, Wiederholungsschlange, Serie, Zeitstatistik */
(function (APP) {
  'use strict';
  var U = APP.util;

  // Standardregel; Module können eine eigene Regel (mod.mastery) festlegen
  var MASTERY = { window: 30, accuracy: 0.9, days: 3, unit: 'Aufgaben' };

  function ruleFor(moduleId) {
    var m = APP.modules[moduleId];
    return Object.assign({}, MASTERY, (m && m.mastery) || {});
  }

  function S() { return APP.store.state; }
  function topicKey(m, t) { return m + ':' + t; }

  /**
   * Antwort protokollieren. correct: true/false oder Anteil 0–1 (z. B. Textbewertung).
   * Gibt { mastered: true } zurück, wenn das Thema dadurch neu beherrscht ist.
   */
  function record(moduleId, topicId, itemId, correct, opts) {
    opts = opts || {};
    var c = typeof correct === 'number' ? Math.max(0, Math.min(1, correct)) : correct ? 1 : 0;
    APP.store.addAttempt({
      m: moduleId, t: topicId, i: itemId, c: c,
      d: U.dayStr(), ts: Date.now(), r: opts.review ? 1 : 0
    });
    var result = { mastered: false };
    if (!isMastered(moduleId, topicId) && topicStats(moduleId, topicId).mastered) {
      markMastered(moduleId, topicId);
      result.mastered = true;
    }
    APP.store.save();
    return result;
  }

  function topicStats(moduleId, topicId) {
    var R = ruleFor(moduleId);
    var all = S().attempts.filter(function (a) { return a.m === moduleId && a.t === topicId; });
    var last = all.slice(-R.window);
    var correct = last.reduce(function (s, a) { return s + a.c; }, 0);
    var days = {};
    last.forEach(function (a) { days[a.d] = 1; });
    var nDays = Object.keys(days).length;
    var n = last.length;
    var mastered = n >= R.window && correct / n >= R.accuracy - 1e-9 && nDays >= R.days;
    return {
      total: all.length,
      n: n,
      correct: correct,
      accuracy: n ? correct / n : 0,
      days: nDays,
      mastered: mastered,
      // Fortschritt Richtung z. B. 27/30 richtig, gedeckelt solange die Tage fehlen
      progress: Math.min(1, correct / (R.window * R.accuracy)) * (nDays >= R.days ? 1 : 0.97)
    };
  }

  /** Versuche zu einem Item entfernen (z. B. wenn ein Textfeedback ersetzt wird). */
  function removeAttempts(moduleId, itemId) {
    S().attempts = S().attempts.filter(function (a) { return !(a.m === moduleId && a.i === itemId); });
  }

  function isMastered(moduleId, topicId) {
    return !!S().topics[topicKey(moduleId, topicId)];
  }

  function markMastered(moduleId, topicId) {
    S().topics[topicKey(moduleId, topicId)] = { masteredAt: Date.now() };
    enqueueTopic(moduleId, topicId);
  }

  /** Items eines beherrschten Themas in die SRS-Schlange legen (gestaffelt ab morgen). */
  function enqueueTopic(moduleId, topicId) {
    var mod = APP.modules[moduleId];
    // Module mit eigenem Lernstapel (Wortschatz) planen ihre Karten selbst
    if (!mod || mod.enqueueOnMastery === false) return;
    var tomorrow = U.addDays(U.dayStr(), 1);
    mod.items(topicId).forEach(function (item, idx) {
      var key = moduleId + ':' + item.id;
      if (!S().srs[key]) S().srs[key] = APP.srs.newCard(U.addDays(tomorrow, idx % 3));
    });
  }

  /** Neue Items in bereits beherrschten Themen nachträglich einreihen. */
  function syncSrs() {
    Object.keys(S().topics).forEach(function (k) {
      var p = k.indexOf(':');
      enqueueTopic(k.slice(0, p), k.slice(p + 1));
    });
  }

  /**
   * Fällige Karten für den Wartungsblock, älteste zuerst: nur Karten
   * geladener Module, deren Thema bereits beherrscht ist.
   */
  function dueCards() {
    var today = U.dayStr();
    return Object.keys(S().srs)
      .filter(function (k) {
        var m = k.slice(0, k.indexOf(':'));
        var mod = APP.modules[m];
        if (!mod || !APP.srs.isDue(S().srs[k], today)) return false;
        var topic = mod.topicOf(k.slice(m.length + 1));
        return topic !== null && isMastered(m, topic);
      })
      .sort(function (a, b) { return S().srs[a].due < S().srs[b].due ? -1 : 1; });
  }

  function estimateSec(cardKey) {
    var m = APP.modules[cardKey.slice(0, cardKey.indexOf(':'))];
    return (m && m.review && m.review.estimateSec) || 30;
  }

  function maintenanceBudget() {
    var day = S().time[U.dayStr()] || {};
    var cap = S().settings.maintenanceMinutes * 60;
    return { cap: cap, done: day._wartung || 0, left: Math.max(0, cap - (day._wartung || 0)) };
  }

  /** Heutiger Wartungsblock: fällige Karten bis zum Zeitbudget. */
  function maintenancePlan() {
    var budget = maintenanceBudget();
    var due = dueCards();
    var plan = [], sec = 0;
    for (var i = 0; i < due.length; i++) {
      var e = estimateSec(due[i]);
      if (sec + e > budget.left) break;
      plan.push(due[i]);
      sec += e;
    }
    return { cards: plan, estSec: sec, dueTotal: due.length, budget: budget };
  }

  function reviewCard(cardKey, quality) {
    S().srs[cardKey] = APP.srs.review(S().srs[cardKey] || APP.srs.newCard(), quality);
    APP.store.save();
  }

  function dayTotal(day) {
    var t = S().time[day] || {};
    return Object.keys(t).reduce(function (s, k) { return k.charAt(0) === '_' ? s : s + t[k]; }, 0);
  }

  /** Aktiver Tag = mindestens 1 Minute Lernzeit. */
  function streak() {
    var today = U.dayStr();
    var d = dayTotal(today) >= 60 ? today : U.addDays(today, -1);
    var n = 0;
    while (dayTotal(d) >= 60) { n++; d = U.addDays(d, -1); }
    return { days: n, todayDone: dayTotal(today) >= 60 };
  }

  /** Sekunden pro Modul über die letzten n Tage */
  function timeByModule(nDays) {
    var out = {};
    U.lastNDays(nDays).forEach(function (d) {
      var t = S().time[d] || {};
      Object.keys(t).forEach(function (k) {
        if (k.charAt(0) !== '_') out[k] = (out[k] || 0) + t[k];
      });
    });
    return out;
  }

  APP.progress = {
    MASTERY: MASTERY, ruleFor: ruleFor, record: record, removeAttempts: removeAttempts, topicStats: topicStats, isMastered: isMastered,
    syncSrs: syncSrs, dueCards: dueCards, maintenancePlan: maintenancePlan,
    maintenanceBudget: maintenanceBudget, reviewCard: reviewCard,
    dayTotal: dayTotal, streak: streak, timeByModule: timeByModule
  };
})(window.APP);
