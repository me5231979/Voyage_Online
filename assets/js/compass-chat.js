/* ══════════ VANDERBILT VOYAGE ONLINE · Compass, the question helper ══════════
   A chat panel that sends questions to the Compass function (compass-api/,
   set in config.js as compassApi). Compass answers from the course and from
   vanderbilt.edu, and declines benefits, pay, leave, and other sensitive topics.
   No URL in config.js: no button, nothing sent. The conversation lives in this
   tab only (sessionStorage). */
(function(){
  'use strict';
  var C = window.VVO_CONFIG || {}, API = C.compassApi;
  if(!API) return;
  var KEY = 'vvo2-compass-chat', MAX = 8;
  var SUGGEST = ['What are the four beliefs?', 'Where are Vanderbilt’s campuses?', 'Tell me about Chancellor Diermeier', 'What does Crescere aude mean?'];
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function load(){ try{ var v = JSON.parse(sessionStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } }
  function save(){ try{ sessionStorage.setItem(KEY, JSON.stringify(log.slice(-20))); }catch(e){} }
  var log = load(), busy = false, lastFocus = null;

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'cmp-fab'; btn.id = 'compassFab';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'compassPanel');
  var CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c4.97 0 9 3.36 9 7.5s-4.03 7.5-9 7.5c-1.06 0-2.08-.15-3.03-.43L4 20l1.2-3.6C3.84 15.05 3 13.1 3 11c0-4.14 4.03-7.5 9-7.5z"/><path d="M8.5 10h7M8.5 13h4.5"/></svg>';
  btn.innerHTML = CHAT + '<span>Ask Compass</span>';
  document.documentElement.classList.add('has-compass');
  var panel = document.createElement('div');
  panel.className = 'cmp-panel'; panel.id = 'compassPanel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'compassTitle');
  panel.innerHTML =
    '<div class="cmp-head"><span class="cmp-badge">' + ICON + '</span><div><h2 id="compassTitle">Compass</h2><p>Answers from this course and vanderbilt.edu</p></div>' +
    '<button type="button" class="cmp-x" aria-label="Close Compass"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="cmp-log" id="compassLog" aria-live="polite"></div>' +
    '<form class="cmp-form" novalidate><label class="sr-only" for="compassQ">Ask Compass a question</label>' +
    '<textarea id="compassQ" rows="1" maxlength="600" placeholder="Ask about the course or Vanderbilt"></textarea>' +
    '<button type="submit" class="cmp-send" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>' +
    '<p class="cmp-note">Compass can’t help with benefits, pay, leave, or personal HR questions. For those, contact <a href="https://hr.vanderbilt.edu/" target="_blank" rel="noopener">Human Resources</a>. AI answers can be wrong; check the linked pages.</p>';
  document.body.appendChild(btn); document.body.appendChild(panel);
  var logEl = panel.querySelector('#compassLog'), form = panel.querySelector('form'), q = panel.querySelector('#compassQ'), send = panel.querySelector('.cmp-send');

  function para(t){ return esc(t).split(/\n{2,}/).map(function(p){ return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function bubble(m){
    if(m.role === 'user') return '<div class="cmp-msg me"><span class="sr-only">You: </span>' + para(m.content) + '</div>';
    var src = (m.sources || []).length ? '<ul class="cmp-src" aria-label="Sources">' + m.sources.map(function(s){ return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title || s.url) + '</a></li>'; }).join('') + '</ul>' : '';
    return '<div class="cmp-msg bot' + (m.error ? ' err' : '') + '"><span class="sr-only">Compass: </span>' + para(m.content) + src + '</div>';
  }
  function render(){
    var intro = '<div class="cmp-msg bot"><p>Hi, I’m Compass. Ask me about this course or about Vanderbilt, and I’ll answer from the course and vanderbilt.edu.</p>' +
      (log.length ? '' : '<div class="cmp-sugg" role="group" aria-label="Try asking">' + SUGGEST.map(function(s){ return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>') + '</div>';
    logEl.innerHTML = intro + log.map(bubble).join('') + (busy ? '<div class="cmp-msg bot wait"><span class="cmp-dots" aria-hidden="true"><i></i><i></i><i></i></span>Searching vanderbilt.edu…</div>' : '');
    logEl.scrollTop = logEl.scrollHeight;
  }
  function open(on){
    panel.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false'); document.documentElement.classList.toggle('cmp-open', on);
    if(on){ lastFocus = document.activeElement; render(); window.setTimeout(function(){ q.focus(); }, 30); }
    else if(lastFocus && lastFocus.focus){ try{ lastFocus.focus(); }catch(e){} }
  }
  function ask(text){
    text = String(text || '').trim(); if(!text || busy) return;
    log.push({ role:'user', content:text }); busy = true; send.disabled = true; q.value = ''; grow(); render(); save();
    var history = log.filter(function(m){ return !m.error; }).slice(-MAX).map(function(m){ return { role:m.role, content:m.content }; });
    fetch(API, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ messages:history }) })
      .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok:r.ok, j:j }; }); })
      .then(function(x){
        if(x.ok && x.j.answer) log.push({ role:'assistant', content:x.j.answer, sources:x.j.sources || [] });
        else log.push({ role:'assistant', content:(x.j && x.j.error) || 'Compass could not answer just now. Please try again.', error:true });
      })
      .catch(function(){ log.push({ role:'assistant', content:'Compass can’t be reached right now. Check your connection and try again.', error:true }); })
      .then(function(){ busy = false; send.disabled = false; render(); save(); q.focus(); });
  }
  function grow(){ q.style.height = 'auto'; q.style.height = Math.min(q.scrollHeight, 120) + 'px'; }

  btn.addEventListener('click', function(){ open(panel.hidden); });
  panel.querySelector('.cmp-x').addEventListener('click', function(){ open(false); });
  form.addEventListener('submit', function(e){ e.preventDefault(); ask(q.value); });
  q.addEventListener('input', grow);
  q.addEventListener('keydown', function(e){ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); ask(q.value); } });
  logEl.addEventListener('click', function(e){ var s = e.target.closest('[data-q]'); if(s) ask(s.getAttribute('data-q')); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !panel.hidden){ open(false); } });
})();
