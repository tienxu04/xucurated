// shared_admin.js - Người gác cổng cho toàn bộ khu vực Admin

console.log("ALARM: File shared_admin đã được load!");

document.addEventListener('DOMContentLoaded', () => {
    const authGate = document.getElementById('auth-gate');
    // Gộp toàn bộ form/bảng của trang vào một div có id="main-content" để dễ giấu
    const mainContent = document.getElementById('main-content'); 

    function toggleAuthGate(session) {
        if (!session) {
            // KHÁCH: Hiện cổng Login, giấu nhẹm Form/Table
            if (authGate) authGate.classList.remove('hidden');
            if (mainContent) mainContent.classList.add('hidden');
        } else {
            // CHỦ NHÀ: Giấu Login, bung Form/Table ra
            if (authGate) authGate.classList.add('hidden');
            if (mainContent) mainContent.classList.remove('hidden');
            
            // Ra lệnh khởi chạy logic riêng của từng trang
            if (typeof initPageLogic === 'function') {
                initPageLogic();
            }
        }
    }

    // 1. Check ngay khi vừa load web
    _supabase.auth.getSession().then(({ data: { session } }) => {
        toggleAuthGate(session);
    });

    // 2. Lắng nghe mọi biến động (khi bấm Login xong nó tự nhảy vào đây)
    _supabase.auth.onAuthStateChange((_event, session) => {
        toggleAuthGate(session);
    });
});

// Hàm xử lý khi bấm nút Đăng nhập
window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    
    console.log("Đang gửi đăng nhập với:", email, pass); // <-- Thêm dòng này

    const { error } = await _supabase.auth.signInWithPassword({ email, pass });
    
    if (error) {
       // alert("Sai thông tin đăng nhập!");
       // In thẳng cái lỗi của Supabase ra màn hình và console
        alert("Supabase báo lỗi: " + error.message);
        console.error("Chi tiết lỗi 400:", error);
    } else {
        // Đăng nhập đúng, onAuthStateChange ở trên sẽ tự bắt tín hiệu và mở cổng, hoặc cứ reload cho chắc
        location.reload(); 
    }
};





// Hàm xử lý Đăng xuất (Gắn vào nút Logout nếu sếp có)
window.handleLogout = async () => {
    await _supabase.auth.signOut();
    location.reload();
};