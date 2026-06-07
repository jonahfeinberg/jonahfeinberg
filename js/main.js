

document.addEventListener('DOMContentLoaded', () => {

  // Dark mode 
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if ((savedTheme || (prefersDark ? 'dark' : 'light')) === 'dark') {
    html.setAttribute('data-theme', 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      isDark ? html.removeAttribute('data-theme') : html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });
  }

  // Scroll progress bar 
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // Active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('active');
  });

  // Mobile hamburger 
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  // Scroll-triggered fade-up 
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  //  Parallax
  const heroJ = document.getElementById('heroJ');
  if (heroJ) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          heroJ.style.transform = `translateY(${window.scrollY * 0.35}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  //  Lightbox
  const lightbox      = document.querySelector('.lightbox');
  const lightboxImg   = lightbox?.querySelector('img');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  const lightboxPrev  = lightbox?.querySelector('.lightbox-prev');
  const lightboxNext  = lightbox?.querySelector('.lightbox-next');

  if (lightbox && lightboxImg) {
    const getImgs = () => [...document.querySelectorAll('.g-item img')].map(i => i.src);

    const updateArrows = () => {
      if (!lightboxPrev || !lightboxNext) return;
      const imgs = getImgs();
      const idx  = imgs.indexOf(lightboxImg.src);
      lightboxPrev.classList.toggle('hidden', idx === 0);
      lightboxNext.classList.toggle('hidden', idx === imgs.length - 1);
    };

    const showImg = src => {
      lightboxImg.src = src;
      updateArrows();
    };

    document.querySelectorAll('.g-item').forEach(item => {
      item.addEventListener('click', () => {
        const src = item.querySelector('img')?.src;
        if (!src) return;
        showImg(src);
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    const navigate = dir => {
      const imgs = getImgs();
      const idx  = imgs.indexOf(lightboxImg.src);
      const next = idx + dir;
      if (next >= 0 && next < imgs.length) showImg(imgs[next]);
    };

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', () => navigate(-1));
    lightboxNext?.addEventListener('click', () => navigate(1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')      { closeLightbox(); return; }
      if (e.key === 'ArrowRight')  navigate(1);
      if (e.key === 'ArrowLeft')   navigate(-1);
    });

    // Touch swipe
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // Back to top
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Portfolio item click
  document.querySelectorAll('.portfolio-item[data-link]').forEach(item => {
    item.addEventListener('click', () => {
      const link = item.getAttribute('data-link');
      if (link) window.open(link, '_blank');
    });
  });

});
// intro
const introBg = document.getElementById('intro-bg');
const introIconWrap = document.getElementById('intro-icon-wrap');
if (introBg) {
  if (sessionStorage.getItem('intro-seen')) {
    introBg.style.display = 'none';
    introIconWrap.style.display = 'none';
  } else {
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      introBg.classList.add('leaving');
      introIconWrap.classList.add('leaving');
      introBg.addEventListener('transitionend', () => {
        introBg.remove();
        introIconWrap.remove();
        document.body.style.overflow = '';
        sessionStorage.setItem('intro-seen', '1');
      }, { once: true });
    }, 2000);
  }
}

// videos
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".project-video").forEach(video => {
    const container = video.closest(".app-video-col");
    video.controls = false;

    container.addEventListener("click", () => {
      if (container.classList.contains("playing")) return;
      video.controls = true;
      video.play();
      container.classList.add("playing");
    });
  });
});
