const CONFIG = {
  jackpotDataUrl: 'data.json',
  // Best for browser use: GitHub Pages URL. If you use a different repo later, change only this URL.
  leaderboardUrl: 'https://ipgi-laos.github.io/stvegas/leaderboard.json',
  leaderboardFallbackUrl: 'https://raw.githubusercontent.com/ipgi-laos/stvegas/main/leaderboard.json',
  fullLeaderboardUrl: 'https://ipgi-laos.github.io/stvegas/',
  refreshMs: 60000
};

const TEMPLATES = {
  jackpot: 'templates/jackpot.html',
  events: 'templates/events.html',
  promotion: 'templates/promotion.html'
};

const EVENTS = [
  {
    id: 'steam-bun',
    image: 'images/steambun.webp',
    title: 'Chinese Steam Pork Bun',
    subtitle: 'Morning Giveaway',
    tag: 'Free for Early Players',
    schedule: 'Every Tuesday & Wednesday Morning',
    time: 'Starts 09:00 AM onwards',
    note: 'Until Supplies Last',
    location: 'First Floor – Zone C',
    description: 'Enjoy freshly steamed pork buns for early players. Limited quantity available.'
  },
  {
    id: 'egg-tart',
    image: 'images/eggtart.webp',
    title: 'Egg Tart',
    subtitle: 'Morning Giveaway',
    tag: 'Free for Early Players',
    schedule: 'Every Friday & Saturday Morning',
    time: 'Starts 09:00 AM onwards',
    note: 'Until Supplies Last',
    location: 'First Floor – Zone C',
    description: 'Start your day with delicious egg tarts while enjoying your favorite games.'
  }
];

let activeView = 'jackpot';
let jackpotData = {};
let jackpotMode = 'current';
let leaderboardTimer = null;
let jackpotTimer = null;

const app = document.getElementById('app');
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toLocaleString('en-US') : '--';
}

function formatGameName(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

function setStatus(element, text) {
  if (element) element.textContent = text;
}

async function loadTemplate(name) {
  const response = await fetch(`${TEMPLATES[name]}?v=${Date.now()}`);
  if (!response.ok) throw new Error(`Unable to load ${TEMPLATES[name]}`);
  return response.text();
}

async function navigate(name) {
  activeView = name;
  clearInterval(leaderboardTimer);
  clearInterval(jackpotTimer);
  leaderboardTimer = null;
  jackpotTimer = null;

  document.querySelectorAll('[data-template-link]').forEach((button) => {
    button.classList.toggle('active', button.dataset.templateLink === name);
  });

  mainNav.classList.remove('open');
  app.classList.add('view-fading');

  try {
    const template = await loadTemplate(name);

    window.setTimeout(() => {
      app.innerHTML = template;
      app.classList.remove('view-fading');
      app.classList.add('view-entering');
      window.setTimeout(() => app.classList.remove('view-entering'), 450);

      if (name === 'jackpot') initJackpotView();
      if (name === 'events') initEventsView();
      if (name === 'promotion') initPromotionView();

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 180);
  } catch (error) {
    app.classList.remove('view-fading');
    app.innerHTML = `<div class="error-card">Unable to load page content.<br>${error.message}</div>`;
  }
}

async function fetchJsonWithFallback(primaryUrl, fallbackUrl) {
  try {
    const response = await fetch(`${primaryUrl}${primaryUrl.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (primaryError) {
    if (!fallbackUrl) throw primaryError;
    const response = await fetch(`${fallbackUrl}${fallbackUrl.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Fallback HTTP ${response.status}`);
    return await response.json();
  }
}

/* Latest Jackpot */
async function initJackpotView() {
  document.querySelectorAll('[data-jackpot-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      jackpotMode = button.dataset.jackpotMode;
      document.querySelectorAll('[data-jackpot-mode]').forEach((btn) => btn.classList.toggle('active', btn === button));
      renderJackpots();
    });
  });

  await loadJackpotData();
  jackpotTimer = setInterval(loadJackpotData, CONFIG.refreshMs);
}

async function loadJackpotData() {
  try {
    jackpotData = await fetchJsonWithFallback(CONFIG.jackpotDataUrl);
    renderJackpots();
  } catch (error) {
    const grid = document.getElementById('jackpotGrid');
    if (grid) grid.innerHTML = `<div class="error-card">Unable to load jackpot data.</div>`;
  }
}

function renderJackpots() {
  const grid = document.getElementById('jackpotGrid');
  if (!grid) return;

  const games = jackpotData[jackpotMode] || {};
  const entries = Object.entries(games);

  if (!entries.length) {
    grid.innerHTML = '<div class="loading-card">No jackpot data available.</div>';
    return;
  }

  grid.innerHTML = entries.map(([key, game]) => {
    const level1Date = jackpotMode === 'current' ? `Updated: ${game.time || '--:--'}` : `Date: ${game.level1_date || '--'}`;
    const level2Date = jackpotMode === 'current' ? `Updated: ${game.time || '--:--'}` : `Date: ${game.level2_date || '--'}`;

    return `
      <article class="jackpot-card reveal-card">
        <div class="card-glow"></div>
        <p class="eyebrow compact">${jackpotMode === 'current' ? 'Current Jackpot' : 'Last Jackpot Hit'}</p>
        <h2>${formatGameName(key)}</h2>
        <div class="level-grid">
          <div class="level-card">
            <span class="level-label">Level 1</span>
            <strong class="jackpot-amount">THB ${formatNumber(game.level1)}</strong>
            <small>${level1Date}</small>
          </div>
          <div class="level-card">
            <span class="level-label">Level 2</span>
            <strong class="jackpot-amount">THB ${formatNumber(game.level2)}</strong>
            <small>${level2Date}</small>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* Events */
function initEventsView() {
  const grid = document.getElementById('eventGrid');
  if (!grid) return;

  grid.innerHTML = EVENTS.map((event) => `
    <article class="event-card reveal-card">
      <div class="event-image">
        <img src="${event.image}" alt="${event.title}" loading="lazy" />
      </div>
      <div class="event-content">
        <span class="gold-chip">${event.tag}</span>
        <p class="eyebrow compact">${event.subtitle}</p>
        <h2>${event.title}</h2>
        <p>${event.description}</p>
        <div class="event-details">
          <span>${event.schedule}</span>
          <strong>${event.time}</strong>
          <small>${event.note}</small>
        </div>
        <div class="location-pill">${event.location}</div>
      </div>
    </article>
  `).join('');
}

/* Promotions */
async function initPromotionView() {
  const link = document.getElementById('fullLeaderboardLink');
  if (link) link.href = CONFIG.fullLeaderboardUrl;

  await loadLeaderboardPreview();
  leaderboardTimer = setInterval(loadLeaderboardPreview, CONFIG.refreshMs);
}

async function loadLeaderboardPreview() {
  const body = document.getElementById('promotionLeaderboardBody');
  const meta = document.getElementById('leaderboardMeta');
  if (!body) return;

  try {
    const data = await fetchJsonWithFallback(CONFIG.leaderboardUrl, CONFIG.leaderboardFallbackUrl);
    const rows = (data.rows || []).slice(0, 8);

    setStatus(meta, `Last Updated: ${data.lastUpdated || '--'} • Showing Top 8`);

    body.innerHTML = rows.map((row, index) => `
      <tr>
        <td><span class="rank-pill">${row.rank || index + 1}</span></td>
        <td>${row.membership || '--'}</td>
        <td><strong>${formatNumber(row.points)}</strong></td>
      </tr>
    `).join('');

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="3">No leaderboard data available.</td></tr>';
    }
  } catch (error) {
    setStatus(meta, 'Unable to load Hydra leaderboard data.');
    body.innerHTML = '<tr><td colspan="3">Please check the leaderboard JSON URL.</td></tr>';
  }
}

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-template-link]');
  if (!target) return;
  navigate(target.dataset.templateLink);
});

navigate('jackpot');
