# Thanh toán SePay qua VA MBBank

Đã nối trang `/upgrade` với Express và PostgreSQL/Supabase: tạo đơn → QR vào VA → SePay gọi webhook → xác thực, đối soát → lưu gói đã thanh toán → giao diện tự kiểm tra trạng thái mỗi 3 giây.

## 1. Chạy SQL trong Supabase

Mở **SQL Editor → New query**, dán toàn bộ nội dung file này rồi Run:

[`docs/sql/sepay-payments-setup.sql`](sql/sepay-payments-setup.sql)

Đây là file gộp đầy đủ cả hai migration thanh toán. Nếu đã chạy migration đầu, vẫn có thể chạy lại toàn bộ file gộp; các bản ghi thanh toán cũ được giữ nguyên.

Chạy trên database hiện đang chứa bảng **`public.users` của Pocket Agencom**, có `id INTEGER`. Ứng dụng dùng JWT/Prisma riêng, không dùng `auth.users` của Supabase Auth. Không cần tạo Supabase Auth, Edge Function hay public RPC cho webhook này.

SQL tạo bốn bảng và các khóa/index:

| Bảng | Nội dung |
| --- | --- |
| `payment_orders` | Người mua, gói, giá chốt tại lúc tạo đơn, VA, mã chuyển khoản, hạn thanh toán, kết quả |
| `user_subscriptions` | Gói đã thanh toán và thời hạn hiện tại của từng người dùng |
| `sepay_webhook_events` | ID giao dịch SePay duy nhất và kết quả đối soát, kể cả các giao dịch cần kiểm tra |
| `subscription_usage` | Bộ Marketing đã tạo theo user, gói và từng chu kỳ 30 ngày; không giảm khi xóa kế hoạch |

Mỗi migration chạy trong transaction, có thể chạy lại, không xóa dữ liệu cũ. RLS bật và không có policy cho browser đọc/ghi bốn bảng. Backend tiếp tục dùng `DATABASE_URL` hiện có, kết nối bằng role đáng tin cậy có quyền truy cập bảng (thông thường `postgres` trên Supabase). Không đưa database URL hoặc service-role key vào frontend.

Sau khi chạy SQL:

```powershell
cd backend
npx.cmd prisma generate
npm.cmd run dev
```

Nếu Prisma báo không đổi được `query_engine-windows.dll.node`, dừng backend rồi chạy lại `prisma generate`, sau đó khởi động backend.

Nếu đã chạy file bằng Supabase SQL Editor và sau này muốn chuyển sang Prisma Migrate, ghi nhận **riêng migration này** là đã áp dụng:

```powershell
npx.cmd prisma migrate resolve --applied 20261022010000_sepay_va_payments
npx.cmd prisma migrate resolve --applied 20261022020000_payment_checkout_completion
```

Lệnh này dành cho quy trình migration đã có của dự án, không thay thế việc chạy SQL. Không dùng `prisma db push` hoặc seed để cài thanh toán.

## 2. Cấu hình backend local

Thêm vào `backend/.env`; thông tin dưới đây lấy từ ảnh bạn cung cấp:

```dotenv
SEPAY_BANK=MBBank
SEPAY_ACCOUNT_NUMBER=0911266029
SEPAY_ACCOUNT_NAME=LE HUU DUC DUY
SEPAY_VIRTUAL_ACCOUNT=VQRQAMZKV7190
SEPAY_WEBHOOK_AUTH=apikey
SEPAY_WEBHOOK_SECRET=<chuoi-ngau-nhien-it-nhat-32-ky-tu>
```

`SEPAY_ACCOUNT_NUMBER` là tài khoản MBBank gốc. `SEPAY_VIRTUAL_ACCOUNT` là số VA, không phải ID dạng `va_...`. QR chuyển tiền vào **VA**. Mỗi đơn thêm mã riêng dạng **`PA` + 12 chữ số** vào nội dung, ví dụ `PA123456789012`. Đây là một VA dùng chung, không gọi API tạo VA mới theo từng đơn.

Khóa webhook local đã được tạo trong `.env` nếu chưa có; mở file để lấy giá trị `SEPAY_WEBHOOK_SECRET` và nhập đúng giá trị đó tại SePay. Khóa không nằm trong `.env.example`, frontend, SQL hay Git. Đây là khóa xác thực webhook, **không phải API Token dùng để gọi API ngân hàng SePay**.

Frontend local dùng:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Khởi động lại backend sau khi sửa `.env`; khởi động lại Vite nếu sửa `.env` frontend.

## 3. Nhận webhook khi backend chạy localhost

SePay không gọi trực tiếp được `http://localhost:5000`. Dùng gateway local ở cổng 5001 để chỉ công khai endpoint webhook và `/health` kiểm tra kết nối; các API đăng nhập, dữ liệu và tạo đơn không được gateway chuyển tiếp.

1. Giữ backend chạy ở cổng 5000. Trong một terminal khác, mở gateway:

```powershell
npm.cmd run dev:webhook --prefix backend
```

2. Bản `cloudflared.exe` chính thức được tải vào `.local-tools` (gitignored); không cài đặt vào hệ thống. Trong terminal tiếp theo, chạy từ root dự án:

```powershell
.\.local-tools\cloudflared.exe tunnel --no-autoupdate --protocol http2 --url http://127.0.0.1:5001
```

3. Terminal hiển thị URL dạng `https://ten-ngau-nhien.trycloudflare.com`. Webhook URL sẽ là:

```text
https://ten-ngau-nhien.trycloudflare.com/api/payments/webhooks/sepay
```

Giữ backend, gateway và tunnel chạy. URL Quick Tunnel thay đổi khi mở lại; khi đó sửa URL trong SePay. Endpoint public này vẫn yêu cầu khóa webhook hợp lệ. Có thể tải lại công cụ từ [Cloudflare chính thức](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/) nếu clone sang máy khác.

## 4. Tạo webhook trong SePay Dashboard

Vào **Webhooks → Thêm webhook**, cấu hình:

| Trường | Giá trị |
| --- | --- |
| Tên | `Pocket Agencom - VA MBBank` |
| Sự kiện | **Tiền vào** |
| Tài khoản | MBBank **0911266029** |
| VA | **VQRQAMZKV7190** |
| URL | URL HTTPS của backend + `/api/payments/webhooks/sepay` |
| Phương thức | **POST** |
| Content-Type | **application/json** |
| Xác thực | **API Key** |
| API Key | Giá trị `SEPAY_WEBHOOK_SECRET` trong backend |
| Trạng thái | Bật |

SePay gửi header `Authorization: Apikey <key>`. Nhập giá trị key vào ô API Key, không thêm chữ `Apikey` nếu Dashboard tự tạo header.

Để **tắt** bộ lọc “Bỏ qua giao dịch không có mã thanh toán” khi mới thiết lập. Server tự tìm mã `PA` + 12 chữ số trong `content`, kể cả khi trường `code` của SePay là `null`. Có thể bật bộ lọc sau khi đã cấu hình và thử đúng cấu trúc mã thanh toán trong SePay. Không nhầm mã đơn PA với số VA.

Đã hỗ trợ thêm HMAC-SHA256 nếu muốn dùng: đổi `SEPAY_WEBHOOK_AUTH=hmac`, chọn HMAC-SHA256 tại SePay và dùng cùng secret. Server kiểm tra `X-SePay-Timestamp` trong ±5 phút và `X-SePay-Signature: sha256=...` trên **raw JSON bytes**, theo công thức `{timestamp}.{raw_body}`.

## 5. Kết nối với frontend Vercel

`https://pocket-agencom.vercel.app` hiện là frontend. Không dán domain frontend làm webhook nếu `/api/payments/webhooks/sepay` chưa được proxy tới backend. Cấu hình SPA hiện tại sẽ trả HTML cho URL đó.

Để frontend Vercel dùng backend đang chạy qua tunnel:

- Vercel frontend: đặt `VITE_API_URL=https://ten-ngau-nhien.trycloudflare.com/api` rồi build/deploy lại khi bạn sẵn sàng.
- Backend: `FRONTEND_URL` cần chứa `https://pocket-agencom.vercel.app`; có thể thêm `http://localhost:5173`, ngăn cách bằng dấu phẩy.
- Khi chạy production lâu dài, dùng backend có URL HTTPS cố định và đổi cả `VITE_API_URL` lẫn webhook URL sang backend đó. Giữ khóa ở backend, không tạo biến `VITE_SEPAY_WEBHOOK_SECRET`.

Code đã được sửa ở local; chưa push hoặc deploy lên Vercel và chưa tạo webhook trong tài khoản SePay. Chủ dự án đã cho phép chạy file SQL gộp trên Supabase hiện tại; cả bốn bảng thanh toán đã tạo thành công, RLS bật và số user/kế hoạch hiện có không thay đổi tại thời điểm cài schema.

## 6. Quy tắc xác nhận và đối soát

- Giá server: Starter **199.000đ**, Pro **499.000đ**, Advanced **890.000đ**. Mỗi kỳ là **30 ngày**. Số tiền/gói do frontend tự sửa không thay đổi giá server.
- Chỉ user thật, đang active, role `user` mới mua được; tài khoản demo không được tạo đơn tiền thật.
- Mỗi user có một đơn chờ thanh toán còn hạn. Bấm lại hoặc tải lại trang sẽ dùng lại đơn. Nếu chưa chuyển tiền, bấm hủy đơn, xác nhận chưa chuyển tiền, rồi chọn gói khác. Đơn đã thanh toán hoặc có giao dịch cần đối soát không được hủy.
- Đơn có hạn **15 phút**. Hết hạn chỉ là trạng thái tính từ thời gian; SQL giữ bản ghi pending để có thể đối soát giao dịch tới trễ.
- Chỉ tự kích hoạt khi xác thực webhook hợp lệ, `transferType=in`, đúng ngân hàng + tài khoản gốc + VA, một mã đơn duy nhất, **đúng toàn bộ số tiền trong một giao dịch** và thời điểm ngân hàng ghi nhận nằm trong hạn đơn.
- Nếu webhook giao trễ nhưng thời điểm ngân hàng ghi nhận đúng hạn, vẫn xác nhận. Chuyển thiếu, thừa, nhiều lần cộng dồn hoặc thanh toán sau hạn cần xử lý đối soát; không tự kích hoạt và không tự hoàn tiền.
- `transaction_id` là khóa duy nhất. Ghi nhận sự kiện, đánh dấu paid và cập nhật subscription trong cùng transaction; lỗi database rollback toàn bộ để SePay retry an toàn.
- Gia hạn cùng gói đang có hiệu lực cộng thêm 30 ngày. Đổi gói bắt đầu kỳ 30 ngày mới từ lúc xác nhận và thay thế thời hạn gói cũ; giao diện thông báo trước khi tạo QR.
- Không có nút “Tôi đã thanh toán” để tự đánh dấu paid. Giao diện chỉ đọc trạng thái do backend xác nhận.
- Đơn hủy mà vẫn có tiền vào được đánh dấu `review_cancelled`; webhook cũ đến trễ sau một lần thanh toán đổi gói mới hơn được đánh dấu `review_out_of_order`, không tự thay thế gói mới.

Theo lựa chọn của chủ dự án, user chưa mua gói hoặc gói hết hạn không được tạo bộ Marketing mới; dữ liệu đã tạo vẫn đọc được. Backend kiểm tra trước khi gọi AI, trả 402 với mã `SUBSCRIPTION_REQUIRED` hoặc `SUBSCRIPTION_QUOTA_EXCEEDED` và đường dẫn `/upgrade`.

Starter được tạo 3 bộ thành công mỗi kỳ 30 ngày. Bộ đếm lưu bền vững, cập nhật cùng transaction tạo MarketingPlan; lỗi AI không tăng, lỗi lưu rollback, xóa kế hoạch không hoàn lại lượt. Gia hạn sớm cùng gói kéo dài thời hạn nhưng không làm mới lượt của kỳ hiện tại; lượt được làm mới khi sang kỳ 30 ngày kế tiếp. Pro/Advanced không giới hạn số bộ; giới hạn an toàn AI hằng ngày của dự án vẫn áp dụng cho mọi gói.

Kịch bản video trong bộ mới chỉ có từ Pro trở lên. Advanced thêm yêu cầu playbook 30 ngày cá nhân hóa thành ít nhất 4 giai đoạn trong prompt. Các trang dữ liệu, lịch sử và thao tác nội dung hiện có được giữ nguyên. Hỗ trợ email/ưu tiên và phân tích/đa kênh sử dụng các chức năng hiện có; chưa có quy trình SLA hỗ trợ hoặc bộ máy tự đăng đa kênh mới trong lần tích hợp này.

Các giao dịch không khớp vẫn được lưu và trả `{"success":true}` để ngừng retry vô ích. Lỗi xác thực trả 401; payload sai trả 400; lỗi database trả 500 để retry. Kiểm tra trong SQL Editor:

```sql
SELECT transaction_id, payment_code, amount, outcome, order_id, transaction_at, created_at
FROM public.sepay_webhook_events
ORDER BY created_at DESC
LIMIT 50;

SELECT id, user_id, plan_id, payment_code, amount, status, expires_at, paid_at
FROM public.payment_orders
ORDER BY created_at DESC
LIMIT 50;

SELECT user_id, plan_id, starts_at, expires_at, last_order_id
FROM public.user_subscriptions
ORDER BY updated_at DESC;
```

Các outcome bắt đầu `review_` cần kiểm tra thủ công; `unmatched_code`/`unmatched_order` không tìm thấy đơn hợp lệ. Giao diện hiển thị hướng dẫn đối soát và liên kết sang form hỗ trợ đã điền mã đơn, không tự gửi yêu cầu. Không đánh dấu paid bằng tay chỉ để bỏ lỗi webhook.

## 7. API

### POST `/api/payments/orders`

JWT user thật. Body: `{"planId":"starter"}` (`starter`, `pro`, `advanced`). Trả 201 envelope ứng dụng `{success,data,error}` với đơn và QR URL. Có thể trả lại đơn còn hạn đã có. 400 gói sai, 403 demo/role sai, 409 còn đơn khác, 503 thiếu cấu hình.

### GET `/api/payments/orders/:id`

JWT của người mua. Trả đơn với `pending`, `expired`, `cancelled` hoặc `paid`, kèm `review` nếu cần đối soát. Người khác nhận 404; UUID không hợp lệ nhận 400. Không trả khóa webhook.

### GET `/api/payments/billing`

JWT của người mua. Trả `subscription` đang có hiệu lực (hoặc `null`), `access` với hạn mức bộ Marketing và tối đa 10 đơn gần nhất. Dùng để phục hồi checkout sau reload và xem kết quả thanh toán.

### GET `/api/payments/catalog`

Public, không truy vấn database. Trả danh sách gói, giá, thời hạn, quyền lợi và số bộ từ backend; không trả cấu hình tài khoản hoặc khóa. Trang nâng cấp dùng danh sách này để đồng bộ giá.

### GET `/api/payments/access`

JWT user. Trả `canGenerate`, gói hiện tại, kỳ sử dụng, số bộ đã dùng/còn lại và quyền lợi. Tài khoản demo luôn có `canGenerate=false`.

### POST `/api/payments/orders/:id/cancel`

JWT của người mua, body `{"confirmUnpaid":true}`. Chỉ hủy đơn chưa trả tiền và chưa có giao dịch cần đối soát. Trả đơn có trạng thái `cancelled`. Đơn paid hoặc cần đối soát trả 409; người khác nhận 404.

### POST `/api/payments/webhooks/sepay`

Không dùng JWT user. Yêu cầu API Key hoặc HMAC đúng cấu hình. Payload theo SePay, gồm `id`, `gateway`, `transactionDate` giờ Việt Nam, `accountNumber`, `subAccount`, `code`, `content`, `transferType`, `transferAmount`, `referenceCode`. Thành công hoặc đã đối soát: HTTP 200, đúng body `{"success":true}`.

## 8. Kiểm thử

```powershell
cd backend
npm.cmd run test:payments
npm.cmd test
cd ../frontend
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Test thanh toán tự tạo PostgreSQL PGlite trong RAM, kết nối qua Prisma thật, kiểm tra cả hai migration/RLS, giá, ownership, xác thực API Key/HMAC, gửi lặp, sai VA/tiền/thời gian, cancellation, renewal, thứ tự webhook và rollback. Test quyền gói kiểm tra user chưa mua bị chặn trước AI, Starter không vượt 3 bộ, gia hạn sớm không reset lượt, kỳ mới reset và Pro/Advanced không giới hạn số bộ. Không kết nối Supabase thật. PGlite là một kết nối PostgreSQL; test gửi đồng thời được tuần tự qua pool, không thay thế kiểm thử tải với nhiều kết nối trên production.

Đã kiểm tra API live bằng tài khoản QA riêng: billing 200, user chưa mua tạo bộ Marketing bị chặn 402, tạo đơn Pro 499.000đ trả 201, QR SePay trả PNG 200 và hủy đơn thành công. Tài khoản QA được chuyển sang `archived`; đơn hủy được giữ để đối soát. Không tạo webhook tiền vào giả trên Supabase thật, không chuyển tiền và không kích hoạt gói thật trong lần kiểm tra này.

Chưa kiểm chứng giao dịch ngân hàng thật. Sau khi cấu hình webhook, đăng nhập tài khoản đã đăng ký thật và mở `/upgrade`. Dữ liệu tài khoản/VA và webhook của Test mode phải cùng môi trường, dùng database test riêng để không kích hoạt gói thật từ tiền mô phỏng.

Lần kiểm tra khi hoàn thiện: cả DATABASE_URL (6543) và DIRECT_URL (5432) đã SELECT 1 thành công; schema thanh toán đã được cài. Thiếu schema trên môi trường khác trả 503 `PAYMENT_SETUP_REQUIRED`; giao diện hiển thị lý do ngay cạnh nút tạo QR thay vì khóa nút im lặng. Không có trình duyệt điều khiển khả dụng để kiểm tra giao diện trực quan hoặc thao tác Dashboard SePay.

Tài liệu đối chiếu: [Payload và phản hồi SePay](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook), [Xác thực](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc), [Tạo webhook](https://developer.sepay.vn/vi/sepay-webhooks/tao-webhook), [QR thanh toán](https://developer.sepay.vn/vi/sepay-webhooks/tao-qr-va-form-thanh-toan).
