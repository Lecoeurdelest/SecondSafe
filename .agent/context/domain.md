# Domain glossary

| Term | Meaning |
|---|---|
| Listing | A `Product` document offered for sale by a seller |
| Reserved listing | Listing with status `pending` while an order is open (INV-02) |
| Purchase request | Buyer-initiated request or seller-initiated offer (`initiatedBy`) with an agreed price |
| Quick buy | Immediate order at the listed price, awaiting payment |
| Order | Agreement between buyer and seller; status machine in `docs/technical/order-lifecycle.md` |
| Escrow hold | Money taken from the buyer at payment and held until release (seller) or refund (buyer) |
| Platform fee | Share of the agreed amount deducted from the seller payout (default 5%) |
| Wallet | Per-user balance; every change is a `Transaction` with balance before and after |
| Top-up | Deposit into the wallet through SePay (or VNPay, D-102) |
| Withdrawal | Request to transfer wallet money to a bank account; approved by the role chosen in D-105 |
| Suspension | Account lock (`isSuspended`) that blocks every authenticated request until it ends |
| Selling restriction | Seller-side lock (`isSellingRestricted`) that hides listings and blocks seller actions |
| Sanction ladder | Restrictions of 24 hours, 1 week and 1 year at 3, 6 and 9 violations |
| Report | Complaint about a listing or user, resolved by a moderator decision |
| Dispute | Buyer complaint about a shipped or delivered order, settled by refund, release or a partial refund (D-106) |
