// api/webhook.js
const https = require('https');

export default async function handler(req, res) {
    // 強制回覆 200 給 Telegram
    if (req.method !== 'POST') return res.status(200).send('OK');

    try {
        const body = req.body;
        if (!body || !body.message) return res.status(200).send('No Message');

        const chatId = body.message.chat.id;
        const rawText = body.message.text || "";
        const text = rawText.toLowerCase().trim();
        const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';
        
        let responseText = "";
        let replyMarkup = null;

        // 使用最直覺的 if 判斷，避免 startsWith 可能產生的問題
        if (text.includes('/check')) {
            responseText = "📊 <b>打卡工時結算 (模擬)</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：08:00:00\n🕒 下班：17:30:00\n\n⚖️ <b>結果：</b>\n├ 一般：8.000 h\n└ 加班：1.500 h";
        } else if (text.includes('/today')) {
            responseText = "📅 <b>今日考勤快報</b>\n━━━━━━━━━━━━━━\n🟢 已打卡：4 人\n🔴 未打卡：11 人";
            replyMarkup = { inline_keyboard: [[{ text: "🌐 管理系統", url: "https://attendance-system-bice-one.vercel.app" }]] };
        } else if (text.includes('/status')) {
            responseText = "✅ <b>系統目前狀態：運作正常</b>";
        } else {
            // 如果連指令都抓不到，直接噴出原始文字 debug
            responseText = "收到的指令是: " + rawText + "\n請輸入 /check 或 /today";
        }

        const data = JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
        });

        // 用最原始的 Promise 確保 Vercel 傳完才斷線
        await new Promise((resolve) => {
            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${TG_TOKEN}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };
            const tgReq = https.request(options, resolve);
            tgReq.write(data);
            tgReq.end();
        });

    } catch (e) {
        console.error(e);
    }

    return res.status(200).json({ status: 'done' });
}
