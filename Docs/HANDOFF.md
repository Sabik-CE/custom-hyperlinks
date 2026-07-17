# Custom Hyperlinks — Codex Handoff

## Current status
- GitHub account: `Sabik-CE`
- Repository: `custom-hyperlinks`
- Published URL: `https://sabik-ce.github.io/custom-hyperlinks/`
- Google Sheets and GAS are already connected.
- No Apps Script trigger is required.

Current repository files:
```text
index.html
style.css
app.js
robots.txt
README.md
```

## Current links sheet
Sheet name: `links`

Columns:
```text
active | pin | category | name | url | description | order
```

`order` controls link order within a category. Smaller values appear first.

## Requested implementation

### 1. Reduce main title size
Use approximately:
```css
font-size: clamp(1.5rem, 3vw, 2.2rem);
```
Also reduce excessive header spacing.

### 2. Add category collapse controls
- Open: `▼ AI  4件`
- Closed: `▶ AI  4件`
- Clicking the triangle or category heading toggles the grid.
- Use semantic buttons.
- Set `aria-expanded` and `aria-controls`.
- Keyboard operation must work.
- Avoid heavy animation.
- Respect `prefers-reduced-motion`.

### 3. Add categories sheet support
Sheet name: `categories`

Columns:
```text
active | category | display_name | initial_state | order
```

Example:
```csv
active,category,display_name,initial_state,order
TRUE,一時保存,一時保存,open,10
TRUE,業務,業務,open,20
TRUE,AI,AI,open,30
TRUE,Google,Google,hide,40
TRUE,開発,開発,hide,50
```

### 4. Update GAS JSON response
Expected format:
```json
{
  "updatedAt": "2026-07-16T10:00:00+09:00",
  "categories": [
    {
      "category": "AI",
      "displayName": "AI",
      "initialState": "open",
      "order": 30
    }
  ],
  "links": [
    {
      "active": true,
      "pin": false,
      "category": "AI",
      "name": "ChatGPT",
      "url": "https://chatgpt.com/",
      "description": "メインAI",
      "order": 10
    }
  ]
}
```

GAS requirements:
- Read `links` and `categories`.
- Return only active categories.
- Accept only `open` and `hide`; otherwise default to `open`.
- Sort categories by category `order`.
- Continue returning valid links for unconfigured categories.
- Improve error reporting where practical.

### 5. Fallback categories
When a link category is missing from `categories`:
- keep the link visible
- use the original category name
- default to `open`
- place after configured categories
- use fallback order `9999`

### 6. Pinned section
- remains at the top
- is not duplicated in normal categories
- remains open by default
- is not managed through `categories`

### 7. State handling
- Do not use `localStorage`.
- Initial render uses `categories.initial_state`.
- User toggles remain during the current page session.
- Reload restores spreadsheet defaults.

### 8. Expected files
Modify:
```text
index.html
style.css
app.js
README.md
```

Create/update:
```text
Code.gs
categories_sample.csv
```

### 9. Completion criteria
1. Main heading is smaller.
2. Every category has a triangle toggle.
3. Categories can be opened and closed.
4. `open` starts visible.
5. `hide` starts collapsed.
6. Category order follows `categories.order`.
7. Link order follows `links.order`.
8. Unconfigured categories appear last.
9. Pinned links appear only in the pinned section.
10. Desktop and mobile layouts work.
11. No browser console errors.
12. README is updated.
13. GAS redeployment instructions are included.

## Work instructions
Inspect all current files before editing. Implement changes directly, validate them, and report:
- files changed
- validation performed
- manual Google Sheets/GAS steps

Do not commit or push unless explicitly instructed.
