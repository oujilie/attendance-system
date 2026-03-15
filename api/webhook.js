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
        const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

        if (text.includes('check')) {
            // 抓取所有資料，不限數量
            const { data: records, error } = await supabase
                .from('attendance')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!records || records.length === 0) {
                await sendTg(chatId, "📭 資料庫目前空空如也，沒有任何打卡紀錄。", TG_TOKEN);
                return res.status(200).send('OK');
            }

            // 使用 Map 確保每個工號只顯示最新一筆
            const userMap = new Map();
            records.forEach(r => {
                if(r.user_name) userMap.set(r.user_name, r);
            });

            let responseText = `📊 <b>全員狀態總覽 (資料庫總筆數: ${records.length})</b>\n`;
            responseText += `👥 <b>目前已識別工號數: ${userMap.size} 人</b>\n`;
            responseText += `━━━━━━━━━━━━━━\n`;
            
            // 排序並組合訊息
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
        await sendTg(req.body.message.chat.id, `❌ 系統報錯: ${err.message}`, process.env.TELEGRAM_BOT_TOKEN);
    }
    return res.status(200).json({ status: 'done' });
}

async function sendTg(chat_id, text, token) {
    const data = JSON.stringify({ chat_id, text, parse_mode: 'HTML' });
    const options = {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    return new Promise((resolve) => {
        const req = https.request(options, resolve);
        req.write(data);
        req.end();
    });
}
