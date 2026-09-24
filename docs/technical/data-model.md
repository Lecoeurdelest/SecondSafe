# Data model

Generated from the Mongoose schemas by `tools/pdd/schema-dump.js` and `tools/pdd/render.py`. The schemas are the accepted database contract (D-003); change them only through an explicit task with a migration note.

| Model | Collection | Schema file | Fields | Indexes |
|---|---|---|---|---|
| [Conversation](#conversation) | `conversations` | `backend/src/modules/chat/conversation.model.js` | 11 | 6 |
| [Message](#message) | `messages` | `backend/src/modules/chat/message.model.js` | 10 | 5 |
| [Delivery](#delivery) | `deliveries` | `backend/src/modules/delivery/delivery.model.js` | 18 | 3 |
| [Notification](#notification) | `notifications` | `backend/src/modules/notifications/notification.model.js` | 15 | 4 |
| [Order](#order) | `orders` | `backend/src/modules/orders/order.model.js` | 29 | 9 |
| [PurchaseRequest](#purchaserequest) | `purchaserequests` | `backend/src/modules/orders/purchase-request.model.js` | 13 | 8 |
| [EscrowHold](#escrowhold) | `escrowholds` | `backend/src/modules/payments/escrow-hold.model.js` | 13 | 3 |
| [Transaction](#transaction) | `transactions` | `backend/src/modules/payments/transaction.model.js` | 22 | 4 |
| [Wallet](#wallet) | `wallets` | `backend/src/modules/payments/wallet.model.js` | 11 | 1 |
| [Category](#category) | `categories` | `backend/src/modules/products/category.model.js` | 8 | 2 |
| [Product](#product) | `products` | `backend/src/modules/products/product.model.js` | 21 | 6 |
| [Dispute](#dispute) | `disputes` | `backend/src/modules/reports/dispute.model.js` | 26 | 4 |
| [Report](#report) | `reports` | `backend/src/modules/reports/report.model.js` | 18 | 6 |
| [Review](#review) | `reviews` | `backend/src/modules/reports/review.model.js` | 19 | 6 |
| [Favorite](#favorite) | `favorites` | `backend/src/modules/users/favorite.model.js` | 4 | 3 |
| [User](#user) | `users` | `backend/src/modules/users/user.model.js` | 29 | 1 |

## Conversation

Collection `conversations` · `backend/src/modules/chat/conversation.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `buyerId` | ObjectId | yes | ref → `User` |
| `sellerId` | ObjectId | yes | ref → `User` |
| `productId` | ObjectId | yes | ref → `Product` |
| `lastMessage` | String |  | maxlength 200 |
| `lastMessageAt` | Date |  |  |
| `buyerUnreadCount` | Number |  | min 0; default `0` |
| `sellerUnreadCount` | Number |  | min 0; default `0` |
| `status` | String |  | enum: `active`, `archived`, `blocked`; default `"active"` |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"buyerId": 1}` | — |
| `{"sellerId": 1}` | — |
| `{"productId": 1}` | — |
| `{"lastMessageAt": 1}` | — |
| `{"buyerId": 1, "sellerId": 1, "productId": 1}` | unique: true |
| `{"lastMessageAt": -1}` | — |

## Message

Collection `messages` · `backend/src/modules/chat/message.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `conversationId` | ObjectId | yes | ref → `Conversation` |
| `senderId` | ObjectId | yes | ref → `User` |
| `content` | String | yes | maxlength 1000 |
| `type` | String |  | enum: `text`, `image`, `system`, `offer`; default `"text"` |
| `metadata` | Mixed |  | default `null` |
| `isRead` | Boolean |  | default `false` |
| `readAt` | Date |  |  |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"conversationId": 1}` | — |
| `{"senderId": 1}` | — |
| `{"isRead": 1}` | — |
| `{"conversationId": 1, "createdAt": -1}` | — |
| `{"conversationId": 1, "isRead": 1}` | — |

## Delivery

Collection `deliveries` · `backend/src/modules/delivery/delivery.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `orderId` | ObjectId | yes | ref → `Order`; unique |
| `provider` | String | yes | enum: `ghn`, `ghtk`, `viettel_post`, `vnpost`, `j&t`, `ninja_van`, `other` |
| `trackingNumber` | String |  |  |
| `status` | String |  | enum: `pending`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `failed`, `returned`; default `"pending"` |
| `estimatedDelivery` | Date |  |  |
| `actualDelivery` | Date |  |  |
| `shippingAddress.recipientName` | String |  |  |
| `shippingAddress.phone` | String |  |  |
| `shippingAddress.address` | String |  |  |
| `shippingAddress.city` | String |  |  |
| `shippingAddress.district` | String |  |  |
| `shippingAddress.ward` | String |  |  |
| `notes` | String |  | maxlength 500 |
| `trackingHistory` | Array<Mixed> |  |  |
| `failureReason` | String |  |  |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"orderId": 1}` | unique: true |
| `{"status": 1, "createdAt": -1}` | — |
| `{"trackingNumber": 1}` | — |

## Notification

Collection `notifications` · `backend/src/modules/notifications/notification.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `recipientId` | ObjectId | yes | ref → `User` |
| `type` | String |  | enum: `order_created`, `order_confirmed`, `order_shipped`, `order_completed`, `payment_success`, `dispute_created`, `review_received`, `report_update`, `dispute_update`, `system`, `security`; default `"order_created"` |
| `orderId` | ObjectId |  | ref → `Order` |
| `productId` | ObjectId |  | ref → `Product` |
| `disputeId` | ObjectId |  | ref → `Report` |
| `reportId` | ObjectId |  | ref → `Report` |
| `reviewId` | ObjectId |  | ref → `Review` |
| `senderId` | ObjectId |  | ref → `User` |
| `title` | String | yes |  |
| `message` | String |  |  |
| `isRead` | Boolean |  | default `false` |
| `readAt` | Date |  |  |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"recipientId": 1}` | — |
| `{"recipientId": 1, "isRead": 1, "createdAt": -1}` | — |
| `{"recipientId": 1, "type": 1}` | — |
| `{"recipientId": 1, "productId": 1, "createdAt": -1}` | — |

## Order

Collection `orders` · `backend/src/modules/orders/order.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `orderCode` | String |  | unique |
| `requestId` | ObjectId |  | ref → `PurchaseRequest` |
| `buyerId` | ObjectId | yes | ref → `User` |
| `sellerId` | ObjectId | yes | ref → `User` |
| `productId` | ObjectId | yes | ref → `Product` |
| `agreedAmount` | Number | yes | min 0 |
| `platformFee` | Number | yes | min 0 |
| `totalToPay` | Number | yes | min 0 |
| `status` | String |  | enum: `awaiting_seller_confirmation`, `awaiting_payment`, `paid`, `shipped`, `delivered`, `completed`, `cancelled`, `disputed`; default `"awaiting_seller_confirmation"` |
| `paymentStatus` | String |  | enum: `unpaid`, `paid`, `refunded`; default `"unpaid"` |
| `confirmedBySeller` | Boolean |  | default `false` |
| `confirmedBySellerAt` | Date |  |  |
| `paidAt` | Date |  |  |
| `shippedAt` | Date |  |  |
| `completedAt` | Date |  |  |
| `cancelledAt` | Date |  |  |
| `deliveredAt` | Date |  |  |
| `paymentDeadline` | Date |  |  |
| `cancellationReason` | String |  |  |
| `trackingNumber` | String |  |  |
| `shippingProvider` | String |  |  |
| `estimatedDelivery` | Date |  |  |
| `shippingRecipientName` | String |  |  |
| `shippingPhone` | String |  |  |
| `shippingAddress` | String |  |  |
| `escrowHoldId` | ObjectId |  | ref → `EscrowHold` |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"orderCode": 1}` | unique: true, sparse: true |
| `{"buyerId": 1}` | — |
| `{"sellerId": 1}` | — |
| `{"buyerId": 1, "status": 1}` | — |
| `{"sellerId": 1, "status": 1}` | — |
| `{"createdAt": -1}` | — |
| `{"status": 1, "shippedAt": 1}` | — |
| `{"status": 1, "deliveredAt": 1}` | — |
| `{"status": 1, "paymentDeadline": 1}` | — |

## PurchaseRequest

Collection `purchaserequests` · `backend/src/modules/orders/purchase-request.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `listingId` | ObjectId | yes | ref → `Product` |
| `buyerId` | ObjectId | yes | ref → `User` |
| `sellerId` | ObjectId | yes | ref → `User` |
| `message` | String | yes | maxlength 500 |
| `agreedPrice` | Number | yes | min 0 |
| `status` | String |  | enum: `pending`, `accepted`, `rejected`; default `"pending"` |
| `initiatedBy` | String |  | enum: `buyer`, `seller`; default `"buyer"` |
| `sellerResponse` | String |  | maxlength 500 |
| `acceptedAt` | Date |  |  |
| `rejectedAt` | Date |  |  |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"listingId": 1}` | — |
| `{"buyerId": 1}` | — |
| `{"sellerId": 1}` | — |
| `{"initiatedBy": 1}` | — |
| `{"sellerId": 1, "status": 1}` | — |
| `{"buyerId": 1, "status": 1}` | — |
| `{"initiatedBy": 1, "status": 1}` | — |
| `{"createdAt": -1}` | — |

## EscrowHold

Collection `escrowholds` · `backend/src/modules/payments/escrow-hold.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `orderId` | ObjectId | yes | ref → `Order`; unique |
| `amount` | Number | yes | min 0 |
| `buyerId` | ObjectId | yes | ref → `User` |
| `sellerId` | ObjectId | yes | ref → `User` |
| `status` | String |  | enum: `held`, `released`, `refunded`; default `"held"` |
| `releasedAt` | Date |  |  |
| `refundedAt` | Date |  |  |
| `releaseReason` | String |  |  |
| `refundReason` | String |  |  |
| `isAutoReleased` | Boolean |  | default `false` |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"orderId": 1}` | unique: true |
| `{"status": 1}` | — |
| `{"createdAt": -1}` | — |

## Transaction

Collection `transactions` · `backend/src/modules/payments/transaction.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `walletId` | ObjectId | yes | ref → `Wallet` |
| `userId` | ObjectId | yes | ref → `User` |
| `type` | String | yes | enum: `deposit`, `withdrawal`, `payment`, `refund`, `earning`, `fee` |
| `amount` | Number | yes | min 0 |
| `status` | String |  | enum: `pending`, `completed`, `failed`, `cancelled`; default `"pending"` |
| `orderId` | ObjectId |  | ref → `Order` |
| `description` | String | yes |  |
| `paymentMethod` | String |  | enum: `bank_transfer`, `vnpay`, `sepay`, `wallet`, `escrow`; default `"wallet"` |
| `vnpayTransactionId` | String |  |  |
| `vnpayTransactionNo` | String |  |  |
| `sepayTransactionId` | String |  |  |
| `bankTransferReceipt` | String |  |  |
| `balanceBefore` | Number | yes |  |
| `balanceAfter` | Number | yes |  |
| `metadata` | Mixed |  |  |
| `completedAt` | Date |  |  |
| `failedAt` | Date |  |  |
| `cancelledAt` | Date |  |  |
| `failureReason` | String |  |  |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"userId": 1, "type": 1}` | — |
| `{"userId": 1, "createdAt": -1}` | — |
| `{"status": 1, "createdAt": -1}` | — |
| `{"vnpayTransactionId": 1}` | — |

## Wallet

Collection `wallets` · `backend/src/modules/payments/wallet.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `userId` | ObjectId | yes | ref → `User`; unique |
| `balance` | Number | yes | min 0; default `0` |
| `totalDeposited` | Number |  | min 0; default `0` |
| `totalWithdrawn` | Number |  | min 0; default `0` |
| `totalSpent` | Number |  | min 0; default `0` |
| `totalEarned` | Number |  | min 0; default `0` |
| `currency` | String |  | default `"VND"` |
| `status` | String |  | enum: `active`, `frozen`, `closed`; default `"active"` |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"userId": 1}` | unique: true |

## Category

Collection `categories` · `backend/src/modules/products/category.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `name` | String | yes | unique |
| `slug` | String | yes | unique |
| `description` | String |  |  |
| `icon` | String |  |  |
| `parentCategory` | ObjectId |  | ref → `Category`; default `null` |
| `isActive` | Boolean |  | default `true` |
| `createdAt` | Date |  |  |
| `_id` | ObjectId |  |  |

| Index | Options |
|---|---|
| `{"name": 1}` | unique: true |
| `{"slug": 1}` | unique: true |

## Product

Collection `products` · `backend/src/modules/products/product.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | String | yes | maxlength 200 |
| `description` | String | yes | maxlength 2000 |
| `price` | Number | yes | min 0 |
| `condition` | String | yes | enum: `new`, `like-new`, `good`, `fair`, `poor` |
| `images` | Array<String> |  |  |
| `category` | ObjectId | yes | ref → `Category` |
| `categories` | Array<ObjectId> |  | ref → `Category` |
| `otherCategory` | String |  | maxlength 100; default `""` |
| `seller` | ObjectId | yes | ref → `User` |
| `location.city` | String |  |  |
| `location.district` | String |  |  |
| `status` | String |  | enum: `pending`, `active`, `sold`, `rejected`, `expired`, `hidden`, `deleted`; default `"active"` |
| `views` | Number |  | default `0` |
| `viewCount` | Number |  | default `0` |
| `isFeatured` | Boolean |  | default `false` |
| `featuredUntil` | Date |  |  |
| `moderationStatus` | String |  | enum: `pending`, `approved`, `rejected`; default `"approved"` |
| `rejectionReason` | String |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |
| `_id` | ObjectId |  |  |

| Index | Options |
|---|---|
| `{"seller": 1}` | — |
| `{"title": "text", "description": "text"}` | — |
| `{"status": 1, "createdAt": -1}` | — |
| `{"category": 1}` | — |
| `{"categories": 1}` | — |
| `{"price": 1}` | — |

## Dispute

Collection `disputes` · `backend/src/modules/reports/dispute.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `orderId` | ObjectId | yes | ref → `Order`; unique |
| `buyerId` | ObjectId | yes | ref → `User` |
| `sellerId` | ObjectId | yes | ref → `User` |
| `productId` | ObjectId | yes | ref → `Product` |
| `reason` | String | yes | enum: `not_as_described`, `damaged`, `not_received`, `counterfeit`, `return_request`, `other` |
| `description` | String | yes | maxlength 1000 |
| `evidenceImages` | Array<String> |  |  |
| `status` | String |  | enum: `pending`, `investigating`, `resolved`; default `"pending"` |
| `resolution` | String |  | enum: `refund`, `release`, `partial_refund` |
| `refundAmount` | Number |  | min 0 |
| `moderatorId` | ObjectId |  | ref → `User` |
| `moderatorNotes` | String |  | maxlength 1000 |
| `disputeConversation` | Array<Mixed> |  |  |
| `moderatorUpdates` | Array<Mixed> |  |  |
| `sellerResponse` | String |  | maxlength 1000 |
| `sellerResponseUpdatedAt` | Date |  |  |
| `sellerEvidenceImages` | Array<String> |  |  |
| `buyerFollowUpNote` | String |  | maxlength 1000 |
| `buyerAdditionalEvidenceImages` | Array<String> |  |  |
| `buyerFollowUpUpdatedAt` | Date |  |  |
| `investigatingAt` | Date |  |  |
| `resolvedAt` | Date |  |  |
| `sellerConfirmedReturnAt` | Date |  |  |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"orderId": 1}` | unique: true |
| `{"status": 1, "createdAt": -1}` | — |
| `{"buyerId": 1, "status": 1}` | — |
| `{"sellerId": 1, "status": 1}` | — |

## Report

Collection `reports` · `backend/src/modules/reports/report.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `reporterId` | ObjectId | yes | ref → `User` |
| `reportedUserId` | ObjectId |  | ref → `User` |
| `productId` | ObjectId |  | ref → `Product` |
| `reportType` | String | yes | enum: `product`, `user` |
| `reason` | String | yes | enum: `counterfeit`, `inappropriate`, `scam`, `spam`, `other` |
| `description` | String | yes | maxlength 1000 |
| `evidenceImages` | Array<String> |  |  |
| `status` | String |  | enum: `pending`, `reviewing`, `resolved`, `dismissed`; default `"pending"` |
| `moderatorId` | ObjectId |  | ref → `User` |
| `moderatorDecision` | String |  | enum: `remove_content`, `warn_user`, `ban_user`, `reply_feedback` |
| `moderatorNotes` | String |  | maxlength 500 |
| `moderatorReply` | String |  | maxlength 500 |
| `moderatorReplyToReportedUser` | String |  | maxlength 500 |
| `reviewedAt` | Date |  |  |
| `resolvedAt` | Date |  |  |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"reporterId": 1}` | — |
| `{"reportedUserId": 1}` | — |
| `{"productId": 1}` | — |
| `{"status": 1, "createdAt": -1}` | — |
| `{"reportType": 1, "status": 1}` | — |
| `{"productId": 1, "status": 1}` | — |

## Review

Collection `reviews` · `backend/src/modules/reports/review.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `orderId` | ObjectId | yes | ref → `Order`; unique |
| `reviewerId` | ObjectId | yes | ref → `User` |
| `reviewedUserId` | ObjectId | yes | ref → `User` |
| `productId` | ObjectId | yes | ref → `Product` |
| `rating` | Number | yes | min 1; max 5 |
| `comment` | String |  | maxlength 500 |
| `evidenceFiles` | Array<String> |  | default `[]` |
| `evidenceImages` | Array<String> |  | default `[]` |
| `status` | String |  | enum: `active`, `hidden`, `reported`; default `"active"` |
| `moderatorAssessment.isReviewed` | Boolean |  | default `false` |
| `moderatorAssessment.isBad` | Boolean |  | default `false` |
| `moderatorAssessment.verdict` | String |  | enum: `good`, `bad`; default `null` |
| `moderatorAssessment.moderatorId` | ObjectId |  | ref → `User` |
| `moderatorAssessment.note` | String |  | maxlength 500 |
| `moderatorAssessment.markedAt` | Date |  |  |
| `moderatorAssessment.penaltyLevel` | Number |  | default `0` |
| `_id` | ObjectId |  |  |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |

| Index | Options |
|---|---|
| `{"orderId": 1}` | unique: true |
| `{"reviewerId": 1}` | — |
| `{"reviewedUserId": 1}` | — |
| `{"reviewedUserId": 1, "status": 1, "createdAt": -1}` | — |
| `{"reviewerId": 1, "createdAt": -1}` | — |
| `{"rating": 1}` | — |

## Favorite

Collection `favorites` · `backend/src/modules/users/favorite.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `user` | ObjectId | yes | ref → `User` |
| `product` | ObjectId | yes | ref → `Product` |
| `createdAt` | Date |  |  |
| `_id` | ObjectId |  |  |

| Index | Options |
|---|---|
| `{"user": 1}` | — |
| `{"product": 1}` | — |
| `{"user": 1, "product": 1}` | unique: true |

## User

Collection `users` · `backend/src/modules/users/user.model.js`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | String | yes |  |
| `password` | String | yes | minlength 6 |
| `fullName` | String | yes |  |
| `phone` | String |  |  |
| `address` | String |  |  |
| `specificAddress` | String |  |  |
| `location.city` | String |  |  |
| `location.district` | String |  |  |
| `location.ward` | String |  |  |
| `location.provinceCode` | Number |  |  |
| `location.districtCode` | Number |  |  |
| `location.wardCode` | Number |  |  |
| `avatar` | String |  | default `"/images/placeholders/avatar-placeholder.svg"` |
| `role` | String |  | enum: `user`, `moderator`, `admin`; default `"user"` |
| `isSuspended` | Boolean |  | default `false` |
| `suspendedUntil` | Date |  |  |
| `suspendedReason` | String |  | maxlength 500 |
| `isSellingRestricted` | Boolean |  | default `false` |
| `sellingRestrictedUntil` | Date |  |  |
| `sellingRestrictedReason` | String |  | maxlength 500 |
| `sellingRestrictionSource` | String |  | maxlength 50 |
| `violationCount` | Number |  | default `0` |
| `modBadReviewCount` | Number |  | default `0` |
| `notifications` | Array<Mixed> |  |  |
| `rating` | Number |  | min 0; max 5; default `0` |
| `totalReviews` | Number |  | min 0; default `0` |
| `createdAt` | Date |  |  |
| `updatedAt` | Date |  |  |
| `_id` | ObjectId |  |  |

| Index | Options |
|---|---|
| `{"email": 1}` | unique: true |
