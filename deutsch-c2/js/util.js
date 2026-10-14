/* Hilfsfunktionen – globaler Namensraum APP */
window.APP = window.APP || {};

(function (APP) {
  'use strict';

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /** Lokales Datum als YYYY-MM-DD */
  function dayStr(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseDay(s) {
    var p = s.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function addDays(s, n) {
    var d = parseDay(s);
    d.setDate(d.getDate() + n);
    return dayStr(d);
  }

  function daysBetween(a, b) {
    return Math.round((parseDay(b) - parseDay(a)) / 86400000);
  }

  function lastNDays(n) {
    var today = dayStr(), out = [];
    for (var i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
    return out;
  }

  function fmtDate(ts) {
    var d = new Date(ts);
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
  }

  function fmtMinutes(sec) {
    var m = Math.round(sec / 60);
    if (m < 60) return m + ' Min.';
    return Math.floor(m / 60) + ' Std. ' + (m % 60) + ' Min.';
  }

  /**
   * Minimaler DOM-Builder: h('div', {class: 'x', onclick: fn}, 'Text', child)
   */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /**
   * Antwortvergleich: Leerraum, Anführungszeichen, Bindestriche und
   * Satzendezeichen werden vereinheitlicht. Kommas bleiben relevant.
   */
  function normalize(s) {
    return String(s || '')
      .replace(/[„“”«»‹›"]/g, '"')
      .replace(/[‘’‚`´]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/…/g, '...')
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim()
      .replace(/[.!?]+$/, '')
      .trim();
  }

  /** Ergebnis: 'exact' | 'case' (nur Groß-/Kleinschreibung) | null */
  function matchAnswer(input, answers) {
    var n = normalize(input);
    if (!n) return null;
    for (var i = 0; i < answers.length; i++) if (normalize(answers[i]) === n) return 'exact';
    var lower = n.toLowerCase();
    for (var j = 0; j < answers.length; j++) if (normalize(answers[j]).toLowerCase() === lower) return 'case';
    return null;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function downloadFile(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  APP.util = {
    dayStr: dayStr, parseDay: parseDay, addDays: addDays, daysBetween: daysBetween,
    lastNDays: lastNDays, fmtDate: fmtDate, fmtMinutes: fmtMinutes,
    h: h, clear: clear, normalize: normalize, matchAnswer: matchAnswer,
    shuffle: shuffle, downloadFile: downloadFile, toast: toast
  };
})(window.APP);
