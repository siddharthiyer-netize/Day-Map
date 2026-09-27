const KEY = "daymap-data-v1";

const demoBlocks = [
  { id: 1, time: "07:30", title: "Morning reset", category: "Health & Rest", duration: 30, screen: "screen-free", done: true },
  { id: 2, time: "09:00", title: "Deep work: creative brief", category: "Deep Work", duration: 90, screen: "90 min screen", done: true },
  { id: 3, time: "12:30", title: "Lunch + screen-free walk", category: "Health & Rest", duration: 45, screen: "screen-free", done: true },
  { id: 4, time: "14:00", title: "Studio session", category: "Personal", duration: 60, screen: "45 min screen", done: true },
  { id: 5, time: "18:00", title: "Reply and organise", category: "Admin", duration: 45, screen: "30 min screen", done: false },
  { id: 6, time: "20:30", title: "Evening wind-down", category: "Health & Rest", duration: 30, screen: "screen-free", done: true }
];

const demo = {
  blocks: demoBlocks,
  theme: "warm",
  goal: 330,
  reminders: true,
  customColors: null,
  history: {},
  journal: [
    { date: "Sep 26, 2026", mood: "Grateful", text: "Life is so much fun when you young" },
    { date: "Sep 16, 2026", mood: "Grateful", text: "A quiet start helped me find more room for the things that matter." }
  ],
  focusSeconds: 1500,
  focusRunning: false,
  focusTask: "Reply and organise",
  currentMood: "Calm"
};

let data = JSON.parse(localStorage.getItem(KEY) || "null") || structuredClone(demo);
let currentPage = "plan";
let timerId = null;
let filter = "All blocks";

if (!data.history) data.history = {};

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function fmtTime(s) {
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function today() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function getCurrentDayName() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function score() {
  const total = data.blocks.length || 1;
  return Math.round(data.blocks.filter((b) => b.done).length / total * 100);
}

function getDateKey(date = new Date()) {
  return new Date(date).toISOString().split("T")[0];
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: getDateKey(d),
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d
    });
  }
  return days;
}

function parseScreenMinutes(value) {
  if (!value) return 0;
  const text = String(value).toLowerCase();
  if (text.includes("screen-free")) return 0;
  const match = text.match(/(\d+)\s*min/i);
  if (match) return Number(match[1]);
  return 0;
}

function syncTodayHistory() {
  data.history = data.history || {};
  const planned = data.blocks.reduce((sum, b) => sum + (Number(b.duration) || 0), 0);
  const done = data.blocks.filter(b => b.done).reduce((sum, b) => sum + (Number(b.duration) || 0), 0);
  const completedCount = data.blocks.filter(b => b.done).length;
  const screenMinutes = data.blocks.reduce((sum, b) => sum + parseScreenMinutes(b.screen), 0);
  data.history[getDateKey()] = {
    planned,
    done,
    completedCount,
    screenMinutes
  };
}

function applyThemeColors() {
  if (data.theme === "custom" && data.customColors) {
    document.documentElement.style.setProperty("--pink", data.customColors.pink);
    document.documentElement.style.setProperty("--gold", data.customColors.gold);
    document.body.dataset.theme = "";
  } else {
    document.body.dataset.theme = data.theme === "warm" ? "" : data.theme;
    document.documentElement.style.setProperty("--pink", "");
    document.documentElement.style.setProperty("--gold", "");
  }
}

function nav(page) {
  currentPage = page;
  document.querySelectorAll(".page").forEach((x) => x.classList.toggle("active", x.id === page));
  document.querySelectorAll("[data-page]").forEach((x) => x.classList.toggle("active", x.dataset.page === page));
  render();
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => nav(button.dataset.page));
});

document.getElementById("quickAdd").addEventListener("click", openModal);

document.getElementById("datePill").textContent = new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric"
});

document.getElementById("fullDate").textContent = today();

function tickClock() {
  document.getElementById("clock").textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
setInterval(tickClock, 1000);
tickClock();

function getDayRhythmLabel() {
  return `${getCurrentDayName().toUpperCase()} RHYTHM`;
}

function render() {
  applyThemeColors();
  document.getElementById("sidebarDone").textContent = data.blocks.filter((b) => b.done).length;
  document.getElementById("sidebarTotal").textContent = data.blocks.length;
  document.getElementById("greetingText").textContent = `${getGreeting()}, Jude / Make space for what matters`;
  if (currentPage === "plan") renderPlan();
  if (currentPage === "focus") renderFocus();
  if (currentPage === "insights") renderInsights();
  if (currentPage === "journal") renderJournal();
  if (currentPage === "settings") renderSettings();
}

function renderPlan() {
  const s = score();
  const done = data.blocks.filter((b) => b.done).length;
  const planned = data.blocks.reduce((a, b) => a + b.duration, 0);
  const cats = ["Deep Work", "Health & Rest", "Personal", "Admin"];

  document.getElementById("plan").innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">${getDayRhythmLabel()}</div>
        <h1>The Day Map</h1>
        <p class="sub">A calm view of your day, with enough structure to keep your attention soft.</p>
      </div>
      <button onclick="toggleView()" class="view-toggle">▧ Timeline</button>
    </div>

    <div class="plan-layout">
      <div>
        <div class="filter-row">
          ${["All blocks", ...cats].map((x) => `
            <button class="chip ${filter === x ? "active" : ""}" onclick="setFilter('${x}')">${x}</button>
          `).join("")}
          <span class="filter">⌯ Filter</span>
        </div>

        ${data.blocks
          .filter((b) => filter === "All blocks" || b.category === filter)
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((block) => blockHTML(block))
          .join("")}
      </div>

      <div class="side-stack">
        <div class="card balance">
          <div class="card-title">
            Today's Balance
            <span style="float:right;color:var(--muted)">${done}/${data.blocks.length} done</span>
          </div>

          <div class="ring" style="--score:${s}">
            <strong>${s}%</strong>
            <span>IN BALANCE</span>
          </div>

          <div class="stats">
            <div class="statbox"><b>${Math.floor(planned / 60)}h</b><span>PLANNED</span></div>
            <div class="statbox"><b>${done}</b><span>COMPLETED</span></div>
          </div>
        </div>

        <div class="card focus-card">
          <div class="card-title">Focus next <span style="float:right;color:var(--pink)">→</span></div>
          <p>Give one block your full attention. The rest of the day can wait.</p>
        </div>

        <div class="card ingredients">
          <div class="card-title">Your ingredients</div>
          ${cats.map((c) => {
            const n = data.blocks.filter((b) => b.category === c).length;
            return `
              <div class="ingredient">
                <div class="ingredient-dot" style="background:${c === "Deep Work" ? "var(--pink)" : c === "Health & Rest" ? "var(--gold)" : "var(--pink)"}"></div>
                <small>${c}</small>
                <b>${n}</b>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function blockHTML(b) {
  const stateClass = b.done ? "done" : "";
  return `
    <div class="block fade-in ${stateClass}">
      <div class="block-time">${b.time}</div>
      <div>
        <h4 class="${b.done ? "done-title" : ""}">
          ${b.title}
          <span class="tag">${b.done ? "✓ DONE" : "UPCOMING"}</span>
        </h4>
        <div class="block-detail">${b.category} · ${b.duration}m · ${b.screen}</div>
      </div>
      <button class="block-action" onclick="toggleBlock(${b.id})"></button>
      <button class="block-menu" onclick="if(confirm('Delete this block?')) deleteBlock(${b.id})">×</button>
    </div>
  `;
}

function setFilter(x) {
  filter = x;
  render();
}

function toggleBlock(id) {
  const b = data.blocks.find((x) => x.id === id);
  if (!b) return;
  b.done = !b.done;
  syncTodayHistory();
  save();
  render();
}

function deleteBlock(id) {
  data.blocks = data.blocks.filter((x) => x.id !== id);
  syncTodayHistory();
  save();
  render();
}

function focusOn(title) {
  data.focusTask = title;
  save();
  nav("focus");
}

function openModal() {
  document.getElementById("blockModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("blockModal").classList.add("hidden");
}

function addBlock() {
  const block = {
    id: Date.now(),
    time: document.getElementById("blockTime").value,
    title: document.getElementById("blockTitle").value.trim() || "New block",
    category: document.getElementById("blockCategory").value,
    duration: Number(document.getElementById("blockDuration").value) || 45,
    screen: "Custom screen time",
    done: false
  };

  data.blocks.push(block);
  syncTodayHistory();
  save();
  closeModal();
  render();
}

function renderFocus() {
  const sec = Number(data.focusSeconds) || 1500;

  document.getElementById("focus").innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">ONE THING AT A TIME</div>
        <h1>Focus Time</h1>
        <p class="sub">Choose a gentle container for your attention and protect it from the noise.</p>
      </div>
    </div>

    <div class="focus-grid">
      <div class="card timer-card">
        <div class="timer-circle">
          <div>
            <b id="timerText" class="timer-display">${fmtTime(sec)}</b>
            <span>${data.focusRunning ? "FOCUSING" : "REPLY AND ORGANISE"}</span>
          </div>
        </div>

        <select class="select" onchange="data.focusTask=this.value; save();">
          ${data.blocks.length
            ? data.blocks.map((b) => `
              <option ${data.focusTask === b.title ? "selected" : ""}>${b.title}</option>
            `).join("")
            : "<option>No tasks</option>"}
        </select>

        <div class="timer-controls">
          <button class="primary" onclick="startTimer()">${data.focusRunning ? "❚❚ Pause" : "▷ Start"}</button>
          <button class="secondary" onclick="resetTimer()">↻ Reset</button>
          <button class="secondary" onclick="completeFocus()">✓ Done</button>
        </div>
      </div>

      <div class="card preset-card">
        <div class="card-title">Choose a container <span style="float:right">✣</span></div>

        ${[ [25, "Pomodoro"], [45, "Deep work"], [60, "Ultra focus"] ].map(([m, t]) => `
          <button class="preset ${sec === m * 60 ? "selected" : ""}" onclick="setTimer(${m * 60})">
            <b>${m} min</b><br>
            <span>${t}</span>
          </button>
        `).join("")}

        <hr style="border:0;border-top:1px solid var(--line)">
        <small style="color:var(--muted)">Custom minutes</small>
        <input id="customMin" type="number" value="${Math.max(1, Math.round(sec / 60))}" min="1" max="180" oninput="setTimer(this.value * 60)">
        <div class="landing">
          <b style="font-size:9px">A soft landing</b>
          <p>When the timer finishes, The Day Map will mark this activity complete and play a quiet chime.</p>
        </div>
      </div>
    </div>
  `;
}

function setTimer(sec) {
  data.focusSeconds = Math.max(1, Number(sec) || 1500);
  data.focusRunning = false;
  clearInterval(timerId);
  save();
  render();
}

function startTimer() {
  data.focusRunning = !data.focusRunning;
  save();
  render();

  if (data.focusRunning) {
    clearInterval(timerId);
    timerId = setInterval(() => {
      if (data.focusSeconds > 0) {
        data.focusSeconds--;
        save();
        let el = document.getElementById("timerText");
        if (el) el.textContent = fmtTime(data.focusSeconds);
      } else {
        completeFocus();
        alert("Focus time complete! You did great.");
      }
    }, 1000);
  }
}

function resetTimer() {
  data.focusSeconds = 1500;
  data.focusRunning = false;
  clearInterval(timerId);
  save();
  render();
}

function completeFocus() {
  const b = data.blocks.find((x) => x.title === data.focusTask);
  if (b) b.done = true;
  syncTodayHistory();
  resetTimer();
  save();
  render();
}

function renderInsights() {
  const last7 = getLast7Days();

  const plannedSeries = last7.map(day => {
    const entry = data.history?.[day.key];
    return entry ? entry.planned : 0;
  });

  const doneSeries = last7.map(day => {
    const entry = data.history?.[day.key];
    return entry ? entry.done : 0;
  });

  const screenSeries = last7.map(day => {
    const entry = data.history?.[day.key];
    return entry ? entry.screenMinutes : 0;
  });

  const maxBar = Math.max(...plannedSeries, ...doneSeries, 1);
  const maxScreen = Math.max(...screenSeries, 1);

  const bestDay = last7.reduce((best, day) => {
    const value = data.history?.[day.key]?.completedCount || 0;
    if (!best || value > best.value) {
      return { label: day.label, value };
    }
    return best;
  }, null);

  document.getElementById("insights").innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">PATTERNS, NOT PRESSURE</div>
        <h1>Insights & Rhythm</h1>
        <p class="sub">A gentle look at how your attention flows through the week.</p>
      </div>
    </div>

    <div class="metrics">
      <div class="card metric hover-lift" title="Percentage of planned blocks you've completed">
        <b>${score()}%</b>
        <span>plan completion</span>
      </div>

      <div class="card metric hover-lift" title="Total hours of focused time this week">
        <b>${(data.blocks.filter((b) => b.done).reduce((a, b) => a + b.duration, 0) / 60).toFixed(1)}h</b>
        <span>deep hours</span>
      </div>

      <div class="card metric hover-lift" title="Average number of tasks completed daily">
        <b>${Math.max(0, Math.round((doneSeries.reduce((a, b) => a + b, 0) / doneSeries.length) / 60))}</b>
        <span>avg daily done</span>
      </div>
    </div>

    <div class="charts">
      <div class="card chart-card">
        <div class="chart-title">
          Completed vs planned
          <span style="float:right;color:var(--pink)">● Done &nbsp; <span style="color:var(--gold)">● Planned</span></span>
        </div>

        <div class="chart">
          <svg class="bar-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
            ${last7.map((day, i) => {
              const planned = plannedSeries[i] || 0;
              const done = doneSeries[i] || 0;
              const plannedHeight = (planned / maxBar) * 120;
              const doneHeight = (done / maxBar) * 120;

              return `
                <g>
                  <rect x="${i * 50 + 10}" y="${200 - doneHeight}" width="20" height="${doneHeight}" fill="var(--pink)" opacity="0.75"></rect>
                  <rect x="${i * 50 + 33}" y="${200 - plannedHeight}" width="20" height="${plannedHeight}" fill="var(--gold)" opacity="0.4"></rect>
                  <text x="${i * 50 + 20}" y="215" font-size="10" text-anchor="middle">${day.label}</text>
                </g>
              `;
            }).join("")}
          </svg>
        </div>
      </div>

      <div class="card chart-card">
        <div class="chart-title">Screen time <span style="float:right;color:var(--pink)">⌁</span></div>
        <div class="chart">
          <svg class="line-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
            ${screenSeries.map((s, i) => {
              const y = 200 - ((s / maxScreen) * 140);
              return `<circle cx="${i * 60 + 10}" cy="${y}" r="4" fill="var(--pink)" class="dot-animate" style="animation-delay:${i * 0.1}s"></circle>`;
            }).join("")}
            <polyline points="${screenSeries.map((s, i) => `${i * 60 + 10},${200 - ((s / maxScreen) * 140)}`).join(" ")}" stroke="var(--pink)" stroke-width="2" fill="none" opacity="0.3"></polyline>
          </svg>
        </div>
      </div>
    </div>

    <div class="card reflection">
      <div class="card-title">💡 A little reflection</div>
      <div class="reflection-grid">
        <div>
          <small>You kept</small>
          <p><b>${data.blocks.filter(b => b.done).length} tasks</b></p>
          <small>done this week</small>
        </div>
        <div>
          <small>This week you moved</small>
          <p><b>${Math.round(screenSeries.reduce((a, b) => a + b, 0) / 60)}h</b></p>
          <small>of screen time</small>
        </div>
        <div>
          <small>Your best day was</small>
          <p><b>${bestDay ? bestDay.label : "—"}</b></p>
          <small>${bestDay ? `${bestDay.value} tasks` : "No data yet"}</small>
        </div>
      </div>
    </div>
  `;
}

function renderJournal() {
  const moodOptions = ["Calm", "Inspired", "Focused", "Grateful", "Rested"];

  document.getElementById("journal").innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">A PLACE TO LAND</div>
        <h1>Daily Journal</h1>
        <p class="sub">A few honest lines can help the day become a little clearer.</p>
      </div>
    </div>

    <div class="journal-grid">
      <div class="card journal-card">
        <div class="card-title">● ${today()}</div>
        <h3 style="font-size:14px">What is here today?</h3>
        <div class="moods">
          ${moodOptions.map((mood) => `
            <button class="mood ${data.currentMood === mood ? "selected" : ""}" onclick="data.currentMood='${mood}'; render();">
              ${mood}
            </button>
          `).join("")}
        </div>

        <textarea id="journalText" placeholder="A few honest lines..." style="width:100%;min-height:120px;padding:10px;border:1px solid var(--line);border-radius:8px;resize:vertical"></textarea>
        <button class="primary full" onclick="saveJournal()" style="margin-top:10px">Save entry</button>
      </div>

      <div class="card past">
        <div class="card-title">Past reflections</div>
        <input class="search" placeholder="Search entries" oninput="filterJournal(this.value)">
        <div id="entries">
          ${data.journal.map((entry) => `
            <div class="entry">
              <small>${entry.date}</small>
              <p><b>${entry.mood}</b> ${entry.text}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function saveJournal() {
  const text = document.getElementById("journalText").value.trim();

  if (!text) return;

  data.journal.unshift({
    date: today(),
    mood: data.currentMood || "Calm",
    text
  });

  document.getElementById("journalText").value = "";
  data.currentMood = "Calm";
  save();
  render();
}

function filterJournal(q) {
  const entries = data.journal.filter((entry) => {
    const haystack = (entry.text + " " + entry.mood + " " + entry.date).toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  document.getElementById("entries").innerHTML = entries.map((entry) => `
    <div class="entry">
      <small>${entry.date}</small>
      <p><b>${entry.mood}</b> ${entry.text}</p>
    </div>
  `).join("");
}

function renderSettings() {
  const themes = [
    ["warm", "Warm Rose", ["#d968a0", "#e5b33d", "#fff8ec", "#403b3a"], "Rosy pink, warm gold, and creamy space"],
    ["ocean", "Ocean", ["#3aaee2", "#1688bd", "#dff3fb", "#17283b"], "Calm coastal blues"],
    ["forest", "Forest", ["#6abf96", "#3f775d", "#dff2e7", "#2e5c48"], "Deep nature greens"],
    ["sunset", "Sunset", ["#f36b0d", "#f5a30a", "#fde2cf", "#5c2e0f"], "Warm orange and amber"],
    ["midnight", "Midnight", ["#8d63ee", "#6872e8", "#111827", "#edf1f7"], "Cool purples for night"]
  ];

  document.getElementById("settings").innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">MAKE IT YOURS</div>
        <h1>Preferences & Themes</h1>
        <p class="sub">Tune the space around your attention. Changes save instantly.</p>
      </div>
    </div>

    <div class="card" style="padding:14px">
      <div class="card-title">Colour theme</div>
      <div class="theme-row">
        ${themes.map((t) => `
          <button class="theme ${data.theme === t[0] ? "active" : ""}" onclick="setTheme('${t[0]}')" title="${t[3]}" style="background:linear-gradient(135deg, ${t[2][0]}, ${t[2][1]})">
            <span>${t[1]}</span>
          </button>
        `).join("")}
      </div>
    </div>

    <div class="card" style="padding:14px; margin-top:12px;">
      <div class="card-title">Custom Colors</div>
      <p style="font-size:10px;color:var(--muted);margin-bottom:12px">Create your own theme</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <label style="font-size:9px">
          Primary Color
          <input type="color" id="customPink" value="${data.customColors?.pink || "#d968a0"}" onchange="updateCustomColor('pink', this.value)">
        </label>
        <label style="font-size:9px">
          Secondary Color
          <input type="color" id="customGold" value="${data.customColors?.gold || "#e5b33d"}" onchange="updateCustomColor('gold', this.value)">
        </label>
      </div>

      <button class="secondary full" onclick="applyCustomTheme()" style="margin-top:10px">Apply custom theme</button>
    </div>

    <div class="settings-grid">
      <div class="card setting-card">
        <div class="card-title">Daily preferences</div>
        <div style="font-size:9px">Daily screen time goal <b style="float:right;color:var(--pink)">${data.goal} min</b></div>
        <input type="range" min="60" max="480" value="${data.goal}" onchange="data.goal=this.value; save(); render();" style="width:100%;margin:8px 0">
        <div style="font-size:9px">Notifications <b style="float:right;color:var(--pink)">${data.reminders ? "On" : "Off"}</b></div>
        <button class="chip" onclick="data.reminders=!data.reminders; save(); render();" style="margin-top:8px">
          ${data.reminders ? "✓ Reminders enabled" : "✗ Reminders disabled"}
        </button>
      </div>

      <div class="card setting-card">
        <div class="privacy">
          <div class="privacy-icon">♙</div>
          <div>
            <b>100% on-device & private</b>
            <p style="font-size:9px;color:var(--muted);line-height:1.5">
              Your activities stay only on this device. No tracking, no accounts, no cloud.
            </p>
          </div>
        </div>
      </div>

      <div class="card setting-card" style="grid-column:1/-1">
        <div class="card-title">Data management</div>
        <p style="font-size:9px;color:var(--muted)">Keep a clean slate or bring the example day back</p>
        <button class="secondary" onclick="clearAll()">🗑 Clear all data</button>
        <button class="secondary" onclick="restoreDemo()">↻ Restore example day</button>
      </div>
    </div>
  `;
}

function setTheme(t) {
  data.theme = t;
  data.customColors = null;
  save();
  render();
}

function updateCustomColor(key, value) {
  if (!data.customColors) data.customColors = {};
  data.customColors[key] = value;
}

function applyCustomTheme() {
  data.theme = "custom";
  data.customColors = {
    pink: document.getElementById("customPink").value,
    gold: document.getElementById("customGold").value
  };
  save();
  applyThemeColors();
  render();
}

function restoreDemo() {
  data = structuredClone(demo);
  syncTodayHistory();
  save();
  render();
}

function clearAll() {
  if (confirm("Clear your Day Map data?")) {
    data = {
      ...structuredClone(demo),
      blocks: [],
      journal: [],
      theme: data.theme,
      goal: data.goal,
      reminders: data.reminders,
      customColors: data.customColors
    };
    syncTodayHistory();
    save();
    render();
  }
}

function toggleView() {
  alert("Timeline view coming soon!");
}

syncTodayHistory();
applyThemeColors();
render();
