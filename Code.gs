const SPREADSHEET_ID = '';
const LINKS_SHEET_NAME = 'links';
const CATEGORIES_SHEET_NAME = 'categories';

function doGet() {
  try {
    const spreadsheet = getSpreadsheet();
    const links = readLinks(spreadsheet);
    const categories = readCategories(spreadsheet);

    return createJsonResponse({
      updatedAt: Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ssXXX"),
      categories,
      links
    });
  } catch (error) {
    return createJsonResponse({
      updatedAt: Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ssXXX"),
      error: true,
      message: error && error.message ? error.message : String(error),
      categories: [],
      links: []
    });
  }
}

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('スプレッドシートを取得できませんでした。SPREADSHEET_IDを設定してください。');
  }

  return spreadsheet;
}

function readLinks(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(LINKS_SHEET_NAME);
  if (!sheet) {
    throw new Error(`シート「${LINKS_SHEET_NAME}」が見つかりません。`);
  }

  const rows = readObjects(sheet);

  return rows
    .map((row, index) => {
      const url = String(row.url || '').trim();
      const name = String(row.name || '').trim();

      if (!toBoolean(row.active, true) || !url || !name) {
        return null;
      }

      return {
        active: true,
        pin: toBoolean(row.pin, false),
        category: String(row.category || '未分類').trim() || '未分類',
        name,
        url,
        description: String(row.description || '').trim(),
        order: toNumber(row.order, index + 1)
      };
    })
    .filter(Boolean);
}

function readCategories(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CATEGORIES_SHEET_NAME);
  if (!sheet) {
    return [];
  }

  const rows = readObjects(sheet);

  return rows
    .map((row, index) => {
      const category = String(row.category || '').trim();

      if (!toBoolean(row.active, true) || !category) {
        return null;
      }

      const initialState = String(row.initial_state || row.initialState || 'open')
        .trim()
        .toLowerCase();

      return {
        category,
        displayName: String(row.display_name || row.displayName || category).trim() || category,
        initialState: initialState === 'hide' ? 'hide' : 'open',
        order: toNumber(row.order, index + 1)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.displayName.localeCompare(b.displayName, 'ja'));
}

function readObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map((header) => normalizeHeader(header));

  return values.slice(1).map((row) => {
    return headers.reduce((object, header, index) => {
      if (header) {
        object[header] = row[index];
      }
      return object;
    }, {});
  });
}

function normalizeHeader(value) {
  return String(value || '').trim();
}

function createJsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function toBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].indexOf(normalized) !== -1) {
      return true;
    }

    if (['false', '0', 'no', 'off', ''].indexOf(normalized) !== -1) {
      return false;
    }
  }

  return fallback;
}

function toNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
