// -- main --
// site chrome and page behaviors. the inline head script sets the theme
// before paint, so nothing here needs to re-apply it. page-specific blocks
// are feature-guarded and no-op elsewhere.

document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;

  // -- theme --
  const themeToggle = document.getElementById('themeToggle');
  const themeHint = document.getElementById('themeHint');

  // hint once, ever
  if (themeHint && !localStorage.getItem('themeHintSeen')) {
    themeHint.hidden = false;
    localStorage.setItem('themeHintSeen', '1');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';
      isDark ? html.removeAttribute('data-theme') : html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
      if (themeHint) themeHint.hidden = true;
    });
  }

  // -- nav --
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('active');
  });

  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  // -- reveal --
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

  // -- scroll fx --
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

  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // -- lightbox --
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

    // touch swipe
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  // -- video --
  document.querySelectorAll('.project-video').forEach(video => {
    const container = video.closest('.app-video-col');
    if (!container) return;
    video.controls = false;

    container.addEventListener('click', () => {
      if (container.classList.contains('playing')) return;
      video.controls = true;
      video.play();
      container.classList.add('playing');
    });
  });

  // -- frame breathe --
  // the mat thickens with scroll speed, then relaxes
  const frame = document.getElementById('frame');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (frame && !reduce) {
    const GAIN = 5, CAP = 10;  // extra px per velocity, and the cap
    let cur = 0, target = 0, lastY = window.scrollY, lastT = performance.now();

    window.addEventListener('scroll', () => {
      const now = performance.now();
      const v = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1);
      target = Math.min(CAP, v * GAIN);
      lastY = window.scrollY;
      lastT = now;
    }, { passive: true });

    (function breathe() {
      target *= 0.94;
      cur += (target - cur) * 0.1;
      html.style.setProperty('--frame-extra', cur.toFixed(2) + 'px');
      requestAnimationFrame(breathe);
    })();
  }
});

// -- intro --
// home-page overlay, once per session
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

// -- questionnaire --
// the /start wizard. self-guards, so it no-ops on every other page.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wizardForm');
  if (!form) return;

  const screenDetails = document.getElementById('screenDetails');
  const continueBtn = document.getElementById('continueBtn');
  const backBtn = document.getElementById('backBtn');
  const submitBtn = document.getElementById('submitBtn');
  const confirmation = document.getElementById('wizardConfirmation');

  let submitted = false;

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

  // -- screens --
  // package vs details, driven by History so Back/Forward work
  const showScreen = name => {
    document.querySelectorAll('[data-screen]').forEach(el => {
      el.hidden = el.dataset.screen !== name;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  history.replaceState({ screen: 'package' }, '', location.href);
  showScreen('package');

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
      packageGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      } else if (!marker.checkValidity()) {
        flagFieldInvalid(marker);
        // let our smooth scroll land last
        marker.focus({ preventScroll: true });
        marker.reportValidity();
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
    }
    return true;
  };

  submitBtn.addEventListener('click', () => {
    if (!validateDetailsScreen()) return;
    submitForm();
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

    if (!isGrowth && pagesOtherField) pagesOtherField.hidden = true;
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

    const sync = () => { hiddenField.value = values.join(', '); };

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

  const openFileLightbox = src => {
    if (!fileLightbox || !fileLightboxImg) return;
    fileLightboxImg.src = src;
    fileLightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeFileLightbox = () => {
    if (!fileLightbox) return;
    fileLightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

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

    const rebuildInputFiles = () => {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      input.files = dt.files;
    };

    const renderPreviews = () => {
      previewList.innerHTML = '';
      files.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';

        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.alt = file.name;
          img.addEventListener('click', () => openFileLightbox(img.src));
          item.appendChild(img);
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
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    // save before submit
    saveDraft();

    fetch(window.location.pathname, {
      method: 'POST',
      body: new FormData(form),
    })
      .then(response => {
        if (!response.ok) throw new Error(`Submission failed: ${response.status}`);
        submitted = true;
        clearDraft();
        form.hidden = true;
        document.querySelectorAll('[data-screen]').forEach(el => { el.hidden = true; });
        confirmation.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        alert('Something went wrong submitting the form. Please check your connection and try again.');
      });
  };

  // replay restored values so reveals and gating catch up
  form.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')
    .forEach(input => input.dispatchEvent(new Event('change', { bubbles: true })));
});
