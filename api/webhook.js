// api/webhook.js
import { createClient } from '@supabase/supabase-js';
const https = require('https');

// 直接讀取你設定好的 Vercel 環境變數
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
            // 從資料表抓取資料，按時間排序
            const { data: records, error } = await supabase
                .from('attendance')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                await sendTg(chatId, `❌ 資料庫錯誤: ${error.message}`, TG_TOKEN);
                return res.status(200).send('OK');
            }

            // 核心去重邏輯：只保留每個人的最後一筆紀錄
            const latestStatus = [];
            const processedUsers = new Set();

            for (const record of records) {
                if (!processedUsers.has(record.user_name)) {
                    processedUsers.add(record.user_name);
                    latestStatus.push(record);
                }
            }

            let responseText = "📊 <b>全員當前狀態總覽</b>\n━━━━━━━━━━━━━━\n";
            
            latestStatus.forEach(emp => {
                const time = new Date(emp.created_at).toLocaleString('zh-TW', { 
                    timeZone: 'Asia/Taipei', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                const icon = emp.type === 'IN' ? '🟢 上班' : (emp.type === 'OUT' ? '🔴 下班' : '🟡 ' + emp.type);
                
                responseText += `👤 <b>工號：${emp.user_name}</b>\n`;
                responseText += `${icon} | ⏰ 時間：${time}\n`;
                responseText += `────────────────\n`;
            });

            await sendTg(chatId, responseText, TG_TOKEN);
        } else {
            await sendTg(chatId, "請輸入 /check 查詢所有人狀態", TG_TOKEN);
        }

        return res.status(200).json({ status: 'done' });
    } catch (err) {
        console.error(err);
        return res.status(200).send('OK');
    }
}

// 修正後的發送函式，確保 Vercel 等待請求完成
async function sendTg(chatId, text, token) {
    const data = JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' });
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        };
        const req = https.request(options, resolve);
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
