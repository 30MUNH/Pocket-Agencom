# Frontend–Backend Integration Guide

## API Base URL

Set `VITE_API_URL=http://localhost:5000/api` in `frontend/.env`.

## Navigation Mapping (Button → API Endpoint)

| UI Location | Button / Action | Method | Endpoint | Role |
|---|---|---|---|---|
| LoginPage | Đăng nhập | POST | `/api/auth/login` | Public |
| RegisterPage | Tạo tài khoản | POST | `/api/auth/register` | Public |
| Header | Đăng xuất | — | Clears JWT from store | All |
| GenerateMarketingKit | Tạo kế hoạch AI | POST | `/api/marketing-plans/generate` | user |
| MarketingResult | Lưu kế hoạch | POST | `/api/marketing-plans/:id/save` | user |
| MyPlans | Xóa kế hoạch | DELETE | `/api/marketing-plans/:id` | user |
| MyPlans | Xem chi tiết | GET | `/api/marketing-plans/:id` | user |
| KOLMarketplace | Load creators | GET | `/api/kols` | Authenticated |
| KOLDetailPage | Bắt đầu Đặt lịch | — | Navigates to book form | user |
| BookCampaignPage | Gửi yêu cầu đặt lịch | POST | `/api/bookings` | user |
| BookingConfirmationPage | — | GET | `/api/bookings/:id` | user |
| MyBookings | Load list | GET | `/api/bookings` | user |
| BookingDetailPage | — | GET | `/api/bookings/:id` | user |
| StaffBookingManagement | Bắt đầu duyệt | PATCH | `/api/bookings/:id/status` → `staff_reviewing` | staff |
| StaffBookingManagement | Duyệt | PATCH | `/api/bookings/:id/status` → `approved` | staff |
| StaffBookingManagement | Xác nhận | PATCH | `/api/bookings/:id/status` → `confirmed` | staff |
| StaffBookingManagement | Từ chối | PATCH | `/api/bookings/:id/status` → `cancelled` | staff |
| PlanReviewPage | Duyệt Kế hoạch | PATCH | `/api/marketing-plans/:id/review` `{ action: "approve" }` | staff |
| PlanReviewPage | Yêu cầu Sửa | PATCH | `/api/marketing-plans/:id/review` `{ action: "need_revision" }` | staff |
| PlanReviewPage | Đánh dấu Đã xem | PATCH | `/api/marketing-plans/:id/review` `{ action: "reviewed" }` | staff |

## State Transitions (Database Diagram)

### Booking (`kol_bookings.status`)

```
pending → staff_reviewing → approved → confirmed → in_progress → content_submitted → completed
         ↘ need_more_info ↗                              ↘ cancelled (from most states)
```

### Marketing Plan (`marketing_plans.status`)

```
draft → saved → reviewed → approved
              ↘ need_revision → saved (re-submit)
```

## Critical User Flows to Verify

### 1. Auth Flow
1. Visit `/register` → create account → JWT stored → redirect `/dashboard`
2. Logout → redirect `/login`
3. Login as `user@pocketagencom.vn` / `password123` → user dashboard
4. Login as `staff@pocketagencom.vn` → staff dashboard (marketplace hidden)
5. Login as `admin@pocketagencom.vn` → admin dashboard

### 2. Marketing Plan Flow
1. Login as user → `/marketing-kit`
2. Fill form → Submit → `POST /marketing-plans/generate`
3. Redirect `/marketing-kit/result?planId=X` → view AI content
4. Click **Lưu kế hoạch** → `POST /marketing-plans/X/save` → status `saved`
5. Redirect `/plans` → plan appears in list
6. Login as staff → open plan review `/staff/plan-review/X`
7. **Duyệt** → status `approved`, user receives notification

### 3. KOL Booking Flow
1. Login as user → `/marketplace` → `GET /kols`
2. Click creator → `/marketplace/kol/:id` → `GET /kols/:id`
3. **Bắt đầu Đặt lịch** → `/marketplace/book/:id`
4. Fill form → Submit → `POST /bookings` (status `pending`)
5. Redirect `/bookings/confirmation?bookingId=X`
6. View `/bookings` → booking listed
7. Login as staff → `/staff/bookings`
8. Approve flow: `pending` → `staff_reviewing` → `approved` → `confirmed`

### 4. Role Access
- User cannot access `/admin/*` or `/staff/*` (redirect to dashboard)
- Staff cannot access `/marketplace`, `/marketing-kit`, `/bookings` (user routes)
- Admin limited to dashboard, user management, KOL management

### 5. Error Feedback
- All mutation buttons show loading spinners during API calls
- Failed requests display toast notifications (top-right)
- 401 responses auto-logout and redirect to login

## Test Credentials (after seed)

| Role | Email | Password |
|---|---|---|
| User | user@pocketagencom.vn | password123 |
| Staff | staff@pocketagencom.vn | password123 |
| Admin | admin@pocketagencom.vn | password123 |
