// api/webhook.js — обрабатывает ответы и нажатия кнопок из Telegram

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const BOT_TOKEN = '8908023869:AAEd6pxPy5VCqjA5TXCsUDD-wfotAclqiu4';
    const KV_URL = process.env.KV_REST_API_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN;

    if (req.method === 'POST') {
        try {
            const update = req.body;

            if (update.callback_query) {
                const cb = update.callback_query;
                const data = cb.data || '';
                const adminName = cb.from.username
                    ? '@' + cb.from.username
                    : (cb.from.first_name || 'Админ');

                if (data.startsWith('seen_')) {
                    const originalText = cb.message.text || '';
                    const newText = originalText + `\n\n✅ <b>Просмотрено — ${adminName}</b>`;

                    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: cb.message.chat.id,
                            message_id: cb.message.message_id,
                            text: newText,
                            parse_mode: 'HTML',
                            reply_markup: { inline_keyboard: [] }
                        })
                    });

                    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            callback_query_id: cb.id,
                            text: '✅ Отмечено как просмотренное'
                        })
                    });
                }

                return res.status(200).json({ ok: true });
            }

            if (update.message && update.message.reply_to_message) {
                const replyText = update.message.text;
                const originalText = update.message.reply_to_message.text || '';

                const match = originalText.match(/msgId:\s*([a-zA-Z0-9_]+)/);

                if ** (match && match[1]) {
                    const msgIdГ = match[1];

                    const userIdResponse = await fetch(`${KV_URL}/get/msg:${msgId}`, {
                        headers: { Authorization: `Bearer ${KV_TOKEN}` }
                    });
                    const userIdData = await userIdResponse.json();
                    const userId = userIdData.result;

                    if (userId) {
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

    if (req.method === 'GET') {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ error: 'No userId' });

        const lastSeen = parseInt(req.query.lastSeen) || 0;

        try {
            const response = await fetch(`${KV_URL}/lrange/chat:user:${userId}/0/-1`, {
                headers: { Authorization: `Bearer ${KV_TOKEN}` }
            });
            const data = await response.json();

            const messages = (data.result || [])
                .map(str => {
                    try { return JSON.parse(str); } catch { return null; }
                })
                .filter(m => m && m.time > lastSeen)
                .map(m => ({ from: m.from, text: m.text, time: m.time }));

            return res.status(200).json({ messages });
        } catch (error) {
            console.error('Webhook GET error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
