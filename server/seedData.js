export const INITIAL_WALLETS = [
  {
    id: 'w_bank',
    name: 'Ngân hàng Vietcombank',
    type: 'bank',
    balance: 34600000,
    color: '#059669',
    icon: 'Landmark',
    account_number: '•••• 8868'
  },
  {
    id: 'w_momo',
    name: 'Ví điện tử MoMo',
    type: 'ewallet',
    balance: 4250000,
    color: '#db2777',
    icon: 'Smartphone',
    account_number: '098•••689'
  },
  {
    id: 'w_cash',
    name: 'Tiền mặt (Ví cá nhân)',
    type: 'cash',
    balance: 2850000,
    color: '#d97706',
    icon: 'Wallet',
    account_number: 'Tiền mặt'
  },
  {
    id: 'w_saving',
    name: 'Tích lũy & Đầu tư',
    type: 'saving',
    balance: 65000000,
    color: '#2563eb',
    icon: 'PiggyBank',
    account_number: 'Lãi 6.2%/năm'
  }
];

export const INITIAL_CATEGORIES = [
  // Expense Categories
  {
    id: 'cat_food',
    name: 'Ăn uống & Thực phẩm',
    type: 'expense',
    icon: 'Utensils',
    color: '#f97316',
    group_rule: 'needs',
    keywords: ['ăn', 'cơm', 'phở', 'bún', 'mì', 'bánh', 'chợ', 'siêu thị', 'winmart', 'bachhoaxanh', 'trưa', 'tối', 'sáng', 'lẩu', 'nướng']
  },
  {
    id: 'cat_coffee',
    name: 'Cà phê & Đồ uống',
    type: 'expense',
    icon: 'Coffee',
    color: '#d97706',
    group_rule: 'wants',
    keywords: ['cà phê', 'cafe', 'coffee', 'highlands', 'phúc long', 'trà sữa', 'katinat', 'starbucks', 'sinh tố', 'nước ép']
  },
  {
    id: 'cat_transport',
    name: 'Di chuyển & Xăng xe',
    type: 'expense',
    icon: 'Car',
    color: '#3b82f6',
    group_rule: 'needs',
    keywords: ['xăng', 'đổ xăng', 'grab', 'be', 'xanh sm', 'taxi', 'gửi xe', 'vé xe', 'bảo dưỡng', 'rửa xe']
  },
  {
    id: 'cat_housing',
    name: 'Tiền nhà & Hóa đơn',
    type: 'expense',
    icon: 'Home',
    color: '#6366f1',
    group_rule: 'needs',
    keywords: ['thuê nhà', 'tiền nhà', 'điện', 'nước', 'internet', 'wifi', 'fpt', 'viettel', 'rác', 'phí quản lý', 'điện thoại', '4g']
  },
  {
    id: 'cat_shopping',
    name: 'Mua sắm & Cá nhân',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#ec4899',
    group_rule: 'wants',
    keywords: ['shopee', 'lazada', 'tiktok', 'mua', 'áo', 'quần', 'giày', 'mỹ phẩm', 'skincare', 'cắt tóc', 'đồ gia dụng']
  },
  {
    id: 'cat_entertainment',
    name: 'Giải trí & Hội họp',
    type: 'expense',
    icon: 'Gamepad2',
    color: '#8b5cf6',
    group_rule: 'wants',
    keywords: ['xem phim', 'cgv', 'netflix', 'spotify', 'du lịch', 'nhậu', 'bia', 'sinh nhật', 'karaoke', 'game', 'concert']
  },
  {
    id: 'cat_health',
    name: 'Sức khỏe & Thể thao',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#ef4444',
    group_rule: 'needs',
    keywords: ['thuốc', 'khám', 'bệnh viện', 'gym', 'yoga', 'chạy bộ', 'cầu lông', 'bơi', 'vitamin', 'nha khoa']
  },
  {
    id: 'cat_education',
    name: 'Học tập & Phát triển',
    type: 'expense',
    icon: 'GraduationCap',
    color: '#06b6d4',
    group_rule: 'savings',
    keywords: ['sách', 'khóa học', 'udemy', 'coursera', 'tiếng anh', 'ielts', 'học phí', 'chatgpt', 'claude', 'phần mềm']
  },
  {
    id: 'cat_family',
    name: 'Gia đình & Hiếu hỉ',
    type: 'expense',
    icon: 'Users',
    color: '#14b8a6',
    group_rule: 'needs',
    keywords: ['biếu', 'bố mẹ', 'đám cưới', 'mừng cưới', 'lì xì', 'thăm bệnh', 'quà']
  },
  {
    id: 'cat_invest_out',
    name: 'Tiết kiệm & Đầu tư',
    type: 'expense',
    icon: 'TrendingUp',
    color: '#10b981',
    group_rule: 'savings',
    keywords: ['tiết kiệm', 'gửi góp', 'chứng khoán', 'cổ phiếu', 'vàng', 'quỹ mở', 'etf']
  },
  // Income Categories
  {
    id: 'cat_salary',
    name: 'Lương chính thức',
    type: 'income',
    icon: 'Briefcase',
    color: '#10b981',
    group_rule: 'income',
    keywords: ['lương', 'salary', 'thu nhập chính', 'công ty']
  },
  {
    id: 'cat_freelance',
    name: 'Freelance & Dự án',
    type: 'income',
    icon: 'Laptop',
    color: '#0ea5e9',
    group_rule: 'income',
    keywords: ['freelance', 'dự án', 'job ngoài', 'thiết kế', 'code', 'tư vấn', 'hoa hồng']
  },
  {
    id: 'cat_bonus',
    name: 'Thưởng & Lãi đầu tư',
    type: 'income',
    icon: 'Sparkles',
    color: '#f59e0b',
    group_rule: 'income',
    keywords: ['thưởng', 'bonus', 'cổ tức', 'lãi tiết kiệm', 'chốt lời', 'hoàn tiền', 'cashback']
  },
  {
    id: 'cat_gift',
    name: 'Quà tặng & Thu khác',
    type: 'income',
    icon: 'Gift',
    color: '#a855f7',
    group_rule: 'income',
    keywords: ['được tặng', 'lì xì', 'bán đồ cũ', 'pass đồ']
  }
];

export const INITIAL_BUDGETS = [
  { category_id: 'cat_food', monthly_limit: 5000000 },
  { category_id: 'cat_housing', monthly_limit: 6500000 },
  { category_id: 'cat_shopping', monthly_limit: 2500000 },
  { category_id: 'cat_transport', monthly_limit: 1500000 },
  { category_id: 'cat_entertainment', monthly_limit: 1800000 },
  { category_id: 'cat_coffee', monthly_limit: 900000 },
  { category_id: 'cat_health', monthly_limit: 1200000 },
  { category_id: 'cat_education', monthly_limit: 1500000 },
  { category_id: 'cat_family', monthly_limit: 2000000 }
];

export const INITIAL_GOALS = [
  {
    id: 'goal_emergency',
    name: 'Quỹ dự phòng khẩn cấp (6 tháng)',
    target_amount: 100000000,
    current_amount: 65000000,
    deadline: '2027-03-31',
    icon: 'ShieldCheck',
    color: '#10b981',
    note: 'Đảm bảo an toàn tài chính cá nhân trước mọi biến cố'
  },
  {
    id: 'goal_macbook',
    name: 'Nâng cấp MacBook Pro M4',
    target_amount: 42000000,
    current_amount: 29400000,
    deadline: '2026-12-25',
    icon: 'Laptop',
    color: '#3b82f6',
    note: 'Phục vụ công việc lập trình & dự án Freelance'
  },
  {
    id: 'goal_travel',
    name: 'Du lịch Nhật Bản (Tokyo - Kyoto)',
    target_amount: 35000000,
    current_amount: 15750000,
    deadline: '2027-04-15',
    icon: 'Plane',
    color: '#8b5cf6',
    note: 'Tự thưởng sau 1 năm làm việc chăm chỉ'
  }
];

export const INITIAL_RECURRING = [
  {
    id: 'rec_rent',
    title: 'Tiền thuê căn hộ Studio + Phí quản lý',
    amount: 5500000,
    category_id: 'cat_housing',
    wallet_id: 'w_bank',
    due_day: 1,
    last_paid_month: '2026-11',
    active: true
  },
  {
    id: 'rec_gym',
    title: 'Thẻ hội viên Gym & Bơi lội',
    amount: 600000,
    category_id: 'cat_health',
    wallet_id: 'w_momo',
    due_day: 5,
    last_paid_month: '2026-10',
    active: true
  },
  {
    id: 'rec_utilities',
    title: 'Hóa đơn Điện + Nước + Internet FPT',
    amount: 850000,
    category_id: 'cat_housing',
    wallet_id: 'w_momo',
    due_day: 10,
    last_paid_month: '2026-10',
    active: true
  },
  {
    id: 'rec_subs',
    title: 'Combo YouTube Premium + iCloud + Spotify',
    amount: 189000,
    category_id: 'cat_entertainment',
    wallet_id: 'w_momo',
    due_day: 15,
    last_paid_month: '2026-10',
    active: true
  }
];

export const INITIAL_TRANSACTIONS = [
  // Tháng 11/2026 (Current Month up to 2026-11-05)
  {
    id: 'tx_1105_1',
    title: 'Ăn trưa Phở bò tái lăn cùng đồng nghiệp',
    amount: 65000,
    type: 'expense',
    category_id: 'cat_food',
    wallet_id: 'w_cash',
    tx_date: '2026-11-05',
    note: 'Quán Phở Thìn góc phố',
    tags: ['ăntrưa', 'côngsở']
  },
  {
    id: 'tx_1105_2',
    title: 'Cà phê Cold Brew Highlands sáng',
    amount: 55000,
    type: 'expense',
    category_id: 'cat_coffee',
    wallet_id: 'w_momo',
    tx_date: '2026-11-05',
    note: 'Giảm 10k qua mã ưu đãi MoMo',
    tags: ['cafe', 'buổisáng']
  },
  {
    id: 'tx_1104_1',
    title: 'Thanh toán dự án Freelance Landing Page',
    amount: 6500000,
    type: 'income',
    category_id: 'cat_freelance',
    wallet_id: 'w_bank',
    tx_date: '2026-11-04',
    note: 'Khách hàng chuyển khoản đợt cuối 100%',
    tags: ['freelance', 'react']
  },
  {
    id: 'tx_1104_2',
    title: 'Đi siêu thị WinMart mua thực phẩm tuần',
    amount: 485000,
    type: 'expense',
    category_id: 'cat_food',
    wallet_id: 'w_momo',
    tx_date: '2026-11-04',
    note: 'Thịt bò, cá hồi, rau củ, sữa tươi',
    tags: ['nấuăn', 'siêuthị']
  },
  {
    id: 'tx_1104_3',
    title: 'Đổ đầy bình xăng RON 95-V',
    amount: 85000,
    type: 'expense',
    category_id: 'cat_transport',
    wallet_id: 'w_cash',
    tx_date: '2026-11-04',
    note: 'Cây xăng Petrolimex',
    tags: ['xăngxe']
  },
  {
    id: 'tx_1103_1',
    title: 'Mua áo sơ mi Uniqlo & tất kháng khuẩn',
    amount: 690000,
    type: 'expense',
    category_id: 'cat_shopping',
    wallet_id: 'w_bank',
    tx_date: '2026-11-03',
    note: 'Uniqlo Vincom Đồng Khởi',
    tags: ['thờitrang', 'côngsở']
  },
  {
    id: 'tx_1103_2',
    title: 'Cơm tấm sườn bì chả + Trà đá',
    amount: 55000,
    type: 'expense',
    category_id: 'cat_food',
    wallet_id: 'w_cash',
    tx_date: '2026-11-03',
    note: 'Bữa trưa văn phòng',
    tags: ['ăntrưa']
  },
  {
    id: 'tx_1102_1',
    title: 'Trích quỹ tích lũy định kỳ đầu tháng',
    amount: 4000000,
    type: 'expense',
    category_id: 'cat_invest_out',
    wallet_id: 'w_bank',
    tx_date: '2026-11-02',
    note: 'Kỷ luật tài chính: Trả cho bản thân trước (Pay yourself first)',
    tags: ['tiếtkiệm', 'kỷluật']
  },
  {
    id: 'tx_1102_2',
    title: 'Lẩu nấm Ashima cuối tuần cùng bạn bè',
    amount: 420000,
    type: 'expense',
    category_id: 'cat_entertainment',
    wallet_id: 'w_momo',
    tx_date: '2026-11-02',
    note: 'Chia bill nhóm 4 người',
    tags: ['cuốituần', 'bạnbè']
  },
  {
    id: 'tx_1101_1',
    title: 'Lương chính thức tháng 11/2026',
    amount: 24500000,
    type: 'income',
    category_id: 'cat_salary',
    wallet_id: 'w_bank',
    tx_date: '2026-11-01',
    note: 'Lương cứng + Phụ cấp ăn trưa & chuyên cần',
    tags: ['lương', 'tháng11']
  },
  {
    id: 'tx_1101_2',
    title: 'Tiền thuê căn hộ Studio + Phí quản lý T11',
    amount: 5500000,
    type: 'expense',
    category_id: 'cat_housing',
    wallet_id: 'w_bank',
    tx_date: '2026-11-01',
    note: 'Chuyển khoản chủ nhà đúng hạn ngày 01',
    tags: ['tiềnnhà', 'cốđịnh']
  },
  {
    id: 'tx_1101_3',
    title: 'Gia hạn khóa học System Design & AI Engineering',
    amount: 450000,
    type: 'expense',
    category_id: 'cat_education',
    wallet_id: 'w_momo',
    tx_date: '2026-11-01',
    note: 'Đầu tư nâng cấp kỹ năng chuyên môn',
    tags: ['họctập', 'kỹnăng']
  },
  // Tháng 10/2026 (Previous Month for Historical Comparison)
  {
    id: 'tx_1001_1',
    title: 'Lương chính thức tháng 10/2026',
    amount: 24500000,
    type: 'income',
    category_id: 'cat_salary',
    wallet_id: 'w_bank',
    tx_date: '2026-10-01',
    note: 'Lương tháng 10 chuyển khoản Vietcombank',
    tags: ['lương', 'tháng10']
  },
  {
    id: 'tx_1002_1',
    title: 'Tiền thuê căn hộ Studio + Phí quản lý T10',
    amount: 5500000,
    type: 'expense',
    category_id: 'cat_housing',
    wallet_id: 'w_bank',
    tx_date: '2026-10-02',
    note: 'Thanh toán tiền nhà tháng 10',
    tags: ['tiềnnhà']
  },
  {
    id: 'tx_1008_1',
    title: 'Thưởng KPI Quý 3 + Hoàn thành dự án sớm',
    amount: 4500000,
    type: 'income',
    category_id: 'cat_bonus',
    wallet_id: 'w_bank',
    tx_date: '2026-10-08',
    note: 'Thưởng hiệu suất công việc xuất sắc',
    tags: ['thưởng', 'kpi']
  },
  {
    id: 'tx_1012_1',
    title: 'Tổng chi phí ăn uống & siêu thị nửa đầu T10',
    amount: 2350000,
    type: 'expense',
    category_id: 'cat_food',
    wallet_id: 'w_momo',
    tx_date: '2026-10-12',
    note: 'Ăn trưa văn phòng + nấu ăn tối tại nhà',
    tags: ['ănuống']
  },
  {
    id: 'tx_1018_1',
    title: 'Mua tai nghe chống ồn làm việc tập trung',
    amount: 1890000,
    type: 'expense',
    category_id: 'cat_shopping',
    wallet_id: 'w_bank',
    tx_date: '2026-10-18',
    note: 'Săn sale 10/10 trên Shopee Mall',
    tags: ['côngnghệ', 'shopee']
  },
  {
    id: 'tx_1020_1',
    title: 'Quà 20/10 biếu mẹ và hoa tươi',
    amount: 1500000,
    type: 'expense',
    category_id: 'cat_family',
    wallet_id: 'w_bank',
    tx_date: '2026-10-20',
    note: 'Ngày Phụ nữ Việt Nam 20/10',
    tags: ['giađình', '20/10']
  },
  {
    id: 'tx_1025_1',
    title: 'Tổng chi ăn uống & cà phê nửa cuối T10',
    amount: 2180000,
    type: 'expense',
    category_id: 'cat_food',
    wallet_id: 'w_cash',
    tx_date: '2026-10-25',
    note: 'Chi phí sinh hoạt ăn uống hàng ngày',
    tags: ['ănuống']
  },
  {
    id: 'tx_1028_1',
    title: 'Gửi tiết kiệm tích lũy tháng 10',
    amount: 5000000,
    type: 'expense',
    category_id: 'cat_invest_out',
    wallet_id: 'w_saving',
    tx_date: '2026-10-28',
    note: 'Nạp vào Quỹ dự phòng khẩn cấp',
    tags: ['tiếtkiệm']
  }
];

export const QUICK_TEMPLATES = [
  { label: '🍜 Ăn trưa 50k', text: 'Ăn trưa văn phòng 50k', category_id: 'cat_food', amount: 50000, wallet_id: 'w_cash', type: 'expense' },
  { label: '☕ Cà phê 45k', text: 'Cà phê sáng 45k ví momo', category_id: 'cat_coffee', amount: 45000, wallet_id: 'w_momo', type: 'expense' },
  { label: '⛽ Đổ xăng 80k', text: 'Đổ xăng xe máy 80k', category_id: 'cat_transport', amount: 80000, wallet_id: 'w_cash', type: 'expense' },
  { label: '🛒 Đi siêu thị 250k', text: 'Mua đồ siêu thị WinMart 250k ví momo', category_id: 'cat_food', amount: 250000, wallet_id: 'w_momo', type: 'expense' },
  { label: '🛵 Grab / Di chuyển 40k', text: 'Đặt xe di chuyển 40k ví momo', category_id: 'cat_transport', amount: 40000, wallet_id: 'w_momo', type: 'expense' },
  { label: '📦 Mua Shopee 180k', text: 'Mua đồ Shopee 180k ngân hàng', category_id: 'cat_shopping', amount: 180000, wallet_id: 'w_bank', type: 'expense' }
];
