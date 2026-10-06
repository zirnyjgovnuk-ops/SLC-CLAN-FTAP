// api/upload.js — загрузка фото админом

const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const ADMIN_PASSWORD = 'Kit1k';
        
const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    const { password, image, caption } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Wrong password' });
    }

    if (!image) {
        return res.status(400).json({ error: 'No image' });
    }

    try {
        // image — base64 строка: data:image/jpeg;base64,xxxxx
        const base64Data = image.split(',')[1];
        const mimeMatch = image.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';

        const buffer = Buffer.from(base64Data, 'base64');

        const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // Загружаем через @vercel/blob
        const blob = await put(fileName, buffer, {
            access: 'public',
            contentType: mimeType
        });

        // Сохраняем URL в Redis
        const photoData = JSON.stringify({
            url: blob.url,
            caption: caption || '',
            time: Date.now()
        });

        await fetch(`${KV_URL}/lpush/photos/${encodeURIComponent(photoData)}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        return res.status(200).json({ ok: true, url: blob.url });
    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: error.message });
    }
};
