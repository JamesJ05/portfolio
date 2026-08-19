/**
 * CONTACT FORM → AUTO EMAIL
 * -----------------------------------------------------------
 * A static site can't send email by itself, so this uses EmailJS
 * (free tier: 200 emails/month) to forward every submission to
 * jamesstephen.m.jason@gmail.com without needing a backend server.
 *
 * SETUP (see README.md for full steps):
 * 1. Create a free account at https://www.emailjs.com
 * 2. Add an Email Service (e.g. Gmail) connected to your inbox.
 * 3. Create an Email Template with variables: from_name, reply_to, message.
 * 4. Copy your Public Key, Service ID, and Template ID below.
 * -----------------------------------------------------------
 */
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

if (window.emailjs) emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = document.getElementById('contactSubmit');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY'){
    statusEl.textContent = 'Contact form not configured yet — add your EmailJS keys in js/contact.js (see README).';
    statusEl.className = 'form-status err';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  statusEl.textContent = '';
  statusEl.className = 'form-status';

  try {
    await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
    statusEl.textContent = 'Message sent — thanks, I\'ll reply soon.';
    statusEl.className = 'form-status ok';
    form.reset();
  } catch (err) {
    console.error('EmailJS error:', err);
    statusEl.textContent = 'Something went wrong sending that. Try emailing directly instead.';
    statusEl.className = 'form-status err';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send message';
  }
});
