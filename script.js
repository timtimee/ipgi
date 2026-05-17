const CONFIG = {
  jackpotDataUrl: 'data.json',
  leaderboardUrl: 'https://ipgi-laos.github.io/stvegas/leaderboard.json',
  leaderboardFallbackUrl: 'https://raw.githubusercontent.com/ipgi-laos/stvegas/main/leaderboard.json',
  fullLeaderboardUrl: 'https://ipgi-laos.github.io/stvegas/',
  refreshMs: 60000
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

let jackpotData = {};
let jackpotMode = 'current';

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
  setInterval(loadJackpotData, CONFIG.refreshMs);
}

async function loadJackpotData() {
  try {
    jackpotData = await fetchJsonWithFallback(CONFIG.jackpotDataUrl);
    renderJackpots();
  } catch (error) {
    const grid = document.getElementById('jackpotGrid');
    if (grid) grid.innerHTML = `<div class="error-card">Unable to load jackpot data. Please check data.json.</div>`;
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
      <article class="jackpot-card reveal-card is-visible">
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
    <article class="event-card reveal-card is-visible">
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
  setInterval(loadLeaderboardPreview, CONFIG.refreshMs);
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

/* Menu scroll + active section */
function scrollToSection(hash) {
  const target = document.querySelector(hash);
  if (!target) return;

  mainNav.classList.remove('open');
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateActiveMenu() {
  const sections = [...document.querySelectorAll('.snap-section')];
  const offset = window.innerHeight * 0.32;

  let currentId = sections[0]?.id || 'latest-jackpot';
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= offset) currentId = section.id;
  }

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
  });
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-card').forEach((card) => observer.observe(card));
}

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  event.preventDefault();
  scrollToSection(link.getAttribute('href'));
});

window.addEventListener('scroll', updateActiveMenu, { passive: true });
window.addEventListener('resize', updateActiveMenu);

initJackpotView();
initEventsView();
initPromotionView();
initReveal();
updateActiveMenu();
