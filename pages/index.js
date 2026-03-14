import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, User, Coffee, LogOut, CheckCircle } from 'lucide-react';

// 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState('');
  const [toast, setToast] = useState(null);

  // 更新時間邏輯
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePunch = async (type) => {
    if (!currentUser.trim()) {
      showToast('請先輸入姓名！');
      return;
    }

    const logMsg = `${currentUser} 於 ${formatWithMs(currentTime)} 執行【${type}】`;

    // A. 存入 Supabase
    const { error } = await supabase
      .from('attendance')
      .insert([{ user_name: currentUser, type: type }]);

    if (!error) {
      // B. 這裡你可以選擇是否連動 Telegram，目前先確保介面能跑
      showToast(`打卡成功！${type}`);
    } else {
      console.error(error);
      showToast('雲端同步失敗，請檢查資料表設定');
    }
  };

  const formatWithMs = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-blue-500">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">員工出勤管理系統</h1>
        
        {/* 時間顯示 */}
        <div className="text-center mb-8 bg-blue-50 p-4 rounded-xl">
          <div className="text-sm text-blue-500 font-medium mb-1">目前系統時間</div>
          <div className="text-4xl font-mono font-bold text-blue-700">
            {formatWithMs(currentTime)}
          </div>
        </div>

        {/* 姓名輸入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">員工姓名</label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="請輸入您的姓名"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
            />
          </div>
        </div>

        {/* 按鈕區域 */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handlePunch('上班')} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition shadow-lg">
            <Clock className="w-5 h-5" /> 上班打卡
          </button>
          <button onClick={() => handlePunch('下班')} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition shadow-lg">
            <LogOut className="w-5 h-5" /> 下班打卡
          </button>
          <button onClick={() => handlePunch('休息開始')} className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition shadow-lg">
            <Coffee className="w-5 h-5" /> 休息開始
          </button>
          <button onClick={() => handlePunch('休息結束')} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition shadow-lg">
            <CheckCircle className="w-5 h-5" /> 休息結束
          </button>
        </div>

        {/* 提示泡泡 */}
        {toast && (
          <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
