const vietnameseToEnglish = {
  'Trung tâm hỗ trợ': 'Help center', 'Ngôn ngữ': 'Language', 'SecondSafe · Mua đồ đã qua sử dụng, chọn lọc và trao đổi minh bạch': 'SecondSafe · Safe, transparent second-hand marketplace',
  'Trợ lý AI': 'AI assistant', 'Hỗ trợ': 'Support', 'Yêu thích': 'Favorites', 'Giỏ hàng': 'Cart', 'Tin nhắn': 'Messages', 'Dashboard': 'Dashboard', 'Dashboard nhân viên': 'Staff dashboard', 'Đăng xuất': 'Log out',   'Đăng nhập': 'Log in', 'Đăng ký': 'Register', 'Đăng bán': 'Sell an item', 'Đổi mật khẩu': 'Change password',  'Tìm kiếm': 'Search', 'Tìm sản phẩm...': 'Search products...', 'Tỉnh/thành': 'Province/city', 'Lọc theo tỉnh/thành': 'Filter by province/city', 'Danh mục': 'Category', 'Danh mục đa dạng': 'Browse categories', 'KHÁM PHÁ': 'EXPLORE', 'Cập nhật sản phẩm đang bán': 'Latest products for sale',
  'Giá tốt, gần bạn, chốt nhanh!': 'Great prices, near you, fast deals!', 'Tình trạng': 'Condition', 'Mới': 'New', 'Như mới': 'Like new', 'Tốt': 'Good', 'Khá': 'Fair', 'Cũ': 'Poor', 'Sắp xếp': 'Sort', 'Giá: thấp → cao': 'Price: low to high', 'Giá: cao → thấp': 'Price: high to low', 'Tên: A → Z': 'Name: A to Z', 'Tên: Z → A': 'Name: Z to A',
  'Sách': 'Books', 'Quần áo': 'Clothing', 'Đồ điện tử': 'Electronics', 'Đồ gia dụng': 'Home appliances', 'Làm đẹp': 'Beauty', 'Thể thao': 'Sports', 'Đồ chơi': 'Toys', 'Thú cưng': 'Pets',
  'Sản phẩm đang được rao bán': 'Products for sale', 'Không thể tải sản phẩm. Vui lòng thử lại sau.': 'Unable to load products. Please try again.', 'Thử lại': 'Try again', 'Xem thêm': 'View more', 'Đang tải sản phẩm...': 'Loading products...', 'Không tìm thấy sản phẩm nào': 'No products found',
  'Họ và tên': 'Full name', 'Email': 'Email', 'Số điện thoại': 'Phone number', 'Mật khẩu': 'Password', 'Mật khẩu hiện tại': 'Current password', 'Mật khẩu mới': 'New password', 'Hiện': 'Show', 'Ẩn': 'Hide',
  'Tạo tài khoản để bắt đầu mua bán an toàn.': 'Create an account to start buying and selling safely.', 'Gửi mã xác thực': 'Send verification code', 'Đang gửi mã...': 'Sending code...', 'Mã xác thực đã được gửi đến email của bạn.': 'A verification code has been sent to your email.', 'Mã xác thực 6 chữ số': '6-digit verification code', 'Xác nhận đăng ký': 'Confirm registration', 'Đang xác thực...': 'Verifying...', 'Gửi lại mã xác thực': 'Resend verification code', 'Sửa thông tin đăng ký': 'Edit registration information', 'Đã có tài khoản? Đăng nhập': 'Already have an account? Log in',
  'Đăng nhập để mua hàng và quản lý tài khoản SecondSafe.': 'Log in to shop and manage your SecondSafe account.', 'Quên mật khẩu?': 'Forgot password?', 'Tạo tài khoản': 'Create account', 'Đang đăng nhập...': 'Logging in...',
  'Khôi phục mật khẩu': 'Password recovery', 'Nhập email tài khoản để nhận liên kết/mã khôi phục.': 'Enter your account email to receive a recovery link or code.', 'Gửi hướng dẫn khôi phục': 'Send recovery instructions', 'Mã khôi phục': 'Recovery code', 'Đặt lại mật khẩu': 'Reset password', 'Đang cập nhật...': 'Updating...', 'Quay lại đăng nhập': 'Back to log in', 'Đến trang đăng nhập': 'Go to log in',
  'Xác nhận mật khẩu hiện tại trước khi thiết lập mật khẩu mới.': 'Confirm your current password before setting a new password.', 'Vui lòng đăng nhập để đổi mật khẩu.': 'Please log in to change your password.', 'Về trang chủ': 'Back to home',
  'Không tìm thấy trang': 'Page not found', 'Trang bạn đang tìm không tồn tại.': 'The page you are looking for does not exist.', 'Không có quyền truy cập': 'Access denied', 'Tài khoản này không được phép mở dashboard này.': 'This account is not allowed to open this dashboard.',
  'Đang tải...': 'Loading...', 'Chat': 'Chat', 'Liên hệ SecondSafe': 'Contact SecondSafe', 'Đóng cửa sổ hỗ trợ': 'Close support window', 'Hỏi trợ lý AI': 'Ask the AI assistant', 'Gợi ý sản phẩm và câu hỏi thường gặp': 'Product suggestions and frequently asked questions', 'Trò chuyện với nhân viên': 'Chat with support staff', 'Mở cuộc hỗ trợ trong tài khoản': 'Open support in your account', 'Trung tâm trợ giúp': 'Help center'
};

const englishToVietnamese = Object.entries(vietnameseToEnglish).reduce((result, [vietnamese, english]) => {
  result[english] = vietnamese;
  return result;
}, {});

const textStateByNode = new WeakMap();
const attributeStateByElement = new WeakMap();

function translateExactText(text, language) {
  const value = text.trim();
  if (!value) return text;
  const map = language === 'en' ? vietnameseToEnglish : englishToVietnamese;
  const translated = map[value];
  if (!translated) return text;
  return text.replace(value, translated);
}

export function applySystemLanguage(language) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language === 'en' ? 'en' : 'vi';

  function translateNode(node) {
    if (!node) return;
    const current = node.nodeValue;
    let state = textStateByNode.get(node);

    if (!state) {
      state = { source: current, rendered: current, language };
      textStateByNode.set(node, state);
    } else if (current !== state.rendered) {
      state.source = current;
      state.rendered = current;
    }

    const translated = translateExactText(state.source, language);
    state.rendered = translated;
    state.language = language;
    if (current !== translated) node.nodeValue = translated;
  }

  function walk(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateNode(node);

    root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(element => {
      let states = attributeStateByElement.get(element);
      if (!states) {
        states = {};
        attributeStateByElement.set(element, states);
      }
      ['placeholder', 'aria-label', 'title'].forEach(attribute => {
        const current = element.getAttribute(attribute);
        if (!current) return;
        let state = states[attribute];
        if (!state) {
          state = { source: current, rendered: current };
          states[attribute] = state;
        } else if (current !== state.rendered) {
          state.source = current;
          state.rendered = current;
        }
        const translatedAttribute = translateExactText(state.source, language);
        state.rendered = translatedAttribute;
        if (current !== translatedAttribute) element.setAttribute(attribute, translatedAttribute);
      });
    });
  }

  walk(document.body);
}

export function observeSystemLanguage(language) {
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(() => applySystemLanguage(language));
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
