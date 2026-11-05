export function formatVND(amount, hideBalance = false) {
  if (hideBalance) return '•••••••• ₫';
  const num = Math.round(Number(amount) || 0);
  return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
}

export function formatCompactVND(amount, hideBalance = false) {
  if (hideBalance) return '•••• ₫';
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')} tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)}k`;
  }
  return `${sign}${abs} ₫`;
}

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  if (dateStr === '2026-11-05') return 'Hôm nay, 05/11/2026';
  if (dateStr === '2026-11-04') return 'Hôm qua, 04/11/2026';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Parses shorthand Vietnamese currency strings or simple math expressions:
 * - "55k" -> 55000
 * - "1.5tr" / "1,5tr" / "1tr5" -> 1500000
 * - "35k + 15k" -> 50000
 * - "250.000" -> 250000
 */
export function parseTokenAmount(token) {
  if (!token) return 0;
  const clean = String(token).trim().toLowerCase();

  // Match pattern like "1tr5" or "2m5"
  const splitMillion = clean.match(/^(\d+)(?:tr|triệu|trieu|m)(\d+)$/);
  if (splitMillion) {
    const millions = Number(splitMillion[1]) * 1_000_000;
    const decimals = Number(splitMillion[2]) * Math.pow(10, 6 - splitMillion[2].length);
    return millions + decimals;
  }

  // Match pattern like "1.5tr", "25tr", "1,2m"
  const millionMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:tr|triệu|trieu|m|củ|cu)$/);
  if (millionMatch) {
    const val = Number(millionMatch[1].replace(',', '.'));
    return Math.round(val * 1_000_000);
  }

  // Match pattern like "55k", "120ng", "50 nghìn", "50 cành"
  const thousandMatch = clean.match(/^(\d+(?:[.,]\d+)?)\s*(?:k|ng|nghìn|nghin|ngàn|ngan|cành|canh)$/);
  if (thousandMatch) {
    const val = Number(thousandMatch[1].replace(',', '.'));
    return Math.round(val * 1_000);
  }

  // Plain digits or formatted digits like "55.000" or "55,000" or "55000"
  const digitsOnly = clean.replace(/[.,\s]/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    const num = Number(digitsOnly);
    // If user typed a small number like 45 or 120 in Vietnam VND context, keep exact unless shorthand used
    return num;
  }

  return 0;
}

export function evaluateAmountExpression(expr) {
  if (!expr) return 0;
  const str = String(expr).trim().toLowerCase();
  if (!str) return 0;

  // Split by + or - while keeping operator
  const parts = str.split(/([+-])/).map((s) => s.trim()).filter(Boolean);
  let total = 0;
  let currentOp = '+';

  for (const part of parts) {
    if (part === '+' || part === '-') {
      currentOp = part;
    } else {
      const val = parseTokenAmount(part);
      total = currentOp === '+' ? total + val : total - val;
    }
  }
  return Math.max(0, Math.round(total));
}

/**
 * Natural Language Smart Parser for Quick-Add Bar
 * Example inputs:
 * - "Ăn trưa phở bò 65k"
 * - "Cà phê Highlands 49k ví momo"
 * - "Lương tháng 11 25tr ngân hàng"
 * - "Mua áo Shopee 320k hôm qua"
 */
export function parseNaturalTransaction(inputText, categories = [], wallets = [], defaultDate = '2026-11-05') {
  const raw = String(inputText || '').trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();

  // 1. Extract amount token from text
  // Supports: 1tr5, 2.5tr, 25tr, 55k, 120ng, 45000, 150.000
  const amountRegex =
    /(\b\d+\s*(?:tr|triệu|trieu|m)\s*\d+\b|\b\d+(?:[.,]\d+)?\s*(?:tr|triệu|trieu|m|củ|cu|k|ng|nghìn|nghin|ngàn|ngan|cành|canh)\b|\b\d{1,3}(?:[.,]\d{3})+\b|\b\d{4,9}\b)/i;

  let amount = 0;
  let matchedAmountStr = '';
  const match = raw.match(amountRegex);

  if (match) {
    matchedAmountStr = match[1];
    amount = parseTokenAmount(matchedAmountStr.replace(/\s+/g, ''));
  }

  // 2. Detect Date ("hôm qua", "hôm kia", "hôm nay")
  let tx_date = defaultDate;
  if (lower.includes('hôm qua') || lower.includes('hom qua')) {
    tx_date = '2026-11-04';
  } else if (lower.includes('hôm kia') || lower.includes('hom kia')) {
    tx_date = '2026-11-03';
  }

  // 3. Detect Wallet
  let wallet_id = 'w_cash';
  if (
    lower.includes('momo') ||
    lower.includes('ví điện tử') ||
    lower.includes('zalopay')
  ) {
    wallet_id = 'w_momo';
  } else if (
    lower.includes('vcb') ||
    lower.includes('vietcombank') ||
    lower.includes('ngân hàng') ||
    lower.includes('chuyển khoản') ||
    lower.includes('bank') ||
    lower.includes('thẻ')
  ) {
    wallet_id = 'w_bank';
  } else if (lower.includes('tiết kiệm') || lower.includes('tích lũy')) {
    wallet_id = 'w_saving';
  }

  // 4. Detect Category & Type (Expense vs Income)
  let matchedCategory = null;
  for (const cat of categories) {
    const kwList = Array.isArray(cat.keywords) ? cat.keywords : [];
    if (kwList.some((kw) => lower.includes(kw.toLowerCase()))) {
      matchedCategory = cat;
      break;
    }
  }

  if (!matchedCategory) {
    if (lower.includes('thu ') || lower.includes('lương') || lower.includes('thưởng') || lower.includes('nhận')) {
      matchedCategory = categories.find((c) => c.type === 'income') || categories[0];
    } else {
      matchedCategory = categories.find((c) => c.id === 'cat_food') || categories[0];
    }
  }

  const type = matchedCategory?.type === 'income' ? 'income' : 'expense';
  // Default income to bank wallet if not explicitly specified
  if (type === 'income' && wallet_id === 'w_cash' && !lower.includes('tiền mặt')) {
    wallet_id = 'w_bank';
  }

  // 5. Clean Title
  let cleanTitle = raw
    .replace(matchedAmountStr, '')
    .replace(/\b(ví momo|momo|ngân hàng|vietcombank|vcb|tiền mặt|chuyển khoản|hôm qua|hôm kia|hôm nay)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleanTitle) {
    cleanTitle = matchedCategory ? matchedCategory.name : 'Giao dịch mới';
  } else {
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  }

  const walletObj = wallets.find((w) => w.id === wallet_id) || wallets[0];

  return {
    title: cleanTitle,
    amount,
    type,
    category_id: matchedCategory?.id || 'cat_food',
    category: matchedCategory,
    wallet_id: walletObj?.id || wallet_id,
    wallet: walletObj,
    tx_date,
    isValid: amount > 0
  };
}
