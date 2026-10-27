function storedValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getSession() {
  const token = storedValue('token');
  return {
    token,
    role: token ? storedValue('secondsafe:role') : null
  };
}

export function saveSession(result) {
  if (!result?.token || !result.user?.role) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.');
  }
  try {
    window.localStorage.setItem('token', result.token);
    window.localStorage.setItem('secondsafe:role', result.user.role);
    window.localStorage.setItem('user', JSON.stringify(result.user));
  } catch {
    try {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('secondsafe:role');
      window.localStorage.removeItem('user');
    } catch {
      throw new Error('Không thể lưu phiên đăng nhập trên trình duyệt này.');
    }
    throw new Error('Không thể lưu phiên đăng nhập trên trình duyệt này.');
  }
  window.dispatchEvent(new Event('secondsafe:session-changed'));
}

export function clearSession() {
  let storageError;
  try {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('secondsafe:role');
    window.localStorage.removeItem('user');
  } catch (error) {
    storageError = error;
  }
  window.dispatchEvent(new Event('secondsafe:session-changed'));
  if (storageError) throw new Error('Không thể xóa phiên đăng nhập khỏi trình duyệt này.');
}
