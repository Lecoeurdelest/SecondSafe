const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportConversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderRole: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 6000
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date
}, { timestamps: true });

supportMessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
