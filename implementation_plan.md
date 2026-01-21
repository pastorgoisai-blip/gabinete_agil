# Implementation Plan - Rich Text Editor (TDD)

## Goal
Implement a robust Rich Text Editor using TDD, replacing the current basic implementation and enabling editing of existing documents.

## Proposed Changes

### 1. New Component: `RichTextEditor.tsx`
- **Location**: `components/RichTextEditor.tsx`
- **Features**:
  - Tiptap Toolbar (Bold, Italic, Underline, Alignments, Bullet List, Ordered List).
  - A4 Page Styling (Centering, Shadow, Dimensions).
  - Controlled component (value, onChange).

### 2. Integration: `LegislativeEditor.tsx`
- **Refactor**: Replace the internal editor setup with `<RichTextEditor />`.
- **Props**: Pass `content` and `onChange` to `RichTextEditor`.

### 3. Page: `Legislative.tsx`
- **Edit Mode**:
  - Update `openEdit` to set `selectedOffice` and switch to "Novo Documento" (Editor) tab.
- **Save Logic**:
  - Ensure `content_html` gets the HTML.
  - Extract text content for `subject` or `search_text` (if schema allows, otherwise just HTML). *Note: User asked to save plain text to `subject` or `search_text`. I will verify if `subject` is appropriate or if I should just keep it as is for now.*

## Verification Plan

### Automated Tests (TDD)
- `npm test` should pass for `RichTextEditor.test.tsx`.
- Tests will cover: rendering, toolbar presence, buttons interactions (mocked/checked via class names).

### Manual Verification
1.  **New Document**: Select Template -> Verify Editor loads with content.
2.  **Edit**: Edit text, use Bold/Italic/Underline/Lists.
3.  **Save**: Verify data persists.
4.  **Edit Existing**: Click "Edit" on a list item -> Verify it opens in the editor with data loaded.
