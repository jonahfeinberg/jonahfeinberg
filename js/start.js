document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wizardForm');
  if (!form) return;

  const screenPackage = document.getElementById('screenPackage');
  const screenDetails = document.getElementById('screenDetails');
  const continueBtn = document.getElementById('continueBtn');
  const backBtn = document.getElementById('backBtn');
  const submitBtn = document.getElementById('submitBtn');
  const confirmation = document.getElementById('wizardConfirmation');

  let submitted = false;

  // Screen switching (package selection vs. the long details form), driven
  // by the History API so the browser's native Back/Forward buttons work.
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

  // Required radio/toggle groups ("choices") show a persistent indicator
  // whenever nothing in the group is checked yet.
  const groupIsAnswered = group => !!group.querySelector('input:checked');

  const refreshIndicator = group => {
    const indicator = group.closest('.field')?.querySelector('.required-indicator');
    const answered = groupIsAnswered(group);
    if (indicator) indicator.hidden = answered;
    if (answered) group.classList.remove('group-invalid');
  };

  // Marks a required field/group as invalid so it's clearly highlighted after
  // a scroll-to-error; clears itself as soon as the user fixes it.
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
        // Focus without letting it trigger its own (non-smooth) scroll, let
        // reportValidity's native jump happen, then let our smooth centered
        // scroll run last so it's the one that actually decides where we land.
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

  // Conditional field reveals (yes/no toggles that unlock a follow-up field)
  form.querySelectorAll('[data-reveals]').forEach(group => {
    const target = document.getElementById(group.dataset.reveals);
    if (!target) return;
    group.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        target.hidden = radio.value !== 'Yes' || !radio.checked;
      });
    });
  });

  // "Other" page checkbox reveals a text field
  const pagesOtherCheck = document.getElementById('pagesOtherCheck');
  const pagesOtherField = document.getElementById('pagesOther');
  if (pagesOtherCheck && pagesOtherField) {
    pagesOtherCheck.addEventListener('change', () => {
      pagesOtherField.hidden = !pagesOtherCheck.checked;
    });
  }

  // "Other" update-frequency radio reveals a "please specify" text field
  const updateFrequencyOtherRadio = document.getElementById('updateFrequencyOtherRadio');
  const updateFrequencyOtherField = document.getElementById('updateFrequencyOther');
  if (updateFrequencyOtherRadio && updateFrequencyOtherField) {
    form.querySelectorAll('input[name="updateFrequency"]').forEach(radio => {
      radio.addEventListener('change', () => {
        updateFrequencyOtherField.hidden = !updateFrequencyOtherRadio.checked;
      });
    });
  }

  // Package selection gates which downstream fields are relevant
  const PACKAGE_TIERS = {
    'Landing Page - $150': 0,
    'Starter - $350': 1,
    'Growth - $500': 2,
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
    radio.addEventListener('change', () => applyPackageGating(radio.value));
  });
  applyPackageGating(form.querySelector('input[name="package"]:checked')?.value);

  // Chip-style repeatable inputs (websites liked, search terms)
  form.querySelectorAll('.chip-input').forEach(container => {
    const hiddenField = form.querySelector(`input[type="hidden"][name="${container.dataset.hiddenField}"]`);
    const list = container.querySelector('.chip-list');
    const entry = container.querySelector('input[type="text"]');
    const values = [];

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
  });

  // File input previews: small thumbnail (or filename chip for non-images),
  // per-file delete, fullscreen viewer for images, and a 10MB per-file cap
  // (Netlify Forms' documented per-file upload limit).
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

    fetch(window.location.pathname, {
      method: 'POST',
      body: new FormData(form),
    })
      .then(response => {
        if (!response.ok) throw new Error(`Submission failed: ${response.status}`);
        submitted = true;
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
});
