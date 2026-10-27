function validateStrongPassword(password) {
  if (typeof password !== 'string'
    || password.length < 8
    || !/[a-z]/.test(password)
    || !/[A-Z]/.test(password)
    || !/\d/.test(password)
    || !/[^A-Za-z0-9]/.test(password)) {
    throw Object.assign(
      new Error('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'),
      { statusCode: 400 }
    );
  }
}

module.exports = { validateStrongPassword };
