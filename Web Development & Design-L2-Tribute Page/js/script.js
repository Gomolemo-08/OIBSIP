// Scroll-reveal animation
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  items.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });
} else {
  items.forEach((el) => el.classList.add('in'));
}

// Nav: shadow on scroll + mobile menu
const nav = document.getElementById('nav');
const menu = document.getElementById('menu');
const btn = document.getElementById('menuBtn');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
btn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') { menu.classList.remove('open'); btn.setAttribute('aria-expanded', false); }
});

// Hide broken images gracefully (fallback monogram / dark card remains)
document.querySelectorAll('img').forEach((img) => {
  img.addEventListener('error', () => img.classList.add('broken'));
});

// Gallery lightbox
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('p');
document.querySelectorAll('.gallery figure').forEach((fig) => {
  fig.addEventListener('click', () => {
    const img = fig.querySelector('img');
    lbImg.src = img.src.replace('width=600', 'width=1200');
    lbImg.alt = img.alt;
    lbCap.textContent = fig.querySelector('figcaption').textContent;
    lb.hidden = false;
  });
});
const closeLb = () => { lb.hidden = true; lbImg.src = ''; };
document.getElementById('lbClose').addEventListener('click', closeLb);
lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
