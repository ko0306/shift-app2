import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function StaffWorkHours({ onBack }) {
  const [managerNumber, setManagerNumber] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [workData, setWorkData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [viewMode, setViewMode] = useState('monthly');
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [timeSlots, setTimeSlots] = useState([
    { name: '朝', start: '06:00', end: '12:00' },
    { name: '昼', start: '12:00', end: '17:00' },
    { name: '夕', start: '17:00', end: '22:00' },
    { name: '夜', start: '22:00', end: '06:00' }
  ]);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkData(managerNumber, selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth]);

  const handleAuthentication = async () => {
    if (!managerNumber) {
      setMessage('管理番号を入力してください');
      return;
    }

    setLoading(true);
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('manager_number', managerNumber)
        .single();

      if (userError || !user) {
        setMessage('管理番号が見つかりません');
        setLoading(false);
        return;
      }

      setUserName(user.name);
      setIsAuthenticated(true);
      setMessage('');
      
      fetchWorkData(managerNumber, selectedYear, selectedMonth);

    } catch (error) {
      console.error('認証エラー:', error);
      setMessage('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkData = async (mgr_number, year, month) => {
    setLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('manager_number', mgr_number)
        .order('date', { ascending: false });

      if (year && month) {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0);
        const endDateStr = endDate.toISOString().split('T')[0];
        query = query.gte('date', startDate).lte('date', endDateStr);
      }

      const { data, error } = await query;

      if (error) {
        console.error('データ取得エラー:', error);
        setMessage('データの取得に失敗しました');
        setWorkData([]);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMessage('勤怠データがありません');
        setWorkData([]);
        setLoading(false);
        return;
      }

      setWorkData(data);
      setMessage('');

    } catch (error) {
      console.error('データ取得エラー:', error);
      setMessage('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const getWeekday = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr.slice(0, 5);
  };

  const getWeekOfMonth = (dateStr) => {
    const date = new Date(dateStr);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const firstDayOfWeek = firstDay.getDay();
    return Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  };

  const isTimeInSlot = (timeStr, slotStart, slotEnd) => {
    if (!timeStr) return false;
    
    const [hour, minute] = timeStr.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;
    
    const [startHour, startMinute] = slotStart.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    
    const [endHour, endMinute] = slotEnd.split(':').map(Number);
    let endMinutes = endHour * 60 + endMinute;
    
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
      if (timeMinutes < startMinutes) {
        return timeMinutes + 24 * 60 >= startMinutes && timeMinutes + 24 * 60 < endMinutes;
      }
    }
    
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  };

  const getTimeSlotForRecord = (record) => {
    for (const slot of timeSlots) {
      if (isTimeInSlot(record.actual_start, slot.start, slot.end)) {
        return `${slot.name} (${slot.start}-${slot.end})`;
      }
    }
    return '未分類';
  };

  const addTimeSlot = () => {
    if (!newSlotName || !newSlotStart || !newSlotEnd) {
      alert('すべての項目を入力してください');
      return;
    }
    setTimeSlots([...timeSlots, { name: newSlotName, start: newSlotStart, end: newSlotEnd }]);
    setNewSlotName('');
    setNewSlotStart('');
    setNewSlotEnd('');
  };

  const deleteTimeSlot = (index) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const calculateTotalStats = () => {
    let totalMinutes = 0;
    let totalSalary = 0;
    let workDays = 0;

    workData.forEach(record => {
      if (record.work_minutes) {
        totalMinutes += record.work_minutes;
        workDays++;
      }
      if (record.salary) {
        totalSalary += record.salary;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      totalHours: hours,
      totalMinutes: minutes,
      totalSalary: totalSalary,
      workDays: workDays
    };
  };

  const getGroupedData = () => {
    if (viewMode === 'all') {
      return [{ key: 'すべて', data: workData }];
    }

    if (viewMode === 'daily') {
      const grouped = {};
      workData.forEach(record => {
        const key = `${record.date} (${getWeekday(record.date)})`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(record);
      });
      return Object.keys(grouped).sort().reverse().map(key => ({ key, data: grouped[key] }));
    }

    if (viewMode === 'weekly') {
      const grouped = {};
      workData.forEach(record => {
        const weekNum = getWeekOfMonth(record.date);
        const date = new Date(record.date);
        const month = date.getMonth() + 1;
        const key = `${month}月 第${weekNum}週`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(record);
      });
      return Object.keys(grouped).sort((a, b) => {
        const aWeek = parseInt(a.match(/第(\d+)週/)[1]);
        const bWeek = parseInt(b.match(/第(\d+)週/)[1]);
        return bWeek - aWeek;
      }).map(key => ({ key, data: grouped[key] }));
    }

    if (viewMode === 'monthly') {
      const grouped = {};
      workData.forEach(record => {
        const date = new Date(record.date);
        const key = `${date.getFullYear()}年${(date.getMonth() + 1)}月`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(record);
      });
      return Object.keys(grouped).sort().reverse().map(key => ({ key, data: grouped[key] }));
    }

    if (viewMode === 'time') {
      const grouped = {};
      workData.forEach(record => {
        const key = getTimeSlotForRecord(record);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(record);
      });
      return Object.keys(grouped).map(key => ({ key, data: grouped[key] }));
    }

    return [{ key: 'すべて', data: workData }];
  };

  const calculateGroupStats = (data) => {
    let totalMinutes = 0;
    let totalSalary = 0;
    let workDays = data.length;

    data.forEach(record => {
      if (record.work_minutes) totalMinutes += record.work_minutes;
      if (record.salary) totalSalary += record.salary;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes, totalSalary, workDays };
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h2>就労時間確認</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            自分の勤務記録を確認できます
          </p>
          
          <label>管理番号:</label>
          <input
            type="text"
            value={managerNumber}
            onChange={(e) => setManagerNumber(e.target.value)}
            placeholder="管理番号を入力"
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%'
            }}
          />

          <button 
            onClick={handleAuthentication} 
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '1rem'
            }}
          >
            {loading ? '確認中...' : '確認'}
          </button>

          {message && (
            <p style={{ 
              color: message.includes('成功') || message.includes('確認') ? 'green' : 'red', 
              marginTop: '0.5rem',
              fontSize: '0.9rem'
            }}>
              {message}
            </p>
          )}

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={onBack} style={{
              backgroundColor: '#607D8B',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateTotalStats();
  const groupedData = getGroupedData();

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ width: '900px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>就労時間確認</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>年度:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
        </div>
        
        <p>管理番号: <strong>{managerNumber}</strong> | 名前: <strong>{userName}</strong></p>

        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontWeight: 'bold' }}>月:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              {months.map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowTimeSettings(!showTimeSettings)}
            style={{
              backgroundColor: '#FF9800',
              color: 'white',
              padding: '0.4rem 0.1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            ⚙️ 時間帯設定
          </button>
        </div>

        {showTimeSettings && (
          <div style={{
            backgroundColor: '#fff',
            border: '2px solid #FF9800',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ marginTop: 0, color: '#FF9800' }}>時間帯設定</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              {timeSlots.map((slot, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px'
                }}>
                  <strong style={{ minWidth: '60px' }}>{slot.name}</strong>
                  <span>{slot.start} - {slot.end}</span>
                  <button
                    onClick={() => deleteTimeSlot(index)}
                    style={{
                      marginLeft: 'auto',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              padding: '1rem',
              backgroundColor: '#E3F2FD',
              borderRadius: '4px'
            }}>
              <input
                type="text"
                placeholder="名前"
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '80px'
                }}
              />
              <input
                type="time"
                value={newSlotStart}
                onChange={(e) => setNewSlotStart(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <span>-</span>
              <input
                type="time"
                value={newSlotEnd}
                onChange={(e) => setNewSlotEnd(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={addTimeSlot}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                追加
              </button>
            </div>

            <button
              onClick={() => setShowTimeSettings(false)}
              style={{
                marginTop: '1rem',
                backgroundColor: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              閉じる
            </button>
          </div>
        )}

        <div style={{
          backgroundColor: '#E3F2FD',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setViewMode('monthly')}
            style={{
              backgroundColor: viewMode === 'monthly' ? '#1976D2' : 'white',
              color: viewMode === 'monthly' ? 'white' : '#1976D2',
              padding: '0.5rem 1.5rem',
              border: '2px solid #1976D2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: '1',
              minWidth: '80px'
            }}
          >
            月別
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            style={{
              backgroundColor: viewMode === 'weekly' ? '#1976D2' : 'white',
              color: viewMode === 'weekly' ? 'white' : '#1976D2',
              padding: '0.5rem 1.5rem',
              border: '2px solid #1976D2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: '1',
              minWidth: '80px'
            }}
          >
            週別
          </button>
          <button
            onClick={() => setViewMode('daily')}
            style={{
              backgroundColor: viewMode === 'daily' ? '#1976D2' : 'white',
              color: viewMode === 'daily' ? 'white' : '#1976D2',
              padding: '0.5rem 1.5rem',
              border: '2px solid #1976D2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: '1',
              minWidth: '80px'
            }}
          >
            日別
          </button>
          <button
            onClick={() => setViewMode('time')}
            style={{
              backgroundColor: viewMode === 'time' ? '#1976D2' : 'white',
              color: viewMode === 'time' ? 'white' : '#1976D2',
              padding: '0.5rem 1.5rem',
              border: '2px solid #1976D2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: '1',
              minWidth: '80px'
            }}
          >
            時間帯別
          </button>
          <button
            onClick={() => setViewMode('all')}
            style={{
              backgroundColor: viewMode === 'all' ? '#1976D2' : 'white',
              color: viewMode === 'all' ? 'white' : '#1976D2',
              padding: '0.5rem 1.5rem',
              border: '2px solid #1976D2',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: '1',
              minWidth: '80px'
            }}
          >
            全表示
          </button>
        </div>

        <div style={{
          backgroundColor: '#E8F5E9',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>勤務日数</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976D2' }}>
              {stats.workDays}日
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>総労働時間</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976D2' }}>
              {stats.totalHours}時間{stats.totalMinutes}分
            </div>
          </div>
          {stats.totalSalary > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>総給料</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>
                ¥{stats.totalSalary.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            読み込み中...
          </div>
        ) : workData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            {message || '勤怠データがありません'}
          </div>
        ) : (
          <div>
            {groupedData.map((group, groupIndex) => {
              const groupStats = calculateGroupStats(group.data);
              
              return (
                <div key={groupIndex} style={{ marginBottom: '2rem' }}>
                  {viewMode !== 'all' && (
                    <div style={{
                      backgroundColor: '#FFF3E0',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ margin: 0, color: '#E65100' }}>{group.key}</h3>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {groupStats.workDays}日 | {groupStats.hours}h{groupStats.minutes}m
                        {groupStats.totalSalary > 0 && ` | ¥${groupStats.totalSalary.toLocaleString()}`}
                      </div>
                    </div>
                  )}
                  
                  <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '400px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5' }}>
                        <tr>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                            日付
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                            店舗
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                            開始時刻
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                            終了時刻
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                            休憩(分)
                          </th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                            労働時間
                          </th>
                          {group.data.some(d => d.salary) && (
                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                              給料
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {group.data.map((record, index) => {
                          const hours = Math.floor(record.work_minutes / 60);
                          const minutes = record.work_minutes % 60;

                          return (
                            <tr key={record.id} style={{
                              backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                            }}>
                              <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                                <strong>{record.date}</strong> ({getWeekday(record.date)})
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                textAlign: 'center', 
                                borderBottom: '1px solid #eee',
                                fontWeight: 'bold',
                                color: '#1976D2'
                              }}>
                                {record.store}店舗
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                {formatTime(record.actual_start)}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                {formatTime(record.actual_end)}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                {record.break_minutes || 0}分
                              </td>
                              <td style={{ 
                                padding: '0.75rem', 
                                textAlign: 'center', 
                                borderBottom: '1px solid #eee',
                                fontWeight: 'bold'
                              }}>
                                {hours}時間{minutes}分
                              </td>
                              {group.data.some(d => d.salary) && (
                                <td style={{ 
                                  padding: '0.75rem', 
                                  textAlign: 'right', 
                                  borderBottom: '1px solid #eee',
                                  fontWeight: 'bold',
                                  color: record.salary ? '#4CAF50' : '#999'
                                }}>
                                  {record.salary ? `¥${record.salary.toLocaleString()}` : '-'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button onClick={onBack} style={{
            backgroundColor: '#607D8B',
            color: 'white',
            padding: '0.75rem 2rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            メニューに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffWorkHours;