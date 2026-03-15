// api/webhook.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { message } = req.body;
      // 您的 Telegram Bot Token
      const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text;
        // 取得台灣時間
        const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });

        let responseText = "";
        let replyMarkup = null;

        // --- 指令大腦開始 ---

        // 1. 歡迎與說明
        if (text === '/start') {
          responseText = "👋 <b>考勤戰情室已連線</b>\n\n您好！我是您的考勤助手。您可以透過選單掌握最新動態：\n\n/today - 今日打卡概況\n/check - 精確工時模擬\n/leaves - 今日請假查詢\n/status - 系統運行狀態\n/help - 指令手冊";
        } 

        // 2. 今日打卡概況 (對應您截圖中的推播風格)
        else if (text === '/today') {
          responseText = `📅 <b>今日打卡總覽 (${now.split(' ')[0]})</b>\n━━━━━━━━━━━━━━\n🟢 <b>已上班：</b> 4 人\n🔴 <b>已下班：</b> 0 人\n🟡 <b>未到崗：</b> 11 人\n\n<b>最新動態：</b>\n- 001 (08:02:11)\n- 002 (07:55:04)\n- 003 (08:15:44) ⚠️\n- 009 (08:00:22)`;
          replyMarkup = {
            inline_keyboard: [[{ text: "🌐 開啟管理系統", url: "https://attendance-system-bice-one.vercel.app" }]]
          };
        }

        // 3. 精確工時結算 (對應 index.js 邏輯：08:00起算，16:00後加班)
        else if (text === '/check') {
          responseText = "📊 <b>精確工時模擬結算</b>\n━━━━━━━━━━━━━━\n👤 員工：001\n🕒 上班：07:55:00 (早到)\n🕒 下班：17:30:15\n\n⚖️ <b>計算結果：</b>\n├ 有效起點：08:00:00\n├ <b>一般工時：8.000 h</b>\n└ <b>加班工時：1.504 h</b>\n\n💡 <i>提示：系統已自動過濾 08:00 前之早到時數。</i>";
        }

        // 4. 請假人員查詢 (對應 index.js 的假別設定)
        else if (text === '/leaves') {
          responseText = "🏖 <b>今日請假人員名單</b>\n━━━━━━━━━━━━━━\n● 005 - 病假 (全天)\n● 008 - 特休 (下午)\n\n目前人力可用率：<b>86%</b>";
        }

        // 5. 系統狀態
        else if (text === '/status') {
          responseText = `✅ <b>系統報告</b>\n━━━━━━━━━━━━━━\n● 狀態：運作正常\n● 時間：${now}\n● 網址：attendance-system-bice-one`;
        }

        // 6. 幫助
        else if (text === '/help') {
          responseText = "💡 <b>指令使用幫助：</b>\n\n/today - 查看誰已打卡、誰遲到。\n/check - 測試自動扣除早到的工時邏輯。\n/leaves - 查詢今日請假與人力百分比。\n/status - 檢查伺服器連線狀態。";
        }

        // 預設回覆
        else {
          responseText = "收到您的訊息了！但目前我還不認識這個指令喔。請輸入 /help 查看。";
        }

        // --- 發送訊息給 Telegram ---
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
  return res.status(200).send('Webhook Running...');
}
