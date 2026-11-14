jest.mock('sepay-pg-node', () => ({ SePayPgClient: jest.fn() }));
jest.mock('../src/modules/payments/transaction.model', () => ({ findById: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../src/modules/payments/wallet.service', () => ({ incrementBalance: jest.fn(), createTransaction: jest.fn() }));
jest.mock('../src/modules/orders/order.service', () => ({ payOrder: jest.fn() }));

const Transaction = require('../src/modules/payments/transaction.model');
const walletService = require('../src/modules/payments/wallet.service');
const orderService = require('../src/modules/orders/order.service');
const logger = require('../src/common/utils/logger.util');
const sepayService = require('../src/modules/payments/sepay.service');
const sepayController = require('../src/modules/payments/sepay.controller');

const SECRET = 'spsk_live_unit_test_secret_value';
const USER_ID = '507f1f77bcf86cd799439011';
const TX_ID = '507f1f77bcf86cd799439012';
const ORDER_ID = '507f1f77bcf86cd799439013';

function pendingTransaction(overrides = {}) {
  return {
    _id: TX_ID, userId: USER_ID, type: 'deposit', amount: 50000, status: 'pending',
    save: jest.fn().mockResolvedValue(undefined), ...overrides
  };
}

function paidNotification(overrides = {}) {
  return {
    notification_type: 'ORDER_PAID',
    order: { order_invoice_number: TX_ID, order_amount: '50000' },
    transaction: { transaction_id: 'bank-777' },
    ...overrides
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  process.env.SEPAY_SECRET_KEY = SECRET;
  jest.spyOn(logger, 'info').mockImplementation(() => {});
  jest.spyOn(logger, 'warn').mockImplementation(() => {});
  jest.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SePay IPN authentication', () => {
  test('rejects a missing or wrong secret with 401 before touching the database', async () => {
    for (const received of [undefined, '', 'wrong-secret', `${SECRET}x`, SECRET.slice(1)]) {
      const result = await sepayService.handleSePayIPN(paidNotification(), received);
      expect(result).toEqual({ success: false, message: 'Unauthorized', statusCode: 401 });
    }
    expect(Transaction.findById).not.toHaveBeenCalled();
    expect(walletService.incrementBalance).not.toHaveBeenCalled();
  });

  test('rejects every request while no secret is configured', async () => {
    delete process.env.SEPAY_SECRET_KEY;
    const result = await sepayService.handleSePayIPN(paidNotification(), '');
    expect(result.statusCode).toBe(401);
  });

  test('ignores notifications that are not ORDER_PAID', async () => {
    const result = await sepayService.handleSePayIPN({ notification_type: 'TRANSACTION_VOID' }, SECRET);
    expect(result).toEqual({ success: true, message: 'Event ignored' });
    expect(Transaction.findById).not.toHaveBeenCalled();
  });
});

describe('SePay IPN crediting', () => {
  test('credits a deposit once and completes the transaction', async () => {
    const tx = pendingTransaction();
    Transaction.findById.mockResolvedValue(tx);
    Transaction.findOneAndUpdate.mockResolvedValue(tx);

    const result = await sepayService.handleSePayIPN(paidNotification(), SECRET);

    expect(result).toEqual({ success: true, message: 'Payment processed' });
    expect(walletService.incrementBalance).toHaveBeenCalledTimes(1);
    expect(walletService.incrementBalance).toHaveBeenCalledWith(
      USER_ID, 50000, 'deposit', expect.stringContaining('bank-777'), { transactionId: TX_ID }
    );
    expect(tx.status).toBe('completed');
    expect(tx.save).toHaveBeenCalled();
  });

  test('claims the transaction atomically, allowing only unclaimed or stale pending ones', async () => {
    const tx = pendingTransaction();
    Transaction.findById.mockResolvedValue(tx);
    Transaction.findOneAndUpdate.mockResolvedValue(tx);

    await sepayService.handleSePayIPN(paidNotification(), SECRET);

    const [filter, update, options] = Transaction.findOneAndUpdate.mock.calls[0];
    expect(filter._id).toBe(TX_ID);
    expect(filter.status).toBe('pending');
    expect(filter.$or).toEqual([
      { 'metadata.ipnClaimedAt': { $exists: false } },
      { 'metadata.ipnClaimedAt': { $lt: expect.any(Date) } }
    ]);
    expect(update.$set['metadata.ipnClaimedAt']).toBeInstanceOf(Date);
    expect(options).toEqual({ new: true });
  });

  test('two deliveries of the same notification credit the wallet only once', async () => {
    const tx = pendingTransaction();
    Transaction.findById.mockResolvedValue(tx);
    Transaction.findOneAndUpdate.mockResolvedValueOnce(tx).mockResolvedValueOnce(null);

    const results = await Promise.all([
      sepayService.handleSePayIPN(paidNotification(), SECRET),
      sepayService.handleSePayIPN(paidNotification(), SECRET)
    ]);

    expect(walletService.incrementBalance).toHaveBeenCalledTimes(1);
    expect(results.filter(result => result.message === 'Payment processed')).toHaveLength(1);
    const other = results.find(result => result.message !== 'Payment processed');
    expect(other.success).toBe(true);
    expect(['Already processed', 'Already being processed']).toContain(other.message);
  });

  test('a repeated notification for an already failed transaction never credits again', async () => {
    const failed = pendingTransaction({ status: 'failed' });
    Transaction.findById.mockResolvedValue(failed);
    Transaction.findOneAndUpdate.mockResolvedValue(null);

    const result = await sepayService.handleSePayIPN(paidNotification(), SECRET);

    expect(result).toEqual({ success: false, message: 'Transaction is not payable' });
    expect(walletService.incrementBalance).not.toHaveBeenCalled();
  });

  test('a transaction that is already completed is acknowledged without a claim', async () => {
    Transaction.findById.mockResolvedValue(pendingTransaction({ status: 'completed' }));

    const result = await sepayService.handleSePayIPN(paidNotification(), SECRET);

    expect(result).toEqual({ success: true, message: 'Already processed' });
    expect(Transaction.findOneAndUpdate).not.toHaveBeenCalled();
    expect(walletService.incrementBalance).not.toHaveBeenCalled();
  });

  test('an amount that differs from the pending transaction fails it without crediting', async () => {
    const tx = pendingTransaction();
    Transaction.findById.mockResolvedValue(tx);

    const result = await sepayService.handleSePayIPN(
      paidNotification({ order: { order_invoice_number: TX_ID, order_amount: '1000' } }), SECRET
    );

    expect(result).toEqual({ success: false, message: 'Amount mismatch' });
    expect(tx.status).toBe('failed');
    expect(Transaction.findOneAndUpdate).not.toHaveBeenCalled();
    expect(walletService.incrementBalance).not.toHaveBeenCalled();
  });

  test('an order payment credits the wallet and then pays the order', async () => {
    const tx = pendingTransaction({ type: 'payment', orderId: ORDER_ID });
    Transaction.findById.mockResolvedValue(tx);
    Transaction.findOneAndUpdate.mockResolvedValue(tx);

    const result = await sepayService.handleSePayIPN(paidNotification(), SECRET);

    expect(result.success).toBe(true);
    expect(walletService.incrementBalance).toHaveBeenCalledWith(USER_ID, 50000, 'deposit', expect.any(String));
    expect(orderService.payOrder).toHaveBeenCalledWith(ORDER_ID, USER_ID);
    expect(tx.status).toBe('completed');
  });

  test('a failure while paying the order marks the transaction failed instead of throwing', async () => {
    const tx = pendingTransaction({ type: 'payment', orderId: ORDER_ID });
    Transaction.findById.mockResolvedValue(tx);
    Transaction.findOneAndUpdate.mockResolvedValue(tx);
    orderService.payOrder.mockRejectedValue(new Error('Đơn hàng không ở trạng thái chờ thanh toán'));

    const result = await sepayService.handleSePayIPN(paidNotification(), SECRET);

    expect(result).toEqual({ success: false, message: 'Error processing payment' });
    expect(tx.status).toBe('failed');
    expect(tx.failureReason).toContain('chờ thanh toán');
  });
});

describe('SePay IPN controller', () => {
  function response() {
    const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
    return res;
  }

  function loggedText() {
    const spies = [logger.info, logger.warn, logger.error, console.log, console.warn, console.error];
    return JSON.stringify(spies.flatMap(spy => (spy.mock ? spy.mock.calls : [])));
  }

  test('answers 401 for a wrong secret and 200 for a valid notification', async () => {
    const bad = response();
    await sepayController.handleSePayIPN({ headers: { 'x-secret-key': 'nope' }, body: paidNotification() }, bad);
    expect(bad.status).toHaveBeenCalledWith(401);

    const ignored = response();
    await sepayController.handleSePayIPN(
      { headers: { 'x-secret-key': SECRET }, body: { notification_type: 'OTHER' } }, ignored
    );
    expect(ignored.status).toHaveBeenCalledWith(200);
  });

  test('does not accept the secret from the query string', async () => {
    const res = response();
    await sepayController.handleSePayIPN({ headers: {}, query: { secret_key: SECRET }, body: paidNotification() }, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('never writes the secret key or the request headers to the logs', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const tx = pendingTransaction();
    Transaction.findById.mockResolvedValue(tx);
    Transaction.findOneAndUpdate.mockResolvedValue(tx);

    await sepayController.handleSePayIPN({ headers: { 'x-secret-key': SECRET, cookie: 'sid=abc' }, body: paidNotification() }, response());
    await sepayController.handleSePayIPN({ headers: { 'x-secret-key': 'wrong' }, body: paidNotification() }, response());

    const text = loggedText();
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain('spsk_');
    expect(text).not.toContain('sid=abc');
  });
});
