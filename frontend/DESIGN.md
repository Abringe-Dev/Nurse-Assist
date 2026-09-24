# Design — NurseAssist frontend

<!-- impeccable:design-schema 1 -->

## World

The Handover Sheet: warm clinical paper, ward-ink, ruled SBAR sections, tabbed binder
sidebar, stamp-like provenance stubs. Teal means verified, amber means caution. Built from
direction seed `9a3eda58` (SBAR handover sheet, grounded candidate 4 of 7).

## Palette

Restrained: warm neutrals plus one accent.

| Role      | Token             | Value     | Use                                              |
| --------- | ----------------- | --------- | ------------------------------------------------ |
| Ground    | `--color-paper`   | `#F6F3EA` | App background                                   |
| Sheet     | `--color-sheet`   | `#FFFDF8` | Answer cards, header, sign-in card               |
| Side      | `--color-side`    | `#FBFAF4` | Sidebar                                          |
| Ink       | `--color-ink`     | `#16222E` | Body text, user bubbles, primary buttons         |
| Ink soft  | `--color-ink-soft`| `#46566A` | Secondary text (7.3:1 on paper)                  |
| Ink faint | `--color-ink-faint`| `#5B6B7E`| Microcopy 11px+ (5.3:1 on paper)                 |
| Rule      | `--color-rule`    | `#E3DCC8` | Borders (never box-shadow + border together)     |
| Verified  | `--color-verified`| `#0B6B62` | Fills with paper text (6.4:1); citations, marks  |
| Verified deep | `--color-verified-deep` | `#084F49` | Text on wash; provenance labels              |
| Verified wash | `--color-verified-wash` | `#E2F0ED` | Active rows, chips, selection                 |
| Caution ink/wash | `--color-caution-ink` / `-wash` | `#92400E` / `#FDF3E1` | Safety strip, general banner |
| Danger    | `--color-danger`  | `#B42318` | Errors, destructive confirm, offline badge      |
| Night     | `--color-night`   | `#101C28` | Login narrative panel, primary buttons hover    |

## Typography

Zero webfonts (ward-device load). UI: system stack. Display and quotes: Georgia
(`--font-display`, `.font-display`) — app title, hero headline, login headline. Section
labels: 11px semibold uppercase, 0.14em tracking. Figures and counts: `.tnum`
tabular numerals. Answer measure capped at 72ch, 15px/1.65.

## Components

- Binder sidebar (`App.jsx`): tabbed sections Handover chats (Today/Earlier groups) and
  Protocol library; New handover is an ink button; delete uses two-tap Remove/Keep.
- Status bar: Georgia title plus a segmented state stub (docs on file / empty / offline).
- Handover sheet (`MessageBubble.jsx`): user turns are ink bubbles; assistant turns are
  ruled sheet cards with a Provenance stub (segmented doc·page chips, tabular) that
  expands packet→evidence on tap, plus Copy answer. General answers carry a gapped
  dashed rule over an amber banner (pattern, not hue alone).
- Composer (`ChatWindow.jsx`): sign-off row, ink send button, Enter/Shift+Enter hint.
- Empty hero: display headline plus three real sample prompts that send on tap.
- Login (`pages/Login.jsx`): split screen — night narrative panel (headline, three trust
  rows, sample provenance stub) beside the sign-in card.

## Motion

One authored moment: the streaming caret plus the hold-flash that keeps new evidence
visible until noticed. Typing is a single pulsing dot with status text. All motion
disabled under `prefers-reduced-motion`.

## Browser surfaces

Teal-tinted selection, themed scrollbar (`.sheet-scroll`), visible focus rings,
teal caret, tabular numerals for data. Contrast floors: body 7.3:1, microcopy 5.3:1,
fills 6.4:1.

## Iconography

`components/icons.jsx`: single 1.75px stroke set (plus, send, upload, doc, trash,
shield, alert, check, copy, sign-out, book, chat, search). No emoji or glyph icons.
Favicon is the verified rounded square with sheet-and-check mark.
