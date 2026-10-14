/* Modul 3: Schreiben – Aufgaben, Schreibansicht, Claude-Brücke, Fehlerstatistik */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;
  var ID = 'schreiben';

  var SCHEMA_ID = 'deutsch-c2-schreiben-1';
  var CATEGORIES = ['Grammatik', 'Wortschatz', 'Register', 'Stil', 'Kohärenz', 'Rechtschreibung/Zeichensetzung'];
  var CRITERIA = [
    { key: 'aufgabenerfuellung', label: 'Aufgabenerfüllung' },
    { key: 'kohaerenz', label: 'Kohärenz' },
    { key: 'wortschatz', label: 'Wortschatz' },
    { key: 'strukturen', label: 'Strukturen' }
  ];
  var ERROR_TOPIC = { id: 'eigene-fehler', title: 'Fehler aus meinen Texten', description: 'Automatisch aus dem Schreib-Feedback erzeugte Korrekturaufgaben.' };
  var ERROR_DECK = { id: 'aus-texten', title: 'Aus meinen Texten' };

  function S() { return APP.store.state; }
  function W() {
    var w = S().writing || (S().writing = {});
    w.drafts = w.drafts || {};
    w.submissions = w.submissions || [];
    return w;
  }

  /* ---------- Inhalte ---------- */

  function seed() { return (window.DATA && window.DATA.schreiben) || { types: [], tasks: [] }; }
  function own() {
    var c = S().content;
    if (!c[ID]) c[ID] = {};
    c[ID].tasks = c[ID].tasks || [];
    return c[ID];
  }
  function types() { return seed().types; }
  function typeById(id) { return types().filter(function (t) { return t.id === id; })[0] || { id: id, title: id }; }
  function tasks() { return seed().tasks.concat(own().tasks); }
  function taskById(id) { return tasks().filter(function (t) { return t.id === id; })[0] || null; }
  function submissionById(id) { return W().submissions.filter(function (s) { return s.id === id; })[0] || null; }
  function withFeedback() { return W().submissions.filter(function (s) { return s.feedback; }); }

  function fmtClock(sec) {
    var neg = sec < 0;
    sec = Math.abs(Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (neg ? '−' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------- Prompt für Claude ---------- */

  function buildPrompt(sub) {
    var t = sub.task;
    var lines = [];
    lines.push('Du bist ein strenger Prüfer für das Goethe-Zertifikat C2: Großes Deutsches Sprachdiplom (Modul Schreiben). Bewerte meinen Text kompromisslos auf C2-Niveau. Antworte auf Deutsch.');
    lines.push('');
    lines.push('## Aufgabe');
    lines.push('Textsorte: ' + t.typeTitle);
    lines.push('Titel: ' + t.title);
    lines.push('');
    lines.push(t.prompt);
    if (t.source) {
      lines.push('');
      lines.push('Ausgangstext:');
      lines.push('"""');
      lines.push(t.source);
      lines.push('"""');
    }
    lines.push('');
    lines.push('Vorgaben: ' + t.words[0] + '–' + t.words[1] + ' Wörter, ' + t.minutes + ' Minuten.');
    lines.push('Tatsächlich: ' + sub.words + ' Wörter, ' + Math.round(sub.seconds / 60) + ' Minuten.');
    lines.push('');
    lines.push('## Mein Text');
    lines.push('"""');
    lines.push(sub.text);
    lines.push('"""');
    lines.push('');
    lines.push('## Deine Aufgaben');
    lines.push('1. **Fehlerliste:** Liste JEDEN Fehler einzeln auf, auch kleine. Ordne jeden Fehler genau einer Kategorie zu: ' + CATEGORIES.join(', ') + '. Zitiere die fehlerhafte Stelle wörtlich, gib die Korrektur an und erkläre den Fehler kurz (ein bis zwei Sätze). Markiere auch Formulierungen, die zwar korrekt, aber für C2 zu einfach, unidiomatisch oder registerfremd sind (Kategorie Wortschatz, Register oder Stil).');
    lines.push('2. **C2-Fassung:** Schreibe eine vollständige Neufassung meines Textes auf C2-Niveau, die meine Gedanken und meinen Aufbau so weit wie möglich beibehält.');
    lines.push('3. **Bewertung:** Bewerte angelehnt an die Kriterien des Goethe-Zertifikats C2 – Aufgabenerfüllung, Kohärenz, Wortschatz, Strukturen – jeweils mit 0–5 Punkten (5 = voll auf C2-Niveau) und einer kurzen Begründung. Gib eine Gesamteinschätzung in Prozent (0–100; 60 = knapp bestanden) und das erreichte Niveau an. Nenne die drei wichtigsten Punkte, an denen ich arbeiten sollte.');
    lines.push('4. **JSON:** Beende deine Antwort mit GENAU EINEM Codeblock ```json … ``` nach dem folgenden Schema. Nach dem Codeblock folgt kein weiterer Text.');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify({
      schema: SCHEMA_ID,
      bewertung: { aufgabenerfuellung: 0, kohaerenz: 0, wortschatz: 0, strukturen: 0, prozent: 0, niveau: 'C1' },
      fehler: [{
        kategorie: 'Grammatik',
        original: 'wörtliches Zitat der fehlerhaften Stelle',
        korrektur: 'korrigierte Stelle',
        satz: 'vollständiger Originalsatz, in dem der Fehler steht',
        satzKorrigiert: 'derselbe Satz, nur an dieser Stelle korrigiert',
        erklaerung: 'kurze Erklärung',
        regel: 'kurzer, wiederverwendbarer Regelname'
      }]
    }, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('Regeln für das JSON:');
    lines.push('- "kategorie" ist genau einer dieser Werte: ' + CATEGORIES.map(function (c) { return '"' + c + '"'; }).join(', ') + '.');
    lines.push('- "original" ist eine exakte, zusammenhängende Zeichenfolge aus meinem Text (nicht umformuliert), "satz" der vollständige Satz aus meinem Text.');
    lines.push('- "satzKorrigiert" unterscheidet sich von "satz" nur durch die Korrektur dieses einen Fehlers.');
    lines.push('- "regel" ist eine kurze, allgemeine Bezeichnung des Fehlertyps (z. B. "Konjunktiv I in indirekter Rede", "Rektion: verfügen über", "Komma vor Infinitivgruppe mit um … zu", "Register: umgangssprachlich in formellem Brief"). Verwende für gleiche Fehlertypen immer exakt dieselbe Bezeichnung.');
    lines.push('- Jeder Fehler aus der Fehlerliste erscheint genau einmal im JSON; "niveau" ist "C2", "C1", "B2" oder "unter B2".');
    return lines.join('\n');
  }

  /* ---------- Feedback auslesen ---------- */

  function normCategory(s) {
    var x = String(s || '').toLowerCase();
    if (/^gram/.test(x)) return 'Grammatik';
    if (/^(wort|lex)/.test(x)) return 'Wortschatz';
    if (/^reg/.test(x)) return 'Register';
    if (/^stil/.test(x)) return 'Stil';
    if (/^koh/.test(x)) return 'Kohärenz';
    if (/(recht|zeichen|ortho|interp|komma)/.test(x)) return 'Rechtschreibung/Zeichensetzung';
    return null;
  }

  function extractJson(raw) {
    var blocks = [], re = /```(?:json)?\s*([\s\S]*?)```/gi, m;
    while ((m = re.exec(raw))) blocks.push({ text: m[1], start: m.index, end: re.lastIndex });
    for (var i = blocks.length - 1; i >= 0; i--) {
      if (/"fehler"/.test(blocks[i].text)) return blocks[i];
    }
    // ohne Codeblock: vom ersten "{" vor "schema"/"fehler" bis zur letzten "}"
    var key = raw.search(/"(schema|bewertung|fehler)"\s*:/);
    if (key < 0) return null;
    var start = raw.lastIndexOf('{', key);
    var end = raw.lastIndexOf('}');
    if (start < 0 || end < start) return null;
    return { text: raw.slice(start, end + 1), start: start, end: end + 1 };
  }

  /** Gibt { feedback } oder { errors: [...] } zurück. */
  function parseFeedback(raw) {
    var errors = [];
    var block = extractJson(raw);
    if (!block) return { errors: ['Kein JSON-Block gefunden. Die Antwort von Claude muss mit einem ```json … ```-Block enden. Haben Sie die ganze Antwort eingefügt?'] };
    var data;
    try { data = JSON.parse(block.text); } catch (e) {
      return { errors: ['Der JSON-Block ist fehlerhaft: ' + e.message + '. Tipp: Bitten Sie Claude, nur den JSON-Block noch einmal korrekt auszugeben.'] };
    }
    if (!data || typeof data !== 'object') return { errors: ['Der JSON-Block enthält kein Objekt.'] };
    if (!Array.isArray(data.fehler)) errors.push('Feld "fehler" fehlt oder ist keine Liste.');
    var b = data.bewertung || {};
    var scores = {};
    CRITERIA.forEach(function (c) {
      var v = Number(b[c.key]);
      if (b[c.key] === undefined || isNaN(v)) errors.push('bewertung.' + c.key + ' fehlt oder ist keine Zahl.');
      else scores[c.key] = Math.max(0, Math.min(5, v));
    });
    var pct = Number(b.prozent);
    if (b.prozent === undefined || isNaN(pct)) errors.push('bewertung.prozent fehlt oder ist keine Zahl.');

    var list = [];
    (Array.isArray(data.fehler) ? data.fehler : []).forEach(function (f, i) {
      var n = i + 1;
      if (!f || typeof f !== 'object') { errors.push('Fehler ' + n + ': kein Objekt.'); return; }
      var cat = normCategory(f.kategorie);
      if (!cat) errors.push('Fehler ' + n + ': unbekannte Kategorie „' + f.kategorie + '“ (erlaubt: ' + CATEGORIES.join(', ') + ').');
      if (!f.original || typeof f.original !== 'string') errors.push('Fehler ' + n + ': "original" fehlt.');
      if (typeof f.korrektur !== 'string') errors.push('Fehler ' + n + ': "korrektur" fehlt.');
      list.push({
        kategorie: cat || String(f.kategorie || ''),
        original: String(f.original || ''),
        korrektur: String(f.korrektur || ''),
        satz: f.satz ? String(f.satz) : '',
        satzKorrigiert: f.satzKorrigiert ? String(f.satzKorrigiert) : '',
        erklaerung: f.erklaerung ? String(f.erklaerung) : '',
        regel: f.regel ? String(f.regel).trim() : ''
      });
    });
    if (errors.length) return { errors: errors };
    return {
      feedback: {
        schema: data.schema || null,
        scores: scores,
        prozent: Math.max(0, Math.min(100, pct)),
        niveau: b.niveau ? String(b.niveau) : '',
        errors: list,
        text: (raw.slice(0, block.start) + raw.slice(block.end)).trim()
      }
    };
  }

  /* ---------- Minimales Markdown für Claudes Antworttext ---------- */

  function inlineMd(s) {
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }

  function renderMarkdown(text) {
    var out = [], list = null, para = [];
    function flushPara() { if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; } }
    function flushList() { if (list) { out.push('<' + list.tag + '>' + list.items.join('') + '</' + list.tag + '>'); list = null; } }
    text.split(/\r?\n/).forEach(function (line) {
      var m;
      if (!line.trim()) { flushPara(); flushList(); return; }
      if ((m = line.match(/^\s*#{1,6}\s+(.*)$/))) { flushPara(); flushList(); out.push('<h4>' + inlineMd(m[1]) + '</h4>'); return; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flushPara(); flushList(); out.push('<hr>'); return; }
      if ((m = line.match(/^\s*[-*•]\s+(.*)$/)) || (m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushPara();
        var tag = /^\s*\d/.test(line) ? 'ol' : 'ul';
        if (list && list.tag !== tag) flushList();
        if (!list) list = { tag: tag, items: [] };
        list.items.push('<li>' + inlineMd(m[1]) + '</li>');
        return;
      }
      if ((m = line.match(/^\s*>\s?(.*)$/))) { flushPara(); flushList(); out.push('<blockquote>' + inlineMd(m[1]) + '</blockquote>'); return; }
      if (list) flushList();
      para.push(inlineMd(line));
    });
    flushPara(); flushList();
    return out.join('');
  }

  /* ---------- Fehler → Übungen ---------- */

  function makeGrammarItem(sub, idx) {
    var e = sub.feedback.errors[idx];
    var text = e.satz || e.original;
    var answer = e.satzKorrigiert || (e.satz ? e.satz.replace(e.original, e.korrektur) : e.korrektur);
    if (U.normalize(text) === U.normalize(answer)) {
      U.toast('Original und Korrektur sind identisch – keine Aufgabe erstellt.');
      return;
    }
    var item = {
      id: 'g-s-' + Date.now().toString(36) + idx,
      topic: ERROR_TOPIC.id,
      type: 'error',
      instruction: 'Korrigieren Sie den Satz aus Ihrem Text (' + e.kategorie + (e.regel ? ': ' + e.regel : '') + ').',
      text: text,
      answers: [answer],
      explanation: (e.erklaerung || '') + (e.original && e.korrektur ? ' („' + e.original + '“ → „' + e.korrektur + '“)' : ''),
      source: 'schreiben',
      origin: { submission: sub.id, error: idx }
    };
    APP.modules.grammatik.addItem(item, ERROR_TOPIC);
    e.converted = Object.assign({}, e.converted, { grammar: item.id });
    APP.store.save();
    U.toast('Grammatikaufgabe erstellt (Thema „' + ERROR_TOPIC.title + '“).');
  }

  function makeVocabCard(sub, idx) {
    var e = sub.feedback.errors[idx];
    var example = '';
    var base = e.satzKorrigiert || '';
    if (base && e.korrektur && base.indexOf(e.korrektur) >= 0) {
      example = base.replace(e.korrektur, '[[' + e.korrektur + ']]');
    } else {
      example = base;
    }
    APP.modules.wortschatz.openEditor({
      term: e.korrektur,
      meaning: e.erklaerung,
      example: example,
      tags: ['aus Schreiben', e.kategorie],
      deck: ERROR_DECK.id,
      deckTitle: ERROR_DECK.title,
      origin: { submission: sub.id, error: idx },
      returnTo: '#/schreiben/text/' + encodeURIComponent(sub.id),
      onSaved: function (card) {
        var s = submissionById(sub.id);
        if (s && s.feedback && s.feedback.errors[idx]) {
          s.feedback.errors[idx].converted = Object.assign({}, s.feedback.errors[idx].converted, { vocab: card.id });
        }
      }
    });
  }

  /* ---------- Ansicht: Übersicht ---------- */

  function nextTaskOf(typeId) {
    var counts = {};
    W().submissions.forEach(function (s) { counts[s.taskId] = (counts[s.taskId] || 0) + 1; });
    var list = tasks().filter(function (t) { return t.type === typeId; });
    list.sort(function (a, b) { return (counts[a.id] || 0) - (counts[b.id] || 0); });
    return list[0] || null;
  }

  function renderOverview(el) {
    var R = APP.progress.ruleFor(ID);
    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Schreiben'),
      h('p', { class: 'muted' }, 'Schreiben Sie mit Zeitvorgabe, lassen Sie den Text von Claude prüfen und fügen Sie das Feedback hier ein. Eine Textsorte gilt als beherrscht, wenn die letzten ' +
        R.window + ' Texte im Schnitt mindestens ' + Math.round(R.accuracy * 100) + ' % erreichen (an mindestens ' + R.days + ' Tagen).')));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);

    var pending = W().submissions.filter(function (s) { return !s.feedback; });
    var drafts = Object.keys(W().drafts).filter(function (k) { return W().drafts[k].text && taskById(k); });
    var info = h('section', { class: 'card' },
      h('div', { class: 'actions' },
        h('a', { class: 'btn', href: '#/schreiben/statistik' }, 'Fehlerstatistik'),
        h('a', { class: 'btn', href: '#/schreiben/texte' }, 'Meine Texte (' + W().submissions.length + ')'),
        h('a', { class: 'btn ghost', href: '#/schreiben/neu' }, '+ Eigene Aufgabe')));
    if (pending.length) {
      info.appendChild(h('div', { class: 'notice' }, pending.length + (pending.length === 1 ? ' Text wartet' : ' Texte warten') + ' noch auf das Feedback von Claude: ',
        pending.map(function (s, i) { return [i ? ', ' : '', h('a', { href: '#/schreiben/text/' + encodeURIComponent(s.id) }, s.task.title)]; })));
    }
    if (drafts.length) {
      info.appendChild(h('p', { class: 'small' }, 'Angefangene Entwürfe: ',
        drafts.map(function (k, i) { return [i ? ', ' : '', h('a', { href: '#/schreiben/aufgabe/' + encodeURIComponent(k) }, taskById(k).title)]; })));
    }
    el.appendChild(info);

    types().forEach(function (ty) {
      var sec = h('section', { class: 'card' });
      sec.appendChild(APP.ui.masteryRow(ID, ty));
      var list = h('ul', { class: 'task-list' });
      tasks().filter(function (t) { return t.type === ty.id; }).forEach(function (t) {
        var subs = W().submissions.filter(function (s) { return s.taskId === t.id && s.feedback; });
        var last = subs[subs.length - 1];
        list.appendChild(h('li', null,
          h('a', { href: '#/schreiben/aufgabe/' + encodeURIComponent(t.id) }, t.title),
          h('span', { class: 'muted small' }, ' · ' + t.words[0] + '–' + t.words[1] + ' Wörter · ' + t.minutes + ' Min.' +
            (last ? ' · zuletzt ' + last.feedback.prozent + ' %' : '') +
            (W().drafts[t.id] && W().drafts[t.id].text ? ' · Entwurf' : '')),
          t.source === 'user' || /^t-u-/.test(t.id) ? h('span', { class: 'chip' }, 'eigene') : null));
      });
      sec.appendChild(list);
      el.appendChild(sec);
    });
  }

  /* ---------- Ansicht: Schreiben ---------- */

  function renderWrite(el, taskId) {
    var t = taskById(taskId);
    if (!t) {
      el.appendChild(h('section', { class: 'card' }, h('p', null, 'Aufgabe nicht gefunden.'), h('a', { href: '#/schreiben' }, 'Zurück')));
      return;
    }
    var draft = W().drafts[taskId] || (W().drafts[taskId] = { text: '', elapsed: 0 });
    var limit = t.minutes * 60;

    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/schreiben', class: 'back' }, '← Schreiben'),
      h('div', { class: 'eyebrow' }, typeById(t.type).title),
      h('h1', null, t.title)));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);

    var taskBox = h('details', { class: 'card task-box', open: !draft.text || null },
      h('summary', null, 'Aufgabe · ' + t.words[0] + '–' + t.words[1] + ' Wörter · ' + t.minutes + ' Min.'),
      h('div', { class: 'task-prompt' }, t.prompt),
      t.source ? h('div', { class: 'source-text' }, h('div', { class: 'label' }, 'Ausgangstext'), t.source) : null,
      t.status === 'ungeprüft' ? h('p', { class: 'muted small' }, 'Seed-Aufgabe (ungeprüft).') : null);
    el.appendChild(taskBox);

    var clock = h('span', { class: 'clock' });
    var words = h('span', { class: 'wordcount' });
    var toggle = h('button', { type: 'button', class: 'btn small ghost', onclick: function () { running ? pause() : start(); } });
    var bar = h('div', { class: 'write-bar' }, clock, toggle, words);
    var area = h('textarea', { class: 'write-area', spellcheck: 'false', autocomplete: 'off', placeholder: 'Hier schreiben … (die Zeit startet beim ersten Tastendruck)', 'aria-label': 'Ihr Text' });
    area.value = draft.text;
    el.appendChild(bar);
    el.appendChild(area);

    var running = false, timerId = null, saveTimer = null;

    function updateClock() {
      var left = limit - draft.elapsed;
      clock.textContent = left >= 0 ? '⏱ noch ' + fmtClock(left) : '⏱ ' + fmtClock(-left) + ' über der Zeit';
      clock.className = 'clock' + (left < 0 ? ' is-over' : left < 300 ? ' is-low' : '');
      toggle.textContent = running ? 'Pause' : draft.elapsed ? 'Weiter' : 'Start';
    }
    function updateWords() {
      var n = U.wordCount(area.value);
      words.textContent = n + ' Wörter (' + t.words[0] + '–' + t.words[1] + ')';
      words.className = 'wordcount' + (n > t.words[1] ? ' is-over' : n >= t.words[0] ? ' is-ok' : '');
    }
    function start() {
      if (running) return;
      running = true;
      timerId = setInterval(function () {
        if (!el.isConnected) { stop(); return; }
        if (document.hidden) return;
        draft.elapsed += 1;
        updateClock();
      }, 1000);
      updateClock();
    }
    function pause() { running = false; clearInterval(timerId); persist(); updateClock(); }
    function stop() { running = false; clearInterval(timerId); persist(); }
    function persist() {
      draft.text = area.value;
      draft.updatedAt = Date.now();
      APP.store.save();
    }

    area.addEventListener('input', function () {
      if (!running) start();
      updateWords();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persist, 800);
    });
    window.addEventListener('hashchange', function once() { stop(); window.removeEventListener('hashchange', once); });

    var finishBtn = h('button', {
      type: 'button', class: 'btn primary', onclick: function () {
        var text = area.value.trim();
        if (U.wordCount(text) < 20) { U.toast('Bitte zuerst einen Text schreiben (mind. 20 Wörter).'); return; }
        stop();
        var sub = {
          id: 's-' + Date.now().toString(36),
          taskId: t.id,
          type: t.type,
          task: { title: t.title, prompt: t.prompt, source: t.source || '', words: t.words, minutes: t.minutes, typeTitle: typeById(t.type).title },
          text: text,
          words: U.wordCount(text),
          seconds: draft.elapsed,
          createdAt: Date.now(),
          feedback: null
        };
        W().submissions.push(sub);
        delete W().drafts[t.id];
        APP.store.save();
        U.copyText(buildPrompt(sub)).then(function (ok) {
          U.toast(ok ? 'Prompt kopiert – jetzt in Claude einfügen.' : 'Kopieren nicht möglich – bitte den Prompt manuell kopieren.');
          APP.navigate('#/schreiben/text/' + encodeURIComponent(sub.id) + (ok ? '' : '/prompt'));
        });
      }
    }, 'Für Claude kopieren');
    el.appendChild(h('div', { class: 'actions' }, finishBtn,
      h('button', {
        type: 'button', class: 'btn ghost', onclick: function () {
          if (!area.value.trim() || window.confirm('Entwurf verwerfen und Zeit zurücksetzen?')) {
            stop();
            delete W().drafts[t.id];
            APP.store.save();
            APP.navigate('#/schreiben');
          }
        }
      }, 'Entwurf verwerfen')));
    el.appendChild(h('p', { class: 'muted small' }, '„Für Claude kopieren“ schließt den Text ab und kopiert einen vollständigen Prüfer-Prompt (Aufgabe, Ihr Text, Bewertungsanweisungen) in die Zwischenablage. Der Entwurf wird automatisch gespeichert.'));

    updateClock();
    updateWords();
    setTimeout(function () { area.focus(); }, 30);
  }

  /* ---------- Ansicht: Text + Feedback ---------- */

  function highlightText(text, errors) {
    var marks = [];
    var used = [];
    errors.forEach(function (e, i) {
      if (!e.original) return;
      var from = 0, pos;
      while ((pos = text.indexOf(e.original, from)) >= 0) {
        var end = pos + e.original.length;
        var overlap = used.some(function (u) { return pos < u[1] && end > u[0]; });
        if (!overlap) { used.push([pos, end]); marks.push({ start: pos, end: end, i: i, e: e }); break; }
        from = pos + 1;
      }
    });
    marks.sort(function (a, b) { return a.start - b.start; });
    var nodes = [], cur = 0;
    marks.forEach(function (m) {
      nodes.push(text.slice(cur, m.start));
      nodes.push(h('mark', {
        class: 'err cat-' + CATEGORIES.indexOf(m.e.kategorie), title: m.e.kategorie + ': ' + m.e.korrektur,
        onclick: function () {
          var target = document.getElementById('err-' + m.i);
          if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('flash'); setTimeout(function () { target.classList.remove('flash'); }, 1200); }
        }
      }, text.slice(m.start, m.end), h('sup', null, String(m.i + 1))));
      cur = m.end;
    });
    nodes.push(text.slice(cur));
    return { nodes: nodes, found: marks.length };
  }

  function scoreBlock(fb) {
    var box = h('section', { class: 'card' },
      h('div', { class: 'eyebrow' }, 'Bewertung (angelehnt an Goethe C2)'),
      h('p', { class: 'big-number' }, fb.prozent + ' %', fb.niveau ? h('span', { class: 'muted small' }, ' · Niveau ' + fb.niveau) : null));
    var grid = h('div', { class: 'hbars wide-labels' });
    CRITERIA.forEach(function (c) {
      var v = fb.scores[c.key];
      grid.appendChild(h('div', { class: 'hbar', title: c.label + ': ' + v + ' von 5' },
        h('span', { class: 'hbar-label' }, c.label),
        h('span', { class: 'hbar-track' }, h('span', { class: 'hbar-fill', style: { width: (v / 5 * 100) + '%' } })),
        h('span', { class: 'hbar-value' }, String(v).replace('.', ',') + ' / 5')));
    });
    box.appendChild(grid);
    return box;
  }

  function errorList(sub) {
    var fb = sub.feedback;
    var box = h('section', { class: 'card' }, h('h2', null, 'Fehler (' + fb.errors.length + ')'));
    if (!fb.errors.length) { box.appendChild(h('p', { class: 'muted' }, 'Keine Fehler gemeldet.')); return box; }
    var counts = {};
    fb.errors.forEach(function (e) { counts[e.kategorie] = (counts[e.kategorie] || 0) + 1; });
    box.appendChild(h('p', { class: 'fc-tags' }, CATEGORIES.filter(function (c) { return counts[c]; }).map(function (c) {
      return h('span', { class: 'chip cat-chip cat-' + CATEGORIES.indexOf(c) }, c + ' ' + counts[c]);
    })));
    var list = h('ol', { class: 'error-list' });
    fb.errors.forEach(function (e, i) {
      var conv = e.converted || {};
      list.appendChild(h('li', { id: 'err-' + i, class: 'error-item' },
        h('div', { class: 'error-head' },
          h('span', { class: 'chip cat-chip cat-' + CATEGORIES.indexOf(e.kategorie) }, e.kategorie),
          e.regel ? h('span', { class: 'muted small' }, e.regel) : null),
        h('p', { class: 'error-fix' }, h('del', null, e.original), ' → ', h('ins', null, e.korrektur || '∅')),
        e.erklaerung ? h('p', { class: 'small' }, e.erklaerung) : null,
        h('div', { class: 'error-actions' },
          conv.grammar
            ? h('a', { class: 'small', href: '#/grammatik/thema/' + ERROR_TOPIC.id }, '✓ Grammatikaufgabe erstellt')
            : h('button', { type: 'button', class: 'btn small ghost', onclick: function (ev) { makeGrammarItem(sub, i); if (e.converted && e.converted.grammar) ev.target.replaceWith(h('a', { class: 'small', href: '#/grammatik/thema/' + ERROR_TOPIC.id }, '✓ Grammatikaufgabe erstellt')); } }, '→ Grammatikaufgabe'),
          conv.vocab
            ? h('span', { class: 'small muted' }, '✓ Wortschatzkarte erstellt')
            : h('button', { type: 'button', class: 'btn small ghost', onclick: function () { makeVocabCard(sub, i); } }, '→ Wortschatzkarte'))));
    });
    box.appendChild(list);
    return box;
  }

  function renderText(el, subId, showPrompt) {
    var sub = submissionById(subId);
    if (!sub) {
      el.appendChild(h('section', { class: 'card' }, h('p', null, 'Text nicht gefunden.'), h('a', { href: '#/schreiben/texte' }, 'Zurück')));
      return;
    }
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/schreiben/texte', class: 'back' }, '← Meine Texte'),
      h('div', { class: 'eyebrow' }, sub.task.typeTitle),
      h('h1', null, sub.task.title),
      h('p', { class: 'muted small' }, U.fmtDate(sub.createdAt) + ' · ' + sub.words + ' Wörter · ' + Math.round(sub.seconds / 60) + ' Min.')));

    var prompt = buildPrompt(sub);
    var promptBox = h('textarea', { class: 'answer-input prompt-box', rows: 8, readonly: true });
    promptBox.value = prompt;
    var copyRow = h('div', { class: 'actions' },
      h('button', {
        type: 'button', class: 'btn' + (sub.feedback ? ' ghost' : ' primary'), onclick: function () {
          U.copyText(prompt).then(function (ok) {
            if (ok) U.toast('Prompt kopiert.');
            else { promptDetails.open = true; promptBox.select(); U.toast('Bitte manuell kopieren (Strg/Cmd + C).'); }
          });
        }
      }, sub.feedback ? 'Prompt erneut kopieren' : 'Für Claude kopieren'));
    var promptDetails = h('details', { class: 'prompt-details', open: showPrompt || null }, h('summary', null, 'Prompt anzeigen'), promptBox);

    // Schritt: Feedback einfügen
    var paste = h('textarea', { class: 'answer-input', rows: 8, placeholder: 'Komplette Antwort von Claude hier einfügen (inklusive JSON-Block am Ende) …', 'aria-label': 'Feedback von Claude' });
    var msg = h('div', { 'aria-live': 'polite' });
    var feedbackStep = h('section', { class: 'card' },
      h('h2', null, sub.feedback ? 'Feedback ersetzen' : 'Feedback einfügen'),
      !sub.feedback ? h('ol', { class: 'steps small' },
        h('li', null, 'Prompt kopieren und in einem Claude-Chat einfügen.'),
        h('li', null, 'Die vollständige Antwort hier einfügen und auswerten.')) : null,
      copyRow, promptDetails, paste, msg,
      h('div', { class: 'actions' }, h('button', {
        type: 'button', class: 'btn primary', onclick: function () {
          U.clear(msg);
          var res = parseFeedback(paste.value);
          if (res.errors) {
            msg.appendChild(h('div', { class: 'notice bad' }, h('strong', null, 'Das Feedback konnte nicht übernommen werden:'),
              h('ul', null, res.errors.slice(0, 12).map(function (e) { return h('li', null, e); })),
              res.errors.length > 12 ? h('p', null, '… und ' + (res.errors.length - 12) + ' weitere.') : null));
            return;
          }
          sub.feedback = res.feedback;
          sub.feedbackAt = Date.now();
          APP.progress.removeAttempts(ID, sub.id);
          var r = APP.progress.record(ID, sub.type, sub.id, res.feedback.prozent / 100);
          APP.store.save();
          U.toast(r.mastered ? 'Textsorte „' + typeById(sub.type).title + '“ beherrscht!' : 'Feedback gespeichert.');
          APP.navigate('#/schreiben/text/' + encodeURIComponent(sub.id));
        }
      }, 'Auswerten und speichern')));

    if (!sub.feedback) {
      el.appendChild(feedbackStep);
      el.appendChild(h('section', { class: 'card' }, h('h2', null, 'Ihr Text'), h('div', { class: 'my-text' }, sub.text)));
    } else {
      var fb = sub.feedback;
      var hl = highlightText(sub.text, fb.errors);
      el.appendChild(scoreBlock(fb));
      el.appendChild(h('section', { class: 'card' },
        h('h2', null, 'Ihr Text'),
        h('div', { class: 'my-text' }, hl.nodes),
        hl.found < fb.errors.length ? h('p', { class: 'muted small' }, (fb.errors.length - hl.found) + ' Fehlerstelle(n) konnten im Text nicht exakt gefunden werden.') : null));
      el.appendChild(errorList(sub));
      if (fb.text) {
        el.appendChild(h('details', { class: 'card claude-text' },
          h('summary', null, 'Vollständige Antwort von Claude (inkl. C2-Fassung)'),
          h('div', { class: 'md', html: renderMarkdown(fb.text) })));
      }
      el.appendChild(h('details', { class: 'card' }, h('summary', null, 'Feedback ersetzen / Prompt erneut kopieren'), feedbackStep));
    }

    el.appendChild(h('div', { class: 'actions' },
      h('a', { class: 'btn ghost', href: '#/schreiben/aufgabe/' + encodeURIComponent(sub.taskId) }, 'Aufgabe erneut schreiben'),
      h('button', {
        type: 'button', class: 'btn bad', onclick: function () {
          if (!window.confirm('Diesen Text samt Feedback löschen?')) return;
          W().submissions = W().submissions.filter(function (s) { return s.id !== sub.id; });
          APP.progress.removeAttempts(ID, sub.id);
          APP.store.save();
          APP.navigate('#/schreiben/texte');
        }
      }, 'Text löschen')));
  }

  /* ---------- Ansicht: Meine Texte ---------- */

  function renderList(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/schreiben', class: 'back' }, '← Schreiben'),
      h('h1', null, 'Meine Texte')));
    var subs = W().submissions.slice().reverse();
    if (!subs.length) { el.appendChild(h('section', { class: 'card' }, h('p', { class: 'muted' }, 'Noch keine Texte.'))); return; }
    var list = h('section', { class: 'card text-list' });
    subs.forEach(function (s) {
      list.appendChild(h('a', { class: 'text-row', href: '#/schreiben/text/' + encodeURIComponent(s.id) },
        h('div', null,
          h('div', { class: 'topic-title' }, s.task.title),
          h('div', { class: 'muted small' }, s.task.typeTitle + ' · ' + U.fmtDate(s.createdAt) + ' · ' + s.words + ' Wörter')),
        s.feedback
          ? h('div', { class: 'text-score' }, h('strong', null, s.feedback.prozent + ' %'), h('span', { class: 'muted small' }, s.feedback.errors.length + ' Fehler'))
          : h('span', { class: 'chip chip-warn' }, 'Feedback fehlt')));
    });
    el.appendChild(list);
  }

  /* ---------- Ansicht: Fehlerstatistik ---------- */

  var statFilter = { type: '', range: 'all' };

  function ruleKey(e) {
    return e.regel ? e.regel.toLowerCase().replace(/\s+/g, ' ').trim() : e.kategorie + ': ' + e.korrektur.toLowerCase();
  }

  function renderStats(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/schreiben', class: 'back' }, '← Schreiben'),
      h('h1', null, 'Fehlerstatistik')));

    var typeSel = h('select', { 'aria-label': 'Textsorte', onchange: function (e) { statFilter.type = e.target.value; APP.navigate(location.hash); } },
      h('option', { value: '' }, 'Alle Textsorten'),
      types().map(function (t) { return h('option', { value: t.id, selected: statFilter.type === t.id || null }, t.title); }));
    var rangeSel = h('select', { 'aria-label': 'Zeitraum', onchange: function (e) { statFilter.range = e.target.value; APP.navigate(location.hash); } },
      [['all', 'Alle Texte'], ['5', 'Letzte 5 Texte'], ['10', 'Letzte 10 Texte']].map(function (o) {
        return h('option', { value: o[0], selected: statFilter.range === o[0] || null }, o[1]);
      }));
    el.appendChild(h('div', { class: 'filters' }, typeSel, rangeSel));

    var subs = withFeedback().filter(function (s) { return !statFilter.type || s.type === statFilter.type; });
    if (statFilter.range !== 'all') subs = subs.slice(-Number(statFilter.range));
    if (!subs.length) {
      el.appendChild(h('section', { class: 'card' }, h('p', { class: 'muted' }, 'Noch keine Texte mit Feedback in dieser Auswahl.')));
      return;
    }

    var all = [];
    subs.forEach(function (s) { s.feedback.errors.forEach(function (e, i) { all.push({ e: e, s: s, i: i }); }); });
    var totalWords = subs.reduce(function (a, s) { return a + s.words; }, 0);
    var avgScore = Math.round(subs.reduce(function (a, s) { return a + s.feedback.prozent; }, 0) / subs.length);

    el.appendChild(h('div', { class: 'tiles' },
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Texte'), h('div', { class: 'tile-value' }, String(subs.length))),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Fehler'), h('div', { class: 'tile-value' }, String(all.length))),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Fehler / 100 Wörter'), h('div', { class: 'tile-value' }, (all.length / Math.max(1, totalWords) * 100).toFixed(1).replace('.', ','))),
      h('div', { class: 'tile' }, h('div', { class: 'tile-label' }, 'Ø Bewertung'), h('div', { class: 'tile-value' }, avgScore + ' %'))));

    // Kategorien
    var counts = {};
    all.forEach(function (x) { counts[x.e.kategorie] = (counts[x.e.kategorie] || 0) + 1; });
    var max = Math.max.apply(null, CATEGORIES.map(function (c) { return counts[c] || 0; }).concat([1]));
    var cats = h('div', { class: 'hbars wide-labels' });
    CATEGORIES.slice().sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0); }).forEach(function (c) {
      var v = counts[c] || 0;
      cats.appendChild(h('div', { class: 'hbar', title: c + ': ' + v + ' Fehler' },
        h('span', { class: 'hbar-label' }, c),
        h('span', { class: 'hbar-track' }, h('span', { class: 'hbar-fill', style: { width: (v / max * 100) + '%' } })),
        h('span', { class: 'hbar-value' }, v + ' · ' + Math.round(v / Math.max(1, all.length) * 100) + ' %')));
    });
    el.appendChild(h('section', { class: 'card' }, h('h2', null, 'Häufigste Kategorien'), cats));

    // Verlauf
    if (subs.length > 1) {
      var rates = subs.map(function (s) { return s.feedback.errors.length / Math.max(1, s.words) * 100; });
      var rmax = Math.max.apply(null, rates.concat([1]));
      var cols = h('div', { class: 'cols', style: { gridTemplateColumns: 'repeat(' + subs.length + ', minmax(0, 36px))', justifyContent: subs.length > 12 ? 'stretch' : 'start' } });
      subs.forEach(function (s, i) {
        var label = U.fmtDate(s.createdAt) + ' · ' + s.task.title + ': ' + rates[i].toFixed(1).replace('.', ',') + ' Fehler / 100 Wörter · ' + s.feedback.prozent + ' %';
        cols.appendChild(h('a', { class: 'col', href: '#/schreiben/text/' + encodeURIComponent(s.id), title: label, 'aria-label': label },
          h('span', { style: { height: (rates[i] / rmax * 100) + '%' } })));
      });
      el.appendChild(h('section', { class: 'card' },
        h('h2', null, 'Fehler pro 100 Wörter im Verlauf'),
        cols,
        h('div', { class: 'cols-axis muted small' }, h('span', null, 'ältester Text'), h('span', null, 'neuester'))));
    }

    // Wiederkehrende Fehler
    var groups = {};
    all.forEach(function (x) {
      var k = ruleKey(x.e);
      var g = groups[k] || (groups[k] = { label: x.e.regel || x.e.korrektur, kategorie: x.e.kategorie, items: [], texts: {} });
      g.items.push(x);
      g.texts[x.s.id] = 1;
    });
    var sorted = Object.keys(groups).map(function (k) { return groups[k]; })
      .sort(function (a, b) { return b.items.length - a.items.length || Object.keys(b.texts).length - Object.keys(a.texts).length; });
    var recurring = sorted.filter(function (g) { return g.items.length > 1; });
    var box = h('section', { class: 'card' },
      h('h2', null, 'Wiederkehrende Fehler'),
      h('p', { class: 'muted small' }, 'Gruppiert nach der Regelbezeichnung („regel“) aus dem Feedback.'));
    if (!recurring.length) box.appendChild(h('p', { class: 'muted' }, 'Noch keine Fehler, die mehrfach vorkommen.'));
    var list = h('ol', { class: 'recurring' });
    (recurring.length ? recurring : []).slice(0, 20).forEach(function (g) {
      var latest = g.items[g.items.length - 1];
      list.appendChild(h('li', null,
        h('div', { class: 'error-head' },
          h('strong', null, g.label),
          h('span', { class: 'chip cat-chip cat-' + CATEGORIES.indexOf(g.kategorie) }, g.kategorie),
          h('span', { class: 'muted small' }, g.items.length + '× in ' + Object.keys(g.texts).length + (Object.keys(g.texts).length === 1 ? ' Text' : ' Texten'))),
        h('ul', { class: 'examples small' }, g.items.slice(-3).map(function (x) {
          return h('li', null, h('del', null, x.e.original), ' → ', h('ins', null, x.e.korrektur), ' ',
            h('a', { href: '#/schreiben/text/' + encodeURIComponent(x.s.id) }, '(Text)'));
        })),
        h('div', { class: 'error-actions' },
          latest.e.converted && latest.e.converted.grammar
            ? h('span', { class: 'small muted' }, '✓ Grammatikaufgabe erstellt')
            : h('button', { type: 'button', class: 'btn small ghost', onclick: function (ev) { makeGrammarItem(latest.s, latest.i); ev.target.replaceWith(h('span', { class: 'small muted' }, '✓ Grammatikaufgabe erstellt')); } }, '→ Grammatikaufgabe'),
          h('button', { type: 'button', class: 'btn small ghost', onclick: function () { makeVocabCard(latest.s, latest.i); } }, '→ Wortschatzkarte'))));
    });
    box.appendChild(list);

    if (sorted.length > recurring.length) {
      var singles = sorted.filter(function (g) { return g.items.length === 1; });
      box.appendChild(h('details', { class: 'topic-details' },
        h('summary', null, 'Einzelne Fehler (' + singles.length + ')'),
        h('ul', { class: 'examples small' }, singles.map(function (g) {
          var x = g.items[0];
          return h('li', null, h('span', { class: 'muted' }, g.kategorie + ' · '), h('del', null, x.e.original), ' → ', h('ins', null, x.e.korrektur),
            g.label && x.e.regel ? h('span', { class: 'muted' }, ' (' + x.e.regel + ')') : null);
        }))));
    }
    el.appendChild(box);
  }

  /* ---------- Ansicht: eigene Aufgabe ---------- */

  function renderNewTask(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/schreiben', class: 'back' }, '← Schreiben'),
      h('h1', null, 'Eigene Aufgabe')));
    function field(label, control) { return h('label', { class: 'form-field' }, h('span', { class: 'form-label' }, label), control); }
    var fType = h('select', null, types().map(function (t) { return h('option', { value: t.id }, t.title); }));
    var fTitle = h('input', { type: 'text' });
    var fPrompt = h('textarea', { rows: 6 });
    var fSource = h('textarea', { rows: 5 });
    var fMin = h('input', { type: 'number', value: 300, min: 50, max: 2000 });
    var fMax = h('input', { type: 'number', value: 400, min: 50, max: 2000 });
    var fMinutes = h('input', { type: 'number', value: 60, min: 5, max: 240 });
    var msg = h('div', { 'aria-live': 'polite' });
    el.appendChild(h('form', {
      class: 'card form', onsubmit: function (e) {
        e.preventDefault();
        var errs = [];
        if (!fTitle.value.trim()) errs.push('Titel fehlt.');
        if (!fPrompt.value.trim()) errs.push('Aufgabenstellung fehlt.');
        var mn = Number(fMin.value), mx = Number(fMax.value);
        if (!(mn > 0 && mx >= mn)) errs.push('Wortzahl: Minimum muss > 0 und ≤ Maximum sein.');
        if (errs.length) { U.clear(msg).appendChild(h('div', { class: 'notice bad' }, errs.join(' '))); return; }
        var t = {
          id: 't-u-' + Date.now().toString(36), type: fType.value, title: fTitle.value.trim(),
          prompt: fPrompt.value.trim(), source: fSource.value.trim() || undefined,
          words: [mn, mx], minutes: Math.max(5, Number(fMinutes.value) || 60)
        };
        own().tasks.push(t);
        APP.store.save();
        U.toast('Aufgabe angelegt.');
        APP.navigate('#/schreiben/aufgabe/' + encodeURIComponent(t.id));
      }
    },
      field('Textsorte', fType),
      field('Titel *', fTitle),
      field('Aufgabenstellung *', fPrompt),
      field('Ausgangstext (für Umformulierungen, optional)', fSource),
      h('div', { class: 'form-row three' }, field('Wörter min.', fMin), field('Wörter max.', fMax), field('Minuten', fMinutes)),
      msg,
      h('div', { class: 'actions' }, h('button', { type: 'submit', class: 'btn primary' }, 'Speichern und schreiben'))));
  }

  /* ---------- Router ---------- */

  function render(el, params) {
    if (params[0] === 'aufgabe' && params[1]) return renderWrite(el, params[1]);
    if (params[0] === 'ueben' && params[1]) {
      var t = nextTaskOf(params[1]);
      if (t) { location.replace('#/schreiben/aufgabe/' + encodeURIComponent(t.id)); return; }
    }
    if (params[0] === 'text' && params[1]) return renderText(el, params[1], params[2] === 'prompt');
    if (params[0] === 'texte') return renderList(el);
    if (params[0] === 'statistik') return renderStats(el);
    if (params[0] === 'neu') return renderNewTask(el);
    return renderOverview(el);
  }

  APP.registerModule({
    id: ID,
    title: 'Schreiben',
    // Ein Text ist ein „Item“; Bewertung = Prozentwert von Claude
    mastery: { window: 5, accuracy: 0.8, days: 3, unit: 'Texten', accuracyLabel: '% im Schnitt' },
    enqueueOnMastery: false,
    topics: types,
    items: function (typeId) { return tasks().filter(function (t) { return t.type === typeId; }); },
    getItem: function () { return null; },
    topicOf: function () { return null; },
    focusInfo: function () {
      var pending = W().submissions.filter(function (s) { return !s.feedback; }).length;
      return W().submissions.length + ' Texte' + (pending ? ' · ' + pending + ' ohne Feedback' : '');
    },
    render: render,
    // für Tests/Import
    parseFeedback: parseFeedback,
    buildPrompt: buildPrompt
  });
})(window.APP);
