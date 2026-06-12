// Section: Client-side form validation for simple UX checks
(() => {
  const NOTE_TITLE_MAX_LENGTH = 200;
  const NOTE_CONTENT_MAX_LENGTH = 5000;
  const PASSWORD_MIN_LENGTH = 6;
  const REQUIRED_FIELDS_MESSAGE = 'Please fill out all required fields.';

  function getFieldValue(form, selector) {
    const field = form.querySelector(selector);

    if (!field) {
      return '';
    }

    return String(field.value || '').trim(); // Always return clean text.
  }

  function setFormError(form, message) {
    const errorElement = form.querySelector('[data-form-error]');

    if (!errorElement) {
      return;
    }

    errorElement.textContent = message; // Show validation feedback near the form.
  }

  // Section: Check that all required inputs in a form are filled in.
  function validateRequiredInputs(form) {
    const inputs = form.querySelectorAll('input[required]');

    for (const input of inputs) {
      if (!String(input.value || '').trim()) {
        return REQUIRED_FIELDS_MESSAGE;
      }
    }

    return '';
  }

  function hasLetter(value) {
    return /[A-Za-z]/.test(value); // Check for at least one letter.
  }

  function hasNumber(value) {
    return /[0-9]/.test(value); // Check for at least one number.
  }

  // Section: Apply password rules for register only.
  function validateRegisterPassword(form) {
    const password = getFieldValue(form, '#password');

    if (!password) {
      return 'Password is required.';
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return 'Password must be at least 6 characters long.';
    }

    if (!hasLetter(password)) {
      return 'Password must include at least one letter.';
    }

    if (!hasNumber(password)) {
      return 'Password must include at least one number.';
    }

    return '';
  }

  // Section: Register form checks required fields and password strength.
  function validateRegisterForm(form) {
    const requiredInputsError = validateRequiredInputs(form);

    if (requiredInputsError) {
      return requiredInputsError;
    }

    return validateRegisterPassword(form);
  }

  // Section: Check simple note rules before submit.
  function validateNoteForm(form) {
    const title = getFieldValue(form, '#title');
    const content = getFieldValue(form, '#content');

    if (!title) {
      return 'Title is required.';
    }

    if (title.length > NOTE_TITLE_MAX_LENGTH) {
      return 'Title must be 200 characters or less.';
    }

    if (content.length > NOTE_CONTENT_MAX_LENGTH) {
      return 'Content must be 5000 characters or less.';
    }

    return '';
  }

  const formValidators = {
    login: validateRequiredInputs,
    register: validateRegisterForm,
    note: validateNoteForm,
  };

  // Section: Pick validation rules based on form type.
  function validateForm(form) {
    const formType = form.getAttribute('data-form-type');
    const validateCurrentForm = formValidators[formType];
    return validateCurrentForm ? validateCurrentForm(form) : ''; // Skip unknown form types safely.
  }

  // Section: Show a spinner and disable a button while its action is in progress.
  function setButtonLoading(button) {
    if (button.hasAttribute('data-loading')) {
      return; // Already loading: do not stack spinners or allow double submits.
    }

    button.setAttribute('data-loading', 'true');
    button.setAttribute('data-original-html', button.innerHTML); // Save label to restore later.
    button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading…';

    if (button.tagName === 'BUTTON') {
      button.disabled = true; // Native disable for form submit buttons.
    } else {
      button.classList.add('disabled');
      button.setAttribute('aria-disabled', 'true'); // Visual + accessibility disable for links.
    }
  }

  // Section: Stop submit and show message when validation fails;
  // otherwise show a loading state on the submit button.
  function handleFormSubmit(event) {
    const form = event.currentTarget;
    setFormError(form, '');

    const errorMessage = validateForm(form);

    if (errorMessage) {
      event.preventDefault();
      setFormError(form, errorMessage);
      return;
    }

    // Validation passed: the form is about to submit normally, so show the spinner.
    const submitButton = form.querySelector('[type="submit"]');

    if (submitButton) {
      setButtonLoading(submitButton);
    }
  }

  // Section: Show a loading state when a provider login link (e.g. Auth0) is clicked.
  function handleProviderClick(event) {
    const link = event.currentTarget;

    if (link.hasAttribute('data-loading')) {
      event.preventDefault(); // Block repeat clicks while already navigating.
      return;
    }

    setButtonLoading(link); // Navigation proceeds; spinner shows until the next page loads.
  }

  // Section: Attach the loading behavior to provider login links.
  function setupProviderButtons() {
    const links = document.querySelectorAll('.auth-provider-btn');

    for (const link of links) {
      link.addEventListener('click', handleProviderClick);
    }
  }

  // Section: Clear a loading button back to its original label and enabled state.
  function clearButtonLoading(button) {
    const originalHtml = button.getAttribute('data-original-html');

    if (originalHtml !== null) {
      button.innerHTML = originalHtml; // Restore the saved label.
    }

    button.removeAttribute('data-loading');
    button.removeAttribute('data-original-html');

    if (button.tagName === 'BUTTON') {
      button.disabled = false;
    } else {
      button.classList.remove('disabled');
      button.removeAttribute('aria-disabled');
    }
  }

  // Section: Reset stale spinners if the page is restored from the back/forward cache.
  function setupBfcacheReset() {
    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) {
        return; // Only needed when the page comes back from bfcache.
      }

      const loadingButtons = document.querySelectorAll('[data-loading]');

      for (const button of loadingButtons) {
        clearButtonLoading(button);
      }
    });
  }

  // Section: Attach submit validation handlers to all tagged forms.
  function setupFormValidation() {
    const forms = document.querySelectorAll('form[data-form-type]');

    for (const form of forms) {
      form.addEventListener('submit', handleFormSubmit);
    }
  }

  // Section: Password visibility toggle for auth forms.
  function setPasswordVisibility(toggle) {
    const targetSelector = toggle.getAttribute('data-password-target');

    if (!targetSelector) {
      return;
    }

    const passwordField = document.querySelector(targetSelector);

    if (!passwordField) {
      return;
    }

    passwordField.type = toggle.checked ? 'text' : 'password';
  }

  function handlePasswordToggleChange(event) {
    setPasswordVisibility(event.currentTarget); // Switch input type between password/text.
  }

  // Section: Attach show/hide behavior to password toggle checkboxes.
  function setupPasswordToggle() {
    const toggles = document.querySelectorAll('[data-password-toggle]');

    for (const toggle of toggles) {
      setPasswordVisibility(toggle);
      toggle.addEventListener('change', handlePasswordToggleChange);
    }
  }

  setupFormValidation();
  setupPasswordToggle();
  setupProviderButtons();
  setupBfcacheReset();
})();
