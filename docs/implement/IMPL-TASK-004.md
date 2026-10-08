---
task: TASK-004
execution_status: done
relevance: current
date: 2026-10-09
author: Lecoeurdelest
---

# IMPL-TASK-004 — Business configuration

Added one immutable configuration module for fee/top-up/withdrawal rules, OTP/payment/shipping/completion/listing/reset/JWT lifetimes and restriction defaults. Environment overrides are checked before startup, use documented units, reject unsafe integers and reversed top-up bounds, and never echo rejected values. JWT configuration consumes the central lifetime. All original defaults remain, including the three-minute payment window while D-104 is proposed.

Both criteria pass through the configuration tests and the full 43-test backend suite. Original outputs and the input manifest are in `.project/evidence/TASK-004/run-01/`. Manual configuration completion applies; no domain-confidence score or money-changing behavior is claimed.

Existing orders code still contains baseline constants and must consume this configuration when its own tasks rebuild the domain flows. Other services are stubs. Sanction thresholds retain baseline values; adjustable money/timing/restriction settings are listed in `.env.example`. No schemas or account policies changed. INV-08 is retained through safe integer validation for amounts.

Changed files: `backend/src/config/business.js`, `backend/src/config/env.js`, `backend/.env.example`, `backend/tests/business-config.test.js`, execution/delivery records, evidence and generated views. No dependency was added.
