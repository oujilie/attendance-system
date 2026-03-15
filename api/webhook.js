// api/webhook.js
export default async function handler(req, res) {
  // 只處理 Telegram 傳來的 POST 請求
  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;

        let responseText = "";

        // 設定機器人的指令大腦
        if (text === '/start') {
          responseText = "👋 您好！考勤助手已連線。\n\n目前支援指令：\n/status - 檢查系統狀態\n/help - 顯示幫助手冊";
        } else if (text === '/status') {
          responseText = "📊 系統狀態：運作正常\n📅 當前時間：" + new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        } else if (text === '/help') {
          responseText = "💡 這是您的考勤管理助手。\n當員工打卡時，我會主動發通知給您。\n您也可以輸入指令來查詢即時數據。";
        } else {
          responseText = "收到您的訊息了！但目前我還不認識這個指令喔。";
        }

        // 回傳訊息給 Telegram 使用者
        if (responseText) {
          await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: responseText,
              parse_mode: 'HTML'
            })
          });
        }
      }
    } catch (error) {
      console.error('Webhook Error:', error);
    }
    return res.status(200).send('OK');
  }
  
  // 如果有人用瀏覽器直接打開這個網址，顯示這個
  return res.status(200).send('<h1>Webhook 運作中</h1><p>請從 Telegram 使用指令</p>');
}
