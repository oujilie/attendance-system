// api/webhook.js
import { createClient } from '@supabase/supabase-js';
const https = require('https');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    try {
        const { message } = req.body;
        if (!message || !message.text) return res.status(200).send('OK');

        const chatId = message.chat.id;
        const text = message.text.toLowerCase().trim();
        const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

        if (text.includes('check')) {
            // 修正點：一次抓取 1000 筆，確保能抓到 001 以外的其他員工
            const { data: records, error } = await supabase
                .from('attendance')
                .select('*')
                .order('created_at', { ascending: true }) // 舊到新排，讓新的蓋掉舊的
                .limit(1000); 

            if (error) throw error;

            const userMap = new Map();
            records.forEach(r => {
                // 這裡必須確保欄位名稱 user_name 與截圖完全一致
                if(r.user_name) userMap.set(r.user_name, r);
            });

            let responseText = `📊 <b>全員狀態 (總計: ${userMap.size} 人)</b>\n━━━━━━━━━━━━━━\n`;
            
            // 轉成陣列並按照工號排序 (例如 001, 002, 003...)
            const sortedUsers = Array.from(userMap.values()).sort((a, b) => a.user_name.localeCompare(b.user_name));

            sortedUsers.forEach(emp => {
                const time = new Date(emp.created_at).toLocaleString('zh-TW', { 
                    timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' 
                });
                const icon = emp.type === 'IN' ? '🟢 上班' : (emp.type === 'OUT' ? '🔴 下班' : '🟡 ' + emp.type);
                responseText += `👤 <b>工號：${emp.user_name}</b>\n${icon} | ⏰ ${time}\n────────────────\n`;
            });

            await sendTg(chatId, responseText, TG_TOKEN);
        }
    } catch (err) {
        // 如果報錯，直接把錯誤吐回 Telegram，不要再瞎猜了
        await sendTg(req.body.message.chat.id, `❌ 程式錯誤: ${err.message}`, '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s');
    }
    return res.status(200).json({ status: 'done' });
}

async function sendTg(chatId, text, token) {
    const data = JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' });
    return new Promise((resolve) => {
        const options = { hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
        const req = https.request(options, resolve);
        req.write(data);
        req.end();
    });
}
