document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('wizardForm');
  if (!form) return;

  const steps = [...form.querySelectorAll('.wizard-step')];
  const totalSteps = steps.length;
  const stepLabel = document.getElementById('stepLabel');
  const progressFill = document.getElementById('progressFill');
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const confirmation = document.getElementById('wizardConfirmation');
  const wizardNav = document.querySelector('.wizard-nav');
  const packageInfo = document.getElementById('packageInfo');

  let currentStep = 1;

  const renderStep = () => {
    steps.forEach(step => {
      step.classList.toggle('active', Number(step.dataset.step) === currentStep);
    });
    stepLabel.textContent = `Step ${currentStep} of ${totalSteps}`;
    progressFill.style.width = `${(currentStep / totalSteps) * 100}%`;
    backBtn.hidden = currentStep === 1;
    nextBtn.textContent = currentStep === totalSteps ? 'Submit' : 'Next';
    if (packageInfo) packageInfo.hidden = currentStep !== 1;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateStep = stepEl => {
    const fields = stepEl.querySelectorAll('input, textarea, select');
    for (const field of fields) {
      if (!field.reportValidity()) return false;
    }
    return true;
  };

  backBtn.addEventListener('click', () => {
    if (currentStep === 1) return;
    currentStep -= 1;
    renderStep();
  });

  nextBtn.addEventListener('click', () => {
    const activeStep = steps[currentStep - 1];
    if (!validateStep(activeStep)) return;

    if (currentStep < totalSteps) {
      currentStep += 1;
      renderStep();
      return;
    }

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

  const submitForm = () => {
    nextBtn.disabled = true;
    nextBtn.textContent = 'Submitting…';

    fetch(window.location.pathname, {
      method: 'POST',
      body: new FormData(form),
    })
      .then(response => {
        if (!response.ok) throw new Error(`Submission failed: ${response.status}`);
        form.hidden = true;
        wizardNav.hidden = true;
        document.querySelector('.wizard-progress').hidden = true;
        confirmation.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(() => {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Submit';
        alert('Something went wrong submitting the form. Please check your connection and try again.');
      });
  };

  renderStep();
});
