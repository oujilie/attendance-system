// api/webhook.js
const https = require('https');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('運作中');
  }

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).send('OK');

    const chatId = message.chat.id;
    const text = message.text.toLowerCase().trim();
    const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    let responseText = "";
    let replyMarkup = null;

    // --- 指令大腦 ---
    if (text.startsWith('/check')) {
      responseText = "📊 <b>精確工時模擬結算</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：07:55:00\n🕒 下班：17:30:15\n\n⚖️ <b>計算結果：</b>\n├ 一般工時：8.000 h\n└ 加班工時：1.504 h";
    } else if (text.startsWith('/today')) {
      responseText = "📅 <b>今日打卡總覽</b>\n━━━━━━━━━━━━━━\n🟢 已上班：4 人\n🔴 已下班：0 人";
      replyMarkup = { inline_keyboard: [[{ text: "🌐 開啟管理系統", url: "https://attendance-system-bice-one.vercel.app" }]] };
    } else if (text.startsWith('/status')) {
      responseText = `✅ 伺服器狀態：正常\n⏰ 時間：${now}`;
    } else {
      responseText = "👋 歡迎使用考勤助手！\n輸入 /status 或 /check 試試看。";
    }

    // --- 使用 HTTPS 模組發送訊息 (最穩定) ---
    const data = JSON.stringify({
      chat_id: chatId,
      text: responseText,
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TG_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const tgReq = https.request(options);
    tgReq.write(data);
    tgReq.end();

    return res.status(200).json({ status: 'sent' });

  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
}
