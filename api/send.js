// api/send.js — принимает сообщения с сайта и шлёт в Telegram
export default async function handler(req, res) {
    // CORS — чтобы сайт мог обращаться
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

    const { message, userId } = req.body;

    if (!message || !userId) {
        return res.status(400).json({ error: 'Missing message or userId' });
    }

    // Формируем сообщение с ID пользователя, чтобы потом ответить
    const text =
        `💬 <b>НОВОЕ СООБЩЕНИЕ В ЧАТЕ САЙТА</b>\n\n` +
        `🆔 <b>ID пользователя:</b> <code>${userId}</code>\n` +
        `📝 <b>Сообщение:</b> ${message}\n` +
        `🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n\n` +
        `↩️ <b>Чтобы ответить — просто сделайте Reply на это сообщение.</b>`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();

        if (data.ok) {
            // Сохраняем в память что этот message_id связан с userId
            // (для webhook — чтобы понять, кому отвечать)
            // Простое решение — оставим это в самом сообщении выше
            return res.status(200).json({ ok: true });
        } else {
            return res.status(500).json({ error: data.description });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
