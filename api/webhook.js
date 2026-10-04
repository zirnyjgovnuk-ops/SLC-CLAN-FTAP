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

            if (update.message && update.message.reply_to_message) {
                const replyText = update.message.text;
                const originalText = update.message.reply_to_message.text || '';

                // Ищем msgId в plain text (без HTML тегов)
                // В plain text это выглядит как: "msgId: 1791157647467_8op66h"
                const match = originalText.match(/msgId:\s*([a-zA-Z0-9_]+)/);

                if (match && match[1]) {
                    const msgId = match[1];
                    console.log('Found msgId:', msgId);

                    // Узнаём userId по msgId
                    const userIdResponse = await fetch(`${KV_URL}/get/msg:${msgId}`, {
                        headers: { Authorization: `Bearer ${KV_TOKEN}` }
                    });
                    const userIdData = await userIdResponse.json();
                    const userId = userIdData.result;

                    console.log('Found userId:', userId);

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

                        console.log('Saved admin reply for', userId);
                    } else {
                        console.log('User not found for msgId:', msgId);
                    }
                } else {
                    console.log('msgId not found in reply_to_message:', originalText);
                }
            }

            return res.status(200).json({ ok: true });
        } catch (error) {
            console.error('Webhook POST error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    // ============================================
    //  GET — сайт спрашивает новые сообщения
    // ============================================
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
