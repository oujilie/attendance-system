import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, User, Shield, Lock, History, ChevronLeft, ChevronRight, 
  Info, Clock, Fingerprint, Trash2, Plus, X, CheckCircle2, 
  BarChart3, Calculator, Beaker, LogIn, LogOut, Users, MousePointer2 
} from 'lucide-react';

// 保持與 Canvas 完全一致的假別設定
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

const App = () => {
  // 關鍵修復：初次渲染不帶時間，避免 Hydration Error
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);
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
    setMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 10);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 在 mounted 之前不執行需要時間的邏輯
  const currentDay = currentTime ? currentTime.getDate() : 1;
  const currentMonthStr = currentTime 
    ? `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}` 
    : '2026-03';
  const todayPunchKey = `${currentUser}-${currentMonthStr}-${currentDay}`;

  const daysInMonth = useMemo(() => {
    if (!selectedMonth) return 31;
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);
  const getDayOfWeek = (day) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weeks = ['日', '一', '二', '三', '四', '五', '六'];
    return weeks[date.getDay()];
  };

  const formatWithMs = (date) => {
    if (!date) return "--:--:--.---";
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  const formatHoursMinutes = (decimalHours) => {
    if (decimalHours <= 0) return "0H 0M";
    const totalMinutes = Math.round(decimalHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}H ${m}M`;
  };

  const calculateDailyHours = (empId, day) => {
    const cellKey = `${empId}-${selectedMonth}-${day}`;
    const records = punchRecords[cellKey] || [];
    if (records.length === 0) return { regular: 0, overtime: 0, lastPunch: null };

    const inRecords = records.filter(r => r.label === 'IN');
    const outRecords = records.filter(r => r.label === 'OUT');

    if (inRecords.length === 0 || outRecords.length === 0) {
      const lastRec = records[records.length - 1];
      return { regular: 0, overtime: 0, lastPunch: lastRec.time };
    }

    const getMinutesFromTime = (timeStr) => {
      const [mainTime, msStr] = timeStr.split('.');
      const [h, m, s] = mainTime.split(':').map(Number);
      const ms = Number(msStr || 0);
      return (h * 60) + m + (s / 60) + (ms / 60000);
    };

    const actualFirstInMinutes = getMinutesFromTime(inRecords[0].time);
    const lastOutMinutes = getMinutesFromTime(outRecords[outRecords.length - 1].time);
    const startOfWork = 8 * 60; 
    const effectiveStartMinutes = Math.max(startOfWork, actualFirstInMinutes);
    const endOfWork = 16 * 60; 

    let regular = 0;
    let overtime = 0;
    const totalWorkedMinutes = Math.max(0, lastOutMinutes - effectiveStartMinutes);

    if (lastOutMinutes <= endOfWork) {
      regular = totalWorkedMinutes / 60;
      overtime = 0;
    } else {
      const minutesBeforeEnd = Math.max(0, endOfWork - effectiveStartMinutes);
      regular = minutesBeforeEnd / 60;
      overtime = (lastOutMinutes - Math.max(effectiveStartMinutes, endOfWork)) / 60;
    }
    return { 
      regular: parseFloat(regular.toFixed(3)), 
      overtime: parseFloat(overtime.toFixed(3)),
      lastPunch: outRecords[outRecords.length - 1].time
    };
  };

  const handleClockPunch = (manualBaseTime = null, label = "AUTO") => {
    if (isAdmin && !manualBaseTime) {
      showToast("管理者模式請透過表格編修打卡紀錄");
      return;
    }
    const timeStr = manualBaseTime ? `${manualBaseTime}:00.000` : formatWithMs(currentTime);
    let finalLabel = label;
    if (label === "AUTO") {
      const existing = punchRecords[todayPunchKey] || [];
      finalLabel = existing.length === 0 ? "IN" : "OUT";
    }

    setPunchRecords(prev => ({ 
      ...prev, 
      [todayPunchKey]: [...(prev[todayPunchKey] || []), { 
        time: timeStr, 
        label: finalLabel,
        type: manualBaseTime ? 'test' : 'live' 
      }] 
    }));

    const empName = INITIAL_EMPLOYEES.find(e => e.id === currentUser)?.name;
    setEditHistory(prev => [{
      timestamp: formatWithMs(new Date()),
      admin: manualBaseTime ? `系統模擬` : `員工(${empName})`,
      action: `打卡成功 (${finalLabel === 'IN' ? '上班' : '下班'} ${timeStr})`,
      target: `代號:${empName}, 日期:${currentDay}日`,
      oldValue: "無"
    }, ...prev]);
    showToast(`打卡成功！時間：${timeStr}`);
    // ... 前面的代碼 (target: `代號...`)
    setEditHistory(prev => [
      {
        timestamp: formatWithMs(new Date()),
        // ... 其他欄位
      }
    ]); // <--- 這是第 179 行

    // --- Telegram 通知代碼 ---
    const TG_TOKEN = '8789257005:AAGi3w0zTl3K7jwpFlXPtvjxpBciWbUAg-s';
    const ADMIN_CHAT_ID = '1851043818';
    const statusEmoji = finalLabel === 'IN' ? '✅ 上班' : '🚪 下班';
    const tgMessage = `<b>【考勤系統通知】</b>\n` +
                      `━━━━━━━━━━━━━━\n` +
                      `👤 員工：${empName}\n` +
                      `📍 動作：${statusEmoji}\n` +
                      `⏰ 時間：${timeStr}\n` +
                      `━━━━━━━━━━━━━━`;

    fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: tgMessage,
        parse_mode: 'HTML'
      })
    }).catch(e => console.error("TG推播失敗", e));

  };

  const addPunchTime = () => {
    if (!newPunchTime.trim()) return;
    const punchKey = editingPunch.key;
    const finalTime = `${newPunchTime}:00.${newPunchMs.padStart(3, '0')}`;
    
    setPunchRecords(prev => ({
      ...prev,
      [punchKey]: [...(prev[punchKey] || []), { time: finalTime, label: newPunchLabel, type: 'manual' }]
    }));

    const targetEmp = INITIAL_EMPLOYEES.find(e => e.id === editingPunch.empId);
    setEditHistory(prev => [{
      timestamp: formatWithMs(new Date()),
      admin: "管理者",
      action: `手動新增${newPunchLabel === 'IN' ? '上班' : '下班'}打卡 (${finalTime})`,
      target: `代號:${targetEmp?.name}, 日期:${editingPunch.day}日`,
      oldValue: "管理操作"
    }, ...prev]);
    
    setNewPunchTime("");
    setNewPunchMs("000");
    showToast("紀錄已新增");
  };

  const deletePunchTime = (index) => {
    const punchKey = editingPunch.key;
    const records = [...(punchRecords[punchKey] || [])];
    const removed = records.splice(index, 1);
    setPunchRecords(prev => ({ ...prev, [punchKey]: records }));
    const targetEmp = INITIAL_EMPLOYEES.find(e => e.id === editingPunch.empId);
    setEditHistory(prev => [{
      timestamp: formatWithMs(new Date()),
      admin: "管理者",
      action: `刪除打卡紀錄 (${removed[0].label} ${removed[0].time})`,
      target: `代號:${targetEmp?.name}, 日期:${editingPunch.day}日`,
      oldValue: "管理操作"
    }, ...prev]);
    showToast("紀錄已移除");
  };

  const handleCellClick = (empId, day) => {
    const isSelf = currentUser === empId;
    const cellKey = `${empId}-${selectedMonth}-${day}`;
    if (isAdmin && (punchRecords[cellKey]?.length > 0 || selectedLeaveType === '打卡編輯')) {
      setEditingPunch({ empId, day, key: cellKey });
      return;
    }
    if (!isAdmin && !isSelf) {
      showToast("員工模式僅能操作自己的假別");
      return;
    }
    const oldValue = attendanceData[cellKey] || '';
    const newValue = oldValue === selectedLeaveType ? '' : selectedLeaveType;
    setAttendanceData(prev => ({ ...prev, [cellKey]: newValue }));
    
    const targetEmp = INITIAL_EMPLOYEES.find(e => e.id === empId);
    if (newValue !== oldValue) {
      setEditHistory(prev => [{
        timestamp: formatWithMs(new Date()),
        admin: isAdmin ? "管理者" : `員工(${targetEmp?.name})`,
        action: newValue ? `設定假別為 ${newValue}` : "清除假別資料",
        target: `代號:${targetEmp?.name}, 日期:${day}日`,
        oldValue: oldValue || "空"
      }, ...prev]);
    }
  };

  const calculateStats = (empId) => {
    const stats = {};
    daysArray.forEach(day => {
      const cellKey = `${empId}-${selectedMonth}-${day}`;
      const leave = attendanceData[cellKey];
      if (leave) stats[leave] = (stats[leave] || 0) + 1;
    });
    if (Object.keys(stats).length === 0) return "-";
    return LEAVE_TYPES
      .filter(t => stats[t.id])
      .map(t => `${t.id}${stats[t.id]}`)
      .join('');
  };

  // 關鍵修復：在客戶端掛載前渲染 null 或空白骨架，防止 Vercel Hydration 失敗
  if (!mounted || !currentTime) return null;

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-gray-800 font-sans p-4 relative pb-32 overflow-x-hidden">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-2 rounded-full text-sm animate-fade-in shadow-2xl border border-gray-700">
          {toast}
        </div>
      )}

      {/* 管理者編輯視窗 */}
      {editingPunch && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="bg-gray-900 text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-orange-400 flex items-center">
                  <Clock size={18} className="mr-2" /> 精確數據編輯器
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">
                  代號: {INITIAL_EMPLOYEES.find(e => e.id === editingPunch.empId)?.name} | {editingPunch.day}日
                </p>
              </div>
              <button onClick={() => setEditingPunch(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">打卡紀錄 (毫秒級精度)</label>
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
                {(punchRecords[editingPunch.key] || []).length === 0 ? (
                  <div className="text-center py-6 text-gray-400 italic text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">無數據</div>
                ) : (
                  punchRecords[editingPunch.key].map((rec, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 group">
                      <div className="flex items-center">
                        <div className={`p-1.5 rounded-lg mr-3 ${rec.label === 'IN' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                          {rec.label === 'IN' ? <LogIn size={14} /> : <LogOut size={14} />}
                        </div>
                        <span className="font-mono font-black text-gray-700 tracking-tight">{rec.time}</span>
                      </div>
                      <button onClick={() => deletePunchTime(idx)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest">新增屬性</span>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setNewPunchLabel('IN')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${newPunchLabel === 'IN' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>上班</button>
                    <button onClick={() => setNewPunchLabel('OUT')} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${newPunchLabel === 'OUT' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>下班</button>
                  </div>
                </div>
                <div className="flex space-x-2 items-center">
                  <input type="time" value={newPunchTime} onChange={(e) => setNewPunchTime(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold" />
                  <span className="text-gray-400 font-black">.</span>
                  <input type="number" maxLength={3} placeholder="ms" value={newPunchMs} onChange={(e) => setNewPunchMs(e.target.value.slice(0, 3))} className="w-16 bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-center" />
                  <button onClick={addPunchTime} className={`px-6 h-[48px] rounded-xl font-black text-white flex items-center transition-all shadow-lg ${newPunchLabel === 'IN' ? 'bg-blue-600 shadow-blue-100' : 'bg-red-600 shadow-red-100'}`}>
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
              <button onClick={() => setEditingPunch(null)} className="text-sm font-black text-gray-500 hover:text-gray-800 transition-colors">確認返回</button>
            </div>
          </div>
        </div>
      )}

      {/* 頂部導覽 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl shadow-inner">
            <button onClick={() => setActiveTab('table')} className={`px-6 py-1.5 rounded-lg text-sm transition-all font-bold ${activeTab === 'table' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>考勤表格</button>
            <button onClick={() => setActiveTab('overtime')} className={`px-6 py-1.5 rounded-lg text-sm transition-all font-bold flex items-center ${activeTab === 'overtime' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <BarChart3 size={14} className="mr-1.5 text-blue-500" /> 工時分析
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-200 group hover:border-blue-400 transition-all">
            <Users className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
            <select value={currentUser} onChange={(e) => setCurrentUser(Number(e.target.value))} className="bg-transparent text-xs font-black outline-none cursor-pointer text-gray-600">
              {INITIAL_EMPLOYEES.map(emp => (
                <option key={emp.id} value={emp.id}>切換至 {emp.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-3 bg-white px-4 py-1.5 rounded-xl shadow-sm border border-gray-200">
            <Shield className={`w-4 h-4 ${isAdmin ? 'text-red-600' : 'text-blue-600'}`} />
            <span className={`text-xs font-black tracking-tight ${isAdmin ? 'text-red-600' : 'text-blue-600'}`}>{isAdmin ? '管理者' : '一般員工'}</span>
            <button onClick={() => setIsAdmin(!isAdmin)} className={`w-10 h-5 rounded-full transition-all relative ${isAdmin ? 'bg-red-500' : 'bg-blue-500'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAdmin ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 數位時鐘 */}
      <div className="flex flex-col items-center mb-10">
        {!isAdmin && (
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            <div className="flex items-center px-3 py-1 bg-gray-900 text-white text-[10px] rounded-l-full font-black uppercase tracking-widest">
              <Beaker size={12} className="mr-2 text-blue-400" /> 模擬打卡
            </div>
            <button onClick={() => handleClockPunch('07:55', 'IN')} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-blue-600 hover:bg-blue-50 shadow-sm transition-all">上班 (07:55)</button>
            <button onClick={() => handleClockPunch('08:05', 'IN')} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-amber-600 hover:bg-amber-50 shadow-sm transition-all">上班 (08:05)</button>
            <button onClick={() => handleClockPunch('16:05', 'OUT')} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-red-600 hover:bg-red-50 shadow-sm transition-all">下班 (16:05)</button>
            <button onClick={() => handleClockPunch('21:35', 'OUT')} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-purple-600 hover:bg-purple-50 shadow-sm transition-all">下班 (21:35)</button>
          </div>
        )}
        <div className="flex items-center space-x-4 md:space-x-8 text-gray-300">
          <ChevronLeft size={24} className="opacity-50 hidden md:block" />
          <button 
            onClick={() => handleClockPunch()}
            disabled={isAdmin}
            className={`text-4xl md:text-6xl font-mono font-black px-6 md:px-10 py-6 md:py-8 rounded-3xl border transition-all duration-300 shadow-2xl relative flex flex-col items-center
              ${isAdmin 
                ? 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed opacity-60' 
                : 'text-blue-900 bg-white border-blue-50 hover:scale-105 active:scale-95 ring-8 ring-blue-50/50 hover:bg-blue-50 cursor-pointer'}`}
          >
            <div className="flex items-baseline">
              {currentTime.getHours().toString().padStart(2, '0')}:
              {currentTime.getMinutes().toString().padStart(2, '0')}:
              {currentTime.getSeconds().toString().padStart(2, '0')}
              <span className="text-xl md:text-2xl ml-2 text-orange-500 font-bold tabular-nums">.{currentTime.getMilliseconds().toString().padStart(3, '0')}</span>
            </div>
            <div className="text-[10px] mt-2 font-black text-gray-400 tracking-[0.5em] uppercase">PRECISION ATTENDANCE v008</div>
          </button>
          <ChevronRight size={24} className="opacity-50 hidden md:block" />
        </div>
      </div>

      {/* 內容切換區域 */}
      {activeTab === 'table' ? (
        <div className="bg-white rounded-3xl shadow-xl overflow-x-auto border border-gray-200 relative animate-in fade-in">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-black text-[10px] uppercase tracking-widest">
                <th className="sticky left-0 bg-gray-50 z-30 p-4 border-r min-w-[70px] text-center">代號</th>
                {daysArray.map(day => (
                  <th key={day} className={`p-2 border-r min-w-[50px] ${getDayOfWeek(day) === '六' || getDayOfWeek(day) === '日' ? 'bg-orange-50/50' : ''}`}>
                    <div className="flex flex-col items-center">
                      <span className="text-[13px] text-gray-800">{day}</span>
                      <span className="text-[9px]">{getDayOfWeek(day)}</span>
                    </div>
                  </th>
                ))}
                <th className="p-4 min-w-[120px] bg-gray-50 border-l text-center">統計</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_EMPLOYEES.map((emp) => (
                <tr key={emp.id} className={`border-b border-gray-100 transition-colors ${currentUser === emp.id ? 'bg-blue-50/30' : 'hover:bg-gray-50/30'}`}>
                  <td className={`sticky left-0 z-20 p-4 border-r text-center ${currentUser === emp.id ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className={`font-black text-sm ${currentUser === emp.id ? 'text-blue-600' : 'text-gray-600'}`}>{emp.name}</div>
                  </td>
                  {daysArray.map(day => {
                    const cellKey = `${emp.id}-${selectedMonth}-${day}`;
                    const value = attendanceData[cellKey];
                    const punchLogs = punchRecords[cellKey] || [];
                    const typeInfo = LEAVE_TYPES.find(t => t.id === value);
                    const hasIn = punchLogs.some(r => r.label === 'IN');
                    const hasOut = punchLogs.some(r => r.label === 'OUT');
                    return (
                      <td key={day} onClick={() => handleCellClick(emp.id, day)} className={`border-r border-gray-100 text-center relative h-16 cursor-pointer hover:bg-gray-50/50 ${typeInfo ? typeInfo.bg : ''}`}>
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="flex space-x-0.5">
                            {hasIn && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />}
                            {hasOut && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />}
                          </div>
                          {value && <span className={`font-black text-[15px] ${typeInfo?.color}`}>{value}</span>}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-black text-green-600 bg-green-50/20 text-[11px] border-l italic tracking-tighter whitespace-pre-wrap">{calculateStats(emp.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4">
          <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-xl"><BarChart3 size={24} /></div>
              <div>
                <h2 className="text-xl font-black italic">工時效能分析 v008</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">系統自動校正 08:00 前之打卡 | 遲到按實起算</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs font-black text-gray-500">
                  <th className="p-4 text-left sticky left-0 bg-gray-100 z-10 w-24 border-r">員工代號</th>
                  {daysArray.map(day => (
                    <th key={day} className="p-3 text-center min-w-[110px] border-r border-gray-200">
                      <div>{day}日</div>
                      <div className="text-[9px] opacity-50">{getDayOfWeek(day)}</div>
                    </th>
                  ))}
                  <th className="p-4 bg-blue-50 text-blue-800 text-center min-w-[150px]">本月累計</th>
                </tr>
              </thead>
              <tbody>
                {INITIAL_EMPLOYEES.filter(emp => isAdmin || emp.id === currentUser).map(emp => {
                  let monthlyRegular = 0;
                  let monthlyOvertime = 0;
                  return (
                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                      <td className="p-4 font-black text-gray-800 sticky left-0 bg-white border-r z-10 shadow-sm text-sm">{emp.name}</td>
                      {daysArray.map(day => {
                        const { regular, overtime, lastPunch } = calculateDailyHours(emp.id, day);
                        monthlyRegular += regular;
                        monthlyOvertime += overtime;
                        return (
                          <td key={day} className={`p-2 border-r border-gray-50 text-center ${overtime > 0 ? 'bg-orange-50/20' : ''}`}>
                            {lastPunch ? (
                              <div className="space-y-1">
                                <div className="text-[9px] font-mono font-black text-orange-600 bg-orange-50 px-1 rounded-md">{lastPunch}</div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[13px] font-black text-gray-700">{regular}h</span>
                                  {overtime > 0 && <span className="text-[9px] font-black text-red-600">+{formatHoursMinutes(overtime)}</span>}
                                </div>
                              </div>
                            ) : <span className="text-gray-200 text-[11px] font-black">-</span>}
                          </td>
                        );
                      })}
                      <td className="p-4 bg-blue-50/20 border-l border-gray-200">
                        <div className="flex flex-col space-y-1">
                          <div className="flex justify-between items-center"><span className="text-[9px] font-black opacity-40">一般</span><span className="text-sm font-black text-blue-800">{monthlyRegular.toFixed(3)}h</span></div>
                          <div className="flex justify-between items-center"><span className="text-[9px] font-black opacity-40">加班</span><span className="text-sm font-black text-red-700">{formatHoursMinutes(monthlyOvertime)}</span></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 底部按鈕區 */}
      <div className="mt-8 flex justify-between items-center px-2">
        {isAdmin && (
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center space-x-3 px-6 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-red-400 hover:shadow-lg transition-all text-sm font-black text-gray-500">
            <History className={`w-5 h-5 ${showHistory ? 'text-red-600' : 'text-gray-400'}`} />
            <span>精確打卡日誌審核</span>
          </button>
        )}
        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
          Precision Attendance System Layer v8.0.0
        </div>
      </div>

      {/* 底部漂浮假別選擇器 */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-wrap justify-center gap-2 max-w-[95vw] px-6 py-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 overflow-visible">
        <div className="flex items-center space-x-2 mr-2 border-r pr-3 border-gray-200">
          <MousePointer2 size={16} className="text-blue-500" />
          <span className="text-[10px] font-black text-gray-400 tracking-tighter uppercase">Labels</span>
        </div>
        {LEAVE_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedLeaveType(type.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 min-w-[40px]
              ${selectedLeaveType === type.id 
                ? `${type.border} ${type.bg} ${type.color} shadow-lg scale-110 z-10` 
                : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
          >
            {type.label}
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => setSelectedLeaveType('打卡編輯')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border-2 ml-2
              ${selectedLeaveType === '打卡編輯' 
                ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-lg scale-110 z-10' 
                : 'border-transparent bg-gray-900 text-white hover:bg-gray-800'}`}
          >
            打卡編輯
          </button>
        )}
      </div>

      {/* 日誌抽屜 */}
      {showHistory && isAdmin && (
        <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white shadow-2xl z-[400] p-8 border-l border-gray-100 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-black text-xl text-red-600">系統流水線</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1 tracking-widest uppercase">Audit Log</p>
            </div>
            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">✕</button>
          </div>
          <div className="space-y-6">
            {editHistory.length === 0 ? (
              <div className="text-center py-20 text-gray-300 font-black text-sm italic">尚無歷史紀錄</div>
            ) : (
              editHistory.map((log, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-gray-100 pb-4">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 bg-red-400 rounded-full shadow-sm" />
                  <div className="text-[10px] text-gray-400 font-mono font-bold mb-2 tracking-tighter">{log.timestamp}</div>
                  <div className="p-4 bg-gray-50 rounded-2xl text-[11px] border border-gray-100">
                    <div className="font-black text-gray-800 mb-1">{log.admin}</div>
                    <div className="text-gray-600 font-bold leading-relaxed">{log.action}</div>
                    <div className="mt-2 text-[9px] text-gray-400 bg-white p-1.5 rounded-lg border border-gray-100">{log.target}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
