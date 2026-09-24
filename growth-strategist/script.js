'use strict';
// Local previews never submit personal information or simulate an application receipt.
const form = document.querySelector('#application-form');
if (form) {
  const phone = form.elements.whatsapp;
  phone.addEventListener('input', () => phone.setCustomValidity(''));
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      phone.setCustomValidity('Please enter a valid WhatsApp number with 10 to 15 digits.');
      phone.reportValidity();
      return;
    }
    for (const field of form.querySelectorAll('input[required]')) {
      if (!field.value.trim()) { field.value = ''; field.reportValidity(); return; }
    }
    const status = document.querySelector('#form-status');
    const preview = document.querySelector('.preview-link');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
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
    try {
      const response = await fetch('/', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()});
      if (!response.ok) throw new Error('Submission failed');
      location.assign('challenge.html?applied=1');
    } catch (error) {
      status.textContent = 'We couldn’t submit your details. Please try again. Your entries are still here.';
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
