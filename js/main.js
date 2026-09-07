// -- main --
// site chrome and page behaviors. the inline head script sets the theme
// before paint, so nothing here needs to re-apply it. page-specific blocks
// are feature-guarded and no-op elsewhere.

const siteMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => siteMotion.matches ? 'instant' : 'smooth';

const siteStorage = {
  get(store, key) { try { return window[store].getItem(key); } catch { return null; } },
  set(store, key, value) { try { window[store].setItem(key, value); } catch { /* storage is optional */ } }
};

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;

  // -- theme --
  const themeToggle = document.getElementById('themeToggle');
  const themeHint = document.getElementById('themeHint');

  // hint once, ever
  if (themeHint && !siteStorage.get('localStorage', 'themeHintSeen')) {
    themeHint.hidden = false;
    siteStorage.set('localStorage', 'themeHintSeen', '1');
  }

  if (themeToggle) {
    const updateThemeLabel = () => {
      const dark = html.getAttribute('data-theme') === 'dark';
      themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle.setAttribute('aria-pressed', String(dark));
    };
    updateThemeLabel();
    themeToggle.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      isDark ? html.removeAttribute('data-theme') : html.setAttribute('data-theme', 'dark');
      siteStorage.set('localStorage', 'theme', isDark ? 'light' : 'dark');
      if (themeHint) themeHint.hidden = true;
      updateThemeLabel();
    });
  }

  // -- nav --
  const path = window.location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('active');
  });

  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    const nav = hamburger.closest('nav');
    const mobileMenu = window.matchMedia('(max-width: 900px)');
    const links = [...navLinks.querySelectorAll('a')];
    let menuOpen = false;
    navLinks.id = navLinks.id || 'site-navigation';
    hamburger.type = 'button';
    hamburger.setAttribute('aria-controls', navLinks.id);
    links.forEach((link, index) => {
      link.parentElement.style.setProperty('--menu-order', index);
      if (link.classList.contains('active')) link.setAttribute('aria-current', 'page');
    });

    const setMenu = (open, returnFocus = false) => {
      menuOpen = open && mobileMenu.matches;
      hamburger.setAttribute('aria-expanded', String(menuOpen));
      hamburger.setAttribute('aria-label', menuOpen ? 'Close menu' : 'Open menu');
      navLinks.classList.toggle('open', menuOpen);
      navLinks.inert = mobileMenu.matches && !menuOpen;
      if (returnFocus) hamburger.focus({ preventScroll: true });
    };

    setMenu(false);
    nav.classList.add('menu-ready');
    hamburger.addEventListener('click', event => {
      setMenu(!menuOpen);
      // The list precedes the toggle in the original DOM. Keyboard opening
      // enters the links directly; pointer opening keeps focus on the toggle.
      if (menuOpen && event.detail === 0) links[0]?.focus({ preventScroll: true });
    });
    links.forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (menuOpen && event.key === 'Escape') {
        event.preventDefault();
        setMenu(false, true);
      }
    });
    document.addEventListener('pointerdown', event => {
      if (menuOpen && !nav.contains(event.target)) setMenu(false);
    });
    nav.addEventListener('focusout', event => {
      // relatedTarget identifies the destination before the browser has assigned
      // activeElement, keeping theme/toggle focus changes inside the open menu.
      if (menuOpen && event.relatedTarget && !nav.contains(event.relatedTarget)) setMenu(false);
    });
    mobileMenu.addEventListener('change', () => {
      const focusWasOnToggle = document.activeElement === hamburger;
      const focusWasOnLink = navLinks.contains(document.activeElement);
      setMenu(false);
      if (!mobileMenu.matches && focusWasOnToggle) links.find(link => link.classList.contains('active'))?.focus({ preventScroll: true });
      if (mobileMenu.matches && focusWasOnLink) hamburger.focus({ preventScroll: true });
    });
  }

  // -- reveal --
  const fadeObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
    });
  }, { threshold: 0.08 }) : null;
  document.querySelectorAll('.fade-up').forEach(el => fadeObserver ? fadeObserver.observe(el) : el.classList.add('visible'));

  // -- scroll fx --
  const heroJ = document.getElementById('heroJ');
  if (heroJ) {
    let ticking = false;
    let heroVisible = true;
    if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
    }).observe(heroJ.closest('.hero'));
    window.addEventListener('scroll', () => {
      if (!ticking && heroVisible && !siteMotion.matches && !document.hidden) {
        requestAnimationFrame(() => {
          heroJ.style.transform = `translateY(${window.scrollY * 0.35}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    siteMotion.addEventListener('change', () => { if (siteMotion.matches) heroJ.style.transform = ''; });
  }

  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: scrollBehavior() }));
  }

  // -- lightbox --
  const lightbox      = document.querySelector('.lightbox');
  const lightboxImg   = lightbox?.querySelector('img');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  const lightboxPrev  = lightbox?.querySelector('.lightbox-prev');
  const lightboxNext  = lightbox?.querySelector('.lightbox-next');

  if (lightbox && lightboxImg && typeof lightbox.showModal === 'function') {
    const items = [...document.querySelectorAll('.g-item')];
    let index = 0, opener = null, previousOverflow = '';
    const error = lightbox.querySelector('.lightbox-error');
    const show = next => {
      index = next;
      const item = items[index];
      error.hidden = true;
      lightboxImg.alt = item.querySelector('img').alt;
      // Use the capped viewing derivative in the lightbox; the source image
      // remains available through the explicit "Open original" link.
      lightboxImg.src = item.dataset.view || item.href;
      lightbox.querySelector('.lightbox-original').href = item.href;
      lightboxPrev.disabled = index === 0;
      lightboxNext.disabled = index === items.length - 1;
      lightboxPrev.classList.toggle('hidden', lightboxPrev.disabled);
      lightboxNext.classList.toggle('hidden', lightboxNext.disabled);
    };
    const navigate = direction => {
      const next = index + direction;
      if (next >= 0 && next < items.length) show(next);
    };
    items.forEach((item, i) => item.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); opener = item;
      previousOverflow = document.body.style.overflow;
      show(i); lightbox.classList.add('open'); lightbox.showModal();
      document.body.style.overflow = 'hidden';
    }));
    lightboxClose.addEventListener('click', () => lightbox.close());
    lightboxPrev.addEventListener('click', () => navigate(-1));
    lightboxNext.addEventListener('click', () => navigate(1));
    lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', () => {
      lightbox.classList.remove('open'); document.body.style.overflow = previousOverflow;
      lightboxImg.removeAttribute('src'); opener?.focus({ preventScroll: true });
    });
    lightbox.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    lightboxImg.addEventListener('error', () => { if (lightbox.open) error.hidden = false; });
    let startX = 0, startY = 0;
    lightbox.addEventListener('touchstart', event => { startX = event.touches[0].clientX; startY = event.touches[0].clientY; }, { passive: true });
    lightbox.addEventListener('touchend', event => {
      const dx = event.changedTouches[0].clientX - startX, dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) navigate(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // Native controls remain usable without JS; enhanced play buttons load on demand.
  const projectVideos = [...document.querySelectorAll('.project-video')];
  projectVideos.forEach(video => {
    const container = video.closest('.app-video-col');
    const play = container?.querySelector('.app-video-placeholder');
    if (!play) return;
    container.classList.add('video-ready');
    video.controls = false;
    const error = document.createElement('p');
    error.className = 'video-error'; error.hidden = true; error.setAttribute('role', 'alert');
    error.textContent = 'This video couldn’t play. Please try again.';
    container.appendChild(error);
    play.addEventListener('click', async () => {
      error.hidden = true; video.controls = true; container.classList.add('playing');
      video.focus({ preventScroll: true });
      try { await video.play(); }
      catch { container.classList.remove('playing'); video.controls = false; error.hidden = false; play.focus({ preventScroll: true }); }
    });
    video.addEventListener('play', () => { projectVideos.forEach(other => { if (other !== video) other.pause(); }); });
    if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) video.pause();
    }).observe(container);
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  });

  // The existing breathing frame now sleeps after it settles.
  const frame = document.getElementById('frame');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (frame) {
    let cur=0, target=0, lastY=window.scrollY, lastT=performance.now(), raf=0;
    const breathe=()=>{
      raf=0;
      if(motionPreference.matches || document.hidden) {cur=target=0;html.style.setProperty('--frame-extra','0px');return;}
      target*=.94;cur+=(target-cur)*.1;
      html.style.setProperty('--frame-extra',cur.toFixed(2)+'px');
      if(cur>.01 || target>.01)raf=requestAnimationFrame(breathe);
      else {cur=target=0;html.style.setProperty('--frame-extra','0px');}
    };
    window.addEventListener('scroll',()=>{
      const now=performance.now();
      if(!motionPreference.matches)target=Math.min(10,Math.abs(window.scrollY-lastY)/Math.max(now-lastT,1)*5);
      lastY=window.scrollY;lastT=now;
      if(!raf && !motionPreference.matches)raf=requestAnimationFrame(breathe);
    },{passive:true});
    motionPreference.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;cur=target=0;html.style.setProperty('--frame-extra','0px');});
  }
});

// -- intro --
// "Over and under": the selected study, played once per session.
const introBg = document.getElementById('intro-bg');
const introIconWrap = document.getElementById('intro-icon-wrap');
if (introBg) {
  const seenKey = 'intro-over-under-seen';
  const preview = new URLSearchParams(location.search).get('intro') === 'preview';
  const previousOverflow = document.body.style.overflow;
  const arrivals = [];
  let timer;
  const motionChanged = () => { if (siteMotion.matches) finishIntro(); };
  const finishIntro = () => {
    clearTimeout(timer);
    arrivals.forEach(animation => animation.cancel());
    siteMotion.removeEventListener('change', motionChanged);
    introBg.remove(); introIconWrap?.remove();
    document.body.style.overflow = previousOverflow;
    siteStorage.set('sessionStorage', seenKey, '1');
  };
  if ((!preview && siteStorage.get('sessionStorage', seenKey)) || siteMotion.matches) finishIntro();
  else {
    document.body.style.overflow = 'hidden';
    // Keep the sampler's exact geometry, stagger, masks, and deceleration.
    introIconWrap?.querySelectorAll('rect').forEach((piece, i) => {
      if (!piece.animate) return; // A static SVG remains available in older browsers.
      const sign = i % 2 ? 1 : -1;
      const start = (.03 + i * .025) * 3800;
      const end = (.27 + i * .027) * 3800;
      arrivals.push(piece.animate([
        { transform: `translateY(${sign * 38}px)`, clipPath: sign > 0 ? 'inset(0 0 100% 0)' : 'inset(100% 0 0 0)' },
        { transform: 'translateY(0px)', clipPath: 'inset(0 0 0 0)' }
      ], { delay: start, duration: end - start, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' }));
    });
    timer = setTimeout(() => {
      introBg.classList.add('leaving'); introIconWrap?.classList.add('leaving');
      introBg.addEventListener('transitionend', finishIntro, { once: true });
      timer = setTimeout(finishIntro, 1500); // cleanup also runs if transition events never fire
    }, 1800); // Let all four strokes resolve, then hold before revealing the page.
    siteMotion.addEventListener('change', motionChanged);
  }
}

// -- questionnaire --
// the /start wizard. self-guards, so it no-ops on every other page.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wizardForm');
  if (!form) return;

  const yearFounded = document.getElementById('yearFounded');
  if (yearFounded) yearFounded.max = new Date().getFullYear();
  const screenDetails = document.getElementById('screenDetails');
  const continueBtn = document.getElementById('continueBtn');
  const backBtn = document.getElementById('backBtn');
  const submitBtn = document.getElementById('submitBtn');
  const confirmation = document.getElementById('wizardConfirmation');

  let submitted = false, submitting = false;
  const submissionError = document.getElementById('submissionError');

  // -- draft persistence --
  // autosave answers so a refresh does not lose progress. files can't serialize
  const DRAFT_KEY = 'project-questionnaire-draft';
  const SKIP_FIELDS = new Set(['bot-field', 'form-name']);

  const collectDraft = () => {
    const data = {};
    form.querySelectorAll('input, textarea, select').forEach(el => {
      if (!el.name || el.type === 'file' || SKIP_FIELDS.has(el.name)) return;
      if (el.type === 'checkbox') {
        if (el.checked) (data[el.name] = data[el.name] || []).push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else if (el.value) {
        data[el.name] = el.value;
      }
    });
    return data;
  };

  const saveDraft = () => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft())); } catch (e) { /* no storage */ }
  };

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* no storage */ }
  };

  const applyDraft = () => {
    let data;
    try { data = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { return; }
    if (!data || typeof data !== 'object') return;
    Object.entries(data).forEach(([name, value]) => {
      form.querySelectorAll(`[name="${CSS.escape(name)}"]`).forEach(el => {
        if (el.type === 'file') return;
        if (el.type === 'radio') el.checked = el.value === value;
        else if (el.type === 'checkbox') el.checked = Array.isArray(value) ? value.includes(el.value) : el.value === value;
        else el.value = value;
      });
    });
  };

  // restore first
  applyDraft();

  let saveTimer;
  form.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 300);
  });
  form.addEventListener('change', saveDraft);
  window.addEventListener('pagehide', () => { if (!submitted) saveDraft(); });

  // -- screens --
  // package vs details, driven by History so Back/Forward work
  const showScreen = (name, moveFocus = true) => {
    document.querySelectorAll('[data-screen]').forEach(el => {
      el.hidden = el.dataset.screen !== name;
    });
    const screen = document.querySelector(`[data-screen="${name}"]`);
    if (screen && moveFocus) { screen.tabIndex = -1; screen.focus({ preventScroll: true }); }
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  };

  history.replaceState({ screen: 'package' }, '', location.href);
  showScreen('package', false);

  window.addEventListener('popstate', e => {
    if (submitted) return;
    showScreen(e.state?.screen === 'details' ? 'details' : 'package');
  });

  // -- required groups --
  const groupIsAnswered = group => !!group.querySelector('input:checked');

  const refreshIndicator = group => {
    const indicator = group.closest('.field')?.querySelector('.required-indicator');
    const answered = groupIsAnswered(group);
    if (indicator) indicator.hidden = answered;
    if (answered) group.classList.remove('group-invalid');
  };

  // flag invalid, clears on fix
  const flagFieldInvalid = marker => {
    const field = marker.closest('.field');
    if (!field) return;
    field.classList.add('field-invalid');
    const clear = () => field.classList.remove('field-invalid');
    marker.addEventListener('input', clear, { once: true });
    marker.addEventListener('change', clear, { once: true });
  };

  document.querySelectorAll('[data-required-group]').forEach(group => {
    refreshIndicator(group);
    group.addEventListener('change', () => refreshIndicator(group));
  });

  continueBtn.addEventListener('click', () => {
    const packageGroup = document.querySelector('[data-required-group="package"]');
    refreshIndicator(packageGroup);
    if (!groupIsAnswered(packageGroup)) {
      packageGroup.classList.add('group-invalid');
      packageGroup.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
      return;
    }
    history.pushState({ screen: 'details' }, '', location.href);
    showScreen('details');
  });

  backBtn.addEventListener('click', () => history.back());

  const validateDetailsScreen = () => {
    const markers = [...screenDetails.querySelectorAll('[required], [data-required-group]')];
    for (const marker of markers) {
      if (marker.hasAttribute('data-required-group')) {
        if (!groupIsAnswered(marker)) {
          marker.classList.add('group-invalid');
          marker.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
          return false;
        }
      } else if (!marker.checkValidity()) {
        flagFieldInvalid(marker);
        // let our smooth scroll land last
        marker.focus({ preventScroll: true });
        marker.reportValidity();
        marker.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        return false;
      }
    }
    return true;
  };

  const attemptSubmit = () => {
    if (submitting || submitted || !validateDetailsScreen()) return;
    submitForm();
  };
  submitBtn.addEventListener('click', attemptSubmit);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (screenDetails.hidden) continueBtn.click(); else attemptSubmit();
  });

  // -- conditional reveals --
  form.querySelectorAll('[data-reveals]').forEach(group => {
    const target = document.getElementById(group.dataset.reveals);
    if (!target) return;
    group.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        target.hidden = radio.value !== 'Yes' || !radio.checked;
      });
    });
  });

  // other page
  const pagesOtherCheck = document.getElementById('pagesOtherCheck');
  const pagesOtherField = document.getElementById('pagesOther');
  if (pagesOtherCheck && pagesOtherField) {
    pagesOtherCheck.addEventListener('change', () => {
      pagesOtherField.hidden = !pagesOtherCheck.checked;
    });
  }

  // other frequency
  const updateFrequencyOtherRadio = document.getElementById('updateFrequencyOtherRadio');
  const updateFrequencyOtherField = document.getElementById('updateFrequencyOther');
  if (updateFrequencyOtherRadio && updateFrequencyOtherField) {
    form.querySelectorAll('input[name="updateFrequency"]').forEach(radio => {
      radio.addEventListener('change', () => {
        updateFrequencyOtherField.hidden = !updateFrequencyOtherRadio.checked;
      });
    });
  }

  // -- package gating --
  // custom is open-ended, so it unlocks everything
  const PACKAGE_TIERS = {
    'Landing Page - $150': 0,
    'Starter - $350': 1,
    'Growth - $500': 2,
    'Custom': 3,
  };

  const customPackageFields = document.getElementById('customPackageFields');
  const syncCustomPackage = packageValue => {
    if (customPackageFields) customPackageFields.hidden = packageValue !== 'Custom';
  };

  const pagesCheckboxGroup = document.getElementById('pagesCheckboxGroup');
  const singlePageNote = document.getElementById('singlePageNote');

  const applyPackageGating = packageValue => {
    const tier = PACKAGE_TIERS[packageValue] ?? -1;
    const hasPages = tier >= 1;
    const isGrowth = tier >= 2;

    if (pagesCheckboxGroup && singlePageNote) {
      pagesCheckboxGroup.hidden = !hasPages;
      singlePageNote.hidden = hasPages;
      if (!hasPages) {
        pagesCheckboxGroup.querySelectorAll('input:checked').forEach(input => { input.checked = false; });
      }
    }

    form.querySelectorAll('[data-package-gate="growth"]').forEach(el => {
      el.hidden = !isGrowth;
      if (isGrowth) return;
      el.querySelectorAll('input:checked').forEach(input => { input.checked = false; });
      el.querySelectorAll('[data-reveals]').forEach(group => {
        const target = document.getElementById(group.dataset.reveals);
        if (target) target.hidden = true;
      });
    });

    if (pagesOtherField) pagesOtherField.hidden = !hasPages || !pagesOtherCheck?.checked;
  };

  form.querySelectorAll('input[name="package"]').forEach(radio => {
    radio.addEventListener('change', () => {
      applyPackageGating(radio.value);
      syncCustomPackage(radio.value);
    });
  });
  const initialPackage = form.querySelector('input[name="package"]:checked')?.value;
  applyPackageGating(initialPackage);
  syncCustomPackage(initialPackage);

  // -- chips --
  form.querySelectorAll('.chip-input').forEach(container => {
    const hiddenField = form.querySelector(`input[type="hidden"][name="${container.dataset.hiddenField}"]`);
    const list = container.querySelector('.chip-list');
    const entry = container.querySelector('input[type="text"]');
    // seed from draft
    const values = hiddenField.value
      ? hiddenField.value.split(',').map(v => v.trim()).filter(Boolean)
      : [];

    const sync = () => { hiddenField.value = values.join(', '); saveDraft(); };

    const renderChips = () => {
      list.innerHTML = '';
      values.forEach((value, index) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = value;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'chip-remove';
        remove.setAttribute('aria-label', `Remove ${value}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          values.splice(index, 1);
          renderChips();
          sync();
        });
        chip.appendChild(remove);
        list.appendChild(chip);
      });
    };

    entry.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const value = entry.value.trim();
      if (!value) return;
      values.push(value);
      entry.value = '';
      renderChips();
      sync();
    });

    renderChips();
  });

  // -- file previews --
  // thumbnail or filename chip, per-file delete, 10MB cap (Netlify limit)
  const MAX_FILE_BYTES = 10 * 1024 * 1024;

  const fileLightbox = document.getElementById('filePreviewLightbox');
  const fileLightboxImg = fileLightbox?.querySelector('img');

  let filePreviewOpener = null;
  const openFileLightbox = src => {
    if (!fileLightbox || !fileLightboxImg) return;
    if (typeof fileLightbox.showModal !== 'function') return;
    filePreviewOpener = document.activeElement;
    fileLightboxImg.src = src;
    fileLightbox.classList.add('open');
    fileLightbox.showModal();
    document.body.style.overflow = 'hidden';
  };

  const closeFileLightbox = () => {
    if (!fileLightbox) return;
    fileLightbox.close();
  };

  fileLightbox?.addEventListener('close', () => {
    fileLightbox.classList.remove('open');
    document.body.style.overflow = '';
    filePreviewOpener?.focus({ preventScroll: true });
  });

  fileLightbox?.querySelector('.lightbox-close')?.addEventListener('click', closeFileLightbox);
  fileLightbox?.addEventListener('click', e => { if (e.target === fileLightbox) closeFileLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && fileLightbox?.classList.contains('open')) closeFileLightbox();
  });

  const setupFileInput = input => {
    const previewList = document.getElementById(`${input.id}Preview`);
    const errorEl = document.getElementById(`${input.id}Error`);
    if (!previewList) return;
    let files = [];
    let previewURLs = [];

    const rebuildInputFiles = () => {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      input.files = dt.files;
    };

    const renderPreviews = () => {
      previewURLs.forEach(url => URL.revokeObjectURL(url));
      previewURLs = [];
      previewList.innerHTML = '';
      files.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';

        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          previewURLs.push(img.src);
          img.alt = file.name;
          const previewButton = document.createElement('button');
          previewButton.type = 'button'; previewButton.className = 'file-preview-open';
          previewButton.setAttribute('aria-label', `Preview ${file.name}`);
          previewButton.addEventListener('click', () => openFileLightbox(img.src));
          previewButton.appendChild(img); item.appendChild(previewButton);
        } else {
          const chip = document.createElement('span');
          chip.className = 'file-preview-chip';
          chip.textContent = file.name;
          item.appendChild(chip);
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'file-preview-remove';
        removeBtn.setAttribute('aria-label', `Remove ${file.name}`);
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
          files.splice(index, 1);
          rebuildInputFiles();
          renderPreviews();
        });
        item.appendChild(removeBtn);

        previewList.appendChild(item);
      });
    };

    input.addEventListener('change', () => {
      const incoming = [...input.files];
      const accepted = [];
      const rejected = [];
      incoming.forEach(f => (f.size > MAX_FILE_BYTES ? rejected.push(f.name) : accepted.push(f)));

      files = input.multiple ? files.concat(accepted) : accepted.slice(0, 1);

      if (errorEl) {
        errorEl.hidden = rejected.length === 0;
        if (rejected.length) {
          errorEl.textContent = `${rejected.join(', ')} exceed${rejected.length === 1 ? 's' : ''} the 10MB limit and ${rejected.length === 1 ? 'was' : 'were'} not added.`;
        }
      }

      rebuildInputFiles();
      renderPreviews();
    });
  };

  ['logoFile', 'photosFile', 'marketingMaterials'].forEach(id => {
    const input = document.getElementById(id);
    if (input) setupFileInput(input);
  });

  const submitForm = () => {
    if (submitting || submitted) return;
    submissionError.hidden = true;
    if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
      submissionError.textContent = 'This local preview cannot send requests. Your answers remain in this form. Email jonah@jonahfeinberg.com to get in touch.';
      submissionError.hidden = false; saveDraft(); return;
    }
    const excluded = [...form.querySelectorAll('input, textarea, select')].filter(input =>
      !input.disabled && (input.matches('.conditional-field[hidden]') || input.closest('.conditional-field[hidden], [data-package-gate][hidden]'))
    );
    excluded.forEach(input => { input.disabled = true; });
    let data;
    try { data = new FormData(form); }
    finally { excluded.forEach(input => { input.disabled = false; }); }
    const uploadBytes = [...data.values()].reduce((total, value) => total + (value instanceof File ? value.size : 0), 0);
    if (uploadBytes > MAX_FILE_BYTES) { submissionError.textContent = 'Please keep all attachments together under 10 MB, then try again.'; submissionError.hidden = false; return; }
    submitting = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    // save before submit
    saveDraft();

    fetch(window.location.pathname, {
      method: 'POST',
      body: data,
      signal: controller.signal,
    })
      .then(response => {
        if (!response.ok) throw new Error(`Submission failed: ${response.status}`);
        submitted = true;
        clearDraft();
        form.hidden = true;
        document.querySelectorAll('[data-screen]').forEach(el => { el.hidden = true; });
        confirmation.hidden = false;
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
      })
      .catch(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        submissionError.textContent = 'Your request could not be sent. Your answers are still here. Check your connection and try again, or email jonah@jonahfeinberg.com.';
        submissionError.hidden = false;
      })
      .finally(() => { clearTimeout(timeout); submitting = false; });
  };

  // replay restored values so reveals and gating catch up
  form.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')
    .forEach(input => input.dispatchEvent(new Event('change', { bubbles: true })));
});
