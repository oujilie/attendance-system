import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Clock, Shield, History, ChevronLeft, ChevronRight, 
  LogIn, LogOut, Users, MousePointer2, BarChart3, X, Plus, Trash2, Edit3
} from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const LEAVE_TYPES = [
  { id: '休', label: '休', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  { id: '事', label: '事', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: '病', label: '病', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  { id: '特', label: '特', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { id: '年', label: '年', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: '加', label: '加', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: '公', label: '公', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' }
];

const INITIAL_EMPLOYEES = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: (i + 1).toString().padStart(3, '0') }));

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState(1);
  const [selectedMonth] = useState('2026-03');
  const [activeTab, setActiveTab] = useState('table');
  const [selectedLeaveType, setSelectedLeaveType] = useState('休');
  
  // 核心資料狀態
  const [attendanceData, setAttendanceData] = useState({});
  const [punchRecords, setPunchRecords] = useState({});
  const [toast, setToast] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 10);
    return () => clearInterval(timer);
  }, []);

  const formatWithMs = (d) => {
    const pad = (n, l=2) => n.toString().padStart(l, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 打卡邏輯
  const handlePunch = async (manualTime = null, manualLabel = null) => {
    const timeStr = manualTime ? `${manualTime}:00.000` : formatWithMs(currentTime);
    const day = currentTime.getDate();
    const empName = INITIAL_EMPLOYEES.find(e => e.id === selectedUser).name;
    const punchKey = `${selectedUser}-${selectedMonth}-${day}`;
    
    const finalLabel = manualLabel || ((punchRecords[punchKey]?.length || 0) % 2 === 0 ? "IN" : "OUT");

    try {
      const { error } = await supabase.from('attendance').insert([{ 
        user_name: empName, 
        type: finalLabel, 
        created_at: new Date() 
      }]);
      
      if (error) throw error;

      setPunchRecords(prev => ({
        ...prev,
        [punchKey]: [...(prev[punchKey] || []), { time: timeStr, label: finalLabel }]
      }));

      showToast(`打卡成功: ${timeStr}`);
    } catch (err) {
      showToast("雲端同步失敗");
    }
  };

  // 儲存格點擊邏輯 (包含管理模式編輯)
  const handleCellClick = (empId, day) => {
    const cellKey = `${empId}-${selectedMonth}-${day}`;
    
    if (isAdmin) {
      // 管理員模式：優先開啟編輯視窗
      setEditingRecord({ empId, day, cellKey });
      return;
    }

    // 員工模式：標記假別
    setAttendanceData(prev => ({
      ...prev,
      [cellKey]: prev[cellKey] === selectedLeaveType ? '' : selectedLeaveType
    }));
  };

  if (!mounted) return null;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-800 p-4 pb-32">
      {/* 訊息提示 (置中) */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white px-8 py-3 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="font-bold tracking-tight">{toast}</span>
          </div>
        </div>
      )}

      {/* 頂部導覽 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-sm border border-white/50">
          <button onClick={() => setActiveTab('table')} className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'table' ? 'bg-white shadow-lg text-blue-600 scale-105' : 'text-slate-500 hover:bg-white/50'}`}>考勤表格</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'analysis' ? 'bg-white shadow-lg text-blue-600 scale-105' : 'text-slate-500 hover:bg-white/50'}`}>工時分析</button>
        </div>

        <div className="flex items-center gap-4">
          <select value={selectedUser} onChange={(e) => setSelectedUser(Number(e.target.value))} className="bg-white border-2 border-white px-4 py-2 rounded-2xl text-xs font-black shadow-xl outline-none focus:ring-2 ring-blue-500 transition-all">
            {INITIAL_EMPLOYEES.map(e => <option key={e.id} value={e.id}>切換至 {e.name}</option>)}
          </select>
          
          <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border-2 transition-all shadow-xl ${isAdmin ? 'bg-red-50 border-red-200' : 'bg-white border-white'}`}>
            <Shield className={`w-4 h-4 ${isAdmin ? 'text-red-600' : 'text-slate-400'}`} />
            <button onClick={() => setIsAdmin(!isAdmin)} className={`w-12 h-6 rounded-full relative transition-colors ${isAdmin ? 'bg-red-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isAdmin ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 時鐘區域 */}
      <div className="flex flex-col items-center mb-16">
        <div className="flex gap-3 mb-6">
          <button onClick={() => handlePunch('07:55', 'IN')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black border border-blue-100 hover:bg-blue-100 transition-all">模擬上班 07:55</button>
          <button onClick={() => handlePunch('16:05', 'OUT')} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[11px] font-black border border-red-100 hover:bg-red-100 transition-all">模擬下班 16:05</button>
        </div>

        <button onClick={() => handlePunch()} className="group relative bg-white p-12 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-8 border-white hover:scale-105 active:scale-95 transition-all duration-500">
          <div className="text-6xl md:text-8xl font-mono font-black text-slate-900 flex items-baseline tracking-tighter">
            {formatWithMs(currentTime).split('.')[0]}
            <span className="text-3xl md:text-4xl ml-3 text-orange-500 font-bold tabular-nums">.{formatWithMs(currentTime).split('.')[1]}</span>
          </div>
          <div className="text-[10px] mt-6 font-black text-slate-300 tracking-[1em] uppercase text-center group-hover:text-blue-500 transition-colors">Precision v008e</div>
        </button>
      </div>

      {/* 主要內容區域 */}
      {activeTab === 'table' ? (
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="sticky left-0 bg-slate-50 p-6 border-r border-slate-100 w-24 z-20 text-[10px] font-black text-slate-400 uppercase tracking-widest">Emp ID</th>
                  {daysInMonth.map(d => (
                    <th key={d} className={`p-4 border-r border-slate-50 min-w-[60px] ${d === currentTime.getDate() ? 'bg-blue-50/50' : ''}`}>
                      <div className={`text-xs font-black ${d === currentTime.getDate() ? 'text-blue-600' : 'text-slate-400'}`}>{d}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INITIAL_EMPLOYEES.map(emp => (
                  <tr key={emp.id} className={`group border-b border-slate-50 hover:bg-slate-50/30 transition-colors ${selectedUser === emp.id ? 'bg-blue-50/20' : ''}`}>
                    <td className={`sticky left-0 p-6 border-r border-slate-100 text-center font-black text-sm z-10 transition-colors ${selectedUser === emp.id ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400 group-hover:bg-slate-50'}`}>
                      {emp.name}
                    </td>
                    {daysInMonth.map(d => {
                      const key = `${emp.id}-${selectedMonth}-${d}`;
                      const leave = attendanceData[key];
                      const punches = punchRecords[key] || [];
                      const type = LEAVE_TYPES.find(t => t.id === leave);
                      
                      return (
                        <td key={d} onClick={() => handleCellClick(emp.id, d)} className={`border-r border-slate-50 h-20 text-center cursor-pointer relative transition-all active:scale-90 ${type?.bg || ''}`}>
                          {leave && <span className={`font-black text-xl ${type.color}`}>{leave}</span>}
                          {/* 打卡成功置中橘點 */}
                          {punches.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse" />
                            </div>
                          )}
                          {/* 管理模式提示 */}
                          {isAdmin && <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={10} className="text-slate-300"/></div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-20 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center gap-6">
          <BarChart3 size={64} className="text-slate-200" />
          <div className="text-slate-300 font-black uppercase tracking-[0.5em] text-sm text-center">
            Analysis Engine Initialized<br/>
            <span className="text-[10px] mt-2 block opacity-50">Awaiting Batch Data Synchronization...</span>
          </div>
        </div>
      )}

      {/* 底部假別選單 */}
      {!isAdmin && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] flex flex-wrap justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] border border-white/50 max-w-[95vw]">
          {LEAVE_TYPES.map(t => (
            <button key={t.id} onClick={() => setSelectedLeaveType(t.id)} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border-2 ${selectedLeaveType === t.id ? `${t.border} ${t.bg} ${t.color} scale-110 shadow-lg` : 'border-transparent text-slate-400 hover:bg-white/50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* 管理者編輯視窗 */}
      {editingRecord && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">編輯考勤數據</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Record ID: {editingRecord.cellKey}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 ml-1">修改假別</label>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => { setAttendanceData(p => ({...p, [editingRecord.cellKey]: ''})); setEditingRecord(null); }} className="p-3 border-2 border-dashed rounded-2xl text-xs font-black text-slate-300 hover:border-slate-300 hover:text-slate-500 transition-all">清除</button>
                  {LEAVE_TYPES.map(t => (
                    <button key={t.id} onClick={() => { setAttendanceData(p => ({...p, [editingRecord.cellKey]: t.id})); setEditingRecord(null); }} className={`p-3 rounded-2xl text-xs font-black border-2 ${t.bg} ${t.border} ${t.color} hover:scale-105 transition-all`}>{t.label}</button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <label className="block text-[10px] font-black text-red-400 uppercase mb-3 ml-1">危險操作</label>
                <button onClick={() => { setPunchRecords(p => { const n={...p}; delete n[editingRecord.cellKey]; return n; }); setEditingRecord(null); }} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                  <Trash2 size={18}/> 刪除當日所有打卡記錄
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
