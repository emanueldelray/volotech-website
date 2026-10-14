/* Spaced Repetition nach SM-2 (Piotr Woźniak), leicht vereinfacht */
(function (APP) {
  'use strict';
  var U = APP.util;

  function newCard(due) {
    return { ef: 2.5, reps: 0, interval: 0, due: due || U.dayStr(), last: null, lapses: 0 };
  }

  /**
   * quality: 0–5 (SM-2). Praktisch: 1 = falsch, 3 = schwer, 4 = gut, 5 = leicht.
   * Gibt eine neue Karte zurück.
   */
  function review(card, quality) {
    var c = Object.assign({}, card);
    var today = U.dayStr();
    if (quality < 3) {
      c.reps = 0;
      c.interval = 1;
      c.lapses = (c.lapses || 0) + 1;
    } else {
      c.reps += 1;
      if (c.reps === 1) c.interval = quality >= 5 ? 4 : 1;
      else if (c.reps === 2) c.interval = quality === 3 ? 3 : quality >= 5 ? 8 : 6;
      else {
        var factor = quality === 3 ? 0.8 : quality >= 5 ? 1.3 : 1;
        c.interval = Math.max(c.interval + 1, Math.round(c.interval * c.ef * factor));
      }
    }
    c.ef = Math.max(1.3, c.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    c.due = U.addDays(today, c.interval);
    c.last = today;
    return c;
  }

  /** Vorschau: Intervall in Tagen bei gegebener Bewertung */
  function previewInterval(card, quality) {
    return review(card || newCard(), quality).interval;
  }

  function isDue(card, day) {
    return card.due <= (day || U.dayStr());
  }

  APP.srs = { newCard: newCard, review: review, isDue: isDue, previewInterval: previewInterval };
})(window.APP);
