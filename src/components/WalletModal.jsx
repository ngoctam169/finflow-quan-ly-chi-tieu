import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Wallet, Check, Trash2 } from 'lucide-react';
import { evaluateAmountExpression, formatVND } from '../utils/smartParser.js';

export function WalletModal({
  isOpen,
  onClose,
  wallets,
  initialMode = 'transfer',
  editingWallet = null,
  onSaveWallet,
  onDeleteWallet,
  onTransfer
}) {
  const [mode, setMode] = useState(initialMode);

  // Transfer state
  const [fromWalletId, setFromWalletId] = useState('w_bank');
  const [toWalletId, setToWalletId] = useState('w_momo');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  // Wallet Upsert state
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('bank');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletAccount, setWalletAccount] = useState('');
  const [walletColor, setWalletColor] = useState('#059669');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMode(editingWallet ? 'wallet' : initialMode);
    setError('');
    if (editingWallet) {
      setWalletName(editingWallet.name || '');
      setWalletType(editingWallet.type || 'bank');
      setWalletBalance(String(editingWallet.balance || 0));
      setWalletAccount(editingWallet.account_number || '');
      setWalletColor(editingWallet.color || '#059669');
    } else {
      setWalletName('');
      setWalletType('bank');
      setWalletBalance('');
      setWalletAccount('');
      setWalletColor('#059669');
    }
  }, [isOpen, initialMode, editingWallet]);

  if (!isOpen) return null;

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const val = evaluateAmountExpression(transferAmount);
    if (fromWalletId === toWalletId) {
      setError('Ví nguồn và ví đích phải khác nhau');
      return;
    }
    if (val <= 0) {
      setError('Vui lòng nhập số tiền chuyển lớn hơn 0 ₫');
      return;
    }
    await onTransfer({
      from_wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      amount: val,
      note: transferNote.trim() || 'Chuyển tiền nội bộ giữa các ví'
    });
    onClose();
  };

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    if (!walletName.trim()) {
      setError('Vui lòng nhập tên ví / tài khoản');
      return;
    }
    const bal = evaluateAmountExpression(walletBalance);
    const iconMap = {
      bank: 'Landmark',
      ewallet: 'Smartphone',
      cash: 'Wallet',
      saving: 'PiggyBank'
    };
    await onSaveWallet({
      id: editingWallet?.id,
      name: walletName.trim(),
      type: walletType,
      balance: bal,
      color: walletColor,
      icon: iconMap[walletType] || 'Wallet',
      account_number: walletAccount.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Quản lý Nguồn tiền & Chuyển ví
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('transfer');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === 'transfer'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Chuyển tiền nội bộ
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('wallet');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                mode === 'wallet'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              {editingWallet ? 'Sửa thông tin ví' : 'Thêm ví mới'}
            </button>
          </div>

          {mode === 'transfer' ? (
            <form onSubmit={handleTransferSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Chuyển từ ví nguồn
                </label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Sang ví nhận
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatVND(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Số tiền chuyển (VD: 500k, 2tr)
                </label>
                <input
                  type="text"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Nhập 500k, 2tr..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono-num text-sm font-bold text-slate-900 dark:text-white"
                />
                {evaluateAmountExpression(transferAmount) > 0 && (
                  <p className="text-xs font-mono-num text-emerald-600 mt-1">
                    = {formatVND(evaluateAmountExpression(transferAmount))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="VD: Nạp ví MoMo, Rút tiền mặt ATM..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận chuyển ví
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleWalletSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Tên ví / Tài khoản
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="VD: Techcombank, Ví ZaloPay, Heo đất..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Loại nguồn tiền
                  </label>
                  <select
                    value={walletType}
                    onChange={(e) => setWalletType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="bank">Ngân hàng</option>
                    <option value="ewallet">Ví điện tử</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="saving">Tiết kiệm / Đầu tư</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Số dư hiện tại
                  </label>
                  <input
                    type="text"
                    value={walletBalance}
                    onChange={(e) => setWalletBalance(e.target.value)}
                    placeholder="VD: 5tr, 1200000"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono-num text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quick Balance Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400">Gợi ý điền nhanh:</span>
                {[
                  { label: '0 ₫', val: '0' },
                  { label: '500k', val: '500000' },
                  { label: '2 triệu', val: '2000000' },
                  { label: '5 triệu', val: '5000000' },
                  { label: '10 triệu', val: '10000000' },
                  { label: '20 triệu', val: '20000000' }
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setWalletBalance(s.val)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-medium cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Ghi chú số TK / Lãi suất
                  </label>
                  <input
                    type="text"
                    value={walletAccount}
                    onChange={(e) => setWalletAccount(e.target.value)}
                    placeholder="VD: •••• 9999"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Màu nhận diện
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {['#059669', '#2563eb', '#db2777', '#d97706', '#7c3aed', '#0891b2'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setWalletColor(c)}
                          className={`w-6 h-6 rounded-full cursor-pointer transition ${
                            walletColor === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

              <div className="pt-2 flex items-center justify-between gap-2">
                {editingWallet && onDeleteWallet && wallets.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteWallet(editingWallet.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa ví này
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Lưu nguồn tiền
                </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
