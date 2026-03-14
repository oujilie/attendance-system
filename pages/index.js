import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, User, Shield, Lock, History, ChevronLeft, ChevronRight, 
  Info, Clock, Fingerprint, Trash2, Plus, X, CheckCircle2, 
  BarChart3, Calculator, Beaker, LogIn, LogOut, Users, MousePointer2 
} from 'lucide-react';

// 初始化雲端帳本連線
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LEAVE_TYPES = [
  { id: '休', label: '休', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  { id: '事', label: '事', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: '病', label: '病', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { id: '特', label: '特', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { id: '年', label: '年', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: '加', label: '加', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: '公', label: '公', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: '產', label: '產', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { id: '檢', label: '檢', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  { id: '育', label: '育', color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-200' },
  { id: '婚', label: '婚', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: '喪', label: '喪', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  { id: '理', label: '理', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: '福', label: '福', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: '傷', label: '傷', color: 'text-orange-800', bg: 'bg-orange-100', border: 'border-orange-300' },
  { id: '家', label: '家', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

const INITIAL_EMPLOYEES = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: (i + 1).toString().padStart(3, '0'),
}));

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(1);
  const [attendanceData, setAttendanceData] = useState({});
  const [punchRecords, setPunchRecords] = useState({});
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClockPunch = async (label) => {
    const timeStr = formatWithMs(currentTime);
    const empName = INITIAL_EMPLOYEES.find(e => e.id === currentUser)?.name;
    
    // 同步到 Supabase
    const { error } = await supabase
      .from('attendance')
      .insert([{ user_name: empName, type: label }]);

    if (!error) {
      showToast(`${label}打卡成功！`);
    } else {
      showToast("雲端儲存失敗");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 標題與模式切換 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <Fingerprint className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">員工出勤管理系統</h1>
              <p className="text-slate-500 text-sm font-medium">Employee Attendance Management System</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button 
              onClick={() => setIsAdmin(false)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold ${!isAdmin ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MousePointer2 className="w-4 h-4" /> 員工打卡
            </button>
            <button 
              onClick={() => setIsAdmin(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold ${isAdmin ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Shield className="w-4 h-4" /> 管理者模式
            </button>
          </div>
        </div>

        {/* 核心內容區 */}
        {!isAdmin ? (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
                      <Clock className="w-4 h-4" /> 系統標準時間
                    </div>
                    <div className="text-5xl font-mono font-black text-slate-900 tracking-tighter">
                      {formatWithMs(currentTime)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 ml-1">選擇您的員工編號</label>
                    <select 
                      value={currentUser}
                      onChange={(e) => setCurrentUser(Number(e.target.value))}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none"
                    >
                      {INITIAL_EMPLOYEES.map(emp => (
                        <option key={emp.id} value={emp.id}>員工 {emp.name}</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <button onClick={() => handleClockPunch('上班')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-6 flex flex-col items-center gap-2 transition-all hover:-translate-y-1 shadow-lg shadow-emerald-100 font-black">
                        <LogIn className="w-8 h-8" /> 上班打卡
                      </button>
                      <button onClick={() => handleClockPunch('下班')} className="bg-rose-500 hover:bg-rose-600 text-white rounded-2xl py-6 flex flex-col items-center gap-2 transition-all hover:-translate-y-1 shadow-lg shadow-rose-100 font-black">
                        <LogOut className="w-8 h-8" /> 下班打卡
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-8 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
               <p className="text-center text-slate-400 mt-20">打卡紀錄與表格預覽載入中...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
            <Lock className="w-1
