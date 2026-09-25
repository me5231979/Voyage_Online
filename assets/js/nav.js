/* Global header: the burger on narrow screens. Closes on a link tap, a tap
   outside, or Escape. */
(function () {
  var nav = document.querySelector('.gnav'); if (!nav) return;
  var btn = nav.querySelector('.gnav__burger'), links = nav.querySelector('.gnav__links');
  if (!btn || !links) return;
  function setOpen(open) { nav.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu'); }
  btn.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', function (e) { if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); btn.focus(); } });
})();
