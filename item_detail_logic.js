// item_detail_logic.js

// ==========================================
// CƠ CHẾ QUẢN LÝ THEME (CHẠY TRƯỚC TIÊN)
// ==========================================
window.setTheme = function(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('selected-theme', themeName);
};

function initTheme() {
    const savedTheme = localStorage.getItem('selected-theme') || 'cream';
    setTheme(savedTheme);
}
initTheme(); // Kích hoạt ngay khi file JS vừa load để tránh chớp trắng màn hình
// ==========================================

// Kéo xuống dưới là các đoạn code cũ của sếp (supabase, fetchItemDetail...) giữ nguyên!

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Lấy ID từ URL Query Parameter (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) {
        showError("Missing Item Identity in URL.");
        return;
    }

    // 2. Chạy hàm hốt dữ liệu công khai
    loadItemSpecification(itemId);
});

async function loadItemSpecification(itemId) {
    const statusMsg = document.getElementById('status-message');
    const contentArea = document.getElementById('item-content');

    try {
        // TRUY VẤN A: Lấy thông tin gốc của Item
        const { data: item, error: itemErr } = await _supabase
            .from('items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (itemErr || !item) throw new Error("Item not found in studio records.");

        // TRUY VẤN B: Lấy toàn bộ sách kết nối với Item này qua `item_id`
        const { data: books, error: booksError } = await _supabase
            .from('books')
            .select('*')
            .eq('item_id', itemId)
            .order('vol_number', { ascending: true });

        if (booksError) throw booksError;

        // 3. ĐỔ DỮ LIỆU CHỮ LÊN UI
        document.getElementById('item-title-name').innerText = item.name;
        document.getElementById('item-description').innerText = item.bio || 'No descriptive archives provided for this entry.';
        document.getElementById('item-type-badge').innerText = item.item_type;
        document.getElementById('gallery-count').innerText = `${books ? books.length : 0} VOL`;

        // 4. BIẾN HÌNH LAYOUT DỰA TRÊN ITEM TYPE
        const thumbImg = document.getElementById('item-thumbnail');
        const dotIndicator = document.getElementById('header-dot');
        const galleryTitle = document.getElementById('gallery-title');

        thumbImg.src = item.avatar_url || 'https://via.placeholder.com/150?text=No+Image';

        if (item.item_type === 'author') {
            thumbImg.classList.add('rounded-full'); // Avatar tròn cho tác giả
            dotIndicator.className = "w-2 h-2 rounded-full bg-green-500"; // Chấm xanh lá
            galleryTitle.innerText = "Author's Curated Publications";
        } else if (item.item_type === 'bookset') {
            thumbImg.classList.add('rounded-sm'); // Ảnh vuông cho bộ sách
            dotIndicator.className = "w-2 h-2 rounded-full bg-blue-500"; // Chấm xanh dương
            galleryTitle.innerText = "Included Volumes in Set";
        } else {
            thumbImg.classList.add('rounded-sm'); // Ảnh vuông cho Collection
            dotIndicator.className = "w-2 h-2 rounded-full bg-purple-500"; // Chấm tím
            galleryTitle.innerText = "Theme Collection Exhibition";
        }

        // 5. RENDER LƯỚI SÁCH (GALLERY GRID)
        const grid = document.getElementById('books-detail-grid');
        
        if (!books || books.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-400 italic text-xs border border-dashed border-gray-200 bg-white">
                    No artworks have been wired to this specific item yet.
                </div>
            `;
        } else {
            grid.innerHTML = books.map(book => {
                const targetUrl = book.original_url || `https://www.instagram.com/p/${book.instagram_embed_id}/`;
                
                return `
                <div 
                    class="bg-white border border-gray-100 p-3 shadow-sm hover:border-black transition-all flex flex-col justify-between group cursor-pointer"
                    onclick="window.open('${targetUrl}', '_blank')"
                >
                    <div class="aspect-[3/4] w-full overflow-hidden bg-gray-50 relative border border-gray-50">
                        <img src="${book.cover_url}" alt="${book.title}" class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500">
                        <span class="absolute top-2 left-2 bg-black text-white font-mono text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                            VOL.${book.vol_number}
                        </span>
                    </div>
                    
                    <div class="mt-3 space-y-1">
                        <h4 class="font-bold text-xs text-gray-800 truncate" title="${book.title}">${book.title}</h4>
                        <div class="flex items-center justify-between pt-1 border-t border-gray-50 text-[10px] text-gray-400 font-mono">
                            <span>ID: ${book.instagram_embed_id}</span>
                            <span class="font-bold text-blue-500 uppercase">Insta ↗</span>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }

        // Tắt loading, mở màn triển lãm
        statusMsg.classList.add('hidden');
        contentArea.classList.remove('hidden');

    } catch (err) {
        showError(err.message);
    }
}

function showError(msg) {
    const statusMsg = document.getElementById('status-message');
    statusMsg.innerText = `Studio Archive Error: ${msg}`;
    statusMsg.className = "text-center py-12 text-red-500 font-mono text-xs uppercase tracking-wider font-bold";
}
