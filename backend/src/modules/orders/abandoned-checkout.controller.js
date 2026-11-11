const service = require('./abandoned-checkout.service');
const { sendSuccess } = require('../../common/utils/response.util');

function handle(action) {
  return async (req, res, next) => {
    try {
      return await action(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
}

const listMine = handle(async (req, res) => sendSuccess(res, 200, await service.listForBuyer(req.user.userId)));

const dismiss = handle(async (req, res) => sendSuccess(
  res, 200, await service.dismiss(req.user.userId, req.params.id), 'Đã ẩn thanh toán dang dở'
));

const getSummary = handle(async (req, res) => sendSuccess(res, 200, await service.getSummary(req.query)));

const listAll = handle(async (req, res) => sendSuccess(res, 200, await service.listForStaff(req.query)));

module.exports = { listMine, dismiss, getSummary, listAll };
