// api/photos.js — возвращает список всех фото и удаляет по запросу

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    // GET — получить список
    if (req.method === 'GET') {
        try {
            const response = await fetch(`${KV_URL}/lrange/photos/0/-1`, {
                headers: { Authorization: `Bearer ${KV_TOKEN}` }
            });
            const data = await response.json();

            const photos = (data.result || [])
                .map(str => { try { return JSON.parse(str); } catch { return null; } })
                .filter(p => p);

            return res.status(200).json({ photos });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // POST — удалить фото
    if (req.method === 'POST') {
        const ADMIN_PASSWORD = 'Kit1k';
        const { password, url } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Wrong password' });
        }

        try {
            const response = await fetch(`${KV_URL}/lrange/photos/0/-1`, {
                headers: { Authorization: `Bearer ${KV_TOKEN}` }
            });
            const data = await response.json();
            const allPhotos = data.result || [];

            for (const photoStr of allPhotos) {
                try {
                    const photo = JSON.parse(photoStr);
                    if (photo.url === url) {
                        await fetch(`${KV_URL}/lrem/photos/0/${encodeURIComponent(photoStr)}`, {
                            headers: { Authorization: `Bearer ${KV_TOKEN}` }
                        });
                        break;
                    }
                } catch (e) {}
            }

            return res.status(200).json({ ok: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
