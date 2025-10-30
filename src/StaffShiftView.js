import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// ヘルプモーダルコンポーネント
const HelpModal = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'sticky',
            top: '1rem',
            left: '100%',
            marginRight: '1rem',
            backgroundColor: '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1,
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
        <div style={{ padding: '2rem', paddingTop: '0' }}>
          {content}
        </div>
      </div>
    </div>
  );
};

// ヘルプボタンコンポーネント
const HelpButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        backgroundColor: '#FF9800',
        color: 'white',
        border: '2px solid #F57C00',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        fontSize: '28px',
        fontWeight: 'bold'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#F57C00';
        e.target.style.transform = 'scale(1.1)';
        e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#FF9800';
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      }}
      title="使い方を見る"
    >
      ?
    </button>
  );
};

// 使い方ガイドの内容
const getHelpContent = (view) => {
  if (view === 'calendar') {
    return (
      <div>
        <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>シフト確認（カレンダー）の使い方</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='450'%3E%3Crect width='400' height='450' fill='%23f5f5f5'/%3E%3Crect x='30' y='20' width='340' height='410' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Ctext x='200' y='50' text-anchor='middle' font-size='18' font-weight='bold'%3Eシフト確認%3C/text%3E%3Crect x='50' y='70' width='300' height='300' rx='8' fill='%23f9f9f9' stroke='%23ddd'/%3E%3Cg%3E%3Crect x='60' y='80' width='30' height='25' rx='4' fill='%23607D8B'/%3E%3Ctext x='75' y='97' text-anchor='middle' font-size='14' fill='white'%3E◀%3C/text%3E%3C/g%3E%3Ctext x='200' y='97' text-anchor='middle' font-size='16' font-weight='bold'%3E2025年 1月%3C/text%3E%3Cg%3E%3Crect x='310' y='80' width='30' height='25' rx='4' fill='%23607D8B'/%3E%3Ctext x='325' y='97' text-anchor='middle' font-size='14' fill='white'%3E▶%3C/text%3E%3C/g%3E%3Crect x='60' y='115' width='280' height='20' fill='%23e0e0e0'/%3E%3Ctext x='70' y='129' font-size='11' font-weight='bold'%3E日%3C/text%3E%3Ctext x='110' y='129' font-size='11' font-weight='bold'%3E月%3C/text%3E%3Ctext x='150' y='129' font-size='11' font-weight='bold'%3E火%3C/text%3E%3Ctext x='190' y='129' font-size='11' font-weight='bold'%3E水%3C/text%3E%3Ctext x='230' y='129' font-size='11' font-weight='bold'%3E木%3C/text%3E%3Ctext x='270' y='129' font-size='11' font-weight='bold'%3E金%3C/text%3E%3Ctext x='310' y='129' font-size='11' font-weight='bold'%3E土%3C/text%3E%3Crect x='60' y='145' width='38' height='35' rx='4' fill='%23E3F2FD'/%3E%3Ctext x='79' y='167' text-anchor='middle' font-size='13' font-weight='bold'%3E1%3C/text%3E%3Crect x='102' y='145' width='38' height='35' rx='4' fill='white'/%3E%3Ctext x='121' y='167' text-anchor='middle' font-size='13' fill='%23999'%3E2%3C/text%3E%3Crect x='144' y='145' width='38' height='35' rx='4' fill='%23E3F2FD'/%3E%3Ctext x='163' y='167' text-anchor='middle' font-size='13' font-weight='bold'%3E3%3C/text%3E%3Crect x='186' y='145' width='38' height='35' rx='4' fill='white'/%3E%3Ctext x='205' y='167' text-anchor='middle' font-size='13' fill='%23999'%3E4%3C/text%3E%3Crect x='228' y='145' width='38' height='35' rx='4' fill='%23E3F2FD'/%3E%3Ctext x='247' y='167' text-anchor='middle' font-size='13' font-weight='bold'%3E5%3C/text%3E%3Crect x='270' y='145' width='38' height='35' rx='4' fill='%23E3F2FD'/%3E%3Ctext x='289' y='167' text-anchor='middle' font-size='13' font-weight='bold'%3E6%3C/text%3E%3Crect x='312' y='145' width='38' height='35' rx='4' fill='white'/%3E%3Ctext x='331' y='167' text-anchor='middle' font-size='13' fill='%23999'%3E7%3C/text%3E%3Ctext x='200' y='355' text-anchor='middle' font-size='11' fill='%23666'%3E青色: シフトあり (15日) | 灰色: シフトなし%3C/text%3E%3C/g%3E%3Crect x='80' y='390' width='240' height='30' rx='6' fill='%23607D8B'/%3E%3Ctext x='200' y='411' text-anchor='middle' font-size='14' fill='white'%3Eメニューに戻る%3C/text%3E%3C/svg%3E" alt="カレンダー画面" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
        </div>
        <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>使い方：</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>◀ / ▶ボタン</strong>で月を切り替えます</li>
          <li><strong>青色の日付</strong>をタップするとその日のシフトを表示</li>
          <li><strong>灰色の日付</strong>はシフトが登録されていない日です</li>
        </ol>
        
        <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <strong>💡 ポイント：</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            <li>月の上部にシフトがある日数が表示されます</li>
            <li>青色の日付が濃いほど、最近追加されたシフトです</li>
            <li>タップするだけで詳細が見られます</li>
          </ul>
        </div>

        <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <strong>⚠️ 注意：</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            <li>シフトが作成されるまで表示されません</li>
            <li>店長がシフトを作成した後に確認できます</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>シフト確認（詳細）の使い方</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500'%3E%3Crect width='400' height='500' fill='%23f5f5f5'/%3E%3Crect x='30' y='20' width='340' height='460' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Cg%3E%3Crect x='50' y='40' width='30' height='30' rx='4' fill='%23607D8B'/%3E%3Ctext x='65' y='61' text-anchor='middle' font-size='14' fill='white'%3E◀%3C/text%3E%3C/g%3E%3Ctext x='200' y='61' text-anchor='middle' font-size='16' font-weight='bold'%3E2025-01-15 (水)%3C/text%3E%3Cg%3E%3Crect x='320' y='40' width='30' height='30' rx='4' fill='%23607D8B'/%3E%3Ctext x='335' y='61' text-anchor='middle' font-size='14' fill='white'%3E▶%3C/text%3E%3C/g%3E%3Crect x='50' y='85' width='140' height='30' rx='6' fill='%232196F3'/%3E%3Ctext x='120' y='106' text-anchor='middle' font-size='13' fill='white'%3Eリスト表示%3C/text%3E%3Crect x='210' y='85' width='140' height='30' rx='6' fill='%23f0f0f0'/%3E%3Ctext x='280' y='106' text-anchor='middle' font-size='13'%3Eタイムライン表示%3C/text%3E%3Crect x='50' y='130' width='300' height='260' rx='8' fill='white' stroke='%23ddd'/%3E%3Crect x='60' y='140' width='280' height='30' fill='%23f5f5f5'/%3E%3Ctext x='70' y='160' font-size='12' font-weight='bold'%3E名前%3C/text%3E%3Ctext x='160' y='160' font-size='12' font-weight='bold'%3E店舗%3C/text%3E%3Ctext x='220' y='160' font-size='12' font-weight='bold'%3E勤務時間%3C/text%3E%3Ctext x='300' y='160' font-size='12' font-weight='bold'%3E状態%3C/text%3E%3Crect x='60' y='175' width='280' height='35' fill='white'/%3E%3Ctext x='70' y='197' font-size='12' font-weight='bold'%3E山田太郎%3C/text%3E%3Ctext x='165' y='197' font-size='12' fill='%231976D2' font-weight='bold'%3E1店舗%3C/text%3E%3Ctext x='230' y='197' font-size='11' font-weight='bold'%3E09:00 - 17:00%3C/text%3E%3Crect x='295' y='185' width='35' height='18' rx='9' fill='%234CAF50'/%3E%3Ctext x='312' y='198' text-anchor='middle' font-size='10' fill='white'%3E出勤%3C/text%3E%3Crect x='60' y='215' width='280' height='35' fill='%23f9f9f9'/%3E%3Ctext x='70' y='237' font-size='12' font-weight='bold'%3E佐藤花子%3C/text%3E%3Ctext x='165' y='237' font-size='12' fill='%231976D2' font-weight='bold'%3E2店舗%3C/text%3E%3Ctext x='230' y='237' font-size='11' fill='%23999' font-style='italic'%3E休み%3C/text%3E%3Crect x='295' y='225' width='35' height='18' rx='9' fill='%23f44336'/%3E%3Ctext x='312' y='238' text-anchor='middle' font-size='10' fill='white'%3E休み%3C/text%3E%3Crect x='60' y='255' width='280' height='35' fill='white'/%3E%3Ctext x='70' y='277' font-size='12' font-weight='bold'%3E鈴木次郎%3C/text%3E%3Ctext x='165' y='277' font-size='12' fill='%231976D2' font-weight='bold'%3E1店舗%3C/text%3E%3Ctext x='230' y='277' font-size='11' font-weight='bold'%3E14:00 - 22:00%3C/text%3E%3Crect x='295' y='265' width='35' height='18' rx='9' fill='%234CAF50'/%3E%3Ctext x='312' y='278' text-anchor='middle' font-size='10' fill='white'%3E出勤%3C/text%3E%3Crect x='80' y='420' width='240' height='40' rx='6' fill='%23607D8B'/%3E%3Ctext x='200' y='445' text-anchor='middle' font-size='14' fill='white'%3Eカレンダーに戻る%3C/text%3E%3C/svg%3E" alt="リスト表示" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
      </div>
      
      <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>表示モードの切り替え：</h3>
      <div style={{ marginLeft: '1rem', marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#1976D2', marginTop: '1rem' }}>📋 リスト表示</h4>
        <ul style={{ lineHeight: '1.8' }}>
          <li>スタッフごとの<strong>名前・店舗・勤務時間・状態</strong>を一覧表示</li>
          <li>見やすい表形式で情報を確認</li>
          <li>出勤/休みのステータスが色分けされています
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.95em' }}>
              <li>🟢 緑色 = 出勤</li>
              <li>🔴 赤色 = 休み</li>
            </ul>
          </li>
        </ul>

        <h4 style={{ color: '#1976D2', marginTop: '1rem' }}>⏱️ タイムライン表示</h4>
        <ul style={{ lineHeight: '1.8' }}>
          <li>時間軸でスタッフの勤務状況を視覚的に表示</li>
          <li>誰がいつ働いているかが一目でわかります</li>
          <li>横スクロールで全時間帯を確認可能</li>
          <li>緑色の●印が勤務中の時間帯</li>
        </ul>
      </div>

      <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>操作方法：</h3>
      <ol style={{ lineHeight: '1.8' }}>
        <li><strong>◀ / ▶ボタン</strong>で前後の日のシフトに移動</li>
        <li><strong>リスト/タイムライン</strong>ボタンで表示を切り替え</li>
        <li><strong>カレンダーに戻る</strong>ボタンで日付選択画面に戻ります</li>
      </ol>

      <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>💡 便利な機能：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li><strong>リスト表示</strong>：詳細情報をすばやく確認</li>
          <li><strong>タイムライン表示</strong>：人員配置を視覚的に把握</li>
          <li><strong>前後移動</strong>：ボタンで簡単に日付を切り替え</li>
          <li><strong>店舗表示</strong>：どの店舗で働くかも確認可能</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>📱 モバイルでの操作：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li>表は横にスクロールできます</li>
          <li>タイムライン表示では左右にスワイプ</li>
          <li>ピンチで拡大も可能です</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#ffebee', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>⚠️ 注意事項：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li>表示されるのは確定したシフトのみです</li>
          <li>まだ作成されていないシフトは表示されません</li>
          <li>変更がある場合は店長に確認してください</li>
        </ul>
      </div>
    </div>
  );
};

function StaffShiftView({ onBack }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [currentView, setCurrentView] = useState('calendar');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchAvailableDates();
    fetchUsers();
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const { data: finalShifts, error } = await supabase
        .from('final_shifts')
        .select('date')
        .order('date');

      if (error) {
        console.error('日付取得エラー:', error);
        return;
      }

      const uniqueDates = finalShifts ? [...new Set(finalShifts.map(item => item.date))].sort() : [];
      setAvailableDates(uniqueDates);
    } catch (error) {
      console.error('日付取得エラー:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_deleted', false);

      if (error) {
        console.error('ユーザー取得エラー:', error);
        return;
      }

      const userMapTemp = {};
      if (users && users.length > 0) {
        users.forEach(user => {
          const managerNumber = user.manager_number;
          if (managerNumber !== null && managerNumber !== undefined && user.name) {
            userMapTemp[String(managerNumber)] = user.name;
            userMapTemp[Number(managerNumber)] = user.name;
            userMapTemp[String(managerNumber).trim()] = user.name;
          }
        });
      }
      console.log('ユーザーマップ:', userMapTemp);
      setUserMap(userMapTemp);
    } catch (error) {
      console.error('予期しないエラー:', error);
    }
  };

  const fetchShiftData = async (date) => {
    if (!date) return;

    setLoading(true);
    try {
      const { data: finalShifts, error: finalError } = await supabase
        .from('final_shifts')
        .select('*')
        .eq('date', date)
        .order('manager_number');

      if (!finalError && finalShifts && finalShifts.length > 0) {
        setShiftData(finalShifts);
      } else {
        setShiftData([]);
      }

      setCurrentView('shift');
    } catch (error) {
      console.error('シフトデータ取得エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (managerNumber) => {
    if (!managerNumber && managerNumber !== 0) return '管理番号なし';
    
    const searchKeys = [
      managerNumber,
      String(managerNumber),
      Number(managerNumber),
      String(managerNumber).trim()
    ];
    
    for (const key of searchKeys) {
      if (userMap[key]) {
        return userMap[key];
      }
    }
    
    console.log('名前が見つかりません。管理番号:', managerNumber, '型:', typeof managerNumber);
    return `管理番号: ${managerNumber}`;
  };

  const handleDateSelect = (date) => {
    if (!availableDates.includes(date)) return;
    setSelectedDate(date);
    fetchShiftData(date);
  };

  const handleBackToCalendar = () => {
    setCurrentView('calendar');
    setSelectedDate('');
    setShiftData([]);
  };

  const changeDate = (delta) => {
    if (!selectedDate || availableDates.length === 0) return;
    const idx = availableDates.indexOf(selectedDate);
    const newIdx = idx + delta;
    if (newIdx >= 0 && newIdx < availableDates.length) {
      const newDate = availableDates[newIdx];
      setSelectedDate(newDate);
      fetchShiftData(newDate);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === month;
      const hasShift = availableDates.includes(dateStr);

      days.push({
        date: new Date(currentDate),
        dateStr: dateStr,
        day: currentDate.getDate(),
        isCurrentMonth,
        hasShift
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5);
  };

  const getWeekday = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 36; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isWorkingAtTime = (shift, timeStr) => {
    if (isOffDay(shift)) return false;

    const startMinutes = timeToMinutes(shift.start_time);
    let endMinutes = timeToMinutes(shift.end_time);
    const checkMinutes = timeToMinutes(timeStr);

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    let adjustedCheckMinutes = checkMinutes;
    if (checkMinutes < startMinutes && endMinutes >= 24 * 60) {
      adjustedCheckMinutes += 24 * 60;
    }

    return adjustedCheckMinutes >= startMinutes && adjustedCheckMinutes < endMinutes;
  };

  const isOffDay = (shift) => {
    return shift.is_off === true ||
           !shift.start_time ||
           !shift.end_time ||
           shift.start_time === '' ||
           shift.end_time === '' ||
           (shift.start_time === '00:00' && shift.end_time === '00:00');
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const timeSlots = generateTimeSlots();

  const sortedShiftData = [...shiftData]
    .filter(shift => shift.manager_number !== null && shift.manager_number !== undefined)
    .sort((a, b) => {
      const aOff = isOffDay(a) ? 1 : 0;
      const bOff = isOffDay(b) ? 1 : 0;
      return aOff - bOff;
    });

  if (currentView === 'calendar') {
    return (
      <>
        <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
          content={getHelpContent('calendar')} 
        />
        <div className="login-wrapper" style={{ padding: '0.5rem' }}>
          <div className="login-card" style={{ 
            width: '100%', 
            maxWidth: '600px', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            padding: '1rem',
            boxSizing: 'border-box',
            position: 'relative',
            paddingTop: '4rem'
          }}>
            <HelpButton onClick={() => setShowHelp(true)} />
            <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', marginBottom: '1rem' }}>シフト確認</h2>

            <div style={{
              marginTop: '1rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '0.75rem',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <button onClick={() => changeMonth(-1)} style={{
                  backgroundColor: '#607D8B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: 'clamp(14px, 3vw, 16px)'
                }}>
                  ◀
                </button>
                <h3 style={{ margin: 0, fontSize: 'clamp(16px, 3.5vw, 20px)' }}>
                  {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
                </h3>
                <button onClick={() => changeMonth(1)} style={{
                  backgroundColor: '#607D8B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: 'clamp(14px, 3vw, 16px)'
                }}>
                  ▶
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
                marginBottom: '0.5rem'
              }}>
                {weekdays.map(day => (
                  <div key={day} style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    padding: '0.4rem',
                    backgroundColor: '#e0e0e0',
                    fontSize: 'clamp(11px, 2.5vw, 14px)'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px'
              }}>
                {calendarDays.map((dayInfo, index) => (
                  <button
                    key={index}
                    onClick={() => dayInfo.hasShift && handleDateSelect(dayInfo.dateStr)}
                    disabled={!dayInfo.hasShift}
                    style={{
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: dayInfo.hasShift ? 'pointer' : 'not-allowed',
                      backgroundColor: dayInfo.hasShift ? '#E3F2FD' :
                                     dayInfo.isCurrentMonth ? 'white' : '#f0f0f0',
                      color: !dayInfo.hasShift ? '#999' :
                             dayInfo.isCurrentMonth ? 'black' : '#666',
                      fontWeight: dayInfo.hasShift ? 'bold' : 'normal',
                      opacity: dayInfo.isCurrentMonth ? 1 : 0.5,
                      transition: 'all 0.3s ease',
                      fontSize: 'clamp(12px, 3vw, 14px)',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {dayInfo.day}
                  </button>
                ))}
              </div>

              <div style={{
                marginTop: '0.5rem',
                fontSize: 'clamp(10px, 2vw, 12px)',
                color: '#666',
                textAlign: 'center'
              }}>
                青色: シフトあり ({availableDates.length}日) | 灰色: シフトなし
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button onClick={onBack} style={{
                backgroundColor: '#607D8B',
                color: 'white',
                padding: '0.75rem 2rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 'clamp(14px, 3vw, 16px)',
                width: '100%',
                maxWidth: '300px'
              }}>
                メニューに戻る
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        content={getHelpContent('shift')} 
      />
      <div className="login-wrapper" style={{ padding: '0.5rem' }}>
        <div className="login-card" style={{ 
          width: '100%', 
          maxWidth: '900px', 
          maxHeight: '90vh', 
          overflowY: 'auto',
          padding: '1rem',
          boxSizing: 'border-box',
          position: 'relative',
          paddingTop: '4rem'
        }}>
          <HelpButton onClick={() => setShowHelp(true)} />
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <button 
              onClick={() => changeDate(-1)}
              style={{
                padding: '0.4rem 0.6rem',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ◀
            </button>
            <span style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold' }}>
              {selectedDate} ({getWeekday(selectedDate)})
            </span>
            <button 
              onClick={() => changeDate(1)}
              style={{
                padding: '0.4rem 0.6rem',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ▶
            </button>
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'list' ? '#2196F3' : '#f0f0f0',
                color: viewMode === 'list' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                flex: '1',
                minWidth: '120px'
              }}
            >
              リスト表示
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'timeline' ? '#2196F3' : '#f0f0f0',
                color: viewMode === 'timeline' ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                flex: '1',
                minWidth: '120px'
              }}
            >
              タイムライン表示
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', fontSize: 'clamp(14px, 3vw, 16px)' }}>
              読み込み中...
            </div>
          ) : sortedShiftData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              fontSize: 'clamp(14px, 3vw, 16px)'
            }}>
              この日のシフトはありません
            </div>
          ) : viewMode === 'list' ? (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ 
                        padding: '0.75rem 0.5rem', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #ddd',
                        fontSize: 'clamp(12px, 2.5vw, 14px)'
                      }}>
                        名前
                      </th>
                      <th style={{ 
                        padding: '0.75rem 0.5rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #ddd',
                        fontSize: 'clamp(12px, 2.5vw, 14px)'
                      }}>
                        店舗
                      </th>
                      <th style={{ 
                        padding: '0.75rem 0.5rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #ddd',
                        fontSize: 'clamp(12px, 2.5vw, 14px)'
                      }}>
                        勤務時間
                      </th>
                      <th style={{ 
                        padding: '0.75rem 0.5rem', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #ddd',
                        fontSize: 'clamp(12px, 2.5vw, 14px)'
                      }}>
                        状態
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedShiftData.map((shift, index) => (
                      <tr key={shift.manager_number || index} style={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                      }}>
                        <td style={{ 
                          padding: '0.75rem 0.5rem', 
                          borderBottom: '1px solid #eee',
                          fontSize: 'clamp(12px, 2.5vw, 14px)'
                        }}>
                          <strong>{getUserName(shift.manager_number)}</strong>
                        </td>
                        <td style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #eee',
                          fontWeight: 'bold',
                          color: '#1976D2',
                          fontSize: 'clamp(12px, 2.5vw, 14px)'
                        }}>
                          {shift.store ? `${shift.store}店舗` : '-'}
                        </td>
                        <td style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #eee',
                          fontSize: 'clamp(11px, 2.5vw, 13px)'
                        }}>
                          {isOffDay(shift) ? (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>休み</span>
                          ) : (
                            <span style={{ fontWeight: 'bold' }}>
                              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </span>
                          )}
                        </td>
                        <td style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'center',
                          borderBottom: '1px solid #eee'
                        }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: 'clamp(10px, 2vw, 12px)',
                            backgroundColor: isOffDay(shift) ? '#f44336' : '#4CAF50',
                            color: 'white',
                            whiteSpace: 'nowrap'
                          }}>
                            {isOffDay(shift) ? '休み' : '出勤'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '500px',
              WebkitOverflowScrolling: 'touch'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1500px' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 2 }}>
                  <tr>
                    <th style={{
                      padding: '0.4rem',
                      textAlign: 'left',
                      borderBottom: '2px solid #999',
                      borderRight: '2px solid #999',
                      minWidth: '100px',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      fontSize: 'clamp(11px, 2vw, 13px)'
                    }}>
                      名前
                    </th>
                    <th style={{
                      padding: '0.4rem',
                      textAlign: 'center',
                      borderBottom: '2px solid #999',
                      borderRight: '2px solid #999',
                      minWidth: '60px',
                      backgroundColor: '#f5f5f5',
                      position: 'sticky',
                      left: '100px',
                      zIndex: 3,
                      fontSize: 'clamp(10px, 2vw, 12px)'
                    }}>
                      店舗
                    </th>
                    {timeSlots.map((timeSlot) => (
                      <th key={timeSlot} style={{
                        padding: '0.25rem',
                        textAlign: 'center',
                        borderBottom: '2px solid #999',
                        borderRight: '1px solid #ccc',
                        minWidth: '35px',
                        fontSize: 'clamp(9px, 1.8vw, 11px)',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5'
                      }}>
                        {timeSlot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedShiftData.map((shift, index) => (
                    <tr key={shift.manager_number || index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ 
                        padding: '0.4rem', 
                        fontWeight: 'bold', 
                        borderBottom: '1px solid #ddd',
                        borderRight: '2px solid #999',
                        position: 'sticky',
                        left: 0,
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                        zIndex: 1,
                        fontSize: 'clamp(11px, 2vw, 13px)'
                      }}>
                        {getUserName(shift.manager_number)}
                      </td>
                      <td style={{
                        padding: '0.4rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #ddd',
                        borderRight: '2px solid #999',
                        fontWeight: 'bold',
                        color: '#1976D2',
                        position: 'sticky',
                        left: '100px',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                        zIndex: 1,
                        fontSize: 'clamp(10px, 2vw, 12px)'
                      }}>
                        {shift.store || '-'}
                      </td>
                      {timeSlots.map((timeSlot) => {
                        const isWorking = isWorkingAtTime(shift, timeSlot);
                        return (
                          <td key={timeSlot} style={{
                            borderBottom: '1px solid #ddd',
                            borderRight: '1px solid #ccc',
                            textAlign: 'center',
                            backgroundColor: isWorking ? '#4CAF50' : (index % 2 === 0 ? 'white' : '#f9f9f9'),
                            transition: 'all 0.3s ease',
                            padding: '0.2rem',
                            fontSize: 'clamp(8px, 1.5vw, 10px)'
                          }}>
                            {isWorking ? '●' : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button onClick={handleBackToCalendar} style={{
              backgroundColor: '#607D8B',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 'clamp(14px, 3vw, 16px)',
              width: '100%',
              maxWidth: '300px'
            }}>
              カレンダーに戻る
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default StaffShiftView;