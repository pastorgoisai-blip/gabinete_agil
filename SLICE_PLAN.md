# Feature: Exportação para Word (.docx)

## DB Schema
N/A - Client-side only feature.

## API Endpoint
N/A - Client-side only feature.

## UI Component
**Component:** `RichTextEditor.tsx`

**Dependencies:**
- `html-docx-js-typescript`
- `file-saver`
- `@types/file-saver`

**Implementation Details:**
- Add "Baixar .DOCX" button to Toolbar.
- Logic:
    - Construct a full HTML string with `<html>`, `<head>`, `<body>`.
    - Inject `header_url` and `footer_url` as `<img>` tags if available.
    - Inject `editor.getHTML()` content.
    - Convert to Blob using `html-docx-js-typescript`.
    - Save using `file-saver`.
    - Ensure basic A4 styling (margins) in the generated HTML.
