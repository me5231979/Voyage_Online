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
/* bump the version to start every learner fresh (review resets); old keys are cleared */
var KEY = 'vvo2-';
try{ Object.keys(window.localStorage).forEach(function(k){ if(/^vvo-/.test(k)) window.localStorage.removeItem(k); }); }catch(e){}
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
function textHash(t){ var h = 5381; for(var i = 0; i < t.length; i++){ h = ((h << 5) + h + t.charCodeAt(i)) | 0; } return (h >>> 0).toString(36); }
function pauseVideos(){
  $$('video').forEach(function(v){ if(v.id !== 'heroVideo' && !v.paused){ try{ v.pause(); }catch(e){} } });
  /* hosted players (Vimeo) pause through their postMessage API */
  $$('.v-video iframe').forEach(function(f){ try{ f.contentWindow.postMessage(JSON.stringify({ method:'pause' }), 'https://player.vimeo.com'); }catch(e){} });
}
/* a video starting, from our play button or the player's own controls, stops the narration */
window.addEventListener('message', function(e){
  if(!/^https:\/\/player\.vimeo\.com$/.test(e.origin)) return;
  var d = e.data; if(typeof d === 'string'){ try{ d = JSON.parse(d); }catch(err){ return; } }
  if(!d || !d.event) return;
  if(d.event === 'ready'){ ['play', 'playing'].forEach(function(ev){ try{ e.source.postMessage(JSON.stringify({ method:'addEventListener', value:ev }), e.origin); }catch(err){} }); }
  else if(d.event === 'play' || d.event === 'playing'){ if(narr.playing) narrStop(); }
});
function narrPlay(k){
  k = k || narrKey(); var text = NARR[k];
  narrStop(); pauseVideos();
  if(!text){ toast('No narration on this page.'); return; }
  narr.key = k; narr.playing = true; narrUI();
  /* the version carries a hash of the script, so a re-recorded clip is never served from an old cache */
  var a = new Audio('./assets/audio/voyage/' + k.replace(/\//g, '-') + '.mp3?v=' + MEDIA_V + '-' + textHash(text));
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
  if(e.target.closest('.scn button[data-o], [data-drill] button, .kq button, .cp-opts button, .v-commits button, .v-tile button')){ pauseVideos(); if(narr.playing) narrStop(); }
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

/* ══════════ course videos: a placeholder image until config.js names the file ══════════
   Swapping in a video is one line in config.js (videos.<slot>.src, plus
   captions). Until then the slot shows its still with "Video coming soon". */
$$('[data-video]').forEach(function(f){
  var key = f.getAttribute('data-video'), cfg = (C.videos || {})[key] || {}, cap = f.getAttribute('data-caption') || 'Video';
  var ph = f.querySelector('.v-ph');
  if(cfg.ratio) f.style.aspectRatio = cfg.ratio;
  /* a Vimeo slot takes the video's real shape, so the box always matches the video */
  else if(cfg.embed && /player\.vimeo\.com\/video\/(\d+)/.test(cfg.embed) && window.fetch){
    var vid = cfg.embed.match(/video\/(\d+)/)[1], vh = (cfg.embed.match(/[?&]h=([0-9a-f]+)/) || [])[1];
    try{ fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent('https://vimeo.com/' + vid + (vh ? '/' + vh : ''))).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if(d && d.width && d.height) f.style.aspectRatio = d.width + ' / ' + d.height; }, function(){}); }catch(e){}
  }
  /* a hosted player (Vimeo, YouTube): the still stays until the learner taps play, then the player loads in place */
  if(cfg.embed){
    f.classList.add('facade');
    var play = document.createElement('button');
    play.type = 'button'; play.className = 'v-play';
    play.setAttribute('aria-label', 'Play video: ' + cap);
    play.innerHTML = '<span class="v-ph-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>';
    f.appendChild(play);
    var frame = null;
    play.addEventListener('click', function(){
      narrStop();
      frame = document.createElement('iframe');
      frame.src = cfg.embed + (cfg.embed.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
      frame.title = cfg.title || cap;
      frame.allow = 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share';
      frame.setAttribute('allowfullscreen', '');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      f.appendChild(frame); f.classList.add('playing');
      frame.focus();
    });
    /* turning the page stops the video: the player goes, the still comes back */
    document.addEventListener('chart:page', function(){ if(frame){ frame.remove(); frame = null; f.classList.remove('playing'); } });
    return;
  }
  if(!cfg.src){ f.classList.add('nomedia'); f.setAttribute('role', 'img'); f.setAttribute('aria-label', cap + '. Video coming soon.'); return; }
  var v = document.createElement('video');
  v.controls = true; v.setAttribute('playsinline', ''); v.preload = 'metadata';
  if(ph) v.poster = ph.getAttribute('src');
  v.src = cfg.src; v.setAttribute('aria-label', cap + '. Video' + (cfg.captions ? ', with captions.' : '.'));
  if(cfg.captions){ var t = document.createElement('track'); t.kind = 'captions'; t.src = cfg.captions; t.srclang = 'en'; t.label = 'English'; t.default = true; v.appendChild(t); }
  f.insertBefore(v, f.firstChild);
  v.addEventListener('error', function(){ f.classList.add('nomedia'); });
  v.addEventListener('play', function(){ f.classList.add('playing'); narrStop(); });
  v.addEventListener('pause', function(){ f.classList.remove('playing'); });
  document.addEventListener('chart:page', function(){ if(!v.paused) v.pause(); });
});

/* ══════════ PROGRESS ══════════ */
var SECTIONS = [
  { k:'welcome',  no:'01', name:'Welcome to the Voyage', how:'Visit all six stops' },
  { k:'history',  no:'02', name:'Our history',           how:'Visit every moment on the timeline' },
  { k:'leaders',  no:'03', name:'Our leadership',        how:'Fact or fiction, four statements' },
  { k:'numbers',  no:'04', name:'By the numbers',        how:'Guess all seven numbers' },
  { k:'beliefs',  no:'05', name:'The four beliefs',      how:'Find the best response in each belief’s moment' },
  { k:'compass',  no:'06', name:'Your belief compass',   how:'Answer four questions and see your belief' },
  { k:'grow',     no:'07', name:'Dare to grow',          how:'Find the growth response in three situations' },
  { k:'quiz',     no:'08', name:'A quick check',         how:'Score 4 of 5' },
  { k:'nextstep', no:'09', name:'Next steps',            how:'Commit to all four moves' }
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
  /* everything this course saved: progress, answers, compass, commitments, hunt, narration spots */
  mem = {};
  if(store){ try{ Object.keys(store).forEach(function(k){ if(k.indexOf(KEY) === 0 && k !== KEY + 'auto') store.removeItem(k); }); store.removeItem('vvo2-page'); }catch(e){} }
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

/* ══════════ task chips: the instruction above each activity turns gold with a check when done ══════════ */
function turnDone(k){ $$('.v-task[data-task="' + k + '"]').forEach(function(t){ t.classList.add('done'); }); }

/* ══════════ mission: the three areas of focus open in place ══════════ */
(function(){
  var list = $('#focusList'); if(!list) return;
  var chip = list.parentNode.querySelector('.v-task'), seen = {};
  $$('button', list).forEach(function(b, i){ b.addEventListener('click', function(){ var o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', o ? 'true' : 'false'); if(o){ seen[i] = 1; if(Object.keys(seen).length === 3 && chip) chip.classList.add('done'); narrSub('mission/f' + (i + 1), true); } else if(narr.key === 'mission/f' + (i + 1) && narr.playing) narrStop(); }); });
})();

/* ══════════ mission: five cities, each for its own field ══════════
   Growth is not a copy of Nashville: each city puts Vanderbilt where a field leads. */
var CITIES = {
  nashville:   { name:'Nashville', focus:'Home', line:'Our home since 1873: the residential campus and the heart of the university. It is where the Voyage begins.', url:'https://www.vanderbilt.edu/' },
  chattanooga: { name:'Chattanooga', focus:'Quantum', line:'The Institute for Quantum Innovation, launched with EPB in July 2026: about 250 researchers, faculty, and staff, working with the EPB Quantum Center, the first U.S. site with commercial access to both a trapped-ion quantum computer and a quantum network.', url:'https://www.vanderbilt.edu/chancellor/initiatives-and-outreach/growth/quantum-innovation/' },
  nyc:         { name:'New York City', focus:'Business and technology', line:'Our first campus beyond Nashville, open since August 2026: 13 buildings on 2.7 acres in Chelsea, with an undergraduate semester program and a Master of Science in Business and Technology.', url:'https://www.vanderbilt.edu/nyc/' },
  wpb:         { name:'West Palm Beach', focus:'Business, engineering, and AI', line:'A graduate campus for business, engineering, data science, and AI, with programs planned in finance and in space and defense technology: about 1,000 graduate students and 100 faculty.', url:'https://www.vanderbilt.edu/chancellor/initiatives-and-outreach/growth/west-palm-beach/' },
  sf:          { name:'San Francisco', focus:'Art, design, and technology', line:'Opens for the 2027 to 2028 school year on the California College of the Arts campus, home to the Huang College of Art, Architecture and Design, which blends art and design with engineering and AI: about 1,000 students.', url:'https://www.vanderbilt.edu/chancellor/initiatives-and-outreach/growth/san-francisco/' }
};
(function(){
  var map = $('#cities .us-map'), chips = $('#cities .v-cities'), card = $('#cityCard'), cchip = $('#cities .v-task'), cseen = {}; if(!map || !chips || !card) return;
  function show(k){
    var c = CITIES[k]; if(!c) return;
    cseen[k] = 1; if(cchip && Object.keys(cseen).length === 5) cchip.classList.add('done');
    $$('.pin, .lbl', map).forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-city') === k); });
    $$('button[data-city]', chips).forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-city') === k ? 'true' : 'false'); });
    var ic = map.querySelector('.pin[data-city="' + k + '"] .ic');
    card.innerHTML = '<span class="v-label">' + (ic ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + ic.innerHTML + '</svg>' : '') + esc(c.focus) + '</span><b>' + esc(c.name) + '</b><p>' + esc(c.line) + '</p><a href="' + esc(c.url) + '" target="_blank" rel="noopener">Read more about ' + esc(c.name) + '</a>';
  }
  chips.addEventListener('click', function(e){ var b = e.target.closest('button[data-city]'); if(b) show(b.getAttribute('data-city')); });
  map.addEventListener('click', function(e){ var p = e.target.closest('.pin, .lbl'); if(p) show(p.getAttribute('data-city')); });
})();

/* ══════════ lesson 1: our growth, in the news ══════════
   Press coverage of the campus network, filterable by campus. Headlines are
   the outlets' own; the one-line takeaways summarize the reporting. */
var PRESS = [
  { c:'nyc', src:'Vanderbilt News', d:'Aug 27, 2026', h:'Start spreading the news… Vanderbilt University New York City is open!', t:'The first campus beyond Nashville opens in Chelsea, and the Chancellor rings the Nasdaq opening bell to welcome its first students.', u:'https://news.vanderbilt.edu/2026/08/27/start-spreading-the-news-vanderbilt-university-new-york-city-is-open/' },
  { c:'nyc', src:'Chelsea Community News', d:'Aug 26, 2026', h:'If You ‘VanderBuild’ It, They Will Come', t:'The neighborhood view of a campus spanning nearly a full city block: 13 buildings on 2.7 acres.', u:'https://chelseacommunitynews.com/2026/08/26/if-you-vanderbuild-it-they-will-come-tn-based-university-launches-satellite-in-chelsea/' },
  { c:'sf', src:'SF.gov', d:'Jan 2026', h:'Mayor Lurie Announces Vanderbilt University Will Establish a Full-Time Presence in San Francisco', t:'San Francisco’s mayor welcomes a full-time Vanderbilt campus, starting in the 2027 to 2028 academic year.', u:'https://www.sf.gov/news-mayor-lurie-announces-vanderbilt-university-will-establish-a-full-time-presence-in-san-francisco' },
  { c:'sf', src:'ABC7 San Francisco', d:'Jan 2026', h:'Vanderbilt University to open new campus in San Francisco in 2027', t:'Vanderbilt will take over the California College of the Arts campus after the 2026 to 2027 school year.', u:'https://abc7news.com/post/vanderbilt-university-open-new-campus-san-francisco-2027-acquiring-california-college-arts-building/18398105/' },
  { c:'wpb', src:'Vanderbilt News', d:'Jan 12, 2026', h:'Vanderbilt surges forward with West Palm Beach campus, launches broader fundraising effort', t:'A $250 million fundraising phase for a graduate campus in business, engineering, data science, and AI.', u:'https://news.vanderbilt.edu/2026/01/12/vanderbilt-surges-forward-with-west-palm-beach-campus-launches-broader-fundraising-effort/' },
  { c:'wpb', src:'Higher Ed Dive', d:'2024', h:'Vanderbilt University gets approval for $520M Florida graduate campus', t:'West Palm Beach approves the plan for a $520 million graduate campus.', u:'https://www.highereddive.com/news/vanderbilt-university-approval-520m-florida-west-palm-beach-graduate-campus/730825/' },
  { c:'chattanooga', src:'Vanderbilt News', d:'Jul 22, 2026', h:'Vanderbilt University, EPB of Chattanooga launch Institute for Quantum Innovation', t:'The official launch of a quantum campus of about 250 researchers, faculty, and staff, working with EPB’s trapped-ion quantum computer and quantum network.', u:'https://news.vanderbilt.edu/2026/07/22/vanderbilt-university-epb-of-chattanooga-launch-institute-for-quantum-innovation/' },
  { c:'strategy', src:'Forbes', d:'Aug 1, 2026', h:'Is Vanderbilt’s Campus Expansion The Next Big Thing For Universities?', t:'A national look at Vanderbilt’s network of campuses and what it could mean for higher education.', u:'https://www.forbes.com/sites/michaeltnietzel/2026/08/01/is-vanderbilts-campus-expansion-the-next-big-thing-for-universities/' },
  { c:'strategy', src:'Vanderbilt News', d:'Jul 31, 2026', h:'Why Vanderbilt is building campuses beyond Nashville', t:'The case, in Vanderbilt’s own words, for placing campuses in the country’s innovation hubs.', u:'https://news.vanderbilt.edu/2026/07/31/why-vanderbilt-is-building-campuses-beyond-nashville-opinion/' },
  { c:'strategy', src:'WSMV', d:'Mar 6, 2026', h:'Chancellor reveals details behind Vanderbilt’s expansion to NYC, San Francisco, West Palm Beach', t:'Chancellor Diermeier explains the thinking behind the new campuses.', u:'https://www.wsmv.com/2026/03/06/chancellor-reveals-details-behind-vanderbilts-expansion-nyc-san-francisco-west-palm-beach/' }
];
var PRESS_TAG = { nyc:'New York City', sf:'San Francisco', wpb:'West Palm Beach', chattanooga:'Chattanooga', strategy:'The strategy' };
(function(){
  var box = $('#pressList'), filt = $('.v-press-filter'); if(!box || !filt) return;
  box.innerHTML = PRESS.map(function(p){ return '<a class="pc" data-c="' + p.c + '" href="' + esc(p.u) + '" target="_blank" rel="noopener"><span class="pc-top"><span class="pc-tag" data-c="' + p.c + '">' + esc(PRESS_TAG[p.c]) + '</span><span class="pc-src">' + esc(p.src) + ' &middot; ' + esc(p.d) + '</span></span><b>' + esc(p.h) + '</b><span class="pc-t">' + esc(p.t) + '</span><span class="pc-go">Read the story<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></span></a>'; }).join('');
  filt.addEventListener('click', function(e){
    var b = e.target.closest('button[data-pf]'); if(!b) return;
    var f = b.getAttribute('data-pf');
    $$('button', filt).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    $$('.pc', box).forEach(function(c){ c.hidden = f !== 'all' && c.getAttribute('data-c') !== f; });
  });
})();

/* ══════════ lesson 1: the route, six stops ══════════ */
var STOPS = [
  { h:'Welcome to the <em>Voyage</em>', p:'Where you are now: a welcome from the Chancellor, then the mission and our five cities.', tags:['The Chancellor’s welcome', 'The mission', 'Five cities'] },
  { h:'Our history and <em>leadership</em>', p:'150 years of daring to grow, and who leads today.', tags:['A video', 'A living timeline', 'Fact or fiction'] },
  { h:'Our mission, our students, and <em>you</em>', p:'Seven numbers that put the mission in perspective.', tags:['Guess the number', 'Quick facts', 'A campus fun fact'] },
  { h:'The four <em>beliefs</em>', p:'The heart of the course, and how you live them.', tags:['The compass', 'Four moments', 'Your belief compass'] },
  { h:'Dare to <em>grow</em>', p:'Our motto, as a mindset.', tags:['A video', 'Three situations'] },
  { h:'Next <em>steps</em>', p:'Check what you learned, and plan what comes after today.', tags:['Five questions', 'Four commitments', 'Day One Survey'] }
];
(function(){
  var route = $('#route'), port = $('#port'); if(!route) return;
  var btns = $$('button[data-stop]', route), seen = {};
  btns.forEach(function(b, i){ if(NARR['welcome/g' + (i + 1)]) b.setAttribute('data-nk', 'welcome/g' + (i + 1)); });
  route.addEventListener('click', function(e){
    var b = e.target.closest('button[data-stop]'); if(!b) return;
    var i = +b.getAttribute('data-stop'), s = STOPS[i]; seen[i] = 1;
    btns.forEach(function(x){ x.setAttribute('aria-expanded', x === b ? 'true' : 'false'); x.classList.toggle('seen', !!seen[+x.getAttribute('data-stop')]); });
    port.innerHTML = '<span class="v-label">Stop ' + (i + 1) + ' of 6</span><h3>' + s.h + subBtn('welcome/g' + (i + 1)) + '</h3><p>' + esc(s.p) + '</p><ul>' + s.tags.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    narrSub('welcome/g' + (i + 1));
    if(Object.keys(seen).length === STOPS.length) progDone('welcome');
  });
})();

/* ══════════ lesson 2: the history of Vanderbilt, as a living timeline ══════════
   Highlights of what the History of Vanderbilt site covers, one tap at a time,
   with a play-through that steps on its own until the learner takes over.
   The full story lives on the site (Launch button). */
var TL = [
  { y:'1873', era:'The founding', h:'The Commodore’s gift', p:'In his 79th year, Cornelius Vanderbilt gives $1 million to build a university in the South that would “contribute to strengthening the ties which should exist between all sections of our common country.”' },
  { y:'1875', era:'The founding', h:'The doors open', p:'Bishop Holland N. McTyeire picks the site and plants many of the trees that make Vanderbilt an arboretum today. One Main Building, now Kirkland Hall, an observatory, and 307 students.' },
  { y:'1893', era:'Building a university', h:'The longest-serving chancellor', p:'James H. Kirkland leads for 44 years, and rebuilds after a 1905 fire consumes the Main Building, later renamed in his honor.' },
  { y:'1913', era:'Building a university', h:'Women on equal footing', p:'At least one woman attended classes every year from 1875. By 1913, 78 women make up just over 20 percent of the academic enrollment.' },
  { y:'1914', era:'Finding its own way', h:'An independent university', p:'The Board of Trust severs ties with the Methodist Episcopal Church, South, after a dispute over who appoints trustees.' },
  { y:'1949', era:'National stature', h:'A seat at the top table', p:'Vanderbilt is elected to the Association of American Universities, a mark of national recognition.' },
  { y:'1963', era:'National stature', h:'Top 20', p:'At its 90th anniversary, Vanderbilt ranks among the top 20 private universities for the first time. Chancellor Alexander Heard adds Blair, Owen, and Peabody College.' },
  { y:'2000', era:'Growing fast', h:'Research takes off', p:'Under Chancellor Gordon Gee, Vanderbilt leads the country in the growth rate of research funding and becomes one of the most selective universities.' },
  { y:'2008', era:'Growing fast', h:'Opportunity Vanderbilt', p:'Chancellor Nicholas S. Zeppos launches loan-free aid, opens Martha Ingram Commons, the start of the residential colleges, and begins FutureVU.' },
  { y:'2016', era:'Growing fast', h:'Two institutions', p:'Vanderbilt University and Vanderbilt University Medical Center separate, positioning both for long-term success, and keep working closely together.' },
  { y:'2020', era:'A new chapter', h:'The ninth chancellor', p:'Daniel Diermeier takes office on July 1, guides Vanderbilt through the pandemic, and launches Destination Vanderbilt and the Vanderbilt Project on Unity and American Democracy.' },
  { y:'Today', era:'What’s next', h:'One university, five cities', p:'A private research university with 7,300+ undergraduates, 6,200+ graduate and professional students, and 12 schools and colleges, working from Nashville and four more cities.' }
];
(function(){
  var box = $('#tl'); if(!box) return;
  box.innerHTML = '<div class="tl-track"><div class="tl-line" aria-hidden="true"><i id="tlFill"></i></div><div class="tl-nodes" role="tablist" aria-label="Vanderbilt history, 1873 to today">' +
    TL.map(function(t, i){ return '<button type="button" role="tab" class="tl-node" aria-selected="false" data-t="' + i + '" data-nk="history/t' + (i + 1) + '" style="--d:' + (i * 50) + 'ms"><span class="dot" aria-hidden="true"></span><span class="yr">' + t.y + '</span></button>'; }).join('') + '</div></div>' +
    '<div class="tl-card" role="tabpanel" aria-live="polite" id="tlCard"></div>' +
    '<div class="tl-ctl"><button type="button" class="btn btn-ghost btn-sm" id="tlPlay" aria-pressed="false"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg><span>Play the timeline</span></button><span class="tl-count" id="tlCount" aria-hidden="true"></span></div>';
  var nodes = $$('.tl-node', box), card = $('#tlCard'), fill = $('#tlFill'), playBtn = $('#tlPlay'), count = $('#tlCount');
  var cur = -1, timer = null, seen = {};
  function show(i, focus, speak){
    cur = i; var t = TL[i]; seen[i] = 1; nodes[i].classList.add('seen');
    if(Object.keys(seen).length === TL.length) progDone('history');
    if(speak) narrSub('history/t' + (i + 1));
    nodes.forEach(function(n, ni){ n.setAttribute('aria-selected', ni === i ? 'true' : 'false'); n.classList.toggle('past', ni < i); n.tabIndex = ni === i ? 0 : -1; });
    if(fill) fill.style.width = (i / (TL.length - 1) * 100) + '%';
    card.innerHTML = '<span class="v-label">' + esc(t.era) + subBtn('history/t' + (i + 1)) + '</span><div class="tl-body"><b class="tl-yr">' + esc(t.y) + '</b><div><h3>' + esc(t.h) + '</h3><p>' + esc(t.p) + '</p></div></div>';
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
    if(count) count.textContent = (i + 1) + ' / ' + TL.length;
    var tr = box.querySelector('.tl-track'); if(tr && tr.scrollWidth > tr.clientWidth){ var n = nodes[i]; tr.scrollTo({ left:Math.max(0, n.offsetLeft - (tr.clientWidth - n.offsetWidth) / 2), behavior:reduce ? 'auto' : 'smooth' }); }
    if(focus) nodes[i].focus();
  }
  function stop(){ if(timer){ window.clearInterval(timer); timer = null; } playBtn.setAttribute('aria-pressed', 'false'); playBtn.querySelector('span').textContent = 'Play the timeline'; }
  function play(){
    if(timer){ stop(); return; }
    narrStop();
    if(cur >= TL.length - 1) show(0); else show(cur + 1);
    playBtn.setAttribute('aria-pressed', 'true'); playBtn.querySelector('span').textContent = 'Pause';
    timer = window.setInterval(function(){ if(cur >= TL.length - 1){ stop(); return; } show(cur + 1); }, 3800);
  }
  box.addEventListener('click', function(e){ var n = e.target.closest('.tl-node'); if(n){ stop(); show(+n.getAttribute('data-t'), false, true); } });
  box.addEventListener('keydown', function(e){
    if(!e.target.closest('.tl-node')) return;
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault(); e.stopPropagation(); stop();
    var n = e.key === 'Home' ? 0 : e.key === 'End' ? TL.length - 1 : Math.min(Math.max(cur + (e.key === 'ArrowRight' ? 1 : -1), 0), TL.length - 1);
    show(n, true, true);
  });
  playBtn.addEventListener('click', play);
  document.addEventListener('chart:page', function(ev){
    stop();
    if(ev.detail && ev.detail.key === 'history'){ box.classList.remove('drawn'); void box.offsetWidth; box.classList.add('drawn'); }
  });
  show(0);
  box.classList.add('drawn');
})();

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

/* ══════════ drills: fact or fiction ══════════ */
var DRILLS = {
  leaders: { opts:['Fact', 'Fiction'], prog:'leaders', verb:'decided', items:[
    { s:'Before Vanderbilt, Chancellor Diermeier was provost of the University of Chicago.', a:0, x:'Fact. He was provost and dean of the Harris School of Public Policy there, and a longtime professor at Stanford and Northwestern’s Kellogg School.' },
    { s:'Chancellor Diermeier is the first in his family to graduate from college.', a:0, x:'Fact. He is a first-generation college graduate, which is part of why access to an elite education matters so much to him.' },
    { s:'Each vice chancellor runs a single academic department.', a:1, x:'Fiction. Vice chancellors lead large parts of the university, from academic affairs and athletics to people, culture and belonging. See the whole team below.' },
    { s:'Under Chancellor Diermeier, Vanderbilt has passed $1 billion in research expenditures.', a:0, x:'Fact. It is one of the milestones of his tenure, along with a successful capital campaign and a reaffirmed commitment to free expression and civil discourse.' }
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

/* ══════════ lesson 3: guess the number, seven tiles and a squirrel ══════════
   Guessing before the reveal (the pretesting effect) makes the number stick. */
var NUMS = [
  { lab:'Trees and shrubs', q:'Vanderbilt is a registered arboretum. How many trees and shrubs?', opts:['About 650', 'About 6,500', 'About 65,000'], a:1, big:'6,500', x:'A living laboratory for biodiversity, right on campus.' },
  { lab:'Beds on campus', q:'How many beds were used by students and visitors in 2023?', opts:['1,200', '6,400', '24,000'], a:1, big:'6,400', x:'On-campus housing keeps the community close.' },
  { lab:'Turkey Toss', q:'How many turkeys went to staff at the 2023 Turkey Toss?', opts:['About 150', 'More than 1,560', 'More than 15,000'], a:1, big:'1,560+', x:'Plus 102 Tofurkeys and 1,000 gift sets. A thank you to staff.' },
  { lab:'Degrees since 1875', q:'How many degrees has Vanderbilt awarded since 1875?', opts:['About 17,000', 'More than 177,000', 'About 1.7 million'], a:1, big:'177,000+', x:'Nearly one for every person in Chattanooga.' },
  { lab:'Library visits', q:'How many visits do Heard Library spaces get each year?', opts:['About 124,000', 'About 480,000', 'About 1.24 million'], a:2, big:'1.24M', x:'A hub for learning, collaboration, and events.' },
  { lab:'VUIT voice calls', q:'VUIT manages 51,000 devices. How many voice calls a day?', opts:['About 5,000', 'About 50,000', 'About 500,000'], a:2, big:'500,000', x:'Every day. VUIT keeps the university connected.' },
  { lab:'Game-day fans', q:'How many fans attend Vandy home athletic events each year?', opts:['40,000+', '400,000+', '4 million+'], a:1, big:'400,000+', x:'Anchor Down. Home games are a community event.' }
];
(function(){
  var grid = $('#nums'), status = $('#numbersStatus'); if(!grid) return;
  var done = {}, right = 0;
  grid.innerHTML = NUMS.map(function(n, i){
    return '<div class="v-tile" data-n="' + i + '"><button type="button" class="v-tile-face" aria-expanded="false"><span class="q" aria-hidden="true">?</span><span class="lab">' + esc(n.lab) + '</span></button></div>';
  }).join('') +
    '<div class="v-tile photo" data-n="fun"><img src="./assets/img/course/squirrel.jpg" alt="" width="900" height="675" loading="lazy" /><button type="button" class="v-tile-face" aria-expanded="false"><span class="q">Did you know?</span><span class="lab">Our unofficial mascot</span></button></div>';
  function paint(){ var n = Object.keys(done).length; if(status) status.textContent = n + ' of ' + NUMS.length + ' guessed.' + (n === NUMS.length ? ' ' + right + ' right. Activity complete.' : ''); if(n === NUMS.length) progDone('numbers'); }
  grid.addEventListener('click', function(e){
    var tile = e.target.closest('.v-tile'); if(!tile) return;
    var k = tile.getAttribute('data-n');
    if(k === 'fun'){
      if(tile.classList.contains('open')) return;
      tile.classList.add('open');
      var f = tile.querySelector('.v-tile-face'); f.setAttribute('aria-expanded', 'true');
      f.outerHTML = '<div class="v-reveal" tabindex="-1"><span class="lab">Fun fact</span><p>Squirrels are an inside joke here. So many live on campus that they became an unofficial mascot. One, named Corny, has starred in Vanderbilt videos.</p></div>';
      tile.querySelector('.v-reveal').focus(); return;
    }
    var i = +k, n = NUMS[i];
    if(e.target.closest('.v-tile-face') && !tile.classList.contains('open') && !done[i]){
      tile.classList.add('open');
      tile.innerHTML = '<div class="v-guess"><span class="v-label">' + esc(n.lab) + '</span><p>' + esc(n.q) + '</p><div class="opts" role="group" aria-label="Your guess">' + n.opts.map(function(o, oi){ return '<button type="button" data-o="' + oi + '">' + esc(o) + '</button>'; }).join('') + '</div></div>';
      var fb = tile.querySelector('button[data-o]'); if(fb) fb.focus();
      return;
    }
    var b = e.target.closest('button[data-o]'); if(!b || done[i]) return;
    var ok = +b.getAttribute('data-o') === n.a; done[i] = 1; if(ok) right++;
    tile.classList.remove('open'); tile.classList.add('done');
    tile.innerHTML = '<div class="v-reveal" tabindex="-1"><span class="verdict' + (ok ? ' ok' : '') + '">' + (ok ? 'You got it' : 'You guessed ' + esc(n.opts[+b.getAttribute('data-o')])) + '</span><span class="big">' + esc(n.big) + '</span><span class="lab">' + esc(n.lab) + '</span><p>' + esc(n.x) + '</p></div>';
    tile.querySelector('.v-reveal').focus();
    paint();
  });
  paint();
})();


/* ══════════ lesson 3: a Quick Facts scavenger hunt ══════════
   One question per section of the real Quick Facts page, one at a time.
   Each number the learner brings back lights up its tile on the board;
   close is good enough (the site rounds). The last question is theirs.
   Saved in this browser; prints with the Voyage summary. */
function hNum(v){ var m = String(v || '').replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; }
function hIn(lo, hi){ return function(v){ var n = hNum(v); return !isNaN(n) && n >= lo && n <= hi; }; }
var HUNT = [
  { sec:'Students', q:'How many undergraduate students study at Vanderbilt?', big:'7,300+', ok:hIn(7000, 7700) },
  { sec:'Campus', q:'How many schools and colleges make up the university?', big:'12', ok:hIn(12, 12) },
  { sec:'Academics', q:'What is the student-to-faculty ratio?', big:'8:1', hint:'For example, 10:1', ok:function(v){ return /^\s*8\s*(:|to|\/)?\s*(1)?\s*$/i.test(String(v || '')); } },
  { sec:'Undergraduate life', q:'What percent of undergraduates conduct research?', big:'62%', ok:hIn(60, 64) },
  { sec:'Research', q:'How much does Vanderbilt spend on research and development each year?', big:'$1 billion+', hint:'For example, $500 million', ok:function(v){ var t = String(v || '').toLowerCase(), n = hNum(t); if(isNaN(n)) return false; return /b/.test(t) ? n >= 1 && n < 2 : n >= 1000 && n < 2000 || n >= 1e9 && n < 2e9; } },
  { sec:'Faculty', q:'How many faculty members does Vanderbilt have?', big:'1,841', ok:hIn(1800, 1900) },
  { sec:'Affordability', q:'Opportunity Vanderbilt offers full-tuition scholarships to households earning up to how much?', big:'$150,000', hint:'For example, $100,000', ok:function(v){ var t = String(v || '').toLowerCase(), n = hNum(t); if(isNaN(n)) return false; if(/k/.test(t) || n < 1000) n *= 1000; return n >= 140000 && n <= 160000; } },
  { sec:'Life after Vanderbilt', q:'What percent of 2024 graduates were employed or in graduate school within six months?', big:'93%', ok:hIn(91, 95) },
  { sec:'Your take', q:'Which fact surprised you most?', open:true }
];
(function(){
  var box = $('#hunt'); if(!box) return;
  var ans = (function(){ try{ var v = JSON.parse(get('hunt') || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } })();
  var tries = {}, cur = 0, N = HUNT.length, FACTS = HUNT.filter(function(h){ return !h.open; }).length;
  box.innerHTML = HUNT.map(function(h, i){
    return '<div class="hq" data-i="' + i + '"><span class="hq-no" aria-hidden="true">' + (i + 1) + '</span><span class="v-label">' + esc(h.sec) + ' &middot; ' + (i + 1) + ' of ' + N + '</span><label for="hunt' + i + '">' + esc(h.q) + '</label>' +
      '<div class="hq-row"><input type="text" id="hunt' + i + '" maxlength="160" autocomplete="off" placeholder="' + esc(h.open ? 'In your own words' : (h.hint || 'The number you found')) + '" />' + (h.open ? '' : '<button type="button" data-check="' + i + '">Check</button>') + '</div>' +
      '<p class="hq-fb" role="status"></p><span class="hq-ok" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span></div>';
  }).join('') +
  '<div class="hq-nav"><button type="button" class="btn btn-ghost btn-sm" data-hprev>Back</button><span class="hq-dots" aria-hidden="true">' + HUNT.map(function(){ return '<i></i>'; }).join('') + '</span><button type="button" class="btn btn-primary btn-sm" data-hnext>Next</button></div>' +
  '<p class="hinttxt">Saved in this browser only. Your answers print with your Voyage summary.</p>';
  var chip = $('#facts .v-task'), tally = $('#huntTally');
  function good(i){ var h = HUNT[i]; return h.open ? !!(ans[i] || '').trim() : h.ok(ans[i]); }
  function light(i, pop){ var t = $('.v-mosaic .mt[data-m="' + i + '"]'); if(!t) return; t.classList.add('lit'); if(pop){ t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); } t.querySelector('b').textContent = HUNT[i].big; }
  function paint(){
    var n = 0, f = 0;
    HUNT.forEach(function(h, i){ var r = $('.hq[data-i="' + i + '"]', box), g = good(i); r.classList.toggle('found', g); if(g){ n++; if(!h.open){ f++; light(i); r.querySelector('.hq-fb').textContent = 'Found it: ' + h.big + '.'; } } });
    if(tally) tally.textContent = f + '/' + FACTS;
    $$('.hq-dots i', box).forEach(function(d, i){ d.classList.toggle('on', i === cur); d.classList.toggle('ok', good(i)); });
    if(chip) chip.classList.toggle('done', n === N);
  }
  function show(i, focus){
    cur = Math.max(0, Math.min(N - 1, i));
    $$('.hq', box).forEach(function(r, ri){ r.classList.toggle('cur', ri === cur); });
    $('[data-hprev]', box).disabled = cur === 0;
    var nx = $('[data-hnext]', box); nx.hidden = cur === N - 1;
    paint();
    if(focus){ var inp = $('#hunt' + cur); if(inp) inp.focus({ preventScroll:true }); }
  }
  function check(i){
    var r = $('.hq[data-i="' + i + '"]', box), fb = r.querySelector('.hq-fb'), h = HUNT[i];
    if(good(i)){ light(i, true); paint(); return true; }
    tries[i] = (tries[i] || 0) + 1;
    fb.textContent = !(ans[i] || '').trim() ? 'Type what you found on Quick Facts.' : tries[i] < 2 ? 'Not quite. Look again on Quick Facts.' : 'Quick Facts says ' + h.big + '. Type it in to light up the board.';
    return false;
  }
  $$('input', box).forEach(function(inp, i){
    inp.value = ans[i] || '';
    inp.addEventListener('input', function(){ ans[i] = inp.value; set('hunt', JSON.stringify(ans)); if(HUNT[i].open || good(i)){ if(good(i) && !HUNT[i].open) light(i, true); paint(); } });
    inp.addEventListener('keydown', function(e){ if(e.key !== 'Enter') return; e.preventDefault(); if(HUNT[i].open || check(i)) show(i + 1, true); });
  });
  box.addEventListener('click', function(e){
    var c = e.target.closest('button[data-check]'); if(c){ if(check(+c.getAttribute('data-check'))) window.setTimeout(function(){ show(cur + 1, true); }, 500); return; }
    if(e.target.closest('[data-hnext]')){ show(cur + 1, true); return; }
    if(e.target.closest('[data-hprev]')){ show(cur - 1, true); }
  });
  var first = 0; while(first < N - 1 && good(first)) first++;
  show(first);
})();

/* ══════════ lesson 4: the four beliefs on a compass rose ══════════ */
var BELIEFS = [
  { k:'belonging', pt:'n', name:'Belonging', line:'Once you’re chosen, you belong.', h:'Once you&rsquo;re chosen, you <em>belong</em>.',
    what:'Vanderbilt is intentionally very selective. Only people with the highest potential make the cut. Once you are here, you are surrounded by the best and brightest, brought together for one simple purpose: to improve each other.',
    behaviors:['Confident, never cutthroat', 'When you join, you commit', 'Respect the Vanderbilt Way', 'Create and cultivate conditions for success', 'Celebrate differences', 'Foster unity'],
    week:'Introduce yourself to one person outside your team, and ask what they are working on.' },
  { k:'selfdir', pt:'e', name:'Self-direction', line:'Choose your own path, and go all in.', h:'Choose your own path, and go all <em>in</em>.',
    what:'Personal purpose is found through relentless exploration and challenge. If it is too comfortable, you are not doing it right. Experience as much as you can. And once you discover your path, give it everything you have.',
    behaviors:['Try, fail, learn, repeat', 'Embrace discomfort', 'Ready to change your mind', 'Put in the work', 'No shortcuts', 'Prove the doubters wrong'],
    week:'Say yes to one task that stretches you, and tell your manager what you want to learn from it.' },
  { k:'collab', pt:'s', name:'Collaboration', line:'Teams challenge and support each other.', h:'Teams challenge and support each <em>other</em>.',
    what:'Our goal as a community is to work as one. By challenging and supporting one another, high-functioning teams accomplish far more than individuals. Only by rallying around a common purpose can we truly multiply our individual potential.',
    behaviors:['Bands do more than soloists', 'Ditch the ego', 'See no boundaries', 'Pioneer together', 'Challenge directly', 'Respect the person', 'Redefine “possible”'],
    week:'Ask a teammate for their honest take on something you are working on, and use it.' },
  { k:'growth', pt:'w', name:'Growth', line:'We never stop growing and achieving.', h:'We never stop growing and <em>achieving</em>.',
    what:'A permanent growth mindset matters more than any single achievement, however big. Human potential is realized over a lifetime, in increments and leaps, and it expands as you grow.',
    behaviors:['Growing the whole person', 'Obsessive self-improvement', 'In competition with yourself', 'Be the ladder for others', 'Lifelong leveling up'],
    week:'Pick one skill to be better at in ninety days, and bring it to your next one-on-one.' }
];
var BELIEF_BY_KEY = {}; BELIEFS.forEach(function(b){ BELIEF_BY_KEY[b.k] = b; });
var ROSE_ANGLE = { n:0, e:90, s:180, w:270 };
/* the rose: rings, ticks, a four-point star (one point per belief), four diagonal minor points, and a needle */
function roseSVG(needle){
  var t = '', i;
  for(i = 0; i < 72; i++){ var a = i * 5 * Math.PI / 180, r1 = i % 18 === 0 ? 150 : i % 3 === 0 ? 156 : 160; t += '<line class="tick" x1="' + (200 + Math.sin(a) * r1).toFixed(1) + '" y1="' + (200 - Math.cos(a) * r1).toFixed(1) + '" x2="' + (200 + Math.sin(a) * 165).toFixed(1) + '" y2="' + (200 - Math.cos(a) * 165).toFixed(1) + '"/>'; }
  function pt(ang, len, w, cls, key){ var a = ang * Math.PI / 180, s = Math.sin(a), c = Math.cos(a), px = -c, py = -s;
    var tip = [200 + s * len, 200 - c * len], l = [200 + s * 22 + px * w, 200 - c * 22 + py * w], r = [200 + s * 22 - px * w, 200 - c * 22 - py * w];
    return '<path class="' + cls + '"' + (key ? ' data-pt="' + key + '"' : '') + ' d="M200 200L' + l.map(function(v){ return v.toFixed(1); }).join(' ') + 'L' + tip.map(function(v){ return v.toFixed(1); }).join(' ') + 'L' + r.map(function(v){ return v.toFixed(1); }).join(' ') + 'Z"/>'; }
  var star = pt(45, 92, 12, 'minor') + pt(135, 92, 12, 'minor') + pt(225, 92, 12, 'minor') + pt(315, 92, 12, 'minor') + pt(0, 140, 22, '', 'n') + pt(90, 140, 22, '', 'e') + pt(180, 140, 22, '', 's') + pt(270, 140, 22, '', 'w');
  return '<svg viewBox="0 0 400 400" aria-hidden="true"><circle class="ring2" cx="200" cy="200" r="178"/><circle class="ring" cx="200" cy="200" r="165"/>' + t + '<g class="star">' + star + '</g>' +
    (needle ? '<g class="needle" style="transform:rotate(-35deg)"><path d="M200 58L210 200L200 214L190 200Z"/></g>' : '') + '<circle class="hub" cx="200" cy="200" r="9"/></svg>';
}
(function(){
  var rose = $('#rose'), out = $('#beliefOut'), status = $('#beliefsStatus'); if(!rose) return;
  rose.innerHTML = roseSVG(false) + '<div role="tablist" aria-label="The four beliefs">' + BELIEFS.map(function(b, i){ return '<button type="button" role="tab" class="pt ' + b.pt + '" aria-selected="false" data-b="' + i + '" data-nk="beliefs/t' + (i + 1) + '">' + b.name + '</button>'; }).join('') + '</div>';
  var seen = {}, found = {}, chip = $('#beliefs .v-task');
  function paint(){ var n = Object.keys(seen).length, f = Object.keys(found).length; if(status) status.textContent = n + ' of 4 beliefs. ' + f + ' of 4 moments.' + (f === 4 ? ' Activity complete.' : ''); if(f === 4) progDone('beliefs'); }
  function show(i){
    var b = BELIEFS[i]; seen[i] = 1;
    $$('.pt', rose).forEach(function(p){ var on = +p.getAttribute('data-b') === i; p.setAttribute('aria-selected', on ? 'true' : 'false'); p.classList.toggle('seen', !!seen[+p.getAttribute('data-b')]); });
    $$('.star path[data-pt]', rose).forEach(function(p){ p.classList.toggle('lit', p.getAttribute('data-pt') === b.pt); });
    out.innerHTML = '<span class="v-label">Belief ' + (i + 1) + ' of 4 &middot; ' + b.name + subBtn('beliefs/t' + (i + 1)) + '</span><h3>' + b.h + '</h3>' +
      '<ul class="behaviors" aria-label="Behaviors">' + b.behaviors.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<details><summary>What it means, and one thing to try</summary><p>' + esc(b.what) + '</p><p><b>Try it this week.</b> ' + esc(b.week) + '</p></details>' +
      '<p class="v-label try-h">Apply it: ' + esc(SCENARIOS[b.k].h.split(' · ')[1] || '') + subBtn('beliefs/m' + (i + 1)) + '</p><div class="scn" data-scn="' + b.k + '"></div>';
    buildScenario(out.querySelector('.scn'));
    if(found[b.k]){ var best = out.querySelector('.scn'); }
    narrSub('beliefs/t' + (i + 1));
    paint();
  }
  rose.addEventListener('click', function(e){ var p = e.target.closest('.pt'); if(p) show(+p.getAttribute('data-b')); });
  out.addEventListener('click', function(e){ var b = e.target.closest('.scn button[data-o]'); if(!b) return; var k = b.closest('.scn').getAttribute('data-scn'); if(SCENARIOS[k].opts[+b.getAttribute('data-o')].best){ found[k] = 1; paint(); } });
  paint();
})();

/* ══════════ lesson 4: the belief compass, one question at a time; the needle finds your belief ══════════ */
var COMPASS = [
  { q:'It is a free afternoon at work. What do you reach for first?', o:[
    ['belonging', 'Getting to know the people around me'], ['selfdir', 'Something new I have never tried'], ['collab', 'A problem I can work on with others'], ['growth', 'A skill I want to get better at'] ]},
  { q:'Which compliment would mean the most to you?', o:[
    ['collab', '“The team is better when you are on it.”'], ['growth', '“You are not the same person you were a year ago.”'], ['belonging', '“You make people feel welcome here.”'], ['selfdir', '“You went all in, and it showed.”'] ]},
  { q:'A project gets hard. What keeps you going?', o:[
    ['selfdir', 'I chose this, and I finish what I choose'], ['belonging', 'The people counting on me'], ['growth', 'What I am learning along the way'], ['collab', 'Working it out together'] ]},
  { q:'A year from now, what would make you proudest?', o:[
    ['growth', 'How much I have grown'], ['collab', 'What my team accomplished together'], ['selfdir', 'That I found my path here and went for it'], ['belonging', 'That this place feels like mine'] ]}
];
/* the compass coach: a short read-back of the learner's plan, and one tip.
   Runs in the browser from simple checks (an action, a person, a time); nothing is sent anywhere. */
var COACH_TIPS = {
  belonging:{ who:'Name one person: a teammate you have not met yet, or someone else who is new.', when:'Put a time on it: a coffee this week, or the first five minutes of your next team meeting.', done:'Belonging runs both ways: when you talk, ask what helped them feel at home here.' },
  selfdir:  { who:'Say who will hear about it. Telling your manager makes it real, and they can clear the path.', when:'Give it a date. Choosing is the first step; a date is how you go all in.', done:'Pick the first small step and take it before Friday. Momentum beats a perfect plan.' },
  collab:   { who:'Name who you will work with: a teammate, another office, or your manager.', when:'Put a time on it: your next team meeting, or a fifteen-minute call this week.', done:'Ask one question before you offer an answer. Collaboration starts with listening.' },
  growth:   { who:'Say who will help: a manager, a mentor, or a colleague who already does this well.', when:'Put it on your calendar this week, even thirty minutes. Growth happens in small, regular steps.', done:'Tell your manager the skill you picked. It can be the first line of your development plan.' }
};
function coachRead(text, k){
  var t = ' ' + text.toLowerCase().replace(/[^a-z0-9’' ]+/g, ' ') + ' ';
  var has = {
    what: text.trim().split(/\s+/).length >= 4,
    who: /\b(manager|supervisor|boss|team|teammates?|colleagues?|co ?workers?|peers?|mentor|staff|people|someone|group|department|office|lab|students?|faculty|partners?|everyone|others|new hires?|him|her|them)\b/.test(t),
    when: /\b(today|tomorrow|tonight|this week|next week|this month|monday|tuesday|wednesday|thursday|friday|daily|every day|each day|weekly|every week|morning|afternoon|lunch|coffee|meeting|one on one|1 ?on ?1|huddle|standup|stand up|by \w+|before \w+|first \w+|calendar)\b/.test(t)
  };
  var tips = COACH_TIPS[k] || COACH_TIPS.growth, tip;
  if(!has.what) tip = 'Make it one concrete action someone could see you do, like “I will ask…” or “I will set up…”.';
  else if(!has.who) tip = tips.who;
  else if(!has.when) tip = tips.when;
  else tip = tips.done;
  var n = (has.what ? 1 : 0) + (has.who ? 1 : 0) + (has.when ? 1 : 0);
  var head = n === 3 ? 'A clear plan: an action, a person, and a time.' : n === 2 ? 'A good start. One thing would make it stick.' : 'A start. Make it a little more concrete.';
  return { has:has, tip:tip, head:head };
}
(function(){
  var box = $('#compassBox'), status = $('#compassStatus'), nr = $('#needleRose'); if(!box) return;
  if(nr) nr.innerHTML = roseSVG(true) + BELIEFS.map(function(b){ return '<span class="pt ' + b.pt + '" data-k="' + b.k + '">' + b.name + '</span>'; }).join('');
  var needle = nr ? nr.querySelector('.needle') : null;
  var ans = (function(){ try{ var v = JSON.parse(get('compass') || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } })();
  var cur = 0;
  box.innerHTML = COMPASS.map(function(c, i){
    return '<div class="cp-q" data-i="' + i + '"><p class="cp-h"><span class="v-label">Question ' + (i + 1) + ' of ' + COMPASS.length + '</span>' + esc(c.q) + '</p><div class="cp-opts" role="group" aria-label="' + esc(c.q) + '">' +
      c.o.map(function(o){ return '<button type="button" data-b="' + o[0] + '" aria-pressed="false">' + esc(o[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="cp-dots" aria-hidden="true">' + COMPASS.map(function(x, di){ return '<i class="' + (di <= i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      (i > 0 ? '<button type="button" class="cp-back" data-back="1">&larr; Back</button>' : '') + '</div>';
  }).join('') + '<div class="cp-result" id="cpResult" aria-live="polite"></div>';
  var result = $('#cpResult'), hint = $('#roseHint'), chip = $('#compass .v-task');
  function winner(){ var tally = {}, best = null, bestN = 0; ans.forEach(function(k){ if(!k) return; tally[k] = (tally[k] || 0) + 1; if(tally[k] >= bestN){ bestN = tally[k]; best = k; } }); return best; }
  function point(k){
    var b = BELIEF_BY_KEY[k];
    if(needle) needle.style.transform = 'rotate(' + (b ? ROSE_ANGLE[b.pt] : 0) + 'deg)';
    if(nr) nr.classList.toggle('idle', !b);
    if(hint) hint.textContent = !b ? 'The needle moves as you answer.' : box.classList.contains('result') ? 'Your compass points to ' + b.name + '.' : 'Leaning toward ' + b.name + ' so far.';
    if(nr) $$('.pt', nr).forEach(function(p){ p.classList.toggle('on', !!b && p.getAttribute('data-k') === k); });
  }
  function step(i){
    cur = i; box.classList.remove('result'); if(chip) chip.classList.remove('done');
    $$('.cp-q', box).forEach(function(q, qi){ q.classList.toggle('cur', qi === i); $$('button[data-b]', q).forEach(function(bt){ bt.setAttribute('aria-pressed', ans[qi] === bt.getAttribute('data-b') ? 'true' : 'false'); }); });
    var n = ans.filter(Boolean).length; if(status) status.textContent = n + ' of ' + COMPASS.length + ' answered.';
    point(ans.filter(Boolean).length ? winner() : null);
  }
  function finish(announce){
    var w = BELIEF_BY_KEY[winner()]; if(!w) return;
    set('belief', w.name); box.classList.add('result'); point(w.k); if(chip) chip.classList.add('done');
    result.innerHTML = '<span class="v-label">Your compass points to</span><h3>' + esc(w.name) + subBtn('compass/' + w.k) + '</h3><p class="cp-line">' + esc(w.line) + '</p>' +
      '<div class="field"><label for="cpReflect">How will you show it at work this week?</label><textarea id="cpReflect" rows="3" placeholder="One sentence is plenty."></textarea><p class="hinttxt">Goes into your message to your manager. Saved in this browser only.</p></div>' +
      '<div class="cp-actions"><button type="button" class="btn btn-primary btn-sm cp-save">Save to my takeaway</button><button type="button" class="cp-redo">Answer again</button></div>' +
      '<div class="cp-coach" id="cpCoach" aria-live="polite" hidden></div>';
    var ta = $('#cpReflect'), save = result.querySelector('.cp-save'), coachBox = $('#cpCoach');
    ta.value = get('reflect-draft') || get('reflect') || '';
    function paintCoach(){
      var r = (get('reflect') || '').trim(); if(!r){ coachBox.hidden = true; return; }
      var c = coachRead(r, w.k), ck = function(on, label){ return '<li class="' + (on ? 'on' : '') + '"><span aria-hidden="true">' + (on ? '&#10003;' : '&middot;') + '</span>' + label + '<span class="sr-only">' + (on ? ': yes' : ': not yet') + '</span></li>'; };
      coachBox.innerHTML = '<p class="cp-saved"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>Saved to your takeaway and your message to your manager.</p>' +
        '<p class="cp-head">' + esc(c.head) + '</p><p class="cp-plan">Your plan: &ldquo;' + esc(r) + '&rdquo;</p>' +
        '<ul class="cp-checks" aria-label="Your plan has">' + ck(c.has.what, 'An action') + ck(c.has.who, 'A person') + ck(c.has.when, 'A time') + '</ul>' +
        '<p class="cp-tip"><b>Tip.</b> ' + esc(c.tip) + '</p>';
      coachBox.hidden = false; set('reflect-tip', c.tip);
    }
    function dirty(){ var d = ta.value.trim() !== (get('reflect') || '').trim(); save.textContent = d || !get('reflect') ? 'Save to my takeaway' : 'Saved'; save.classList.toggle('is-saved', !d && !!get('reflect')); }
    ta.addEventListener('input', function(){ set('reflect-draft', ta.value); dirty(); });
    save.addEventListener('click', function(){
      var v = ta.value.trim();
      if(!v){ toast('Write one sentence first.'); ta.focus(); return; }
      set('reflect', v); set('reflect-draft', null); tellPaint(); paintCoach(); dirty();
      if(typeof buildPrint === 'function') try{ buildPrint(); }catch(e){}
    });
    paintCoach(); dirty();
    if(status) status.textContent = 'Your compass points to ' + w.name + '. Activity complete.';
    progDone('compass'); tellPaint();
    if(announce){ narrSub('compass/' + w.k); var h = result.querySelector('h3'); if(h){ h.tabIndex = -1; h.focus({ preventScroll:true }); } }
  }
  box.addEventListener('click', function(e){
    if(e.target.closest('.cp-redo')){ ans = []; set('compass', null); step(0); var f = box.querySelector('.cp-q.cur button'); if(f) f.focus(); return; }
    if(e.target.closest('[data-back]')){ step(Math.max(cur - 1, 0)); return; }
    var b = e.target.closest('.cp-opts button'); if(!b) return;
    ans[cur] = b.getAttribute('data-b'); set('compass', JSON.stringify(ans));
    if(cur < COMPASS.length - 1){ step(cur + 1); var f2 = box.querySelector('.cp-q.cur button'); if(f2) f2.focus({ preventScroll:true }); }
    else finish(true);
  });
  if(ans.filter(Boolean).length === COMPASS.length) finish(false); else step(Math.min(ans.filter(Boolean).length, COMPASS.length - 1));
})();

/* ══════════ next steps: four commitments, and the message to the manager ══════════ */
var COMMITS = [
  ['Talk beliefs with your manager', 'Which belief you align with most, and how it will guide how you show up to work.'],
  ['Start your development plan', 'Build on your strengths and grow your opportunities, together with your manager.'],
  ['Finish your compliance training', 'All of your required compliance education.'],
  ['Wrap up day one', 'The Benefits Information Course, any other assigned courses, and the Vanderbilt Voyage Day One Survey.']
];
function tellPaint(){
  var tell = $('#tellText'), copy = $('#copyTell'); if(!tell) return;
  var b = get('belief'), r = (get('reflect') || '').trim();
  var msg = 'I just finished Vanderbilt Voyage Online. The belief I align with most is ' + (b ? b.toLowerCase() : '[belief]') + '.' + (r ? ' Here is how I plan to show it: ' + r + (/[.!?]$/.test(r) ? '' : '.') : '') + ' Can we talk about it, and about my development plan, in our next one-on-one?';
  tell.textContent = '“' + msg + '”';
  if(copy) copy.setAttribute('data-copytext', msg);
}
(function(){
  var list = $('#commitList'), status = $('#commitStatus'); if(!list) return;
  var on = (function(){ try{ var v = JSON.parse(get('commit') || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } })();
  list.innerHTML = COMMITS.map(function(t, i){ return '<button type="button" role="checkbox" aria-checked="false" data-c="' + i + '"><span class="cb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg></span><b>' + esc(t[0]) + '</b><small>' + esc(t[1]) + '</small></button>'; }).join('');
  function paint(){
    $$('button[data-c]', list).forEach(function(b){ b.setAttribute('aria-checked', on[+b.getAttribute('data-c')] ? 'true' : 'false'); });
    var n = on.filter(Boolean).length;
    if(status) status.textContent = n + ' of ' + COMMITS.length + ' committed.' + (n === COMMITS.length ? ' Activity complete.' : '');
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

SECTIONS.forEach(function(s){ if(progIs(s.k)) turnDone(s.k); });

/* ══════════ print my Voyage summary: results and everything the learner wrote ══════════
   Built fresh each time (the button, or the browser's own Print), on white,
   in the brand's type. Nothing leaves the browser. */
/* the printout's logo loads with the course, so it is ready the moment someone prints */
(function(){ try{ var im = new Image(); im.src = './assets/img/vu-lockup-black.png'; }catch(e){} })();
function buildPrint(){
  var sheet = $('#printSheet'); if(!sheet) return;
  function val(k){ return (get(k) || '').trim(); }
  function list(k){ try{ var v = JSON.parse(get(k) || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } }
  var done = SECTIONS.filter(function(s){ return progIs(s.k); }).length;
  var score = get('quiz-score'), belief = val('belief'), reflect = val('reflect'), commits = list('commit'), hunt = list('hunt');
  var b = null; BELIEFS.forEach(function(x){ if(x.name === belief) b = x; });
  var tell = $('#tellText') ? $('#tellText').textContent : '';
  var today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  var nm = ''; try{ var q = new URLSearchParams(location.search); nm = q.get('name') || ''; }catch(e){}
  var survey = C.surveyUrl || '', qr = '';
  try{ if(window.qrcode && survey){ var q2 = qrcode(0, 'M'); q2.addData(survey); q2.make(); qr = q2.createSvgTag({ cellSize:2, margin:0, scalable:true }); } }catch(e){}
  var html = '<header class="ps-head"><img src="./assets/img/vu-lockup-black.png" alt="Vanderbilt University" width="166" height="43" /><div><span class="ps-k">Vanderbilt Voyage Online</span><h1>My Vanderbilt <em>Voyage</em>.</h1><p>' + (nm ? esc(nm) + ' &middot; ' : '') + esc(today) + '</p></div></header>';
  var RECAP = [
    ['Welcome and the mission', 'Define the great university of the 21st century, and be it. One Vanderbilt, five cities: Nashville, Chattanooga, New York City, West Palm Beach, San Francisco.'],
    ['Our history and leadership', 'Founded in 1873 with the Commodore’s $1 million gift. Chancellor Daniel Diermeier, ninth chancellor, since 2020.'],
    ['By the numbers', '7,300+ undergraduates, 6,200+ graduate and professional students, 12 schools and colleges, $1 billion+ in research.'],
    ['The four beliefs', 'Belonging, self-direction, collaboration, and growth: the Vanderbilt Way.'],
    ['Dare to grow', 'Crescere aude. Grow your mindset, use what’s here, and grow together.'],
    ['Next steps', 'Four moves, below, and a talk with your manager.']
  ];
  html += '<section class="ps-recap"><h2>What the course covered</h2><ol>' + RECAP.map(function(r, i){ return '<li><span class="ps-n">' + (i + 1) + '</span><span><b>' + esc(r[0]) + '.</b> ' + esc(r[1]) + '</span></li>'; }).join('') + '</ol></section>';
  html += '<section class="ps-moves"><h2>My next four moves</h2><ol class="ps-checks">' + COMMITS.map(function(c, i){
      return '<li class="' + (commits[i] ? 'on' : '') + '"><span class="ps-box" aria-hidden="true">' + (commits[i] ? '&#10003;' : '') + '</span><span class="ps-t"><b>' + esc(c[0]) + '.</b> ' + esc(c[1]) + (commits[i] ? ' <i class="ps-cm">Committed in the course.</i>' : '') + '</span><span class="ps-by">Done by <i></i></span></li>'; }).join('') + '</ol>' +
    '<div class="ps-survey">' + (qr ? '<div class="ps-qr">' + qr + '</div>' : '') + '<div><b>Vanderbilt Voyage Day One Survey</b><p>Two minutes. Scan the code, or open the link from the course.</p><p class="ps-fine">Questions about your Voyage: pcb@vanderbilt.edu</p></div></div></section>';
  html += '<section class="ps-row"><div class="ps-stat"><b>' + done + '/' + SECTIONS.length + '</b><span>activities complete</span></div><div class="ps-stat"><b>' + (score === null ? '&ndash;' : esc(score) + '/5') + '</b><span>quick check score</span></div><div class="ps-stat"><b>' + (belief ? esc(belief) : '&ndash;') + '</b><span>my belief compass</span></div></section>';
  html += '<section><h2>My belief</h2>' + (b ? '<p class="ps-big">' + esc(b.line) + '</p><p class="ps-sub">Behaviors to start with: ' + esc(b.behaviors[0]) + '; ' + esc(b.behaviors[1]) + '.</p>' : '<p class="ps-empty">Not answered yet. Lesson 4, the belief compass.</p>') +
    '<h3>How I will show it at work</h3><p class="ps-write">' + (reflect ? esc(reflect) : '<span class="ps-empty">Not written yet.</span>') + '</p>' + (reflect && val('reflect-tip') ? '<p class="ps-sub"><b>Tip:</b> ' + esc(val('reflect-tip')) + '</p>' : '') + '</section>';
  html += '<section><h2>Message to my manager</h2><p class="ps-quote">' + esc(tell) + '</p></section>';
  html += '<section><h2>My Quick Facts hunt</h2><table class="ps-table"><tbody>' + HUNT.map(function(q, i){ var a = (hunt[i] || '').trim(); return '<tr><th>' + esc(q.q) + '</th><td>' + (a ? esc(a) : '<span class="ps-empty">&ndash;</span>') + (q.open ? '' : '<small>Quick Facts: ' + esc(q.big) + '</small>') + '</td></tr>'; }).join('') + '</tbody></table><p class="ps-foot">Crescere aude. Dare to grow.</p></section>';
  sheet.innerHTML = html;
}
window.addEventListener('beforeprint', buildPrint);
document.addEventListener('click', function(e){
  if(!e.target.closest('[data-print]')) return;
  narrStop(); buildPrint();
  try{ window.print(); }catch(err){ toast('Printing is not available here. Use your browser menu to print.'); }
});

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
