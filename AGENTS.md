# AGENTS.md

## Project
- GitHub owner: `Sabik-CE`
- Repository: `custom-hyperlinks`
- Published with GitHub Pages
- Data source: Google Sheets via Google Apps Script Web App
- UI/documentation language: Japanese

## Architecture
```text
Google Sheets
  ↓
Google Apps Script JSON API
  ↓
GitHub Pages
  ↓
index.html / style.css / app.js
```

## Development rules
- Use plain HTML, CSS, and vanilla JavaScript.
- Do not introduce React, Vue, npm, bundlers, or external UI frameworks.
- Keep the implementation lightweight.
- Preserve responsive behavior for desktop and mobile.
- Preserve dark mode support using `prefers-color-scheme`.
- Do not add search unless explicitly requested.
- Do not store secrets, API keys, passwords, tokens, webhook URLs, patient data, or personal data.
- Links must open in a new tab with `rel="noopener noreferrer"`.
- Maintain accessibility attributes for collapsible sections.
- Use Japanese UI labels.

## Google Sheets

### links
Required columns:
```text
active | pin | category | name | url | description | order
```

`links.order` controls link order within the same category. Smaller values appear first. Prefer `10`, `20`, `30`.

### categories
Required columns:
```text
active | category | display_name | initial_state | order
```

- `active`: whether the category is enabled
- `category`: internal key matching `links.category`
- `display_name`: website label
- `initial_state`: `open` or `hide`
- `order`: category display order

## Category behavior
- Every category heading must have a triangle toggle.
- Open state uses a downward triangle.
- Closed state uses a right-facing triangle.
- Clicking the triangle or heading toggles the category.
- Initial state comes from `categories.initial_state`.
- Do not persist state in `localStorage`.
- Reloading restores the Google Sheets initial state.
- Unconfigured categories remain visible, default to `open`, and appear last.
- Pinned links remain in a separate top section and are not duplicated.
- Pinned section remains open by default.

## Validation
- Check JavaScript syntax.
- Check for browser console errors.
- Check desktop and mobile layouts.
- Check open/hidden states.
- Check category and link ordering.
- Confirm fallback categories render.
- Update README when setup or behavior changes.

## Change policy
- Inspect existing files before editing.
- Make minimal, targeted changes.
- Do not replace working functionality unnecessarily.
- Summarize files changed and tests performed.
- Do not commit or push unless explicitly instructed.
