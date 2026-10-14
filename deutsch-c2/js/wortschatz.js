/* Modul 2: Wortschatz – Karteikarten mit Spaced Repetition */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;
  var ID = 'wortschatz';

  var KINDS = ['rec', 'cloze', 'prod']; // Einführungsreihenfolge
  var KIND_LABEL = { rec: 'Erkennen', prod: 'Produzieren', cloze: 'Lückensatz' };
  var REGISTERS = ['neutral', 'gehoben', 'umgangssprachlich', 'fachsprachlich'];
  var GRADES = [
    { q: 1, label: 'Nochmal', cls: 'bad' },
    { q: 3, label: 'Schwer', cls: '' },
    { q: 4, label: 'Gut', cls: 'ok' },
    { q: 5, label: 'Leicht', cls: '' }
  ];
  var SESSION_NEW_MAX = 10;
  var SESSION_DUE_MAX = 60;

  function S() { return APP.store.state; }

  /* ---------- Inhalte (Seed + eigene Karten + Korrekturen) ---------- */

  function seed() { return (window.DATA && window.DATA.wortschatz) || { decks: [], cards: [] }; }

  function own() {
    var c = S().content;
    if (!c[ID]) c[ID] = {};
    var o = c[ID];
    o.decks = o.decks || [];
    o.cards = o.cards || [];
    o.overrides = o.overrides || {};
    return o;
  }

  function decks() {
    var seen = {}, out = [];
    seed().decks.concat(own().decks).forEach(function (d) {
      if (!seen[d.id]) { seen[d.id] = 1; out.push(d); }
    });
    return out;
  }

  function deckById(id) { return decks().filter(function (d) { return d.id === id; })[0] || { id: id, title: id }; }

  function cards() {
    var ov = own().overrides;
    return seed().cards.map(function (c) { return ov[c.id] ? Object.assign({}, c, ov[c.id]) : c; })
      .concat(own().cards);
  }

  function cardById(id) { return cards().filter(function (c) { return c.id === id; })[0] || null; }
  function deckCards(deckId) { return cards().filter(function (c) { return c.deck === deckId; }); }

  /** Lückensatz aus dem Beispiel: [[…]] markiert die Lücke, sonst wird der Begriff gesucht. */
  function parseCloze(card) {
    var ex = card.example || '';
    var m = ex.match(/^([\s\S]*?)\[\[([\s\S]+?)\]\]([\s\S]*)$/);
    if (m) return { before: m[1], answer: m[2], after: m[3].replace(/\[\[|\]\]/g, '') };
    var term = (card.term || '').replace(/^(der|die|das)\s+/i, '');
    var i = term ? ex.toLowerCase().indexOf(term.toLowerCase()) : -1;
    if (i < 0) return null;
    return { before: ex.slice(0, i), answer: ex.substr(i, term.length), after: ex.slice(i + term.length) };
  }

  function plainExample(card) { return (card.example || '').replace(/\[\[|\]\]/g, ''); }

  function exampleNode(card) {
    var cz = parseCloze(card);
    if (!cz) return h('span', null, plainExample(card));
    return h('span', null, cz.before, h('strong', null, cz.answer), cz.after);
  }

  function kindsOf(card) {
    return KINDS.filter(function (k) { return k !== 'cloze' || parseCloze(card); });
  }

  function sub(card, kind) { return { id: card.id + '#' + kind, topic: card.deck, card: card, kind: kind }; }

  function items(deckId) {
    var out = [];
    deckCards(deckId).forEach(function (c) { kindsOf(c).forEach(function (k) { out.push(sub(c, k)); }); });
    return out;
  }

  function getItem(subId) {
    var p = subId.lastIndexOf('#');
    if (p < 0) return null;
    var card = cardById(subId.slice(0, p));
    var kind = subId.slice(p + 1);
    if (!card || kindsOf(card).indexOf(kind) < 0) return null;
    return sub(card, kind);
  }

  function srsKey(subId) { return ID + ':' + subId; }
  function srsOf(subId) { return S().srs[srsKey(subId)] || null; }

  function isUnverified(card) {
    return card.status === 'ungeprüft' && !S().verified[ID + ':' + card.id];
  }

  /* ---------- Validierung (auch für den Import in Phase 4) ---------- */

  function validateCard(c) {
    var errors = [];
    if (!c || typeof c !== 'object') return ['Karte ist kein Objekt.'];
    if (!c.term || typeof c.term !== 'string') errors.push('„term“ fehlt.');
    if (!c.meaning || typeof c.meaning !== 'string') errors.push('„meaning“ fehlt.');
    if (!c.deck || typeof c.deck !== 'string') errors.push('„deck“ fehlt.');
    if (c.register && REGISTERS.indexOf(c.register) < 0) errors.push('„register“ muss einer dieser Werte sein: ' + REGISTERS.join(', ') + '.');
    ['collocations', 'tags'].forEach(function (k) {
      if (c[k] !== undefined && !(Array.isArray(c[k]) && c[k].every(function (x) { return typeof x === 'string'; }))) {
        errors.push('„' + k + '“ muss eine Liste von Texten sein.');
      }
    });
    if (c.example && typeof c.example !== 'string') errors.push('„example“ muss ein Text sein.');
    if (c.example && /\[\[/.test(c.example) && !/\[\[[^\]]+\]\]/.test(c.example)) errors.push('„example“: [[…]] ist nicht korrekt geschlossen.');
    return errors;
  }

  /* ---------- Planung ---------- */

  function introducedToday() {
    var today = U.dayStr(), n = 0;
    Object.keys(S().srs).forEach(function (k) {
      if (k.indexOf(ID + ':') === 0 && S().srs[k].added === today) n++;
    });
    return n;
  }

  function newLeftToday() { return Math.max(0, S().settings.vocabNewPerDay - introducedToday()); }

  function dueIn(deckIds) {
    var today = U.dayStr(), out = [];
    deckIds.forEach(function (d) {
      items(d).forEach(function (s) {
        var c = srsOf(s.id);
        if (c && c.due <= today) out.push({ s: s, due: c.due });
      });
    });
    out.sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : 0; });
    return out.map(function (x) { return x.s; });
  }

  /** Neue Lernkarten: pro Karte zuerst Erkennen, die anderen Richtungen erst an späteren Tagen. */
  function newCandidates(deckIds, limit) {
    var today = U.dayStr(), out = [];
    for (var di = 0; di < deckIds.length && out.length < limit; di++) {
      var cs = deckCards(deckIds[di]);
      for (var ci = 0; ci < cs.length && out.length < limit; ci++) {
        var ks = kindsOf(cs[ci]);
        for (var ki = 0; ki < ks.length; ki++) {
          var s = sub(cs[ci], ks[ki]);
          if (srsOf(s.id)) continue;
          if (ki > 0) {
            var prev = srsOf(cs[ci].id + '#' + ks[ki - 1]);
            if (!prev || prev.added === today) break;
          }
          out.push(s);
          break; // höchstens eine neue Richtung pro Karte und Tag
        }
      }
    }
    return out;
  }

  function deckCounts(deckId) {
    var all = items(deckId);
    var unseen = all.filter(function (s) { return !srsOf(s.id); }).length;
    return { cards: deckCards(deckId).length, total: all.length, due: dueIn([deckId]).length, unseen: unseen };
  }

  function openDecks() {
    return decks().filter(function (d) { return !APP.progress.isMastered(ID, d.id); }).map(function (d) { return d.id; });
  }

  /* ---------- Bewertung ---------- */

  function grade(s, q, opts) {
    var key = srsKey(s.id);
    var prev = S().srs[key];
    var next = APP.srs.review(prev || APP.srs.newCard(), q);
    next.added = prev ? prev.added : U.dayStr();
    S().srs[key] = next;
    return APP.progress.record(ID, s.topic, s.id, q >= 3, opts);
  }

  function intervalLabel(days) {
    if (days <= 1) return '1 T.';
    if (days < 30) return days + ' T.';
    if (days < 365) return Math.round(days / 30) + ' Mon.';
    return (days / 365).toFixed(1).replace('.', ',') + ' J.';
  }

  /* ---------- Antwortvergleich (Produktion) ---------- */

  function termVariants(term) {
    var t = String(term || '');
    var out = [t];
    var stripped = t.replace(/,\s*etwas zu tun$/i, '');
    var re = /^(etwas|jemandem|jemanden|jemandes|jmdm\.?|jmdn\.?|sich|der|die|das)\s+/i;
    var prev;
    do { prev = stripped; stripped = stripped.replace(re, ''); } while (stripped !== prev);
    out.push(stripped);
    out.push(t.replace(/^(der|die|das)\s+/i, ''));
    return out;
  }

  /* ---------- Karte darstellen ---------- */

  var activeKeyHandler = null;
  function setKeyHandler(fn) {
    if (activeKeyHandler) document.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = fn;
    if (fn) document.addEventListener('keydown', fn);
  }

  /**
   * Zeigt eine Lernkarte. onGrade(q) nach Bewertung.
   * opts.again: Wiederholung innerhalb derselben Runde (Hinweis anzeigen)
   */
  function renderCard(el, s, onGrade, opts) {
    opts = opts || {};
    U.clear(el);
    var card = s.card;
    var root = h('article', { class: 'card exercise flashcard' });
    el.appendChild(root);

    var verifyBtn = null;
    if (isUnverified(card)) {
      verifyBtn = h('button', {
        class: 'chip chip-warn', type: 'button', title: 'Inhalt geprüft? Dann als geprüft markieren.',
        onclick: function () {
          S().verified[ID + ':' + card.id] = true;
          APP.store.save();
          verifyBtn.remove();
          U.toast('Als geprüft markiert.');
        }
      }, 'ungeprüft');
    }
    root.appendChild(h('div', { class: 'ex-head' },
      h('span', { class: 'chip' }, KIND_LABEL[s.kind]),
      h('span', { class: 'muted small' }, deckById(card.deck).title),
      card.register && card.register !== 'neutral' ? h('span', { class: 'chip chip-reg' }, card.register) : null,
      opts.again ? h('span', { class: 'chip chip-work' }, 'noch einmal') : null,
      verifyBtn));

    var front = h('div', { class: 'fc-front' });
    var back = h('div', { class: 'fc-back', hidden: true });
    var actions = h('div', { class: 'actions' });
    root.appendChild(front);
    root.appendChild(actions);
    root.appendChild(back);

    var input = null, expected = null, variants = null;
    if (s.kind === 'rec') {
      front.appendChild(h('p', { class: 'fc-term' }, card.term));
    } else if (s.kind === 'prod') {
      front.appendChild(h('p', { class: 'instruction' }, 'Wie lautet der deutsche Ausdruck?'));
      front.appendChild(h('p', { class: 'fc-meaning' }, card.meaning));
      input = h('input', { type: 'text', class: 'answer-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Ausdruck eingeben (optional) …', 'aria-label': 'Ihre Antwort' });
      front.appendChild(input);
      variants = termVariants(card.term);
    } else {
      var cz = parseCloze(card);
      expected = cz.answer;
      input = h('input', { type: 'text', class: 'gap-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Lücke' });
      input.style.width = Math.min(18, Math.max(6, cz.answer.length * 0.62)) + 'em';
      front.appendChild(h('p', { class: 'ex-text' }, cz.before, input, cz.after));
      front.appendChild(h('p', { class: 'muted small' }, 'Bedeutung: ' + card.meaning));
      variants = [cz.answer];
    }

    var revealBtn = h('button', { type: 'button', class: 'btn primary', onclick: reveal }, input ? 'Prüfen' : 'Aufdecken');
    actions.appendChild(revealBtn);
    actions.appendChild(h('span', { class: 'muted small key-hint' }, 'Leertaste / Enter'));
    if (input) setTimeout(function () { input.focus(); }, 30);

    var revealed = false, suggested = null;

    function reveal() {
      if (revealed) return;
      revealed = true;
      U.clear(actions);
      if (input) input.disabled = true;

      if (input && input.value.trim()) {
        var m = U.matchAnswer(input.value, variants);
        var ok = m === 'exact';
        suggested = ok ? 4 : 1;
        back.appendChild(h('p', { class: 'fc-compare ' + (ok ? 'is-ok' : 'is-bad') },
          ok ? '✓ Stimmt überein.' : m === 'case' ? '≈ Nur Groß-/Kleinschreibung weicht ab.' : '✗ Ihre Antwort: „' + input.value.trim() + '“'));
      }

      if (s.kind !== 'rec') back.appendChild(h('p', { class: 'fc-term' }, card.term));
      back.appendChild(h('p', { class: 'fc-meaning' }, card.meaning));
      if (card.meaningEn) back.appendChild(h('p', { class: 'muted small' }, 'EN: ' + card.meaningEn));
      if (card.example) back.appendChild(h('p', { class: 'fc-example' }, exampleNode(card)));
      if (card.collocations && card.collocations.length) {
        back.appendChild(h('div', { class: 'fc-colloc' },
          h('div', { class: 'label' }, 'Kollokationen'),
          h('ul', null, card.collocations.map(function (c) { return h('li', null, c); }))));
      }
      if (card.tags && card.tags.length) {
        back.appendChild(h('p', { class: 'fc-tags' }, card.tags.map(function (t) { return h('span', { class: 'chip' }, t); })));
      }

      var cur = srsOf(s.id);
      var row = h('div', { class: 'grades' });
      GRADES.forEach(function (g, i) {
        var b = h('button', {
          type: 'button', class: 'btn grade ' + g.cls + (suggested === g.q ? ' is-suggested' : ''),
          onclick: function () { finish(g.q); }
        },
          h('span', null, g.label),
          h('span', { class: 'grade-sub' }, (i + 1) + ' · ' + intervalLabel(APP.srs.previewInterval(cur, g.q))));
        row.appendChild(b);
      });
      back.appendChild(row);
      back.hidden = false;
      var focusBtn = row.querySelector('.is-suggested') || row.children[2];
      setTimeout(function () { focusBtn.focus(); }, 30);
    }

    function finish(q) {
      setKeyHandler(null);
      onGrade(q);
    }

    setKeyHandler(function (e) {
      if (!root.isConnected) { setKeyHandler(null); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT');
      if (!revealed) {
        if (e.key === 'Enter' || (e.key === ' ' && !inField)) { e.preventDefault(); reveal(); }
        return;
      }
      if (inField) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) { e.preventDefault(); finish(GRADES[n - 1].q); }
    });
  }

  /* ---------- Ansichten ---------- */

  function renderOverview(el) {
    var newLeft = newLeftToday();
    var open = openDecks();
    var dueOpen = dueIn(open).length;
    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Wortschatz'),
      h('p', { class: 'muted' }, 'Karteikarten mit Spaced Repetition. Ein Deck gilt als beherrscht bei ≥ 90 % „gewusst“ in den letzten 30 Karten an mindestens 3 Tagen – danach laufen seine Wiederholungen im täglichen Wartungsblock.')));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);

    el.appendChild(h('div', { class: 'card' },
      h('p', null, dueOpen + ' Karten fällig · noch ' + newLeft + ' neue Karten heute (Limit ' + S().settings.vocabNewPerDay + ')'),
      h('div', { class: 'actions' },
        h('a', { class: 'btn primary', href: '#/wortschatz/ueben/_all' }, 'Alle offenen Decks lernen'),
        h('a', { class: 'btn ghost', href: '#/wortschatz/neu' }, '+ Neue Karte'))));

    var list = h('section', { class: 'card topic-list' });
    decks().forEach(function (d) {
      var c = deckCounts(d.id);
      list.appendChild(APP.ui.masteryRow(ID, d, {
        href: '#/wortschatz/ueben/' + encodeURIComponent(d.id),
        actions: h('div', null,
          h('div', { class: 'topic-meta' }, c.cards + ' Karten · ' + c.total + ' Lernkarten · ' + c.due + ' fällig · ' + c.unseen + ' noch nicht gelernt'),
          h('div', { class: 'topic-actions' },
            h('a', { class: 'btn small primary', href: '#/wortschatz/ueben/' + encodeURIComponent(d.id) }, 'Lernen'),
            h('a', { class: 'btn small ghost', href: '#/wortschatz/deck/' + encodeURIComponent(d.id) }, 'Karten ansehen')))
      }));
    });
    el.appendChild(list);
  }

  function renderSession(el, deckParam) {
    var deckIds = deckParam === '_all' ? openDecks() : [deckParam];
    var title = deckParam === '_all' ? 'Alle offenen Decks' : deckById(deckParam).title;
    var due = dueIn(deckIds).slice(0, SESSION_DUE_MAX);
    var fresh = newCandidates(deckIds, Math.min(newLeftToday(), SESSION_NEW_MAX));
    var queue = due.map(function (s) { return { s: s }; }).concat(fresh.map(function (s) { return { s: s, isNew: true } }));

    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/wortschatz', class: 'back' }, '← Wortschatz'),
      h('h1', null, title)));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);
    var counter = h('div', { class: 'counter muted small' });
    var stage = h('div');
    el.appendChild(counter);
    el.appendChild(stage);

    if (!queue.length) {
      stage.appendChild(h('section', { class: 'card' },
        h('p', null, newLeftToday() ? 'Hier ist gerade nichts fällig und es gibt keine neuen Karten.' : 'Nichts fällig, und das Tageslimit für neue Karten ist erreicht.'),
        h('p', { class: 'muted small' }, 'Neue Richtungen (Produzieren, Lückensatz) einer Karte werden frühestens am Tag nach dem Erkennen freigeschaltet.'),
        h('div', { class: 'actions' }, h('a', { class: 'btn ghost', href: '#/wortschatz' }, 'Zurück'))));
      return;
    }

    var firstTotal = queue.length, shown = 0, known = 0, newlyMastered = [];
    function next() {
      if (!queue.length) return summary();
      var entry = queue.shift();
      if (!entry.again) shown++;
      counter.textContent = (entry.again ? 'Wiederholung' : 'Karte ' + shown + ' von ' + firstTotal) + (entry.isNew ? ' · neu' : '');
      renderCard(stage, entry.s, function (q) {
        if (!entry.again) {
          var res = grade(entry.s, q);
          if (q >= 3) known++;
          if (res.mastered) {
            newlyMastered.push(entry.s.topic);
            U.toast('Deck „' + deckById(entry.s.topic).title + '“ beherrscht!');
          }
          if (q < 3) queue.push({ s: entry.s, again: true });
        } else if (q < 3) {
          queue.push({ s: entry.s, again: true });
        }
        next();
      }, { again: entry.again });
    }

    function summary() {
      setKeyHandler(null);
      counter.textContent = '';
      U.clear(stage);
      var ids = {};
      due.concat(fresh).forEach(function (s) { ids[s.topic] = 1; });
      var c = h('section', { class: 'card' },
        h('h2', null, 'Runde beendet'),
        h('p', { class: 'big-number' }, known + ' / ' + firstTotal, h('span', { class: 'muted small' }, ' gewusst')),
        h('p', { class: 'muted small' }, fresh.length + ' neue Karten gelernt · noch ' + newLeftToday() + ' neue heute möglich'));
      newlyMastered.forEach(function (t) {
        c.appendChild(h('div', { class: 'notice ok' }, 'Deck „' + deckById(t).title + '“ ist beherrscht – fällige Karten laufen ab jetzt im täglichen Wartungsblock.'));
      });
      Object.keys(ids).forEach(function (t) { c.appendChild(APP.ui.masteryRow(ID, deckById(t))); });
      c.appendChild(h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn primary', onclick: function () { APP.navigate(location.hash); } }, 'Weiterlernen'),
        h('a', { class: 'btn ghost', href: '#/wortschatz' }, 'Übersicht'),
        h('a', { class: 'btn ghost', href: '#/' }, 'Start')));
      stage.appendChild(c);
    }

    next();
  }

  function renderDeck(el, deckId) {
    var d = deckById(deckId);
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/wortschatz', class: 'back' }, '← Wortschatz'),
      h('h1', null, d.title),
      d.description ? h('p', { class: 'muted' }, d.description) : null));
    el.appendChild(APP.ui.masteryRow(ID, d));
    el.appendChild(h('div', { class: 'actions' },
      h('a', { class: 'btn primary', href: '#/wortschatz/ueben/' + encodeURIComponent(deckId) }, 'Deck lernen'),
      h('button', { type: 'button', class: 'btn ghost', onclick: function () { openEditor({ deck: deckId }); } }, '+ Karte in diesem Deck')));

    var list = h('section', { class: 'item-list' });
    var cs = deckCards(deckId);
    if (!cs.length) list.appendChild(h('p', { class: 'muted' }, 'Noch keine Karten.'));
    cs.forEach(function (card) {
      var key = ID + ':' + card.id;
      var progress = kindsOf(card).map(function (k) {
        var c = srsOf(card.id + '#' + k);
        return h('span', { class: 'chip' }, KIND_LABEL[k] + ': ' + (c ? 'fällig ' + U.fmtDate(U.parseDay(c.due)).slice(0, 6) : 'neu'));
      });
      var toggle = card.status === 'ungeprüft' ? h('label', { class: 'check small' },
        h('input', {
          type: 'checkbox', checked: !isUnverified(card) || null,
          onchange: function (e) {
            if (e.target.checked) S().verified[key] = true; else delete S().verified[key];
            APP.store.save();
          }
        }), ' geprüft') : null;
      list.appendChild(h('details', { class: 'card item' },
        h('summary', null,
          h('span', { class: 'item-text' }, card.term), ' ',
          card.register && card.register !== 'neutral' ? h('span', { class: 'chip chip-reg' }, card.register) : null,
          card.source === 'seed' ? null : h('span', { class: 'chip' }, 'eigene')),
        h('p', { class: 'fc-meaning' }, card.meaning),
        card.meaningEn ? h('p', { class: 'muted small' }, 'EN: ' + card.meaningEn) : null,
        card.example ? h('p', { class: 'fc-example' }, exampleNode(card)) : null,
        card.collocations && card.collocations.length ? h('p', { class: 'small' }, h('strong', null, 'Kollokationen: '), card.collocations.join(' · ')) : null,
        card.tags && card.tags.length ? h('p', { class: 'fc-tags' }, card.tags.map(function (t) { return h('span', { class: 'chip' }, t); })) : null,
        h('p', { class: 'fc-tags' }, progress),
        h('div', { class: 'item-foot' },
          h('code', { class: 'muted small' }, card.id),
          h('span', { class: 'row-gap' },
            toggle,
            h('a', { class: 'btn small ghost', href: '#/wortschatz/karte/' + encodeURIComponent(card.id) }, 'Bearbeiten')))));
    });
    el.appendChild(list);
  }

  /* ---------- Editor ---------- */

  var pendingPrefill = null;

  /** Öffnet den Karteneditor mit Vorbelegung (auch aus anderen Modulen nutzbar). */
  function openEditor(prefill) {
    pendingPrefill = prefill || {};
    APP.navigate('#/wortschatz/neu');
  }

  function slug(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck';
  }

  function renderEditor(el, cardId) {
    var existing = cardId ? cardById(cardId) : null;
    if (cardId && !existing) {
      el.appendChild(h('section', { class: 'card' }, h('p', null, 'Karte nicht gefunden.'), h('a', { href: '#/wortschatz' }, 'Zurück')));
      return;
    }
    var pre = existing || pendingPrefill || {};
    var returnTo = (pendingPrefill && pendingPrefill.returnTo) || null;
    pendingPrefill = null;
    var isSeed = existing && existing.source === 'seed';

    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: existing ? '#/wortschatz/deck/' + encodeURIComponent(existing.deck) : '#/wortschatz', class: 'back' }, '← Zurück'),
      h('h1', null, existing ? 'Karte bearbeiten' : 'Neue Karte'),
      isSeed ? h('p', { class: 'muted small' }, 'Mitgelieferte Karte – Ihre Änderungen werden als Korrektur gespeichert (und sind im Export enthalten).') : null));

    function field(label, control, hint) {
      return h('label', { class: 'form-field' }, h('span', { class: 'form-label' }, label), control, hint ? h('span', { class: 'muted small' }, hint) : null);
    }
    var fTerm = h('input', { type: 'text', value: pre.term || '', required: true });
    var fMeaning = h('textarea', { rows: 2 }); fMeaning.value = pre.meaning || '';
    var fEn = h('input', { type: 'text', value: pre.meaningEn || '' });
    var fExample = h('textarea', { rows: 2 }); fExample.value = pre.example || '';
    var fRegister = h('select', null, REGISTERS.map(function (r) { return h('option', { value: r, selected: (pre.register || 'neutral') === r || null }, r); }));
    var fColloc = h('textarea', { rows: 3 }); fColloc.value = (pre.collocations || []).join('\n');
    var fTags = h('input', { type: 'text', value: (pre.tags || []).join(', ') });
    var deckOpts = decks().map(function (d) { return h('option', { value: d.id, selected: (pre.deck || 'eigene') === d.id || null }, d.title); });
    var fDeck = h('select', null, deckOpts, h('option', { value: '__new' }, '+ Neues Deck …'));
    if (!decks().some(function (d) { return d.id === (pre.deck || 'eigene'); })) {
      fDeck.insertBefore(h('option', { value: 'eigene', selected: true }, 'Eigene Karten'), fDeck.firstChild);
    }
    var fNewDeck = h('input', { type: 'text', placeholder: 'Name des neuen Decks', hidden: true });
    fDeck.addEventListener('change', function () { fNewDeck.hidden = fDeck.value !== '__new'; if (!fNewDeck.hidden) fNewDeck.focus(); });

    var clozeHint = h('span', { class: 'muted small' });
    function updateClozeHint() {
      var cz = parseCloze({ term: fTerm.value, example: fExample.value });
      clozeHint.textContent = !fExample.value.trim() ? 'Ohne Beispielsatz gibt es keinen Lückensatz.'
        : cz ? 'Lücke: „' + cz.answer + '“' : 'Keine Lücke erkannt – markieren Sie sie mit [[…]], z. B. „hat den [[Nagel auf den Kopf getroffen]]“.';
    }
    fExample.addEventListener('input', updateClozeHint);
    fTerm.addEventListener('input', updateClozeHint);
    updateClozeHint();

    var errorsBox = h('div', { 'aria-live': 'polite' });

    function save() {
      var deckId = fDeck.value;
      var newDeck = null;
      if (deckId === '__new') {
        var name = fNewDeck.value.trim();
        if (!name) { U.clear(errorsBox).appendChild(h('div', { class: 'notice bad' }, 'Bitte einen Namen für das neue Deck angeben.')); return; }
        deckId = slug(name);
        if (!decks().some(function (d) { return d.id === deckId; })) newDeck = { id: deckId, title: name };
      }
      var data = {
        deck: deckId,
        term: fTerm.value.trim(),
        meaning: fMeaning.value.trim(),
        meaningEn: fEn.value.trim() || undefined,
        example: fExample.value.trim() || undefined,
        register: fRegister.value,
        collocations: fColloc.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
        tags: fTags.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
      };
      var errors = validateCard(data);
      if (errors.length) {
        U.clear(errorsBox).appendChild(h('div', { class: 'notice bad' }, h('ul', null, errors.map(function (e) { return h('li', null, e); }))));
        return;
      }
      var o = own();
      if (newDeck) o.decks.push(newDeck);
      if (deckId === 'eigene' && !decks().some(function (d) { return d.id === 'eigene'; })) o.decks.push({ id: 'eigene', title: 'Eigene Karten' });
      if (isSeed) {
        o.overrides[existing.id] = data;
      } else if (existing) {
        var idx = o.cards.findIndex(function (c) { return c.id === existing.id; });
        o.cards[idx] = Object.assign({}, existing, data);
      } else {
        o.cards.push(Object.assign({ id: 'w-u-' + Date.now().toString(36), source: 'user', createdAt: Date.now() }, data,
          pre.origin ? { origin: pre.origin } : {}));
      }
      APP.store.save();
      U.toast(existing ? 'Karte gespeichert.' : 'Karte angelegt.');
      APP.navigate(returnTo || '#/wortschatz/deck/' + encodeURIComponent(deckId));
    }

    var form = h('form', { class: 'card form', onsubmit: function (e) { e.preventDefault(); save(); } },
      field('Deutscher Begriff / Ausdruck *', fTerm),
      field('Bedeutung (deutsche Definition) *', fMeaning),
      field('Englisch (optional)', fEn),
      field('Beispielsatz', fExample, null),
      clozeHint,
      h('div', { class: 'form-row' }, field('Register', fRegister), field('Deck', h('span', { class: 'stack' }, fDeck, fNewDeck))),
      field('Kollokationen (eine pro Zeile)', fColloc),
      field('Tags (durch Komma getrennt)', fTags),
      errorsBox,
      h('div', { class: 'actions' },
        h('button', { type: 'submit', class: 'btn primary' }, 'Speichern'),
        isSeed && own().overrides[existing.id] ? h('button', {
          type: 'button', class: 'btn ghost', onclick: function () {
            delete own().overrides[existing.id];
            APP.store.save();
            U.toast('Korrektur verworfen.');
            APP.navigate('#/wortschatz/deck/' + encodeURIComponent(existing.deck));
          }
        }, 'Original wiederherstellen') : null,
        existing && !isSeed ? h('button', {
          type: 'button', class: 'btn bad', onclick: function () {
            if (!window.confirm('Karte „' + existing.term + '“ löschen?')) return;
            var o = own();
            o.cards = o.cards.filter(function (c) { return c.id !== existing.id; });
            KINDS.forEach(function (k) { delete S().srs[srsKey(existing.id + '#' + k)]; });
            APP.store.save();
            U.toast('Karte gelöscht.');
            APP.navigate('#/wortschatz/deck/' + encodeURIComponent(existing.deck));
          }
        }, 'Löschen') : null));
    el.appendChild(form);
    setTimeout(function () { (pre.term ? fMeaning : fTerm).focus(); }, 30);
  }

  function render(el, params) {
    setKeyHandler(null);
    if (params[0] === 'ueben' && params[1]) return renderSession(el, params[1]);
    if (params[0] === 'deck' && params[1]) return renderDeck(el, params[1]);
    if (params[0] === 'neu') return renderEditor(el, null);
    if (params[0] === 'karte' && params[1]) return renderEditor(el, params[1]);
    return renderOverview(el);
  }

  window.addEventListener('hashchange', function () { setKeyHandler(null); });

  APP.registerModule({
    id: ID,
    title: 'Wortschatz',
    enqueueOnMastery: false,
    topics: decks,
    items: items,
    getItem: getItem,
    topicOf: function (subId) { var s = getItem(subId); return s ? s.topic : null; },
    focusInfo: function () {
      return dueIn(openDecks()).length + ' Karten fällig · ' + newLeftToday() + ' neue heute möglich';
    },
    render: render,
    // Schnittstelle für andere Module (Schreiben, Lesen)
    openEditor: openEditor,
    validateCard: validateCard,
    review: {
      estimateSec: 15,
      render: function (el, subId, done) {
        var s = getItem(subId);
        renderCard(el, s, function (q) {
          APP.progress.record(ID, s.topic, s.id, q >= 3, { review: true });
          done(q >= 3, q);
        });
      }
    }
  });
})(window.APP);
