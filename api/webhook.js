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
        
        // 更加強健的指令判斷，包含對帶有機器人名字的指令支援
        if (text.includes('check')) {
            responseText = "📊 <b>精確工時模擬結算</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：08:00:00\n🕒 下班：17:30:00\n\n⚖️ <b>計算結果：</b>\n├ 一般工時：8.000 h\n└ 加班工時：1.500 h";
        } else if (text.includes('today')) {
            responseText = "📅 <b>今日打卡總覽</b>\n━━━━━━━━━━━━━━\n🟢 <b>已上班：</b> 4 人\n🔴 <b>已下班：</b> 0 人";
        } else if (text.includes('status')) {
            responseText = "✅ <b>系統狀態報告</b>\n━━━━━━━━━━━━━━\n● 狀態：連線正常\n● 時間：" + new Date().toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'});
        } else {
            responseText = "⚠️ <b>未知指令</b>\n請嘗試使用 /check、/today 或 /status。";
        }

        const data = JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML'
        });

        // 關鍵：使用 Promise 確保 Vercel 等待訊息發送成功
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
                tgRes.on('data', () => {}); // 消耗數據流
                tgRes.on('end', resolve);
            });

            tgReq.on('error', reject);
            tgReq.write(data);
            tgReq.end();
        });

        return res.status(200).json({ status: 'sent' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(200).json({ error: error.message });
    }
}
