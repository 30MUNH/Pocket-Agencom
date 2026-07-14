# Hướng dẫn Deploy dự án Pocket Agencom (Full-Stack)

Tài liệu này hướng dẫn chi tiết cách triển khai (deploy) ứng dụng của bạn từ kho lưu trữ GitHub lên môi trường sản phẩm (production). Dự án gồm 3 phần cần chạy:
1. **Database**: PostgreSQL (Khuyên dùng **Supabase** hoặc **Neon**).
2. **Backend**: Node.js/Express API & Prisma ORM (Khuyên dùng **Render** hoặc **Railway**).
3. **Frontend**: React/Vite SPA (Khuyên dùng **Vercel** hoặc **Netlify**).

---

## 1. Chuẩn bị Cơ sở dữ liệu (PostgreSQL Database)

Nếu bạn đã có một cơ sở dữ liệu PostgreSQL trực tuyến (như Supabase hoặc Neon), hãy chuẩn bị các chuỗi kết nối:
- **`DATABASE_URL`**: Chuỗi kết nối qua cổng Transaction/Session Pooling (ví dụ: cổng 6543 hoặc 5432).
- **`DIRECT_URL`**: Chuỗi kết nối trực tiếp đến cơ sở dữ liệu để thực hiện di chuyển schema (migration) bằng Prisma.

Nếu chưa có, bạn có thể tạo một dự án PostgreSQL miễn phí trên **[Supabase](https://supabase.com/)** hoặc **[Neon](https://neon.tech/)** và sao chép các chuỗi kết nối trong phần Settings.

---

## 2. Triển khai Backend (Node.js/Express & Prisma) trên Render

Render kết nối trực tiếp với GitHub và tự động deploy mỗi khi bạn push code mới lên nhánh `main`.

### Các bước thực hiện:
1. Đăng nhập vào **[Render.com](https://render.com/)** bằng tài khoản GitHub của bạn.
2. Nhấn nút **New +** và chọn **Web Service**.
3. Kết nối với repo GitHub của dự án `Pocket-Agencom`.
4. Điền các cấu hình cơ bản:
   - **Name**: `pocket-agencom-backend`
   - **Root Directory**: `backend` (Rất quan trọng vì mã nguồn backend nằm ở thư mục con).
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node index.js`
5. Nhấn chọn mục **Advanced** để cấu hình các biến môi trường (**Environment Variables**):
   - `PORT`: `5000` (hoặc để Render tự cấp).
   - `DATABASE_URL`: *Chuỗi kết nối DB của bạn*
   - `DIRECT_URL`: *Chuỗi kết nối DB trực tiếp (nếu dùng Supabase)*
   - `JWT_SECRET`: *Một chuỗi ký tự ngẫu nhiên để mã hóa JWT token*
   - `GEMINI_API_KEY`: *API Key của Google Gemini*
6. Nhấp **Create Web Service**.

> [!IMPORTANT]
> **Di chuyển Database Schema trên Production:**
> Để đồng bộ cấu trúc database Prisma của bạn lên cơ sở dữ liệu mới, chạy lệnh dưới đây từ máy tính cá nhân của bạn (đảm bảo file `.env` local đang kết nối tới database production):
> ```bash
> cd backend
> npx prisma db push
> # hoặc chạy seed dữ liệu mẫu:
> npm run prisma db seed
> ```

---

## 3. Triển khai Frontend (Vite + React) trên Vercel

Vercel là nền tảng tốt nhất cho các dự án React/Vite, hỗ trợ CDN nhanh và deploy tự động thông qua GitHub.

### Các bước thực hiện:
1. Đăng nhập vào **[Vercel.com](https://vercel.com/)** bằng tài khoản GitHub.
2. Chọn **Add New...** -> **Project**.
3. Chọn repo GitHub `Pocket-Agencom` của bạn.
4. Cấu hình dự án:
   - **Framework Preset**: Chọn **Vite** (Vercel thường tự nhận diện).
   - **Root Directory**: `frontend` (Rất quan trọng vì code frontend nằm ở thư mục con này).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Trong phần **Environment Variables**, thêm các biến sau:
   - **`VITE_API_URL`**: URL của Backend bạn vừa deploy trên Render (ví dụ: `https://pocket-agencom-backend.onrender.com/api`).
6. Nhấn nút **Deploy**.

---

## 4. Cấu hình Cross-Origin Resource Sharing (CORS)

Mặc định, backend của bạn cho phép tất cả các nguồn truy cập qua CORS (`app.use(cors())`). Tuy nhiên trên production, để bảo mật hơn, bạn nên giới hạn chỉ cho phép tên miền Frontend trên Vercel gọi API.

Nếu bạn muốn giới hạn CORS trong tương lai, hãy cấu hình ở file `backend/index.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

---

## 5. Quy trình cập nhật Code sau này
Khi bạn push code mới lên nhánh `main` trên GitHub:
1. **Vercel** sẽ tự động bắt sự kiện và build lại Frontend.
2. **Render** sẽ tự động bắt sự kiện, cài lại dependencies, chạy tạo Prisma client và khởi động lại Backend.
