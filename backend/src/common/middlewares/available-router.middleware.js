const { sendError } = require('../utils/response.util');

function availableRouter(ready, load) {
  let router;
  return (req, res, next) => {
    if (!ready()) return sendError(res, 503, 'Chức năng đang được hoàn thiện, vui lòng thử lại sau');
    try {
      router = router || load();
      return router(req, res, next);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { availableRouter };
