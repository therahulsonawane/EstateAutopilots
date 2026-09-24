'use strict';

/**
 * Google Apps Script Web App URL for Growth Strategist leads.
 * After deploying google_apps_script_growth_strategist.gs as a Web App,
 * replace the placeholder below with your actual Web App URL.
 * Deploy settings: Execute as "Me", Who has access "Anyone".
 */
const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz4yFlghMkkRnuOy1NMwwdkrMWlQSX0_lR1UeMTLmE8Fg2AYxeVUcrvEPwpFIPxLE0j/exec';

// Local previews never submit personal information or simulate an application receipt.
const form = document.querySelector('#application-form');
if (form) {
  const phone = form.elements.whatsapp;
  phone.addEventListener('input', () => phone.setCustomValidity(''));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Phone validation
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      phone.setCustomValidity('Please enter a valid WhatsApp number with 10 to 15 digits.');
      phone.reportValidity();
      return;
    }

    // Required field validation
    for (const field of form.querySelectorAll('input[required], select[required]')) {
      if (!field.value.trim()) { field.value = ''; field.reportValidity(); return; }
    }

    const status = document.querySelector('#form-status');
    const preview = document.querySelector('.preview-link');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';

    // Local / preview mode — no real submission
    if (local) {
      status.textContent = 'Preview only — your details have not been submitted. You can preview the challenge below.';
      preview.hidden = false;
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    const original = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Submitting your application…';
    status.textContent = '';

    // Build the body once so both fetches use identical data
    const formBody = new URLSearchParams(new FormData(form)).toString();

    try {
      // Primary: Netlify form submission (handles redirect on success)
      const netlifyPromise = fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody
      });

      // Secondary: Google Sheets webhook (fire-and-forget; runs in parallel)
      if (FORM_ENDPOINT && FORM_ENDPOINT !== 'PASTE_YOUR_GAS_WEB_APP_URL_HERE') {
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody,
          mode: 'no-cors'   // GAS webhook is cross-origin; response is opaque — that's fine
        }).catch(() => {}); // Silently ignore GAS errors so they never block the user
      }

      const response = await netlifyPromise;
      if (!response.ok) throw new Error('Submission failed');
      location.assign('challenge.html?applied=1');

    } catch (error) {
      status.textContent = "We couldn\u2019t submit your details. Please try again. Your entries are still here.";
      button.disabled = false;
      button.innerHTML = original;
    }
  });
}
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.remove('pending'); observer.unobserve(entry.target); }
  }), {threshold:0.08});
  document.querySelectorAll('.ownership-grid article, .case-header, .not-fit').forEach(element => {
    element.classList.add('reveal', 'pending'); observer.observe(element);
  });
}
