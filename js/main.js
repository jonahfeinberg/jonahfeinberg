

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
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage ||
        (currentPage === '' && link.getAttribute('href') === 'index.html')) {
      link.classList.add('active');
    }
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
  const lightbox    = document.querySelector('.lightbox');
  const lightboxImg = lightbox?.querySelector('img');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('.g-item').forEach(item => {
      item.addEventListener('click', () => {
        const src = item.querySelector('img')?.src;
        if (!src) return;
        lightboxImg.src = src;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

    const getImgs = () => [...document.querySelectorAll('.g-item img')].map(i => i.src);
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      const imgs = getImgs();
      const idx  = imgs.indexOf(lightboxImg.src);
      if (e.key === 'ArrowRight' && idx < imgs.length - 1) lightboxImg.src = imgs[idx + 1];
      if (e.key === 'ArrowLeft'  && idx > 0)               lightboxImg.src = imgs[idx - 1];
    });
  }

  // Portfolio item click
  document.querySelectorAll('.portfolio-item[data-link]').forEach(item => {
    item.addEventListener('click', () => {
      const link = item.getAttribute('data-link');
      if (link) window.open(link, '_blank');
    });
  });

});
// video manager
document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".app-video-col").forEach(col => {
    const video = col.querySelector("video");

    col.addEventListener("click", async () => {

      if (!document.fullscreenElement) {
        if (video.requestFullscreen) {
          await video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          await video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
          await video.msRequestFullscreen();
        }
      }

      video.controls = true;
      video.currentTime = 0;
      video.play();

      col.classList.add("playing");
    });
  });

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      document.querySelectorAll(".project-video").forEach(v => {
        v.pause();
        v.controls = false;
        v.closest(".app-video-col")?.classList.remove("playing");
      });
    }
  });

});
  }
});
