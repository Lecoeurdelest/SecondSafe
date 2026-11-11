const supportService = require('./support.service');
const { sendSuccess } = require('../../common/utils/response.util');
const { emitSupportUpdate } = require('../chat/chat.socket');

async function listConversations(req, res, next) {
  try {
    return sendSuccess(res, 200, await supportService.listConversations(req.user.userId, req.user.role, req.query));
  } catch (error) {
    return next(error);
  }
}

async function createConversation(req, res, next) {
  try {
    const result = await supportService.createConversation(req.user.userId, req.user.role, req.body || {});
    emitSupportUpdate(result.conversation, result.message);
    return sendSuccess(res, 201, result);
  } catch (error) {
    return next(error);
  }
}

async function getMessages(req, res, next) {
  try {
    return sendSuccess(res, 200, await supportService.getMessages(
      req.params.id, req.user.userId, req.user.role, req.query
    ));
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const result = await supportService.sendMessage(
      req.params.id, req.user.userId, req.user.role, req.body?.content
    );
    emitSupportUpdate(result.conversation, result.message);
    return sendSuccess(res, 201, result.message);
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const conversation = await supportService.updateStatus(
      req.params.id, req.user.userId, req.user.role, req.body?.status
    );
    emitSupportUpdate(conversation);
    return sendSuccess(res, 200, conversation);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listConversations, createConversation, getMessages, sendMessage, updateStatus };
