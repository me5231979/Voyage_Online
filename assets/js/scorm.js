/* ══════════ VANDERBILT VOYAGE ONLINE · LMS bridge (SCORM 1.2 and 2004) ══════════
   Loads before pager.js and app.js. Outside an LMS it finds no API and does
   nothing, so the live site is unchanged. Inside an LMS:
   - the learner's answers and progress live in suspend_data, so they follow
     the learner to any computer (the LMS is the source of truth, not the browser);
   - the page they were on is the bookmark (lesson_location / location);
   - all nine activities done = completed; the quick check sets the score;
   - session time is reported, and the attempt is suspended on exit. */
(function(){
  'use strict';
  var KEY = 'vvo2-', SKIP = { narrpos:1, auto:1 }, LIMIT12 = 4000;
  function findFrom(name, start){
    var w = start, n = 0;
    while(w && n < 12){ try{ if(w[name]) return w[name]; }catch(e){} if(w.parent && w.parent !== w) w = w.parent; else break; n++; }
    return null;
  }
  var api2004 = findFrom('API_1484_11', window), api12 = api2004 ? null : findFrom('API', window);
  if(!api2004 && !api12){ try{ if(window.opener){ api2004 = findFrom('API_1484_11', window.opener); if(!api2004) api12 = findFrom('API', window.opener); } }catch(e){} }
  var LMS = { active:false, version:null, data:{}, learner:'' };
  window.VVO_LMS = LMS;
  if(!api2004 && !api12) return;

  var v4 = !!api2004, api = api2004 || api12, started = Date.now(), finished = false;
  function call(f12, f04, a, b){ try{ return v4 ? api[f04](a === undefined ? '' : a, b) : api[f12](a === undefined ? '' : a, b); }catch(e){ return ''; } }
  function getv(k12, k04){ var r = call('LMSGetValue', 'GetValue', v4 ? k04 : k12); return r == null ? '' : String(r); }
  function setv(k12, k04, val){ call('LMSSetValue', 'SetValue', v4 ? k04 : k12, String(val)); }
  function commit(){ call('LMSCommit', 'Commit'); }
  var ok = call('LMSInitialize', 'Initialize');
  if(ok !== true && ok !== 'true'){ return; }
  LMS.active = true; LMS.version = v4 ? '2004' : '1.2';
  document.documentElement.classList.add('in-lms');

  /* restore: the LMS copy replaces whatever this browser holds */
  try{ var raw = getv('cmi.suspend_data', 'cmi.suspend_data'); LMS.data = raw ? (JSON.parse(raw) || {}) : {}; }catch(e){ LMS.data = {}; }
  try{
    var ls = window.localStorage;
    Object.keys(ls).forEach(function(k){ if(k.indexOf(KEY) === 0 && !SKIP[k.slice(KEY.length)]) ls.removeItem(k); });
    Object.keys(LMS.data).forEach(function(k){ ls.setItem(KEY + k, LMS.data[k]); });
  }catch(e){}
  var loc = getv('cmi.core.lesson_location', 'cmi.location');
  if(loc && !/^#p\//.test(window.location.hash)){ try{ history.replaceState(null, '', '#p/' + loc); }catch(e){ window.location.hash = '#p/' + loc; } }

  /* the learner's first name, for the welcome ("Last, First" in most LMSs) */
  var nm = getv('cmi.core.student_name', 'cmi.learner_name');
  if(nm){ var parts = nm.split(','); LMS.learner = (parts.length > 1 ? parts[1] : parts[0]).trim().split(/\s+/)[0] || ''; LMS.fullName = parts.length > 1 ? (parts[1].trim() + ' ' + parts[0].trim()) : nm.trim(); }

  var status = v4 ? getv('', 'cmi.completion_status') : getv('cmi.core.lesson_status', '');
  var complete = status === 'completed' || status === 'passed';
  if(!complete){ if(v4) setv('', 'cmi.completion_status', 'incomplete'); else setv('cmi.core.lesson_status', '', 'incomplete'); }

  /* suspend_data: compact JSON; SCORM 1.2 caps it near 4 KB, so the longest free text gives way first */
  var timer = null;
  function pack(){
    var d = {}; Object.keys(LMS.data).forEach(function(k){ if(LMS.data[k] != null) d[k] = LMS.data[k]; });
    var s = JSON.stringify(d);
    if(!v4 && s.length > LIMIT12){
      ['reflect-draft', 'hunt', 'reflect-tip'].forEach(function(k){ if(s.length > LIMIT12 && d[k] != null){ delete d[k]; s = JSON.stringify(d); } });
      if(s.length > LIMIT12 && d.reflect){ d.reflect = d.reflect.slice(0, Math.max(0, d.reflect.length - (s.length - LIMIT12) - 4)); s = JSON.stringify(d); }
    }
    return s;
  }
  function flush(){ timer = null; setv('cmi.suspend_data', 'cmi.suspend_data', pack()); commit(); }
  LMS.save = function(k, v){
    if(SKIP[k]) return;
    if(v === null || v === undefined) delete LMS.data[k]; else LMS.data[k] = String(v);
    if(!timer) timer = window.setTimeout(flush, 800);
  };
  LMS.page = function(key, n){ if(!key) return; setv('cmi.core.lesson_location', 'cmi.location', key + '/' + (n || 1)); if(!timer) timer = window.setTimeout(flush, 800); };
  LMS.progress = function(done, total){
    if(v4) setv('', 'cmi.progress_measure', (total ? Math.min(1, done / total) : 0).toFixed(2));
    if(done >= total && !complete){
      complete = true;
      if(v4) setv('', 'cmi.completion_status', 'completed'); else setv('cmi.core.lesson_status', '', 'completed');
      flush();
    }
  };
  LMS.score = function(raw, max){
    var pct = Math.round(100 * raw / (max || 1));
    setv('cmi.core.score.min', 'cmi.score.min', 0); setv('cmi.core.score.max', 'cmi.score.max', 100); setv('cmi.core.score.raw', 'cmi.score.raw', pct);
    if(v4){ setv('', 'cmi.score.scaled', (pct / 100).toFixed(2)); setv('', 'cmi.success_status', raw >= 4 ? 'passed' : 'failed'); }
    flush();
  };
  LMS.reset = function(){ LMS.data = {}; setv('cmi.suspend_data', 'cmi.suspend_data', ''); setv('cmi.core.lesson_location', 'cmi.location', ''); commit(); };
  function stamp(){
    var s = Math.max(0, Math.round((Date.now() - started) / 1000));
    if(v4) return 'PT' + s + 'S';
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (h < 10 ? '000' : h < 100 ? '00' : h < 1000 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  LMS.finish = function(){
    if(finished) return; finished = true;
    if(timer){ window.clearTimeout(timer); timer = null; }
    setv('cmi.suspend_data', 'cmi.suspend_data', pack());
    setv('cmi.core.session_time', 'cmi.session_time', stamp());
    setv('cmi.core.exit', 'cmi.exit', 'suspend');
    commit(); call('LMSFinish', 'Terminate');
  };
  document.addEventListener('chart:page', function(ev){ var d = ev.detail || {}; LMS.page(d.key, d.n); });
  window.addEventListener('pagehide', LMS.finish);
  window.addEventListener('beforeunload', LMS.finish);
})();
