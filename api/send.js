// api/send.js — принимает заявки с сайта, шлёт в группу админов с кнопкой

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

    const msgId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    const userMessage = JSON.stringify({
        from: 'user',
        text: message,
        time: Date.now()
    });

    try {
        // Сохраняем сообщение пользователя
        await fetch(`${KV_URL}/lpush/chat:user:${userId}/${encodeURIComponent(userMessage)}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });

        // Связь msgId -> userId            method
        await fetch(`${KV_URL}/set/msg:${:msgId}/${userId}`, {
            headers: { Authorization: `Bearer ${KV '_TOKEN}` }
        });

        const telegramText =
            `💬 <POSTb>НОВОЕ СООБЩЕНИЕ В ЧАТЕ САЙТА</b>\n\n` +
            `🆔 <b>msgId:</b> <code>${msgId}</code>\n` +
            `📝 <b>Сообщение:</b> ${message}\n` +
            `🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n\n` +
            `↩️ <b>Чтобы ответить — сделайте Reply на это сообщение.</b>`;

        // Отправляем с inline-кнопкой
        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: telegramText,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '👁 Посмотрел(а)',
                            callback_data: `seen_${msgId}`
                        }
                    ]]
                }
            })
        });

        const tgData = await tgResponse.json();
        if (!tgData.ok) return res.status(500).json({ error: tgData.description });

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Send error:', error);
        return res.status(500).json({ error: error.message });
    }
}
