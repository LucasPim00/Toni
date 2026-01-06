// script atualizado: validação simples, mailto fallback e toggle menu

// Form handling
const form = document.getElementById('contact-form');
const msgEl = document.getElementById('form-message');
const mailtoBtn = document.getElementById('mailto-btn');

function validateEmail(email) {
  // validação básica
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (form) {
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      msgEl.textContent = 'Por favor, preencha todos os campos.';
      msgEl.style.color = 'salmon';
      return;
    }
    if (!validateEmail(email)) {
      msgEl.textContent = 'Informe um e-mail válido.';
      msgEl.style.color = 'salmon';
      return;
    }

    // Aqui você pode integrar um endpoint real (ex: Formspree, Netlify Forms, sua API).
    // Como requisito: apenas front-end — então mostramos mensagem de sucesso e limpamos.
    msgEl.textContent = `Obrigado, ${name}! Sua mensagem foi recebida. Entraremos em contato em breve.`;
    msgEl.style.color = 'lightgreen';
    form.reset();
  });
}

// Botão "Enviar por e-mail" cria mailto: (fallback)
if (mailtoBtn) {
  mailtoBtn.addEventListener('click', function () {
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      msgEl.textContent = 'Para enviar por e-mail, preencha todos os campos.';
      msgEl.style.color = 'salmon';
      return;
    }
    if (!validateEmail(email)) {
      msgEl.textContent = 'Informe um e-mail válido antes de enviar.';
      msgEl.style.color = 'salmon';
      return;
    }

    const to = 'comercial@of.com';
    const subject = encodeURIComponent(`Contato via site: ${name}`);
    const body = encodeURIComponent(`Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`);
    const mailto = `mailto:${to}?subject=${subject}&body=${body}`;

    window.location.href = mailto;
  });
}

/* ==== CAROUSEL DINÂMICO ==== */
/*
Opções de uso:
- opção A (recomendada rápida): renomeie suas imagens como slide1.jpg, slide2.jpg, slide3.jpg, ...
- opção B (mais controlada): crie um arquivo /imagens/images.json contendo ["foto1.jpg","foto2.png", ...]
*/

(function() {
  const carouselTrack = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (!carouselTrack) return;

  // CONFIG
  const intervalMs = 3500;   // tempo entre slides
  const maxAttempts = 30;    // só para a tentativa automática (slide1..slide30)
  const imagesPath = 'imagens/'; // caminho relativo às imagens no site

  let slides = [];
  let currentIndex = 0;
  let timer = null;

  // Tenta carregar manifest JSON primeiro (opção B)
  fetch(imagesPath + 'images.json')
    .then(r => {
      if (!r.ok) throw new Error('sem manifest');
      return r.json();
    })
    .then(list => {
      if (Array.isArray(list) && list.length) {
        initCarousel(list.map(name => imagesPath + name));
      } else {
        throw new Error('manifest vazio');
      }
    })
    .catch(() => {
      // fallback: tenta carregar slide1.jpg, slide2.jpg, ... (opção A)
      const promises = [];
      for (let i = 1; i <= maxAttempts; i++) {
        const urlJpg = imagesPath + `slide${i}.jpg`;
        const urlPng = imagesPath + `slide${i}.png`;
        promises.push(tryImage(urlJpg).then(ok => ok ? urlJpg : null));
        promises.push(tryImage(urlPng).then(ok => ok ? urlPng : null));
      }
      Promise.all(promises).then(results => {
        const uniq = Array.from(new Set(results.filter(Boolean)));
        if (uniq.length) initCarousel(uniq);
        else {
          // se não encontrou imagens, exibe placeholder discreto
          carouselTrack.innerHTML = '<div class="carousel-slide"><div style="color:#ccc;padding:1rem">Nenhuma imagem encontrada em /imagens.<br>Coloque imagens e renomeie como slide1.jpg, slide2.jpg... ou crie images.json</div></div>';
        }
      });
    });

  // verificador simples de existência de imagem (carrega)
  function tryImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  function initCarousel(imgUrls) {
    slides = imgUrls;
    // preencher DOM
    carouselTrack.innerHTML = '';
    dotsContainer.innerHTML = '';
    imgUrls.forEach((src, idx) => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.setAttribute('data-index', idx);
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Obra ${idx+1}`;
      slide.appendChild(img);
      carouselTrack.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('data-index', idx);
      dot.addEventListener('click', () => goToIndex(idx));
      dotsContainer.appendChild(dot);
    });

    updateActive();
    startAuto();

    // controles
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // pausa ao passar mouse (opcional)
    const carouselEl = document.getElementById('carousel');
    carouselEl.addEventListener('mouseenter', pauseAuto);
    carouselEl.addEventListener('mouseleave', startAuto);

    // navegação por teclado (acessibilidade)
    carouselEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });
    carouselEl.tabIndex = 0;
  }

  function updateActive() {
    const width = carouselTrack.clientWidth;
    const translateX = - currentIndex * width;
    carouselTrack.style.transform = `translateX(${translateX}px)`;

    // dots
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach(d => d.classList.remove('active'));
    if (dots[currentIndex]) dots[currentIndex].classList.add('active');
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    updateActive();
    resetTimer();
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateActive();
    resetTimer();
  }

  function goToIndex(i) {
    currentIndex = i;
    updateActive();
    resetTimer();
  }

  function startAuto() {
    if (timer) return;
    timer = setInterval(nextSlide, intervalMs);
  }

  function pauseAuto() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function resetTimer() {
    pauseAuto();
    startAuto();
  }

  // garantir responsividade ao redimensionar (recalcula translate)
  window.addEventListener('resize', () => {
    // leve debounce
    setTimeout(updateActive, 120);
  });

})();

/* ===== GALERIA DINÂMICA POR SERVIÇO ===== */
const modal = document.getElementById('gallery-modal');
const grid = document.getElementById('gallery-grid');
const closeBtn = document.getElementById('gallery-close');

document.querySelectorAll('.service-btn[data-gallery]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const prefix = btn.dataset.gallery;
    openGallery(prefix);
  });
});

function openGallery(prefix) {
  grid.innerHTML = '';
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');

  let index = 1;
  let foundAny = false;

  function loadNext() {
    const thumb = new Image();
    thumb.src = `imagens/${prefix}${index}C.jpg`; // MINIATURA

    thumb.onload = () => {
      foundAny = true;

      // guarda a imagem grande no dataset
      thumb.dataset.full = `imagens/${prefix}${index}.jpg`;

      grid.appendChild(thumb);
      index++;
      loadNext();
    };

    thumb.onerror = () => {
      if (!foundAny) {
        grid.innerHTML = '<p style="color:#ccc">Nenhuma imagem encontrada.</p>';
      }
    };
  }

  loadNext();
}






closeBtn.addEventListener('click', closeGallery);
modal.addEventListener('click', e => {
  if (e.target === modal) closeGallery();
});

function closeGallery() {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  grid.innerHTML = '';
}

/* ===== LIGHTBOX AO CLICAR NA IMAGEM ===== */
const lightbox = document.getElementById('image-lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

// Delegação: funciona para imagens criadas dinamicamente
document.addEventListener('click', function (e) {
  const img = e.target.closest('.gallery-grid img');
  if (!img) return;

  // usa a imagem grande se existir, senão fallback
  const fullImage = img.dataset.full || img.src;

  lightboxImg.src = fullImage;
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
});


// Fechar no X
lightboxClose.addEventListener('click', closeLightbox);

// Fechar clicando fora da imagem
lightbox.addEventListener('click', function (e) {
  if (e.target === lightbox) closeLightbox();
});

function closeLightbox() {
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImg.src = '';
}
