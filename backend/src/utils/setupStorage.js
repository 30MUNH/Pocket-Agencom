async function setupStorage() {
  console.log('💡 Cấu hình Supabase Storage:');
  console.log('   1. Tạo public bucket "avatars" và "campaign-assets" nếu ứng dụng cần URL ảnh công khai.');
  console.log('   2. Chỉ cấu hình SUPABASE_SERVICE_ROLE_KEY ở backend; không đưa khóa này vào frontend.');
  console.log('   3. API xác thực người dùng và lưu tệp trong thư mục user-<id>; backend service role bỏ qua RLS.');
  console.log('   4. Không thêm policy INSERT cho anon/authenticated. Public bucket cho phép mọi người đọc ảnh.');
}

module.exports = setupStorage;
