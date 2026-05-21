// add_item_logic.js - BẢN SẠCH (CHỈ CHỨA LOGIC THÊM ITEM)

// 1. Hàm này do shared_admin.js GỌI TỰ ĐỘNG sau khi check Auth thành công
function initPageLogic() {
    console.log("🔓 Cổng đã mở! Đang load giao diện Add Item...");
    toggleFormLabels(); 
}

// 2. GIAO DIỆN & KÉO THẢ ẢNH
function toggleFormLabels() {
    const type = document.getElementById('item-type');
    const lblName = document.getElementById('lbl-name');
    const lblImage = document.getElementById('lbl-image');
    
    if(!type || !lblName || !lblImage) return;

    if (type.value === 'author') {
        lblName.innerText = "Author Name";
        lblImage.innerText = "Profile Picture (1:1 Ratio preferred)";
    } else if (type.value === 'bookset') {
        lblName.innerText = "Bookset Title (e.g. The King Trio)";
        lblImage.innerText = "Cover / Banner Image";
    } else {
        lblName.innerText = "Collection Name (e.g. Winter Thrillers)";
        lblImage.innerText = "Collection Thumbnail";
    }
}

const dropzone = document.getElementById('avatar-dropzone');
const fileInput = document.getElementById('avatar-input');
const dropzoneContent = document.getElementById('dropzone-content');
const avatarPreview = document.getElementById('avatar-preview');
let selectedImageFile = null;

if (dropzone && fileInput) {
    ['dragenter', 'dragover'].forEach(n => dropzone.addEventListener(n, e => { e.preventDefault(); dropzone.classList.add('dropzone-active'); }));
    ['dragleave', 'drop'].forEach(n => dropzone.addEventListener(n, e => { e.preventDefault(); dropzone.classList.remove('dropzone-active'); }));
    dropzone.addEventListener('drop', e => { if (e.dataTransfer.files.length) handleImage(e.dataTransfer.files[0]); });
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function() { if (this.files.length) handleImage(this.files[0]); });
}

function handleImage(file) {
    if (!file.type.startsWith('image/')) return;
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = e => { avatarPreview.src = e.target.result; avatarPreview.classList.remove('hidden'); dropzoneContent.classList.add('hidden'); };
    reader.readAsDataURL(file);
}

// 3. INSTAGRAM & UTILS LOGIC
function addInstaRow() {
    const container = document.getElementById('insta-container');
    const row = document.createElement('div'); row.className = 'flex gap-2 insta-row';
    row.innerHTML = `<input type="text" class="flex-1 border border-gray-300 p-3 focus:outline-none focus:border-black insta-input" placeholder="Paste another link..."><button type="button" class="w-12 border border-red-200 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white flex items-center justify-center font-bold text-lg" onclick="this.parentElement.remove()">-</button>`;
    container.appendChild(row);
}

function extractInstagramId(val) {
    const match = val.trim().match(/\/p\/([a-zA-Z0-9__-]+)/);
    return match ? match[1] : val.trim();
}

function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

// 4. MAIN SUBMIT (GHI DATA VÀO SUPABASE BẰNG _supabase)
async function submitUnifiedItem() {
    const type = document.getElementById('item-type').value;
    const name = document.getElementById('item-name').value.trim();
    const intro = document.getElementById('item-intro').value.trim();
    
    if (!name) return alert('Vui lòng điền Name/Title!');

    const btn = document.querySelector('button[onclick="submitUnifiedItem()"]');
    if(btn) { btn.innerText = "PUBLISHING..."; btn.disabled = true; }

    try {
        let avatarUrl = null;

        if (selectedImageFile) {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${selectedImageFile.name.split('.').pop()}`;
            const { error: uploadErr } = await _supabase.storage.from('avatars').upload(fileName, selectedImageFile);
            if (uploadErr) throw uploadErr;
            avatarUrl = _supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
        }

        const slug = generateSlug(name);
        const { data: itemData, error: itemErr } = await _supabase
            .from('items')
            .insert([{ name, slug, bio: intro, avatar_url: avatarUrl, item_type: type }])
            .select().single();

        if (itemErr) throw itemErr;

        const instaInputs = document.querySelectorAll('.insta-input');
        const bookInserts = [];
        instaInputs.forEach((input, index) => {
            const rawUrl = input.value.trim(); 
            const instaId = extractInstagramId(rawUrl);
            
            if (instaId) {
                bookInserts.push({
                    title: `Item Book ${index + 1} - ${name}`,
                    item_id: itemData.id,
                    instagram_embed_id: instaId,
                    original_url: rawUrl, 
                    cover_url: `https://images.weserv.nl/?url=https://www.instagram.com/p/${instaId}/media/?size=l`,
                    vol_number: index + 1
                });
            }
        });

        if (bookInserts.length > 0) {
            const { error: booksErr } = await _supabase.from('books').insert(bookInserts);
            if (booksErr) throw booksErr;
        }

        alert('Thêm Item thành công!');
        window.location.href = 'index.html'; 

    } catch (err) {
        alert("Lỗi: " + err.message);
    } finally {
        if(btn) { btn.innerText = "Publish Item"; btn.disabled = false; }
    }