import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

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
    setIsEditing(false);
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
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditingShifts(shiftData.map(shift => ({
        ...shift,
        start_time: shift.start_time || '09:00',
        end_time: shift.end_time || '17:00',
        store: shift.store || '',
        is_off: shift.is_off || isOffDay(shift)
      })));
    }
    setIsEditing(!isEditing);
  };

  const handleShiftChange = (shiftId, field, value) => {
    const updated = editingShifts.map(shift => {
      if (shift.id === shiftId || 
          (shift.manager_number === shiftId && !shift.id)) {
        const updatedShift = { ...shift, [field]: value };
        
        if (field === 'is_off') {
          if (value) {
            updatedShift.start_time = null;
            updatedShift.end_time = null;
          } else {
            updatedShift.start_time = updatedShift.start_time || '09:00';
            updatedShift.end_time = updatedShift.end_time || '17:00';
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
        const updateData = {
          date: shift.date,
          manager_number: shift.manager_number,
          start_time: shift.is_off ? null : shift.start_time,
          end_time: shift.is_off ? null : shift.end_time,
          store: shift.store || null,
          is_off: shift.is_off
        };

        const { error } = await supabase
          .from('final_shifts')
          .upsert(updateData, {
            onConflict: 'date,manager_number'
          });

        if (error) {
          alert(`更新に失敗しました: ${error.message}`);
          return;
        }
      }

      alert('シフトを更新しました');
      setIsEditing(false);
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
    const timeParts = timeStr.split(':');
    return `${timeParts[0]}:${timeParts[1]}`;
  };

  const getWeekday = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(dateStr);
    return days[date.getDay()];
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

  const sortedShiftData = [...(isEditing ? editingShifts : shiftData)].sort((a, b) => {
    const aOff = isOffDay(a) ? 1 : 0;
    const bOff = isOffDay(b) ? 1 : 0;
    return aOff - bOff;
  });

  if (currentView === 'calendar') {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2>シフト確認（店長）</h2>

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
            onClick={handleEditToggle}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isEditing ? '#FF9800' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isEditing ? 'キャンセル' : '変更モード'}
          </button>
          {isEditing && (
            <button
              onClick={handleUpdate}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '更新中...' : '更新'}
            </button>
          )}
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
        ) : (
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
                  {isEditing && (
                    <>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        店舗変更
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        開始
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        終了
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
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
                        {(isEditing ? editingShift.store : shift.store) ? `${isEditing ? editingShift.store : shift.store}店舗` : '-'}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        borderBottom: '1px solid #eee'
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
                              {formatTime(editingShift.start_time || '09:00')} - {formatTime(editingShift.end_time || '17:00')}
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
                          fontSize: '0.8rem',
                          backgroundColor: (isEditing ? editingShift.is_off : isOffDay(shift)) ? '#f44336' : '#4CAF50',
                          color: 'white'
                        }}>
                          {(isEditing ? editingShift.is_off : isOffDay(shift)) ? '休み' : '出勤'}
                        </span>
                      </td>
                      {isEditing && (
                        <>
                          <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
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
                                textAlign: 'center'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <input
                              type="time"
                              value={editingShift.is_off ? '' : (editingShift.start_time || '09:00')}
                              onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'start_time', e.target.value)}
                              disabled={editingShift.is_off}
                              style={{
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                opacity: editingShift.is_off ? 0.5 : 1,
                                width: '100px',
                                backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white'
                              }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            <input
                              type="time"
                              value={editingShift.is_off ? '' : (editingShift.end_time || '17:00')}
                              onChange={(e) => handleShiftChange(shift.id || shift.manager_number, 'end_time', e.target.value)}
                              disabled={editingShift.is_off}
                              style={{
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                opacity: editingShift.is_off ? 0.5 : 1,
                                width: '100px',
                                backgroundColor: editingShift.is_off ? '#f5f5f5' : 'white'
                              }}
                            />
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

export default ManagerShiftView;