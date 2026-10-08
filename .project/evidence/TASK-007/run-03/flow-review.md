# Bounded flow review

Reviewed the actual source together with `ast-flow.json` and the original 86-test output.

- AC-NOTI-04-1: all three exported mail functions delegate to `sendCode`; sender credentials select explicit SMTP or the legacy Gmail account. Recipient validation precedes transport creation; templates escape interpolated HTML. Transport failures and rejected recipients produce an exposed, fixed Vietnamese 503 error. The Express test confirms the HTTP response excludes provider details. The local SMTP fixture exercises actual Nodemailer authentication, envelope and message delivery. Authentication endpoint wiring remains TASK-011/012/015, and real provider delivery needs deployment credentials.
- AC-NFR-SEC-05-2: `issue` uses crypto randomness and stores a salted digest. `consume` performs expiry, comparison and attempt updates inside one atomic `store.update` callback. Successful consumption and the fifth failed attempt return no record, causing deletion. The concurrent-consumption test produces one success. Expiry is inclusive at the deadline.
- AC-NFR-REL-04-1: the manager depends only on the asynchronous `update(key, updater)` interface. Its default memory adapter clones records, bounds capacity and reclaims expired entries under pressure. A production shared adapter must preserve single-key atomicity; selection is deferred to D-108. Rate-counter use of this interface remains TASK-008, so this cross-task criterion is not fully accepted here.
- AC-NFR-INT-01-1: connection/greeting/socket timeouts and a whole-operation deadline bound SMTP calls. Every exception crosses the fixed `deliveryError` boundary and the timer is cleared in `finally`.

ESLint with SonarJS checks cyclomatic complexity <=10, cognitive complexity <=15 and nesting <=3 for the changed runtime functions. This AST inventory and manual review are bounded evidence, not a calibrated evaluator or proof of provider availability. The automatic gate remains inconclusive.

Revalidation: createCodeManager now passes the same injected clock to its default memory adapter. The original failed reproduction is retained in before-fix.txt, followed by the successful reproduction in after-fix.txt. Constructor purpose guards require a string before regex validation; regression tests cover null/object namespaces. No rate-counter implementation or live SMTP claim is added by this fix.
