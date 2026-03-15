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
            // 抓取 attendance 資料表
            const { data: records, error } = await supabase
                .from('attendance')
                .select('*')
                .order('created_at', { ascending: false }); // 最新的排上面

            if (error) {
                return sendTg(chatId, `❌ 資料庫錯誤: ${error.message}`, TG_TOKEN);
            }

            if (!records || records.length === 0) {
                return sendTg(chatId, "📅 今日無打卡紀錄", TG_TOKEN);
            }

            let responseText = "📊 <b>全員實時打卡紀錄</b>\n━━━━━━━━━━━━━━\n";
            
            // 根據你的截圖欄位：user_name, created_at, type
            records.slice(0, 15).forEach(record => {
                const time = new Date(record.created_at).toLocaleString('zh-TW', { 
                    timeZone: 'Asia/Taipei', 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                const typeIcon = record.type === 'IN' ? '🟢 上班' : (record.type === 'OUT' ? '🔴 下班' : '🟡 ' + record.type);
                
                responseText += `👤 <b>工號：${record.user_name}</b>\n`;
                responseText += `${typeIcon} | ⏰ ${time}\n`;
                responseText += `────────────────\n`;
            });

            await sendTg(chatId, responseText, TG_TOKEN);
        } else {
            await sendTg(chatId, "請輸入 /check 查看最新打卡狀態", TG_TOKEN);
        }

    } catch (err) {
        console.error(err);
    }
    return res.status(200).json({ status: 'done' });
}

// 輔助函式：發送訊息
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
