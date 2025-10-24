import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// 日付文字列を正確に取得する関数（タイムゾーン対応）
const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function ManagerShiftView({ onBack }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [currentView, setCurrentView] = useState('calendar');
  const [isEditing, setIsEditing] = useState(false);
  const [editingShifts, setEditingShifts] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    fetchUsers();
    fetchAvailableDates();
  }, []);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      console.log('Orientation check:', { width: window.innerWidth, height: window.innerHeight, portrait });
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
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
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error(error);
      return;
    }

    const userMapTemp = {};
    if (data) {
      data.forEach(user => {
        userMapTemp[user.manager_number] = user.name;
        userMapTemp[String(user.manager_number)] = user.name;
        userMapTemp[Number(user.manager_number)] = user.name;
      });
    }
    setUserMap(userMapTemp);
  };

  const fetchShiftData = async (date) => {
    if (!date) return;

    setLoading(true);
    
    const { data: finalShifts, error: finalError } = await supabase
      .from('final_shifts')
      .select('*')
      .eq('date', date)
      .order('manager_number');

    if (finalError) {
      alert('データ取得に失敗しました');
      setShiftData([]);
    } else {
      setShiftData(finalShifts || []);
    }

    setCurrentView('shift');
    setLoading(false);
  };

  const getUserName = (managerNumber) => {
    return userMap[managerNumber] || '(不明)';
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
    setIsEditing(false);
    setShowTimeline(false);
  };

  const changeDate = (delta) => {
    if (!selectedDate || availableDates.length === 0) return;
    const idx = availableDates.indexOf(selectedDate);
    const newIdx = idx + delta;
    if (newIdx >= 0 && newIdx < availableDates.length) {
      const newDate = availableDates[newIdx];
      setSelectedDate(newDate);
      fetchShiftData(newDate);
      setIsEditing(false);
      setEditingShifts([]);
      setShowTimeline(false);
    }
  };

  const parseTime36 = (timeStr) => {
    if (!timeStr) return { hour: 9, min: 0 };
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    return { hour, min };
  };

  const formatTime36 = (hour, min) => {
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      console.log('編集モード開始 - 元データ:', shiftData);
      
      setEditingShifts(shiftData.map(shift => {
        const startTime = parseTime36(shift.start_time);
        const endTime = parseTime36(shift.end_time);
        
        return {
          ...shift,
          startHour: startTime.hour,
          startMin: startTime.min,
          endHour: endTime.hour,
          endMin: endTime.min,
          store: shift.store || '',
          is_off: shift.is_off || isOffDay(shift)
        };
      }));
      setShowTimeline(false);
    } else {
      setShowTimeline(false);
    }
    setIsEditing(!isEditing);
  };

  const toggleTimeline = () => {
    setShowTimeline(!showTimeline);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 36; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  };

  const handleShiftChange = (shiftId, field, value) => {
    const updated = editingShifts.map(shift => {
      if (shift.id === shiftId || 
          (shift.manager_number === shiftId && !shift.id)) {
        const updatedShift = { ...shift, [field]: value };
        
        if (field === 'is_off') {
          if (value) {
            updatedShift.startHour = 0;
            updatedShift.startMin = 0;
            updatedShift.endHour = 0;
            updatedShift.endMin = 0;
          } else {
            updatedShift.startHour = updatedShift.startHour || 9;
            updatedShift.startMin = updatedShift.startMin || 0;
            updatedShift.endHour = updatedShift.endHour || 17;
            updatedShift.endMin = updatedShift.endMin || 0;
          }
        }
        
        return updatedShift;
      }
      return shift;
    });
    
    setEditingShifts(updated);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      for (const shift of editingShifts) {
        const storeValue = shift.store;
        
        if (!storeValue || storeValue.trim() === '') {
          alert(`${getUserName(shift.manager_number)}の店舗を選択または入力してください`);
          setLoading(false);
          return;
        }

        const startTime = shift.is_off 
          ? null 
          : `${String(shift.startHour).padStart(2, '0')}:${String(shift.startMin).padStart(2, '0')}:00`;
        const endTime = shift.is_off 
          ? null 
          : `${String(shift.endHour).padStart(2, '0')}:${String(shift.endMin).padStart(2, '0')}:00`;

        const updateData = {
          date: shift.date,
          manager_number: shift.manager_number,
          start_time: startTime,
          end_time: endTime,
          store: storeValue,
          is_off: shift.is_off
        };

        const { error } = await supabase
          .from('final_shifts')
          .upsert(updateData, {
            onConflict: 'date,manager_number'
          });

        if (error) {
          console.error(`${getUserName(shift.manager_number)} の保存エラー:`, error);
          alert(`${getUserName(shift.manager_number)} の保存に失敗しました: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      alert('シフトを更新しました');
      setIsEditing(false);
      setShowTimeline(false);
      fetchShiftData(selectedDate);
      
    } catch (error) {
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
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
      const dateStr = getDateString(currentDate);
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
    const timeParts = timeStr.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  };

  const getWeekday = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(dateStr + 'T00:00:00');
    return days[date.getDay()];
  };

  const isOffDay = (shift) => {
    return shift.is_off === true ||
           !shift.start_time ||
           !shift.end_time ||
           shift.start_time === '' ||
           shift.end_time === '' ||
           (shift.start_time === '00:00' && shift.end_time === '00:00') ||
           (shift.start_time === '00:00:00' && shift.end_time === '00:00:00');
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const timeSlots = generateTimeSlots();

  const sortedShiftData = [...(isEditing ? editingShifts : shiftData)].sort((a, b) => {
    const aOff = isOffDay(a) ? 1 : 0;
    const bOff = isOffDay(b) ? 1 : 0;
    return aOff - bOff;
  });

  if (currentView === 'calendar') {
    return (
      <div className="login-wrapper" style={{ padding: '0.5rem', boxSizing: 'border-box' }}>
        <div className="login-card" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', padding: '1rem' }}>
          <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)' }}>シフト確認（店長）</h2>

          <div style={{
            marginTop: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            boxSizing: 'border-box'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              gap: '0.5rem'
            }}>
              <button onClick={() => changeMonth(-1)} style={{
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: 'pointer',
                minWidth: '40px'
              }}>
                ◀
              </button>
              <h3 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.2rem)', textAlign: 'center', flex: 1 }}>
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </h3>
              <button onClick={() => changeMonth(1)} style={{
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: 'pointer',
                minWidth: '40px'
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
                  padding: '0.5rem',
                  backgroundColor: '#e0e0e0',
                  fontSize: 'clamp(0.7rem, 3vw, 0.9rem)'
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
                    fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
                    minHeight: '40px'
                  }}
                  onMouseEnter={(e) => {
                    if (dayInfo.hasShift) {
                      e.target.style.backgroundColor = '#BBDEFB';
                      e.target.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (dayInfo.hasShift) {
                      e.target.style.backgroundColor = '#E3F2FD';
                      e.target.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {dayInfo.day}
                </button>
              ))}
            </div>

            <div style={{
              marginTop: '0.5rem',
              fontSize: 'clamp(0.7rem, 3vw, 0.8rem)',
              color: '#666',
              textAlign: 'center'
            }}>
              青色: シフトあり ({availableDates.length}日) | 灰色: シフトなし
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={onBack} style={{
              backgroundColor: '#607D8B',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 'clamp(0.9rem, 3.5vw, 1rem)',
              width: '100%',
              maxWidth: '300px'
            }}>
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper" style={{ padding: '0.5rem', boxSizing: 'border-box' }}>
      {isPortrait && isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '2rem', animation: 'rotate 2s ease-in-out infinite' }}>
            📱→📱
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>画面を横向きにしてください</h2>
          <p style={{ fontSize: '1rem', color: '#ccc' }}>
            {showTimeline ? 'タイムライン表示' : '変更モード'}は横向きでの使用を推奨します
          </p>
          <style>{`
            @keyframes rotate {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(90deg); }
            }
          `}</style>
        </div>
      )}
      <div className="login-card" style={{ width: showTimeline ? '95vw' : '900px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem', maxWidth: '600px', margin: '0 auto 1rem' }}>
          <button onClick={() => changeDate(-1)} style={{ minWidth: '40px', padding: '0.5rem', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>◀</button>
          <h2 style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)', margin: 0, textAlign: 'center', flex: 1 }}>
            {selectedDate} ({getWeekday(selectedDate)})
          </h2>
          <button onClick={() => changeDate(1)} style={{ minWidth: '40px', padding: '0.5rem', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>▶</button>
        </div>

        <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', maxWidth: '600px', margin: '0 auto 1rem' }}>
          <button
            onClick={handleEditToggle}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isEditing ? '#FF9800' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'
            }}
          >
            {isEditing ? 'キャンセル' : '変更モード'}
          </button>
          <button
            onClick={toggleTimeline}
            disabled={!isEditing}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: !isEditing ? '#ccc' : (showTimeline ? '#9C27B0' : '#673AB7'),
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isEditing ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
              opacity: !isEditing ? 0.6 : 1
            }}
          >
            {showTimeline ? 'リスト' : 'タイムライン'}
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || !isEditing}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: (!isEditing || loading) ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (loading || !isEditing) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
              opacity: (!isEditing || loading) ? 0.6 : 1
            }}
          >
            {loading ? '更新中...' : '更新'}
          </button>
          <button
            onClick={handleBackToCalendar}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#607D8B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'
            }}
          >
            カレンダー
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            読み込み中...
          </div>
        ) : sortedShiftData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            この日のシフトはありません
          </div>
        ) : showTimeline && isEditing ? (
          <div style={{ overflowX: 'auto', overflowY: 'auto', marginTop: '1rem', width: '100%', maxHeight: 'calc(100vh - 250px)', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '80px', position: 'sticky', left: 0, zIndex: 3, backgroundColor: '#FFB6C1', border: '1px solid #ddd', padding: '0.5rem', fontSize: '0.9rem', color: 'black' }}>名前</th>
                  <th style={{ minWidth: '60px', position: 'sticky', left: '80px', zIndex: 3, backgroundColor: '#ADD8E6', border: '1px solid #ddd', padding: '0.5rem', fontSize: '0.9rem', color: 'black' }}>店舗</th>
                  <th style={{ minWidth: '40px', position: 'sticky', left: '140px', zIndex: 3, backgroundColor: '#E6E6FA', border: '1px solid #ddd', padding: '0.5rem', fontSize: '0.9rem', color: 'black' }}>休</th>
                  <th style={{ minWidth: '120px', position: 'sticky', left: '180px', zIndex: 3, backgroundColor: '#98FB98', border: '1px solid #ddd', padding: '0.5rem', fontSize: '0.9rem', color: 'black' }}>開始</th>
                  <th style={{ minWidth: '120px', position: 'sticky', left: '300px', zIndex: 3, backgroundColor: '#FFE4B5', border: '1px solid #ddd', padding: '0.5rem', fontSize: '0.9rem', color: 'black' }}>終了</th>
                  {timeSlots.map((slot, i) => (
                    <th key={i} style={{ minWidth: '30px', width: '30px', backgroundColor: '#F0E68C', border: '1px solid #ddd', fontSize: '0.7rem', padding: '0.2rem', color: 'black' }}>
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedShiftData.map((shift, index) => {
                  const editingShift = editingShifts.find(es => es.id === shift.id || 
                                                                  (es.manager_number === shift.manager_number && !shift.id)) || shift;
                  
                  const startTimeStr = formatTime36(editingShift.startHour || 0, editingShift.startMin || 0);
                  const endTimeStr = formatTime36(editingShift.endHour || 0, editingShift.endMin || 0);
                  
                  return (
                    <tr key={shift.id || shift.manager_number || index}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'white', border: '1px solid #ddd', padding: '0.5rem', fontSize: '0.9rem', color: 'black' }}>
                        <strong>{getUserName(shift.manager_number)}</strong>
                      </td>
                      <td style={{ position: 'sticky', left: '80px', zIndex: 2, backgroundColor: 'white', border: '1px solid #ddd', padding: '0.3rem' }}>
                        <input
                          type="text"
                          value={editingShift.store || ''}
                          onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'store', e.target.value)}
                          placeholder="店舗"
                          style={{
                            padding: '0.3rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontSize: '0.85rem',
                            color: 'black'
                          }}
                        />
                      </td>
                      <td style={{ position: 'sticky', left: '140px', zIndex: 2, backgroundColor: 'white', border: '1px solid #ddd', padding: '0.3rem', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={editingShift.is_off || false}
                          onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'is_off', e.target.checked)}
                          style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ position: 'sticky', left: '180px', zIndex: 2, backgroundColor: 'white', border: '1px solid #ddd', padding: '0.3rem' }}>
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          <select
                            value={editingShift.startHour || 0}
                            onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'startHour', parseInt(e.target.value))}
                            disabled={editingShift.is_off}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem', backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white', color: 'black' }}
                          >
                            {[...Array(37)].map((_, h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.8rem', color: 'black' }}>:</span>
                          <select
                            value={editingShift.startMin || 0}
                            onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'startMin', parseInt(e.target.value))}
                            disabled={editingShift.is_off}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem', backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white', color: 'black' }}
                          >
                            {[...Array(60)].map((_, m) => (
                              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td style={{ position: 'sticky', left: '300px', zIndex: 2, backgroundColor: 'white', border: '1px solid #ddd', padding: '0.3rem' }}>
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                          <select
                            value={editingShift.endHour || 0}
                            onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'endHour', parseInt(e.target.value))}
                            disabled={editingShift.is_off}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem', backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white', color: 'black' }}
                          >
                            {[...Array(37)].map((_, h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.8rem', color: 'black' }}>:</span>
                          <select
                            value={editingShift.endMin || 0}
                            onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'endMin', parseInt(e.target.value))}
                            disabled={editingShift.is_off}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.2rem', backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white', color: 'black' }}
                          >
                            {[...Array(60)].map((_, m) => (
                              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      {timeSlots.map((slot, colIndex) => {
                        const inShift = !editingShift.is_off && 
                                       slot >= startTimeStr && 
                                       slot < endTimeStr;
                        
                        let bgColor = 'transparent';
                        if (editingShift.is_off) {
                          bgColor = '#e0e0e0';
                        } else if (inShift) {
                          bgColor = '#90EE90';
                        }
                        
                        return (
                          <td key={colIndex} style={{ 
                            backgroundColor: bgColor, 
                            minWidth: '30px', 
                            width: '30px', 
                            border: '1px solid #ddd',
                            padding: 0
                          }} />
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isEditing ? '1000px' : '500px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                    名前
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                    店舗
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                    勤務時間
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                    状態
                  </th>
                  {isEditing && (
                    <>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                        店舗変更
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                        開始
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                        終了
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                        休み
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedShiftData.map((shift, displayIndex) => {
                  const editingShift = isEditing ? 
                    editingShifts.find(es => es.id === shift.id || 
                                              (es.manager_number === shift.manager_number && !shift.id)) || shift 
                    : shift;
                  
                  return (
                    <tr key={shift.id || shift.manager_number || displayIndex} style={{
                      backgroundColor: displayIndex % 2 === 0 ? 'white' : '#f9f9f9'
                    }}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)', whiteSpace: 'nowrap' }}>
                        <strong>{getUserName(shift.manager_number)}</strong>
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                        color: '#1976D2',
                        fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
                        whiteSpace: 'nowrap'
                      }}>
                        {(isEditing ? editingShift.store : shift.store) ? `${isEditing ? editingShift.store : shift.store}店舗` : '-'}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #eee',
                        fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                        whiteSpace: 'nowrap'
                      }}>
                        {!isEditing ? (
                          isOffDay(shift) ? (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>休み</span>
                          ) : (
                            <span style={{ fontWeight: 'bold' }}>
                              {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                            </span>
                          )
                        ) : (
                          editingShift.is_off ? (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>休み</span>
                          ) : (
                            <span style={{ fontWeight: 'bold' }}>
                              {formatTime36(editingShift.startHour || 0, editingShift.startMin || 0)} - {formatTime36(editingShift.endHour || 0, editingShift.endMin || 0)}
                            </span>
                          )
                        )}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #eee'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                          backgroundColor: (isEditing ? editingShift.is_off : isOffDay(shift)) ? '#f44336' : '#4CAF50',
                          color: 'white',
                          whiteSpace: 'nowrap'
                        }}>
                          {(isEditing ? editingShift.is_off : isOffDay(shift)) ? '休み' : '出勤'}
                        </span>
                      </td>
                      {isEditing && (
                        <>
                          <td style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <input
                              type="text"
                              value={editingShift.store || ''}
                              onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'store', e.target.value)}
                              placeholder="店舗名"
                              style={{
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                width: '80px',
                                textAlign: 'center',
                                fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                                boxSizing: 'border-box'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <select
                                value={editingShift.startHour || 0}
                                onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'startHour', parseInt(e.target.value))}
                                disabled={editingShift.is_off}
                                style={{
                                  padding: '0.5rem',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  opacity: editingShift.is_off ? 0.5 : 1,
                                  width: '60px',
                                  backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white',
                                  fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {[...Array(37)].map((_, h) => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)' }}>:</span>
                              <select
                                value={editingShift.startMin || 0}
                                onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'startMin', parseInt(e.target.value))}
                                disabled={editingShift.is_off}
                                style={{
                                  padding: '0.5rem',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  opacity: editingShift.is_off ? 0.5 : 1,
                                  width: '60px',
                                  backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white',
                                  fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {[...Array(60)].map((_, m) => (
                                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                              <select
                                value={editingShift.endHour || 0}
                                onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'endHour', parseInt(e.target.value))}
                                disabled={editingShift.is_off}
                                style={{
                                  padding: '0.5rem',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  opacity: editingShift.is_off ? 0.5 : 1,
                                  width: '60px',
                                  backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white',
                                  fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {[...Array(37)].map((_, h) => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <span style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)' }}>:</span>
                              <select
                                value={editingShift.endMin || 0}
                                onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'endMin', parseInt(e.target.value))}
                                disabled={editingShift.is_off}
                                style={{
                                  padding: '0.5rem',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  opacity: editingShift.is_off ? 0.5 : 1,
                                  width: '60px',
                                  backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white',
                                  fontSize: 'clamp(0.75rem, 2.5vw, 0.85rem)',
                                  boxSizing: 'border-box'
                                }}
                              >
                                {[...Array(60)].map((_, m) => (
                                  <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <input
                              type="checkbox"
                              checked={editingShift.is_off || false}
                              onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'is_off', e.target.checked)}
                              style={{ 
                                transform: 'scale(1.2)',
                                cursor: 'pointer'
                              }}
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerShiftView;