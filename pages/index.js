import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js'; // 1. 引入雲端工具
import { 
  Calendar, User, Shield, Lock, History, ChevronLeft, ChevronRight, 
  Info, Clock, Fingerprint, Trash2, Plus, X, CheckCircle2, 
  BarChart3, Calculator, Beaker, LogIn, LogOut, Users, MousePointer2 
} from 'lucide-react';

// 2. 初始化雲端帳本連線 (會自動抓取你在 Vercel 設定的環境變數)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ... (LEAVE_TYPES 和 INITIAL_EMPLOYEES 維持不變) ...
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
  // ... (保留你原本的 useState) ...
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

  // 3. 靈魂功能：傳送電報給 Telegram 機器人
  const sendTelegramNotify = async (message) => {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN; // 這裡要在 Vercel 設定
      // 提醒：這裡需要你的 Chat ID，我們等下教你怎麼拿
      const chatId = "1851043818"; 
      
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔔 考勤系統通知：\n${message}`,
          parse_mode: 'HTML'
        })
      });
    } catch (e) {
      console.error("Telegram 發送失敗", e);
    }
  };

  // 4. 改寫打卡邏輯：加入雲端儲存與報信
  const handleClockPunch = async (manualBaseTime = null, label = "AUTO") => {
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

    const empName = INITIAL_EMPLOYEES.find(e => e.id === currentUser)?.name;
    const logMsg = `員工 ${empName} 已於 ${timeStr} 執行 [${finalLabel === 'IN' ? '上班' : '下班'}] 打卡`;

    // A. 更新本地畫面
    setPunchRecords(prev => ({ 
      ...prev, 
      [todayPunchKey]: [...(prev[todayPunchKey] || []), { time: timeStr, label: finalLabel, type: 'live' }] 
    }));

    // B. 同步到雲端 (Supabase)
    const { error } = await supabase
      .from('punch_logs')
      .insert([{ 
        employee_id: empName, 
        punch_time: timeStr, 
        label: finalLabel,
        date_key: todayPunchKey 
      }]);

    if (!error) {
      // C. 發送 Telegram 報信
      sendTelegramNotify(logMsg);
      showToast(`雲端同步成功！${finalLabel}`);
    } else {
      showToast("雲端同步失敗，僅存在本地");
    }
  };

  // ... (其餘 helper function 維持不變) ...
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
  const todayPunchKey = `${currentUser}-${currentMonthStr}-${currentDay}`;

  const formatWithMs = (date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  // ... (下方的所有 return 介面代碼請保持你原本的樣式不變) ...
  // [此處省略你原本長長的 return 內容，請直接保留你原本的 JSX 即可]
};

export default App;
