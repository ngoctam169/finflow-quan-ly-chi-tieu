import express from 'express';
import cors from 'cors';
import {
  getDbStatus,
  getFullState,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  upsertWallet,
  deleteWallet,
  transferBetweenWallets,
  upsertCategory,
  upsertBudget,
  upsertBulkBudgets,
  upsertGoal,
  deleteGoal,
  contributeToGoal,
  upsertRecurringBill,
  deleteRecurringBill,
  payRecurringBill,
  resetToDemoData
} from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health & Cloud DB Status
app.get('/api/health', async (_req, res) => {
  try {
    const db = await getDbStatus();
    res.json({
      ok: true,
      service: 'FinFlow VN Personal Finance API',
      runtime: 'Node.js + Express 5',
      database: db,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2. Full Application State (Wallets, Categories, Budgets, Goals, Recurring, Transactions)
app.get('/api/state', async (_req, res) => {
  try {
    const state = await getFullState();
    res.json({ ok: true, ...state });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3. Create Transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const tx = await createTransaction(req.body || {});
    const state = await getFullState();
    res.status(201).json({ ok: true, transaction: tx, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 4. Update Transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const tx = await updateTransaction(req.params.id, req.body || {});
    const state = await getFullState();
    res.json({ ok: true, transaction: tx, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 5. Delete Transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await deleteTransaction(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6. Upsert Wallet
app.post('/api/wallets', async (req, res) => {
  try {
    const wallet = await upsertWallet(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, wallet, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6b. Delete Wallet
app.delete('/api/wallets/:id', async (req, res) => {
  try {
    await deleteWallet(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 6c. Upsert Custom Category
app.post('/api/categories', async (req, res) => {
  try {
    const category = await upsertCategory(req.body || {});
    const state = await getFullState();
    res.status(201).json({ ok: true, category, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 7. Transfer Between Wallets
app.post('/api/wallets/transfer', async (req, res) => {
  try {
    const transfer = await transferBetweenWallets(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, transfer, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 8. Update Category Budget
app.post('/api/budgets', async (req, res) => {
  try {
    const budget = await upsertBudget(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, budget, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 8b. Bulk Apply Smart Allocated Budgets
app.post('/api/budgets/bulk', async (req, res) => {
  try {
    const budgets = await upsertBulkBudgets(req.body?.budgets || []);
    const state = await getFullState();
    res.json({ ok: true, budgets, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 9. Upsert Savings Goal
app.post('/api/goals', async (req, res) => {
  try {
    const goal = await upsertGoal(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, goal, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 9b. Delete Savings Goal
app.delete('/api/goals/:id', async (req, res) => {
  try {
    await deleteGoal(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 10. Contribute to Savings Goal
app.post('/api/goals/:id/contribute', async (req, res) => {
  try {
    const goal = await contributeToGoal(req.params.id, req.body || {});
    const state = await getFullState();
    res.json({ ok: true, goal, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 11. Upsert Recurring Bill
app.post('/api/recurring', async (req, res) => {
  try {
    const bill = await upsertRecurringBill(req.body || {});
    const state = await getFullState();
    res.json({ ok: true, bill, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 11b. Delete Recurring Bill
app.delete('/api/recurring/:id', async (req, res) => {
  try {
    await deleteRecurringBill(req.params.id);
    const state = await getFullState();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 12. Pay Recurring Bill
app.post('/api/recurring/:id/pay', async (req, res) => {
  try {
    const result = await payRecurringBill(req.params.id, req.body || {});
    const state = await getFullState();
    res.json({ ok: true, ...result, state });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// 13. Reset Demo Data
app.post('/api/reset-demo', async (_req, res) => {
  try {
    const state = await resetToDemoData();
    res.json({ ok: true, state });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 14. AI Financial & Anti-Impulse Advisor Endpoint
app.post('/api/ai-analyze', async (req, res) => {
  try {
    const {
      mode = 'impulse',
      itemName = '',
      itemPrice = 0,
      monthlySalary = 15000000,
      totalNetWorth = 0,
      monthIncome = 0,
      monthExpense = 0,
      topCategories = [],
      question = '',
      geminiApiKey = ''
    } = req.body || {};

    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)) + ' ₫';
    const salary = Math.max(1000000, Number(monthlySalary) || 15000000);
    const hourly = Math.round(salary / 176);
    const activeGeminiKey = String(geminiApiKey || process.env.GEMINI_API_KEY || '').trim();

    // If a Google Gemini API Key is provided, call Gemini 2.5 Flash directly with structured JSON output
    if (activeGeminiKey) {
      try {
        const price = Math.max(0, Number(itemPrice) || 0);
        const hours = (price / hourly).toFixed(1);
        const days = (price / (hourly * 8)).toFixed(1);
        const topCatStr =
          Array.isArray(topCategories) && topCategories.length > 0
            ? topCategories.map((c) => `${c.name}: ${fmt(c.amount)}`).join(', ')
            : 'Chưa có';

        const promptText =
          mode === 'impulse'
            ? `Bạn là chuyên gia tài chính cá nhân FinFlow VN. Người dùng có thu nhập ${fmt(salary)}/tháng (1 giờ công = ${fmt(hourly)}), tổng số dư hiện tại ${fmt(totalNetWorth)}, tháng này đã thu ${fmt(monthIncome)} và chi ${fmt(monthExpense)}. Họ đang định mua "${itemName || 'Món đồ'}" với giá ${fmt(price)} (tương đương ${hours} giờ làm việc ~ ${days} ngày công). Hãy phân tích chống mua bốc đồng thật thẳng thắn, thực tế và trả về đúng JSON theo cấu trúc: {"verdict":"buy|wait|stop","badge":"tiêu đề ngắn có emoji","summary":"1 câu nhận xét cốt lõi","bullets":["ý 1 về giờ công","ý 2 về chi phí cơ hội/tác động ví","ý 3 lời khuyên hành động"]}`
            : `Bạn là chuyên gia tài chính cá nhân FinFlow VN. Người dùng có thu nhập tham chiếu ${fmt(salary)}/tháng, tổng số dư các ví ${fmt(totalNetWorth)}, tháng này thu ${fmt(monthIncome)}, chi ${fmt(monthExpense)}, nhóm chi lớn nhất: ${topCatStr}. ${question ? `Câu hỏi của người dùng: "${question}".` : 'Hãy đánh giá dòng tiền tháng này.'} Trả về đúng JSON theo cấu trúc: {"verdict":"wait","badge":"✨ GEMINI 2.5 FLASH PHÂN TÍCH","summary":"1 câu tóm tắt sắc bén","bullets":["nhận xét 1","nhận xét 2","lời khuyên 3"]}`;

        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(activeGeminiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (gRes.ok) {
          const gData = await gRes.json();
          const rawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = JSON.parse(rawText);
          if (parsed && parsed.summary && Array.isArray(parsed.bullets)) {
            return res.json({
              ok: true,
              engine: 'Gemini 2.5 Flash',
              verdict: parsed.verdict || 'wait',
              badge: parsed.badge || '✨ GEMINI 2.5 FLASH PHÂN TÍCH',
              summary: parsed.summary,
              bullets: parsed.bullets
            });
          }
        }
      } catch {
        // Fallback to built-in Smart Financial Engine below if key is invalid or quota exceeded
      }
    }

    if (mode === 'impulse') {
      const price = Math.max(0, Number(itemPrice) || 0);
      const hours = (price / hourly).toFixed(1);
      const days = (price / (hourly * 8)).toFixed(1);
      const pctSalary = ((price / salary) * 100).toFixed(1);
      const name = String(itemName || 'Món đồ này').trim();
      const lowerName = name.toLowerCase();
      const isEssential =
        /thuốc|khám|sách|học|laptop|sửa xe|mũ bảo hiểm|điện|nước|gạo|thực phẩm/.test(lowerName);

      let verdict = 'wait';
      let badge = '🟡 NÊN HOÃN MUA 48 GIỜ';
      let summary = '';
      const bullets = [];

      if (totalNetWorth > 0 && price > totalNetWorth * 0.5) {
        verdict = 'stop';
        badge = '🔴 CẢNH BÁO BỐC ĐỒNG — KHÔNG NÊN MUA LÚC NÀY';
        summary = `"${name}" (${fmt(price)}) ngốn hơn một nửa tổng số dư hiện có của bạn (${fmt(totalNetWorth)}).`;
      } else if (price >= salary * 0.15 && !isEssential) {
        verdict = 'stop';
        badge = '🔴 KHOAN MUA — ĐƯA VÀO GIỎ CHỜ 48H NGAY';
        summary = `"${name}" chiếm tới ${pctSalary}% thu nhập cả tháng và tương đương ${days} ngày đi làm vất vả (${hours} giờ công).`;
      } else if (price <= salary * 0.03 || isEssential) {
        verdict = 'buy';
        badge = '🟢 CÓ THỂ MUA (TRONG NGƯỠNG AN TOÀN)';
        summary = `"${name}" (${fmt(price)}) chỉ chiếm ${pctSalary}% thu nhập tháng (~${hours} giờ làm việc) và nằm trong mức chi tiêu hợp lý.`;
      } else {
        verdict = 'wait';
        badge = '🟡 NÊN CHỜ 48 GIỜ TRƯỚC KHI CHỐT ĐƠN';
        summary = `"${name}" (${fmt(price)}) tiêu tốn ${hours} giờ làm việc (~${days} ngày công, bằng ${pctSalary}% lương tháng).`;
      }

      bullets.push(
        `Chi phí sức lao động: Bạn phải làm việc liên tục ${hours} giờ (${days} ngày công) mới đổi lấy được món đồ này.`
      );
      bullets.push(
        `Chi phí cơ hội: ${fmt(price)} tương đương ${Math.max(1, Math.round(price / 45000))} bữa ăn tự nấu hoặc ${Math.max(1, Math.round(price / 70000))} lần đổ đầy bình xăng.`
      );
      bullets.push(
        verdict === 'buy'
          ? 'Gợi ý: Nếu món đồ thực sự phục vụ công việc/sức khỏe hàng ngày, bạn có thể mua nhưng hãy ưu tiên săn mã giảm giá.'
          : 'Gợi ý thực chiến: Hãy bấm nút "⏳ Hoãn mua 48h" bên cạnh. Sau 2 ngày, nếu bạn vẫn nghĩ về nó và thực sự cần dùng ngay trong tuần này thì hãy mua.'
      );

      return res.json({
        ok: true,
        engine: 'FinFlow Smart Rule Engine',
        verdict,
        badge,
        summary,
        bullets
      });
    }

    // Mode: overview or custom question
    const net = monthIncome - monthExpense;
    const topCatText =
      Array.isArray(topCategories) && topCategories.length > 0
        ? topCategories.map((c) => `${c.name} (${fmt(c.amount)})`).join(', ')
        : 'Chưa có khoản chi lớn';

    if (question && question.trim()) {
      const q = question.trim();
      const safeSave = Math.round(salary * 0.2);
      const safeNeeds = Math.round(salary * 0.55);
      const safeWants = Math.round(salary * 0.25);
      return res.json({
        ok: true,
        badge: '🤖 TRỢ LÝ AI TÀI CHÍNH CÁ NHÂN',
        summary: `Phân tích cho câu hỏi: "${q}"`,
        bullets: [
          `Với mức thu nhập tham chiếu ${fmt(salary)}/tháng và số dư hiện tại ${fmt(totalNetWorth)}, nguyên tắc an toàn nhất là cất trước ${fmt(safeSave)} (20%) vào ví Tiết kiệm ngay khi nhận lương.`,
          `Phần chi phí thiết yếu (Ăn uống, Đi chợ, Hóa đơn, Di chuyển) nên giữ trong khoảng ${fmt(safeNeeds)}/tháng (~${fmt(Math.round(safeNeeds / 30))}/ngày).`,
          `Phần mua sắm & hưởng thụ cá nhân giới hạn tối đa ${fmt(safeWants)}/tháng. Mọi món đồ trên ${fmt(Math.round(salary * 0.03))} đều nên đưa vào Giỏ chờ 48h trước khi xuống tiền.`
        ]
      });
    }

    const badge =
      monthExpense === 0
        ? '✨ SỔ CHI TIÊU ĐANG SẠCH — SẴN SÀNG THEO DÕI'
        : monthIncome > 0 && monthExpense > monthIncome * 0.8
        ? '⚠️ CẢNH BÁO TỐC ĐỘ CHI TIÊU CAO'
        : '🟢 DÒNG TIỀN THÁNG NÀY ĐANG KIỂM SOÁT TỐT';

    const summary =
      monthExpense === 0
        ? `Hiện tại tổng số dư của bạn là ${fmt(totalNetWorth)}. Hãy ghi nhận các khoản chi hàng ngày (Ăn uống, Đi chợ, Di chuyển, Hóa đơn) để AI phân tích thói quen chi tiêu.`
        : `Tháng này bạn đã thu ${fmt(monthIncome)}, chi ${fmt(monthExpense)} (chênh lệch ${net >= 0 ? '+' : ''}${fmt(net)}). Nhóm chi lớn nhất: ${topCatText}.`;

    const bullets = [
      `Định mức an toàn mỗi ngày: Với thu nhập ${fmt(salary)}/tháng, bạn chỉ nên chi tối đa khoảng ${fmt(Math.round((salary * 0.7) / 30))}/ngày cho sinh hoạt thường nhật.`,
      `Nhóm chi tiêu trọng tâm: ${topCatText}. Hãy ưu tiên tự nấu ăn / đi chợ thay vì gọi đồ ngoài để tiết kiệm thêm 1,2 – 1,8 triệu/tháng.`,
      `Quy tắc giữ tiền: Trước khi mua bất kỳ món đồ mua sắm nào trên 300.000 ₫, hãy dùng công cụ "Chống mua bốc đồng" để quy đổi ra giờ công lao động.`
    ];

    return res.json({
      ok: true,
      badge,
      summary,
      bullets
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default app;
