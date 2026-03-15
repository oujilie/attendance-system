// api/webhook.js
import { createClient } from '@supabase/supabase-js';
const https = require('https');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
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
            // 1. 抓取所有紀錄，按時間新到舊排序
            const { data: records, error } = await supabase
                .from('attendance')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                await sendTg(chatId, `❌ 資料庫錯誤: ${error.message}`, TG_TOKEN);
                return res.status(200).json({ error: error.message });
            }

            // 2. 過濾重複的人員：只保留每個 user_name 的最新一筆
            const latestRecords = [];
            const seenUsers = new Set();

            for (const record of records) {
                if (!seenUsers.has(record.user_name)) {
                    seenUsers.add(record.user_name);
                    latestRecords.push(record);
                }
            }

            // 3. 建立全員狀態訊息
            let responseText = "📊 <b>全員當前考勤狀態</b>\n━━━━━━━━━━━━━━\n";
            
            latestRecords.forEach(emp => {
                const time = new Date(emp.created_at).toLocaleString('zh-TW', { 
                    timeZone: 'Asia/Taipei', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                const typeIcon = emp.type === 'IN' ? '🟢 上班' : (emp.type === 'OUT' ? '🔴 下班' : '🟡 ' + emp.type);
                
                responseText += `👤 <b>工號：${emp.user_name}</b>\n`;
                responseText += `${typeIcon} | ⏰ 時間：${time}\n`;
                responseText += `────────────────\n`;
            });

            await sendTg(chatId, responseText, TG_TOKEN);
        } else {
            await sendTg(chatId, "請輸入 /check 查看全員最新狀態", TG_TOKEN);
        }

    } catch (err) {
        console.error("發生錯誤:", err.message);
    }
    return res.status(200).json({ status: 'done' });
}

// 獨立的發送函式，確保不會跟 handler 邏輯混淆
async function sendTg(chatId, text, token) {
    const data = JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' });
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = https.request(options, resolve);
        req.write(data);
        req.end();
    });
}
