---
version: alpha
name: Solfeasy
description: A quiet charcoal music studio with readable notation and a real playable keyboard.
colors:
  background: '#101214'
  panel: '#1a1c1f'
  raised: '#23262a'
  border: '#303338'
  text: '#f5f5f6'
  muted: '#a6a8af'
  primary: '#ff8b77'
  paper: '#f6f3ed'
  success: '#9bd7b5'
typography:
  sans:
    fontFamily: 'Inter Variable, Inter, Segoe UI, sans-serif'
  mono:
    fontFamily: 'ui-monospace, monospace'
  editorial:
    fontFamily: 'Georgia, serif'
rounded:
  panel: '20px'
  control: '10px'
spacing:
  page-max: '1240px'
  page-gutter: '48px'
  mobile-gutter: '16px'
components:
  button:
    minHeight: '44px'
  sidebar:
    width: '216px'
---

# Solfeasy design

## Intent and reference

English-first music learning for beginners on desktop and phone. The seven-page brief supplied on 2026-09-07 is the product authority. MusicGPT (https://musicgpt.com/, inspected live) supplies the charcoal studio, quiet side rail, rounded controls and colorful music surfaces. This is a learning tool, with a playable score and keyboard as the signature, rather than a prompt generator.

## Runtime tokens

Canonical tokens live in `src/styles/solfeasy.css`, scoped to `.sf-app`. All new shared tools use these variables. Inter Variable is the body/display font, with Georgia only in editorial pull quotes and a monospace face for note labels and timers.

| Token        | Value   | Role                             |
| ------------ | ------- | -------------------------------- |
| --sf-bg      | #101214 | Studio background                |
| --sf-panel   | #1a1c1f | Tool surface                     |
| --sf-raised  | #23262a | Controls                         |
| --sf-line    | #303338 | Borders                          |
| --sf-text    | #f5f5f6 | Main text                        |
| --sf-muted   | #a6a8af | Supporting text                  |
| --sf-accent  | #ff8b77 | Active notes and primary actions |
| --sf-paper   | #f6f3ed | Readable music staff             |
| --sf-success | #9bd7b5 | Correct answers                  |

## Layout and interaction

216px fixed sidebar on desktop, slim top navigation on phones. Main content maximum 1140px. Headings 40px desktop / 30px phone, body 15px, editorial 17px. Rounded panels 20px, controls 10px, pills fully rounded. Music tool is above editorial content. No advertisements or subscription actions inside the first-screen tool area. Ads can only render in explicit editorial slots. Subscription links live alongside results. Lessons and pricing have no ads.

## Canonical UI map

| Capability     | Canonical owner                          | Source of truth          | Allowed variants                                | Verification                   |
| -------------- | ---------------------------------------- | ------------------------ | ----------------------------------------------- | ------------------------------ |
| Select/Listbox | src/components/solfeasy/chord-finder.tsx | DESIGN.md                | native root/type selects                        | Browser keyboard and open menu |
| Scrollbar      | src/styles/solfeasy.css                  | DESIGN.md runtime tokens | Native geometry, thin music keyboard overflow   | Browser narrow viewport        |
| Toast          | src/components/ui/sonner.tsx             | Existing root Toaster    | Account notices; practice uses inline aria-live | Browser feedback               |

Navigation: `src/components/solfeasy/shell.tsx` and existing locale-aware Link.
Select/Listbox: native select for root/type when OS-owned popup is acceptable; always labeled.
Form: existing TanStack Form and field primitives for account forms.
Feedback: inline aria-live results for practice, existing Sonner for account/payment actions.
Music: shared MusicStaff and PianoKeyboard; no screen-local keyboard copies.
Scrollbar: stylesheet, native geometry with subtle thumb. Keyboard focus: visible coral ring.
Motion: 160ms color/opacity transitions; no autoplay sound; reduced motion disables optional movement.

## Verification

Build and TypeScript, server tests for quota/trial invariants, browser checks of note answers, chord inversion/audio controls, CTA flow, all seven URLs and widths 1440/768/390. Dark identity is intentional across all public music routes. Chinese UI copies use the same controls and layout.
