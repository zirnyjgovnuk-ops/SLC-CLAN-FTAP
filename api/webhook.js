// api/webhook.js — принимает ответы из Telegram и отдаёт их пользователю
// Простое решение: используем in-memory store (сбрасывается при рестарте)
// Для продакшена нужна БД, но для клана хватит

const conversations = new Map(); // userId -> [{ from, text, time }, ...]

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POST — сюда стучится Telegram когда ты отвечаешь
    if (req.method === 'POST') {
        try {
            const update = req.body;

            // Ты ответил (reply) на сообщение бота
            if (update.message && update.message.reply_to_message) {
                const replyText = update.message.text;
                const originalText = update.message.reply_to_message.text || '';

                // Достаём userId из оригинального сообщения
                const match = originalText.match(/ID пользователя:<\/b> <code>(\d+)<\/code>/);
                // ↑ если не работает — заменим на простой regex

                let userId = null;
                const idMatch = originalText.match(/<code>([^<]+)<\/code>/);
                if (idMatch) userId = idMatch[1];

                if (userId) {
                    if (!conversations.has(userId)) {
                        conversations.set(userId, []);
                    }
                    conversations.get(userId).push({
                        from: 'admin',
                        text: replyText,
                        time: Date.now()
                    });
                }
            }

            return res.status(200).json({ ok: true });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // GET — сюда стучится сайт, чтобы забрать новые ответы
    if (req.method === 'GET') {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'No userId' });
        }

        const messages = conversations.get(userId) || [];
        // Отдаём сообщения и очищаем (чтобы не дублировались)
        conversations.set(userId, []);

        return res.status(200).json({ messages });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
