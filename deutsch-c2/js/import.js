/* Inhalte importieren: JSON aus einem Claude-Chat prüfen und übernehmen + Prompt zum Erzeugen */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  var SCHEMA_ID = 'deutsch-c2-import-1';

  function slug(s) {
    return String(s).toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function rid(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- Prompt zum Erzeugen neuer Inhalte ---------- */

  var EXAMPLES = {
    grammatik: {
      schema: SCHEMA_ID,
      grammatik: {
        topics: [{ id: 'themen-id', title: 'Nur bei neuem Thema angeben' }],
        items: [
          { topic: 'themen-id', type: 'gap', instruction: 'Arbeitsanweisung', text: 'Satz mit genau einer Lücke ___ .', answers: ['Lösung', 'weitere akzeptierte Lösung'], explanation: 'Kurze Erklärung der Regel.' },
          { topic: 'themen-id', type: 'transform', instruction: 'Formen Sie … um.', text: 'Ausgangssatz.', answers: ['Akzeptierte Umformung 1.', 'Akzeptierte Umformung 2.'], explanation: '…' },
          { topic: 'themen-id', type: 'error', instruction: 'Finden und korrigieren Sie den Fehler.', text: 'Satz mit einem Fehler.', answers: ['Korrigierter Satz.'], explanation: '…' },
          { topic: 'themen-id', type: 'mc', text: 'Satz oder Frage mit ___ .', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: '…' }
        ]
      }
    },
    wortschatz: {
      schema: SCHEMA_ID,
      wortschatz: {
        decks: [{ id: 'deck-id', title: 'Nur bei neuem Deck angeben' }],
        cards: [{
          deck: 'deck-id', term: 'die Causa', meaning: 'Angelegenheit, (Streit-)Fall – oft für einen Skandal (ohne den Begriff selbst)',
          meaningEn: 'case, affair', example: 'Die [[Causa]] beschäftigt den Ausschuss seit Monaten.',
          register: 'gehoben', collocations: ['die Causa X'], tags: ['Presse']
        }]
      }
    },
    schreiben: {
      schema: SCHEMA_ID,
      schreiben: {
        tasks: [{ type: 'eroerterung', title: 'Kurzer Titel', prompt: 'Aufgabenstellung mit Leitpunkten (Zeilenumbrüche als \\n).', source: 'Nur bei Umformulierungen: Ausgangstext', words: [350, 450], minutes: 70 }]
      }
    }
  };

  function buildGenPrompt(kind, target, count, wish) {
    var L = [];
    if (kind === 'grammatik') {
      L.push('Erstelle ' + count + ' neue Grammatikaufgaben auf Niveau C1/C2 (Orientierung: Goethe-Zertifikat C2) zum Thema „' + target.title + '“ (Themen-ID: "' + target.id + '").');
      L.push('Mische die Aufgabentypen: "gap" (Lückentext mit genau einer Lücke ___), "transform" (Satzumformung), "error" (Fehlerkorrektur: ein Satz mit genau einem Fehler) und "mc" (Multiple Choice mit 4 Optionen).');
      L.push('- Authentische, anspruchsvolle Sätze aus Presse, Wissenschaft und Verwaltung – keine Lehrbuch-Banalitäten.');
      L.push('- Bei "transform" und "error": alle gängigen korrekten Varianten in "answers" aufnehmen (Wortstellungsvarianten, mit/ohne „dass“ usw.).');
      L.push('- "explanation": 1–2 Sätze, die die Regel erklären.');
      if (target.isNew) L.push('- Das Thema ist neu: Definiere es unter "topics" mit id "' + target.id + '" und title "' + target.title + '".');
      else L.push('- Das Thema existiert bereits: "topics" weglassen.');
    } else if (kind === 'wortschatz') {
      L.push('Erstelle ' + count + ' neue Wortschatzkarten auf Niveau C1/C2 für das Deck „' + target.title + '“ (Deck-ID: "' + target.id + '").');
      L.push('- "term": Grundform; Nomen mit Artikel; Verben ggf. mit „etwas/jemandem/sich“.');
      L.push('- "meaning": deutsche Definition, die den Begriff selbst NICHT enthält (sie dient als Frage für die Produktion).');
      L.push('- "example": ein natürlicher Beispielsatz; die Stelle mit dem Begriff (in der Form, wie sie im Satz steht) mit [[…]] markieren.');
      L.push('- "register": "neutral", "gehoben", "umgangssprachlich" oder "fachsprachlich"; dazu 1–3 typische Kollokationen.');
      if (target.isNew) L.push('- Das Deck ist neu: Definiere es unter "decks" mit id "' + target.id + '" und title "' + target.title + '".');
      else L.push('- Das Deck existiert bereits: "decks" weglassen.');
      if (!target.isNew) {
        var seen = {}, existing = [];
        APP.modules.wortschatz.items(target.id).forEach(function (s) { if (!seen[s.card.term]) { seen[s.card.term] = 1; existing.push(s.card.term); } });
        if (existing.length) L.push('- Diese Begriffe sind im Deck schon vorhanden und dürfen nicht wiederholt werden: ' + existing.slice(0, 120).join('; '));
      }
    } else {
      L.push('Erstelle ' + count + ' neue C2-Schreibaufgaben der Textsorte „' + target.title + '“ (type: "' + target.id + '") im Stil des Goethe-Zertifikats C2.');
      L.push('- Aktuelle, kontroverse Themen aus Gesellschaft, Wirtschaft, Wissenschaft und Kultur; klare Leitpunkte.');
      L.push('- Zielumfang "words" und Bearbeitungszeit "minutes" passend zur Textsorte.');
      if (target.id === 'umformulierung') L.push('- Jede Aufgabe braucht in "source" einen Ausgangstext (120–180 Wörter) in einem deutlich anderen Register als das Ziel.');
    }
    if (wish && wish.trim()) L.push('- Zusätzlicher Wunsch: ' + wish.trim());
    L.push('- Keine "id"-Felder angeben – die App vergibt IDs selbst.');
    L.push('');
    L.push('Antworte ausschließlich mit einem einzigen ```json-Codeblock nach diesem Schema:');
    L.push('```json');
    var ex = JSON.parse(JSON.stringify(EXAMPLES[kind]));
    if (kind === 'grammatik') {
      if (!target.isNew) delete ex.grammatik.topics; else ex.grammatik.topics = [{ id: target.id, title: target.title }];
      ex.grammatik.items.forEach(function (i) { i.topic = target.id; });
    }
    if (kind === 'wortschatz') {
      if (!target.isNew) delete ex.wortschatz.decks; else ex.wortschatz.decks = [{ id: target.id, title: target.title }];
      ex.wortschatz.cards.forEach(function (c) { c.deck = target.id; });
    }
    if (kind === 'schreiben') ex.schreiben.tasks[0].type = target.id;
    L.push(JSON.stringify(ex, null, 2));
    L.push('```');
    return L.join('\n');
  }

  /* ---------- Einlesen & Prüfen ---------- */

  function detect(data) {
    var b = { grammatik: null, wortschatz: null, schreiben: null, fragen: null };
    if (Array.isArray(data)) {
      var f = data[0] || {};
      if (f.typ || f.frage || f.aussage) b.fragen = data;
      else if (f.term || f.meaning) b.wortschatz = { cards: data };
      else if (f.prompt && f.words) b.schreiben = { tasks: data };
      else b.grammatik = { items: data };
      return b;
    }
    if (!data || typeof data !== 'object') return b;
    if (data.grammatik) b.grammatik = data.grammatik;
    if (data.wortschatz) b.wortschatz = data.wortschatz;
    if (data.schreiben) b.schreiben = data.schreiben;
    if (data.fragen) b.fragen = data.fragen;
    if (data.items) b.grammatik = { topics: data.topics, items: data.items };
    if (data.cards) b.wortschatz = { decks: data.decks, cards: data.cards };
    if (data.tasks) b.schreiben = { tasks: data.tasks };
    return b;
  }

  /** Gibt { errors, warnings, plan } zurück; plan enthält die zu speichernden Objekte. */
  function check(raw) {
    var errors = [], warnings = [];
    var block = U.extractJson(raw, null);
    if (!block) return { errors: ['Kein JSON gefunden.'], warnings: [] };
    var data;
    try { data = JSON.parse(block.text); } catch (e) {
      return { errors: ['JSON fehlerhaft: ' + e.message + '. Häufige Ursachen: fehlendes Komma, Komma nach dem letzten Element, typografische Anführungszeichen statt "…".'], warnings: [] };
    }
    var b = detect(data);
    if (!b.grammatik && !b.wortschatz && !b.schreiben && !b.fragen) {
      return { errors: ['Inhaltstyp nicht erkannt. Erwartet wird ein Objekt mit "grammatik", "wortschatz", "schreiben" oder "fragen" (siehe SCHEMAS.md).'], warnings: [] };
    }
    var plan = { topics: [], items: [], decks: [], cards: [], tasks: [], fragen: null };

    // Grammatik
    if (b.grammatik) {
      var gm = APP.modules.grammatik;
      var known = {};
      gm.topics().forEach(function (t) { known[t.id] = true; });
      (b.grammatik.topics || []).forEach(function (t, i) {
        var p = 'grammatik.topics[' + i + ']';
        if (!t || !t.id || !t.title) { errors.push(p + ': "id" und "title" sind Pflicht.'); return; }
        if (!/^[a-z0-9-]+$/.test(t.id)) { errors.push(p + ': "id" darf nur a–z, 0–9 und „-“ enthalten.'); return; }
        if (!known[t.id]) plan.topics.push({ id: t.id, title: String(t.title), description: t.description ? String(t.description) : '' });
        known[t.id] = true;
      });
      var seen = {};
      (b.grammatik.items || []).forEach(function (it, i) {
        var p = 'grammatik.items[' + i + ']' + (it && it.id ? ' (' + it.id + ')' : '');
        var errs = gm.validateItem(it, known);
        if (errs.length) { errors.push(p + ': ' + errs.join('; ') + '.'); return; }
        var id = it.id || rid('g-i-');
        if (seen[id]) { errors.push(p + ': doppelte id im Import.'); return; }
        seen[id] = 1;
        if (gm.getItem(id)) { warnings.push(p + ': id existiert bereits – wird übersprungen.'); return; }
        plan.items.push(Object.assign({ status: 'ungeprüft' }, it, { id: id, source: 'import' }));
      });
      if (!(b.grammatik.items || []).length) errors.push('grammatik.items fehlt oder ist leer.');
    }

    // Wortschatz
    if (b.wortschatz) {
      var wm = APP.modules.wortschatz;
      var knownDecks = {};
      wm.topics().forEach(function (d) { knownDecks[d.id] = true; });
      (b.wortschatz.decks || []).forEach(function (d, i) {
        var p = 'wortschatz.decks[' + i + ']';
        if (!d || !d.id || !d.title) { errors.push(p + ': "id" und "title" sind Pflicht.'); return; }
        if (!knownDecks[d.id]) plan.decks.push({ id: String(d.id), title: String(d.title), description: d.description ? String(d.description) : '' });
        knownDecks[d.id] = true;
      });
      var seenC = {};
      (b.wortschatz.cards || []).forEach(function (c, i) {
        var p = 'wortschatz.cards[' + i + ']' + (c && c.term ? ' („' + c.term + '“)' : '');
        var errs = wm.validateCard(c);
        if (errs.length) { errors.push(p + ': ' + errs.join(' ')); return; }
        var deckId = knownDecks[c.deck] ? c.deck : (slug(c.deck) || 'importiert');
        if (!knownDecks[deckId]) {
          plan.decks.push({ id: deckId, title: c.deck });
          knownDecks[deckId] = true;
          warnings.push('Deck „' + c.deck + '“ ist neu und wird angelegt.');
        }
        if (c.meaning && c.term && c.meaning.toLowerCase().indexOf(c.term.replace(/^(der|die|das)\s+/i, '').toLowerCase()) >= 0) {
          warnings.push(p + ': Die Bedeutung enthält den Begriff selbst – die Produktionskarte verrät dann die Lösung.');
        }
        var id = c.id || rid('w-i-');
        if (seenC[id]) { errors.push(p + ': doppelte id im Import.'); return; }
        seenC[id] = 1;
        if (wm.cardById(id)) { warnings.push(p + ': id existiert bereits – wird übersprungen.'); return; }
        plan.cards.push(Object.assign({ status: 'ungeprüft', register: 'neutral', collocations: [], tags: [] }, c, { id: id, deck: deckId, source: 'import' }));
      });
      if (!(b.wortschatz.cards || []).length) errors.push('wortschatz.cards fehlt oder ist leer.');
    }

    // Schreiben
    if (b.schreiben) {
      var sm = APP.modules.schreiben;
      (b.schreiben.tasks || []).forEach(function (t, i) {
        var p = 'schreiben.tasks[' + i + ']' + (t && t.title ? ' („' + t.title + '“)' : '');
        var errs = sm.validateTask(t);
        if (errs.length) { errors.push(p + ': ' + errs.join('; ') + '.'); return; }
        var id = t.id || rid('t-i-');
        if (sm.taskById(id)) { warnings.push(p + ': id existiert bereits – wird übersprungen.'); return; }
        plan.tasks.push(Object.assign({ status: 'ungeprüft' }, t, { id: id, words: [Number(t.words[0]), Number(t.words[1])], minutes: Number(t.minutes) }));
      });
      if (!(b.schreiben.tasks || []).length) errors.push('schreiben.tasks fehlt oder ist leer.');
    }

    // Fragen (Lesen/Hören)
    if (b.fragen) {
      var res = APP.fragen.validate(b.fragen);
      res.errors.forEach(function (e) { errors.push(e); });
      if (!res.errors.length) plan.fragen = res.questions;
    }
    return { errors: errors, warnings: warnings, plan: plan };
  }

  function apply(plan, fragenTarget) {
    var gm = APP.modules.grammatik;
    plan.topics.forEach(function (t) {
      var c = APP.store.state.content;
      c.grammatik = c.grammatik || {};
      c.grammatik.topics = c.grammatik.topics || [];
      c.grammatik.topics.push(t);
    });
    plan.items.forEach(function (it) { gm.addItem(it); });
    if (plan.decks.length || plan.cards.length) APP.modules.wortschatz.addContent(plan.decks, plan.cards);
    if (plan.tasks.length) APP.modules.schreiben.addTasks(plan.tasks);
    if (plan.fragen && fragenTarget) {
      var p = fragenTarget.split(':');
      var list = p[0] === 'lesen' ? APP.store.state.reading.articles : APP.store.state.listening.entries;
      var target = list.filter(function (x) { return x.id === p[1]; })[0];
      if (target) target.questions = plan.fragen;
    }
    APP.progress.syncSrs();
    APP.store.save();
  }

  /* ---------- Ansicht ---------- */

  APP.registerView('import', function (el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Inhalte importieren'),
      h('p', { class: 'muted' }, 'Lassen Sie Claude neue Grammatikaufgaben, Wortschatzkarten, Schreibaufgaben oder Verständnisfragen erzeugen und fügen Sie das JSON hier ein. Alle Schemas stehen in SCHEMAS.md.')));

    /* --- 1. Prompt erzeugen --- */
    var kindSel = h('select', null,
      h('option', { value: 'grammatik' }, 'Grammatikaufgaben'),
      h('option', { value: 'wortschatz' }, 'Wortschatzkarten'),
      h('option', { value: 'schreiben' }, 'Schreibaufgaben'));
    var targetSel = h('select');
    var newName = h('input', { type: 'text', placeholder: 'Name des neuen Themas', hidden: true });
    var countIn = h('input', { type: 'number', min: 1, max: 50, value: 10 });
    var wishIn = h('input', { type: 'text', placeholder: 'optional, z. B. „Wirtschaftsdeutsch“ oder „Schwerpunkt Ausklammerung“' });
    var promptBox = h('textarea', { class: 'answer-input prompt-box', rows: 8, readonly: true });

    function fillTargets() {
      U.clear(targetSel);
      var k = kindSel.value;
      var list = k === 'grammatik' ? APP.modules.grammatik.topics() : k === 'wortschatz' ? APP.modules.wortschatz.topics() : APP.modules.schreiben.topics();
      list.forEach(function (t) { targetSel.appendChild(h('option', { value: t.id }, t.title)); });
      if (k !== 'schreiben') targetSel.appendChild(h('option', { value: '__new' }, k === 'grammatik' ? '+ Neues Thema …' : '+ Neues Deck …'));
      newName.placeholder = k === 'grammatik' ? 'Name des neuen Themas' : 'Name des neuen Decks';
      countIn.value = k === 'schreiben' ? 3 : k === 'wortschatz' ? 20 : 10;
      updatePrompt();
    }
    function target() {
      if (targetSel.value === '__new') {
        var name = newName.value.trim() || 'Neues Thema';
        return { id: slug(name) || 'neu', title: name, isNew: true };
      }
      var opt = targetSel.options[targetSel.selectedIndex];
      return { id: targetSel.value, title: opt ? opt.textContent : targetSel.value, isNew: false };
    }
    function updatePrompt() {
      newName.hidden = targetSel.value !== '__new';
      promptBox.value = buildGenPrompt(kindSel.value, target(), Math.max(1, Math.min(50, Number(countIn.value) || 10)), wishIn.value);
    }
    kindSel.addEventListener('change', fillTargets);
    [targetSel, newName, countIn, wishIn].forEach(function (x) { x.addEventListener('input', updatePrompt); x.addEventListener('change', updatePrompt); });

    function field(label, control) { return h('label', { class: 'form-field' }, h('span', { class: 'form-label' }, label), control); }
    el.appendChild(h('section', { class: 'card form' },
      h('h2', null, '1. Prompt für Claude'),
      h('div', { class: 'form-row' }, field('Inhalt', kindSel), field('Thema / Deck / Textsorte', h('span', { class: 'stack' }, targetSel, newName))),
      h('div', { class: 'form-row' }, field('Anzahl', countIn), field('Wunsch', wishIn)),
      promptBox,
      h('div', { class: 'actions' }, h('button', {
        type: 'button', class: 'btn primary', onclick: function () {
          U.copyText(promptBox.value).then(function (ok) {
            if (ok) U.toast('Prompt kopiert.');
            else { promptBox.select(); U.toast('Bitte manuell kopieren (Strg/Cmd + C).'); }
          });
        }
      }, 'Prompt kopieren')),
      h('p', { class: 'muted small' }, 'Verständnisfragen zu einem Artikel oder Hörtext fordern Sie am besten direkt dort an („Fragen bei Claude anfordern“); hier können Sie solches JSON aber ebenfalls einfügen.')));
    fillTargets();

    /* --- 2. JSON einfügen --- */
    var input = h('textarea', { class: 'answer-input', rows: 10, placeholder: 'JSON (oder die ganze Antwort von Claude mit ```json-Block) hier einfügen …', 'aria-label': 'Import-JSON' });
    var file = h('input', { type: 'file', accept: '.json,application/json,text/plain' });
    file.addEventListener('change', function () {
      var f = file.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { input.value = String(r.result); runCheck(); };
      r.readAsText(f);
    });
    var out = h('div', { 'aria-live': 'polite' });

    function runCheck() {
      U.clear(out);
      var res = check(input.value);
      if (res.errors.length) {
        out.appendChild(h('div', { class: 'notice bad' },
          h('strong', null, res.errors.length + (res.errors.length === 1 ? ' Fehler' : ' Fehler') + ' – nichts importiert:'),
          h('ul', null, res.errors.slice(0, 30).map(function (e) { return h('li', null, e); })),
          res.errors.length > 30 ? h('p', null, '… und ' + (res.errors.length - 30) + ' weitere.') : null));
        return;
      }
      var p = res.plan;
      var lines = [];
      if (p.topics.length) lines.push(p.topics.length + ' neue Grammatikthemen: ' + p.topics.map(function (t) { return t.title; }).join(', '));
      if (p.items.length) lines.push(p.items.length + ' Grammatikaufgaben');
      if (p.decks.length) lines.push(p.decks.length + ' neue Decks: ' + p.decks.map(function (d) { return d.title; }).join(', '));
      if (p.cards.length) lines.push(p.cards.length + ' Wortschatzkarten');
      if (p.tasks.length) lines.push(p.tasks.length + ' Schreibaufgaben');
      if (p.fragen) lines.push(p.fragen.length + ' Verständnisfragen');

      var targetSel2 = null;
      if (p.fragen) {
        var opts = [];
        (APP.store.state.reading.articles || []).forEach(function (a) { opts.push(h('option', { value: 'lesen:' + a.id }, 'Lesen: ' + a.title)); });
        (APP.store.state.listening.entries || []).forEach(function (e) { opts.push(h('option', { value: 'hoeren:' + e.id }, 'Hören: ' + e.title)); });
        targetSel2 = h('select', null, opts);
        if (!opts.length) {
          out.appendChild(h('div', { class: 'notice bad' }, 'Für Verständnisfragen brauchen Sie zuerst einen Artikel (Lesen) oder Hörtext (Hören).'));
          return;
        }
      }
      var nothing = !lines.length;
      out.appendChild(h('div', { class: 'notice ok' },
        h('strong', null, nothing ? 'Gültig, aber nichts Neues zu importieren.' : 'Gültig. Wird importiert:'),
        h('ul', null, lines.map(function (l) { return h('li', null, l); })),
        res.warnings.length ? h('details', null, h('summary', null, res.warnings.length + ' Hinweise'), h('ul', { class: 'small' }, res.warnings.map(function (w) { return h('li', null, w); }))) : null,
        targetSel2 ? h('label', { class: 'form-field' }, h('span', { class: 'form-label' }, 'Fragen zuordnen zu (ersetzt vorhandene Fragen)'), targetSel2) : null,
        nothing ? null : h('div', { class: 'actions' }, h('button', {
          type: 'button', class: 'btn primary', onclick: function () {
            apply(p, targetSel2 && targetSel2.value);
            U.toast('Import abgeschlossen.');
            U.clear(out).appendChild(h('div', { class: 'notice ok' }, 'Importiert: ' + lines.join(' · ') + '. Neue Inhalte sind als „ungeprüft“ markiert.'));
            input.value = '';
          }
        }, 'Importieren'))));
    }

    el.appendChild(h('section', { class: 'card' },
      h('h2', null, '2. JSON einfügen und prüfen'),
      input,
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn primary', onclick: runCheck }, 'Prüfen'),
        h('label', { class: 'file-label small muted' }, 'oder Datei: ', file)),
      out));
  });

  APP.importer = { check: check, apply: apply, buildGenPrompt: buildGenPrompt };
})(window.APP);
