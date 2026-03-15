import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('OK');

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const text = message.text.toLowerCase().trim();
  const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';

  if (text.includes('check')) {
    try {
      // 同時抓取兩個表，避免漏掉任何資料
      const [{ data: att }, { data: punch }] = await Promise.all([
        supabase.from('attendance').select('*').order('created_at', { ascending: true }),
        supabase.from('punch_logs').select('*').order('created_at', { ascending: true })
      ]);

      // 合併所有來源的資料
      const allRecords = [...(att || []), ...(punch || [])];
      
      if (allRecords.length === 0) {
        await sendToTelegram(chatId, "📭 找不到任何打卡紀錄。", TG_TOKEN);
        return res.status(200).send('OK');
      }

      // 使用 Map 確保每個工號只顯示最後一筆
      const userMap = new Map();
      allRecords.forEach(r => {
        const id = r.user_name || r.user_id || "未知";
        userMap.set(id, r);
      });

      let responseText = `📊 <b>全員考勤狀態表</b>\n━━━━━━━━━━━━━━\n`;
      
      // 依照工號排序 (001, 002...)
      const sortedUsers = Array.from(userMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      sortedUsers.forEach(([id, emp]) => {
        const time = emp.created_at ? new Date(emp.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit' }) : "--:--";
        const icon = (emp.type === 'IN' || emp.status === '已打卡') ? '🟢 上班' : '🔴 下班';
        responseText += `👤 <b>工號：${id}</b>\n${icon} | ⏰ 時間：${time}\n────────────────\n`;
      });

      await sendToTelegram(chatId, responseText, TG_TOKEN);
    } catch (err) {
      await sendToTelegram(chatId, `❌ 發生錯誤: ${err.message}`, TG_TOKEN);
    }
  }

  return res.status(200).json({ status: 'done' });
}

// 使用 fetch 確保請求在 Serverless 環境下能完整送出
async function sendToTelegram(chatId, text, token) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  });
  return response.json();
}
