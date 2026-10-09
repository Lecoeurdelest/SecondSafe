const nodemailer = require('nodemailer');
const business = require('../../config/business');

const EMAIL_FAILURE = 'Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.';
const deliveryError = () => Object.assign(new Error(EMAIL_FAILURE), { statusCode: 503, expose: true });
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function smtpOptions(env, timeoutMs) {
  const auth = { user: env.SMTP_USER || env.EMAIL_USER, pass: env.SMTP_PASS || env.EMAIL_PASS };
  const timeouts = { connectionTimeout: timeoutMs, greetingTimeout: timeoutMs, socketTimeout: timeoutMs };
  if (!auth.user || !auth.pass) throw deliveryError();
  if (!env.SMTP_HOST) return { service: 'gmail', auth, ...timeouts };
  const port = Number(env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw deliveryError();
  return { host: env.SMTP_HOST, port, secure: env.SMTP_SECURE === 'true', auth, ...timeouts };
}

function createMailer({ env = process.env, transport, timeoutMs = 10000 } = {}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new TypeError('SMTP timeout must be positive');
  let sender = transport;

  async function sendCode(to, code, { subject, title, description, lifetimeMs }) {
    if (typeof to !== 'string' || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)) {
      throw Object.assign(new Error('Địa chỉ email không hợp lệ'), { statusCode: 400 });
    }
    let timer;
    try {
      sender ||= nodemailer.createTransport(smtpOptions(env, timeoutMs));
      const mail = {
        from: { name: 'SecondSafe', address: env.SMTP_USER || env.EMAIL_USER }, to, subject,
        text: `${title}\n${description}\n${code}\nHiệu lực: ${Math.ceil(lifetimeMs / 60000)} phút. Không chia sẻ mã này với bất kỳ ai.`,
        html: `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><p><strong>${escapeHtml(code)}</strong></p><p>Hiệu lực: ${Math.ceil(lifetimeMs / 60000)} phút. Không chia sẻ mã này với bất kỳ ai.</p>`
      };
      const deadline = new Promise((resolve, reject) => { timer = setTimeout(() => reject(deliveryError()), timeoutMs); });
      const result = await Promise.race([sender.sendMail(mail), deadline]);
      if (result?.rejected?.length) throw deliveryError();
      return { delivered: true };
    } catch {
      throw deliveryError();
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    sendRegisterOtpEmail: (to, code) => sendCode(to, code, { subject: 'Mã xác thực đăng ký tài khoản', title: 'Xác thực tài khoản', description: 'Sử dụng mã dưới đây để hoàn tất đăng ký SecondSafe.', lifetimeMs: business.otpTtlMs }),
    sendLogin2faOtpEmail: (to, code) => sendCode(to, code, { subject: 'Mã xác thực đăng nhập 2FA', title: 'Xác thực đăng nhập', description: 'Sử dụng mã dưới đây để hoàn tất đăng nhập SecondSafe.', lifetimeMs: business.otpTtlMs }),
    sendRecoveryEmail: (to, code) => sendCode(to, code, { subject: 'Khôi phục mật khẩu SecondSafe', title: 'Khôi phục mật khẩu', description: 'Sử dụng mã khôi phục dưới đây để đặt mật khẩu mới.', lifetimeMs: business.resetCredentialTtlMs })
  };
}

module.exports = { ...createMailer(), createMailer };
