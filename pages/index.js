import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Clock, Shield, History, ChevronLeft, ChevronRight, 
  LogIn, LogOut, Users, MousePointer2, BarChart3, X, Plus, Trash2, Beaker
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
  const [time, setTime] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(1);
  const [month] = useState('2026-03');
  const [activeTab, setActiveTab] = useState('table');
  const [leaveType, setLeaveType] = useState('休');
  const [attendance, setAttendance] = useState({});
  const [punches, setPunches] = useState({});
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 10);
    return () => clearInterval(t);
  }, []);

  const formatTime = (d) => {
    const pad = (n, l=2) => n.toString().padStart(l, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  };

  const handlePunch = async (mTime = null, label = "AUTO") => {
    const tStr = mTime ? `${mTime}:00.000` : formatTime(time);
    const day = time.getDate();
    const key = `${user}-${month}-${day}`;
    const type = label === "AUTO" ? ((punches[key]?.length || 0) % 2 === 0 ? "IN" : "OUT") : label;

    try {
      const { error } = await supabase.from('attendance').insert([{ 
        user_name: INITIAL_EMPLOYEES.find(e => e.id === user).name, 
        type, 
        created_at: new Date() 
      }]);
      
      if (error) throw error;

      // 重要：更新打卡紀錄狀態，畫面才會顯示小橘點
      setPunches(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), { time: tStr, label: type }]
      }));

      setHistory(h => [{ 
        timestamp: formatTime(new Date()), 
        action: `打卡成功(${type})`, 
        target: `${INITIAL_EMPLOYEES.find(e => e.id === user).name} - ${day}日` 
      }, ...h]);

      setToast(`打卡成功: ${tStr}`);
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast("同步失敗");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCell = (uid, d) => {
    const k = `${uid}-${month}-${d}`;
    setAttendance(p => ({ ...p, [k]: p[k] === leaveType ? '' : leaveType }));
  };

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;

  const days = Array.from({ length: new Date(2026, 3, 0).getDate() }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 font-sans text-slate-800 pb-32">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 text-white px-6 py-2 rounded-full shadow-2xl border border-slate-700 animate-bounce text-sm">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab('table')} className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'table' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>考勤表格</button>
          <button onClick={() => setActiveTab('analysis')} className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'analysis' ? 'bg-white shadow-sm' : 'text-slate-500'}`}>工時分析</button>
        </div>
        <div className="flex items-center gap-4">
          <select value={user} onChange={(e) => setUser(Number(e.target.value))} className="bg-white border px-3 py-1.5 rounded-xl text-xs font-black shadow-sm outline-none">
            {INITIAL_EMPLOYEES.map(e => <option key={e.id} value={e.id}>切換至 {e.name}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border shadow-sm">
            <Shield className={`w-4 h-4 ${isAdmin ? 'text-red-600' : 'text-blue-600'}`} />
            <button onClick={() => setIsAdmin(!isAdmin)} className={`w-10 h-5 rounded-full relative transition-colors ${isAdmin ? 'bg-red-500' : 'bg-blue-500'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAdmin ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-12">
        {/* 修正：管理員模式下也能看到模擬按鈕方便測試 */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => handlePunch('07:55', 'IN')} className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-50">07:55 上班</button>
          <button onClick={() => handlePunch('16:05', 'OUT')} className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black text-red-600 hover:bg-red-50">16:05 下班</button>
        </div>

        {/* 修正：取消 disabled={isAdmin}，讓你在管理員模式也能點擊大時鐘打卡 */}
        <button onClick={() => handlePunch()} className="group relative p-10 rounded-[3rem] border shadow-2xl transition-all bg-white hover:scale-105 active:scale-95">
          <div className="text-5xl md:text-7xl font-mono font-black text-slate-900 flex items-baseline">
            {formatTime(time).split('.')[0]}
            <span className="text-2xl md:text-3xl ml-2 text-orange-500 font-bold tabular-nums">.{formatTime(time).split('.')[1]}</span>
          </div>
          <div className="text-[9px] mt-4 font-black text-slate-400 tracking-[0.5em] uppercase text-center">PRECISION v008e</div>
        </button>
      </div>

      {activeTab === 'table' ? (
        <div className="bg-white rounded-3xl shadow-xl overflow-x-auto border border-slate-100">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-black text-slate-400">
                <th className="sticky left-0 bg-slate-50 p-4 border-r w-16 z-20">代號</th>
                {days.map(d => (
                  <th key={d} className={`p-2 border-r min-w-[50px] ${d === time.getDate() ? 'bg-orange-50 text-orange-600' : ''}`}>
                    <div className="text-[12px]">{d}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INITIAL_EMPLOYEES.map(emp => (
                <tr key={emp.id} className={`border-b border-slate-50 ${user === emp.id ? 'bg-blue-50/20' : ''}`}>
                  <td className={`sticky left-0 p-4 border-r text-center font-black text-sm z-10 ${user === emp.id ? 'bg-blue-50 text-blue-600' : 'bg-white text-slate-400'}`}>{emp.name}</td>
                  {days.map(d => {
                    const cellKey = `${emp.id}-${month}-${d}`;
                    const val = attendance[cellKey];
                    const hasPunch = punches[cellKey]?.length > 0;
                    const type = LEAVE_TYPES.find(t => t.id === val);
                    return (
                      <td key={d} onClick={() => handleCell(emp.id, d)} className={`border-r h-16 text-center cursor-pointer hover:bg-slate-50 transition-colors relative ${type?.bg || ''}`}>
                        {val && <span className={`font-black text-lg ${type.color}`}>{val}</span>}
                        {/* 打卡成功後顯示的小橘點 */}
                        {hasPunch && <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-20 text-center font-black text-slate-300 uppercase tracking-widest bg-white rounded-3xl border border-dashed">Analysis Module Loaded</div>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex flex-wrap justify-center gap-1.5 px-6 py-3 bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 max-w-[95vw]">
        {LEAVE_TYPES.map(t => (
          <button key={t.id} onClick={() => setLeaveType(t.id)} className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${leaveType === t.id ? `${t.border} ${t.bg} ${t.color} scale-110 shadow-md` : 'border-transparent text-slate-400 hover:bg-slate-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {showHistory && isAdmin && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[600] p-6 border-l animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-black text-red-600 text-sm tracking-tighter uppercase">System Logs</h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <div className="space-y-4 overflow-y-auto h-[calc(100vh-100px)]">
            {history.map((h, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg text-[11px] border border-slate-100">
                <div className="text-slate-400 font-mono">{h.timestamp}</div>
                <div className="font-black text-slate-800 mt-1">{h.action}</div>
                <div className="text-blue-600 font-bold">{h.target}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <button onClick={() => setShowHistory(true)} className="fixed bottom-24 right-6 p-4 bg-white rounded-2xl shadow-lg border border-slate-200 hover:scale-110 transition-transform z-[550]">
          <History className="text-slate-600" />
        </button>
      )}
    </div>
  );
}
