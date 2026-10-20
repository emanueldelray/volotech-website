"use strict";
// KNX Partner Leads: one script for the installable PWA, the single-file dashboard.html
// (data embedded as window.EMBEDDED_LEADS) and the claude.ai page (extra account sync via db).

const STATUSES = ["not contacted","called – no answer","call back","interested","not interested","partner"];
const LS_KEY = "knxLeads.v1";          // localStorage fallback / migration source
const FKEY = "knxLeads.filters";       // remembered filters (convenience only)
let DATA = [];
let store = {};                        // id -> {status, notes, t}

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const tel = p => "tel:" + String(p).replace(/\(0\)/g,"").replace(/[^\d+]/g,"");
const url = u => /^https?:/i.test(u) ? u : "http://" + u;
function toast(m){ const t=$("toast"); t.textContent=m; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1800); }

// ---------------------------------------------------------------- device storage (IndexedDB, localStorage fallback)
const Local = (() => {
  let dbp = null;
  function open(){
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!("indexedDB" in window)) return rej(new Error("no indexedDB"));
      const r = indexedDB.open("knx-leads", 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("status")) db.createObjectStore("status");
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error("blocked"));
    });
    return dbp;
  }
  function tx(name, mode, fn){
    return open().then(db => new Promise((res, rej) => {
      const t = db.transaction(name, mode), s = t.objectStore(name), out = fn(s);
      t.oncomplete = () => res(out && "result" in out ? out.result : out);
      t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    }));
  }
  const lsRead = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {}; } catch (e) { return {}; } };
  const lsWrite = obj => { try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch (e) {} };
  let useIdb = true;
  return {
    get mode(){ return useIdb ? "indexeddb" : "localstorage"; },
    async loadStatuses(){
      try {
        const [keys, vals] = await Promise.all([tx("status","readonly",s=>s.getAllKeys()), tx("status","readonly",s=>s.getAll())]);
        const out = {}; keys.forEach((k,i)=>out[k]=vals[i]);
        const legacy = lsRead();                       // first run after the localStorage-only version
        const missing = Object.keys(legacy).filter(k => !(k in out));
        if (missing.length) { await tx("status","readwrite",s=>missing.forEach(k=>s.put(legacy[k],k))); missing.forEach(k=>out[k]=legacy[k]); }
        return out;
      } catch (e) { useIdb = false; return lsRead(); }
    },
    async put(id, rec){
      if (useIdb) { try { await tx("status","readwrite",s=>s.put(rec,id)); return; } catch (e) { useIdb = false; } }
      const all = lsRead(); all[id] = rec; lsWrite(all);
    },
    async putMany(obj){
      if (useIdb) { try { await tx("status","readwrite",s=>Object.entries(obj).forEach(([k,v])=>s.put(v,k))); return; } catch (e) { useIdb = false; } }
      lsWrite({ ...lsRead(), ...obj });
    },
    async getLeads(){ try { return await tx("kv","readonly",s=>s.get("leads")); } catch (e) { return null; } },
    async setLeads(payload){ try { await tx("kv","readwrite",s=>s.put(payload,"leads")); } catch (e) {} },
  };
})();

let persistAsked = false;
function askPersist(){
  if (persistAsked) return; persistAsked = true;
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
}

// ---------------------------------------------------------------- optional claude.ai account sync
let remote = null; const writeTimers = {}, writing = {};
async function writeRemote(id){
  if (!remote) return;
  if (writing[id]) { writing[id] = "again"; return; }
  writing[id] = true;
  try { await remote.col.doc(id).set({ ...(store[id] || {}) }); }
  catch (e) { toast(e && e.code === "quota_exceeded" ? "Storage full: could not sync" : "Could not sync, saved on this device"); }
  const again = writing[id] === "again"; writing[id] = false;
  if (again) writeRemote(id);
}
async function initRemote(){
  if (!window.claude || !window.claude.use) return;
  try {
    const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
    const uid = db && user ? await user.id() : null;
    if (!uid) return;
    const col = db.collection("data/users/" + uid);
    remote = { col };
    let first = true;
    col.onSnapshot(snap => {
      const changed = {};
      snap.docChanges().forEach(ch => {
        if (ch.type === "removed") { delete store[ch.doc.id]; return; }
        const d = ch.doc.data(); if (d && !writing[ch.doc.id]) { store[ch.doc.id] = { ...d }; changed[ch.doc.id] = store[ch.doc.id]; }
      });
      Local.putMany(changed);
      if (first) { first = false; $("savemode").textContent = "status & notes are saved to your Claude account and sync across devices"; }
      if (!document.activeElement || !document.activeElement.classList.contains("notes")) render(); else counters();
    }, () => { remote = null; $("savemode").textContent = "sync unavailable, status & notes are saved on this device"; });
  } catch (e) { remote = null; }
}

function save(id, delay=0){
  clearTimeout(writeTimers[id]);
  writeTimers[id] = setTimeout(() => {
    Local.put(id, store[id]);
    writeRemote(id);
  }, delay);
  askPersist();
}

// ---------------------------------------------------------------- filters & rendering
const st = id => (store[id] && store[id].status) || "not contacted";
const notes = id => (store[id] && store[id].notes) || "";
const uniq = a => [...new Set(a.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de"));
function fillSelect(id, values, keepFirst=true){
  const s=$(id);
  if (keepFirst) while (s.options.length > 1) s.remove(1);
  values.forEach(v=>{ const o=document.createElement("option"); o.value=v; o.textContent=v; s.appendChild(o); });
}
function refreshTowns(){
  const r=$("f-region").value, s=$("f-town"), cur=s.value;
  fillSelect("f-town", uniq(DATA.filter(d=>!r||d.region===r).map(d=>d.town)));
  s.value=[...s.options].some(o=>o.value===cur)?cur:"";
}
const fids=["q","f-region","f-town","f-knx","f-prio","f-method","f-status","f-sort"];

let view=[], shown=0; const PAGE=40;
function filtered(){
  const q=$("q").value.trim().toLowerCase(), r=$("f-region").value, t=$("f-town").value, k=$("f-knx").value,
        p=+$("f-prio").value||0, m=$("f-method").value, s=$("f-status").value, sort=$("f-sort").value;
  const out=DATA.filter(d=>(!r||d.region===r)&&(!t||d.town===t)&&(!k||d.knx_status===k)&&(!p||d.priority>=p)&&
    (!m||d.contact_method===m)&&(!s||st(d.id)===s)&&
    (!q||[d.name,d.town,d.owner,d.phone_landline,d.phone_mobile,d.email,d.postcode,notes(d.id),(d.services||[]).join(" ")].join(" ").toLowerCase().includes(q)));
  const cmp={prio:(a,b)=>b.priority-a.priority||a.dist_gersthofen-b.dist_gersthofen,
    dist:(a,b)=>a.dist_gersthofen-b.dist_gersthofen, name:(a,b)=>a.name.localeCompare(b.name,"de"),
    town:(a,b)=>(a.town||"").localeCompare(b.town||"","de")||b.priority-a.priority,
    recent:(a,b)=>((store[b.id]||{}).t||0)-((store[a.id]||{}).t||0)}[sort] || ((a,b)=>b.priority-a.priority);
  return out.sort(cmp);
}
function counters(){
  const c={}, reg={}; DATA.forEach(d=>{ reg[d.region]=(reg[d.region]||0)+1; const s=st(d.id); c[s]=(c[s]||0)+1; });
  const chips=[`<span class="chip" data-k="" data-v=""><b>${DATA.length}</b> total</span>`]
    .concat(Object.entries(reg).sort().map(([k,v])=>`<span class="chip ${$("f-region").value===k?"on":""}" data-k="f-region" data-v="${esc(k)}">${esc(k)} <b>${v}</b></span>`))
    .concat(STATUSES.map(s=>`<span class="chip ${$("f-status").value===s?"on":""}" data-k="f-status" data-v="${esc(s)}">${esc(s)} <b>${c[s]||0}</b></span>`));
  $("counters").innerHTML=chips.join("");
}
function card(d){
  const tags=[`<span class="tag knx">${esc(d.knx_status)}</span>`];
  if(d.knx_specialist) tags.push('<span class="tag warn">KNX/smart-home specialist</span>');
  if(d.meister==="yes") tags.push('<span class="tag">Meisterbetrieb</span>');
  (d.services||[]).forEach(s=>tags.push(`<span class="tag">${esc(s)}</span>`));
  if(d.data_quality!=="complete") tags.push(`<span class="tag warn">${esc(d.data_quality)}</span>`);
  if(d.gs_rating) tags.push(`<span class="tag">GS ★ ${esc(d.gs_rating)} (${esc(d.gs_reviews||0)})</span>`);
  const acts=[];
  if(d.phone_landline) acts.push(`<a class="call" href="${tel(d.phone_landline)}">📞 ${esc(d.phone_landline)}</a><button class="btn cp" data-v="${esc(d.phone_landline)}" aria-label="Copy number">Copy</button>`);
  if(d.phone_mobile) acts.push(`<a class="${d.phone_landline?"":"call"}" href="${tel(d.phone_mobile)}">📱 ${esc(d.phone_mobile)}</a><button class="btn cp" data-v="${esc(d.phone_mobile)}" aria-label="Copy number">Copy</button>`);
  if(d.email) acts.push(`<a href="mailto:${esc(d.email)}">✉ ${esc(d.email)}</a>`);
  if(d.website) acts.push(`<a href="${esc(url(d.website))}" target="_blank" rel="noopener">Website</a>`);
  if(d.contact_form && d.contact_form!==d.website) acts.push(`<a href="${esc(d.contact_form)}" target="_blank" rel="noopener">Contact form</a>`);
  const opts=STATUSES.map(s=>`<option ${s===st(d.id)?"selected":""}>${esc(s)}</option>`).join("");
  return `<div class="card" data-id="${esc(d.id)}">
   <div class="top"><div class="prio p${esc(d.priority)}" title="Priority">${esc(d.priority)}</div>
    <div><div class="name">${esc(d.name)}</div>
    <div class="meta">${esc([d.street,[d.postcode,d.town].filter(Boolean).join(" ")].filter(Boolean).join(", "))} · ${esc(d.region)} · ${esc(d.dist_gersthofen)} km von Gersthofen</div>
    <div class="meta">${d.owner?"Kontakt: "+esc(d.owner)+" · ":""}${esc(d.legal_form||"")}${d.legal_form?" · ":""}${esc(d.size||"")}</div></div></div>
   <div class="tags">${tags.join("")}</div>
   <div class="actions">${acts.join("")||'<span class="meta">No contact details found</span>'}</div>
   <div class="rec"><b>${esc(d.contact_method)}</b> – ${esc(d.contact_reason)}<br>Best time: ${esc(d.best_time)}</div>
   <div class="opener">${esc(d.opener)}</div>
   <div class="row"><select class="status" aria-label="Status">${opts}</select><textarea class="notes" placeholder="Notes …" aria-label="Notes">${esc(notes(d.id))}</textarea></div>
   <div class="actions"><button class="btn copy">Copy opener</button></div>
   <details><summary>Sources &amp; details</summary>
    ${d.knx_snippet?`<p>KNX on site: “${esc(d.knx_snippet)}”</p>`:""}
    ${(d.brands||[]).length?`<p>Brands: ${esc(d.brands.join(", "))}</p>`:""}
    ${d.impressum_url?`<p><a href="${esc(d.impressum_url)}" target="_blank" rel="noopener">Impressum</a></p>`:""}
    <p>${(d.source_urls||[]).map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/,"").slice(0,48))}</a>`).join("<br>")}</p>
   </details></div>`;
}
function render(reset=true){
  if(reset){ view=filtered(); shown=0; $("list").innerHTML=""; }
  const chunk=view.slice(shown, shown+PAGE); shown+=chunk.length;
  $("list").insertAdjacentHTML("beforeend", chunk.map(card).join(""));
  $("count").textContent=DATA.length ? `${view.length} shown of ${DATA.length}` : "";
  $("more").style.display=shown<view.length?"block":"none";
  counters();
  try { const f={}; fids.forEach(i=>f[i]=$(i).value); localStorage.setItem(FKEY, JSON.stringify(f)); } catch(e){}
}

// ---------------------------------------------------------------- events
fids.forEach(i=>$(i).addEventListener(i==="q"?"input":"change",()=>{ if(i==="f-region") refreshTowns(); render(); }));
$("more").onclick=()=>render(false);
$("reset").onclick=()=>{ fids.forEach(i=>$(i).value=i==="f-sort"?"prio":""); refreshTowns(); render(); };
$("counters").addEventListener("click",e=>{ const c=e.target.closest(".chip"); if(!c) return;
  if(!c.dataset.k){ $("f-region").value=""; $("f-status").value=""; }
  else $(c.dataset.k).value = $(c.dataset.k).value===c.dataset.v ? "" : c.dataset.v;
  refreshTowns(); render(); });
$("list").addEventListener("change",e=>{ const card=e.target.closest(".card"); if(!card||!e.target.classList.contains("status")) return;
  const id=card.dataset.id; store[id]={...(store[id]||{}),status:e.target.value,t:Date.now()}; save(id); counters(); toast("Status saved"); });
$("list").addEventListener("input",e=>{ const card=e.target.closest(".card"); if(!card||!e.target.classList.contains("notes")) return;
  const id=card.dataset.id; store[id]={...(store[id]||{}),notes:e.target.value,t:Date.now()}; save(id, 600); });
function copyText(text, msg){
  const fallback=()=>{ const ta=document.createElement("textarea"); ta.value=text; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy");}catch(e){} ta.remove(); toast(msg); };
  try { navigator.clipboard.writeText(text).then(()=>toast(msg), fallback); } catch(err){ fallback(); }
}
$("list").addEventListener("click",e=>{
  if(e.target.classList.contains("cp")) { copyText(e.target.dataset.v, "Number copied"); return; }
  if(!e.target.classList.contains("copy")) return;
  const d=DATA.find(x=>x.id===e.target.closest(".card").dataset.id);
  copyText(d.opener, "Opener copied"); });

let downloads=null;
async function download(name, text, type){
  if (downloads) {
    try { await downloads.save({filename:name, data:text}); toast("Saved"); }
    catch(e){ if(e && e.code!=="declined") toast("Could not save the file here"); }
    return;
  }
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
$("csv").onclick=()=>{
  const cols=["priority","name","owner","street","postcode","town","region","dist_gersthofen","phone_landline","phone_mobile","email","website","contact_form","knx_status","meister","size","contact_method","best_time","opener"];
  const q=v=>'"'+String(Array.isArray(v)?v.join("; "):v??"").replace(/"/g,'""')+'"';
  const rows=[cols.concat(["status","notes"]).join(";")].concat(view.map(d=>cols.map(c=>q(d[c])).concat([q(st(d.id)),q(notes(d.id))]).join(";")));
  download(`knx-leads-${new Date().toISOString().slice(0,10)}.csv`, "﻿"+rows.join("\n"), "text/csv;charset=utf-8");
};
$("backup").onclick=()=>download(`knx-leads-status-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(store), "application/json");
$("restore").onchange=e=>{ const f=e.target.files[0]; e.target.value=""; if(!f) return; f.text().then(async t=>{
  let add; try { add=JSON.parse(t); } catch(err){ toast("That file is not a status backup"); return; }
  if (!add || typeof add!=="object" || Array.isArray(add) || add.leads) { toast("That file is not a status backup"); return; }
  store={...store,...add}; await Local.putMany(add); render(); toast("Restored");
  for (const id of Object.keys(add)) { if (remote) await writeRemote(id); } }); };

async function importLeadsFile(f){
  if(!f) return;
  let payload; try { payload=JSON.parse(await f.text()); } catch(e){ toast("That file is not a leads file"); return; }
  if (Array.isArray(payload)) payload={date:"", leads:payload};
  if (!payload || !Array.isArray(payload.leads) || !payload.leads.length || !payload.leads[0].id) { toast("That file is not a leads file"); return; }
  await Local.setLeads(payload);
  start(payload); toast(`${payload.leads.length} leads loaded`);
}
$("importLeads").onchange=e=>{ const f=e.target.files[0]; e.target.value=""; importLeadsFile(f); };
$("importLeads2").onchange=e=>{ const f=e.target.files[0]; e.target.value=""; importLeadsFile(f); };

$("ftoggle").onclick=()=>{ const f=$("filters"); f.classList.toggle("collapsed"); $("ftoggle").textContent=f.classList.contains("collapsed")?"Filters ▾":"Filters ▴"; };
$("filters").classList.add("collapsed");

// install prompt (Chrome / Edge on Windows and Android)
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); installEvt=e; $("install").classList.add("show"); });
window.addEventListener("appinstalled",()=>{ installEvt=null; $("install").classList.remove("show"); toast("App installed"); });
$("install").onclick=async()=>{ if(!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch(e){} installEvt=null; $("install").classList.remove("show"); };
// called by the service-worker registration in index.html when a new version is waiting
let waitingWorker=null;
window.offerUpdate=w=>{ waitingWorker=w; $("update").classList.add("show"); };
$("update").onclick=()=>{ if(waitingWorker) waitingWorker.postMessage("SKIP_WAITING"); else location.reload(); };

// ---------------------------------------------------------------- boot
function start(payload){
  DATA = payload.leads;
  $("datadate").textContent = payload.date ? `Data collected ${payload.date} · ` : "";
  $("empty").hidden = true;
  fillSelect("f-region", uniq(DATA.map(d=>d.region)));
  fillSelect("f-knx", uniq(DATA.map(d=>d.knx_status)));
  fillSelect("f-method", uniq(DATA.map(d=>d.contact_method)));
  fillSelect("f-status", STATUSES);
  refreshTowns();
  try { const f=JSON.parse(localStorage.getItem(FKEY)||"{}"); fids.forEach(i=>{ if(f[i]!=null && [...($(i).options||[{value:f[i]}])].some(o=>o.value===f[i])){ $(i).value=f[i]; if(i==="f-region") refreshTowns(); } }); } catch(e){}
  render();
}

(async function boot(){
  let payload = window.EMBEDDED_LEADS ? { date: window.EMBEDDED_DATE || "", leads: window.EMBEDDED_LEADS } : null;
  if (!payload && /^https?:$/.test(location.protocol)) {
    try { const r = await fetch("leads.json", { cache: "no-cache" }); if (r.ok) { payload = await r.json(); Local.setLeads(payload); } } catch (e) {}
  }
  if (!payload) payload = await Local.getLeads();
  store = await Local.loadStatuses();
  if (Local.mode !== "indexeddb") $("savemode").textContent = "status & notes are saved in this browser (use “Backup” to keep a copy)";
  if (payload && payload.leads && payload.leads.length) start(payload);
  else { $("empty").hidden = false; render(); }
  initRemote();
  if (window.claude && window.claude.use) claude.use("downloads").then(d=>{ downloads=d; }).catch(()=>{});
})();
