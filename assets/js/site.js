(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const nav = doc.getElementById('main-nav');
  const menuToggle = doc.getElementById('menuToggle');
  const mobileMenu = doc.getElementById('mobileMenu');
  const main = doc.querySelector('main');
  const footer = doc.querySelector('footer');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('js');

  const progress = doc.createElement('div');
  progress.className = 'page-progress';
  progress.setAttribute('aria-hidden', 'true');
  doc.body.prepend(progress);

  const backToTop = doc.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.textContent = '↑';
  doc.body.append(backToTop);

  const closeMenu = (restoreFocus = false) => {
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
    doc.body.classList.remove('menu-open');
    main?.removeAttribute('inert');
    footer?.removeAttribute('inert');
    if (restoreFocus) menuToggle.focus();
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.classList.add('open');
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    mobileMenu.setAttribute('aria-hidden', 'false');
    doc.body.classList.add('menu-open');
    main?.setAttribute('inert', '');
    footer?.setAttribute('inert', '');
    mobileMenu.querySelector('a')?.focus();
  };

  if (menuToggle && mobileMenu) {
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle.addEventListener('click', () => {
      if (mobileMenu.classList.contains('open')) closeMenu(true);
      else openMenu();
    });
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  }

  doc.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (doc.querySelector('.lightbox.open')) closeLightbox();
      else if (mobileMenu?.classList.contains('open')) closeMenu(true);
    }
  });

  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  let activeHref = '';
  if (currentFile === 'index.html') activeHref = 'index.html';
  else if (currentFile === 'work.html' || currentFile.startsWith('work-')) activeHref = 'work.html';
  else if (currentFile === 'services.html' || currentFile.startsWith('services-')) activeHref = 'services.html';
  else if (currentFile === 'about.html') activeHref = 'about.html';
  if (activeHref) {
    doc.querySelectorAll(`#main-nav .nav-links a[href="${activeHref}"], .mobile-menu a[href="${activeHref}"]`).forEach(link => {
      link.setAttribute('aria-current', 'page');
    });
  }

  const updateScrollUI = () => {
    const y = window.scrollY;
    nav?.classList.toggle('scrolled', y > 40);
    const max = doc.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    backToTop.classList.toggle('visible', y > 650);
  };
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', () => {
    updateScrollUI();
    if (window.innerWidth > 860) closeMenu();
  });
  updateScrollUI();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  const revealTargets = doc.querySelectorAll([
    'main section:not(.hero) > .container',
    '.flagship-card',
    '.grid-tier-item',
    '.service-card',
    '.work-item',
    '.testimonial-card',
    '.video-card'
  ].join(','));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('revealed'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px' });
    revealTargets.forEach((element, index) => {
      element.classList.add('reveal-ready');
      element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
      revealObserver.observe(element);
    });
  }

  const lightbox = doc.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Image preview');
  lightbox.innerHTML = '<div class="lightbox-dialog"><button class="lightbox-close" type="button" aria-label="Close image preview">×</button><img class="lightbox-image" alt=""><p class="lightbox-caption"></p></div>';
  doc.body.append(lightbox);
  const lightboxImage = lightbox.querySelector('.lightbox-image');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  let lastLightboxTrigger = null;

  function openLightbox(trigger) {
    lastLightboxTrigger = trigger;
    lightboxImage.src = trigger.currentSrc || trigger.src;
    lightboxImage.alt = trigger.alt || '';
    lightboxCaption.textContent = trigger.alt || '';
    lightboxCaption.hidden = !trigger.alt;
    lightbox.classList.add('open');
    doc.body.classList.add('menu-open');
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    doc.body.classList.remove('menu-open');
    lightboxImage.removeAttribute('src');
    lastLightboxTrigger?.focus();
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  doc.querySelectorAll('.case-photo-grid img, .case-image-single img, .case-close-sequence img, .campaign-examples img').forEach(image => {
    if (image.closest('a')) return;
    image.classList.add('lightbox-trigger');
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `${image.alt || 'Project image'} — open larger view`);
    image.addEventListener('click', () => openLightbox(image));
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(image);
      }
    });
  });

  const videos = [...doc.querySelectorAll('video')];
  videos.forEach(video => {
    video.addEventListener('play', () => {
      videos.forEach(other => { if (other !== video) other.pause(); });
    });
  });

  doc.querySelectorAll('a[target="_blank"]').forEach(link => {
    const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    link.setAttribute('rel', [...rel].join(' '));
  });
})();
