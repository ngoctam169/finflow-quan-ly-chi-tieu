export const INITIAL_WALLETS = [
  {
    id: 'w_cash',
    name: 'Tiền mặt',
    type: 'cash',
    balance: 0,
    color: '#d97706',
    icon: 'Wallet',
    account_number: 'Tiền mặt hàng ngày'
  },
  {
    id: 'w_bank',
    name: 'Ngân hàng',
    type: 'bank',
    balance: 0,
    color: '#059669',
    icon: 'Landmark',
    account_number: 'Chuyển khoản / Thẻ ATM'
  },
  {
    id: 'w_saving',
    name: 'Tiết kiệm',
    type: 'saving',
    balance: 0,
    color: '#2563eb',
    icon: 'PiggyBank',
    account_number: 'Tích lũy dài hạn'
  }
];

export const INITIAL_CATEGORIES = [
  // 6 Danh mục Chi tiêu thiết yếu nhất cho cuộc sống hàng ngày (User có thể tự bấm + Thêm mục bất cứ lúc nào)
  {
    id: 'cat_food',
    name: 'Ăn uống',
    type: 'expense',
    icon: 'Utensils',
    color: '#f97316',
    group_rule: 'needs',
    keywords: ['ăn', 'cơm', 'phở', 'bún', 'mì', 'bánh', 'trưa', 'tối', 'sáng', 'cà phê', 'cafe', 'trà sữa', 'quán']
  },
  {
    id: 'cat_grocery',
    name: 'Đi chợ',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#10b981',
    group_rule: 'needs',
    keywords: ['đi chợ', 'chợ', 'siêu thị', 'winmart', 'bachhoaxanh', 'coopmart', 'rau', 'thịt', 'cá', 'trái cây', 'sữa', 'nấu ăn', 'thực phẩm']
  },
  {
    id: 'cat_transport',
    name: 'Di chuyển',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6',
    group_rule: 'needs',
    keywords: ['xăng', 'đổ xăng', 'grab', 'be', 'xanh sm', 'taxi', 'gửi xe', 'vé xe', 'bảo dưỡng', 'rửa xe', 'thay nhớt', 'sửa xe']
  },
  {
    id: 'cat_housing',
    name: 'Hóa đơn',
    type: 'expense',
    icon: 'Home',
    color: '#6366f1',
    group_rule: 'needs',
    keywords: ['thuê nhà', 'tiền nhà', 'tiền trọ', 'điện', 'nước', 'internet', 'wifi', 'fpt', 'viettel', 'rác', 'phí quản lý', 'điện thoại', '4g', '5g', 'nạp thẻ']
  },
  {
    id: 'cat_shopping',
    name: 'Mua sắm',
    type: 'expense',
    icon: 'CreditCard',
    color: '#ec4899',
    group_rule: 'wants',
    keywords: ['shopee', 'lazada', 'tiktok', 'mua', 'áo', 'quần', 'giày', 'mỹ phẩm', 'skincare', 'cắt tóc', 'gội đầu', 'đồ gia dụng', 'quần áo']
  },
  {
    id: 'cat_health',
    name: 'Sức khỏe',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#ef4444',
    group_rule: 'needs',
    keywords: ['thuốc', 'khám', 'bệnh viện', 'gym', 'yoga', 'chạy bộ', 'cầu lông', 'bơi', 'vitamin', 'nha khoa', 'bảo hiểm']
  },
  // 2 Danh mục Thu nhập thiết yếu
  {
    id: 'cat_salary',
    name: 'Tiền lương',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981',
    group_rule: 'income',
    keywords: ['lương', 'salary', 'thu nhập chính', 'công ty']
  },
  {
    id: 'cat_bonus',
    name: 'Thu khác',
    type: 'income',
    icon: 'Sparkles',
    color: '#f59e0b',
    group_rule: 'income',
    keywords: ['thưởng', 'bonus', 'làm thêm', 'freelance', 'được tặng', 'lì xì', 'thu khác']
  }
];

// Khởi đầu hoàn toàn trống (0 giao dịch, 0 định mức, 0 hũ mẫu) để người dùng tự nhập
export const INITIAL_BUDGETS = [];
export const INITIAL_GOALS = [];
export const INITIAL_RECURRING = [];
export const INITIAL_TRANSACTIONS = [];

// Gợi ý thông minh cho cuộc sống hàng ngày (chỉ điền sẵn tên gợi ý, người dùng tự gõ số tiền thực tế)
export const QUICK_TEMPLATES = [
  { label: '🍜 Ăn uống', draftText: 'Ăn trưa ', category_id: 'cat_food', wallet_id: 'w_cash', type: 'expense', placeholderHint: 'Gõ số tiền (VD: 45k)' },
  { label: '🛒 Đi chợ', draftText: 'Đi chợ ', category_id: 'cat_grocery', wallet_id: 'w_cash', type: 'expense', placeholderHint: 'Gõ số tiền (VD: 150k)' },
  { label: '⛽ Đổ xăng', draftText: 'Đổ xăng ', category_id: 'cat_transport', wallet_id: 'w_cash', type: 'expense', placeholderHint: 'Gõ số tiền (VD: 70k)' },
  { label: '🏠 Hóa đơn', draftText: 'Thanh toán hóa đơn ', category_id: 'cat_housing', wallet_id: 'w_bank', type: 'expense', placeholderHint: 'Gõ số tiền (VD: 500k)' },
  { label: '💼 Nhận lương', draftText: 'Lương tháng ', category_id: 'cat_salary', wallet_id: 'w_bank', type: 'income', placeholderHint: 'Gõ số tiền (VD: 15tr)' }
];

export const RECURRING_SUGGESTIONS = [
  {
    title: 'Tiền thuê nhà / Phòng trọ',
    category_id: 'cat_housing',
    wallet_id: 'w_bank',
    due_day: 1,
    suggestedAmounts: ['3000000', '4500000', '6000000']
  },
  {
    title: 'Hóa đơn Tiền Điện sinh hoạt',
    category_id: 'cat_housing',
    wallet_id: 'w_bank',
    due_day: 10,
    suggestedAmounts: ['300000', '600000', '1000000']
  },
  {
    title: 'Hóa đơn Tiền Nước sinh hoạt',
    category_id: 'cat_housing',
    wallet_id: 'w_momo',
    due_day: 12,
    suggestedAmounts: ['100000', '150000', '250000']
  },
  {
    title: 'Internet / Wifi cáp quang',
    category_id: 'cat_housing',
    wallet_id: 'w_momo',
    due_day: 15,
    suggestedAmounts: ['180000', '220000', '300000']
  },
  {
    title: 'Gói cước Di động 4G / 5G',
    category_id: 'cat_housing',
    wallet_id: 'w_momo',
    due_day: 5,
    suggestedAmounts: ['90000', '120000', '150000']
  },
  {
    title: 'Phí gửi xe tháng / Phí quản lý',
    category_id: 'cat_transport',
    wallet_id: 'w_cash',
    due_day: 5,
    suggestedAmounts: ['120000', '150000', '500000']
  },
  {
    title: 'Thẻ tập Gym / Thể thao / Yoga',
    category_id: 'cat_health',
    wallet_id: 'w_bank',
    due_day: 5,
    suggestedAmounts: ['300000', '500000', '800000']
  }
];

export const GOAL_SUGGESTIONS = [
  {
    name: 'Quỹ dự phòng khẩn cấp (3–6 tháng sinh hoạt)',
    icon: 'ShieldCheck',
    color: '#10b981',
    note: 'Bảo vệ bản thân và gia đình trước các chi phí đột xuất',
    suggestedTargets: ['30000000', '50000000', '100000000']
  },
  {
    name: 'Nâng cấp Laptop / Điện thoại làm việc',
    icon: 'Laptop',
    color: '#3b82f6',
    note: 'Đầu tư công cụ phục vụ công việc và học tập',
    suggestedTargets: ['15000000', '25000000', '40000000']
  },
  {
    name: 'Quỹ Du lịch & Nghỉ dưỡng',
    icon: 'Plane',
    color: '#8b5cf6',
    note: 'Tự thưởng chuyến đi trải nghiệm và tái tạo năng lượng',
    suggestedTargets: ['5000000', '15000000', '30000000']
  },
  {
    name: 'Quỹ Mua xe / Bảo dưỡng phương tiện',
    icon: 'Car',
    color: '#f59e0b',
    note: 'Tích lũy nâng cấp phương tiện đi lại hàng ngày',
    suggestedTargets: ['20000000', '45000000', '80000000']
  },
  {
    name: 'Quỹ Học tập & Phát triển bản thân',
    icon: 'GraduationCap',
    color: '#06b6d4',
    note: 'Khóa học chuyên môn, ngoại ngữ, chứng chỉ nghề nghiệp',
    suggestedTargets: ['5000000', '10000000', '20000000']
  },
  {
    name: 'Quỹ Biếu tặng Bố Mẹ & Gia đình',
    icon: 'Users',
    color: '#ec4899',
    note: 'Chuẩn bị quà Tết, chăm sóc sức khỏe cho gia đình',
    suggestedTargets: ['10000000', '20000000', '50000000']
  }
];

export const BUDGET_SUGGESTIONS = {
  cat_food: [1500000, 3000000, 4500000],
  cat_grocery: [1500000, 2500000, 4000000],
  cat_coffee: [300000, 500000, 800000],
  cat_transport: [500000, 1000000, 1500000],
  cat_housing: [2500000, 4500000, 6500000],
  cat_shopping: [500000, 1500000, 3000000],
  cat_entertainment: [500000, 1000000, 2000000],
  cat_health: [300000, 800000, 1500000],
  cat_education: [500000, 1000000, 2000000],
  cat_family: [500000, 1500000, 3000000],
  cat_invest_out: [1000000, 3000000, 5000000]
};
