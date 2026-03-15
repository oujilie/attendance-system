// api/webhook.js
const https = require('https');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    try {
        // 1. 確保拿到原始資料
        const body = req.body || {};
        const message = body.message || {};
        const chatId = message.chat?.id;
        const rawText = message.text || "";
        
        // 2. 更加寬鬆的指令檢查
        const text = rawText.toLowerCase().trim();
        const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

        if (!chatId) return res.status(200).send('No Chat ID');

        let responseText = "";
        let replyMarkup = null;

        // 3. 邏輯判斷 (使用最保險的 includes)
        if (text.includes('check')) {
            responseText = "📊 <b>打卡工時結算 (模擬)</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：08:00:00\n🕒 下班：17:30:00\n\n⚖️ <b>結果：</b>\n├ 一般：8.000 h\n└ 加班：1.500 h";
        } else if (text.includes('today')) {
            responseText = "📅 <b>今日考勤快報</b>\n━━━━━━━━━━━━━━\n🟢 已打卡：4 人\n🔴 未打卡：11 人";
            replyMarkup = { inline_keyboard: [[{ text: "🌐 管理系統", url: "https://attendance-system-bice-one.vercel.app" }]] };
        } else if (text.includes('status')) {
            responseText = "✅ <b>系統狀態：連線正常</b>\n時間：" + new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        } else {
            // DEBUG 模式：如果它說不認識，它會回傳它到底看到了什麼
            responseText = "⚠️ 偵測到未知指令\n收到的原始文字：[" + rawText + "]\n請輸入 /check 或 /today";
        }

        const data = JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
        });

        // 4. 強制等待傳送完成
        await new Promise((resolve, reject) => {
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
            const tgReq = https.request(options, (tgRes) => {
                tgRes.on('end', resolve);
                tgRes.on('data', () => {});
            });
            tgReq.on('error', reject);
            tgReq.write(data);
            tgReq.end();
        });

    } catch (err) {
        console.error("Critical Error:", err.message);
    }

    return res.status(200).json({ message: "processed" });
}
