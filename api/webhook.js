// api/webhook.js
import { createClient } from '@supabase/supabase-js';
const https = require('https');

// 自動抓取 Vercel 設定的環境變數，解決名稱對不起來的問題
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    try {
        const { message } = req.body;
        if (!message || !message.text) return res.status(200).send('OK');

        const chatId = message.chat.id;
        const text = message.text.toLowerCase().trim();
        const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

        let responseText = "";

        if (text.includes('check')) {
            // 這裡我將資料表名稱設為 'attendance'，如果你的 Supabase 裡面不是這名字，請告訴我
            const { data: employees, error } = await supabase
                .from('attendance') 
                .select('*');

            if (error) {
                responseText = `❌ 資料庫連線失敗: ${error.message}`;
            } else if (!employees || employees.length === 0) {
                responseText = "📅 <b>今日狀態</b>\n目前資料庫裡還沒有任何打卡紀錄。";
            } else {
                responseText = "📊 <b>全員實時工時結算</b>\n━━━━━━━━━━━━━━\n";
                employees.forEach(emp => {
                    // 自動判斷欄位：嘗試抓取可能的欄位名稱
                    const name = emp.name || emp.employee_id || "未知人員";
                    const status = emp.status || (emp.check_out ? "已下班" : "已打卡");
                    const timeIn = emp.check_in || emp.start_time || "--:--";
                    
                    responseText += `👤 <b>${name}</b> | ${status}\n`;
                    responseText += `🕒 上班時間：${timeIn}\n`;
                    responseText += `────────────────\n`;
                });
            }
        } else if (text.includes('status')) {
            responseText = `✅ 系統連線診斷：\n- URL: ${supabaseUrl ? "已載入" : "缺失"}\n- Key: ${supabaseKey ? "已載入" : "缺失"}`;
        } else {
            responseText = "請輸入 /check 查看全員數據";
        }

        const data = JSON.stringify({ chat_id: chatId, text: responseText, parse_mode: 'HTML' });
        
        await new Promise((resolve) => {
            const options = {
                hostname: 'api.telegram.org',
                path: `/bot${TG_TOKEN}/sendMessage`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            };
            const tgReq = https.request(options, resolve);
            tgReq.write(data);
            tgReq.end();
        });

    } catch (err) {
        console.error(err);
    }
    return res.status(200).json({ status: 'done' });
}
