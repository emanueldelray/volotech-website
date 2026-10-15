/* Modul 4: Lesen – Artikel einfügen, Wörter antippen → Karte, Verständnisfragen über Claude */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;
  var ID = 'lesen';

  var TOPICS = [
    { id: 'mc', title: 'Detailverständnis (Multiple Choice)', description: 'Details, Implikationen, Haltung des Autors.' },
    { id: 'rf', title: 'Richtig / Falsch / Nicht im Text', description: 'Aussagen genau gegen den Text prüfen.' },
    { id: 'offen', title: 'Globalverständnis (offene Fragen)', description: 'Argumentation, Absicht, Wirkung – selbst bewertet.' }
  ];
  var TOPIC_OF_TYPE = { mc: 'mc', richtigfalsch: 'rf', offen: 'offen' };
  var DECK = { id: 'aus-artikeln', title: 'Aus Artikeln' };

  function S() { return APP.store.state; }
  function R() {
    var r = S().reading || (S().reading = {});
    r.articles = r.articles || [];
    return r;
  }
  function articleById(id) { return R().articles.filter(function (a) { return a.id === id; })[0] || null; }

  /* ---------- Text antippbar machen ---------- */

  var LEAD = /^[„"“‚'«»(\[–—-]+/;
  var TRAIL = /[.,;:!?…"“”'‘’»«)\]–—-]+$/;

  function norm(w) { return w.toLowerCase().replace(/^[^0-9a-zäöüßà-ÿ]+|[^0-9a-zäöüßà-ÿ]+$/g, ''); }

  /** Gespeicherte Wörter/Wendungen markieren (Wortfolgen innerhalb eines Satzes). */
  function markSaved(root, saved) {
    var phrases = (saved || []).map(function (t) { return t.split(/\s+/).map(norm).filter(Boolean); }).filter(function (p) { return p.length; });
    if (!phrases.length) return;
    Array.prototype.forEach.call(root.querySelectorAll('.sentence'), function (s) {
      var ws = Array.prototype.slice.call(s.querySelectorAll('.w'));
      var keys = ws.map(function (w) { return norm(w.textContent); });
      phrases.forEach(function (p) {
        for (var i = 0; i + p.length <= keys.length; i++) {
          var hit = true;
          for (var k = 0; k < p.length; k++) if (keys[i + k] !== p[k]) { hit = false; break; }
          if (hit) for (var j = 0; j < p.length; j++) ws[i + j].classList.add('is-saved');
        }
      });
    });
  }

  /** Rendert Absätze → Sätze → Wörter (span.w), Satzzeichen bleiben Text. */
  function renderTappable(text, saved) {
    var root = h('div', { class: 'reader-text' });
    text.split(/\n\s*\n|\r?\n/).forEach(function (para) {
      if (!para.trim()) return;
      var p = h('p');
      U.sentences(para).forEach(function (s, si) {
        var span = h('span', { class: 'sentence' });
        s.text.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { span.appendChild(document.createTextNode(' ')); return; }
          var lead = (tok.match(LEAD) || [''])[0];
          var rest = tok.slice(lead.length);
          var trail = (rest.match(TRAIL) || [''])[0];
          var core = rest.slice(0, rest.length - trail.length);
          if (lead) span.appendChild(document.createTextNode(lead));
          if (core) span.appendChild(h('span', { class: 'w' }, core));
          if (trail) span.appendChild(document.createTextNode(trail));
        });
        if (si) p.appendChild(document.createTextNode(' '));
        p.appendChild(span);
      });
      root.appendChild(p);
    });
    markSaved(root, saved);
    return root;
  }

  /**
   * Auswahl-Logik: Wort antippen = auswählen, zweites Wort im selben Satz =
   * Auswahl bis dorthin erweitern, gleiches Wort erneut = abwählen.
   * Native Textauswahl (Maus/Long-Press) funktioniert ebenfalls.
   * onChange({ text, sentence } | null)
   */
  function attachSelection(root, onChange) {
    var anchor = null, focus = null;

    function wordsBetween(a, b) {
      var all = Array.prototype.slice.call(a.parentNode.querySelectorAll('.w'));
      var i = all.indexOf(a), j = all.indexOf(b);
      if (i > j) { var t = i; i = j; j = t; }
      return all.slice(i, j + 1);
    }
    function clearMarks() {
      Array.prototype.forEach.call(root.querySelectorAll('.w.sel'), function (w) { w.classList.remove('sel'); });
    }
    function emitFromWords() {
      clearMarks();
      if (!anchor) { onChange(null); return; }
      var ws = wordsBetween(anchor, focus || anchor);
      ws.forEach(function (w) { w.classList.add('sel'); });
      var range = document.createRange();
      range.setStartBefore(ws[0]);
      range.setEndAfter(ws[ws.length - 1]);
      onChange({ text: range.toString().replace(/\s+/g, ' ').trim(), sentence: anchor.parentNode.textContent.replace(/\s+/g, ' ').trim() });
    }

    root.addEventListener('click', function (e) {
      var sel = window.getSelection();
      if (sel && !sel.isCollapsed && root.contains(sel.anchorNode)) return; // native Auswahl hat Vorrang
      var w = e.target.closest && e.target.closest('.w');
      if (!w) return;
      if (anchor && (w === anchor || w === focus) && (!focus || focus === anchor)) { anchor = focus = null; }
      else if (anchor && w.parentNode === anchor.parentNode && (!focus || focus === anchor)) { focus = w; }
      else { anchor = w; focus = null; }
      emitFromWords();
    });

    function onSelectionChange() {
      if (!root.isConnected) { document.removeEventListener('selectionchange', onSelectionChange); return; }
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var r = sel.getRangeAt(0);
      if (!root.contains(r.commonAncestorContainer)) return;
      var text = sel.toString().replace(/\s+/g, ' ').trim();
      if (!text) return;
      anchor = focus = null;
      clearMarks();
      var startEl = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
      var endEl = r.endContainer.nodeType === 1 ? r.endContainer : r.endContainer.parentNode;
      var s1 = startEl.closest('.sentence'), s2 = endEl.closest('.sentence');
      var sentence = s1 ? s1.textContent : text;
      if (s1 && s2 && s1 !== s2) {
        var rr = document.createRange();
        rr.setStartBefore(s1); rr.setEndAfter(s2);
        sentence = rr.toString();
      }
      onChange({ text: text.replace(/^[„"“‚(]+|[.,;:!?"“”)]+$/g, ''), sentence: sentence.replace(/\s+/g, ' ').trim() });
    }
    document.addEventListener('selectionchange', onSelectionChange);

    return { reset: function () { anchor = focus = null; clearMarks(); } };
  }

  /** Beispielsatz mit [[Lücke]] für die Wortschatzkarte */
  function clozeSentence(sentence, phrase) {
    var i = sentence.indexOf(phrase);
    if (i < 0) i = sentence.toLowerCase().indexOf(phrase.toLowerCase());
    if (i < 0) return sentence;
    return sentence.slice(0, i) + '[[' + sentence.substr(i, phrase.length) + ']]' + sentence.slice(i + phrase.length);
  }

  /* ---------- Ansichten ---------- */

  function renderOverview(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Lesen'),
      h('p', { class: 'muted' }, 'Artikel einfügen, beim Lesen Wörter und Wendungen antippen und als Karten speichern, dann Verständnisfragen von Claude beantworten.')));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);

    var topics = h('section', { class: 'card topic-list' });
    TOPICS.forEach(function (t) { topics.appendChild(APP.ui.masteryRow(ID, t)); });
    el.appendChild(topics);

    el.appendChild(h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/lesen/neu' }, '+ Artikel einfügen')));

    var list = h('section', { class: 'card text-list' });
    var arts = R().articles.slice().reverse();
    if (!arts.length) list.appendChild(h('p', { class: 'muted' }, 'Noch keine Artikel. Kopieren Sie einen Text (z. B. aus der Zeit, FAZ oder SZ) und fügen Sie ihn ein.'));
    arts.forEach(function (a) {
      var last = (a.runs || [])[a.runs ? a.runs.length - 1 : 0];
      list.appendChild(h('a', { class: 'text-row', href: '#/lesen/artikel/' + encodeURIComponent(a.id) },
        h('div', null,
          h('div', { class: 'topic-title' }, a.title),
          h('div', { class: 'muted small' }, (a.source ? a.source + ' · ' : '') + U.fmtDate(a.createdAt) + ' · ' + U.wordCount(a.text) + ' Wörter' +
            ((a.saved || []).length ? ' · ' + a.saved.length + ' Karten' : ''))),
        a.questions
          ? h('div', { class: 'text-score' }, last ? h('strong', null, Math.round(last.score / last.total * 100) + ' %') : h('span', { class: 'chip chip-work' }, a.questions.length + ' Fragen'),
            last ? h('span', { class: 'muted small' }, a.questions.length + ' Fragen') : null)
          : h('span', { class: 'chip' }, 'ohne Fragen')));
    });
    el.appendChild(list);
  }

  function renderNew(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/lesen', class: 'back' }, '← Lesen'),
      h('h1', null, 'Artikel einfügen')));
    function field(label, control) { return h('label', { class: 'form-field' }, h('span', { class: 'form-label' }, label), control); }
    var fTitle = h('input', { type: 'text' });
    var fSource = h('input', { type: 'text', placeholder: 'z. B. Die Zeit, 12.10.2026' });
    var fUrl = h('input', { type: 'url', placeholder: 'https://…' });
    var fText = h('textarea', { rows: 14, placeholder: 'Artikeltext hier einfügen …' });
    var msg = h('div', { 'aria-live': 'polite' });
    el.appendChild(h('form', {
      class: 'card form', onsubmit: function (e) {
        e.preventDefault();
        var errs = [];
        if (!fTitle.value.trim()) errs.push('Titel fehlt.');
        if (U.wordCount(fText.value) < 30) errs.push('Bitte einen Text mit mindestens 30 Wörtern einfügen.');
        if (errs.length) { U.clear(msg).appendChild(h('div', { class: 'notice bad' }, errs.join(' '))); return; }
        var a = {
          id: 'a-' + Date.now().toString(36), title: fTitle.value.trim(), source: fSource.value.trim(),
          url: fUrl.value.trim(), text: fText.value.trim(), createdAt: Date.now(), questions: null, runs: [], saved: []
        };
        R().articles.push(a);
        APP.store.save();
        APP.navigate('#/lesen/artikel/' + encodeURIComponent(a.id));
      }
    },
      field('Titel *', fTitle),
      h('div', { class: 'form-row' }, field('Quelle', fSource), field('Link (optional)', fUrl)),
      field('Text *', fText),
      msg,
      h('div', { class: 'actions' }, h('button', { type: 'submit', class: 'btn primary' }, 'Speichern und lesen'))));
    setTimeout(function () { fTitle.focus(); }, 30);
  }

  function renderArticle(el, id) {
    var a = articleById(id);
    if (!a) { el.appendChild(h('section', { class: 'card' }, h('p', null, 'Artikel nicht gefunden.'), h('a', { href: '#/lesen' }, 'Zurück'))); return; }
    a.saved = a.saved || [];

    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/lesen', class: 'back' }, '← Lesen'),
      h('h1', null, a.title),
      h('p', { class: 'muted small' },
        a.source || '', a.source && a.url ? ' · ' : '',
        a.url ? h('a', { href: a.url, target: '_blank', rel: 'noopener' }, 'Original') : null,
        ' · ' + U.wordCount(a.text) + ' Wörter')));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);

    // Fragen
    var qCard = h('section', { class: 'card' });
    if (a.questions) {
      var last = a.runs && a.runs[a.runs.length - 1];
      qCard.appendChild(h('div', { class: 'actions' },
        h('a', { class: 'btn primary', href: '#/lesen/artikel/' + encodeURIComponent(a.id) + '/fragen' }, 'Fragen beantworten (' + a.questions.length + ')'),
        last ? h('span', { class: 'muted small key-hint' }, 'Zuletzt: ' + Math.round(last.score / last.total * 100) + ' %') : null));
    }
    qCard.appendChild(h('details', { class: 'bridge-details', open: !a.questions || null },
      h('summary', null, a.questions ? 'Neue Fragen anfordern' : 'Verständnisfragen'),
      APP.fragen.bridge({
        promptOpts: { kind: 'lesen', title: a.title, source: a.source, text: a.text },
        hasQuestions: !!a.questions,
        onSaved: function (qs) {
          a.questions = qs;
          APP.store.save();
          U.toast(qs.length + ' Fragen gespeichert.');
          APP.navigate('#/lesen/artikel/' + encodeURIComponent(a.id));
        }
      })));
    el.appendChild(qCard);

    el.appendChild(h('p', { class: 'muted small reader-hint' }, 'Tipp: Wort antippen, um es auszuwählen; ein zweites Wort im selben Satz erweitert die Auswahl zur Wendung. Mit der Maus können Sie auch frei markieren.'));

    var textEl = renderTappable(a.text, a.saved);
    el.appendChild(h('article', { class: 'card reader' }, textEl));

    // Auswahlleiste
    var current = null;
    var label = h('span', { class: 'selbar-text' });
    var bar = h('div', { class: 'selbar', hidden: true, role: 'region', 'aria-label': 'Auswahl' },
      label,
      h('button', {
        type: 'button', class: 'btn primary small', onclick: function () {
          if (!current) return;
          var sel = current;
          APP.modules.wortschatz.openEditor({
            term: sel.text,
            example: clozeSentence(sel.sentence, sel.text),
            deck: DECK.id, deckTitle: DECK.title,
            tags: ['Lesen'].concat(a.source ? [a.source] : []),
            origin: { article: a.id },
            returnTo: '#/lesen/artikel/' + encodeURIComponent(a.id),
            onSaved: function (card) {
              var art = articleById(a.id);
              if (art) { art.saved = art.saved || []; art.saved.push(card.term); }
            }
          });
        }
      }, 'Als Karte speichern'),
      h('button', { type: 'button', class: 'btn ghost small', 'aria-label': 'Auswahl aufheben', onclick: function () { selection.reset(); window.getSelection().removeAllRanges(); show(null); } }, '✕'));
    el.appendChild(bar);
    function show(sel) {
      current = sel;
      bar.hidden = !sel;
      label.textContent = sel ? '„' + sel.text + '“' : '';
    }
    var selection = attachSelection(textEl, show);

    el.appendChild(h('div', { class: 'actions' },
      h('button', {
        type: 'button', class: 'btn bad', onclick: function () {
          if (!window.confirm('Artikel „' + a.title + '“ löschen? Gespeicherte Karten bleiben erhalten.')) return;
          R().articles = R().articles.filter(function (x) { return x.id !== a.id; });
          APP.store.save();
          APP.navigate('#/lesen');
        }
      }, 'Artikel löschen')));
  }

  function renderQuestions(el, id) {
    var a = articleById(id);
    if (!a || !a.questions) { APP.navigate('#/lesen/artikel/' + encodeURIComponent(id)); return; }
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/lesen/artikel/' + encodeURIComponent(a.id), class: 'back' }, '← ' + a.title),
      h('h1', null, 'Verständnisfragen')));
    var textToggle = h('details', { class: 'card' }, h('summary', null, 'Text anzeigen'), h('div', { class: 'reader-text small-text' }, a.text));
    el.appendChild(textToggle);
    var stage = h('div');
    el.appendChild(stage);
    APP.fragen.run(stage, a.questions, {
      onAnswer: function (q, score) {
        APP.progress.record(ID, TOPIC_OF_TYPE[q.typ], a.id + '#' + a.questions.indexOf(q), score);
      },
      onDone: function (res) {
        a.runs = a.runs || [];
        a.runs.push({ at: Date.now(), score: res.score, total: res.total });
        APP.store.save();
      },
      actions: h('div', { class: 'actions' },
        h('a', { class: 'btn primary', href: '#/lesen/artikel/' + encodeURIComponent(a.id) }, 'Zurück zum Artikel'),
        h('a', { class: 'btn ghost', href: '#/lesen' }, 'Alle Artikel'))
    });
  }

  /** Dashboard „Weiter“: Artikel mit Fragen, am längsten nicht bearbeitet */
  function practiceRoute() {
    var withQ = R().articles.filter(function (a) { return a.questions; });
    if (!withQ.length) return '#/lesen';
    withQ.sort(function (x, y) {
      var lx = x.runs && x.runs.length ? x.runs[x.runs.length - 1].at : 0;
      var ly = y.runs && y.runs.length ? y.runs[y.runs.length - 1].at : 0;
      return lx - ly;
    });
    return '#/lesen/artikel/' + encodeURIComponent(withQ[0].id) + '/fragen';
  }

  function render(el, params) {
    if (params[0] === 'neu') return renderNew(el);
    if (params[0] === 'artikel' && params[1] && params[2] === 'fragen') return renderQuestions(el, params[1]);
    if (params[0] === 'artikel' && params[1]) return renderArticle(el, params[1]);
    if (params[0] === 'ueben') { location.replace(practiceRoute()); return; }
    return renderOverview(el);
  }

  APP.registerModule({
    id: ID,
    title: 'Lesen',
    enqueueOnMastery: false,
    topics: function () { return TOPICS; },
    items: function () { return []; },
    getItem: function () { return null; },
    topicOf: function () { return null; },
    focusInfo: function () {
      var n = R().articles.length, q = R().articles.filter(function (a) { return a.questions; }).length;
      return n + ' Artikel · ' + q + ' mit Fragen';
    },
    render: render,
    // gemeinsam mit Hören genutzt
    renderTappable: renderTappable,
    attachSelection: attachSelection,
    clozeSentence: clozeSentence
  });
})(window.APP);
