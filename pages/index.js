import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Clock, Users, Shield, ChevronLeft, ChevronRight, 
  LogIn, LogOut, Coffee, CheckCircle 
} from 'lucide-react';

// 初始化 Supabase
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
    return `${h}:${m}:${s}.${ms}`;
  };

  const handlePunch = async (type) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert([{ user_name: selectedUser, type: type }]);
      if (error) throw error;
      setToast(`${selectedUser} ${type} 成功！`);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast("雲端同步失敗");
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 font-sans text-slate-700">
      <div className="max-w-[1200px] mx-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[92vh]">
        
        {/* 頂部導航列 */}
        <div className="p-4 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="p-1.5 bg-slate-100 rounded-lg">📋</span> 員工出勤管理系統 - 008版
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-blue-600 outline-none"
            >
              {EMPLOYEES.map(id => <option key={id} value={id}>切換至 {id}</option>)}
            </select>
            <div className="flex bg-slate-100 p-1 rounded-full scale-90">
              <button onClick={() => setIsAdmin(false)} className={`px-4 py-1.5 rounded-full font-bold transition ${!isAdmin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>一般員工</button>
              <button onClick={() => setIsAdmin(true)} className={`px-4 py-1.5 rounded-full font-bold transition ${isAdmin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>管理端</button>
            </div>
          </div>
        </div>

        {/* 主顯示區 */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* 大數字計時器 */}
          <div className="relative bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 text-center max-w-2xl mx-auto">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase">Precision Attendance V008</span>
            </div>
            <div className="text-7xl font-mono font-black text-[#1E3A8A] tracking-tighter mt-4">
              {formatWithMs(currentTime).split('.')[0]}
              <span className="text-3xl text-orange-500 ml-2">.{formatWithMs(currentTime).split('.')[1]}</span>
            </div>
          </div>

          {/* 考勤表格 */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3 border-r border-slate-100 w-16 text-center">代號</th>
                  {Array.from({ length: 21 }, (_, i) => (
                    <th key={i} className="p-3 border-r border-slate-100 text-center">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.slice(0, 6).map(id => (
                  <tr key={id} className="border-t border-slate-50">
                    <td className="p-3 border-r border-slate-100 text-center font-bold text-blue-600 bg-slate-50/30">{id}</td>
                    {Array.from({ length: 21 }, (_, i) => (
                      <td key={i} className="p-3 border-r border-slate-100"></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部控制區 (Labels) */}
        <div className="p-6 bg-white border-t border-slate-50">
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mr-4 text-blue-400 font-bold text-xs uppercase tracking-widest">
              <span className="rotate-45">➤</span> Labels
            </div>
            {LABELS.map(label => (
              <button 
                key={label}
                onClick={() => handlePunch
