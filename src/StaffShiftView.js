import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function StaffShiftView({ onBack }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [currentView, setCurrentView] = useState('calendar');

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
        .select('*');

      if (error) {
        console.error('ユーザー取得エラー:', error);
        return;
      }

      const userMapTemp = {};
      if (users && users.length > 0) {
        users.forEach(user => {
          const managerNumber = user.manager_number;
          if (managerNumber !== null && managerNumber !== undefined) {
            userMapTemp[String(managerNumber)] = user.name || `ユーザー${managerNumber}`;
            userMapTemp[Number(managerNumber)] = user.name || `ユーザー${managerNumber}`;
          }
        });
      }
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
    
    const name = userMap[managerNumber] || 
                 userMap[String(managerNumber)] || 
                 userMap[Number(managerNumber)];
    
    if (name) return name;
    
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

  // 36時間表記対応：0:00～35:00まで1時間刻みで生成
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

    // 翌日にまたがる場合の処理
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    // チェック時刻も24時以降なら24*60を加算
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

  const sortedShiftData = [...shiftData].sort((a, b) => {
    const aOff = isOffDay(a) ? 1 : 0;
    const bOff = isOffDay(b) ? 1 : 0;
    return aOff - bOff;
  });

  if (currentView === 'calendar') {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2>シフト確認</h2>

          <div style={{
            marginTop: '1rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#f9f9f9'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <button onClick={() => changeMonth(-1)} style={{
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: 'pointer'
              }}>
                ◀
              </button>
              <h3 style={{ margin: 0 }}>
                {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
              </h3>
              <button onClick={() => changeMonth(1)} style={{
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: 'pointer'
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
                  backgroundColor: '#e0e0e0'
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
                    transition: 'all 0.3s ease'
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
              fontSize: '0.8rem',
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
              fontSize: '1rem'
            }}>
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ width: '900px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={() => changeDate(-1)}>◀</button>
          {selectedDate} ({getWeekday(selectedDate)}) のシフト
          <button onClick={() => changeDate(1)}>▶</button>
        </h2>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: viewMode === 'list' ? '#2196F3' : '#f0f0f0',
              color: viewMode === 'list' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
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
              transition: 'all 0.3s ease'
            }}
          >
            タイムライン表示
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
        ) : viewMode === 'list' ? (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                    名前
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    店舗
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    勤務時間
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                    状態
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedShiftData.map((shift, index) => (
                  <tr key={shift.manager_number || index} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                  }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                      <strong>{getUserName(shift.manager_number)}</strong>
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #eee',
                      fontWeight: 'bold',
                      color: '#1976D2'
                    }}>
                      {shift.store ? `${shift.store}店舗` : '-'}
                    </td>
                    <td style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #eee'
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
                      padding: '0.75rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #eee'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        backgroundColor: isOffDay(shift) ? '#f44336' : '#4CAF50',
                        color: 'white'
                      }}>
                        {isOffDay(shift) ? '休み' : '出勤'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '2000px' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 2 }}>
                <tr>
                  <th style={{
                    padding: '0.5rem',
                    textAlign: 'left',
                    borderBottom: '2px solid #999',
                    borderRight: '2px solid #999',
                    minWidth: '160px',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    left: 0,
                    zIndex: 3
                  }}>
                    名前
                  </th>
                  <th style={{
                    padding: '0.5rem',
                    textAlign: 'center',
                    borderBottom: '2px solid #999',
                    borderRight: '2px solid #999',
                    minWidth: '80px',
                    backgroundColor: '#f5f5f5',
                    position: 'sticky',
                    left: '160px',
                    zIndex: 3
                  }}>
                    店舗
                  </th>
                  {timeSlots.map((timeSlot) => (
                    <th key={timeSlot} style={{
                      padding: '0.25rem',
                      textAlign: 'center',
                      borderBottom: '2px solid #999',
                      borderRight: '1px solid #ccc',
                      minWidth: '50px',
                      fontSize: '0.75rem',
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
                      padding: '0.5rem', 
                      fontWeight: 'bold', 
                      borderBottom: '1px solid #ddd',
                      borderRight: '2px solid #999',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                      zIndex: 1
                    }}>
                      {getUserName(shift.manager_number)}
                    </td>
                    <td style={{
                      padding: '0.5rem',
                      textAlign: 'center',
                      borderBottom: '1px solid #ddd',
                      borderRight: '2px solid #999',
                      fontWeight: 'bold',
                      color: '#1976D2',
                      position: 'sticky',
                      left: '160px',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                      zIndex: 1
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
                          padding: '0.25rem',
                          fontSize: '0.7rem'
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
            cursor: 'pointer'
          }}>
            カレンダーに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffShiftView;