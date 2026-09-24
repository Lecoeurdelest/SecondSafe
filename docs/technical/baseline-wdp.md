# Baseline: WDP (ReFlow)

| Field | Value |
|---|---|
| Source | https://github.com/Trungnc273/WDP |
| Revision | `1cea2b7fc673619f19e9bf76eb745e0e44cc50c1` (2026-04-04) |
| Requirement baseline | Project Tracking workbook `WDP_FR_NFR_Tracking.xlsx` (FR, NFR, Defects), 2026-09-24 |
| Preservation model | `project.yaml` → `preservation` |

## Carried over

| Path | Disposition | Change |
|---|---|---|
| `backend/src/modules/*/*.model.js` (16 schemas) | preserve | none |
| `backend/src/config/db.js`, `env.js` | preserve | none |
| `backend/src/common/utils/chat-crypto.util.js` | preserve | none (needed by the migration script) |
| `backend/migrate-data-consistency.js` | preserve | none |
| `backend/verify-seed-data.js` | preserve | none |
| `backend/src/seeds/*.seed.js` | enhance | Functions no longer call `process.exit` when imported (DEF-23); `productsData` exported for offline validation; the sample seller password comes from `SEED_SELLER_PASSWORD` instead of a hardcoded value |
| `backend/seed-all.js` | enhance | Awaits both seeds and exits once with the right code |
| `backend/create-indexes.js` | enhance | Creates indexes for every model instead of three |
| `backend/create-admin.js` | enhance | Credentials from `ADMIN_*` environment variables, strong-password check, password never printed (DEF-08) |
| Route/controller/service/middleware/utility files | supersede (D-004) | Replaced by empty stubs with the same paths; logic is rebuilt through TASK-003 … TASK-052 |

## Not carried

| Baseline item | Reason |
|---|---|
| `frontend/` | Out of scope (D-002) |
| `src/services/auto-release.service.js` | Dead code (DEF-14); FR-SYS-05 retired |
| `src/modules/payments/payment.controller.js`, `payment.service.js` | Re-export wrappers only |
| `src/config/firebase.js`, `src/config/vnpay.js` | Integration config; returns with TASK-013 and TASK-027 |
| `backend/uploads/evidence/temp/*.mp4` | Test media committed by mistake (DEF-20) |
| Windows port auto-kill in `server.js` | OS-specific runtime code (NFR-COMP-02) |

## Defect handling

| Defect | Summary | Handled by |
|---|---|---|
| DEF-01 | `my-reviews` route shadowed | FR-REV-04 → TASK-036 |
| DEF-02 | `/delivery/all` route shadowed | FR-SHIP-03 → TASK-035 |
| DEF-03 | Delivery API without ownership checks | FR-SHIP-01/02 → TASK-035; NFR-SEC-04 → TASK-049 |
| DEF-04 | Report detail readable by anyone (IDOR) | FR-RPT-03 → TASK-037 |
| DEF-05 | Forgot-password overwrites the password and leaks account existence | FR-AUTH-05/06, NFR-SEC-10 → TASK-014 |
| DEF-06 | No rate limiting | NFR-SEC-05 → TASK-007, TASK-008 |
| DEF-07 | SePay IPN logs the secret; secret accepted in query string | FR-PAY-03, NFR-SEC-06 → TASK-026 |
| DEF-08 | Hardcoded admin credentials | Fixed in TASK-001 (`create-admin.js`) |
| DEF-09 | Inconsistent password policy | NFR-SEC-02 → TASK-001, TASK-011, TASK-014, TASK-044 |
| DEF-10 | Two-factor login never triggers | FR-AUTH-04 → TASK-015 (D-101) |
| DEF-11 | Reset endpoint without a token issuer | FR-AUTH-06 → TASK-014 |
| DEF-12 | `partial_refund` not implemented | FR-MOD-10 → TASK-043 (D-106) |
| DEF-13 | Expired listings hard-deleted | FR-SYS-04 → TASK-047 (D-107) |
| DEF-14 | Auto-release service never started | Not carried; FR-SYS-05 retired |
| DEF-15 | Admin UI locks moderators through the restriction endpoint | FR-ADM-07 → TASK-045 |
| DEF-16 | Quick buy detected from message text | FR-ORD-02 → TASK-030 |
| DEF-17 | Order status `pending` outside the enum | order-lifecycle.md; TASK-030, TASK-041 must not use it |
| DEF-18 | Unescaped regular expressions | NFR-SEC-12 → TASK-020, TASK-044 |
| DEF-19 | Duplicate SePay mounts and CORS setup | Skeleton mounts once; NFR-SEC-11 → TASK-003 |
| DEF-20 | Test media and `.lnk` file committed | Not carried; `.gitignore` excludes uploads |
| DEF-21 | Two withdrawal approval flows | FR-PAY-06 → TASK-029 (D-105) |
| DEF-22 | Moderator ban API without UI | FR-MOD-07 → TASK-040 (API only; frontend out of scope) |
| DEF-23 | `seed-all` stopped after categories because each seed called `process.exit` | Fixed in TASK-001 |

## Known schema-level gaps (kept as-is under D-003)

- `Order.isEligibleForAutoRelease` still uses the retired 10-day shipped rule. Jobs must use the configured auto-completion window instead.
- `Product.moderationStatus` exists but is unused until D-103 is decided.
- `Dispute.resolution` includes `partial_refund` pending D-106.
- `verify-seed-data.js` prints `isVerified`, which is not a schema field.
