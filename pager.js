/* ══════════ THE PAGER: the scroll site becomes a book ══════════
   Same engine as Manager Foundations. Runs before app.js. Regroups every
   top-level block into .page articles at data-pg markers, one visible at a
   time. If anything fails, the paged class is removed and the scroll layout
   stands. */
(function(){
'use strict';
try{
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var main = document.getElementById('main');
  if(!main) throw new Error('no main');
  var PLAN = [
    { sel:'section.hero',     key:'home',      label:'Welcome',                    mode:'whole' },
    { sel:'#mission',         key:'mission',   label:'The mission',                mode:'whole' },
    { sel:'#welcome',         key:'welcome',   label:'Lesson 1: Welcome',          mode:'whole' },
    { sel:'#history',         key:'history',   label:'Lesson 2: Our history',      mode:'whole' },
    { sel:'#timeline',        key:'timeline',  label:'Lesson 2: The timeline',     mode:'whole' },
    { sel:'#leaders',         key:'leaders',   label:'Lesson 2: Our leadership',   mode:'whole' },
    { sel:'#numbers',         key:'numbers',   label:'Lesson 3: By the numbers',   mode:'whole' },
    { sel:'#beliefs',         key:'beliefs',   label:'Lesson 4: The four beliefs', mode:'whole' },
    { sel:'#compass',         key:'compass',   label:'Lesson 4: Belief compass',   mode:'whole' },
    { sel:'#grow',            key:'grow',      label:'Lesson 5: Dare to grow',     mode:'whole' },
    { sel:'#quiz',            key:'quiz',      label:'Lesson 6: Quick check',      mode:'whole' },
    { sel:'#nextstep',        key:'nextstep',  label:'Lesson 6: Next steps',       mode:'whole' },
    { sel:'#learn',           key:'learn',     label:'Keep going',                 mode:'whole', extras:['footer'] }
  ];
  var TRACKED = [
    ['welcome','01','Welcome'], ['history','02','Our history'], ['leaders','03','Our leadership'], ['numbers','04','By the numbers'],
    ['beliefs','05','The four beliefs'], ['compass','06','Belief compass'], ['grow','07','Dare to grow'], ['quiz','08','Quick check'], ['nextstep','09','Next steps']
  ];
  var pages = [], secFirst = {};
  var topSpan = document.getElementById('top');
  var frag = document.createDocumentFragment();
  function mkPage(key, secLabel, pgLabel){
    var art = document.createElement('article');
    art.className = 'page';
    art.setAttribute('data-sec', key);
    art.setAttribute('data-label', pgLabel);
    art.setAttribute('aria-hidden', 'true');
    art.tabIndex = -1;
    if(!(key in secFirst)) secFirst[key] = pages.length;
    var meta = { el:art, key:key, secLabel:secLabel, pgLabel:pgLabel, n:0 };
    pages.push(meta);
    frag.appendChild(art);
    return meta;
  }
  PLAN.forEach(function(cfg){
    var S = main.querySelector(cfg.sel) || document.querySelector(cfg.sel);
    if(!S) return;
    if(cfg.mode === 'whole'){
      var pg = mkPage(cfg.key, cfg.label, cfg.label);
      pg.el.appendChild(S);
      (cfg.extras || []).forEach(function(x){
        var ex = (x === 'footer') ? document.querySelector('body > footer') : main.querySelector(x);
        if(ex) pg.el.appendChild(ex);
      });
    } else {
      var wrap = S.querySelector('.wrap');
      if(!wrap) return;
      var kids = Array.prototype.slice.call(wrap.children);
      var groups = [], cur = [];
      kids.forEach(function(k){
        if(k.hasAttribute && k.hasAttribute('data-pg') && cur.length){ groups.push(cur); cur = []; }
        cur.push(k);
      });
      if(cur.length) groups.push(cur);
      groups.forEach(function(g, gi){
        var label = (gi === 0) ? cfg.label : (g[0].getAttribute('data-pg') || cfg.label);
        var pg = mkPage(cfg.key, cfg.label, label);
        var shell = document.createElement('section');
        shell.className = S.className;
        var al = S.getAttribute('aria-label');
        if(al) shell.setAttribute('aria-label', al + (groups.length > 1 ? ' (' + (gi+1) + ' of ' + groups.length + ')' : ''));
        if(gi === 0 && S.id) shell.id = S.id;
        var w = document.createElement('div');
        w.className = 'wrap';
        g.forEach(function(k){ w.appendChild(k); });
        shell.appendChild(w);
        pg.el.appendChild(shell);
      });
      if(S.parentNode) S.parentNode.removeChild(S);
    }
  });
  if(!pages.length) throw new Error('no pages');
  var perSec = {};
  pages.forEach(function(p){ perSec[p.key] = (perSec[p.key] || 0) + 1; p.n = perSec[p.key]; });
  pages.forEach(function(p){
    var t = perSec[p.key];
    p.el.setAttribute('aria-label', p.secLabel + (t > 1 ? ': ' + p.pgLabel + ' (page ' + p.n + ' of ' + t + ')' : ''));
  });
  while(main.firstChild) main.removeChild(main.firstChild);
  main.appendChild(frag);
  if(topSpan && pages[0]) pages[0].el.insertBefore(topSpan, pages[0].el.firstChild);
  var more = document.createElement('span');
  more.id = 'pgMore';
  more.setAttribute('aria-hidden', 'true');
  more.innerHTML = 'Scroll for more <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  main.appendChild(more);

  var bbSec = document.getElementById('bbSec'), bbDots = document.getElementById('bbDots'),
      bbCount = document.getElementById('bbCount'),
      prevBtn = document.getElementById('pgPrev'), nextBtn = document.getElementById('pgNext');
  if(bbDots){
    /* one dot per page; pages whose activity is tracked keep data-rail so the
       done fill still applies  */
    var railFor = {};
    var trackedKeys = {};
    TRACKED.forEach(function(s){ trackedKeys[s[0]] = s; });
    bbDots.innerHTML = pages.map(function(p, i){
      var rk = railFor[p.key] || p.key;
      var t = trackedKeys[rk];
      var name = 'Page ' + (i + 1) + ' of ' + pages.length + ' · ' + p.pgLabel;
      return '<a class="bb-dot" href="#p/' + p.key + '/' + p.n + '" data-idx="' + i + '"' +
        (t ? ' data-rail="' + rk + '"' : '') + ' data-name="' + name + '"' +
        ' title="' + name + '" aria-label="' + name + '">' +
        '<span class="dot" aria-hidden="true"></span></a>';
    }).join('');
  }
  var cur = -1, animT = null;
  var store = (function(){
    try{ var t = 'vvo-page-test'; window.localStorage.setItem(t,'1'); window.localStorage.removeItem(t); return window.localStorage; }
    catch(e){ return null; }
  })();
  function writeHash(p){
    try{ window.history.replaceState(null, '', '#p/' + p.key + '/' + p.n); }catch(e){}
    if(store){ try{ store.setItem('vvo-page', p.key + '/' + p.n); }catch(e){} }
  }
  function hashIndex(h){
    if(!h) return null;
    h = String(h).replace(/^#/, '');
    if(!h) return null;
    if(h.indexOf('p/') === 0){
      var bits = h.split('/');
      var k = bits[1], n = parseInt(bits[2], 10) || 1;
      for(var i = 0; i < pages.length; i++){ if(pages[i].key === k && pages[i].n === n) return i; }
      return (k in secFirst) ? secFirst[k] : null;
    }
    if(h === 'top' || h === 'main') return 0;
    var el = document.getElementById(h);
    if(!el) return null;
    var pg = el.closest ? el.closest('.page') : null;
    if(!pg) return null;
    for(var j = 0; j < pages.length; j++){ if(pages[j].el === pg) return j; }
    return null;
  }
  function checkMore(){
    if(cur < 0) return;
    var el = pages[cur].el;
    var scrollable = el.scrollHeight - el.clientHeight > 24;
    var nearEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 32;
    main.classList.toggle('more', scrollable && !nearEnd);
  }
  function updateBar(){
    var p = pages[cur];
    if(bbSec) bbSec.textContent = p.secLabel;
    if(bbCount) bbCount.textContent = (cur + 1) + ' / ' + pages.length;
    if(prevBtn) prevBtn.disabled = cur === 0;
    if(nextBtn) nextBtn.disabled = cur === pages.length - 1;
    document.querySelectorAll('.bb-dot').forEach(function(a){
      var on = parseInt(a.getAttribute('data-idx'), 10) === cur;
      a.classList.toggle('cur', on);
      if(on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  function clearAnim(){ pages.forEach(function(p){ p.el.classList.remove('pg-in-r','pg-in-l','pg-out','pg-out-l','pg-out-r'); }); }
  function go(i, opts){
    opts = opts || {};
    if(typeof i !== 'number' || i < 0 || i >= pages.length) return;
    if(i === cur){ if(opts.focus) pages[i].el.focus({ preventScroll:true }); return; }
    var from = cur >= 0 ? pages[cur] : null;
    var to = pages[i];
    var dir = from && i < cur ? -1 : 1;
    cur = i;
    if(animT){ window.clearTimeout(animT); animT = null; clearAnim(); }
    to.el.scrollTop = 0;
    to.el.classList.add('cur');
    to.el.removeAttribute('aria-hidden');
    if(from){
      from.el.classList.remove('cur');
      from.el.setAttribute('aria-hidden', 'true');
      if(!reduce){
        to.el.classList.add(dir > 0 ? 'pg-in-r' : 'pg-in-l');
        from.el.classList.add('pg-out', dir > 0 ? 'pg-out-l' : 'pg-out-r');
        animT = window.setTimeout(function(){ animT = null; clearAnim(); }, 420);
      }
      var ae = document.activeElement;
      if(opts.focus || (ae && from.el.contains(ae))) to.el.focus({ preventScroll:true });
    } else if(opts.focus){ to.el.focus({ preventScroll:true }); }
    updateBar();
    writeHash(to);
    checkMore();
    try{ document.dispatchEvent(new CustomEvent('chart:page', { detail:{ key:to.key, index:cur, n:to.n, label:to.pgLabel } })); }catch(e){}
  }
  function goToEl(el){
    if(!el || !el.closest) return;
    var pg = el.closest('.page');
    if(!pg) return;
    for(var i = 0; i < pages.length; i++){
      if(pages[i].el === pg){ go(i); if(el !== pg){ try{ el.scrollIntoView({ block:'start' }); }catch(e){} } return; }
    }
  }
  window.chartPager = {
    go: go, goToEl: goToEl,
    goToKey: function(k){ if(k in secFirst) go(secFirst[k]); },
    current: function(){ return cur >= 0 ? { key: pages[cur].key, index: cur, n: pages[cur].n } : { key:'', index:0, n:1 }; },
    count: pages.length
  };
  document.addEventListener('click', function(e){
    if(e.defaultPrevented) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href || href === '#') return;
    var id = href.slice(1);
    if(id === 'main'){ e.preventDefault(); if(cur >= 0) pages[cur].el.focus({ preventScroll:true }); return; }
    var idx = hashIndex(href);
    if(idx === null) return;
    e.preventDefault();
    go(idx, { focus:true });
    var el = document.getElementById(id);
    if(el && pages[idx].el.contains(el) && el !== pages[idx].el){ try{ el.scrollIntoView({ block:'start' }); }catch(err){} }
  });
  window.addEventListener('hashchange', function(){
    var idx = hashIndex(window.location.hash);
    if(idx !== null && idx !== cur) go(idx);
  });
  if(prevBtn) prevBtn.addEventListener('click', function(){ go(cur - 1); });
  if(nextBtn) nextBtn.addEventListener('click', function(){ go(cur + 1); });
  document.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if(document.body.classList.contains('menu-open') || document.body.classList.contains('oracle-open')) return;
    var pp = document.getElementById('progPanel');
    if(pp && !pp.hidden) return;
    e.preventDefault();
    go(cur + (e.key === 'ArrowRight' ? 1 : -1));
  });
  var sx = 0, sy = 0, swiping = false;
  main.addEventListener('touchstart', function(e){
    if(e.touches.length === 1){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; swiping = true; } else swiping = false;
  }, { passive:true });
  main.addEventListener('touchend', function(e){
    if(!swiping) return;
    swiping = false;
    var t = e.changedTouches && e.changedTouches[0];
    if(!t) return;
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
  }, { passive:true });
  window.addEventListener('resize', checkMore, { passive:true });
  document.addEventListener('scroll', function(e){ if(cur >= 0 && e.target === pages[cur].el) checkMore(); }, true);
  window.addEventListener('load', checkMore);
  if(window.ResizeObserver){
    try{
      var ro = new ResizeObserver(function(){ checkMore(); });
      pages.forEach(function(p){ Array.prototype.slice.call(p.el.children).forEach(function(ch){ ro.observe(ch); }); });
    }catch(e){}
  }
  var startIdx = hashIndex(window.location.hash);
  if(startIdx === null && store){
    try{
      var saved = store.getItem('vvo-page');
      if(saved){ var sb = saved.split('/'); startIdx = hashIndex('p/' + sb[0] + '/' + (sb[1] || 1)); }
    }catch(e){}
  }
  go(startIdx === null ? 0 : startIdx);
}catch(err){
  document.documentElement.classList.remove('paged');
  var bar = document.getElementById('bookBar');
  if(bar) bar.hidden = true;
}
})();
