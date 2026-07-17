'use strict';

/**
 * GASのWebアプリURLを設定してください。
 * 未設定の場合は sampleLinks / sampleCategories を表示します。
 */
const DATA_URL = 'https://script.google.com/macros/s/AKfycbx9hFtHdRq35yOjDbSpkoIZlB_3w_TSlqL75kmb9nwSE2G6hMzV5Mj9OsUWYHqVNhSTag/exec';

const sampleCategories = [
  { active: true, category: '一時保存', initialState: 'open', order: 10 },
  { active: true, category: '業務', initialState: 'open', order: 20 },
  { active: true, category: 'AI', initialState: 'open', order: 30 },
  { active: true, category: 'Google', initialState: 'hide', order: 40 },
  { active: true, category: '開発', initialState: 'hide', order: 50 }
];

const sampleLinks = [
  {
    active: true,
    pin: true,
    category: '一時保存',
    name: 'GitHub Repository',
    url: 'https://github.com/',
    description: 'このサイトのリポジトリ管理',
    order: 10
  },
  {
    active: true,
    pin: false,
    category: 'AI',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    description: 'メインAI',
    order: 10
  },
  {
    active: true,
    pin: false,
    category: 'Google',
    name: 'Google Drive',
    url: 'https://drive.google.com/',
    description: 'ファイルと資料の保存',
    order: 10
  },
  {
    active: true,
    pin: false,
    category: '開発',
    name: 'GitHub',
    url: 'https://github.com/',
    description: 'コードとリポジトリ管理',
    order: 10
  }
];

const FALLBACK_CATEGORY = '未分類';
const FALLBACK_CATEGORY_ORDER = 9999;

const elements = {
  statusPanel: document.querySelector('#status-panel'),
  pinnedSection: document.querySelector('#pinned-section'),
  pinnedGrid: document.querySelector('#pinned-grid'),
  pinnedCount: document.querySelector('#pinned-count'),
  categoryContainer: document.querySelector('#category-container'),
  lastUpdated: document.querySelector('#last-updated'),
  reloadButton: document.querySelector('#reload-button'),
  template: document.querySelector('#link-card-template')
};

document.addEventListener('DOMContentLoaded', () => {
  elements.reloadButton.addEventListener('click', loadLinks);
  loadLinks();
});

async function loadLinks() {
  setLoading(true);

  try {
    const payload = DATA_URL
      ? await fetchRemoteData(DATA_URL)
      : {
          links: sampleLinks,
          categories: sampleCategories,
          updatedAt: null,
          isSample: true
        };

    const links = normalizeLinks(payload.links);
    const categories = normalizeCategories(payload.categories);
    renderLinks(links, categories);

    if (payload.isSample) {
      showStatus(
        '現在はサンプルデータを表示しています。app.js の DATA_URL にGASのWebアプリURLを設定してください。'
      );
    } else {
      hideStatus();
    }

    updateTimestamp(payload.updatedAt);
  } catch (error) {
    console.error(error);
    showStatus(
      'データの取得に失敗しました。GASの公開設定、URL、レスポンス形式を確認してください。',
      true
    );
    renderLinks([], []);
    updateTimestamp(null);
  } finally {
    setLoading(false);
  }
}

async function fetchRemoteData(url) {
  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}t=${Date.now()}`, {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const json = await response.json();

  if (Array.isArray(json)) {
    return {
      links: json,
      categories: [],
      updatedAt: null,
      isSample: false
    };
  }

  if (!json || !Array.isArray(json.links)) {
    throw new Error('Invalid JSON format');
  }

  return {
    links: json.links,
    categories: Array.isArray(json.categories) ? json.categories : [],
    updatedAt: json.updatedAt ?? null,
    isSample: false
  };
}

function normalizeLinks(rawLinks) {
  return rawLinks
    .map((item, index) => {
      const url = String(item.url ?? '').trim();
      const name = String(item.name ?? '').trim();

      if (!url || !name || !isHttpUrl(url)) {
        return null;
      }

      return {
        active: toBoolean(item.active, true),
        pin: toBoolean(item.pin, false),
        category: String(item.category ?? FALLBACK_CATEGORY).trim() || FALLBACK_CATEGORY,
        name,
        url,
        description: String(item.description ?? '').trim(),
        order: toNumber(item.order, index + 1)
      };
    })
    .filter(Boolean)
    .filter((item) => item.active);
}

function normalizeCategories(rawCategories) {
  return rawCategories
    .map((item, index) => {
      const category = String(item.category ?? '').trim();

      if (!category || !toBoolean(item.active, true)) {
        return null;
      }

      const initialState = String(item.initialState ?? item.initial_state ?? 'open')
        .trim()
        .toLowerCase();

      return {
        category,
        initialState: initialState === 'hide' ? 'hide' : 'open',
        order: toNumber(item.order, index + 1),
        isFallback: false
      };
    })
    .filter(Boolean)
    .sort(compareCategories);
}

function renderLinks(links, categories) {
  elements.pinnedGrid.replaceChildren();
  elements.categoryContainer.replaceChildren();

  const pinnedLinks = links.filter((item) => item.pin);
  const normalLinks = links.filter((item) => !item.pin);

  renderPinnedLinks(pinnedLinks);
  renderCategories(normalLinks, categories);

  if (links.length === 0) {
    showStatus('表示対象のリンクがありません。');
  }
}

function renderPinnedLinks(links) {
  elements.pinnedSection.hidden = links.length === 0;

  if (links.length === 0) {
    elements.pinnedCount.textContent = '';
    return;
  }

  elements.pinnedCount.textContent = `${links.length}件`;

  const fragment = document.createDocumentFragment();
  links
    .sort(compareLinks)
    .forEach((link) => fragment.appendChild(createCard(link)));

  elements.pinnedGrid.appendChild(fragment);
}

function renderCategories(links, categories) {
  const grouped = groupLinksByCategory(links);
  const categorySettings = buildCategorySettings(grouped, categories);

  categorySettings.forEach((category, index) => {
    const categoryLinks = grouped.get(category.category) ?? [];

    if (categoryLinks.length === 0) {
      return;
    }

    const sectionId = `category-${index + 1}-${slugify(category.category)}`;
    const isOpen = category.initialState === 'open';
    const section = document.createElement('section');
    section.className = 'link-section';

    const heading = document.createElement('div');
    heading.className = 'section-heading';

    const title = document.createElement('h2');
    const toggle = document.createElement('button');
    const icon = document.createElement('span');
    const label = document.createElement('span');
    const count = document.createElement('span');

    toggle.type = 'button';
    toggle.className = 'category-toggle';
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-controls', sectionId);

    icon.className = 'toggle-icon';
    icon.setAttribute('aria-hidden', 'true');

    label.className = 'category-title';
    label.textContent = category.category;

    count.className = 'section-count';
    count.textContent = `${categoryLinks.length}件`;

    toggle.append(icon, label, count);
    title.appendChild(toggle);
    heading.appendChild(title);

    const grid = document.createElement('div');
    grid.id = sectionId;
    grid.className = 'card-grid category-panel';
    grid.hidden = !isOpen;

    categoryLinks
      .sort(compareLinks)
      .forEach((link) => grid.appendChild(createCard(link)));

    updateCategoryToggle(toggle, icon, grid);
    toggle.addEventListener('click', () => {
      grid.hidden = !grid.hidden;
      updateCategoryToggle(toggle, icon, grid);
    });

    section.append(heading, grid);
    elements.categoryContainer.appendChild(section);
  });
}

function groupLinksByCategory(links) {
  const grouped = new Map();

  links.forEach((link) => {
    if (!grouped.has(link.category)) {
      grouped.set(link.category, []);
    }
    grouped.get(link.category).push(link);
  });

  return grouped;
}

function buildCategorySettings(grouped, categories) {
  const configured = new Map(categories.map((category) => [category.category, category]));
  const settings = categories.filter((category) => grouped.has(category.category));

  grouped.forEach((_, categoryName) => {
    if (!configured.has(categoryName)) {
      settings.push({
        category: categoryName,
        initialState: 'open',
        order: FALLBACK_CATEGORY_ORDER,
        isFallback: true
      });
    }
  });

  return settings.sort(compareCategories);
}

function updateCategoryToggle(toggle, icon, panel) {
  const isOpen = !panel.hidden;
  icon.textContent = isOpen ? '▼' : '▶';
  toggle.setAttribute('aria-expanded', String(isOpen));
}

function createCard(link) {
  const card = elements.template.content.firstElementChild.cloneNode(true);
  const icon = card.querySelector('.link-icon');
  const title = card.querySelector('.card-title');
  const domain = card.querySelector('.card-domain');

  card.href = link.url;
  card.dataset.pinned = String(link.pin);
  card.setAttribute('aria-label', `${link.name}を新しいタブで開く`);

  title.textContent = link.name;

  const parsedUrl = new URL(link.url);
  domain.textContent = parsedUrl.hostname.replace(/^www\./, '');

  const faviconCandidates = getFaviconUrls(parsedUrl);
  icon.dataset.faviconIndex = '0';
  icon.src = faviconCandidates[0];
  icon.alt = `${link.name}のアイコン`;
  icon.addEventListener('error', () => {
    showNextFavicon(icon, faviconCandidates, link.name);
  });

  return card;
}

function compareCategories(a, b) {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  if (a.isFallback !== b.isFallback) {
    return Number(a.isFallback) - Number(b.isFallback);
  }

  return a.category.localeCompare(b.category, 'ja');
}

function compareLinks(a, b) {
  return a.order - b.order || a.name.localeCompare(b.name, 'ja');
}

function getFaviconUrls(url) {
  const host = url.hostname.replace(/^www\./, '');
  const candidates = [
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
    `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=64`
  ];

  if (url.protocol === 'https:') {
    candidates.push(`${url.origin}/favicon.ico`);
  }

  return candidates;
}

function showNextFavicon(icon, candidates, name) {
  const nextIndex = Number(icon.dataset.faviconIndex ?? 0) + 1;
  icon.dataset.faviconIndex = String(nextIndex);
  icon.src = candidates[nextIndex] ?? createFallbackIcon(name);
}

function createFallbackIcon(name) {
  const letter = (name.trim().charAt(0) || '?').toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect width="64" height="64" rx="14" fill="#64748b"/>
      <text x="50%" y="54%" text-anchor="middle"
        dominant-baseline="middle"
        fill="white"
        font-family="Arial, sans-serif"
        font-size="30"
        font-weight="700">${escapeXml(letter)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function updateTimestamp(updatedAt) {
  const date = updatedAt ? new Date(updatedAt) : new Date();

  if (Number.isNaN(date.getTime())) {
    elements.lastUpdated.textContent = '更新日時を取得できませんでした';
    return;
  }

  elements.lastUpdated.textContent =
    `最終読込: ${new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)}`;
}

function showStatus(message, isError = false) {
  elements.statusPanel.hidden = false;
  elements.statusPanel.textContent = message;
  elements.statusPanel.dataset.error = String(isError);
}

function hideStatus() {
  elements.statusPanel.hidden = true;
  elements.statusPanel.textContent = '';
  elements.statusPanel.dataset.error = 'false';
}

function setLoading(isLoading) {
  elements.reloadButton.disabled = isLoading;
  elements.reloadButton.textContent = isLoading ? '読込中' : '再読み込み';
}

function toBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off', ''].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return fallback;
}

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function slugify(value) {
  const encoded = encodeURIComponent(value)
    .replace(/%/g, '')
    .toLowerCase();

  return encoded || 'uncategorized';
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    };
    return entities[character];
  });
}
