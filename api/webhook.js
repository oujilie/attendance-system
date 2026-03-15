// api/webhook.js
// ... 前面 createClient 保持不變 ...

if (text.includes('check')) {
    // 關鍵修正：只抓取每位 user_name 的最新一筆紀錄
    // 我們利用 Supabase 的 rpc 或透過邏輯篩選
    const { data: records, error } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return sendTg(chatId, `❌ 錯誤: ${error.message}`, TG_TOKEN);

    // 邏輯處理：過濾重複，只保留每個人的最新一筆
    const latestRecords = [];
    const seenUsers = new Set();

    for (const record of records) {
        if (!seenUsers.has(record.user_name)) {
            seenUsers.add(record.user_name);
            latestRecords.push(record);
        }
    }

    let responseText = "📊 <b>全員當前考勤狀態</b>\n━━━━━━━━━━━━━━\n";
    
    latestRecords.forEach(emp => {
        const time = new Date(emp.created_at).toLocaleString('zh-TW', { 
            timeZone: 'Asia/Taipei', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const typeIcon = emp.type === 'IN' ? '🟢 上班' : (emp.type === 'OUT' ? '🔴 下班' : '🟡 ' + emp.type);
        
        responseText += `👤 <b>工號：${emp.user_name}</b>\n`;
        responseText += `${typeIcon} | ⏰ 最後時間：${time}\n`;
        responseText += `────────────────\n`;
    });

    await sendTg(chatId, responseText, TG_TOKEN);
}
