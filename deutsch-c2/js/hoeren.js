/* Modul 5: Hören – Player, Diktat, Lückentext aus dem Transkript, Verständnisfragen über Claude */
(function (APP) {
  'use strict';
  var U = APP.util, h = U.h;
  var ID = 'hoeren';

  var TOPICS = [
    { id: 'diktat', title: 'Diktat', description: 'Abschnitte Wort für Wort mitschreiben.' },
    { id: 'luecken', title: 'Lückentext', description: 'Fehlende Wörter beim Hören ergänzen.' },
    { id: 'fragen', title: 'Verständnisfragen', description: 'C2-Fragen von Claude zum Hörtext.' }
  ];
  var SPEEDS = [0.75, 1, 1.25];
  var STOP = ('aber alle allem allen aller alles also auch auf aus bei beim bin bis bist dabei damit dann darf darum das dass davon dazu dem den denen denn der des deshalb dessen die dies diese diesem diesen dieser dieses doch dort durch eben ein eine einem einen einer eines einfach etwa etwas euch für gegen gibt habe haben hatte hatten hier hin hinter ich ihm ihn ihnen ihr ihre ihrem ihren ihrer immer indem ins ist jede jedem jeden jeder jedes jetzt kann kein keine keinen können könnte machen man manche mehr mein meine mich mir mit muss müssen nach nicht nichts noch nun nur ob oder ohne schon sehr sein seine seinem seinen seiner seit sich sie sind so solche soll sollen sondern sonst über um und uns unser unter viel vom von vor wann war waren warum was weil welche welchem welchen welcher wenn wer werde werden wie wieder will wir wird wo wollen worden wurde wurden zum zur zwar zwischen').split(' ');
  var stopSet = {};
  STOP.forEach(function (w) { stopSet[w] = 1; });

  function S() { return APP.store.state; }
  function L() {
    var l = S().listening || (S().listening = {});
    l.entries = l.entries || [];
    return l;
  }
  function entryById(id) { return L().entries.filter(function (e) { return e.id === id; })[0] || null; }

  /* ---------- Audio-Dateien in IndexedDB ---------- */

  var dbPromise = null;
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('IndexedDB nicht verfügbar')); return; }
      var req = indexedDB.open('deutschC2', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('audio'); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }
  function idb(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction('audio', mode);
        var req = fn(tx.objectStore('audio'));
        tx.oncomplete = function () { resolve(req && req.result); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  function putAudio(id, blob) { return idb('readwrite', function (s) { return s.put(blob, id); }); }
  function getAudio(id) { return idb('readonly', function (s) { return s.get(id); }).catch(function () { return null; }); }
  function delAudio(id) { return idb('readwrite', function (s) { return s.delete(id); }).catch(function () {}); }

  // Nur für diese Sitzung, falls IndexedDB nicht klappt
  var sessionFiles = {};

  /* ---------- Transkript in Abschnitte teilen ---------- */

  /** Sätze zu Abschnitten mit min..max Wörtern bündeln: [{ text, start, end }] */
  function chunks(text, minW, maxW) {
    var out = [], cur = null;
    U.sentences(text).forEach(function (s) {
      var n = U.wordCount(s.text);
      if (cur && U.wordCount(cur.text) >= minW) { out.push(cur); cur = null; }
      if (cur && U.wordCount(cur.text) + n > maxW) { out.push(cur); cur = null; }
      if (!cur) cur = { start: s.start, end: s.end, text: s.text };
      else { cur.end = s.end; cur.text = text.slice(cur.start, cur.end); }
    });
    if (cur) {
      if (out.length && U.wordCount(cur.text) < minW / 2) {
        var last = out[out.length - 1];
        last.end = cur.end; last.text = text.slice(last.start, last.end);
      } else out.push(cur);
    }
    return out;
  }

  /** Geschätzter Zeitbereich eines Abschnitts (proportional zur Textposition) */
  function estimateRange(entry, kind, idx, chunk, duration) {
    var saved = entry.segments && entry.segments[kind + idx];
    if (saved) return { start: saved.start, end: saved.end, adjusted: true };
    var total = entry.transcript.length;
    return {
      start: Math.max(0, chunk.start / total * duration - 1.5),
      end: Math.min(duration, chunk.end / total * duration + 1.5),
      adjusted: false
    };
  }

  /* ---------- Player ---------- */

  function fmtTime(t) {
    if (!isFinite(t)) return '–';
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /** Player mit Geschwindigkeit, 5-s-Rücksprung und Bereichswiedergabe */
  function makePlayer(entry) {
    var audio = h('audio', { controls: true, preload: 'metadata' });
    var status = h('p', { class: 'muted small' });
    var rangeEnd = null;
    var rate = S().settings.audioRate || 1;

    function setSource() {
      if (entry.url) { audio.src = entry.url; return; }
      if (sessionFiles[entry.id]) { audio.src = URL.createObjectURL(sessionFiles[entry.id]); return; }
      getAudio(entry.id).then(function (blob) {
        if (blob) audio.src = URL.createObjectURL(blob);
        else {
          status.textContent = 'Audiodatei nicht gefunden (lokale Dateien werden nicht mit exportiert). Bitte Datei erneut wählen:';
          var input = h('input', { type: 'file', accept: 'audio/*' });
          input.addEventListener('change', function () {
            var f = input.files[0];
            if (!f) return;
            sessionFiles[entry.id] = f;
            putAudio(entry.id, f).catch(function () {});
            entry.fileName = f.name;
            APP.store.save();
            audio.src = URL.createObjectURL(f);
            status.textContent = '';
          });
          status.appendChild(input);
        }
      });
    }
    setSource();
    audio.addEventListener('loadedmetadata', function () { audio.playbackRate = rate; if (api.onReady) api.onReady(audio.duration); });
    audio.addEventListener('error', function () {
      if (entry.url) status.textContent = 'Audio konnte nicht geladen werden. Ist die URL eine direkte Audiodatei (z. B. .mp3)?';
    });
    audio.addEventListener('timeupdate', function () {
      if (rangeEnd !== null && audio.currentTime >= rangeEnd) { audio.pause(); rangeEnd = null; }
    });
    window.addEventListener('hashchange', function stop() { audio.pause(); window.removeEventListener('hashchange', stop); });

    var speedBtns = SPEEDS.map(function (s) {
      return h('button', {
        type: 'button', class: 'btn small' + (s === rate ? ' primary' : ''), 'aria-pressed': s === rate ? 'true' : 'false',
        onclick: function () {
          rate = s;
          audio.playbackRate = s;
          S().settings.audioRate = s;
          APP.store.save();
          speedBtns.forEach(function (b, i) {
            b.className = 'btn small' + (SPEEDS[i] === s ? ' primary' : '');
            b.setAttribute('aria-pressed', SPEEDS[i] === s ? 'true' : 'false');
          });
        }
      }, String(s).replace('.', ',') + '×');
    });

    var el = h('div', { class: 'card player' },
      audio,
      h('div', { class: 'player-controls' },
        h('button', { type: 'button', class: 'btn small', onclick: function () { audio.currentTime = Math.max(0, audio.currentTime - 5); } }, '↺ 5 s'),
        h('button', { type: 'button', class: 'btn small', onclick: function () { rangeEnd = null; audio.paused ? audio.play() : audio.pause(); } }, '⏯'),
        h('span', { class: 'speed-group', role: 'group', 'aria-label': 'Geschwindigkeit' }, speedBtns)),
      status);

    var api = {
      el: el, audio: audio,
      playRange: function (start, end) {
        audio.currentTime = start;
        rangeEnd = end;
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
      }
    };
    return api;
  }

  /** Steuerung für einen Abschnitt: abspielen + Start/Ende anpassen (wird gespeichert) */
  function segmentControls(entry, player, kind, idx, chunk) {
    var range = null;
    var info = h('span', { class: 'muted small' }, 'Lade Audio …');
    var box = h('div', { class: 'segment' },
      h('button', { type: 'button', class: 'btn primary', onclick: function () { if (range) player.playRange(range.start, range.end); } }, '▶ Abschnitt abspielen'),
      info,
      h('div', { class: 'segment-adjust small' },
        'Anfang ', adj('start', -1, '−1 s'), adj('start', 1, '+1 s'),
        ' · Ende ', adj('end', -1, '−1 s'), adj('end', 1, '+1 s')));

    function adj(which, delta, label) {
      return h('button', {
        type: 'button', class: 'btn small ghost', onclick: function () {
          if (!range) return;
          range[which] = Math.max(0, range[which] + delta);
          if (range.end <= range.start + 1) range.end = range.start + 1;
          entry.segments = entry.segments || {};
          entry.segments[kind + idx] = { start: range.start, end: range.end };
          APP.store.save();
          update();
          if (which === 'start') player.playRange(range.start, Math.min(range.end, range.start + 4));
          else player.playRange(Math.max(range.start, range.end - 4), range.end);
        }
      }, label);
    }
    function update() {
      info.textContent = fmtTime(range.start) + '–' + fmtTime(range.end) + (range.adjusted || (entry.segments && entry.segments[kind + idx]) ? ' (angepasst)' : ' (geschätzt – bei Bedarf anpassen)');
    }
    function ready(duration) {
      if (!isFinite(duration) || !duration) { info.textContent = 'Länge unbekannt – bitte manuell im Player abspielen.'; return; }
      range = estimateRange(entry, kind, idx, chunk, duration);
      update();
    }
    if (player.audio.readyState >= 1) ready(player.audio.duration);
    player.onReady = ready;
    return box;
  }

  /* ---------- Diktat-Vergleich ---------- */

  function tokens(s) {
    return String(s).split(/\s+/).map(function (w) { return w.replace(/^[^0-9A-Za-zÄÖÜäöüßÀ-ÿ]+|[^0-9A-Za-zÄÖÜäöüßÀ-ÿ]+$/g, ''); }).filter(Boolean);
  }

  /** Wortweiser Vergleich (LCS). Gibt { ops: [{t:'ok'|'miss'|'extra', w}], score } */
  function diffWords(ref, hyp) {
    var a = tokens(ref), b = tokens(hyp);
    var n = a.length, m = b.length, i, j;
    var dp = [];
    for (i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
    var ops = [];
    i = 0; j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { ops.push({ t: 'ok', w: a[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'miss', w: a[i], got: null }); i++; }
      else { ops.push({ t: 'extra', w: b[j] }); j++; }
    }
    while (i < n) ops.push({ t: 'miss', w: a[i++] });
    while (j < m) ops.push({ t: 'extra', w: b[j++] });
    var ok = dp[0][0];
    return { ops: ops, correct: ok, total: n, score: n ? ok / Math.max(n, m) : 0 };
  }

  /* ---------- Lückentext ---------- */

  function makeGaps(text) {
    var words = text.split(/(\s+)/);
    var cands = [];
    words.forEach(function (tok, i) {
      if (/^\s+$/.test(tok)) return;
      var core = tok.replace(/^[^0-9A-Za-zÄÖÜäöüßÀ-ÿ]+|[^0-9A-Za-zÄÖÜäöüßÀ-ÿ]+$/g, '');
      if (core.length >= 5 && !stopSet[core.toLowerCase()] && !/\d/.test(core)) cands.push(i);
    });
    var wordCount = U.wordCount(text);
    var want = Math.min(8, Math.max(3, Math.round(wordCount / 9)));
    var step = cands.length / want;
    var picked = {};
    for (var k = 0; k < want && k * step < cands.length; k++) picked[cands[Math.floor(k * step + step / 2)] || cands[Math.floor(k * step)]] = 1;
    return { parts: words, gaps: picked };
  }

  /* ---------- Ansichten ---------- */

  function renderOverview(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('h1', null, 'Hören'),
      h('p', { class: 'muted' }, 'Hörtexte mit Audio (URL oder Datei) und Transkript. Üben Sie mit Diktat, Lückentext und Verständnisfragen von Claude.')));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);
    var topics = h('section', { class: 'card topic-list' });
    TOPICS.forEach(function (t) { topics.appendChild(APP.ui.masteryRow(ID, t)); });
    el.appendChild(topics);
    el.appendChild(h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/hoeren/neu' }, '+ Neuer Hörtext')));
    var list = h('section', { class: 'card text-list' });
    var entries = L().entries.slice().reverse();
    if (!entries.length) list.appendChild(h('p', { class: 'muted' }, 'Noch keine Hörtexte. Gut geeignet: Podcasts und Radiobeiträge (z. B. Deutschlandfunk, SWR2 Wissen) mit Manuskript.'));
    entries.forEach(function (e) {
      list.appendChild(h('a', { class: 'text-row', href: '#/hoeren/eintrag/' + encodeURIComponent(e.id) },
        h('div', null,
          h('div', { class: 'topic-title' }, e.title),
          h('div', { class: 'muted small' }, (e.source ? e.source + ' · ' : '') + (e.url ? 'Audio-URL' : 'Datei: ' + (e.fileName || '–')) + ' · ' + U.wordCount(e.transcript) + ' Wörter')),
        e.questions ? h('span', { class: 'chip chip-work' }, e.questions.length + ' Fragen') : null));
    });
    el.appendChild(list);
  }

  function renderNew(el) {
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: '#/hoeren', class: 'back' }, '← Hören'),
      h('h1', null, 'Neuer Hörtext')));
    function field(label, control, hint) { return h('label', { class: 'form-field' }, h('span', { class: 'form-label' }, label), control, hint ? h('span', { class: 'muted small' }, hint) : null); }
    var fTitle = h('input', { type: 'text' });
    var fSource = h('input', { type: 'text', placeholder: 'z. B. Deutschlandfunk, Hintergrund' });
    var fUrl = h('input', { type: 'url', placeholder: 'https://…/beitrag.mp3' });
    var fFile = h('input', { type: 'file', accept: 'audio/*' });
    var fText = h('textarea', { rows: 12, placeholder: 'Transkript hier einfügen …' });
    var msg = h('div', { 'aria-live': 'polite' });
    el.appendChild(h('form', {
      class: 'card form', onsubmit: function (ev) {
        ev.preventDefault();
        var errs = [];
        var file = fFile.files[0];
        if (!fTitle.value.trim()) errs.push('Titel fehlt.');
        if (!fUrl.value.trim() && !file) errs.push('Bitte eine Audio-URL angeben oder eine Datei wählen.');
        if (U.wordCount(fText.value) < 20) errs.push('Bitte das Transkript einfügen (mind. 20 Wörter).');
        if (errs.length) { U.clear(msg).appendChild(h('div', { class: 'notice bad' }, errs.join(' '))); return; }
        var e = {
          id: 'h-' + Date.now().toString(36), title: fTitle.value.trim(), source: fSource.value.trim(),
          url: file ? '' : fUrl.value.trim(), fileName: file ? file.name : '', transcript: fText.value.trim(),
          createdAt: Date.now(), segments: {}, questions: null, runs: [], pos: { diktat: 0, luecken: 0 }
        };
        function finish() {
          L().entries.push(e);
          APP.store.save();
          APP.navigate('#/hoeren/eintrag/' + encodeURIComponent(e.id));
        }
        if (file) {
          sessionFiles[e.id] = file;
          putAudio(e.id, file).then(finish, function () {
            U.toast('Datei konnte nicht dauerhaft gespeichert werden – sie gilt nur für diese Sitzung.');
            finish();
          });
        } else finish();
      }
    },
      field('Titel *', fTitle),
      field('Quelle', fSource),
      field('Audio-URL', fUrl, 'Direkter Link auf eine Audiodatei (mp3, m4a, ogg …).'),
      field('… oder lokale Audiodatei', fFile, 'Wird im Browser gespeichert (IndexedDB), aber nicht in die JSON-Sicherung exportiert.'),
      field('Transkript *', fText),
      msg,
      h('div', { class: 'actions' }, h('button', { type: 'submit', class: 'btn primary' }, 'Speichern'))));
  }

  function header(el, e, sub) {
    el.appendChild(h('header', { class: 'page-head' },
      h('a', { href: sub ? '#/hoeren/eintrag/' + encodeURIComponent(e.id) : '#/hoeren', class: 'back' }, sub ? '← ' + e.title : '← Hören'),
      h('h1', null, sub || e.title),
      !sub && e.source ? h('p', { class: 'muted small' }, e.source) : null));
    var notice = APP.focusNotice(ID);
    if (notice) el.appendChild(notice);
  }

  function renderEntry(el, id) {
    var e = entryById(id);
    if (!e) { el.appendChild(h('section', { class: 'card' }, h('p', null, 'Hörtext nicht gefunden.'), h('a', { href: '#/hoeren' }, 'Zurück'))); return; }
    header(el, e);
    var player = makePlayer(e);
    el.appendChild(player.el);
    el.appendChild(h('div', { class: 'actions' },
      h('a', { class: 'btn primary', href: '#/hoeren/eintrag/' + encodeURIComponent(e.id) + '/diktat' }, 'Diktat'),
      h('a', { class: 'btn primary', href: '#/hoeren/eintrag/' + encodeURIComponent(e.id) + '/luecken' }, 'Lückentext'),
      e.questions ? h('a', { class: 'btn primary', href: '#/hoeren/eintrag/' + encodeURIComponent(e.id) + '/fragen' }, 'Fragen (' + e.questions.length + ')') : null));

    el.appendChild(h('details', { class: 'card', open: !e.questions || null },
      h('summary', null, e.questions ? 'Neue Fragen anfordern' : 'Verständnisfragen'),
      APP.fragen.bridge({
        promptOpts: { kind: 'hoeren', title: e.title, source: e.source, text: e.transcript },
        hasQuestions: !!e.questions,
        onSaved: function (qs) {
          e.questions = qs;
          e.questionsAt = Date.now();
          APP.store.save();
          U.toast(qs.length + ' Fragen gespeichert.');
          APP.navigate('#/hoeren/eintrag/' + encodeURIComponent(e.id));
        }
      })));

    // Transkript (antippbar → Karte), standardmäßig verborgen
    var tr = APP.modules.lesen.renderTappable(e.transcript, []);
    var label = h('span', { class: 'selbar-text' });
    var current = null;
    var bar = h('div', { class: 'selbar', hidden: true },
      label,
      h('button', {
        type: 'button', class: 'btn primary small', onclick: function () {
          if (!current) return;
          APP.modules.wortschatz.openEditor({
            term: current.text, example: APP.modules.lesen.clozeSentence(current.sentence, current.text),
            deck: 'aus-hoertexten', deckTitle: 'Aus Hörtexten', tags: ['Hören'].concat(e.source ? [e.source] : []),
            origin: { listening: e.id }, returnTo: '#/hoeren/eintrag/' + encodeURIComponent(e.id)
          });
        }
      }, 'Als Karte speichern'),
      h('button', { type: 'button', class: 'btn ghost small', 'aria-label': 'Auswahl aufheben', onclick: function () { sel.reset(); show(null); } }, '✕'));
    function show(s) { current = s; bar.hidden = !s; label.textContent = s ? '„' + s.text + '“' : ''; }
    var sel = APP.modules.lesen.attachSelection(tr, show);
    el.appendChild(h('details', { class: 'card' }, h('summary', null, 'Transkript anzeigen (Wörter antippen → Karte)'), h('div', { class: 'reader' }, tr)));
    el.appendChild(bar);

    el.appendChild(h('div', { class: 'actions' },
      h('button', {
        type: 'button', class: 'btn bad', onclick: function () {
          if (!window.confirm('Hörtext „' + e.title + '“ löschen?')) return;
          L().entries = L().entries.filter(function (x) { return x.id !== e.id; });
          APP.sync.tombstone('entry', e.id);
          delAudio(e.id);
          APP.store.save();
          APP.navigate('#/hoeren');
        }
      }, 'Hörtext löschen')));
  }

  function chunkPicker(e, list, kind, idx) {
    return h('label', { class: 'small muted chunk-pick' }, 'Abschnitt ',
      h('select', {
        onchange: function (ev) {
          e.pos = e.pos || {};
          e.pos[kind] = Number(ev.target.value);
          APP.store.save();
          APP.navigate(location.hash);
        }
      }, list.map(function (c, i) { return h('option', { value: i, selected: i === idx || null }, (i + 1) + ' von ' + list.length); })));
  }

  function renderDictation(el, id) {
    var e = entryById(id);
    if (!e) return APP.navigate('#/hoeren');
    var list = chunks(e.transcript, 10, 28);
    e.pos = e.pos || {};
    var idx = (e.pos.diktat || 0) % list.length;
    var chunk = list[idx];
    header(el, e, 'Diktat');
    var player = makePlayer(e);
    el.appendChild(player.el);
    var card = h('section', { class: 'card exercise' });
    card.appendChild(h('div', { class: 'ex-head' }, chunkPicker(e, list, 'diktat', idx), h('span', { class: 'muted small' }, '≈ ' + U.wordCount(chunk.text) + ' Wörter')));
    card.appendChild(segmentControls(e, player, 'd', idx, chunk));
    var ta = h('textarea', { class: 'answer-input', rows: 4, placeholder: 'Schreiben Sie, was Sie hören …', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Diktat' });
    card.appendChild(ta);
    var result = h('div', { 'aria-live': 'polite' });
    var actions = h('div', { class: 'actions' });
    card.appendChild(actions);
    card.appendChild(result);
    el.appendChild(card);

    function nextChunk() {
      e.pos.diktat = (idx + 1) % list.length;
      APP.store.save();
      APP.navigate(location.hash);
    }

    actions.appendChild(h('button', {
      type: 'button', class: 'btn primary', onclick: function () {
        if (!ta.value.trim()) { U.toast('Bitte zuerst mitschreiben.'); return; }
        ta.disabled = true;
        U.clear(actions);
        var d = diffWords(chunk.text, ta.value);
        APP.progress.record(ID, 'diktat', e.id + '#d' + idx, d.score);
        var view = h('p', { class: 'diff ex-text' });
        d.ops.forEach(function (o) {
          view.appendChild(h('span', { class: 'd-' + o.t, title: o.t === 'miss' ? 'fehlt / falsch' : o.t === 'extra' ? 'zusätzlich / falsch geschrieben' : null }, o.w));
          view.appendChild(document.createTextNode(' '));
        });
        result.appendChild(h('div', { class: 'feedback is-open ' + (d.score >= 0.9 ? 'is-ok' : 'is-bad') },
          h('p', { class: 'verdict' }, Math.round(d.score * 100) + ' % (' + d.correct + ' von ' + d.total + ' Wörtern richtig)'),
          view,
          h('p', { class: 'small muted' }, 'Grün = richtig, rot = fehlt oder falsch, durchgestrichen = zusätzlich bzw. falsch geschrieben. Satzzeichen werden ignoriert, Groß-/Kleinschreibung zählt.'),
          h('div', { class: 'solutions' }, h('div', { class: 'label' }, 'Original'), h('p', { class: 'fc-example' }, chunk.text)),
          h('div', { class: 'actions' },
            h('button', { type: 'button', class: 'btn primary', onclick: nextChunk }, 'Nächster Abschnitt'),
            h('button', { type: 'button', class: 'btn ghost', onclick: function () { APP.navigate(location.hash); } }, 'Nochmal'))));
      }
    }, 'Prüfen'));
  }

  function renderGaps(el, id) {
    var e = entryById(id);
    if (!e) return APP.navigate('#/hoeren');
    var list = chunks(e.transcript, 45, 90);
    e.pos = e.pos || {};
    var idx = (e.pos.luecken || 0) % list.length;
    var chunk = list[idx];
    header(el, e, 'Lückentext');
    var player = makePlayer(e);
    el.appendChild(player.el);
    var g = makeGaps(chunk.text);
    var inputs = [];
    var p = h('p', { class: 'ex-text gap-text' });
    g.parts.forEach(function (tok, i) {
      if (!g.gaps[i]) { p.appendChild(document.createTextNode(tok)); return; }
      var lead = (tok.match(/^[^0-9A-Za-zÄÖÜäöüßÀ-ÿ]+/) || [''])[0];
      var trail = (tok.match(/[^0-9A-Za-zÄÖÜäöüßÀ-ÿ]+$/) || [''])[0];
      var core = tok.slice(lead.length, tok.length - trail.length);
      var inp = h('input', { type: 'text', class: 'gap-input', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Lücke ' + (inputs.length + 1) });
      inp.style.width = Math.max(4, core.length * 0.7) + 'em';
      inputs.push({ el: inp, answer: core });
      p.appendChild(document.createTextNode(lead));
      p.appendChild(inp);
      p.appendChild(document.createTextNode(trail));
    });
    var card = h('section', { class: 'card exercise' },
      h('div', { class: 'ex-head' }, chunkPicker(e, list, 'luecken', idx), h('span', { class: 'muted small' }, inputs.length + ' Lücken')),
      segmentControls(e, player, 'l', idx, chunk),
      p);
    var result = h('div', { 'aria-live': 'polite' });
    var actions = h('div', { class: 'actions' });
    card.appendChild(actions);
    card.appendChild(result);
    el.appendChild(card);

    actions.appendChild(h('button', {
      type: 'button', class: 'btn primary', onclick: function () {
        U.clear(actions);
        var ok = 0;
        inputs.forEach(function (x) {
          var m = U.matchAnswer(x.el.value, [x.answer]);
          x.el.disabled = true;
          if (m === 'exact') { ok++; x.el.classList.add('is-correct'); }
          else {
            x.el.classList.add('is-wrong');
            x.el.parentNode.insertBefore(h('span', { class: 'gap-solution' }, x.answer), x.el.nextSibling);
          }
        });
        var score = inputs.length ? ok / inputs.length : 0;
        APP.progress.record(ID, 'luecken', e.id + '#l' + idx, score);
        result.appendChild(h('div', { class: 'feedback is-open ' + (score >= 0.9 ? 'is-ok' : 'is-bad') },
          h('p', { class: 'verdict' }, ok + ' von ' + inputs.length + ' richtig'),
          h('div', { class: 'actions' },
            h('button', {
              type: 'button', class: 'btn primary', onclick: function () {
                e.pos.luecken = (idx + 1) % list.length;
                APP.store.save();
                APP.navigate(location.hash);
              }
            }, 'Nächster Abschnitt'),
            h('button', { type: 'button', class: 'btn ghost', onclick: function () { APP.navigate(location.hash); } }, 'Nochmal'))));
      }
    }, 'Prüfen'));
  }

  function renderQuestions(el, id) {
    var e = entryById(id);
    if (!e || !e.questions) return APP.navigate('#/hoeren/eintrag/' + encodeURIComponent(id));
    header(el, e, 'Verständnisfragen');
    el.appendChild(makePlayer(e).el);
    var stage = h('div');
    el.appendChild(stage);
    APP.fragen.run(stage, e.questions, {
      onAnswer: function (q, score) { APP.progress.record(ID, 'fragen', e.id + '#q' + e.questions.indexOf(q), score); },
      onDone: function (res) {
        e.runs = e.runs || [];
        e.runs.push({ at: Date.now(), score: res.score, total: res.total });
        APP.store.save();
      },
      actions: h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '#/hoeren/eintrag/' + encodeURIComponent(e.id) }, 'Zurück zum Hörtext'))
    });
  }

  function practiceRoute(topic) {
    var es = L().entries;
    if (!es.length) return '#/hoeren';
    var e = es[es.length - 1];
    if (topic === 'fragen') {
      var withQ = es.filter(function (x) { return x.questions; });
      if (!withQ.length) return '#/hoeren/eintrag/' + encodeURIComponent(e.id);
      e = withQ[withQ.length - 1];
    }
    return '#/hoeren/eintrag/' + encodeURIComponent(e.id) + '/' + (topic || 'diktat');
  }

  function render(el, params) {
    if (params[0] === 'neu') return renderNew(el);
    if (params[0] === 'eintrag' && params[1]) {
      if (params[2] === 'diktat') return renderDictation(el, params[1]);
      if (params[2] === 'luecken') return renderGaps(el, params[1]);
      if (params[2] === 'fragen') return renderQuestions(el, params[1]);
      return renderEntry(el, params[1]);
    }
    if (params[0] === 'ueben') { location.replace(practiceRoute(params[1])); return; }
    return renderOverview(el);
  }

  APP.registerModule({
    id: ID,
    title: 'Hören',
    enqueueOnMastery: false,
    topics: function () { return TOPICS; },
    items: function () { return []; },
    getItem: function () { return null; },
    topicOf: function () { return null; },
    focusInfo: function () { return L().entries.length + ' Hörtexte'; },
    render: render,
    // für Tests
    diffWords: diffWords, chunks: chunks, makeGaps: makeGaps
  });
})(window.APP);
