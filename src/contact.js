const MSG_OK = 'Thank you. Your enquiry has been sent to our team.';
const MSG_ERR = 'Your enquiry could not be sent. Please try again or email hello@bigfuturdigital.com.';

export default function init() {
  const form = document.querySelector('[data-form]');
  if (!form) return;
  const status = form.querySelector('[data-status]');
  const select = form.querySelector('#f-service');

  // ?service=xyz preselects the matching option
  const pre = new URLSearchParams(location.search).get('service');
  if (pre && [...select.options].some((o) => o.value === pre)) select.value = pre;

  const rules = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your full name.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
    service: (v) => (v ? '' : 'Please choose a service.'),
    details: (v) => (v.trim().length >= 10 ? '' : 'Please share a few details about your project.'),
    consent: (_, el) => (el.checked ? '' : 'Please confirm you agree so we can respond.'),
  };
  const check = (name) => {
    const el = form.elements[name];
    const msg = rules[name](el.value, el);
    const err = form.querySelector(`#e-${name}`);
    err.textContent = msg;
    el.closest('.field')?.classList.toggle('is-invalid', !!msg);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };
  Object.keys(rules).forEach((n) => {
    const el = form.elements[n];
    el.addEventListener('blur', () => el.value && check(n));
    el.addEventListener('change', () => check(n));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form__status'; status.textContent = '';
    const ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    if (form.elements.website.value) return; // honeypot

    const data = Object.fromEntries(new FormData(form));
    delete data.website;
    const endpoint = form.dataset.endpoint;
    const btn = form.querySelector('[type=submit]');

    if (!endpoint) {
      // No form handler configured yet: hand off to the visitor's email app.
      const label = select.options[select.selectedIndex].text;
      const body = `Name: ${data.name}\nCompany: ${data.company || '-'}\nEmail: ${data.email}\nPhone: ${data.phone || '-'}\nService: ${label}\n\n${data.details}`;
      location.href = `mailto:hello@bigfuturdigital.com?subject=${encodeURIComponent('Website enquiry: ' + label)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Your email app should open with this enquiry ready to send.';
      return;
    }
    btn.disabled = true; btn.style.opacity = 0.6;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
      status.classList.add('ok'); status.textContent = MSG_OK;
      form.reset();
    } catch {
      status.classList.add('err'); status.textContent = MSG_ERR;
    } finally {
      btn.disabled = false; btn.style.opacity = '';
    }
  });
}
