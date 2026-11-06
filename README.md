# 💰 FinFlow VN — Ứng Dụng Quản Lý Chi Tiêu & Tài Chính Cá Nhân Thông Minh

**FinFlow VN** là ứng dụng web quản lý tài chính cá nhân hiện đại, tập trung tối đa vào **sự tiện dụng (UX/UI)**, tốc độ thao tác dưới 3 giây và khả năng phân tích dòng tiền chuyên sâu.

- 🌐 **Bản Triển Khai Chính Thức (Vercel Production):** [https://finflow-pro-nt.vercel.app](https://finflow-pro-nt.vercel.app)

## ✨ Tính Năng Nổi Bật

1. **⚡ Ghi Nhanh Thông Minh 3 Giây (Natural Language Quick-Add)**:
   - Gõ tự nhiên bằng tiếng Việt: ví dụ `Ăn trưa phở bò 65k`, `Cà phê 45k ví momo`, `Lương tháng 11 25tr`, `Mua áo Shopee 320k hôm qua`.
   - Tự động bóc tách **Số tiền**, **Loại giao dịch (Thu/Chi)**, **Danh mục**, **Ví thanh toán** và **Ngày giao dịch** theo thời gian thực.
   - Tích hợp **Chip ghi nhanh 1 chạm** cho các khoản chi tiêu lặp lại hàng ngày và máy tính mini ngay trong ô nhập tiền (`45k + 15k`).
2. **👛 Quản Lý Đa Ví & Chuyển Tiền Nội Bộ**:
   - Theo dõi số dư tách biệt giữa **Ngân hàng (Vietcombank)**, **Ví điện tử (MoMo)**, **Tiền mặt** và **Tài khoản Tiết kiệm / Đầu tư**.
   - Hỗ trợ chuyển tiền nội bộ giữa các ví không làm sai lệch báo cáo thu chi.
3. **📊 Tổng Quan Trực Quan & Quy Tắc 50/30/20**:
   - Biểu đồ dòng tiền Thu - Chi theo ngày, biểu đồ Donut phân bổ danh mục chi tiêu.
   - Tự động đánh giá cấu trúc chi tiêu theo chuẩn **50% Thiết yếu — 30% Mong muốn — 20% Tích lũy** và tính toán **Hạn mức chi tiêu an toàn mỗi ngày còn lại trong tháng**.
4. **🗓️ Sổ Giao Dịch Kép (Danh Sách & Lịch Nhiệt Chi Tiêu)**:
   - Chuyển đổi linh hoạt giữa chế độ danh sách truyền thống và **Lịch nhiệt chi tiêu (Monthly Calendar Heatmap)**.
   - Bộ lọc đa chiều, tìm kiếm tức thì và **Xuất báo cáo Excel CSV (UTF-8 BOM)**.
5. **🐖 Hũ Tiết Kiệm Mục Tiêu & Hóa Đơn Định Kỳ**:
   - Theo dõi tiến độ các hũ tiết kiệm lớn kèm hiệu ứng pháo giấy khi nạp tiền.
   - Quản lý lịch thanh toán hóa đơn cố định hàng tháng (Tiền nhà, Điện nước, Internet, Gym...) với nút thanh toán 1 chạm.
6. **🔒 Chế Độ Riêng Tư (Privacy Mode) & Giao Diện Sáng/Tối**:
   - Phím tắt `H` để ẩn toàn bộ số dư (`•••••••• ₫`) khi mở ứng dụng ở nơi công cộng, phím tắt `N` để mở nhanh khung ghi giao dịch.
   - Chuyển đổi tức thì 3 chế độ giao diện ngay trên thanh điều hướng: **Giấy Ấm Huashu (`📜 Giấy Ấm`)**, **Sáng Hiện Đại (`☀️ Sáng Pro`)** và **Tối Chuyên Nghiệp (`🌙 Tối Pro`)**, kèm linh vật đồng hành tương tác có thể bật/tắt hoặc đổi nhân vật 1 chạm.
   - Khởi tạo hoàn toàn sạch **0 giao dịch mẫu (`INITIAL_TRANSACTIONS = []`)** và **4 ví số dư 0 ₫** để người dùng nhập trực tiếp số liệu thực tế.

## 🛠️ Công Nghệ Sử Dụng
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Lucide Icons + Canvas Confetti
- **Backend**: Node.js + Express 5 REST API (`/api/*` tương thích Vercel Serverless Functions)
- **Database**: Cloud PostgreSQL (Prisma Postgres / Neon Serverless Free Tier — Region `ap-southeast-1` Singapore) kèm cơ chế tự động khởi tạo bảng, seed dữ liệu mẫu và Offline-first fallback.

## 🚀 Chạy Tại Máy (Local Development)

```bash
npm install
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3002/api/health`
