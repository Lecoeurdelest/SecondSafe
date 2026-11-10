const mongoose = require('mongoose');
const { Schema } = mongoose;

const SOURCES = ['order', 'cart'];
// at_risk: the order is still payable and the buyer was reminded.
// open: the checkout was abandoned and can still be recovered.
const STATUSES = ['at_risk', 'open', 'recovered', 'dismissed', 'expired'];

const AbandonedCheckoutSchema = new Schema({
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User' },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  source: { type: String, enum: SOURCES, required: true },
  status: { type: String, enum: STATUSES, required: true, default: 'open' },
  // INV-08: integer VND the buyer would have paid.
  amount: { type: Number, required: true, min: 0, validate: Number.isInteger },
  abandonedAt: { type: Date },
  remindedAt: { type: Date },
  reminderCount: { type: Number, default: 0, min: 0 },
  recoveredAt: { type: Date },
  recoveredOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  expiresAt: { type: Date }
}, { timestamps: true });

AbandonedCheckoutSchema.index({ orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $exists: true } } });
AbandonedCheckoutSchema.index({ buyerId: 1, productId: 1, source: 1, createdAt: -1 });
AbandonedCheckoutSchema.index({ status: 1, expiresAt: 1 });
AbandonedCheckoutSchema.index({ createdAt: -1 });

const AbandonedCheckout = mongoose.model('AbandonedCheckout', AbandonedCheckoutSchema);

module.exports = AbandonedCheckout;
module.exports.SOURCES = SOURCES;
module.exports.STATUSES = STATUSES;
