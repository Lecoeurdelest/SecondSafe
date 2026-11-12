---
task: TASK-085
execution_status: verifying
relevance: current
date: 2026-11-12
author: Lecoeurdelest
---

# IMPL-TASK-085 — Ant Design listing forms and location selector

## What was built

The listing creation form, the listing edit form and the shared province, district and ward selector are built from Ant Design components. This is the sixth slice of the move to Ant Design, after the icon set (TASK-080), the shell (TASK-081), the authentication pages (TASK-082), the home page (TASK-083) and the product detail, cart and saved listings (TASK-084).

- **Forms**: each field is a `Form.Item` with `validateStatus` and `help` driven by the same `errors` state and the same validation functions as before, so the messages and rules did not change. Fields are `Input` (with `showCount` for the title and a `VND` suffix on the price), `Input.TextArea` and `Select`. The category chips are toggle `Button`s with `aria-pressed` inside a `role="group"`. The submit handler runs through the form's `onFinish`.
- **Creation page extras**: header statistics, a completeness `Progress`, a summary `Card` with a `Descriptions` list, a tips card, and the profile-location notice as an `Alert` with an action button.
- **`ProductImagePicker.jsx`** is new and shared by both forms: photo tiles with a remove button, a dashed "Up ảnh" button that opens the file input (now reachable by keyboard, because the input is opened from a real button), a hint and an error line.
- **`LocationSelector.jsx`** keeps its logic and its `onChange` payloads and renders three searchable, clearable `Select`s inside `Form.Item`s. It is also used by the profile and shipping forms, which therefore get the new look; their own code is unchanged.
- **Messages**: success and failure messages use the Ant Design `message` instead of the browser's `alert`. On the edit form the photo-count and photo-size warnings appear next to the picker.
- **CSS**: `CreateProduct.css` went from 854 to 171 lines and `LocationSelector.css` from 69 to 15. The shared class names `form-section`, `form-actions` and `sidebar-card` were renamed to `product-form-section`, `product-form-actions` and `product-sidebar-card`, because the old names were also defined by other pages' stylesheets.

## Acceptance criteria

- [ ] `AC-WEB-25-5` — inconclusive without a calibrated evaluator; the new `CreateProduct`, `EditProduct` and `LocationSelector` tests and the existing suites pass, and the forms were observed in both themes at 390 and 1280 px, see `.project/evidence/TASK-085/run-01/manual-review.md`

## Evidence

| Kind | Location or result |
|---|---|
| Tests | `.project/evidence/TASK-085/run-01/frontend-test.txt` |
| Static analysis | N/A — the production build runs the CRA lint step with `CI=true` |
| Build/typecheck | `.project/evidence/TASK-085/run-01/frontend-build.txt` |
| Behavioral/manual | `.project/evidence/TASK-085/run-01/manual-review.md` and `screenshots/` |

## Deviations

- Success and failure feedback is a toast (`message`) rather than a blocking `alert`; after a successful creation or edit the page still navigates as before.
- The photo warnings on the edit form are inline text instead of `alert` dialogs, and the creation form's wording is unchanged.
- The selector's selects are searchable and clearable, which the native selects were not.

## Known gaps

- Observed with canned API responses and a canned province list in Chromium; a real upload and save and the real province service were not exercised.
- The profile and shipping forms that embed the selector were not re-observed.
- The my-products page still uses hand-written components until the next task, and the delete and visibility dialogs there still use the old overlay.

## Invariant check

| Invariant | Touched? | How it was preserved or changed |
|---|---|---|
| `INV-01` | no | The price is still validated and sent as before; no money movement is involved |
| `INV-02` | no | Not involved |
| `INV-03` | no | Not involved |
| `INV-04` | no | Not involved |
| `INV-05` | no | Not involved |
| `INV-06` | no | Not involved |
| `INV-07` | no | Not involved |
| `INV-08` | no | Not involved |

## Compatibility and supersession

Dark theme, Phosphor icons, the shell, the authentication pages, the home page and the product pages of TASK-084 are preserved. Field labels, validation messages and the "Đăng tin mới" heading used by the existing tests are unchanged.

## Files changed

- `plan.md`, `project.yaml`, `.project/state.json` and the generated task and requirement views
- `frontend/src/modules/product/` (`CreateProduct.jsx`, `CreateProduct.css`, `EditProduct.jsx`, `ProductImagePicker.jsx` new; `CreateProduct.test.jsx`, `EditProduct.test.jsx` new)
- `frontend/src/components/` (`LocationSelector.jsx`, `LocationSelector.css`, `LocationSelector.test.jsx` new)
