import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, LogIn, LogOut, Coffee, CheckCircle } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState('');
  const [toast, setToast] = useState(null);

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

  const handlePunch = async (type) => {
    if (!userName.trim()) {
      setToast("請輸入姓名");
      setTimeout(() => setToast(null), 2000);
      return;
    }
    try {
      const { error } = await supabase.from('attendance').insert([{ user_name: userName, type: type }]);
      if (error) throw error;
      setToast(`${type}打卡成功！`);
    } catch (err) {
      setToast("同步失敗");
    }
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-t-[12px] border-blue-500 p-8 md:p-12 text-center">
        <h1 className="text-2xl font-bold mb-10 tracking-tight">員工出勤管理系統</h1>
        
        <div className="bg-blue-50 rounded-2xl p-6 mb-10">
          <p className="text-blue-500 text-xs font-black mb-2 uppercase tracking-widest">目前系統時間</p>
          <div className="text-4xl font-mono font-black text-blue-700 tracking-tighter">
            {formatWithMs(currentTime)}
          </div>
        </div>

        <div className="space-y-6 text-left">
          <div>
            <label className="text-slate-400 text-sm font-bold mb-2 block ml-1">員工姓名</label>
            <input 
              type="text" 
              placeholder="請輸入您的姓名"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handlePunch('上班')} className="bg-[#2ecc71] hover:opacity-90 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-green-100">
              <Clock size={18} /> 上班打卡
            </button>
            <button onClick={() => handlePunch('下班')} className="bg-[#e74c3c] hover:opacity-90 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-red-100">
              <LogOut size={18} /> 下班打卡
            </button>
            <button onClick={() => handlePunch('休息開始')} className="bg-[#f1c40f] hover:opacity-90 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-yellow-100">
              <Coffee size={18} /> 休息開始
            </button>
            <button onClick={() => handlePunch('休息結束')} className="bg-[#3498db] hover:opacity-90 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-blue-100">
              <CheckCircle size={18} /> 休息結束
            </button>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-xl shadow-2xl font-bold animate-bounce">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
