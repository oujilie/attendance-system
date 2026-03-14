import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Clock, Shield, History, ChevronLeft, ChevronRight, 
  LogIn, LogOut, Users, MousePointer2, BarChart3, X, Plus, Trash2, Beaker
} from 'lucide-react';

// 初始化 Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 假別清單配置
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
  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [selectedLeaveType, setSelectedLeaveType] = useState('休'); 
  const [activeTab, setActiveTab] = useState('table'); 
  const [attendanceData, setAttendanceData] = useState({});
  const [punchRecords, setPunchRecords] = useState({}); 
  const [editHistory, setEditHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [editingPunch, setEditingPunch] = useState(null); 
  const [newPunchTime, setNewPunchTime] = useState("");
  const [newPunchMs, setNewPunchMs] = useState("000"); 
  const [newPunchLabel, setNewPunchLabel] = useState("OUT");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentDay = currentTime.getDate();
  const currentMonthStr = `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}`;
  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayOfWeek = (day) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    return weeks[date.getDay()];
  };

  const formatWithMs = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  const handleClockPunch = async (manualBaseTime = null, label = "AUTO") => {
    const timeStr = manualBaseTime ? `${manualBaseTime}:00.000` : formatWithMs(currentTime);
    const empName = INITIAL_EMPLOYEES.find(e => e.id === currentUser)?.name;
    const punchKey = `${currentUser}-${selectedMonth}-${currentDay}`;
    
    let finalLabel = label;
    if (label === "AUTO") {
      const existing = punchRecords[punchKey] || [];
      finalLabel = existing.length % 2 === 0 ? "IN" : "OUT";
    }

    try {
      const { error } = await supabase.from('attendance').insert([
        { user_name: empName, type: finalLabel, created_at: new Date() }
      ]);
      if (error) throw error;

      setPunchRecords(prev => ({ 
        ...prev, 
        [punchKey]: [...(prev[punchKey] || []), { time: timeStr, label: finalLabel }] 
      }));

      setEditHistory(prev => [{
        timestamp: formatWithMs(new Date()),
        admin: manualBaseTime ? `系統模擬` : `員工(${empName})`,
        action: `打卡成功 (${finalLabel === 'IN' ? '上班' : '下班'} ${timeStr})`,
        target: `代號:${empName}, 日期:${currentDay}日`
      }, ...prev]);
      showToast(`打卡成功：${timeStr}`);
    } catch (err) {
      showToast("雲端同步失敗");
    }
  };

  const handleCellClick = (empId, day) => {
    const cellKey = `${empId}-${selectedMonth}-${day}`;
    if (isAdmin && (punchRecords[cellKey]?.length > 0 || selectedLeaveType === '打卡編輯')) {
      setEditingPunch({ empId, day, key: cellKey });
      return;
    }
    const oldValue = attendanceData[cellKey] || '';
    const newValue = oldValue === selectedLeaveType ? '' : selectedLeaveType;
    setAttendanceData(prev => ({ ...prev, [cellKey]: newValue }));
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-gray-800 font-sans p-4 relative pb-32">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] bg-gray-900 text-white px-6 py-2 rounded-full text-sm shadow-2xl border border-gray-700 animate-bounce">
          {toast}
        </div>
      )}

      {/* 頂部導覽列 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl">
          <button onClick={() => setActiveTab('table')} className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'table' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>考勤表格</button>
          <button onClick={() => setActiveTab('overtime')} className={`px-6 py-1.5 rounded-lg text-sm font-bold flex items-center transition-all ${activeTab === 'overtime' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
            <BarChart3 size={14} className="mr-1.5 text-blue-500" /> 工時分析
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm border flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <select value={currentUser} onChange={(e) => setCurrentUser(Number(e.target.value))} className="bg-transparent text-xs font-black outline-none">
              {INITIAL_EMPLOYEES.map(emp => <option key={emp.id} value={emp.id}>切換至 {emp.name}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-3 bg-white px-4 py-1.5 rounded-xl shadow-sm border">
            <Shield className={`w-4 h-4 ${isAdmin ? 'text-red-600' : 'text-blue-600'}`} />
            <button onClick={() => setIsAdmin(!isAdmin)} className={`w-10 h-5 rounded-full relative transition-colors ${isAdmin ? 'bg-red-500' : 'bg-blue-500'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAdmin ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 數位時鐘區 */}
      <div className="flex flex-col items-center mb-10">
        {!isAdmin && (
          <div className="mb-4 flex gap-2">
            <div className="flex items-center px-3 py-1 bg-gray-900 text-white text-[10px] rounded-l-full font-black uppercase tracking-widest"><Beaker size={12} className="mr-2 text-blue-400" /> 模擬</div>
            <button onClick={() => handleClockPunch('07:55', 'IN')} className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-all">07:55 上班</button>
            <button onClick={() => handleClockPunch('16:05', 'OUT')} className="px-3 py-1 bg-white border rounded-lg text-[10px] font-black text-red-600 hover:bg-red-50 transition-all">16:05 下班</button>
          </div>
        )}

        <button 
          onClick={() => handleClockPunch()}
          disabled={isAdmin}
          className={`text-5xl md:text-7xl font-mono font-black px-12 py-10 rounded-[3rem] border transition-all shadow-2xl flex flex-col items-center ${isAdmin ? 'bg-gray-50 text-gray-300' : 'bg-white text-blue-900 hover:scale-105 active:scale-95'}`}
        >
          <div className="flex items-baseline">
            {formatWithMs(currentTime).split('.')[0]}
            <span className="text-2xl md:text-3xl ml-2 text-orange-500 font-bold tabular-nums">.{formatWithMs(currentTime).split('.')[1]}</span>
          </div>
          <div className="text-[10px] mt-2 font-black text-gray-400 tracking-[0.5em] uppercase">PRECISION ATTENDANCE v008</div>
        </button>
      </div>

      {/* 主要內容區 */}
      {activeTab === 'table' ? (
        <div className="bg-white rounded-3xl shadow-xl overflow-x-auto border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-400 font-black text-[10px] uppercase">
                <th className="sticky left-0 bg-gray-50 p-4 border-r w-16">代號</th>
                {daysArray.map(day => (
                  <th key={day} className={`p-2 border-r min-w-[50px] ${['六','日'].includes(getDayOfWeek(day)) ? 'bg-orange-50/30' : ''}`}>
                    <div className="text-[13px] text-gray-800">{day}</div>
                    <div className="text-[9px]">{getDayOfWeek(day)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INITIAL_EMPLOYEES.map(emp => (
                <tr key={emp.id} className={`border-b border-gray-100 ${currentUser === emp.id ? 'bg-blue-50/30' : ''}`}>
                  <td className="sticky left-0 bg-white p-4 border-r text-center font-black text-sm text-gray-600">{emp.name}</td>
                  {daysArray.map(day => {
                    const cellKey = `${emp.id}-${selectedMonth}-${day}`;
                    const value = attendanceData[cellKey];
                    const typeInfo = LEAVE_TYPES.find(t => t.id === value);
                    return (
                      <td key={day} onClick={() => handleCellClick(emp.id, day)} className={`border-r h-16 text-center cursor-pointer hover:bg-gray-50 ${typeInfo?.bg || ''}`}>
                        {value && <span className={`font-black text-lg ${typeInfo?.color}`}>{value}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl p-8 border text-center text-gray-400 font-bold">工時分析模組已載入 (v008)</div>
      )}

      {/* 底部漂浮假別選擇器 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[400] flex flex-wrap justify-center gap-1.5 px-6 py-3 bg-white/90 backdrop-blur rounded-2xl shadow-2xl border max-w-[95vw]">
        <div className="flex items-center space-x-2 mr-2 border-r pr-3 border-gray-200">
          <MousePointer2 size={16} className="text-blue-500" />
          <span className="text-[10px] font-black text-gray-400 uppercase">Labels</span>
        </div>
        {LEAVE_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedLeaveType(type.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ${selectedLeaveType === type.id ? `${type.border} ${type.bg} ${type.color} scale-110 shadow-md` : 'border-transparent text-gray-400 hover:bg-gray-100'}`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 日誌側欄 */}
      {showHistory && isAdmin && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[500] p-6 border-l animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h3 className="font-black text-red-600">系統流水線</h3>
            <button onClick={() => setShowHistory(false)}><X size={20}/></button>
          </div>
          <div className="space-y-4 overflow-y-auto h-full pb-20">
            {editHistory.map((log, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg text-[11px] border">
                <div className="text-gray-400 mb-1">{log.timestamp}</div>
                <div className="font-black text-gray-800">{log.action}</div>
                <div className="text-blue-600">{log.target}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isAdmin && (
        <button onClick={() => setShowHistory(true)} className="fixed bottom-24 right-6 p-4 bg-white rounded-2xl shadow-lg border hover:scale-110 transition-transform"><History className="text-gray-600" /></button>
      )}
    </div>
  );
}
