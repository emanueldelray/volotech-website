/* Modul 1: Grammatik */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;
  var ID = 'grammatik';

  var TYPE_LABEL = {
    gap: 'Lückentext', transform: 'Umformung', error: 'Fehlerkorrektur', mc: 'Multiple Choice'
  };

  /* ---------- Inhalte (Seed + Import) ---------- */

  function seed() { return (window.DATA && window.DATA.grammatik) || { topics: [], items: [] }; }
  function imported() { return APP.store.state.content[ID] || { topics: [], items: [] }; }

  function topics() {
    var seen = {}, out = [];
    seed().topics.concat(imported().topics || []).forEach(function (t) {
      if (!seen[t.id]) { seen[t.id] = 1; out.push(t); }
    });
    return out;
  }

  function allItems() { return seed().items.concat(imported().items || []); }
  function items(topicId) { return allItems().filter(function (i) { return i.topic === topicId; }); }
  function getItem(id) { return allItems().filter(function (i) { return i.id === id; })[0] || null; }
  function topicById(id) { return topics().filter(function (t) { return t.id === id; })[0] || { id: id, title: id }; }

  function isUnverified(item) {
    return item.status === 'ungeprüft' && !APP.store.state.verified[ID + ':' + item.id];
  }

  /* ---------- Auswahl der Aufgaben ---------- */

  function pickItems(pool, n) {
    var last = {};
    APP.store.state.attempts.forEach(function (a) { if (a.m === ID) last[a.i] = a; });
    var scored = pool.map(function (it) {
      var a = last[it.id];
      // nie gesehen < zuletzt falsch < zuletzt richtig (älteste zuerst)
      var score = !a ? 0 : a.c ? 2e13 + a.ts : 1e13 + a.ts;
      return { it: it, score: score + Math.random() * 6e4 };
    });
    scored.sort(function (a, b) { return a.score - b.score; });
    return U.shuffle(scored.slice(0, n).map(function (s) { return s.it; }));
  }

  /* ---------- Aufgabe darstellen ---------- */

  /**
   * Rendert eine Aufgabe. done(correct) wird bei „Weiter“ aufgerufen.
   */
  function renderItem(el, item, done) {
    U.clear(el);
    var card = h('article', { class: 'card exercise' });
    el.appendChild(card);

    var verifyBtn = null;
    if (isUnverified(item)) {
      verifyBtn = h('button', {
        class: 'chip chip-warn', type: 'button', title: 'Inhalt geprüft? Dann als geprüft markieren.',
        onclick: function () {
          APP.store.state.verified[ID + ':' + item.id] = true;
          APP.store.save();
          verifyBtn.remove();
          U.toast('Als geprüft markiert.');
        }
      }, 'ungeprüft');
    }

    card.appendChild(h('div', { class: 'ex-head' },
      h('span', { class: 'chip' }, TYPE_LABEL[item.type] || item.type),
      h('span', { class: 'muted small' }, topicById(item.topic).title),
      verifyBtn));

    if (item.instruction) card.appendChild(h('p', { class: 'instruction' }, item.instruction));

    var input, getAnswer, mcButtons = [];
    var answered = false;
    var body = h('div', { class: 'ex-body' });
    card.appendChild(body);

    if (item.type === 'gap') {
      var parts = String(item.text).split('___');
      input = h('input', {
        type: 'text', class: 'gap-input', autocomplete: 'off', autocapitalize: 'off',
        spellcheck: 'false', 'aria-label': 'Lücke'
      });
      body.appendChild(h('p', { class: 'ex-text' }, parts[0], input, parts.slice(1).join('___')));
      getAnswer = function () { return input.value; };
    } else if (item.type === 'mc') {
      body.appendChild(h('p', { class: 'ex-text' }, item.text));
      var list = h('div', { class: 'mc-list' });
      item.options.forEach(function (opt, idx) {
        var b = h('button', { type: 'button', class: 'mc-option', onclick: function () { if (!answered) check(idx); } },
          h('span', { class: 'mc-key' }, String.fromCharCode(65 + idx)), h('span', null, opt));
        mcButtons.push(b);
        list.appendChild(b);
      });
      body.appendChild(list);
    } else {
      body.appendChild(h('p', { class: 'ex-text' }, item.text));
      var prefill = item.type === 'error' || item.prefill;
      input = h('textarea', {
        class: 'answer-input', rows: 3, autocomplete: 'off', spellcheck: 'false',
        'aria-label': 'Ihre Antwort', placeholder: prefill ? '' : 'Ihre Lösung …'
      });
      if (prefill) input.value = item.text;
      body.appendChild(input);
      getAnswer = function () { return input.value; };
    }

    var actions = h('div', { class: 'actions' });
    var feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
    card.appendChild(actions);
    card.appendChild(feedback);

    if (item.type !== 'mc') {
      var submit = h('button', { type: 'button', class: 'btn primary', onclick: function () { check(); } }, 'Prüfen');
      var skip = h('button', { type: 'button', class: 'btn ghost', onclick: function () { check(null, true); } }, 'Weiß nicht');
      actions.appendChild(submit);
      actions.appendChild(skip);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && !answered) { e.preventDefault(); check(); }
      });
      setTimeout(function () {
        input.focus();
        if (item.type === 'error' || item.prefill) input.setSelectionRange(input.value.length, input.value.length);
      }, 30);
    }

    function check(mcIndex, gaveUp) {
      answered = true;
      U.clear(actions);
      if (input) input.disabled = true;

      if (item.type === 'mc') {
        var ok = mcIndex === item.correct;
        mcButtons.forEach(function (b, i) {
          b.disabled = true;
          if (i === item.correct) b.classList.add('is-correct');
          else if (i === mcIndex) b.classList.add('is-wrong');
        });
        return finish(ok);
      }

      var ans = getAnswer();
      var unchanged = item.type === 'error' && U.normalize(ans) === U.normalize(item.text);
      var match = gaveUp || unchanged ? null : U.matchAnswer(ans, item.answers);

      if (match === 'exact') return finish(true);
      if (match === 'case') return finish(false, 'Nur Groß-/Kleinschreibung weicht ab – auf C2-Niveau zählt das als Fehler.', true);
      if (gaveUp) return finish(false);
      if (unchanged) return finish(false, 'Sie haben den Satz nicht verändert.');
      if (item.type === 'transform' || item.type === 'error') return selfGrade();
      return finish(false, null, true);
    }

    function solutions() {
      if (item.type === 'mc') return null;
      return h('div', { class: 'solutions' },
        h('div', { class: 'label' }, item.answers.length > 1 ? 'Akzeptierte Lösungen' : 'Lösung'),
        h('ul', null, item.answers.map(function (a) { return h('li', null, a); })));
    }

    function explanation() {
      return item.explanation ? h('p', { class: 'explanation' }, item.explanation) : null;
    }

    function selfGrade() {
      U.clear(feedback);
      feedback.className = 'feedback is-open';
      feedback.appendChild(h('p', { class: 'verdict' }, 'Nicht unter den gespeicherten Lösungen. Vergleichen Sie selbst:'));
      feedback.appendChild(solutions());
      feedback.appendChild(explanation());
      var row = h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn ok', onclick: function () { done(true); } }, 'Ich lag richtig'),
        h('button', { type: 'button', class: 'btn bad', onclick: function () { done(false); } }, 'Ich lag falsch'));
      feedback.appendChild(row);
    }

    function finish(ok, note, allowOverride) {
      U.clear(feedback);
      feedback.className = 'feedback is-open ' + (ok ? 'is-ok' : 'is-bad');
      feedback.appendChild(h('p', { class: 'verdict' }, ok ? 'Richtig.' : 'Leider falsch.'));
      if (note) feedback.appendChild(h('p', { class: 'small' }, note));
      if (!ok || (item.answers && item.answers.length > 1)) feedback.appendChild(solutions());
      feedback.appendChild(explanation());
      var next = h('button', { type: 'button', class: 'btn primary', onclick: function () { done(ok); } }, 'Weiter');
      var row = h('div', { class: 'actions' }, next);
      if (!ok && allowOverride) {
        row.appendChild(h('button', { type: 'button', class: 'btn ghost', onclick: function () { done(true); } }, 'Ich lag doch richtig'));
      }
      feedback.appendChild(row);
      setTimeout(function () { next.focus(); }, 30);
    }
  }

  /* ---------- Ansichten ---------- */

  function renderOverview(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Grammatik'),
      h('p', { class: 'muted' }, 'Ein Thema gilt als beherrscht bei ≥ 90 % richtig in den letzten 30 Aufgaben, verteilt auf mindestens 3 Tage.')));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);

    var open = topics().filter(function (t) { return !APP.progress.isMastered(ID, t.id); });
    if (open.length > 1) {
      el.appendChild(h('div', { class: 'actions' },
        h('a', { class: 'btn', href: '#/grammatik/ueben/_mix' }, 'Gemischte Runde (offene Themen)')));
    }

    var list = h('section', { class: 'card topic-list' });
    topics().forEach(function (t) {
      list.appendChild(APP.ui.masteryRow(ID, t, {
        href: '#/grammatik/ueben/' + encodeURIComponent(t.id),
        actions: h('div', { class: 'topic-actions' },
          h('a', { class: 'btn small primary', href: '#/grammatik/ueben/' + encodeURIComponent(t.id) }, 'Üben'),
          h('a', { class: 'btn small ghost', href: '#/grammatik/thema/' + encodeURIComponent(t.id) }, 'Aufgaben ansehen'))
      }));
    });
    el.appendChild(list);
  }

  function renderSession(el, topicId) {
    var size = APP.store.state.settings.sessionSize;
    var pool, title;
    if (topicId === '_mix') {
      var open = topics().filter(function (t) { return !APP.progress.isMastered(ID, t.id); });
      var ids = {};
      open.forEach(function (t) { ids[t.id] = 1; });
      pool = allItems().filter(function (i) { return ids[i.topic]; });
      if (!pool.length) pool = allItems();
      title = 'Gemischte Runde';
    } else {
      pool = items(topicId);
      title = topicById(topicId).title;
    }
    if (!pool.length) {
      el.appendChild(h('section', { class: 'card' }, h('p', null, 'Keine Aufgaben für dieses Thema gefunden.'), h('a', { href: '#/grammatik' }, 'Zurück')));
      return;
    }

    var queue = pickItems(pool, size);
    var idx = 0, correct = 0, newlyMastered = [];
    var head = h('header', { class: 'page-head' },
      h('a', { href: '#/grammatik', class: 'back' }, '← Grammatik'),
      h('h1', null, title));
    var counter = h('div', { class: 'counter muted small' });
    var stage = h('div');
    el.appendChild(head);
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);
    el.appendChild(counter);
    el.appendChild(stage);

    function next() {
      if (idx >= queue.length) return summary();
      counter.textContent = 'Aufgabe ' + (idx + 1) + ' von ' + queue.length;
      var item = queue[idx];
      renderItem(stage, item, function (ok) {
        if (ok) correct++;
        var res = APP.progress.record(ID, item.topic, item.id, ok);
        if (res.mastered) {
          newlyMastered.push(item.topic);
          U.toast('„' + topicById(item.topic).title + '“ beherrscht!');
        }
        idx++;
        next();
      });
    }

    function summary() {
      counter.textContent = '';
      U.clear(stage);
      var topicIds = {};
      queue.forEach(function (i) { topicIds[i.topic] = 1; });
      var card = h('section', { class: 'card' },
        h('h2', null, 'Runde beendet'),
        h('p', { class: 'big-number' }, correct + ' / ' + queue.length, h('span', { class: 'muted small' }, ' richtig')));
      newlyMastered.forEach(function (t) {
        card.appendChild(h('div', { class: 'notice ok' }, '„' + topicById(t).title + '“ ist beherrscht und wandert in die tägliche Wiederholung.'));
      });
      Object.keys(topicIds).forEach(function (t) { card.appendChild(APP.ui.masteryRow(ID, topicById(t))); });
      card.appendChild(h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn primary', onclick: function () { APP.navigate(location.hash); } }, 'Noch eine Runde'),
        h('a', { class: 'btn ghost', href: '#/grammatik' }, 'Themenübersicht'),
        h('a', { class: 'btn ghost', href: '#/' }, 'Start')));
      stage.appendChild(card);
    }

    next();
  }

  function renderTopicItems(el, topicId) {
    var t = topicById(topicId);
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/grammatik', class: 'back' }, '← Grammatik'),
      h('h1', null, t.title),
      t.description ? h('p', { class: 'muted' }, t.description) : null));
    el.appendChild(APP.ui.masteryRow(ID, t));
    var list = h('section', { class: 'item-list' });
    items(topicId).forEach(function (item) {
      var key = ID + ':' + item.id;
      var verified = !isUnverified(item);
      var toggle = h('label', { class: 'check small' },
        h('input', {
          type: 'checkbox', checked: verified || null,
          onchange: function (e) {
            if (e.target.checked) APP.store.state.verified[key] = true;
            else delete APP.store.state.verified[key];
            APP.store.save();
          }
        }), ' geprüft');
      var sol = item.type === 'mc'
        ? h('p', null, h('strong', null, 'Lösung: '), item.options[item.correct])
        : h('ul', { class: 'answers' }, item.answers.map(function (a) { return h('li', null, a); }));
      list.appendChild(h('details', { class: 'card item' },
        h('summary', null,
          h('span', { class: 'chip' }, TYPE_LABEL[item.type]), ' ',
          h('span', { class: 'item-text' }, item.text)),
        item.instruction ? h('p', { class: 'instruction' }, item.instruction) : null,
        item.type === 'mc' ? h('ol', { type: 'A' }, item.options.map(function (o) { return h('li', null, o); })) : null,
        sol,
        h('p', { class: 'explanation' }, item.explanation || ''),
        h('div', { class: 'item-foot' }, h('code', { class: 'muted small' }, item.id), item.status === 'ungeprüft' ? toggle : null)));
    });
    el.appendChild(list);
    el.appendChild(h('div', { class: 'actions' },
      h('a', { class: 'btn primary', href: '#/grammatik/ueben/' + encodeURIComponent(topicId) }, 'Dieses Thema üben')));
  }

  function render(el, params) {
    if (params[0] === 'ueben' && params[1]) return renderSession(el, params[1]);
    if (params[0] === 'thema' && params[1]) return renderTopicItems(el, params[1]);
    return renderOverview(el);
  }

  APP.registerModule({
    id: ID,
    title: 'Grammatik',
    topics: topics,
    items: items,
    getItem: getItem,
    render: render,
    review: {
      estimateSec: 45,
      render: function (el, itemId, done) {
        var item = getItem(itemId);
        renderItem(el, item, function (ok) {
          APP.progress.record(ID, item.topic, item.id, ok, { review: true });
          done(ok);
        });
      }
    }
  });
})(window.APP);
