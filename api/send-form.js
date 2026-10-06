// api/send-form.js — принимает заявки с форм, шлёт в группу с кнопкой «Посмотрел(а)»

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const BOT_TOKEN = '8908023869:AAEYpmjQ5NpBvlTyUCbTm_jpbdBbnhWM65o';
    const ADMIN_CHAT_ID = '-1004399249500';

    const { type, data } = req.body;

    if (!type || !data) {
        return res.status(400).json({ error: 'Missing type or data' });
    }

    const msgId = Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    let telegramText = '';

    // ============================================
    //  Формируем сообщение в зависимости от типа
    // ============================================

    if (type === 'join') {
        telegramText =
            `🎮 <b>ЗАЯВКА НА ВСТУПЛЕНИЕ В КЛАН SLC</b>\n\n` +
            `🆔 <b>msgId:</b> <code>${msgId}</code>\n` +
            `👤 <b>Никнейм:</b> ${data.nickname}\n` +
            `🎂 <b>Возраст:</b> ${data.age}\n` +
            `⚡ <b>Опыт в FTAP:</b> ${data.experience} мес.\n` +
            `📊 <b>Ранг:</b> ${data.rank}\n` +
            `💬 <b>Почему SLC:</b> ${data.why}\n` +
            `🔗 <b>Telegram:</b> ${data.contact}`;
    }
    else if (type === 'complaint') {
        const typeNames = {
            'toxicity': 'Токсичность / Оскорбления',
            'cheating': 'Читы / Нечестная игра',
            'afk': 'AFK во время клановых войн',
            'betrayal': 'Предательство клана',
            'other': 'Другое'
        };
        telegramText =
            `⚠️ <b>ЖАЛОБА НА УЧАСТНИКА SLC</b>\n\n` +
            `🆔 <b>msgId:</b> <code>${msgId}</code>\n` +
            `👤 <b>Заявитель:</b> ${data.yourNick}\n` +
            `🎯 <b>Нарушитель:</b> ${data.targetNick}\n` +
            `📋 <b>Тип нарушения:</b> ${typeNames[data.type] || data.type}\n` +
            `📅 <b>Дата инцидента:</b> ${data.date}\n` +
            `📝 <b>Описание:</b> ${data.description}\n` +
            `🔗 <b>Доказательства:</b> ${data.evidence || 'Нет'}`;
    }
    else if (type === 'moderator') {
        const rankNames = {
            'ml_admin': 'мл.админ',
            'admin': 'админ',
            'moderator': 'модератор',
            'st_moderator': 'ст. Модератор',
            'coowner': 'соовнер'
        };
        telegramText =
            `🛡️ <b>ЗАЯВКА НА МОДЕРАТОРА SLC</b>\n\n` +
            `🆔 <b>msgId:</b> <code>${msgId}</code>\n` +
            `👤 <b>Никнейм:</b> ${data.nickname}\n` +
            `🎂 <b>Возраст:</b> ${data.age}\n` +
            `⏱️ <b>Время в клане:</b> ${data.timeInClan} мес.\n` +
            `📊 <b>Текущая позиция:</b> ${rankNames[data.currentRank] || data.currentRank}\n` +
            `💬 <b>Мотивация:</b> ${data.why}\n` +
            `📋 <b>Опыт модерации:</b> ${data.experience || 'Нет опыта'}\n` +
            `🕐 <b>График:</b> ${data.availability}\n` +
            `🔗 <b>Telegram:</b> ${data.discord}`;
    }
    else {
        return res.status(400).json({ error: 'Unknown type' });
    }

    try {
        const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
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
        console.error('Send form error:', error);
        return res.status(500).json({ error: error.message });
    }
};
