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
        const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

        if (text.includes('check')) {
            // 1. 抓取所有紀錄，並按時間從舊到新排序 (讓後面的蓋掉前面的)
            const { data: records, error } = await supabase
                .from('attendance')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                await sendTg(chatId, `❌ 資料庫連線失敗: ${error.message}`, TG_TOKEN);
                return res.status(200).send('OK');
            }

            // 2. 使用 Map 確保每個 user_name 只保留最新的一筆
            const userMap = new Map();
            records.forEach(record => {
                // 因為是按時間由舊到新排，所以同一個工號後面的資料會蓋掉前面的
                userMap.set(record.user_name, record);
            });

            if (userMap.size === 0) {
                await sendTg(chatId, "📅 目前資料庫中沒有任何打卡紀錄。", TG_TOKEN);
                return res.status(200).send('OK');
            }

            // 3. 組合所有人狀態
            let responseText = "📊 <b>全員當前狀態名單</b>\n━━━━━━━━━━━━━━\n";
            
            userMap.forEach((emp, userName) => {
                const time = new Date(emp.created_at).toLocaleString('zh-TW', { 
                    timeZone: 'Asia/Taipei', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                const typeIcon = emp.type === 'IN' ? '🟢 上班' : (emp.type === 'OUT' ? '🔴 下班' : '🟡 ' + emp.type);
                
                responseText += `👤 <b>工號：${userName}</b>\n`;
                responseText += `${typeIcon} | ⏰ 最後時間：${time}\n`;
                responseText += `────────────────\n`;
            });

            responseText += `\n總計人數：${userMap.size} 人`;

            await sendTg(chatId, responseText, TG_TOKEN);
        } else {
            await sendTg(chatId, "請輸入 /check 獲取全員即時狀態。", TG_TOKEN);
        }

    } catch (err) {
        console.error("執行出錯:", err.message);
    }
    return res.status(200).json({ status: 'done' });
}

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
