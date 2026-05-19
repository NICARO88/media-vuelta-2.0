// ===== MENÚ HAMBURGUESA =====
const hamburger = document.querySelector('.navbar__hamburger');
const navMenu   = document.querySelector('.navbar nav');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  navMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

document.querySelectorAll('.navbar__links a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    document.body.style.overflow = '';
  });
});

// ===== CARRUSELES INFINITOS =====
function initCarousel(el) {
  const track   = el.querySelector('.carousel__track');
  const prevBtn = el.querySelector('.carousel__btn--prev');
  const nextBtn = el.querySelector('.carousel__btn--next');

  const originals = [...track.children];
  const N = originals.length;

  // Prepend clones (en orden) para ir hacia la izquierda infinitamente
  [...originals].reverse().forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.prepend(clone);
  });

  // Append clones para ir hacia la derecha infinitamente
  originals.forEach(item => {
    const clone = item.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  let current = N; // empieza en el primer item real

  function gap() {
    return parseFloat(getComputedStyle(track).gap) || 0;
  }

  function itemW() {
    return track.children[0].offsetWidth;
  }

  function goTo(index, animate = true) {
    track.style.transition = animate ? 'transform 0.35s ease' : 'none';
    track.style.transform  = `translateX(-${index * (itemW() + gap())}px)`;
    current = index;
  }

  // Reajuste silencioso al terminar la transición
  track.addEventListener('transitionend', () => {
    if (current >= N * 2) goTo(current - N, false);
    else if (current < N)  goTo(current + N, false);
  });

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  prevBtn.disabled = false;
  nextBtn.disabled = false;

  // Inicializar posición tras render
  requestAnimationFrame(() => goTo(N, false));

  window.addEventListener('resize', () => goTo(current, false));
}

document.querySelectorAll('.carousel').forEach(initCarousel);

// ===== VER MÁS TOGGLE =====
document.querySelectorAll('.servicio__toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.servicio');
    const more = card.querySelector('.servicio__desc--more');
    const expanded = !more.hidden;
    more.hidden = expanded;
    btn.textContent = expanded ? 'Ver más' : 'Ver menos';
  });
});

// ===== FORMULARIOS → WHATSAPP =====
function initWaForm(form, fields) {
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = f => (f ? f.value.trim() : '');
    const lines = ['¡Hola! Me contacto desde su sitio web.'];
    if (v(fields.nombre))   lines.push('Nombre: '   + v(fields.nombre));
    if (v(fields.correo))   lines.push('Correo: '   + v(fields.correo));
    if (v(fields.telefono)) lines.push('Teléfono: ' + v(fields.telefono));
    if (v(fields.mensaje))  lines.push('\n' + v(fields.mensaje));
    window.open(
      'https://wa.me/56973466107?text=' + encodeURIComponent(lines.join('\n')),
      '_blank'
    );
  });
}

initWaForm(
  document.querySelector('.contacto__form'),
  { nombre: document.getElementById('nombre'), correo: document.getElementById('correo'), telefono: document.getElementById('telefono'), mensaje: document.getElementById('mensaje') }
);

initWaForm(
  document.querySelector('.ct-form__form'),
  { nombre: document.getElementById('ct-nombre'), correo: document.getElementById('ct-correo'), telefono: document.getElementById('ct-telefono'), mensaje: document.getElementById('ct-mensaje') }
);

// ===== NAVBAR: sombra al hacer scroll =====
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 40
    ? '0 2px 12px rgba(0,0,0,0.08)'
    : 'none';
});
