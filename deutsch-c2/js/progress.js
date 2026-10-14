/* Lernfortschritt: Beherrschung, Wiederholungsschlange, Serie, Zeitstatistik */
(function (APP) {
  'use strict';
  var U = APP.util;

  var MASTERY = { window: 30, accuracy: 0.9, days: 3 };
  var NEEDED_CORRECT = Math.ceil(MASTERY.window * MASTERY.accuracy); // 27

  function S() { return APP.store.state; }
  function topicKey(m, t) { return m + ':' + t; }

  /** Antwort protokollieren. Gibt { mastered: true } zurück, wenn das Thema dadurch neu beherrscht ist. */
  function record(moduleId, topicId, itemId, correct, opts) {
    opts = opts || {};
    APP.store.addAttempt({
      m: moduleId, t: topicId, i: itemId, c: correct ? 1 : 0,
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
    var all = S().attempts.filter(function (a) { return a.m === moduleId && a.t === topicId; });
    var last = all.slice(-MASTERY.window);
    var correct = last.reduce(function (s, a) { return s + a.c; }, 0);
    var days = {};
    last.forEach(function (a) { days[a.d] = 1; });
    var nDays = Object.keys(days).length;
    var n = last.length;
    var mastered = n >= MASTERY.window && correct / n >= MASTERY.accuracy && nDays >= MASTERY.days;
    return {
      total: all.length,
      n: n,
      correct: correct,
      accuracy: n ? correct / n : 0,
      days: nDays,
      mastered: mastered,
      // Fortschritt Richtung 27/30 richtig, gedeckelt solange < 3 Tage
      progress: Math.min(1, correct / NEEDED_CORRECT) * (nDays >= MASTERY.days ? 1 : 0.97)
    };
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
    if (!mod) return;
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

  /** Fällige Karten, älteste zuerst. Nur Karten, deren Modul geladen ist. */
  function dueCards() {
    var today = U.dayStr();
    return Object.keys(S().srs)
      .filter(function (k) {
        var m = k.slice(0, k.indexOf(':'));
        return APP.modules[m] && APP.srs.isDue(S().srs[k], today) && APP.modules[m].getItem(k.slice(m.length + 1));
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
    MASTERY: MASTERY, record: record, topicStats: topicStats, isMastered: isMastered,
    syncSrs: syncSrs, dueCards: dueCards, maintenancePlan: maintenancePlan,
    maintenanceBudget: maintenanceBudget, reviewCard: reviewCard,
    dayTotal: dayTotal, streak: streak, timeByModule: timeByModule
  };
})(window.APP);
