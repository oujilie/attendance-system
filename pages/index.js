import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, LogIn, LogOut, Coffee, CheckCircle } from 'lucide-react';

// 1. 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState('');
  const [toast, setToast] = useState(null);

  // 更新系統時間
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10);
    return () => clearInterval(timer);
  }, []);

  const formatWithMs = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 核心打卡邏輯
  const handlePunch = async (type) => {
    if (!userName.trim()) {
      showToast("請輸入員工姓名");
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .insert([{ user_name: userName, type: type }]);

      if (error) throw error;
      showToast(`${userName} ${type}打卡成功！`);
    } catch (err) {
      console.error(err);
      showToast("雲端同步失敗，請檢查網路");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-t-8 border-blue-500">
        <div className="p-8 md:p-12">
          {/* 標題 */}
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-10 tracking-wider">
            員工出勤管理系統
          </h1>

          {/* 時間顯示區 */}
          <div className="bg-blue-50 rounded-2xl p-6 text-center mb-10">
            <p className="text-blue-500 text-xs font-bold mb-2 tracking-widest uppercase">目前系統時間</p>
            <div className="text-4xl font-mono font-black text-blue-700 tracking-tighter">
              {formatWithMs(currentTime)}
            </div>
          </div>

          {/* 輸入區 */}
          <div className="space-y-6">
            <div>
              <label className="text-slate-400 text-sm mb-2 block ml-1">員工姓名</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="請輸入您的姓名"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 font-medium"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              </div>
            </div>

            {/* 按鈕區 */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handlePunch('上班')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
              >
                <Clock size={20} /> 上班打卡
              </button>
              <button 
                onClick={() => handlePunch('下班')}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-rose-100 transition-all active:scale-95"
              >
                <LogOut size={20} /> 下班打卡
              </button>
              <button 
                onClick={() => handlePunch('休息開始')}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-amber-100 transition-all active:scale-95"
              >
                <Coffee size={20} /> 休息開始
              </button>
              <button 
                onClick={() => handlePunch('休息結束')}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                <CheckCircle size={20} /> 休息結束
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 提示訊息 */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-bold animate-in fade-
