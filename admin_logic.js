// admin_logic.js - BẢN SẠCH (CHỈ CHỨA LOGIC TRANG ADMIN)

// 1. Hàm này do shared_admin.js TỰ ĐỘNG GỌI sau khi check Auth thành công
function initPageLogic() {
    console.log("🔓 Cổng đã mở! Đang load danh sách database...");
    loadAdminItems();
}

// 2. KÉO DATA VÀ RENDER DANH SÁCH
async function loadAdminItems() {
    const listContainer = document.getElementById('admin-item-list');
    
    // Gọi thẳng biến _supabase toàn cục
    const { data: items, error } = await _supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        if(listContainer) listContainer.innerHTML = `<p class="text-red-500 text-sm">${error.message}</p>`;
        return;
    }

    const countEl = document.getElementById('total-count');
    if (countEl) countEl.innerText = `${items.length} Items`;

    if (items.length === 0) {
        if(listContainer) listContainer.innerHTML = `<div class="p-8 text-center text-gray-400 border border-dashed text-sm">No items found.</div>`;
        return;
    }

    if(listContainer) {
        listContainer.innerHTML = items.map(item => `
            <div class="group flex items-center justify-between bg-white border border-gray-100 p-4 hover:border-black transition-colors">
                
                <div class="flex items-center gap-4">
                    <img src="${item.avatar_url || 'https://via.placeholder.com/150'}" class="w-10 h-10 object-cover ${item.item_type === 'author' ? 'rounded-full' : 'rounded-sm'} border">
                    <div>
                        <h3 class="font-bold text-sm text-gray-900">${item.name}</h3>
                        <p class="text-[10px] text-gray-400 font-mono uppercase mt-0.5">Type: ${item.item_type}</p>
                    </div>
                </div>

                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <a href="edit_item.html?id=${item.id}" class="bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors">
                        Edit
                    </a>
                    <button onclick="deleteItem('${item.id}', '${item.name}')" class="bg-red-50 text-red-600 px-3 py-1.5 text-xs font-bold uppercase hover:bg-red-600 hover:text-white transition-colors">
                        Delete
                    </button>
                </div>
                
            </div>
        `).join('');
    }
}

// 3. XÓA ITEM VÀ TOÀN BỘ SÁCH LIÊN QUAN
window.deleteItem = async function(id, name) {
    const confirmed = confirm(`WARNING: Bạn có chắc chắn muốn xóa vĩnh viễn [${name}] và TOÀN BỘ SÁCH của họ khỏi database?`);
    
    if (confirmed) {
        try {
            // 1. Xóa toàn bộ sách liên kết trước để không kẹt Foreign Key
            await _supabase.from('books').delete().eq('item_id', id);
            
            // 2. Xóa Item
            const { error } = await _supabase.from('items').delete().eq('id', id);
            if (error) throw error;

            loadAdminItems(); // Reload danh sách mềm mượt không cần F5
            
        } catch (err) {
            alert("Lỗi khi xóa: " + err.message);
        }
    }
};