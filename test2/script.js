let state = {
  queue: [],
  current: null,
  counters: { general: 1, support: 1, priority: 1, complaint: 1 },
  clinicOpen: true,
};

const AVG_SERVICE_MINS = 5;

const SERVICE_PREFIX = {
  general: "G",
  support: "S",
  priority: "P",
  complaint: "C",
};

function load() {
  const saved = localStorage.getItem("queueflow_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      if (!state.counters) {
        state.counters = { general: 1, support: 1, priority: 1, complaint: 1 };
      }
    } catch (e) {}
  }
  render();
}

function save() {
  localStorage.setItem("queueflow_state", JSON.stringify(state));
}

function addToQueue() {
  if (!state.clinicOpen) {
    showToast("Clinic is closed — no new entries allowed");
    return;
  }
  const nameEl = document.getElementById("inp-name");
  const serviceEl = document.getElementById("inp-service");
  const name = nameEl.value.trim();
  if (!name) {
    showToast("Please enter a name");
    nameEl.focus();
    return;
  }

  const service = serviceEl.value;
  const prefix = SERVICE_PREFIX[service] || "T";
  const num = state.counters[service] || 1;
  const ticket = prefix + String(num).padStart(3, "0");
  state.counters[service] = num + 1;

  const entry = {
    id: Date.now(),
    ticket,
    name,
    service,
    addedAt: Date.now(),
  };
  state.queue.push(entry);
  nameEl.value = "";
  save();
  render();
  showToast(`${entry.ticket} added to queue`);
}

function clearAll() {
  if (!confirm("Clear entire queue and reset counters?")) return;
  state.queue = [];
  state.current = null;
  state.counters = { general: 1, support: 1, priority: 1, complaint: 1 };
  save();
  render();
  showToast("Queue cleared and reset");
}

function renderClinicStatus() {
  const dot = document.getElementById("clinic-status-dot");
  const text = document.getElementById("clinic-status-text");

  if (state.clinicOpen) {
    dot.style.background = "var(--green)";
    text.textContent = "Open";
  } else {
    dot.style.background = "#b32626";
    text.textContent = "Closed";
  }
}

function render() {
  renderServing();
  renderQueue();
  renderStats();
  renderClinicStatus();
  document.getElementById("session-date").textContent =
    new Date().toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
}

function renderServing() {
  const ticketEl = document.getElementById("now-ticket");
  const nameEl = document.getElementById("now-name");
  const serviceEl = document.getElementById("now-service");
  const labelEl = document.querySelector(".serving-label");

  ticketEl.classList.remove("general", "support", "priority", "complaint");

  if (state.current) {
    ticketEl.textContent = state.current.ticket;
    ticketEl.classList.remove("empty");
    ticketEl.classList.add(state.current.service);
    nameEl.textContent = state.current.name;
    nameEl.style.opacity = "1";
    serviceEl.textContent = capitalize(state.current.service);
    if (labelEl) labelEl.textContent = "Now serving";
  } else {
    ticketEl.textContent = "---";
    ticketEl.classList.add("empty");
    nameEl.textContent = "Not yet joined";
    nameEl.style.opacity = "0.3";
    serviceEl.textContent = "";
    if (labelEl) labelEl.textContent = "Complete the form to join";
  }
}

function renderQueue() {
  const list = document.getElementById("queue-list");
  list.innerHTML = "";

  if (state.queue.length === 0) {
    list.innerHTML = `
      <li class="empty-state" id="empty-state">
        <div class="empty-icon">◻</div>
        <p>Queue is empty. Add someone above.</p>
      </li>`;
    return;
  }

  state.queue.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div class="ticket-badge">${entry.ticket}</div>
      <span class="service-pill ${entry.service}">${capitalize(entry.service)}</span>
    `;
    list.appendChild(li);
  });
}

function renderStats() {
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setEl("stat-in-queue", state.queue.length);
  const mins = state.queue.length * AVG_SERVICE_MINS;
  setEl(
    "stat-est-wait",
    mins >= 60 ? Math.floor(mins / 60) + "h " + (mins % 60) + "m" : mins + "m",
  );
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

setInterval(() => {
  renderQueue();
  renderStats();
}, 30000);

load();
