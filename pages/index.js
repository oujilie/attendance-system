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
  { id: '公', label: '公', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: '產', label: '產', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' },
  { id: '檢', label: '檢', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
  { id: '育', label: '育', color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-200' },
  { id: '婚', label: '婚', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: '喪', label: '喪', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  { id: '理', label: '理', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: '福', label: '福', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: '傷', label: '傷', color: 'text-orange-800', bg: 'bg-orange-100', border: 'border-orange-300' },
  { id: '家', label: '家', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
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

  const handlePunch = async (manualTime = null, manualLabel = null) => {
    const timeStr = manualTime ? `${manualTime}:00.000` : formatWithMs(currentTime);
    const day = currentTime.getDate();
    const punchKey = `${selectedUser}-${selectedMonth}-${day}`;
    const empName = INITIAL_EMPLOYEES.find(e => e.id === selectedUser).name;
    const finalLabel = manualLabel || ((punchRecords[punchKey]?.length || 0) % 2 === 0 ? "IN" : "OUT");

    try {
      const { error } = await supabase.from('attendance').insert([{ user_name: empName, type: finalLabel, created_at: new Date() }]);
      if (error) throw error;
      setPunchRecords(prev => ({ ...prev, [punchKey]: [...(prev[punchKey] || []), { time: timeStr, label: finalLabel }] }));
      showToast(`打卡成功: ${timeStr}`);
    } catch (err) {
      showToast("雲端同步失敗");
    }
  };

  const handleCellClick = (empId, day) => {
    const cellKey = `${empId}-${selectedMonth}-${day}`;
    if (isAdmin) {
      setEditingRecord({ empId, day, cellKey });
      return;
    }
    setAttendanceData(prev => ({ ...prev, [cellKey]: prev[cellKey] === selectedLeaveType ? '' : selectedLeaveType }));
  };

  if (!mounted) return <div className="min-h-screen bg-[#F4F6F8]" />;

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-800 p-4 pb-40">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-8 py-3 rounded-2xl shadow-2xl animate-in fade-in zoom-in">
          <span className="font-bold">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-white/50">
          <button onClick={() => setActiveTab('table')} className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'table' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500'}`}>考勤表格</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-8 py-2 rounded-xl text-sm font-black transition-all ${activeTab === 'analysis' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500'}`}>工時分析</button>
        </div>
        <div className="flex items-center gap-4">
          <select value={selectedUser} onChange={(e) => setSelectedUser(Number(e.target.value))} className="bg-white border-2 border-white px-4 py-2 rounded-2xl text-xs font-black shadow-xl outline-none">
            {INITIAL_EMPLOYEES.map(e => <option key={e.id} value={e.id}>切換至 {e.name}</option>)}
          </select>
          <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border-2 transition-all shadow-xl ${isAdmin ? 'bg-red-50 border-red-200' : 'bg-white border-white'}`}>
            <Shield className={`w-4 h-4 ${isAdmin ? 'text-red-600' : 'text-slate-400'}`} />
            <button onClick={() => setIsAdmin(!isAdmin)} className={`w-12 h-6 rounded-full relative transition-colors ${isAdmin ? 'bg-red-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAdmin ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Clock Section */}
      <div className="flex flex-col items-center mb-16">
        <div className="flex gap-3 mb-6">
          <button onClick={() => handlePunch('07:55', 'IN')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black border border-blue-100">模擬上班 07:55</button>
          <button onClick={() => handlePunch('16:05', 'OUT')} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[11px] font-black border border-red-100">模擬下班 16:05</button>
        </div>
        <button onClick={() => handlePunch()} className="group relative bg-white p-12 rounded-[4rem] shadow-2xl border-8 border-white hover:scale-105 transition-all">
          <div className="text-6xl md:text-8xl font-mono font-black text-slate-900 flex items-baseline">
            {formatWithMs(currentTime).split('.')[0]}
            <span className="text-3xl md:text-4xl ml-3 text-orange-500 font-bold">.{formatWithMs(currentTime).split('.')[1]}</span>
          </div>
          <div className="text-[10px] mt-6 font-black text-slate-300 tracking-[1em] uppercase text-center">Precision v008e</div>
        </button>
      </div>

      {/* Main Content */}
      {activeTab === 'table' ? (
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="sticky left-0 bg-slate-50 p-6 border-r border-slate-100 w-24 z-20 text-[10px] font-black text-slate-400">代號</th>
                  {daysInMonth.map(d => (
                    <th key={d} className={`p-4 border-r border-slate-50 min-w-[60px] ${d === currentTime.getDate() ? 'bg-blue-50/50 text-blue-600' : 'text-slate-400'} text-xs font-black`}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INITIAL_EMPLOYEES.map(emp => (
                  <tr key={emp.id} className={`border-b border-slate-50 ${selectedUser === emp.id ? 'bg-blue-50/20' : ''}`}>
                    <td className={`sticky left-0 p-6 border-r border-slate-100 text-center font-black text-sm z-10 ${selectedUser === emp.id ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400'}`}>{emp.name}</td>
                    {daysInMonth.map(d => {
                      const key = `${emp.id}-${selectedMonth}-${d}`;
                      const leave = attendanceData[key];
                      const punches = punchRecords[key] || [];
                      const type = LEAVE_TYPES.find(t => t.id === leave);
                      return (
                        <td key={d} onClick={() => handleCellClick(emp.id, d)} className={`border-r border-slate-50 h-20 text-center cursor-pointer relative ${type?.bg || ''}`}>
                          {leave && <span className={`font-black text-xl ${type.color}`}>{leave}</span>}
                          {punches.length > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
                            </div>
                          )}
                          {isAdmin && <div className="absolute top-1 right-1"><Edit3 size={10} className="text-slate-200"/></div>}
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
        <div className="bg-white rounded-[2.5rem] p-20 border-4 border-dashed border-slate-100 flex flex-col items-center justify-center">
          <BarChart3 size={64} className="text-slate-100 mb-4" />
          <div className="text-slate-300 font-black tracking-widest uppercase">Analysis Module Active</div>
        </div>
      )}

      {/* Footer Selector */}
      {!isAdmin && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] flex flex-wrap justify-center gap-2 px-8 py-4 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 max-w-[95vw]">
          {LEAVE_TYPES.map(t => (
            <button key={t.id} onClick={() => setSelectedLeaveType(t.id)} className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border-2 ${selectedLeaveType === t.id ? `${t.border} ${t.bg} ${t.color} scale-110 shadow-md` : 'border-transparent text-slate-400 hover:bg-slate-50'}`}>{t.label}</button>
          ))}
        </div>
      )}

      {/* Admin Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tighter">編輯紀錄</h3>
              <button onClick={() => setEditingRecord(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-1">修改假別</label>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => { setAttendanceData(p => ({...p, [editingRecord.cellKey]: ''})); setEditingRecord(null); }} className="p-3 border-2 border-dashed rounded-xl text-xs font-black text-slate-300 hover:text-slate-500 transition-all">清除</button>
                  {LEAVE_TYPES.map(t => (
                    <button key={t.id} onClick={() => { setAttendanceData(p => ({...p, [editingRecord.cellKey]: t.id})); setEditingRecord(null); }} className={`p-3 rounded-xl text-xs font-black border-2 ${t.bg} ${t.border} ${t.color} hover:scale-105 transition-all`}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-50">
                <button onClick={() => { setPunchRecords(p => { const n={...p}; delete n[editingRecord.cellKey]; return n; }); setEditingRecord(null); }} className="w-full p-4 bg-red-50 text-red-600 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                  <Trash2 size={18}/> 刪除當日打卡紀錄
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
