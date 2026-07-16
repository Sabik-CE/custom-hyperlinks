'use strict';

/**
 * GASのWebアプリURLを設定してください。
 * 例:
 * const DATA_URL = 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec';
 *
 * 未設定の場合は sampleLinks を表示します。
 */
const DATA_URL = '';

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
    description: 'ファイル・知識保存',
    order: 10
  },
  {
    active: true,
    pin: false,
    category: '開発',
    name: 'GitHub',
    url: 'https://github.com/',
    description: 'コード・リポジトリ管理',
    order: 10
  }
];

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
      : { links: sampleLinks, updatedAt: null, isSample: true };

    const links = normalizeLinks(payload.links);
    renderLinks(links);

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
    renderLinks([]);
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
      updatedAt: null,
      isSample: false
    };
  }

  if (!json || !Array.isArray(json.links)) {
    throw new Error('Invalid JSON format');
  }

  return {
    links: json.links,
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
        category: String(item.category ?? '未分類').trim() || '未分類',
        name,
        url,
        description: String(item.description ?? '').trim(),
        order: toNumber(item.order, index + 1)
      };
    })
    .filter(Boolean)
    .filter((item) => item.active)
    .sort((a, b) => {
      if (a.pin !== b.pin) {
        return Number(b.pin) - Number(a.pin);
      }

      const categoryCompare = a.category.localeCompare(b.category, 'ja');
      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return a.order - b.order || a.name.localeCompare(b.name, 'ja');
    });
}

function renderLinks(links) {
  elements.pinnedGrid.replaceChildren();
  elements.categoryContainer.replaceChildren();

  const pinnedLinks = links.filter((item) => item.pin);
  const normalLinks = links.filter((item) => !item.pin);

  renderPinnedLinks(pinnedLinks);
  renderCategories(normalLinks);

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
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ja'))
    .forEach((link) => fragment.appendChild(createCard(link)));

  elements.pinnedGrid.appendChild(fragment);
}

function renderCategories(links) {
  const grouped = new Map();

  links.forEach((link) => {
    if (!grouped.has(link.category)) {
      grouped.set(link.category, []);
    }
    grouped.get(link.category).push(link);
  });

  grouped.forEach((categoryLinks, categoryName) => {
    const section = document.createElement('section');
    section.className = 'link-section';

    const heading = document.createElement('div');
    heading.className = 'section-heading';

    const title = document.createElement('h2');
    title.textContent = categoryName;

    const count = document.createElement('span');
    count.className = 'section-count';
    count.textContent = `${categoryLinks.length}件`;

    const grid = document.createElement('div');
    grid.className = 'card-grid';

    categoryLinks
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ja'))
      .forEach((link) => grid.appendChild(createCard(link)));

    heading.append(title, count);
    section.append(heading, grid);
    elements.categoryContainer.appendChild(section);
  });
}

function createCard(link) {
  const card = elements.template.content.firstElementChild.cloneNode(true);
  const icon = card.querySelector('.link-icon');
  const title = card.querySelector('.card-title');
  const description = card.querySelector('.card-description');
  const domain = card.querySelector('.card-domain');

  card.href = link.url;
  card.dataset.pinned = String(link.pin);
  card.setAttribute('aria-label', `${link.name}を新しいタブで開く`);

  title.textContent = link.name;
  description.textContent = link.description;

  const parsedUrl = new URL(link.url);
  domain.textContent = parsedUrl.hostname.replace(/^www\./, '');

  icon.src = getFaviconUrl(parsedUrl.origin);
  icon.alt = `${link.name}のアイコン`;
  icon.addEventListener('error', () => {
    icon.src = createFallbackIcon(link.name);
  }, { once: true });

  return card;
}

function getFaviconUrl(origin) {
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=64`;
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
