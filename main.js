// 🔹 LOCAL BACKEND API URL
const API_URL = "https://uwo-backend-743928421487.asia-south1.run.app/api";

// UI helpers
function toggleDrawer() {
  const drawer = document.getElementById("mobileDrawer");
  if (drawer) drawer.classList.toggle("open");
}

function openPage(page) {
  window.location.href = page;
}

// ============ CUSTOM SELECT DROPDOWN — Clean & Minimal ============
function initCustomSelect() {
  const wrap = document.getElementById('cselWrap');
  const native = document.getElementById('purpose');
  if (!wrap || !native) return;

  const firstVal = native.value || native.options[0].value;

  // Build trigger
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = 'cselTrigger';
  trigger.className = 'csel-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = `
    <span class="csel-t-label" id="cselLabel">${firstVal}</span>
    <svg class="csel-arrow" id="cselArrow" xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#D6A559" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`;

  // Build options panel
  const panel = document.createElement('div');
  panel.id = 'cselPanel';
  panel.className = 'csel-panel';
  panel.setAttribute('role', 'listbox');

  Array.from(native.options).forEach((opt, i) => {
    const item = document.createElement('div');
    item.className = 'csel-option' + (i === 0 ? ' csel-selected' : '');
    item.setAttribute('role', 'option');
    item.setAttribute('data-value', opt.value);
    item.innerHTML = `
      <span class="cso-label">${opt.value}</span>
      <svg class="cso-check" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
        viewBox="0 0 24 24" fill="none" stroke="#D6A559" stroke-width="2.8"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
    item.addEventListener('click', () => pickOption(item));
    panel.appendChild(item);
  });

  wrap.appendChild(trigger);
  wrap.appendChild(panel);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrap.classList.contains('csel-open') ? closeDropdown() : openDropdown();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });
}

function openDropdown() {
  const wrap = document.getElementById('cselWrap');
  const trigger = document.getElementById('cselTrigger');
  const panel = document.getElementById('cselPanel');
  const arrow = document.getElementById('cselArrow');
  if (!wrap) return;
  wrap.classList.add('csel-open');
  trigger.setAttribute('aria-expanded', 'true');
  panel.style.maxHeight = panel.scrollHeight + 'px';
  arrow.style.transform = 'rotate(180deg)';
}

function closeDropdown() {
  const wrap = document.getElementById('cselWrap');
  const trigger = document.getElementById('cselTrigger');
  const panel = document.getElementById('cselPanel');
  const arrow = document.getElementById('cselArrow');
  if (!wrap) return;
  wrap.classList.remove('csel-open');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (panel) panel.style.maxHeight = '0';
  if (arrow) arrow.style.transform = 'rotate(0deg)';
}

function pickOption(item) {
  const value = item.getAttribute('data-value');

  // Sync native select
  document.getElementById('purpose').value = value;

  // Update trigger label
  document.getElementById('cselLabel').textContent = value;

  // Update selected state
  document.querySelectorAll('.csel-option').forEach(o => o.classList.remove('csel-selected'));
  item.classList.add('csel-selected');

  closeDropdown();
}

document.addEventListener('DOMContentLoaded', initCustomSelect);


// ============ CUSTOM MODAL POPUP ============
const MODAL_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#22c55e" stroke-width="2"/>
    <path fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M14 27l8 8 16-16"/>
  </svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#ef4444" stroke-width="2"/>
    <line x1="17" y1="17" x2="35" y2="35" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
    <line x1="35" y1="17" x2="17" y2="35" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
  </svg>`
};

function showModal(message, type = 'success') {
  const existing = document.getElementById('uwo-modal-overlay');
  if (existing) existing.remove();

  const title = type === 'success' ? 'Message Sent' : 'Something went wrong';

  const overlay = document.createElement('div');
  overlay.id = 'uwo-modal-overlay';
  overlay.innerHTML = `
    <div class="uwo-modal" id="uwo-modal">
      <div class="uwo-modal-icon">${MODAL_ICONS[type]}</div>
      <h3 class="uwo-modal-title">${title}</h3>
      <p class="uwo-modal-message">${message}</p>
      <button class="uwo-modal-btn" onclick="closeModal()">OK</button>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('uwo-modal-visible');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

function closeModal() {
  const overlay = document.getElementById('uwo-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('uwo-modal-visible');
  overlay.classList.add('uwo-modal-hiding');
  setTimeout(() => overlay.remove(), 300);
}

// ============ CONTACT FORM ============
async function sendMessage() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const purpose = document.getElementById("purpose").value;

  if (!name || !email || !message) {
    showModal('Please fill in all required fields.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message, purpose })
    });

    if (response.ok) {
      showModal("Your message has been sent. We'll get back to you shortly.", 'success');
      document.getElementById("name").value = '';
      document.getElementById("email").value = '';
      document.getElementById("message").value = '';
    } else {
      showModal('Something went wrong. Please try again later.', 'error');
    }
  } catch (error) {
    showModal('Unable to send message. Please check your connection.', 'error');
    console.error(error);
  }
}
