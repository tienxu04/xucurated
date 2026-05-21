// edit_item_logic.js
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra session từ trình duyệt
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session) {
        // Cổng khóa: Hiện khung Login
        document.getElementById('auth-gate').classList.remove('hidden');
    } else {
        // Cổng mở: Bóc tách ID từ URL (?id=...) và khởi chạy trang Edit
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');
        
        if (!itemId) {
            alert("Không tìm thấy ID của Item cần chỉnh sửa!");
            window.location.href = 'admin.html';
            return;
        }
        
        // Gọi hàm nạp dữ liệu thực tế
        loadItemData(itemId); 
    }
});

// Hàm handleLogin dùng chung cho hệ thống quản trị
window.handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    const { error } = await _supabase.auth.signInWithPassword({ email, pass });
    
    if (error) {
        alert("Sai thông tin đăng nhập!");
    } else {
        location.reload(); 
    }
};

// ==========================================
// NẠP DỮ LIỆU CŨ LÊN FORM
// ==========================================
async function loadItemData(id) {
    // Lấy thông tin Item
    const { data: item } = await _supabase.from('items').select('*').eq('id', id).single();
    // Lấy sách
    const { data: books } = await _supabase.from('books').select('*').eq('item_id', id).order('vol_number');

    if (!item) {
        alert("Item không tồn tại hoặc đã bị xóa!");
        window.location.href = 'admin.html';
        return;
    }

    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-name').value = item.name;
    // Nạp chuẩn xác cột bio từ DB
    document.getElementById('edit-bio').value = item.bio || '';

    // Hiển thị sách cũ
    const booksContainer = document.getElementById('existing-books-list');
    if (books && books.length > 0) {
        booksContainer.innerHTML = books.map(book => `
            <div class="relative group border border-gray-200">
                <img src="${book.cover_url}" class="w-full h-24 object-cover opacity-80 group-hover:opacity-40 transition-opacity">
                <span class="absolute top-1 left-1 bg-black text-white text-[9px] px-1 font-mono">VOL.${book.vol_number}</span>
                <button type="button" onclick="deleteSingleBook('${book.id}')" class="absolute inset-0 m-auto w-8 h-8 bg-red-600 text-white text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity">X</button>
            </div>
        `).join('');
    } else {
        booksContainer.innerHTML = '<p class="text-xs text-gray-400 italic col-span-full">No books attached.</p>';
    }

    document.getElementById('loading-mask').classList.add('hidden');
    document.getElementById('edit-item-form').classList.remove('hidden');
}

// ==========================================
// CÁC HÀM XỬ LÝ (XÓA SÁCH, THÊM Ô LINK, LƯU DB)
// ==========================================

// XÓA 1 CUỐN SÁCH CŨ (Action ngay)
window.deleteSingleBook = async function(bookId) {
    if(confirm("Xóa cuốn sách này?")) {
        await _supabase.from('books').delete().eq('id', bookId);
        loadItemData(document.getElementById('edit-id').value); // Reload UI
    }
}

// THÊM Ô NHẬP LINK MỚI
window.addEditInstaRow = function() {
    const container = document.getElementById('insta-container');
    const row = document.createElement('div'); row.className = 'flex gap-2 insta-row';
    row.innerHTML = `<input type="text" class="flex-1 border border-gray-300 p-3 text-sm focus:outline-none focus:border-black insta-input" placeholder="Paste another link..."><button type="button" class="w-12 border border-red-200 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white font-bold text-lg" onclick="this.parentElement.remove()">-</button>`;
    container.appendChild(row);
}

// LƯU TOÀN BỘ CHỈNH SỬA
window.updateItem = async function() {
    const id = document.getElementById('edit-id').value.trim();
    const name = document.getElementById('edit-name').value.trim();
    const bioValue = document.getElementById('edit-bio').value.trim();

    if (!id) {
        alert("Lỗi: Không tìm thấy ID hợp lệ để update!");
        return;
    }

    try {
        // 1. Cập nhật Info - Dùng đúng cột 'bio'
        const { data, error: itemError } = await _supabase.from('items')
            .update({ 
                name: name, 
                bio: bioValue 
            })
            .eq('id', id)
            .select();

        if (itemError) throw itemError;

        if (!data || data.length === 0) {
            throw new Error(`Không có dòng nào trong DB được cập nhật. Vui lòng check lại ID: ${id}`);
        }

        // 2. Thêm sách mới (nếu có nhập link)
        const instaInputs = document.querySelectorAll('.insta-input');
        const bookInserts = [];
        
        const { data: currentBooks } = await _supabase.from('books').select('vol_number').eq('item_id', id);
        let nextVol = currentBooks && currentBooks.length > 0 ? Math.max(...currentBooks.map(b => b.vol_number)) + 1 : 1;

        instaInputs.forEach(input => {
            const rawUrl = input.value.trim();
            const match = rawUrl.match(/\/p\/([a-zA-Z0-9__-]+)/);
            if (match) {
                bookInserts.push({
                    title: `Added Book - ${name}`,
                    item_id: id,
                    instagram_embed_id: match[1],
                    original_url: rawUrl,
                    cover_url: `https://images.weserv.nl/?url=https://www.instagram.com/p/${match[1]}/media/?size=l`,
                    vol_number: nextVol++
                });
            }
        });

        if (bookInserts.length > 0) {
            const { error: bookError } = await _supabase.from('books').insert(bookInserts);
            if (bookError) throw bookError;
        }

        alert('Update thành công!');
        window.location.href = 'admin.html';

    } catch (err) {
        alert("Lỗi hệ thống từ Supabase: " + err.message);
        console.error("Chi tiết lỗi:", err);
    }
}
