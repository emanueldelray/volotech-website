/* Wiederverwendbare UI-Bausteine */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  function statusOf(moduleId, topicId, stats) {
    if (APP.progress.isMastered(moduleId, topicId)) {
      var mod = APP.modules[moduleId];
      return { key: 'done', label: mod && mod.review ? 'Beherrscht · Wiederholung' : 'Beherrscht' };
    }
    if (!stats.total) return { key: 'new', label: 'Neu' };
    return { key: 'work', label: 'In Arbeit' };
  }

  /** Fortschrittsbalken + Kennzahlen eines Themas */
  function masteryRow(moduleId, topic, opts) {
    opts = opts || {};
    var st = APP.progress.topicStats(moduleId, topic.id);
    var status = statusOf(moduleId, topic.id, st);
    var M = APP.progress.ruleFor(moduleId);
    var pct = status.key === 'done' ? 100 : Math.round(st.progress * 100);
    var detail = status.key === 'done'
      ? (APP.modules[moduleId] && APP.modules[moduleId].review ? 'Ins Wiederholungssystem übernommen' : 'Beherrscht')
      : st.n
        ? (st.n < M.window ? st.n + ' von ' + M.window + ' ' + M.unit : 'Letzte ' + M.window) +
          ' · ' + Math.round(st.accuracy * 100) + ' ' + (M.accuracyLabel || '% richtig') + ' · ' + Math.min(st.days, M.days) + '/' + M.days + ' Tage'
        : 'Noch nicht geübt';
    return h('div', { class: 'topic-row status-' + status.key },
      h('div', { class: 'topic-head' },
        opts.href ? h('a', { href: opts.href, class: 'topic-title' }, topic.title) : h('span', { class: 'topic-title' }, topic.title),
        h('span', { class: 'chip chip-' + status.key }, status.label)),
      h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': 'Beherrschung ' + topic.title },
        h('span', { style: { width: pct + '%' } })),
      h('div', { class: 'topic-meta' }, detail),
      opts.actions || null);
  }

  APP.ui = { masteryRow: masteryRow, statusOf: statusOf };
})(window.APP);
