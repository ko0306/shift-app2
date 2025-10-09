import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

// ----------------------------------------------------------------------
// 共通ヘルパー関数
// ----------------------------------------------------------------------
const timeToMinutes = (time) => {
    if (!time) return 0;
    const parts = time.split(':').map(Number);
    return parts[0] * 60 + parts[1]; 
};

const calculateWorkMinutes = (start, end, breakMinutes) => {
  if (!start || !end) return 0;
  
  let startMinutes = timeToMinutes(start);
  let endMinutes = timeToMinutes(end);
  let breakMins = breakMinutes || 0;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; 
  }

  const workMinutes = endMinutes - startMinutes;
  
  return Math.max(0, workMinutes - breakMins);
};

const calculateWorkMinutesInPeriod = (actualStart, actualEnd, breakMinutes, periodStartMinutes, periodEndMinutes) => {
    if (!actualStart || !actualEnd) return 0;

    let start = timeToMinutes(actualStart);
    let end = timeToMinutes(actualEnd);

    if (end < start) {
        end += 24 * 60;
    }
    
    const overlapStart = Math.max(start, periodStartMinutes);
    const overlapEnd = Math.min(end, periodEndMinutes);

    if (overlapEnd <= overlapStart) {
        return 0;
    }

    let workInPeriod = overlapEnd - overlapStart;
    const totalWorkDuration = end - start;

    if (totalWorkDuration > 0 && breakMinutes > 0) {
        const breakRatio = breakMinutes / totalWorkDuration;
        const breakDeduction = workInPeriod * breakRatio;
        workInPeriod -= breakDeduction;
    }

    return Math.max(0, Math.round(workInPeriod));
};

const formatMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (totalMinutes < 0) return '0時間0分'; 
    return `${hours}時間${minutes}分`;
};

// ----------------------------------------------------------------------
// TimePeriodEditor (集計時間帯設定コンポーネント)
// ----------------------------------------------------------------------
const TimePeriodEditor = ({ timePeriods, setTimePeriods, onClose }) => {
    const [currentPeriods, setCurrentPeriods] = useState(timePeriods);
    const [newPeriod, setNewPeriod] = useState({ label: '', start: '00:00', end: '00:00' });
    const [nextId, setNextId] = useState(Math.max(0, ...timePeriods.map(p => p.id)) + 1);

    const handleUpdate = (id, field, value) => {
        setCurrentPeriods(prev => prev.map(p => 
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleDelete = (id) => {
        setCurrentPeriods(prev => prev.filter(p => p.id !== id));
    };

    const handleAdd = () => {
        if (!newPeriod.label || !newPeriod.start || !newPeriod.end) {
            alert("ラベル、開始時刻、終了時刻をすべて入力してください。");
            return;
        }

        const newKey = `period${nextId}`; 

        const periodToAdd = {
            id: nextId,
            key: newKey, 
            label: newPeriod.label,
            start: newPeriod.start,
            end: newPeriod.end,
        };
        
        setCurrentPeriods(prev => [...prev, periodToAdd]);
        setNextId(nextId + 1);
        setNewPeriod({ label: '', start: '00:00', end: '00:00' });
    };

    const handleSave = () => {
        currentPeriods.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
        setTimePeriods(currentPeriods);
        onClose();
    };

    return (
        <div style={{ padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0 }}>集計時間帯の編集</h3>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                {currentPeriods.map((p) => (
                    <div key={p.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', borderBottom: '1px dotted #ddd' }}>
                        <input
                            type="text"
                            value={p.label}
                            onChange={(e) => handleUpdate(p.id, 'label', e.target.value)}
                            placeholder="ラベル"
                            style={{ flex: 1, padding: '0.25rem' }}
                        />
                        <input
                            type="time"
                            value={p.start}
                            onChange={(e) => handleUpdate(p.id, 'start', e.target.value)}
                            style={{ width: '80px', padding: '0.25rem' }}
                            step="60"
                        />
                        <span>〜</span>
                        <input
                            type="time"
                            value={p.end}
                            onChange={(e) => handleUpdate(p.id, 'end', e.target.value)}
                            style={{ width: '80px', padding: '0.25rem' }}
                            step="60"
                        />
                        <button onClick={() => handleDelete(p.id)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px' }}>
                            削除
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                <input
                    type="text"
                    value={newPeriod.label}
                    onChange={(e) => setNewPeriod({ ...newPeriod, label: e.target.value })}
                    placeholder="新しいラベル"
                    style={{ flex: 1, padding: '0.25rem' }}
                />
                <input
                    type="time"
                    value={newPeriod.start}
                    onChange={(e) => setNewPeriod({ ...newPeriod, start: e.target.value })}
                    style={{ width: '80px', padding: '0.25rem' }}
                    step="60"
                />
                <span>〜</span>
                <input
                    type="time"
                    value={newPeriod.end}
                    onChange={(e) => setNewPeriod({ ...newPeriod, end: e.target.value })}
                    style={{ width: '80px', padding: '0.25rem' }}
                    step="60"
                />
                <button onClick={handleAdd} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
                    追加
                </button>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{ padding: '0.5rem 1rem', backgroundColor: '#9E9E9E', color: 'white', border: 'none', borderRadius: '4px' }}>
                    キャンセル
                </button>
                <button onClick={handleSave} style={{ padding: '0.5rem 1rem', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}>
                    設定を保存
                </button>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------------
// SummaryView (勤務時間集計モードのサブコンポーネント)
// ----------------------------------------------------------------------

const SummaryView = ({ userMap, availableDates, onBackToCalendar }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filter, setFilter] = useState('monthly'); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); 
  const [selectedUser, setSelectedUser] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [isEditingPeriods, setIsEditingPeriods] = useState(false);

  const [timePeriods, setTimePeriods] = useState(() => ([
      { id: 1, key: 'period1', label: '午前時間', start: '00:00', end: '12:00' },
      { id: 2, key: 'period2', label: '午後時間', start: '12:00', end: '18:00' },
      { id: 3, key: 'period3', label: '夜間時間', start: '18:00', end: '00:00' },
  ]));

  useEffect(() => {
    fetchAllAttendanceRecords();
  }, []);

  const userList = useMemo(() => {
    const users = Object.entries(userMap).map(([manager_number, name]) => ({ manager_number: String(manager_number), name }));
    users.sort((a, b) => a.name.localeCompare(b.name));
    return [{ manager_number: '', name: '全従業員' }, ...users];
  }, [userMap]);

  const availableYears = useMemo(() => {
    const years = new Set(availableDates.map(d => new Date(d).getFullYear().toString()));
    const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
    
    const currentYear = new Date().getFullYear().toString();
    if (!years.has(currentYear)) {
        sortedYears.unshift(currentYear);
    }

    return sortedYears;
  }, [availableDates]);


  const filteredAvailablePeriods = useMemo(() => {
    const yearPrefix = selectedYear;

    if (filter === 'monthly') {
        const months = new Set();
        availableDates.forEach(d => {
            if (d.startsWith(yearPrefix)) {
                months.add(d.substring(0, 7));
            }
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    } else if (filter === 'daily') {
        const days = availableDates.filter(d => d.startsWith(yearPrefix));
        return days.sort((a, b) => b.localeCompare(a));
    }
    return [];
  }, [availableDates, selectedYear, filter]);


  useEffect(() => {
    if (filteredAvailablePeriods.length > 0) {
        setSelectedPeriod(filteredAvailablePeriods[0]);
    } else {
        setSelectedPeriod('');
    }
  }, [selectedYear, filter, filteredAvailablePeriods]);


  const fetchAllAttendanceRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .not('work_minutes', 'is', null) 
        .order('date', { ascending: false });

      if (error) {
        console.error('集計データ取得エラー:', error);
        alert('集計データの取得に失敗しました');
        return;
      }
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregatedData = useMemo(() => {
    let recordsToAggregate = attendanceRecords.filter(record => record.work_minutes > 0);

    recordsToAggregate = recordsToAggregate.filter(record => {
      const dateStr = record.date;
      
      if (filter === 'monthly') {
          return dateStr.startsWith(selectedPeriod);
      } else if (filter === 'daily') {
          return dateStr === selectedPeriod;
      }
      return false; 
    });

    if (selectedUser) {
        recordsToAggregate = recordsToAggregate.filter(record => 
            String(record.manager_number) === String(selectedUser)
        );
    }

    const calculatedTimePeriods = timePeriods.map(p => {
        const startMinutes = timeToMinutes(p.start);
        let endMinutes = timeToMinutes(p.end);
        
        if (endMinutes <= startMinutes) { 
             endMinutes += 24 * 60;
        }
        
        return {
            ...p,
            startMinutes: startMinutes,
            endMinutes: endMinutes
        };
    });


    const totals = {};
    
    recordsToAggregate.forEach(record => {
      const managerNumber = record.manager_number;
      
      if (!totals[managerNumber]) {
        totals[managerNumber] = { 
          manager_number: managerNumber,
          name: userMap[managerNumber] || `管理番号: ${managerNumber}`,
          totalMinutes: 0,
        };
        calculatedTimePeriods.forEach(p => {
            totals[managerNumber][p.key] = 0;
        });
      }
      
      totals[managerNumber].totalMinutes += record.work_minutes;

      calculatedTimePeriods.forEach(period => {
          const minutesInPeriod = calculateWorkMinutesInPeriod(
              record.actual_start,
              record.actual_end,
              record.break_minutes,
              period.startMinutes,
              period.endMinutes
          );
          totals[managerNumber][period.key] += minutesInPeriod;
      });
      
    });

    return Object.values(totals).sort((a, b) => b.totalMinutes - a.totalMinutes);

  }, [attendanceRecords, selectedPeriod, selectedUser, userMap, timePeriods, filter]);

  
  const renderPeriodSelector = () => {
    
    if (filteredAvailablePeriods.length === 0) {
        return <span style={{ padding: '0.5rem', color: '#999' }}>データがありません</span>;
    }

    return (
      <select 
        value={selectedPeriod} 
        onChange={(e) => setSelectedPeriod(e.target.value)} 
        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
      >
        {filteredAvailablePeriods.map(period => (
          <option key={period} value={period}>
            {filter === 'monthly' ? period.substring(5) + '月' : period}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="login-card" style={{ width: '1100px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        勤務時間集計
        <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '1rem' }}
        >
            {availableYears.map(year => (
                <option key={year} value={year}>{year}年度</option>
            ))}
        </select>
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>従業員選択:</label>
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            {userList.map(user => (
              <option key={user.manager_number} value={user.manager_number}>{user.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>期間単位:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="monthly">月別集計</option>
            <option value="daily">日別集計</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>対象期間:</label>
          {renderPeriodSelector()}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
             <button 
                onClick={() => setIsEditingPeriods(true)}
                style={{
                    backgroundColor: '#00BCD4',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                時間帯の編集
            </button>
        </div>
      </div>

      {isEditingPeriods && (
        <TimePeriodEditor 
            timePeriods={timePeriods} 
            setTimePeriods={setTimePeriods} 
            onClose={() => setIsEditingPeriods(false)} 
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
      ) : (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflowX: 'auto', 
          maxHeight: '400px'
        }}>
          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'left', minWidth: '150px' }}>名前</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'right', minWidth: '120px' }}>総勤務時間</th>
                {timePeriods.map(p => (
                    <th key={p.key} style={{ padding: '0.75rem', borderBottom: '1px solid #ddd', textAlign: 'right', minWidth: '150px' }}>
                        {p.label}
                    </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aggregatedData.length > 0 ? (
                aggregatedData.map((data, index) => (
                  <tr key={data.manager_number} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                      {data.name}
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatMinutes(data.totalMinutes)}
                    </td>
                    {timePeriods.map(p => (
                        <td key={p.key} style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                            {formatMinutes(data[p.key] || 0)}
                        </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2 + timePeriods.length} style={{ textAlign: 'center', padding: '1rem', color: '#666' }}>
                    選択した条件に一致するデータがありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button onClick={onBackToCalendar} style={{
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
  );
};


// ----------------------------------------------------------------------
// ManagerAttendance (メインコンポーネント)
// ----------------------------------------------------------------------
function ManagerAttendance({ onBack }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
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

  const fetchAttendanceData = async (date) => {
    if (!date) return;

    setLoading(true);
    try {
      const { data: finalShifts, error: shiftError } = await supabase
        .from('final_shifts')
        .select('*')
        .eq('date', date)
        .order('manager_number');

      if (shiftError) {
        console.error('シフトデータ取得エラー:', shiftError);
        alert('シフトデータの取得に失敗しました');
        setLoading(false);
        return;
      }

      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date);

      if (attendanceError) {
        console.error('勤怠データ取得エラー:', attendanceError);
      }

      const attendanceMap = {};
      if (existingAttendance) {
        existingAttendance.forEach(att => {
          attendanceMap[att.manager_number] = att;
        });
      }

      const data = finalShifts.map(shift => {
        const existing = attendanceMap[shift.manager_number];
        const isOff = shift.is_off || !shift.start_time || !shift.end_time ||
                      (shift.start_time === '00:00' && shift.end_time === '00:00');
        
        const trimTime = (time) => time ? time.substring(0, 5) : '';

        return {
          manager_number: shift.manager_number,
          name: userMap[shift.manager_number] || `管理番号: ${shift.manager_number}`,
          scheduled_start: trimTime(shift.start_time),
          scheduled_end: trimTime(shift.end_time),
          actual_start: existing?.actual_start ? trimTime(existing.actual_start) : trimTime(shift.start_time),
          actual_end: existing?.actual_end ? trimTime(existing.actual_end) : trimTime(shift.end_time),
          break_minutes: existing?.break_minutes || 0,
          store: shift.store || '',
          is_off: isOff,
          attendance_id: existing?.id || null
        };
      });

      const sortedData = data.sort((a, b) => {
        return a.is_off === b.is_off ? 0 : a.is_off ? 1 : -1;
      });

      setAttendanceData(sortedData);
      setCurrentView('attendance');
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (index, field, value) => {
    const cleanValue = value ? value.substring(0, 5) : '';
    
    const updated = [...attendanceData];
    updated[index][field] = (field === 'break_minutes') ? Number(value) : cleanValue;
    
    setAttendanceData(updated); 
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const record of attendanceData) {
        const workMinutes = calculateWorkMinutes(
            record.actual_start, 
            record.actual_end, 
            record.break_minutes
        );
        
        if (workMinutes === 0 && !record.actual_start && !record.actual_end) {
             continue;
        }

        const attendanceRecord = {
          date: selectedDate,
          manager_number: record.manager_number,
          actual_start: record.actual_start, 
          actual_end: record.actual_end,     
          break_minutes: record.break_minutes || 0,
          work_minutes: workMinutes, 
          store: record.store
        };

        if (record.attendance_id) {
          const { error } = await supabase
            .from('attendance')
            .update(attendanceRecord)
            .eq('id', record.attendance_id);

          if (error) {
            console.error('更新エラー:', error);
            alert(`${record.name} の更新に失敗しました`);
            setLoading(false);
            return;
          }
        } else if (workMinutes > 0 || (record.actual_start && record.actual_end)) {
          const { error } = await supabase
            .from('attendance')
            .insert([attendanceRecord]);

          if (error) {
            console.error('挿入エラー:', error);
            alert(`${record.name} の保存に失敗しました`);
            setLoading(false);
            return;
          }
        }
      }

      alert('保存しました');
      fetchAttendanceData(selectedDate); 
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    if (!availableDates.includes(date)) return;
    setSelectedDate(date);
    fetchAttendanceData(date);
  };

  const handleBackToCalendar = () => {
    setCurrentView('calendar');
    setSelectedDate('');
    setAttendanceData([]);
  };

  const changeDate = (delta) => {
    if (!selectedDate || availableDates.length === 0) return;
    const idx = availableDates.indexOf(selectedDate);
    const newIdx = idx + delta;
    if (newIdx >= 0 && newIdx < availableDates.length) {
      const newDate = availableDates[newIdx];
      setSelectedDate(newDate);
      fetchAttendanceData(newDate);
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

  const getWeekday = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const calendarDays = generateCalendarDays();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];


// ----------------------------------------------------------------------
// View Rendering
// ----------------------------------------------------------------------

  if (currentView === 'summary') {
    return (
      <div className="login-wrapper">
        <SummaryView 
          userMap={userMap} 
          availableDates={availableDates} 
          onBackToCalendar={handleBackToCalendar}
        />
      </div>
    );
  }

  if (currentView === 'calendar') {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>勤怠管理</h2>
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => setCurrentView('calendar')}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'not-allowed'
              }}
              disabled
            >
              退勤管理モード
            </button>
            <button
              onClick={() => setCurrentView('summary')}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              勤務時間集計モード
            </button>
          </div>

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
                >
                  {dayInfo.day}
                </button>
              ))}
            </div>
          </div>

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

  // Attendance View (日別勤怠入力)
  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ width: '900px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <button onClick={() => changeDate(-1)}>◀</button>
          {selectedDate} ({getWeekday(selectedDate)})
          <button onClick={() => changeDate(1)}>▶</button>
        </h2>
        <p style={{ textAlign: 'center', color: '#666' }}>
          モード: <strong>退勤管理</strong>
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>読み込み中...</div>
        ) : (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5' }}>
                <tr>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>名前</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>店舗</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>予定開始</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>予定終了</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>実際開始</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>実際終了</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>休憩(分)</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>労働時間</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((record, index) => {
                    const workMinutes = calculateWorkMinutes(
                        record.actual_start,
                        record.actual_end,
                        record.break_minutes
                    );
                    
                    const rowBackgroundColor = record.is_off 
                        ? '#f0f0f0' 
                        : (index % 2 === 0 ? 'white' : '#e8f5e9');
                        
                  return (
                    <tr key={index} style={{
                      backgroundColor: rowBackgroundColor
                    }}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                        {record.name}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        {record.store}店舗
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        {record.is_off ? <span style={{ color: '#999' }}>休み</span> : record.scheduled_start}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                        {record.is_off ? <span style={{ color: '#999' }}>休み</span> : record.scheduled_end}
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                        <input
                          type="time"
                          value={record.actual_start}
                          onChange={(e) => handleTimeChange(index, 'actual_start', e.target.value)}
                          style={{ width: '100px', padding: '0.25rem' }}
                          step="60" 
                        />
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                        <input
                          type="time"
                          value={record.actual_end}
                          onChange={(e) => handleTimeChange(index, 'actual_end', e.target.value)}
                          style={{ width: '100px', padding: '0.25rem' }}
                          step="60" 
                        />
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                        <input
                          type="number"
                          value={record.break_minutes}
                          onChange={(e) => handleTimeChange(index, 'break_minutes', e.target.value)}
                          style={{ width: '60px', padding: '0.25rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold' }}>
                        {workMinutes > 0 ? formatMinutes(workMinutes) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '保存中...' : '確定'}
          </button>
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

export default ManagerAttendance;