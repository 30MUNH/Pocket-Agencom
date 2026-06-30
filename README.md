# Pocket Agencom 🚀

Pocket Agencom là một hệ thống Full-Stack Monorepo hiện đại tích hợp mô hình **SaaS (Marketing Kit Generator bằng AI)**, **Marketplace (Đặt lịch KOL/KOC)**, và **Quản lý nội bộ (Dashboards cho User, Staff, Admin)**.

Dự án được cấu trúc và cấu hình chính xác theo đề xuất tối ưu hóa công nghệ từ Gemini:
- **Backend**: Node.js + Express.js + Prisma ORM + PostgreSQL/Supabase.
- **Frontend**: React + Vite + Tailwind CSS + Zustand + React Router v6.

---

## 📂 Cấu trúc Thư mục & Bản đồ Công nghệ (Tech Mapping)

Cấu trúc thư mục hiện tại của Monorepo được thiết kế để phân tách rõ ràng trách nhiệm giữa Client và Server, đồng thời sẵn sàng mở rộng các module nghiệp vụ phức tạp:

```text
pocket-agencom/
├── backend/                  # BACKEND SERVICE (Node.js & Express API)
│   ├── prisma/               # Database Schema & Migrations (Prisma ORM)
│   │   └── schema.prisma     # Định nghĩa cấu trúc PostgreSQL & Enums
│   ├── src/                  # Mã nguồn chính của Server (Đề xuất phân module)
│   │   ├── controllers/      # Bộ điều hướng xử lý logic nghiệp vụ
│   │   │   ├── auth.js       # Phân quyền & Xác thực người dùng (RBAC)
│   │   │   ├── booking.js    # Quản lý trạng thái Booking (State Machine)
│   │   │   ├── marketing.js  # Tích hợp AI sinh Marketing Kit
│   │   │   └── ticket.js     # Quản lý hỗ trợ kỹ thuật
│   │   ├── routes/           # Định nghĩa các RESTful Endpoints rõ ràng
│   │   ├── services/         # Kết nối API bên thứ 3 (Gemini API, S3 Storage)
│   │   └── middlewares/      # Bộ lọc bảo mật & Kiểm tra quyền hạn (Role Check)
│   ├── index.js              # Entrypoint của Express server (đã cấu hình CORS & Dotenv)
│   ├── .env.example          # Mẫu cấu hình cổng kết nối & Database URL
│   └── package.json          # Quản lý dependencies backend (express, cors, prisma, dotenv)
│
├── frontend/                 # FRONTEND SERVICE (React + Vite App)
│   ├── src/                  # Mã nguồn chính phía Client
│   │   ├── assets/           # Tài nguyên tĩnh (Hình ảnh, Icons)
│   │   ├── components/       # Các UI Components dùng chung (Button, Card, Form...)
│   │   ├── pages/            # 3 khu vực làm việc (Dashboards) riêng biệt
│   │   │   ├── user/         # Dashboard dành cho User (Tạo Marketing Kit, Booking)
│   │   │   ├── staff/        # Dashboard dành cho Staff (Quản lý KOLs, duyệt Booking)
│   │   │   └── admin/        # Dashboard dành cho Admin (Cấu hình hệ thống, phân quyền)
│   │   ├── store/            # Quản lý trạng thái bằng Zustand
│   │   │   └── useStore.js   # Quản lý session đăng nhập, vai trò (role) và multi-step form
│   │   ├── App.css           # Custom styles nếu cần
│   │   ├── index.css         # Điểm tích hợp Tailwind CSS
│   │   ├── App.jsx           # Cấu hình Routing (React Router v6) & Layouts
│   │   └── main.jsx          # Điểm gắn kết React App
│   ├── index.html            # File HTML chính (Đã tối ưu hóa SEO meta tags)
│   ├── tailwind.config.js    # Cấu hình Tailwind CSS (v3) cho Design System đồng nhất
│   ├── postcss.config.js     # Cấu hình xử lý CSS
│   └── package.json          # Dependencies frontend (zustand, react-router-dom, lucide-react)
│
├── .gitignore                # Quản lý loại trừ file ở cấp độ toàn dự án (Monorepo)
└── README.md                 # Tài liệu hướng dẫn & Kiến trúc dự án (File này)
```

---

## 🛠️ Đánh giá & Đối chiếu Cấu trúc với Gợi ý từ Gemini

| Thành phần gợi ý | Trạng thái hiện tại | Giải pháp triển khai cụ thể |
| :--- | :--- | :--- |
| **1. PostgreSQL (Database)** | **Đã sẵn sàng** | Prisma ORM đã được tích hợp trong thư mục `/backend`. Datasource provider trong `schema.prisma` được cấu hình là `postgresql`. Bạn có thể dễ dàng liên kết với cơ sở dữ liệu PostgreSQL cục bộ hoặc Supabase thông qua biến `DATABASE_URL` trong file `.env`. |
| **2. Node.js & Express (Backend)** | **Đã hoàn thành** | File `backend/index.js` đã được thiết lập làm RESTful API server cơ bản với cấu hình CORS (để kết nối chéo cổng) và `express.json()` middleware. Sẵn sàng tích hợp thêm các route riêng biệt cho `/auth`, `/bookings`, `/marketing-plans`. |
| **3. React + Vite (Frontend)** | **Đã hoàn thành** | Dự án được scaffold bằng Vite với template React thuần khiết và tối giản. Đã kiểm tra build production thành công 100%. |
| **4. Tailwind CSS** | **Đã tích hợp** | Tailwind CSS v3 đã được cấu hình trong `tailwind.config.js` để quét toàn bộ file `.jsx` trong `src/` và đã được khai báo ở `src/index.css`. |
| **5. Zustand (State Management)** | **Đã cấu hình** | File `src/store/useStore.js` đã chứa một global store mẫu để quản lý trạng thái, dễ dàng mở rộng để lưu thông tin User Session, Roles (RBAC), và dữ liệu của biểu mẫu nhiều bước (multi-step booking form). |
| **6. React Router v6** | **Đã tích hợp** | `App.jsx` sử dụng `BrowserRouter`, `Routes`, và `Route` từ `react-router-dom` để điều hướng mượt mà giữa trang Dashboard chính và các phân hệ khác. |

---

## 🚀 Hướng dẫn mở rộng các tính năng cốt lõi

### 1. Tích hợp AI (Google Gemini API / OpenAI API)
*   **Vị trí viết code**: `/backend/src/services/aiService.js` hoặc trực tiếp trong controller `/backend/src/controllers/marketing.js`.
*   **Cách thức**: Cài đặt SDK chính thức (`@google/generative-ai` hoặc `openai`) ở backend. Lấy key từ `.env` để gửi prompt tạo Marketing Kit và nhận kết quả JSON. Không bao giờ gửi trực tiếp từ Frontend để tránh rò rỉ API Key.

### 2. Thiết lập State Machine cho Bookings
*   **Vị trí**: `/backend/src/controllers/booking.js`.
*   **Mô tả**: Thiết lập hàm cập nhật trạng thái với các kiểm tra logic chặt chẽ (Ví dụ: Chỉ cho phép chuyển trạng thái `PENDING` -> `APPROVED` bởi Staff/Admin).

### 3. Phân chia Dashboard (RBAC - Role Based Access Control)
*   **Vị trí**: `/frontend/src/pages/` và `/frontend/src/App.jsx`.
*   **Mô tả**: Sử dụng router để tạo các Route bảo vệ (Protected Routes). Đọc trạng thái `role` từ Zustand store `useStore.js` để quyết định cho phép truy cập hay chuyển hướng người dùng về trang đăng nhập.

---

## 🚀 Hướng dẫn Khởi chạy Dự án

### Khởi động nhanh cho cả hai dịch vụ từ thư mục gốc:
Để chạy song song cả 2 dự án một cách thuận tiện nhất, bạn có thể cài đặt package `concurrently` ở cấp độ toàn hệ thống hoặc tại thư mục gốc:
```bash
npm install -g concurrently
concurrently "npm --prefix backend run dev" "npm --prefix frontend run dev"
```
*(Chi tiết cài đặt riêng lẻ từng thư mục đã được liệt kê chi tiết trong tài liệu gốc).*
