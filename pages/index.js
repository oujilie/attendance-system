import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Clock, Users, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMPLOYEES = Array.from({ length: 15 }, (_, i) => (i + 1).toString().padStart(3, '0'));
const LABELS = ['休', '事', '病', '特', '年', '加', '公', '產', '檢', '育', '婚', '喪', '理', '福', '傷', '家'];

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState('001');
  const [isAdmin, setIsAdmin] = useState(false);
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
    return { main: `${h}:${m}:${s}`, ms: ms };
  };

  const handlePunch = async (label) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert([{ user_name: selectedUser, type: label }]);
      if (error) throw error;
      setToast(`[${selectedUser}] ${label} 打卡成功`);
    } catch (err) {
      setToast("同步失敗");
    }
    setTimeout(() => setToast(null), 2500);
  };

  const time = formatWithMs(currentTime);

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 font-sans text-slate-700">
      <div className="max-w-[1100px] mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[94vh]">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500">📋</span>
            員工出勤管理系統 - 008版 (完整假別清單)
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Users size={14} className="text-slate-400" />
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent border-none text-blue-600 font-bold outline-none text-sm"
              >
                {EMPLOYEES.map(id => <option key={id} value={id}>切換至 {id}</option>)}
              </select>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-full items-center">
              <button onClick={() => setIsAdmin(false)} className={`px-4 py-1.5 rounded-full text-xs font-black transition ${!isAdmin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>一般員工</button>
              <button onClick={() => setIsAdmin(true)} className={`px-4 py-1.5 rounded-full text-xs font-black transition ${isAdmin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>管理端</button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-8 flex flex-col items-center">
          
          {/* Quick Mock Buttons */}
          <div className="flex gap-2 mb-8">
            <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2">
              <Clock size={12} /> 模擬打卡
            </button>
            {['上班 (07:55)', '上班 (08:05)', '下班 (16:05)', '下班 (21:35)'].map((t, idx) => (
              <button key={idx} className="bg-white border border-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-500 hover:bg-blue-50">
                {t}
              </button>
            ))}
          </div>

          {/* Clock Display */}
          <div className="relative bg-white rounded-[3rem] px-20 py-14 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.05)] border border-slate-50 mb-12 group">
            <ChevronLeft className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-100 group-hover:text-slate-200 cursor-pointer" />
            <div className="text-center">
              <div className="text-8xl font-mono font-black text-[#1E3A8A] tracking-tighter flex items-baseline">
                {time.main}
                <span className="text-4xl text-orange-500 ml-3">.{time.ms}</span>
              </div>
              <div className="mt-4 text-[11px] font-black text-slate-300 tracking-[0.5em] uppercase">
                PRECISION ATTENDANCE V008
              </div>
            </div>
            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-100 group-hover:text-slate-200 cursor-pointer" />
          </div>

          {/* Attendance Table */}
          <div className="w-full border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-[10px] border-collapse bg-white">
