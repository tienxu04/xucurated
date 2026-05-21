// api/catalog.js
// Hàm này chạy ngầm trên Server của Vercel, giấu kín URL và Key
export default async function handler(req, res) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    // Cấu hình header để gọi REST API của Supabase
    const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    };

    try {
        // Fetch items và books song song cho lẹ
        const [itemsRes, booksRes] = await Promise.all([
            fetch(`${url}/rest/v1/items?select=*`, { headers }),
            fetch(`${url}/rest/v1/books?select=*`, { headers })
        ]);

        const items = await itemsRes.json();
        const books = await booksRes.json();

        // Trả data về cho Frontend
        res.status(200).json({ items, books });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load catalog' });
    }
}
