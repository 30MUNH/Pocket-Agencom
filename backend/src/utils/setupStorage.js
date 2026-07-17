async function setupStorage() {
  console.log('💡 Hướng dẫn Supabase Storage:');
  console.log('   1. Hãy tạo một public bucket tên là "avatars" trên Supabase Dashboard.');
  console.log('   2. Thêm policy RLS cho phép SELECT và INSERT (upload) cho bucket "avatars".');
}

module.exports = setupStorage;
