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
        const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

        if (message.text.includes('check')) {
            // 同時檢查兩個可能的資料表
            const { data: attData } = await supabase.from('attendance').select('user_name');
            const { data: punchData } = await supabase.from('punch_logs').select('*');

            // 診斷訊息
            let debugMsg = `🔍 <b>系統診斷報告</b>\n`;
            debugMsg += `表格 [attendance]: ${attData?.length || 0} 筆資料\n`;
            debugMsg += `表格 [punch_logs]: ${punchData?.length || 0} 筆資料\n\n`;

            // 決定使用哪個資料源 (優先使用有資料的，或如果你確定是 punch_logs 就改這裡)
            const records = (punchData && punchData.length > 0) ? punchData : attData;
            
            if (!records || records.length === 0) {
                return sendTg(chatId, debugMsg + "❌ 兩個表格都抓不到有效的打卡紀錄。", TG_TOKEN);
            }

            const userMap = new Map();
            // 修正：有些表欄位可能是 user_id 或 name，這裡做相容處理
            records.forEach(r => {
                const id = r.user_name || r.user_id || r.name || "未知";
                userMap.set(id, r);
            });

            let responseText = debugMsg + `📊 <b>實時狀態 (總計: ${userMap.size} 人)</b>\n━━━━━━━━━━━━━━\n`;
            
            Array.from(userMap.values()).forEach(emp => {
                const id = emp.user_name || emp.user_id || emp.name;
                const time = emp.created_at ? new Date(emp.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' }) : "--:--";
                const icon = emp.type === 'IN' ? '🟢 上班' : '🔴 下班';
                responseText += `👤 <b>工號：${id}</b>\n${icon} | ⏰ ${time}\n────────────────\n`;
            });

            await sendTg(chatId, responseText, TG_TOKEN);
        }
    } catch (err) {
        await sendTg(req.body.message.chat.id, `❌ 錯誤: ${err.message}`, process.env.TELEGRAM_BOT_TOKEN);
    }
    return res.status(200).json({ status: 'done' });
}

async function sendTg(chatId, text, token) {
    const data = JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' });
    const options = { hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = https.request(options, () => {});
    req.write(data);
    req.end();
}
