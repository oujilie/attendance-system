// api/webhook.js
const https = require('https');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).send('OK');

    try {
        const { message } = req.body;
        if (!message || !message.text) return res.status(200).send('OK');

        const chatId = message.chat.id;
        const text = message.text.toLowerCase().trim();
        const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';
        const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

        let responseText = "";
        let replyMarkup = null;

        // --- 功能 1: 精確工時模擬 (改為多人動態格式範本) ---
        if (text.includes('check')) {
            // 未來這裡會改為從你的資料庫 fetch 資料
            const mockEmployees = [
                { id: "001", name: "員工 A", in: "07:55:00", out: "17:30:15", work: "8.000", ot: "1.504" },
                { id: "002", name: "員工 B", in: "08:10:22", out: "17:05:00", work: "7.910", ot: "0.000" },
                { id: "009", name: "員工 C", in: "08:00:10", out: "18:45:30", work: "8.000", ot: "2.758" }
            ];

            responseText = "📊 <b>全員精確工時結算</b>\n━━━━━━━━━━━━━━\n";
            
            mockEmployees.forEach(emp => {
                responseText += `👤 <b>${emp.id} ${emp.name}</b>\n`;
                responseText += `🕒 上/下班：${emp.in} / ${emp.out}\n`;
                responseText += `⚖️ 工時：${emp.work}h | 加班：<b>${emp.ot}h</b>\n`;
                responseText += `────────────────\n`;
            });
            
            responseText += `\n💡 <i>系統已自動排除 08:00 前之早到時數。</i>`;
        } 

        // --- 功能 2: 今日打卡概況 (保持不變) ---
        else if (text.includes('today')) {
            responseText = `📅 <b>今日打卡總覽</b>\n━━━━━━━━━━━━━━\n🟢 <b>已上班：</b> 4 人\n🔴 <b>已下班：</b> 0 人\n\n<b>即時動態：</b>\n- 001 (08:02)\n- 002 (07:55)\n- 003 (08:15) ⚠️\n- 009 (08:00)`;
            replyMarkup = {
                inline_keyboard: [[{ text: "🌐 開啟管理系統", url: "https://attendance-system-bice-one.vercel.app" }]]
            };
        }

        // --- 功能 3: 請假人員 (保持不變) ---
        else if (text.includes('leaves')) {
            responseText = "🏖 <b>今日請假人員名單</b>\n━━━━━━━━━━━━━━\n● 005 - 病假 (全天)\n● 008 - 特休 (下午)";
        }

        // --- 功能 4: 系統狀態 (保持不變) ---
        else if (text.includes('status')) {
            responseText = `✅ <b>系統連線正常</b>\n⏰ 時間：${now}`;
        }

        // --- 功能 5: 預設幫助 ---
        else {
            responseText = "👋 <b>考勤助手指令：</b>\n/check - 查看所有人精確工時\n/today - 今日打卡概況\n/leaves - 誰請假\n/status - 伺服器狀態";
        }

        const data = JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
        });

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
                tgRes.on('data', () => {});
                tgRes.on('end', resolve);
            });
            tgReq.on('error', reject);
            tgReq.write(data);
            tgReq.end();
        });

        return res.status(200).json({ status: 'success' });

    } catch (error) {
        return res.status(200).json({ error: error.message });
    }
}
