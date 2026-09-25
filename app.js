/* ══════════ VANDERBILT VOYAGE ONLINE · app engine ══════════
   Built on the Manager Foundations engine (me5231979/Manager-Voyage,
   foundation/app.js): the same narration layer, progress rail, tap-to-open
   maps, one-at-a-time drills, your-call scenarios, and knowledge check,
   with the Voyage content. Nine tracked activities. State: localStorage
   vvo-* in this browser. Nothing is sent anywhere. No em or en dashes. */
(function(){
'use strict';
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var C = window.VVO_CONFIG || {};
var yr = document.getElementById('yr'); if(yr) yr.textContent = new Date().getFullYear();
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
function $(s, c){ return (c || document).querySelector(s); }
function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

/* ── storage ── */
var KEY = 'vvo-';
var mem = {};
var store = (function(){ try{ var t = KEY + 'test'; window.localStorage.setItem(t, '1'); window.localStorage.removeItem(t); return window.localStorage; }catch(e){ return null; } })();
function get(k){ if(store){ try{ var v = store.getItem(KEY + k); if(v !== null) return v; }catch(e){} } return mem[k] === undefined ? null : mem[k]; }
function set(k, v){ mem[k] = v; if(store){ try{ v === null ? store.removeItem(KEY + k) : store.setItem(KEY + k, v); }catch(e){} } }

/* ── links the program owner confirms in config.js ── */
(function(){
  var L = C.links || {};
  function put(sel, url){ if(!url) return; $$(sel).forEach(function(a){ a.href = url; }); }
  put('#historyLink, .lk-history', L.history); put('#vcLink, .lk-vc', L.leadership); put('#factsLink, .lk-facts', L.quickFacts);
  put('#missionLink, #chancellorLink', L.vision); put('[data-survey]', C.surveyUrl);
  if(C.contact){ var n = $('#navPcb'); if(n) n.href = 'mailto:' + C.contact; }
})();

/* ── hero video: plays only while the welcome page is open ── */
var vid = document.getElementById('heroVideo');
if(vid){
  if(reduce){ try{ vid.pause(); vid.removeAttribute('autoplay'); }catch(e){} }
  else {
    var heroSync = function(key){ try{ key === 'home' ? vid.play().catch(function(){}) : vid.pause(); }catch(e){} };
    document.addEventListener('chart:page', function(ev){ heroSync(ev.detail ? ev.detail.key : ''); });
    if(window.chartPager) heroSync(window.chartPager.current().key);
  }
}

/* ── greeting from the URL (?name=), for a personal welcome ── */
(function(){
  var name = '';
  try{ var q = new URLSearchParams(location.search); if(q.get('name')) name = String(q.get('name')).trim().split(/\s+/)[0]; }catch(e){}
  var h = $('#heroHello'); if(h && name) h.textContent = 'Welcome aboard, ' + name + '.';
})();

var nav = $('#nav');
function navShade(idx){ if(nav) nav.classList.toggle('scrolled', idx > 0); }
document.addEventListener('chart:page', function(ev){ navShade(ev.detail ? ev.detail.index : 0); });
if(window.chartPager) navShade(window.chartPager.current().index);
$$('.reveal').forEach(function(el){ el.classList.add('in'); });

/* ══════════ NARRATION: Listen (this page) and Auto (every page) ══════════
   Plays ./assets/audio/voyage/<key>.mp3, recorded from the exact words in
   narration-scripts.js. If the file is missing (or blocked inside an LMS),
   the browser's own speech synthesis reads the same words. */
var NARR = window.VVO_NARR || {};
var narr = { audio:null, playing:false, key:'', auto: get('auto') !== '0', on: get('auto') !== '0', utter:null };
var narrPos = (function(){ try{ var v = JSON.parse(get('narrpos') || '{}'); return v && typeof v === 'object' ? v : {}; }catch(e){ return {}; } })();
function narrPosSave(){ try{ set('narrpos', JSON.stringify(narrPos)); }catch(e){} }
function narrRemember(){
  if(!narr.audio || !narr.key) return;
  var a = narr.audio, t = a.currentTime || 0;
  if(t > 2 && (!a.duration || !isFinite(a.duration) || t < a.duration - 2)) narrPos[narr.key] = Math.max(0, t - 0.6);
  else delete narrPos[narr.key];
  narrPosSave();
}
var bbListen = $('#bbListen'), bbListenT = $('#bbListenT'), bbAuto = $('#bbAuto'), narrToast = $('#narrToast'), toastT = null;
function toast(msg){
  if(!narrToast) return;
  narrToast.textContent = msg; narrToast.classList.add('show');
  if(toastT) window.clearTimeout(toastT);
  toastT = window.setTimeout(function(){ narrToast.classList.remove('show'); }, 2800);
}
function narrKey(){ var c = window.chartPager ? window.chartPager.current() : { key:'home', n:1 }; return c.key + '/' + (c.n || 1); }
function narrUI(){
  if(bbListen){
    bbListen.setAttribute('aria-pressed', narr.playing ? 'true' : 'false');
    bbListen.classList.toggle('playing', narr.playing);
    var backAt = !narr.playing && narrPos[narrKey()] > 0;
    var lab = narr.playing ? 'Stop narration' : backAt ? 'Resume narration where it stopped' : 'Listen to this page';
    bbListen.setAttribute('aria-label', lab); bbListen.setAttribute('title', lab);
    if(bbListenT) bbListenT.textContent = narr.playing ? 'Stop' : backAt ? 'Resume' : 'Listen';
  }
  if(bbAuto) bbAuto.setAttribute('aria-pressed', narr.auto ? 'true' : 'false');
  $$('[data-narr]').forEach(function(b){ var on = narr.playing && narr.key === b.getAttribute('data-narr'); b.classList.toggle('playing', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', on ? 'Stop' : 'Listen to this one'); });
  $$('[data-nk]').forEach(function(c){ c.classList.toggle('playing', narr.playing && narr.key === c.getAttribute('data-nk')); });
}
function narrStop(){
  if(narr.audio){ try{ narrRemember(); narr.audio.pause(); narr.audio.src = ''; }catch(e){} narr.audio = null; }
  if(window.speechSynthesis){ try{ window.speechSynthesis.cancel(); }catch(e){} }
  narr.utter = null; narr.playing = false; narrUI();
}
function narrSpeak(text){
  if(!window.speechSynthesis || !window.SpeechSynthesisUtterance){ narr.playing = false; narrUI(); toast('Narration is not available in this browser.'); return; }
  try{
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1; u.lang = 'en-US';
    var voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    var pick = voices.filter(function(v){ return /^en(-|_)?(US|GB)?/i.test(v.lang) && /Google|Samantha|Karen|Daniel|Serena|Zira|Aria|Natural/i.test(v.name); })[0] || voices.filter(function(v){ return /^en/i.test(v.lang); })[0];
    if(pick) u.voice = pick;
    u.onend = function(){ if(narr.utter === u){ narr.utter = null; narr.playing = false; narrUI(); } };
    u.onerror = function(){ if(narr.utter === u){ narr.utter = null; narr.playing = false; narrUI(); } };
    narr.utter = u; narr.playing = true; narrUI();
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  }catch(e){ narr.playing = false; narrUI(); }
}
/* bumped whenever a clip is re-recorded, so browsers fetch the new file */
var MEDIA_V = C.mediaVersion || '1';
function pauseVideos(){ $$('video').forEach(function(v){ if(v.id !== 'heroVideo' && !v.paused){ try{ v.pause(); }catch(e){} } }); }
function narrPlay(k){
  k = k || narrKey(); var text = NARR[k];
  narrStop(); pauseVideos();
  if(!text){ toast('No narration on this page.'); return; }
  narr.key = k; narr.playing = true; narrUI();
  var a = new Audio('./assets/audio/voyage/' + k.replace(/\//g, '-') + '.mp3?v=' + MEDIA_V);
  a.preload = 'auto';
  a.addEventListener('ended', function(){ if(narr.audio === a){ narr.audio = null; narr.playing = false; delete narrPos[k]; narrPosSave(); narrUI(); } });
  a.addEventListener('error', function(){ if(narr.audio === a){ narr.audio = null; narrSpeak(text); } });
  narr.audio = a;
  var backTo = narrPos[k] || 0;
  if(backTo > 0){
    var seek = function(){ try{ if(narr.audio === a && (!a.duration || !isFinite(a.duration) || backTo < a.duration - 1)) a.currentTime = backTo; }catch(e){} };
    if(a.readyState >= 1) seek(); else a.addEventListener('loadedmetadata', seek);
  }
  var pr = a.play();
  if(pr && pr.catch) pr.catch(function(err){
    if(narr.audio !== a) return;
    narr.audio = null;
    if(err && err.name === 'NotAllowedError'){
      narr.playing = false; narrUI();
      /* the browser will not play sound before the first tap: start on that tap, without nagging */
      if(narr.auto && !narr.armed){ narr.armed = true; var arm = function(){ narr.armed = false; document.removeEventListener('pointerdown', arm, true); document.removeEventListener('keydown', arm, true); window.setTimeout(function(){ if(narr.auto && !narr.playing) narrPlay(); }, 350); }; document.addEventListener('pointerdown', arm, true); document.addEventListener('keydown', arm, true); }
      else if(!narr.auto) toast('Tap Listen to hear this page.');
    }
    else narrSpeak(text);
  });
}
if(bbListen) bbListen.addEventListener('click', function(){ if(narr.playing){ narr.on = false; narrStop(); } else { narr.on = true; narrPlay(); } });
/* a tab, card, or situation with its own clip plays when opened (if the learner is listening), or when its speaker is tapped */
function narrSub(k, force){
  if(!NARR[k]){ if(force) toast('No narration for this one.'); else if(narr.playing) narrStop(); return; }
  delete narrPos[k]; narrPosSave();
  if(force) narr.on = true;
  if(narr.on || narr.auto) narrPlay(k); else if(narr.playing) narrStop();
}
function subBtn(k){ return NARR[k] ? '<button type="button" class="sub-listen" data-narr="' + k + '" aria-pressed="false" aria-label="Listen to this one" title="Listen to this one"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path class="w1" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="w2" d="M19 5a9 9 0 0 1 0 14"/></svg></button>' : ''; }
document.addEventListener('click', function(e){
  var b = e.target.closest('[data-narr]'); if(b){ e.preventDefault(); narrSub(b.getAttribute('data-narr'), true); return; }
  /* clicking into an activity stops whatever is playing, so the audio never talks over the learner */
  if(e.target.closest('.scn button[data-o], [data-drill] button, .flip-btn, .kq button, .cp-opts button, .commit-list button, .idea-tabs button')){ pauseVideos(); if(narr.playing) narrStop(); }
}, true);
if(bbAuto) bbAuto.addEventListener('click', function(){
  narr.auto = !narr.auto; narr.on = narr.auto; set('auto', narr.auto ? '1' : '0'); narrUI();
  if(narr.auto){ toast('Auto-narration on. Each page is read as it turns.'); narrPlay(); }
  else { toast('Auto-narration off.'); narrStop(); }
});
document.addEventListener('chart:page', function(){ narrStop(); delete narrPos[narrKey()]; narrPosSave(); narrUI(); if(narr.auto) window.setTimeout(narrPlay, reduce ? 0 : 380); });
var progFill = $('#progFill');
function pageLine(){ if(!progFill || !window.chartPager) return; var c = window.chartPager.current(), n = window.chartPager.count || 1; progFill.style.width = ((c.index + 1) / n * 100) + '%'; }
document.addEventListener('chart:page', pageLine); window.setTimeout(pageLine, 50);
document.addEventListener('visibilitychange', function(){ if(document.hidden && narr.playing) narrStop(); });
narrUI();
if(narr.auto) window.setTimeout(narrPlay, 600);

/* ══════════ course videos: a waiting card until the file exists; pause on page turn; nothing talks over them ══════════ */
$$('.cv-wrap').forEach(function(w){
  var v = w.querySelector('video'); if(!v) return;
  v.addEventListener('error', function(){ w.classList.add('nomedia'); }, true);
  var src = v.querySelector('source') || v; src.addEventListener && src.addEventListener('error', function(){ w.classList.add('nomedia'); });
  if(v.error) w.classList.add('nomedia');
  document.addEventListener('chart:page', function(){ if(!v.paused) v.pause(); });
});
document.addEventListener('play', function(e){ if(e.target && e.target.tagName === 'VIDEO' && e.target.id !== 'heroVideo') narrStop(); }, true);

/* ══════════ PROGRESS ══════════ */
var SECTIONS = [
  { k:'welcome',  no:'01', name:'Welcome to the Voyage', how:'Open all six lessons' },
  { k:'history',  no:'02', name:'Our history',           how:'Open all four moments' },
  { k:'leaders',  no:'03', name:'Our leadership',        how:'Fact or fiction, four statements' },
  { k:'numbers',  no:'04', name:'By the numbers',        how:'Guess all six numbers' },
  { k:'beliefs',  no:'05', name:'The four beliefs',      how:'Find the best response in each belief’s moment' },
  { k:'compass',  no:'06', name:'Your belief compass',   how:'Answer four questions and see your belief' },
  { k:'grow',     no:'07', name:'Dare to grow',          how:'Find the growth response in three situations' },
  { k:'quiz',     no:'08', name:'A quick check',         how:'Score 4 of 5' },
  { k:'nextstep', no:'09', name:'Next steps',            how:'Agree to all four tasks' }
];
function progIs(k){ return get('p-' + k) === '1'; }
function progWrite(k, v){ set('p-' + k, v ? '1' : null); }
var progList = $('#progList'), progCount = $('#progCount'), progSum = $('#progSum'), progStatus = $('#progStatus'),
    progBtn = $('#progBtn'), progPanel = $('#progPanel');
if(progList) progList.innerHTML = SECTIONS.map(function(s){
  return '<li data-prog-row="' + s.k + '"><a href="#p/' + s.k + '/1"><span class="p-no" aria-hidden="true">' + s.no + '</span>' +
    '<span class="p-name">' + s.name + '<span class="p-how">' + s.how + '</span></span></a>' +
    '<button type="button" class="p-state" data-prog="' + s.k + '" aria-pressed="false" aria-label="Mark ' + s.name + ' done">Mark done</button></li>';
}).join('');
function progRender(changedKey, nowDone){
  var total = SECTIONS.length, doneN = 0;
  SECTIONS.forEach(function(s){ if(progIs(s.k)) doneN++; });
  var left = total - doneN;
  if(progCount) progCount.textContent = doneN + '/' + total;
  if(progSum) progSum.textContent = doneN === total ? 'All ' + total + ' activities complete.' : doneN + ' of ' + total + ' activities complete. ' + left + ' left; each row is a shortcut.';
  SECTIONS.forEach(function(s){
    var done = progIs(s.k);
    var row = progList ? progList.querySelector('[data-prog-row="' + s.k + '"]') : null;
    if(row){
      row.classList.toggle('done', done);
      var st = row.querySelector('.p-state');
      if(st){ st.textContent = done ? 'Completed' : 'Mark done'; st.setAttribute('aria-pressed', done ? 'true' : 'false'); st.setAttribute('aria-label', done ? s.name + ' completed. Select to un-mark.' : 'Mark ' + s.name + ' done'); }
    }
    var dot = $('.bb-dot[data-rail="' + s.k + '"]');
    if(dot){ dot.classList.toggle('done', done); var base = dot.getAttribute('data-name') || s.name; dot.setAttribute('aria-label', base + ', activity ' + (done ? 'done' : 'not done')); dot.setAttribute('title', base + ' · ' + (done ? 'done' : 'not yet')); }
  });
  if(changedKey && progStatus){ var sec = SECTIONS.filter(function(s){ return s.k === changedKey; })[0]; if(sec) progStatus.textContent = (nowDone ? 'Activity complete: ' : 'Activity reopened: ') + sec.name + '. ' + doneN + ' of ' + total + ' complete.'; }
  bbDoneSync();
  if(doneN === total) allDone();
}
var bbDoneBtn = $('#bbDone');
function bbDoneSync(){
  if(!bbDoneBtn) return;
  var curKey = (window.chartPager && window.chartPager.current) ? window.chartPager.current().key : '';
  var sec = SECTIONS.filter(function(s){ return s.k === curKey; })[0];
  if(!sec){ bbDoneBtn.hidden = true; bbDoneBtn.removeAttribute('data-prog'); return; }
  var done = progIs(sec.k);
  bbDoneBtn.hidden = false;
  bbDoneBtn.setAttribute('data-prog', sec.k);
  bbDoneBtn.setAttribute('aria-pressed', done ? 'true' : 'false');
  bbDoneBtn.setAttribute('aria-label', done ? sec.name + ' completed. Select to un-mark.' : 'Mark done: ' + sec.name);
  var t = bbDoneBtn.querySelector('.bb-done-t'); if(t) t.textContent = done ? 'Completed' : 'Mark done';
}
if(bbDoneBtn) bbDoneBtn.addEventListener('click', function(){ var k = bbDoneBtn.getAttribute('data-prog'); if(k) progToggle(k); });
document.addEventListener('chart:page', bbDoneSync);
function progDone(k){ if(progIs(k)) return; progWrite(k, true); progRender(k, true); turnDone(k); }
function progToggle(k){ var v = !progIs(k); progWrite(k, v); progRender(k, v); if(v) turnDone(k); }
function progOpen(open){ if(!progPanel || !progBtn) return; progPanel.hidden = !open; progBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
if(progBtn) progBtn.addEventListener('click', function(){ progOpen(progPanel && progPanel.hidden); });
if(progPanel) progPanel.addEventListener('click', function(e){
  var st = e.target.closest ? e.target.closest('button.p-state') : null;
  if(st){ progToggle(st.getAttribute('data-prog')); return; }
  if(e.target.closest('a')) progOpen(false);
});
document.addEventListener('click', function(e){ if(progPanel && !progPanel.hidden && !e.target.closest('#progPanel') && !e.target.closest('#progBtn')) progOpen(false); });
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') progOpen(false); });
var progReset = $('#progReset');
if(progReset) progReset.addEventListener('click', function(){
  SECTIONS.forEach(function(s){ progWrite(s.k, false); });
  ['done-seen', 'compass', 'belief', 'reflect', 'commit', 'quiz-score'].forEach(function(k){ set(k, null); });
  doneSeen = false;
  if(progStatus) progStatus.textContent = 'Progress reset. 0 of ' + SECTIONS.length + ' activities complete.';
  window.setTimeout(function(){ location.hash = '#p/home/1'; location.reload(); }, 400);
});
if(!store){ var pw = $('#progStorageNote'); if(pw) pw.hidden = false; }

/* ── completion modal (fires once when all nine are done) ── */
var doneSeen = get('done-seen') === '1';
var modalReturn = null;
function allDone(){
  if(doneSeen) return;
  doneSeen = true; set('done-seen', '1');
  window.setTimeout(modalShow, reduce ? 0 : 450);
}
function modalShow(){
  var m = $('#oracleModal'); if(!m || !m.hidden) return;
  var ae = document.activeElement; modalReturn = (ae && ae !== document.body) ? ae : null;
  m.hidden = false;
  if(reduce) m.classList.add('open'); else window.requestAnimationFrame(function(){ m.classList.add('open'); });
  document.body.classList.add('oracle-open');
  var go = $('#oracleGo'); if(go) go.focus();
}
function modalHide(){
  var m = $('#oracleModal'); if(!m || m.hidden) return;
  m.classList.remove('open'); document.body.classList.remove('oracle-open');
  window.setTimeout(function(){ m.hidden = true; }, reduce ? 0 : 260);
  if(modalReturn && modalReturn.focus){ try{ modalReturn.focus(); }catch(e){} } modalReturn = null;
}
['#oracleGo'].forEach(function(s){ var b = $(s); if(b) b.addEventListener('click', modalHide); });
var oOverlay = $('#oracleModal');
if(oOverlay) oOverlay.addEventListener('click', function(e){ if(e.target === oOverlay) modalHide(); });
document.addEventListener('keydown', function(e){
  var m = $('#oracleModal'); if(!m || m.hidden) return;
  if(e.key === 'Escape'){ modalHide(); return; }
  if(e.key !== 'Tab') return;
  var items = $$('a[href], button:not([disabled])', m); if(!items.length) return;
  var first = items[0], last = items[items.length - 1], active = document.activeElement, idx = items.indexOf(active);
  if(idx === -1){ e.preventDefault(); first.focus(); }
  else if(e.shiftKey && active === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && active === last){ e.preventDefault(); first.focus(); }
});

/* ══════════ tap-to-open maps: the six lessons, the history timeline ══════════ */
[{ map:'#voyageMap',  status:'#voyageStatus',  noun:'lessons', prog:'welcome', narr:'welcome/g', done:' Activity complete. Turn the page for lesson 2.' },
 { map:'#historyMap', status:'#historyStatus', noun:'moments', prog:'history', narr:'history/g', done:' Activity complete. Turn the page to meet our leadership.' }].forEach(function(cfg){
  var map = $(cfg.map), status = $(cfg.status); if(!map) return;
  var cards = $$('.fw-card', map), seen = {};
  cards.forEach(function(c, i){
    if(NARR[cfg.narr + (i + 1)]) c.setAttribute('data-nk', cfg.narr + (i + 1));
    c.addEventListener('click', function(){
      var open = c.getAttribute('aria-expanded') !== 'true';
      c.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(open) narrSub(cfg.narr + (i + 1)); else if(narr.playing) narrStop();
      if(open){ seen[i] = 1; var n = Object.keys(seen).length; if(status) status.textContent = n + ' of ' + cards.length + ' ' + cfg.noun + ' opened.' + (n === cards.length ? cfg.done : ''); if(n === cards.length) progDone(cfg.prog); }
    });
  });
});

/* ══════════ your call: one scenario, three responses, consequences ══════════ */
var SCENARIOS = {
  belonging: { h:'Belonging · Your first team meeting', s:'It is your second week. In the team meeting, a colleague who joined a year ago shares an idea that is quite different from how you would approach the problem. The room goes quiet.', opts:[
    { t:'Stay quiet. You are new, and it is not your place yet.', b:'Waiting to be invited', best:false, out:'The moment passes, and so does your chance to show you are part of the team. Once you are chosen, you belong. You do not have to earn a seat you already have.' },
    { t:'“I had not thought about it that way. Can you say more about how it would work?”', b:'Celebrate differences, foster unity', best:true, out:'Your colleague expands the idea, two others build on it, and the meeting finds a better answer than either approach alone. You showed up as a member of the team from week two.' },
    { t:'Point out the flaw in the idea so everyone sees you know your stuff.', b:'Confident, but cutthroat', best:false, out:'You are right about the flaw, and the room remembers the tone. Confident, never cutthroat: here we improve each other rather than compete with each other.' }
  ]},
  selfdir: { h:'Self-direction · The unfamiliar project', s:'Your manager asks who wants to lead a small project using a system nobody on the team knows well, you included. It would stretch you. It would also be uncomfortable.', opts:[
    { t:'Let someone more experienced take it. You will volunteer when you know more.', b:'Waiting for comfort', best:false, out:'Someone else learns the system, and you are still waiting for a comfortable moment that rarely comes. If it is too comfortable, you are not doing it right.' },
    { t:'Volunteer, say plainly what you do not know yet, and ask for fifteen minutes to plan it with your manager.', b:'Embrace discomfort, put in the work', best:true, out:'The first two weeks are hard, and you make a few mistakes you learn from fast. By the end you are the person the team asks about the system. Try, fail, learn, repeat.' },
    { t:'Volunteer, then quietly find a shortcut so nobody sees you struggle.', b:'A shortcut', best:false, out:'The shortcut holds until it does not, and the gap shows up at the worst time. No shortcuts: putting in the work is how the learning sticks.' }
  ]},
  collab: { h:'Collaboration · The request from another office', s:'Someone from another department asks for help with a problem that is not technically your team’s job. You have the knowledge to help, and a busy week.', opts:[
    { t:'Reply that it is outside your area and suggest they find the right office.', b:'Seeing boundaries', best:false, out:'Technically correct, and the problem bounces around for another week. See no boundaries: we work as one community.' },
    { t:'Offer thirty minutes this week to work through it together, and loop in your manager so the time is visible.', b:'Bands do more than soloists', best:true, out:'Thirty minutes solves most of it, the other office learns something, and you have a new contact across campus. High-functioning teams accomplish far more than individuals.' },
    { t:'Take the whole problem on yourself so it gets done right.', b:'Going solo', best:false, out:'It gets done, your week falls apart, and nobody else learns anything. Collaboration means working on it together, not taking it over.' }
  ]},
  growth: { h:'Growth · Feedback on your first project', s:'You get feedback on your first project: the work is solid, and the way you presented it was hard to follow. It stings a little.', opts:[
    { t:'Explain why you presented it that way, so they understand your thinking.', b:'Defending the work', best:false, out:'They understand your reasons, and nothing changes for next time. In competition with yourself, the goal is the next version, not winning the last one.' },
    { t:'Thank them, ask for one example of what clearer would look like, and try it on the next update.', b:'Obsessive self-improvement', best:true, out:'The next update lands well, and you have a colleague who will keep giving you honest feedback. Growth happens in increments, and this was one.' },
    { t:'Nod, say thanks, and decide presenting is just not your strength.', b:'A fixed mindset', best:false, out:'A skill you could build becomes a label you carry. Human potential is realized over a lifetime, and it expands as you grow.' }
  ]},
  grow1: { h:'Situation 1 · A new system', s:'Your team uses a system you have never seen. Everyone else moves through it fast. You have a report due in it on Friday.', opts:[
    { t:'Watch how others do it and hope it clicks by Friday.', b:'Hoping', best:false, out:'It half clicks. Friday is stressful, and the report needs fixing. Growth needs a plan, not just exposure.' },
    { t:'Ask a teammate for twenty minutes to walk through it, and look for a training course in the system.', b:'Leverage the resources', best:true, out:'Twenty minutes and one short course later, you finish the report Thursday. And your teammate now knows you are someone who asks and learns.' },
    { t:'Do the report in a spreadsheet instead and convert it later.', b:'A workaround', best:false, out:'It works once, and next month you are back where you started. The dare is to learn the new thing, not to route around it.' }
  ]},
  grow2: { h:'Situation 2 · A mistake', s:'You sent an email to the wrong list. It is not a disaster, but a few people noticed.', opts:[
    { t:'Say nothing and hope it blows over.', b:'Hiding it', best:false, out:'It mostly blows over, and you miss the chance to show how you handle a mistake. People trust colleagues who own them.' },
    { t:'Send a short correction, tell your manager what happened, and set up a check so it does not happen again.', b:'Try, fail, learn, repeat', best:true, out:'A two-line correction, a thirty-second conversation, and a new habit. Your manager remembers how well you handled it, not the mistake.' },
    { t:'Apologize at length to everyone on the list.', b:'Overcorrecting', best:false, out:'The apology draws more attention than the mistake. Own it briefly, fix it, learn from it, move on.' }
  ]},
  grow3: { h:'Situation 3 · Helping someone else grow', s:'A colleague who started a month after you is stuck on something you figured out last week.', opts:[
    { t:'Let them work it out; that is how you learned.', b:'Pulling up the ladder', best:false, out:'They lose a day you could have saved them. Be the ladder for others.' },
    { t:'Show them what you learned, and share the resource that helped you.', b:'Be the ladder for others', best:true, out:'Fifteen minutes, and they are moving. Growth is collaborative: helping someone else learn is how Vanderbilt grows.' },
    { t:'Do it for them so they are not stuck.', b:'Doing it for them', best:false, out:'They are unstuck today and stuck again next week. Teach the step, do not take it.' }
  ]}
};
/* the best response is not always in the same place */
(function(){
  var POS = { belonging:1, selfdir:2, collab:0, growth:1, grow1:2, grow2:0, grow3:1 };
  Object.keys(POS).forEach(function(k){ var sc = SCENARIOS[k]; if(!sc) return; var bi = -1; sc.opts.forEach(function(o, i){ if(o.best) bi = i; }); if(bi < 0 || bi === POS[k]) return; var o = sc.opts.splice(bi, 1)[0]; sc.opts.splice(POS[k], 0, o); });
})();
function buildScenario(el){
  var name = el.getAttribute('data-scn'), sc = SCENARIOS[name]; if(!sc) return;
  var tried = {};
  el.innerHTML = '<p class="scn-s">' + esc(sc.s) + '</p><div class="scn-opts" role="group" aria-label="Choose your response">' +
    sc.opts.map(function(o, i){ return '<button type="button" data-o="' + i + '" aria-pressed="false"><span class="k" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span><span>' + esc(o.t) + '</span></button>'; }).join('') +
    '</div><div class="scn-out" role="status" aria-live="polite"></div>';
  var out = el.querySelector('.scn-out');
  el.addEventListener('click', function(e){
    var b = e.target.closest('button[data-o]'); if(!b) return;
    var i = parseInt(b.getAttribute('data-o'), 10), o = sc.opts[i];
    tried[i] = 1;
    $$('button[data-o]', el).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    if(o.best) b.classList.add('best-pick');
    var n = Object.keys(tried).length;
    out.innerHTML = '<span class="vtag' + (o.best ? ' best' : '') + '">' + (o.best ? 'The Vanderbilt Way: ' : 'Consider: ') + esc(o.b) + '</span><p>' + esc(o.out) + '</p>' +
      (n < sc.opts.length ? '<p class="scn-again hinttxt">' + (o.best ? 'See what the other responses would have cost. ' : 'Now pick the response that lives the belief. ') + n + ' of ' + sc.opts.length + ' tried.</p>' : '<p class="scn-again hinttxt">All three tried.</p>');
    out.classList.add('show');
  });
}
/* a stepper of scenarios, one at a time; done when the best response is found in each */
var CALL_SETS = { grow:['grow1', 'grow2', 'grow3'] };
var CALL_PROG = { grow:{ prog:'grow', noun:'situations', status:'#growStatus', narr:'grow/s' } };
function buildCalls(el){
  var name = el.getAttribute('data-calls'), keys = CALL_SETS[name]; if(!keys) return;
  var cfg = CALL_PROG[name], status = $(cfg.status), found = {}, cur = 0;
  el.innerHTML = keys.map(function(k, i){
    var sc = SCENARIOS[k];
    return '<div class="cq' + (i === 0 ? ' cur' : '') + '" data-k="' + k + '"><p class="cq-h">' + esc(sc.h) + subBtn(cfg.narr + (i + 1)) + '</p><div class="scn" data-scn="' + k + '"></div><div class="cq-nav">' +
      (i < keys.length - 1 ? '<button type="button" class="btn btn-primary btn-sm" data-next="1" hidden>Next situation<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' : '') +
      (i > 0 ? '<button type="button" class="btn btn-ghost btn-sm" data-prev="1">Back</button>' : '') + '</div></div>';
  }).join('');
  $$('.scn[data-scn]', el).forEach(buildScenario);
  function pips(){ return '<span class="pips" aria-hidden="true">' + keys.map(function(k){ return '<i class="' + (found[k] ? 'ok' : '') + '"></i>'; }).join('') + '</span>'; }
  function paint(){ var n = Object.keys(found).length; if(status) status.innerHTML = pips() + '<span>' + n + ' of ' + keys.length + ' ' + cfg.noun + '.' + (n === keys.length ? ' Activity complete.' : '') + '</span>'; if(n === keys.length) progDone(cfg.prog); }
  function show(i){ $$('.cq', el).forEach(function(q, qi){ q.classList.toggle('cur', qi === i); }); cur = i; var f = $$('.cq', el)[i].querySelector('button:not([hidden])'); if(f) f.focus({ preventScroll:true }); narrSub(cfg.narr + (i + 1)); }
  el.addEventListener('click', function(e){
    if(e.target.closest('button[data-next]')){ show(cur + 1); return; }
    if(e.target.closest('button[data-prev]')){ show(cur - 1); return; }
    var b = e.target.closest('.scn button[data-o]'); if(!b) return;
    var q = b.closest('.cq'), k = q.getAttribute('data-k'), o = SCENARIOS[k].opts[parseInt(b.getAttribute('data-o'), 10)];
    var nx = q.querySelector('button[data-next]'); if(nx) nx.hidden = false;
    if(o.best){ found[k] = 1; paint(); }
  });
  paint();
}
$$('[data-calls]').forEach(buildCalls);

/* ══════════ drills: fact or fiction, guess the number ══════════ */
var DRILLS = {
  leaders: { opts:['Fact', 'Fiction'], prog:'leaders', verb:'decided', items:[
    { s:'Chancellor Diermeier was born in Berlin, Germany.', a:0, x:'Fact. He was born in Berlin and came to Vanderbilt as its chancellor in 2020.' },
    { s:'Chancellor Diermeier is the first in his family to graduate from college.', a:0, x:'Fact. He is a first-generation college graduate, which is part of why access to an elite education matters so much to him.' },
    { s:'Each vice chancellor runs a single academic department.', a:1, x:'Fiction. Vice chancellors lead large parts of the university, such as academic affairs, financial operations, and staff culture and belonging, and guide them toward the mission.' },
    { s:'Under Chancellor Diermeier, Vanderbilt has passed $1 billion in research expenditures.', a:0, x:'Fact. It is one of the milestones of his tenure, along with a successful capital campaign and a reaffirmed commitment to free expression and civil discourse.' }
  ]},
  numbers: { opts:null, prog:'numbers', verb:'guessed', items:[
    { s:'Vanderbilt is a registered arboretum. How many trees and shrubs grow on campus?', opts:['About 650', 'About 6,500', 'About 65,000'], a:1, x:'About 6,500 trees and shrubs, from many species. As a registered arboretum, the campus is a living laboratory for students and researchers studying biodiversity and conservation in a city.' },
    { s:'In 2023, how many beds were used by students and visitors on campus?', opts:['6,400', '1,200', '24,000'], a:0, x:'6,400 beds. On-campus housing is a big part of the community here, and of the work that keeps it running.' },
    { s:'At the 2023 Turkey Toss, an annual employee appreciation event, how many turkeys were given away?', opts:['About 150', 'More than 15,000', 'More than 1,560'], a:2, x:'More than 1,560 turkeys, plus 102 Tofurkeys and 1,000 gift sets. The Turkey Toss is one way Vanderbilt says thank you to its staff.' },
    { s:'How many degrees has Vanderbilt awarded since 1875?', opts:['About 17,000', 'More than 177,000', 'About 1.7 million'], a:1, x:'More than 177,000 degrees. That is nearly one degree for every person in Chattanooga, Tennessee.' },
    { s:'About how many visits do the spaces in the Heard Library get each year?', opts:['About 1.24 million', 'About 124,000', 'About 12,400'], a:0, x:'About 1.24 million visits a year, for books, digital resources, study space, events, and workshops. The library is a hub for learning and collaboration.' },
    { s:'VUIT manages about 51,000 devices. How many voice calls does it handle each day?', opts:['About 5,000', 'About 50,000', 'About 500,000'], a:2, x:'About 500,000 voice calls a day, on top of 51,000 devices. VUIT keeps the whole university connected.' }
  ]}
};
function buildDrill(el){
  var name = el.getAttribute('data-drill'), d = DRILLS[name]; if(!d) return;
  var status = $('#' + name + 'Status'), done = {}, cur = 0, right = 0;
  el.innerHTML = d.items.map(function(it, i){
    var opts = it.opts || d.opts;
    return '<div class="dq' + (i === 0 ? ' cur' : '') + '" data-i="' + i + '"><p class="dq-s"><b>' + (i + 1) + ' of ' + d.items.length + '</b>' + esc(it.s) + subBtn(name + '/q' + (i + 1)) + '</p><div class="dq-opts" role="group" aria-label="Choose one">' +
      opts.map(function(o, oi){ return '<button type="button" data-o="' + oi + '" aria-pressed="false">' + esc(o) + '</button>'; }).join('') +
      '</div><p class="dq-x" role="status"></p><div class="dq-nav">' + (i < d.items.length - 1 ? '<button type="button" class="btn btn-primary btn-sm" data-next="1">Next<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' : '') + '</div></div>';
  }).join('');
  function pips(){ return '<span class="pips" aria-hidden="true">' + d.items.map(function(it, i){ return '<i class="' + (done[i] === 1 ? 'ok' : done[i] === 2 ? 'no' : '') + '"></i>'; }).join('') + '</span>'; }
  function show(i){ $$('.dq', el).forEach(function(q, qi){ q.classList.toggle('cur', qi === i); }); cur = i; var f = $$('.dq', el)[i].querySelector('button:not([disabled])'); if(f) f.focus({ preventScroll:true }); }
  el.addEventListener('click', function(e){
    if(e.target.closest('button[data-narr]')) return;
    var nx = e.target.closest('button[data-next]');
    if(nx){ if(cur < d.items.length - 1) show(cur + 1); return; }
    var b = e.target.closest('button[data-o]'); if(!b || b.disabled) return;
    var q = b.closest('.dq'), i = parseInt(q.getAttribute('data-i'), 10), oi = parseInt(b.getAttribute('data-o'), 10), it = d.items[i], opts = it.opts || d.opts;
    var ok = oi === it.a;
    $$('button[data-o]', q).forEach(function(x){ x.disabled = true; x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); if(parseInt(x.getAttribute('data-o'), 10) === it.a) x.classList.add('is-answer'); });
    q.classList.add(ok ? 'right' : 'wrong');
    q.querySelector('.dq-x').innerHTML = '<b>' + (ok ? 'Right. ' : 'Not quite. The answer is ' + esc(opts[it.a]) + '. ') + '</b>' + esc(it.x);
    done[i] = ok ? 1 : 2; if(ok) right++;
    var n = Object.keys(done).length;
    if(status) status.innerHTML = pips() + '<span>' + n + ' of ' + d.items.length + ' ' + d.verb + '.' + (n === d.items.length ? ' ' + right + ' of ' + d.items.length + ' right. Activity complete.' : '') + '</span>';
    if(n === d.items.length) progDone(d.prog);
  });
  if(status) status.innerHTML = pips() + '<span>0 of ' + d.items.length + ' ' + d.verb + '.</span>';
}
$$('[data-drill]').forEach(buildDrill);

/* ══════════ the four beliefs, one at a time ══════════ */
var BELIEFS = [
  { k:'belonging', name:'Belonging', line:'Once you’re chosen, you belong.', h:'Once you&rsquo;re chosen, you <em>belong</em>.',
    what:'Vanderbilt is intentionally very selective. Only people with the highest potential make the cut. Once you are here, you are surrounded by the best and brightest, brought together for one simple purpose: to improve each other.',
    behaviors:['Confident, never cutthroat', 'When you join, you commit', 'Respect the Vanderbilt Way', 'Create and cultivate conditions for success', 'Celebrate differences', 'Foster unity'],
    week:'Introduce yourself to one person outside your team, and ask what they are working on.' },
  { k:'selfdir', name:'Self-direction', line:'Choose your own path, and go all in.', h:'Choose your own path, and go all <em>in</em>.',
    what:'Personal purpose is found through relentless exploration and challenge. If it is too comfortable, you are not doing it right. Experience as much as you can. And once you discover your path, give it everything you have.',
    behaviors:['Try, fail, learn, repeat', 'Embrace discomfort', 'Ready to change your mind', 'Put in the work', 'No shortcuts', 'Prove the doubters wrong'],
    week:'Say yes to one task this week that stretches you, and tell your manager what you want to learn from it.' },
  { k:'collab', name:'Collaboration', line:'Teams challenge and support each other.', h:'Teams challenge and support each <em>other</em>.',
    what:'Our goal as a community is to work as one. By challenging and supporting one another, high-functioning teams accomplish far more than individuals. Only by rallying around a common purpose can we truly multiply our individual potential.',
    behaviors:['Bands do more than soloists', 'Ditch the ego', 'See no boundaries', 'Pioneer together', 'Challenge directly', 'Respect the person', 'Redefine “possible”'],
    week:'Ask a teammate for their honest take on something you are working on, and use it.' },
  { k:'growth', name:'Growth', line:'We never stop growing and achieving.', h:'We never stop growing and <em>achieving</em>.',
    what:'A permanent growth mindset matters more than any single achievement, however big. Human potential is realized over a lifetime, in increments and leaps, and it expands as you grow.',
    behaviors:['Growing the whole person', 'Obsessive self-improvement', 'In competition with yourself', 'Be the ladder for others', 'Lifelong leveling up'],
    week:'Pick one skill you want to be better at in ninety days, and bring it to your next one-on-one.' }
];
(function(){
  var box = $('#beliefsBox'), status = $('#beliefsStatus'); if(!box) return;
  var cur = -1, seen = {}, found = {};
  box.innerHTML = '<div class="idea-tabs" role="tablist" aria-label="The four beliefs">' + BELIEFS.map(function(it, i){ return '<button type="button" role="tab" aria-selected="false" data-tab="' + i + '">' + (i + 1) + ' &middot; ' + it.name + '</button>'; }).join('') + '</div>' +
    '<div class="idea idea-intro cur" role="region" aria-label="About the four beliefs"><span class="who-is">Start here</span><h3>Explore our <em>beliefs</em>.</h3>' +
      '<div class="intro-copy"><p>At Vanderbilt we offer more than an education: a journey of exceptional learning, opportunity, and experience. Four core beliefs guide it, and they guide how we work together, too.</p>' +
      '<p><b>How this works.</b> Each belief gives you what it means, the behaviors that show it, and one thing to try this week. Then a short moment to apply it. After all four, the belief compass helps you find the one that fits you best.</p>' +
      '<p class="intro-cta"><button type="button" class="btn btn-primary btn-sm" data-tab="0">Start with belonging<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></p></div>' +
      '<ol class="intro-list" aria-label="The four beliefs">' + BELIEFS.map(function(it, i){ return '<li><button type="button" data-tab="' + i + '"><span class="il-no">' + (i + 1) + '</span><span class="il-t"><b>' + it.name + '</b><span>' + esc(it.line) + '</span></span></button></li>'; }).join('') + '</ol></div>' +
    BELIEFS.map(function(it, i){
      return '<div class="idea" role="tabpanel" data-i="' + i + '"><span class="who-is">' + it.name + subBtn('beliefs/t' + (i + 1)) + '</span><h3>' + it.h + '</h3>' +
        '<p class="blk"><b>What it means</b>' + esc(it.what) + '</p>' +
        '<div class="blk"><b>The behaviors</b><ul class="behaviors">' + it.behaviors.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="side"><div class="week"><b>Try it this week</b>' + esc(it.week) + '</div></div>' +
        '<div class="try"><p class="cq-h"><span class="mono">Apply it</span><span class="try-t">' + esc(SCENARIOS[it.k].h) + '</span>' + subBtn('beliefs/m' + (i + 1)) + '<span class="try-note">Tap the response you would give, then try the other two.</span></p><div class="scn" data-scn="' + it.k + '"></div></div>' +
        '<div class="idea-nav">' + (i > 0 ? '<button type="button" class="btn btn-ghost btn-sm" data-prev="1">Back</button>' : '') + (i < BELIEFS.length - 1 ? '<button type="button" class="btn btn-primary btn-sm" data-next="1">Next belief<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' : '<span class="hinttxt">All four read. Turn the page for your belief compass.</span>') + '</div></div>';
    }).join('');
  function show(i){
    cur = i; seen[i] = 1;
    var intro = box.querySelector('.idea-intro'); if(intro) intro.classList.remove('cur');
    $$('.idea[data-i]', box).forEach(function(p, pi){ p.classList.toggle('cur', pi === i); });
    $$('.idea-tabs button', box).forEach(function(t, ti){ t.setAttribute('aria-selected', ti === i ? 'true' : 'false'); t.classList.toggle('seen', !!seen[ti]); });
    paint();
    if(window.chartPager && window.chartPager.current().key === 'beliefs'){ var f = $$('.idea[data-i]', box)[i].querySelector('.idea-nav button'); if(f) f.focus({ preventScroll:true }); }
    narrSub('beliefs/t' + (i + 1));
  }
  function paint(){ var n = Object.keys(seen).length, f = Object.keys(found).length; if(status) status.textContent = n + ' of 4 beliefs. ' + f + ' of 4 moments.' + (f === 4 ? ' Activity complete.' : n === 4 && f < 4 ? ' Find the best response in each moment.' : ''); if(f === 4) progDone('beliefs'); }
  $$('.scn[data-scn]', box).forEach(buildScenario);
  box.addEventListener('click', function(e){
    var b = e.target.closest('.scn button[data-o]'); if(b){ var k = b.closest('.scn').getAttribute('data-scn'); if(SCENARIOS[k].opts[parseInt(b.getAttribute('data-o'), 10)].best){ found[k] = 1; paint(); } return; }
    var t = e.target.closest('button[data-tab]'); if(t){ show(parseInt(t.getAttribute('data-tab'), 10)); return; }
    if(e.target.closest('button[data-next]')){ show(Math.min(Math.max(cur, 0) + 1, BELIEFS.length - 1)); return; }
    if(e.target.closest('button[data-prev]')){ show(Math.max(cur - 1, 0)); }
  });
})();

/* ══════════ the belief compass: four questions, one belief, one reflection ══════════
   Replaces the chat agent in the original course. Each answer points to a
   belief; the most-picked one (the latest pick breaks a tie) is the result.
   The result, and the reflection, carry into the message to the manager. */
var COMPASS = [
  { q:'It is a free afternoon at work. What do you reach for first?', o:[
    ['belonging', 'Getting to know the people around me'], ['selfdir', 'Something new I have never tried'], ['collab', 'A problem I can work on with others'], ['growth', 'A skill I want to get better at'] ]},
  { q:'Which compliment would mean the most to you?', o:[
    ['collab', '“The team is better when you are on it.”'], ['growth', '“You are not the same person you were a year ago.”'], ['belonging', '“You make people feel welcome here.”'], ['selfdir', '“You went all in, and it showed.”'] ]},
  { q:'A project gets hard. What keeps you going?', o:[
    ['selfdir', 'I chose this, and I finish what I choose'], ['belonging', 'The people counting on me'], ['growth', 'What I am learning along the way'], ['collab', 'Working it out together'] ]},
  { q:'Picture yourself a year from now. What would make you proudest?', o:[
    ['growth', 'How much I have grown'], ['collab', 'What my team accomplished together'], ['selfdir', 'That I found my path here and went for it'], ['belonging', 'That this place feels like mine'] ]}
];
var BELIEF_BY_KEY = {}; BELIEFS.forEach(function(b){ BELIEF_BY_KEY[b.k] = b; });
(function(){
  var box = $('#compassBox'), status = $('#compassStatus'); if(!box) return;
  var ans = (function(){ try{ var v = JSON.parse(get('compass') || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } })();
  box.innerHTML = '<div class="cp-steps">' + COMPASS.map(function(c, i){
      return '<div class="cp-q" data-i="' + i + '"><p class="cp-h"><span class="mono">' + (i + 1) + ' of ' + COMPASS.length + '</span>' + esc(c.q) + '</p><div class="cp-opts" role="group" aria-label="' + esc(c.q) + '">' +
        c.o.map(function(o){ return '<button type="button" data-b="' + o[0] + '" aria-pressed="false">' + esc(o[1]) + '</button>'; }).join('') + '</div></div>';
    }).join('') + '</div>' +
    '<div class="cp-result" id="cpResult" role="status" aria-live="polite"></div>';
  var result = $('#cpResult');
  function winner(){
    var tally = {}, best = null, bestN = 0;
    ans.forEach(function(k){ if(!k) return; tally[k] = (tally[k] || 0) + 1; if(tally[k] >= bestN){ bestN = tally[k]; best = k; } });
    return best;
  }
  function paint(){
    $$('.cp-q', box).forEach(function(q, i){ $$('button', q).forEach(function(b){ b.setAttribute('aria-pressed', ans[i] === b.getAttribute('data-b') ? 'true' : 'false'); }); q.classList.toggle('answered', !!ans[i]); });
    var n = ans.filter(Boolean).length;
    if(status) status.textContent = n + ' of ' + COMPASS.length + ' answered.' + (n === COMPASS.length ? ' Activity complete. Your belief is below.' : '');
    if(n < COMPASS.length){ result.innerHTML = ''; result.classList.remove('show'); return; }
    var w = BELIEF_BY_KEY[winner()]; if(!w) return;
    set('belief', w.name);
    result.innerHTML = '<span class="mono">Your compass points to</span><h3>' + esc(w.name) + subBtn('compass/' + w.k) + '</h3><p class="cp-line">' + esc(w.line) + '</p>' +
      '<p>Every belief matters here, and you will live all four. This is the one that sounds most like you right now. Two behaviors to start with: <b>' + esc(w.behaviors[0]) + '</b> and <b>' + esc(w.behaviors[1]) + '</b>.</p>' +
      '<div class="field"><label for="cpReflect">How will you embody ' + esc(w.name.toLowerCase()) + ' in how you show up to work? One or two sentences, for you and your manager.</label>' +
      '<textarea id="cpReflect" rows="3" placeholder="For example: I will ask one colleague outside my team what they are working on each week."></textarea><p class="hinttxt">Saved in this browser only. It carries into the message to your manager on the next steps page.</p></div>';
    result.classList.add('show');
    var ta = $('#cpReflect'); ta.value = get('reflect') || '';
    ta.addEventListener('input', function(){ set('reflect', ta.value); tellPaint(); });
    progDone('compass');
    tellPaint();
  }
  box.addEventListener('click', function(e){
    var b = e.target.closest('.cp-opts button'); if(!b) return;
    var i = parseInt(b.closest('.cp-q').getAttribute('data-i'), 10);
    ans[i] = b.getAttribute('data-b'); set('compass', JSON.stringify(ans));
    var had = result.classList.contains('show');
    paint();
    if(!had && result.classList.contains('show')){ var w = BELIEF_BY_KEY[winner()]; if(w) narrSub('compass/' + w.k); }
    else { var nq = $$('.cp-q', box)[i + 1]; if(nq && !ans[i + 1]){ var f = nq.querySelector('button'); if(f) f.focus({ preventScroll:false }); } }
  });
  paint();
})();

/* ══════════ next steps: four commitments, and the message to the manager ══════════ */
var COMMITS = [
  'I will discuss with my manager which belief I most closely align with, and how it will help guide how I show up to work.',
  'I will work with my manager to put my professional development plan into action, building on my strengths and growing my opportunities.',
  'I will complete all of my required compliance education.',
  'I will finish all other tasks, including additional courses such as the Benefits Information Course, and complete the Vanderbilt Voyage Day One Survey.'
];
function tellPaint(){
  var tell = $('#tellText'), copy = $('#copyTell'); if(!tell) return;
  var b = get('belief'), r = (get('reflect') || '').trim();
  var msg = 'I just finished Vanderbilt Voyage Online. The belief I align with most is ' + (b ? b.toLowerCase() : '[belief]') + ', and I want it to guide how I show up to work.' + (r ? ' Here is how I plan to show it: ' + r + (/[.!?]$/.test(r) ? '' : '.') : '') + ' Can we talk about it, and about my development plan, in our next one-on-one?';
  tell.textContent = '“' + msg + '”';
  if(copy) copy.setAttribute('data-copytext', msg);
}
(function(){
  var list = $('#commitList'), status = $('#commitStatus'); if(!list) return;
  var on = (function(){ try{ var v = JSON.parse(get('commit') || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } })();
  list.innerHTML = COMMITS.map(function(t, i){ return '<button type="button" role="checkbox" aria-checked="false" data-c="' + i + '"><span class="cb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span><span>' + esc(t) + '</span></button>'; }).join('');
  function paint(){
    $$('button[data-c]', list).forEach(function(b){ b.setAttribute('aria-checked', on[+b.getAttribute('data-c')] ? 'true' : 'false'); });
    var n = on.filter(Boolean).length;
    if(status) status.textContent = n + ' of ' + COMMITS.length + ' agreed.' + (n === COMMITS.length ? ' Activity complete. Send the message below to your manager.' : '');
    if(n === COMMITS.length) progDone('nextstep');
  }
  list.addEventListener('click', function(e){ var b = e.target.closest('button[data-c]'); if(!b) return; var i = +b.getAttribute('data-c'); on[i] = !on[i]; set('commit', JSON.stringify(on)); paint(); });
  paint();
  tellPaint();
})();

/* ══════════ knowledge check: five questions, one at a time, feedback after each ══════════ */
var QUIZ = [
  { seg:'The mission', q:'What is Vanderbilt’s vision?', opts:['To be the largest university in the South', 'To define the great university of the 21st century, and be it', 'To lead every national ranking', 'To keep things the way they have always been'], a:1, x:'Define the great university of the 21st century, and be it, operating at uncommon speed, agility, and scale.' },
  { seg:'Our history', q:'What does Vanderbilt’s motto, Crescere aude, mean?', opts:['Knowledge is power', 'Dare to grow', 'Together we rise', 'Truth and service'], a:1, x:'Crescere aude is Latin for dare to grow. It is a motto and a mindset.' },
  { seg:'The four beliefs', q:'Which list names Vanderbilt’s four beliefs?', opts:['Excellence, integrity, service, respect', 'Belonging, self-direction, collaboration, growth', 'Speed, agility, scale, impact', 'Teaching, research, service, health'], a:1, x:'Belonging, self-direction, collaboration, and growth. Together they are the Vanderbilt Way.' },
  { seg:'The four beliefs', q:'“If it is too comfortable, you are not doing it right.” Which belief is that?', opts:['Belonging', 'Collaboration', 'Self-direction', 'Growth'], a:2, x:'Self-direction: choose your own path, and go all in. Embrace discomfort, and put in the work.' },
  { seg:'Next steps', q:'What is the first conversation to have with your manager after this course?', opts:['Which belief you align with most, and your development plan', 'Your salary for next year', 'Which course to skip', 'Nothing; the course covers it all'], a:0, x:'Talk about the belief you align with and how it will guide your work, then put your development plan into action together.' }
];
(function(){ var POS = [1, 3, 0, 2, 0]; QUIZ.forEach(function(q, i){ var t = POS[i]; if(t === undefined || t === q.a || t >= q.opts.length) return; var o = q.opts.splice(q.a, 1)[0]; q.opts.splice(t, 0, o); q.a = t; }); })();
(function(){
  var box = $('#quizBox'), status = $('#quizStatus'), done = $('#quizDone'); if(!box) return;
  var PASS = 4, cur = 0, score = 0, answered = {};
  function render(){
    cur = 0; score = 0; answered = {};
    box.innerHTML = QUIZ.map(function(it, i){
      return '<div class="kq' + (i === 0 ? ' cur' : '') + '" data-i="' + i + '"><p class="kq-q"><span class="qn">' + (i + 1) + ' of ' + QUIZ.length + ' &middot; ' + esc(it.seg) + '</span><br>' + esc(it.q) + '</p><div class="kq-opts" role="group" aria-label="Choose one">' +
        it.opts.map(function(o, oi){ return '<button type="button" data-o="' + oi + '" aria-pressed="false">' + esc(o) + '</button>'; }).join('') +
        '</div><p class="kq-x" role="status"></p><div class="kq-nav">' + (i < QUIZ.length - 1 ? '<button type="button" class="btn btn-primary btn-sm" data-next="1">Next question<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' : '<button type="button" class="btn btn-primary btn-sm" data-finish="1">See my score</button>') + '</div></div>';
    }).join('');
    done.classList.remove('show'); done.innerHTML = '';
    if(status) status.textContent = '0 of ' + QUIZ.length + ' answered.';
  }
  function show(i){ $$('.kq', box).forEach(function(q, qi){ q.classList.toggle('cur', qi === i); }); cur = i; var f = $$('.kq', box)[i].querySelector('button:not([disabled])'); if(f) f.focus({ preventScroll:true }); }
  function finish(){
    var t = score === QUIZ.length ? ['Gold standard.', 'Perfect. Turn the page for your next steps.'] : score >= PASS ? ['Well done.', 'Reread the explanation under the one you missed, then turn the page.'] : ['Almost there.', 'Four of five finishes the check. Each explanation names the lesson to revisit; then retake it.'];
    done.innerHTML = '<div class="big-score">' + score + ' / ' + QUIZ.length + '</div><h3>' + t[0] + '</h3><p>' + t[1] + '</p><button type="button" class="btn btn-ghost btn-sm" id="quizRetake">Retake the check</button>';
    done.classList.add('show');
    $$('.kq', box).forEach(function(q){ q.classList.remove('cur'); });
    set('quiz-score', String(score));
    if(score >= PASS) progDone('quiz');
    $('#quizRetake').addEventListener('click', render);
    if(window.chartPager) window.chartPager.goToEl(done);
  }
  box.addEventListener('click', function(e){
    if(e.target.closest('button[data-next]')){ show(cur + 1); return; }
    if(e.target.closest('button[data-finish]')){ finish(); return; }
    var b = e.target.closest('button[data-o]'); if(!b || b.disabled) return;
    var q = b.closest('.kq'), i = parseInt(q.getAttribute('data-i'), 10), oi = parseInt(b.getAttribute('data-o'), 10), it = QUIZ[i];
    var ok = oi === it.a;
    $$('button[data-o]', q).forEach(function(x){ x.disabled = true; x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); if(parseInt(x.getAttribute('data-o'), 10) === it.a) x.classList.add('is-answer'); });
    q.classList.add(ok ? 'right' : 'wrong');
    q.querySelector('.kq-x').innerHTML = '<b>' + (ok ? 'Right. ' : 'Not quite. The answer is: ' + esc(it.opts[it.a]) + '. ') + '</b>' + esc(it.x);
    if(!answered[i]){ answered[i] = 1; if(ok) score++; }
    if(status) status.textContent = Object.keys(answered).length + ' of ' + QUIZ.length + ' answered.';
  });
  render();
})();

/* ══════════ "Your turn": a callout above every activity, gold check when done ══════════ */
var TURNS = [
  { sel:'#voyageMap',    prog:'welcome',  text:'Tap each lesson to open it and hear what is inside.' },
  { sel:'#historyMap',   prog:'history',  text:'Tap each moment to open it.' },
  { sel:'#leadersDrill', prog:'leaders',  text:'Four statements. Tap fact or fiction.' },
  { sel:'#numbersDrill', prog:'numbers',  text:'Make your best guess, then read the story behind the number.' },
  { sel:'#beliefsBox',   prog:'beliefs',  text:'Read each belief, then apply it in the moment below it. Tap the response you would give, and try the other two.' },
  { sel:'#compassBox',   prog:'compass',  text:'Four questions. Pick the answer that sounds most like you. There are no wrong answers.' },
  { sel:'#growCalls',    prog:'grow',     text:'Tap the response you would give, then try the other two.' },
  { sel:'#quizBox',      prog:'quiz',     text:'Five questions. Four of five finishes the check.' },
  { sel:'#commitList',   prog:'nextstep', text:'Read each task and tap to agree.' }
];
function turnHTML(t){ return '<div class="turn"' + (t.prog ? ' data-turn="' + t.prog + '"' : '') + ' role="note"><span class="t-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><div><span class="mono">Your turn</span><p>' + esc(t.text) + '</p></div></div>'; }
TURNS.forEach(function(t){
  var el = $(t.sel); if(!el) return;
  var wrap = document.createElement('div'); wrap.className = 'turn-wrap'; el.parentNode.insertBefore(wrap, el); wrap.innerHTML = turnHTML(t); wrap.appendChild(el);
});
function turnDone(k){ $$('.turn[data-turn="' + k + '"]').forEach(function(t){ t.classList.add('done'); t.querySelector('.t-ic').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'; t.querySelector('.mono').textContent = 'Done'; }); }
SECTIONS.forEach(function(s){ if(progIs(s.k)) turnDone(s.k); });

/* ══════════ copy to clipboard ══════════ */
$$('[data-copytext]').forEach(function(b){
  b.addEventListener('click', function(){
    var txt = b.getAttribute('data-copytext');
    var ok = function(){ var o = b.textContent; b.textContent = 'Copied'; setTimeout(function(){ b.textContent = o; }, 1600); };
    if(navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function(){ window.prompt('Copy this:', txt); });
    else window.prompt('Copy this:', txt);
  });
});

/* ══════════ exit: close the window when the LMS opened it, otherwise back to the start ══════════ */
(function(){
  var b = $('#exitBtn'); if(!b) return;
  b.addEventListener('click', function(){
    narrStop();
    if(C.exitUrl){ location.href = C.exitUrl; return; }
    try{ window.close(); }catch(e){}
    window.setTimeout(function(){ if(window.chartPager) window.chartPager.go(0, { focus:true }); toast('You can close this tab. Welcome to Vanderbilt.'); }, 200);
  });
})();

progRender();
/* for tests */
window.VVO_COURSE = { SCENARIOS: SCENARIOS, QUIZ: QUIZ, BELIEFS: BELIEFS, COMPASS: COMPASS, DRILLS: DRILLS };
})();
