// api/webhook.js
const https = require('https');

export default async function handler(req, res) {
    // 1. 優先回覆 Telegram 200 OK，避免它瘋狂重傳
    if (req.method !== 'POST') return res.status(200).send('OK');

    try {
        // 2. 診斷：強制抓取 body
        const body = req.body || {};
        const message = body.message || {};
        const chatId = message.chat ? message.chat.id : null;
        const rawText = message.text || "";
        
        // 3. 寬鬆判斷：不論有沒有斜線、不論大小寫
        const text = rawText.toLowerCase().trim();
        const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

        if (!chatId) {
            console.error("找不到 Chat ID", body);
            return res.status(200).send('No Chat ID');
        }

        let responseText = "";
        let replyMarkup = null;

        // 4. 關鍵：只要包含關鍵字就觸發
        if (text.includes('check')) {
            responseText = "📊 <b>打卡工時結算 (模擬)</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：08:00:00\n🕒 下班：17:30:00\n\n⚖️ <b>結果：</b>\n├ 一般：8.000 h\n└ 加班：1.500 h";
        } else if (text.includes('today')) {
            responseText = "📅 <b>今日考勤快報</b>\n━━━━━━━━━━━━━━\n🟢 已打卡：4 人\n🔴 未打卡：11 人";
            replyMarkup = { inline_keyboard: [[{ text: "🌐 管理系統", url: "https://attendance-system-bice-one.vercel.app" }]] };
        } else if (text.includes('status')) {
            responseText = "✅ <b>系統狀態：連線正常</b>\n時間：" + new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        } else {
            // 診斷回音：如果抓不到指令，直接把收到的文字噴出來
            responseText = "⚠️ 偵測到未知內容\n收到的文字：[" + rawText + "]\n請輸入 /check 或 /today";
        }

        const sendData = JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
        });

        // 5. 強制等待傳送完成才結束函式
        await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${TG_TOKEN}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(sendData)
                }
            };
            const tgReq = https.request(options, (tgRes) => {
                tgRes.on('data', () => {});
                tgRes.on('end', resolve);
            });
            tgReq.on('error', reject);
            tgReq.write(sendData);
            tgReq.end();
        });

    } catch (err) {
        console.error("發送出錯:", err.message);
    }

    return res.status(200).json({ status: 'done' });
}
