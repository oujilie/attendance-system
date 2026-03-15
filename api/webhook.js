// api/webhook.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;
        const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

        let responseText = "";
        let replyMarkup = null;

        // --- 機器人指令邏輯大腦 ---

        // 1. 開始指令
        if (text === '/start') {
          responseText = "👋 <b>考勤系統戰情室已連線</b>\n\n您好！我是您的專屬考勤助手。您可以透過下方的指令選單，隨時掌握員工打卡動態。\n\n目前支援：\n/today - 今日打卡概況\n/check - 工時分析模擬\n/leaves - 今日請假清單\n/status - 系統運行狀態";
        } 
        
        // 2. 系統狀態
        else if (text === '/status') {
          responseText = `✅ <b>系統狀態報告</b>\n━━━━━━━━━━━━━━\n● 伺服器：Vercel Node.js\n● 狀態：運作正常 (Stable)\n● 時間：${now}\n● 版本：v8.0.2`;
        }

        // 3. 今日打卡概況 (包含名單模擬)
        else if (text === '/today') {
          responseText = "📅 <b>今日打卡總覽 (${now.split(' ')[0]})</b>\n━━━━━━━━━━━━━━\n🟢 <b>已上班：</b> 4 人\n🔴 <b>已下班：</b> 0 人\n🟡 <b>未到崗：</b> 11 人\n\n<b>即時名單：</b>\n- 001 (08:02:11)\n- 002 (07:55:04)\n- 003 (08:15:44) ⚠️\n- 004 (08:00:22)";
          replyMarkup = {
            inline_keyboard: [[{ text: "🌐 開啟管理後台", url: "https://attendance-system-bice-one.vercel.app" }]]
          };
        }

        // 4. 工時結算模擬 (依照您的 08:00 起算與 16:00 加班邏輯)
        else if (text === '/check') {
          responseText = "📊 <b>精確工時模擬結算</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：07:55:00 (早到)\n🕒 下班：17:30:15\n\n⚖️ <b>計算結果：</b>\n├ 有效起點：08:00:00\n├ <b>一般工時：8.000 h</b>\n└ <b>加班工時：1.504 h</b>\n\n💡 <i>提示：系統已自動排除 08:00 前之早到時數，並精確計算至小數點後三位。</i>";
        }

        // 5. 今日假別清單
        else if (text === '/leaves') {
          responseText = "🏖 <b>今日請假人員</b>\n━━━━━━━━━━━━━━\n● 005 - 病假 (全天)\n● 008 - 特休 (下午)\n\n目前人力可用率：<b>86%</b>";
        }

        // 6. 幫助手冊
        else if (text === '/help') {
          responseText = "💡 <b>指令使用幫助：</b>\n\n/today - 查看今日誰打卡、誰遲到。\n/check - 測試工時計算邏輯是否正確。\n/leaves - 查看今日有誰請假。\n/status - 檢查 Vercel 伺服器狀態。";
        }

        // 預設回覆
        else {
          responseText = "收到您的訊息！但我還不認識這個指令。\n請輸入 /help 查看可用清單。";
        }

        // --- 發送回傳訊息給 Telegram ---
        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'HTML',
            reply_markup: replyMarkup
          })
        });
      }
    } catch (error) {
      console.error('Webhook Error:', error);
    }
    return res.status(200).send('OK');
  }
  return res.status(200).send('Webhook is running...');
}
