// api/webhook.js — принимает ответы из Telegram, сохраняет в Redis, отдаёт сайту

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    // ============================================
    //  POST — Telegram присылает ответ админа
    // ============================================
    if (req.method === 'POST') {
        try {
            const update = req.body;

            // Проверяем: это reply на сообщение бота?
            if (update.message && update.message.reply_to_message) {
                const replyText = update.message.text;
                const originalText = update.message.reply_to_message.text || '';

                // Достаём msgId из оригинального сообщения
                const match = originalText.match(/<b>msgId:<\/b>\s*<code>([^<]+)<\/code>/);

                if (match && match[1]) {
                    const msgId = match[1];

                    // Узнаём, какому userId принадлежит это сообщение
                    const userIdResponse = await fetch(`${KV_URL}/get/msg:${msgId}`, {
                        headers: { Authorization: `Bearer ${KV_TOKEN}` }
                    });
                    const userIdData = await userIdResponse.json();
                    const userId = userIdData.result;

                    if (userId) {
                        // Сохраняем ответ админа в список сообщений пользователя
                        const adminMessage = JSON.stringify({
                            from: 'admin',
                            text: replyText,
                            time: Date.now()
                        });

                        await fetch(
                            `${KV_URL}/lpush/chat:user:${userId}/${encodeURIComponent(adminMessage)}`,
                            { headers: { Authorization: `Bearer ${KV_TOKEN}` } }
                        );
                    }
                }
            }

            return res.status(200).json({ ok: true });
        } catch (error) {
            console.error('Webhook POST error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ============================================
    //  GET — сайт спрашивает новые сообщения для пользователя
    // ============================================
    if (req.method === 'GET') {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ error: 'No userId' });

        const lastSeen = parseInt(req.query.lastSeen) || 0;

        try {
            // Получаем все сообщения пользователя из Redis
            const response = await fetch(`${KV_URL}/lrange/chat:user:${userId}/0/-1`, {
                headers: { Authorization: `Bearer ${KV_TOKEN}` }
            });
            const data = await response.json();

            const messages = (data.result || [])
                .map(str => {
                    try { return JSON.parse(str); } catch { return null; }
                })
                .filter(m => m && m.time > lastSeen)
                .map(m => ({
                    from: m.from,
                    text: m.text,
                    time: m.time
                }));

            return res.status(200).json({ messages });
        } catch (error) {
            console.error('Webhook GET error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
