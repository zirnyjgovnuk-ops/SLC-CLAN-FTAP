// api/send.js — принимает сообщения с сайта, шлёт в Telegram и сохраняет в Redis

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    const { message, userId } = req.body;

    if (!message || !userId) {
        return res.status(400).json({ error: 'Missing message or userId' });
    }

    // Уникальный ID сообщения
    const msgId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    // 1. Сохраняем сообщение пользователя в Redis
    // Формат ключа: chat:user:<userId> — список сообщений
    const userMessage = JSON.stringify({
        from: 'user',
        text: message,
        time: Date.now()
    });

    try {
        // Добавляем в список сообщений пользователя (LPUSH)
        await fetch(`${KV_URL}/lpush/chat:user:${userId}/${encodeURIComponent(userMessage)}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        // Сохраняем связь msgId -> userId (для webhook — чтобы понять кому отвечать)
        await fetch(`${KV_URL}/set/msg:${msgId}/${userId}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        // 2. Отправляем тебе в Telegram
        const telegramText =
            `💬 <b>НОВОЕ СООБЩЕНИЕ В ЧАТЕ САЙТА</b>\n\n` +
            `🆔 <b>msgId:</b> <code>${msgId}</code>\n` +
            `📝 <b>Сообщение:</b> ${message}\n` +
            `🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n\n` +
            `↩️ <b>Чтобы ответить — сделайте Reply на это сообщение.</b>`;

        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: telegramText,
                parse_mode: 'HTML'
            })
        });

        const tgData = await tgResponse.json();

        if (!tgData.ok) {
            return res.status(500).json({ error: tgData.description });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Send error:', error);
        return res.status(500).json({ error: error.message });
    }
}
