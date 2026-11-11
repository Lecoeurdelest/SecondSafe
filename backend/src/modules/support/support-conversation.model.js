const mongoose = require('mongoose');

const supportConversationSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true
  },
  lastMessage: {
    type: String,
    maxlength: 4000
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  customerUnreadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  staffUnreadCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

supportConversationSchema.index({ status: 1, lastMessageAt: -1 });
supportConversationSchema.index({ customerId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('SupportConversation', supportConversationSchema);
