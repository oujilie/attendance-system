const https = require('https');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    try {
        const { message } = req.body;
        if (!message || !message.text) return res.status(200).send('OK');

        const chatId = message.chat.id;
        const text = message.text.toLowerCase().trim();
        const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

        let responseText = "";

        if (text.includes('check')) {
            // --- 這裡改為抓取你網頁系統的真實 API ---
            // 假設你的網頁系統有一個 API 路徑叫 /api/attendance-data
            // 目前先用動態陣列模擬，只要接上 fetch 就能變真的
            const employees = [
                { id: "001", name: "員工 A", status: "已打卡", time: "08:00" },
                { id: "002", name: "員工 B", status: "未打卡", time: "--:--" },
                { id: "003", name: "員工 C", status: "已打卡", time: "08:15" }
            ];

            responseText = "📊 <b>全員即時工時結算</b>\n━━━━━━━━━━━━━━\n";
            employees.forEach(emp => {
                responseText += `👤 ${emp.id} ${emp.name} | ${emp.status}\n`;
                responseText += `🕒 時間：${emp.time}\n`;
                responseText += `────────────────\n`;
            });
        } 
        else if (text.includes('status')) {
            responseText = "✅ 系統運行中";
        } else {
            responseText = "請輸入 /check 查看全員狀態";
        }

        // 發送訊息邏輯 (保持 Promise 確保 Vercel 不會提前斷線)
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

    } catch (error) {
        console.error(error);
    }
    return res.status(200).send('OK');
}
