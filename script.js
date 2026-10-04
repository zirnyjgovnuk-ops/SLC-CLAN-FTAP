// ============================================
//  TELEGRAM BOT CONFIG
// ============================================
const BOT_TOKEN = '8908023869:AAEd6pxPy5VCqjA5TXCsUDD-wfotAclqiu4';
const ADMIN_CHAT_ID = '6047984459';
const API_URL = 'https://api.telegram.org';
const VERCEL_URL = 'https://slc-clan-ftap.vercel.app';

// ============================================
//  SCROLL PROGRESS
// ============================================
window.addEventListener('scroll', () => {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    const percent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = percent + '%';
});

// ============================================
//  HEADER SCROLL EFFECT
// ============================================
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
});

// ============================================
//  MOBILE MENU
// ============================================
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ============================================
//  SCROLL SPY
// ============================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

if (sections.length) {
    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-menu a[href="#${entry.target.id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(section => spyObserver.observe(section));
}

// ============================================
//  REVEAL ANIMATION
// ============================================
const revealElements = document.querySelectorAll('.reveal');
if (revealElements.length) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));
}

// ============================================
//  ANIMATED COUNTERS
// ============================================
function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();

    const update = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const value = target < 10 ? Math.round(ease * target * 10) / 10 : Math.round(ease * target);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
}

const counterEls = document.querySelectorAll('[data-target]');
if (counterEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counterEls.forEach(el => counterObserver.observe(el));
}

// ============================================
//  NOTIFICATION
// ============================================
function showNotification(message, isSuccess = true) {
    const notification = document.getElementById('notification');
    if (!notification) return;

    const notificationText = notification.querySelector('.notification-text');
    const notificationIcon = notification.querySelector('.notification-icon');

    notificationText.textContent = message;
    notificationIcon.textContent = isSuccess ? '✓' : '!';
    notificationIcon.style.background = isSuccess ? '#4ade80' : '#f87171';
    notification.style.borderLeftColor = isSuccess ? '#4ade80' : '#f87171';

    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// ============================================
//  TELEGRAM BOT API (заявки)
// ============================================
async function sendToTelegramBot(message) {
    const url = `${API_URL}/bot${BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();

        if (data.ok) {
            showNotification('Заявка успешно отправлена!');
            return true;
        } else {
            console.error('Telegram API Error:', data);
            showNotification('Ошибка: ' + (data.description || 'неизвестная'), false);
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        showNotification('Ошибка соединения с Telegram', false);
        return false;
    }
}

// ============================================
//  FORM: JOIN
// ============================================
const joinForm = document.getElementById('joinForm');
if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = joinForm.querySelector('.submit-button');
        btn.disabled = true;
        btn.textContent = 'Отправка...';

        const data = Object.fromEntries(new FormData(joinForm));

        const message =
            `🎮 <b>ЗАЯВКА НА ВСТУПЛЕНИЕ В КЛАН SLC</b>\n\n` +
            `👤 <b>Никнейм:</b> ${data.nickname}\n` +
            `🎂 <b>Возраст:</b> ${data.age}\n` +
            `⚡ <b>Опыт в FTAP:</b> ${data.experience} мес.\n` +
            `📊 <b>Ранг:</b> ${data.rank}\n` +
            `💬 <b>Почему SLC:</b> ${data.why}\n` +
            `🔗 <b>Telegram:</b> ${data.contact}`;

        const ok = await sendToTelegramBot(message);
        if (ok) joinForm.reset();

        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
    });
}

// ============================================
//  FORM: COMPLAINT
// ============================================
const complaintForm = document.getElementById('complaintForm');
if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = complaintForm.querySelector('.submit-button');
        btn.disabled = true;
        btn.textContent = 'Отправка...';

        const data = Object.fromEntries(new FormData(complaintForm));

        const typeNames = {
            'toxicity': 'Токсичность / Оскорбления',
            'cheating': 'Читы / Нечестная игра',
            'afk': 'AFK во время клановых войн',
            'betrayal': 'Предательство клана',
            'other': 'Другое'
        };

        const message =
            `⚠️ <b>ЖАЛОБА НА УЧАСТНИКА SLC</b>\n\n` +
            `👤 <b>Заявитель:</b> ${data.yourNick}\n` +
            `🎯 <b>Нарушитель:</b> ${data.targetNick}\n` +
            `📋 <b>Тип нарушения:</b> ${typeNames[data.type] || data.type}\n` +
            `📅 <b>Дата инцидента:</b> ${data.date}\n` +
            `📝 <b>Описание:</b> ${data.description}\n` +
            `🔗 <b>Доказательства:</b> ${data.evidence || 'Нет'}`;

        const ok = await sendToTelegramBot(message);
        if (ok) complaintForm.reset();

        btn.disabled = false;
        btn.textContent = 'Отправить жалобу';
    });
}

// ============================================
//  FORM: MODERATOR
// ============================================
const moderatorForm = document.getElementById('moderatorForm');
if (moderatorForm) {
    moderatorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = moderatorForm.querySelector('.submit-button');
        btn.disabled = true;
        btn.textContent = 'Отправка...';

        const data = Object.fromEntries(new FormData(moderatorForm));

        const rankNames = {
            'ml_admin': 'мл.админ',
            'admin': 'админ',
            'moderator': 'модератор',
            'st_moderator': 'ст. Модератор',
            'coowner': 'соовнер'
        };

        const message =
            `🛡️ <b>ЗАЯВКА НА МОДЕРАТОРА SLC</b>\n\n` +
            `👤 <b>Никнейм:</b> ${data.nickname}\n` +
            `🎂 <b>Возраст:</b> ${data.age}\n` +
            `⏱️ <b>Время в клане:</b> ${data.timeInClan} мес.\n` +
            `📊 <b>Текущая позиция:</b> ${rankNames[data.currentRank] || data.currentRank}\n` +
            `💬 <b>Мотивация:</b> ${data.why}\n` +
            `📋 <b>Опыт модерации:</b> ${data.experience || 'Нет опыта'}\n` +
            `🕐 <b>График:</b> ${data.availability}\n` +
            `🔗 <b>Telegram:</b> ${data.discord}`;

        const ok = await sendToTelegramBot(message);
        if (ok) moderatorForm.reset();

        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
    });
}

// ============================================
//  CHAT — двусторонний через Vercel + Redis
// ============================================
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

// Уникальный ID пользователя (хранится в браузере)
function getUserId() {
    let id = localStorage.getItem('slc_user_id');
    if (!id) {
        id = 'user_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
        localStorage.setItem('slc_user_id', id);
    }
    return id;
}

const USER_ID = getUserId();

// Время последнего полученного сообщения — чтобы не дублировать
let lastSeen = 0;

function addMessage(text, type) {
    if (!chatMessages) return;
    const message = document.createElement('div');
    message.className = `message ${type}`;
    const sender = type === 'user' ? 'Вы' : (type === 'admin' ? 'Администрация' : '');
    message.innerHTML = `
        ${sender ? `<div class="message-sender">${sender}</div>` : ''}
        <div class="message-text">${text}</div>
    `;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInput.value = '';

        try {
            const response = await fetch(`${VERCEL_URL}/api/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    userId: USER_ID
                })
            });

            const data = await response.json();

            if (data.ok) {
                addMessage(
                    '✅ Сообщение отправлено администрации. Ответ появится здесь автоматически.',
                    'system'
                );
            } else {
                addMessage('⚠️ Не удалось отправить. Попробуйте позже.', 'system');
            }
        } catch (error) {
            console.error('Chat send error:', error);
            addMessage('⚠️ Ошибка соединения. Проверьте интернет.', 'system');
        }
    });
}

async function checkForReplies() {
    try {
        const response = await fetch(
            `${VERCEL_URL}/api/webhook?userId=${USER_ID}&lastSeen=${lastSeen}`
        );
        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                if (msg.from === 'admin') {
                    addMessage(msg.text, 'admin');
                    lastSeen = Math.max(lastSeen, msg.time);
                }
            });
        }
    } catch (error) {
        // Тихо игнорируем
    }
}

if (chatForm) {
    setInterval(checkForReplies, 3000);
}

// ============================================
//  SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            window.scrollTo({
                top: target.offsetTop - headerHeight - 20,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
//  FORM VALIDATION VISUAL
// ============================================
document.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('invalid', () => {
        input.style.borderColor = '#f87171';
    });
    input.addEventListener('input', () => {
        if (input.validity.valid) input.style.borderColor = 'transparent';
    });
});

// ============================================
//  INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ SLC Clan Website Loaded');
    console.log('🤖 Bot: @slcsite_bot');
    console.log('🌐 Vercel:', VERCEL_URL);
});
