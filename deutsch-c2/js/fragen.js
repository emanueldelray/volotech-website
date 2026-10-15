/* Verständnisfragen: Claude-Prompt, JSON-Prüfung und Fragen-Durchlauf (für Lesen und Hören) */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;

  var SCHEMA_ID = 'deutsch-c2-fragen-1';
  var TYPE_LABEL = { mc: 'Multiple Choice', richtigfalsch: 'Richtig / Falsch / Nicht im Text', offen: 'Offene Frage' };
  var RF = ['richtig', 'falsch', 'nicht im Text'];

  /* ---------- Prompt ---------- */

  function buildPrompt(opts) {
    var isAudio = opts.kind === 'hoeren';
    var lines = [];
    lines.push('Du bist Aufgabenautor für das Goethe-Zertifikat C2: Großes Deutsches Sprachdiplom (Modul ' + (isAudio ? 'Hören' : 'Lesen') + ').');
    lines.push('Erstelle anspruchsvolle Verständnisfragen auf C2-Niveau zum folgenden ' + (isAudio ? 'Hörtext (Transkript). Die Fragen müssen beim Hören beantwortbar sein, ohne das Transkript zu sehen.' : 'Text.'));
    lines.push('');
    lines.push('Titel: ' + opts.title + (opts.source ? ' (Quelle: ' + opts.source + ')' : ''));
    lines.push('"""');
    lines.push(opts.text);
    lines.push('"""');
    lines.push('');
    lines.push('Anforderungen:');
    lines.push('- 4 Multiple-Choice-Fragen ("mc") mit je 4 Optionen, genau eine richtig; plausible Distraktoren, die nahe am Wortlaut des Textes liegen. Prüfe Details, Implikationen, Haltung und Absicht des Autors.');
    lines.push('- 4 Aussagen "richtigfalsch" mit der Lösung "richtig", "falsch" oder "nicht im Text"; mindestens eine von jeder Sorte.');
    lines.push('- 2 offene Fragen ("offen") zum Globalverständnis, zur Argumentationsstruktur oder zur Wirkung sprachlicher Mittel, jeweils mit einer knappen Musterantwort.');
    lines.push('- Formuliere die Fragen mit eigenen Worten (Paraphrasen), nicht durch wörtliches Abschreiben.');
    lines.push('- "beleg" ist ein wörtliches Kurzzitat aus dem Text, das die Lösung stützt; "erklaerung" begründet die Lösung in ein bis zwei Sätzen.');
    lines.push('');
    lines.push('Antworte ausschließlich mit einem einzigen ```json-Codeblock nach diesem Schema (keine weiteren Erläuterungen):');
    lines.push('```json');
    lines.push(JSON.stringify({
      schema: SCHEMA_ID,
      fragen: [
        { typ: 'mc', frage: 'Frage', optionen: ['A', 'B', 'C', 'D'], loesung: 2, erklaerung: 'Begründung', beleg: 'Zitat' },
        { typ: 'richtigfalsch', aussage: 'Aussage über den Text', loesung: 'nicht im Text', erklaerung: 'Begründung', beleg: 'Zitat' },
        { typ: 'offen', frage: 'Frage', musterantwort: 'Kurze Musterantwort', erklaerung: 'Worauf es ankommt' }
      ]
    }, null, 2));
    lines.push('```');
    lines.push('"loesung" ist bei "mc" der Index der richtigen Option (ab 0).');
    return lines.join('\n');
  }

  /* ---------- Prüfen ---------- */

  function normType(t) {
    var x = String(t || '').toLowerCase().replace(/[\s_\-\/]/g, '');
    if (x === 'mc' || x.indexOf('multiple') === 0 || x === 'auswahl') return 'mc';
    if (x === 'rf' || x === 'richtigfalsch' || x.indexOf('richtigfalsch') === 0 || x === 'rfn') return 'richtigfalsch';
    if (x === 'offen' || x === 'open' || x === 'offenefrage') return 'offen';
    return null;
  }

  function normRF(v) {
    var x = String(v || '').toLowerCase().trim();
    if (x === 'richtig' || x === 'r' || x === 'true') return 'richtig';
    if (x === 'falsch' || x === 'f' || x === 'false') return 'falsch';
    if (/nicht/.test(x) || x === 'ni' || x === 'n') return 'nicht im Text';
    return null;
  }

  /** Validiert eine Liste von Fragen. Gibt { questions, errors } zurück. */
  function validate(list, prefix) {
    prefix = prefix || 'fragen';
    var errors = [], out = [];
    if (!Array.isArray(list) || !list.length) return { errors: ['"' + prefix + '" fehlt oder ist leer.'], questions: [] };
    list.forEach(function (q, i) {
      var p = prefix + '[' + i + ']';
      if (!q || typeof q !== 'object') { errors.push(p + ': kein Objekt.'); return; }
      var typ = normType(q.typ || q.type);
      if (!typ) { errors.push(p + ': unbekannter "typ" „' + (q.typ || q.type) + '“ (erlaubt: mc, richtigfalsch, offen).'); return; }
      var r = { typ: typ, erklaerung: q.erklaerung ? String(q.erklaerung) : '', beleg: q.beleg ? String(q.beleg) : '' };
      if (typ === 'mc') {
        if (!q.frage) errors.push(p + ': "frage" fehlt.');
        if (!Array.isArray(q.optionen) || q.optionen.length < 2) { errors.push(p + ': "optionen" braucht mindestens 2 Einträge.'); return; }
        var sol = q.loesung;
        if (typeof sol === 'string') {
          if (/^[A-Ha-h]$/.test(sol)) sol = sol.toUpperCase().charCodeAt(0) - 65;
          else if (/^\d+$/.test(sol)) sol = Number(sol);
          else sol = q.optionen.indexOf(sol);
        }
        if (typeof sol !== 'number' || sol < 0 || sol >= q.optionen.length || sol % 1) errors.push(p + ': "loesung" muss der Index einer Option sein (0–' + (q.optionen.length - 1) + ').');
        r.frage = String(q.frage || ''); r.optionen = q.optionen.map(String); r.loesung = sol;
      } else if (typ === 'richtigfalsch') {
        if (!q.aussage) errors.push(p + ': "aussage" fehlt.');
        var v = normRF(q.loesung);
        if (!v) errors.push(p + ': "loesung" muss „richtig“, „falsch“ oder „nicht im Text“ sein.');
        r.aussage = String(q.aussage || ''); r.loesung = v;
      } else {
        if (!q.frage) errors.push(p + ': "frage" fehlt.');
        if (!q.musterantwort) errors.push(p + ': "musterantwort" fehlt.');
        r.frage = String(q.frage || ''); r.musterantwort = String(q.musterantwort || '');
      }
      out.push(r);
    });
    return { errors: errors, questions: out };
  }

  /** Antwort von Claude (Text mit JSON-Block oder reines JSON) → { questions } | { errors } */
  function parse(raw) {
    var block = U.extractJson(raw, ['fragen']);
    if (!block) return { errors: ['Kein JSON gefunden. Fügen Sie die Antwort von Claude mit dem ```json-Block ein.'] };
    var data;
    try { data = JSON.parse(block.text); } catch (e) { return { errors: ['JSON fehlerhaft: ' + e.message] }; }
    var list = Array.isArray(data) ? data : data && data.fragen;
    var res = validate(list);
    return res.errors.length ? { errors: res.errors } : { questions: res.questions };
  }

  /* ---------- Durchlauf ---------- */

  /**
   * Fragen nacheinander stellen.
   * opts.onAnswer(question, score 0..1), opts.onDone({ score, total })
   */
  function run(el, questions, opts) {
    var idx = 0, sum = 0;
    var counter = h('div', { class: 'counter muted small' });
    var stage = h('div');
    U.clear(el);
    el.appendChild(counter);
    el.appendChild(stage);

    function next() {
      if (idx >= questions.length) return done();
      counter.textContent = 'Frage ' + (idx + 1) + ' von ' + questions.length;
      ask(questions[idx], function (score) {
        sum += score;
        if (opts.onAnswer) opts.onAnswer(questions[idx], score);
        idx++;
        next();
      });
    }

    function done() {
      counter.textContent = '';
      U.clear(stage);
      var pct = Math.round(sum / questions.length * 100);
      var card = h('section', { class: 'card' },
        h('h2', null, 'Fragen beendet'),
        h('p', { class: 'big-number' }, String(sum).replace('.', ',') + ' / ' + questions.length, h('span', { class: 'muted small' }, ' Punkte (' + pct + ' %)')));
      if (opts.actions) card.appendChild(opts.actions);
      stage.appendChild(card);
      if (opts.onDone) opts.onDone({ score: sum, total: questions.length });
    }

    function ask(q, finish) {
      U.clear(stage);
      var card = h('article', { class: 'card exercise' });
      stage.appendChild(card);
      card.appendChild(h('div', { class: 'ex-head' }, h('span', { class: 'chip' }, TYPE_LABEL[q.typ])));
      var feedback = h('div', { class: 'feedback', 'aria-live': 'polite' });
      var actions = h('div', { class: 'actions' });
      var answered = false;

      function explain(ok, extra) {
        U.clear(feedback);
        feedback.className = 'feedback is-open' + (ok === true ? ' is-ok' : ok === false ? ' is-bad' : '');
        if (ok !== null) feedback.appendChild(h('p', { class: 'verdict' }, ok ? 'Richtig.' : 'Leider falsch.'));
        if (extra) feedback.appendChild(extra);
        if (q.erklaerung) feedback.appendChild(h('p', { class: 'explanation' }, q.erklaerung));
        if (q.beleg) feedback.appendChild(h('p', { class: 'fc-example small' }, '„' + q.beleg + '“'));
      }
      function nextBtn(score) {
        var b = h('button', { type: 'button', class: 'btn primary', onclick: function () { finish(score); } }, 'Weiter');
        feedback.appendChild(h('div', { class: 'actions' }, b));
        setTimeout(function () { b.focus(); }, 30);
      }

      if (q.typ === 'mc' || q.typ === 'richtigfalsch') {
        var opts2 = q.typ === 'mc' ? q.optionen : RF;
        var correctIdx = q.typ === 'mc' ? q.loesung : RF.indexOf(q.loesung);
        card.appendChild(h('p', { class: 'ex-text' }, q.typ === 'mc' ? q.frage : q.aussage));
        var list = h('div', { class: 'mc-list' + (q.typ === 'richtigfalsch' ? ' rf' : '') });
        var buttons = opts2.map(function (o, i) {
          var b = h('button', {
            type: 'button', class: 'mc-option', onclick: function () {
              if (answered) return;
              answered = true;
              buttons.forEach(function (x, j) {
                x.disabled = true;
                if (j === correctIdx) x.classList.add('is-correct');
                else if (j === i) x.classList.add('is-wrong');
              });
              explain(i === correctIdx);
              nextBtn(i === correctIdx ? 1 : 0);
            }
          }, q.typ === 'mc' ? h('span', { class: 'mc-key' }, String.fromCharCode(65 + i)) : null, h('span', null, o));
          list.appendChild(b);
          return b;
        });
        card.appendChild(list);
      } else {
        card.appendChild(h('p', { class: 'ex-text' }, q.frage));
        var ta = h('textarea', { class: 'answer-input', rows: 4, placeholder: 'Ihre Antwort …', 'aria-label': 'Ihre Antwort' });
        card.appendChild(ta);
        actions.appendChild(h('button', {
          type: 'button', class: 'btn primary', onclick: function () {
            if (answered) return;
            answered = true;
            ta.disabled = true;
            U.clear(actions);
            explain(null, h('div', { class: 'solutions' }, h('div', { class: 'label' }, 'Musterantwort'), h('p', null, q.musterantwort)));
            feedback.appendChild(h('p', { class: 'small muted' }, 'Wie gut war Ihre Antwort?'));
            feedback.appendChild(h('div', { class: 'actions' },
              h('button', { type: 'button', class: 'btn ok', onclick: function () { finish(1); } }, 'Richtig'),
              h('button', { type: 'button', class: 'btn', onclick: function () { finish(0.5); } }, 'Teilweise'),
              h('button', { type: 'button', class: 'btn bad', onclick: function () { finish(0); } }, 'Falsch')));
          }
        }, 'Musterantwort zeigen'));
        setTimeout(function () { ta.focus(); }, 30);
      }
      card.appendChild(actions);
      card.appendChild(feedback);
    }

    next();
  }

  /**
   * Baustein „Fragen bei Claude anfordern“: Prompt kopieren + JSON einfügen.
   * opts: { promptOpts, hasQuestions, onSaved(questions) }
   */
  function bridge(opts) {
    var prompt = buildPrompt(opts.promptOpts);
    var promptBox = h('textarea', { class: 'answer-input prompt-box', rows: 6, readonly: true });
    promptBox.value = prompt;
    var details = h('details', { class: 'prompt-details' }, h('summary', null, 'Prompt anzeigen'), promptBox);
    var paste = h('textarea', { class: 'answer-input', rows: 5, placeholder: 'JSON-Antwort von Claude hier einfügen …', 'aria-label': 'Fragen-JSON' });
    var msg = h('div', { 'aria-live': 'polite' });
    return h('div', { class: 'bridge' },
      h('div', { class: 'actions' },
        h('button', {
          type: 'button', class: 'btn' + (opts.hasQuestions ? ' ghost' : ' primary'), onclick: function () {
            U.copyText(prompt).then(function (ok) {
              if (ok) U.toast('Prompt kopiert – jetzt in Claude einfügen.');
              else { details.open = true; promptBox.select(); U.toast('Bitte manuell kopieren (Strg/Cmd + C).'); }
            });
          }
        }, 'Fragen bei Claude anfordern')),
      details,
      h('p', { class: 'muted small' }, 'Den Prompt in einem Claude-Chat einfügen, dann die Antwort (JSON) hier einfügen.' + (opts.hasQuestions ? ' Neue Fragen ersetzen die bisherigen.' : '')),
      paste,
      msg,
      h('div', { class: 'actions' }, h('button', {
        type: 'button', class: 'btn', onclick: function () {
          U.clear(msg);
          var res = parse(paste.value);
          if (res.errors) {
            msg.appendChild(h('div', { class: 'notice bad' }, h('strong', null, 'Fragen konnten nicht übernommen werden:'),
              h('ul', null, res.errors.slice(0, 12).map(function (e) { return h('li', null, e); }))));
            return;
          }
          opts.onSaved(res.questions);
        }
      }, 'Fragen übernehmen')));
  }

  APP.fragen = {
    SCHEMA_ID: SCHEMA_ID, TYPE_LABEL: TYPE_LABEL,
    buildPrompt: buildPrompt, parse: parse, validate: validate, run: run, bridge: bridge
  };
})(window.APP);
