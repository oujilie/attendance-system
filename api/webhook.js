// api/webhook.js
export default async function handler(req, res) {
  // 1. 只處理 POST 請求
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook is running');
  }

  try {
    const { message } = req.body;
    if (!message || !message.text) {
      return res.status(200).send('No message received');
    }

    const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';
    const chatId = message.chat.id;
    const text = message.text.toLowerCase().trim();
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

    let responseText = "";
    let replyMarkup = null;

    // --- 指令大腦 ---
    if (text.startsWith('/check')) {
      responseText = "📊 <b>精確工時模擬結算</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：07:55:00 (早到)\n🕒 下班：17:30:15\n\n⚖️ <b>計算結果：</b>\n├ 有效起點：08:00:00\n├ <b>一般工時：8.000 h</b>\n└ <b>加班工時：1.504 h</b>\n\n💡 <i>提示：系統已自動排除 08:00 前之早到時數。</i>";
    } 
    else if (text.startsWith('/today')) {
      responseText = `📅 <b>今日打卡總覽</b>\n━━━━━━━━━━━━━━\n🟢 <b>已上班：</b> 4 人\n🔴 <b>已下班：</b> 0 人\n🟡 <b>未到崗：</b> 11 人\n\n<b>最新動態：</b>\n- 001 (08:02:11)\n- 002 (07:55:04)\n- 003 (08:15:44) ⚠️\n- 009 (08:00:22)`;
      replyMarkup = {
        inline_keyboard: [[{ text: "🌐 開啟管理系統", url: "https://attendance-system-bice-one.vercel.app" }]]
      };
    }
    else if (text.startsWith('/leaves')) {
      responseText = "🏖 <b>今日請假人員名單</b>\n━━━━━━━━━━━━━━\n● 005 - 病假 (全天)\n● 008 - 特休 (下午)\n\n目前人力可用率：<b>86%</b>";
    }
    else if (text.startsWith('/status')) {
      responseText = `✅ <b>伺服器報告</b>\n━━━━━━━━━━━━━━\n● 狀態：運作正常\n● 時間：${now}`;
    }
    else if (text === '/start' || text === '/help') {
      responseText = "👋 <b>考勤戰情室指令手冊</b>\n\n/today - 今日打卡概況\n/check - 工時結算模擬\n/leaves - 請假人員查詢\n/status - 系統運行狀態";
    }
    else {
      responseText = "收到您的訊息！但目前我還不認識這個指令。\n請輸入 /help 查看。";
    }

    // --- 發送訊息給 Telegram (使用原生 fetch) ---
    const apiUrl = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    });

    // 務必回覆 200 給 Telegram，否則它會一直重傳
    return res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error('Webhook Error:', error.message);
    // 即使出錯也要回傳 200，避免 Telegram 伺服器重複攻擊
    return res.status(200).json({ error: error.message });
  }
}
