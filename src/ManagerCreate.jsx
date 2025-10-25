import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function ManagerCreate() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shiftData, setShiftData] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [dates, setDates] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editRows, setEditRows] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      console.log('Orientation check:', { width: window.innerWidth, height: window.innerHeight, portrait });
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: '', min: '' };
    const parts = timeStr.split(':');
    return { 
      hour: parts[0] ? parseInt(parts[0], 10).toString() : '', 
      min: parts[1] ? parseInt(parts[1], 10).toString() : '' 
    };
  };

  const fetchShiftData = async () => {
    if (!startDate || !endDate || startDate > endDate) {
      alert('正しい開始日と終了日を入力してください');
      return;
    }

    try {
      const oneAndHalfYearsAgo = new Date(startDate);
      oneAndHalfYearsAgo.setMonth(oneAndHalfYearsAgo.getMonth() - 18);
      const oneAndHalfYearsAgoStr = oneAndHalfYearsAgo.toISOString().split('T')[0];

      const { error: deleteShiftsError } = await supabase
        .from('shifts')
        .delete()
        .lt('date', oneAndHalfYearsAgoStr);

      if (deleteShiftsError) {
        console.error('古いshiftsデータ削除エラー:', deleteShiftsError);
      }

      const { error: deleteFinalShiftsError } = await supabase
        .from('final_shifts')
        .delete()
        .lt('date', oneAndHalfYearsAgoStr);

      if (deleteFinalShiftsError) {
        console.error('古いfinal_shiftsデータ削除エラー:', deleteFinalShiftsError);
      }

      const { data: shifts, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: false });

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*');

      if (shiftError || userError) {
        console.error(shiftError || userError);
        alert('データ取得に失敗しました');
        return;
      }

      const userManagerNumbers = new Set(users.map(user => String(user.manager_number)));
      const userMapTemp = {};
      users.forEach(user => {
        userMapTemp[String(user.manager_number)] = user.name;
      });

      const latestShiftsMap = {};
      shifts.forEach(shift => {
        const key = `${shift.date}_${shift.manager_number}`;
        if (!latestShiftsMap[key]) {
          latestShiftsMap[key] = shift;
        }
      });

      const filteredShifts = Object.values(latestShiftsMap).filter(shift => 
        userManagerNumbers.has(String(shift.manager_number))
      );

      const allDates = [];
      const d = new Date(startDate);
      while (d <= new Date(endDate)) {
        allDates.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }

      setDates(allDates);
      setUserMap(userMapTemp);
      setShiftData(filteredShifts);
      setShowTable(true);

    } catch (error) {
      console.error('データ処理エラー:', error);
      alert('データ処理中にエラーが発生しました');
    }
  };

  const groupedByUser = {};
  shiftData.forEach(shift => {
    const name = userMap[String(shift.manager_number)] || '(不明)';
    if (!groupedByUser[name]) groupedByUser[name] = {};
    groupedByUser[name][shift.date] = `${shift.start_time || ''} ~ ${shift.end_time || ''}`;
  });

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

  const handleEditStart = (dateIndex = 0) => {
    const date = dates[dateIndex];
    setSelectedDate(date);
    setCurrentDateIndex(dateIndex);
    const rows = shiftData
      .filter(shift => shift.date === date && !(shift.start_time === '00:00:00' && shift.end_time === '00:00:00'))
      .map(shift => {
        const startTime = parseTime(shift.start_time);
        const endTime = parseTime(shift.end_time);
        return {
          id: shift.id,
          name: userMap[shift.manager_number],
          manager_number: shift.manager_number,
          startHour: '0',
          startMin: '0',
          endHour: '0',
          endMin: '0',
          originalStart: shift.start_time,
          originalEnd: shift.end_time,
          originalStartHour: startTime.hour,
          originalStartMin: startTime.min,
          originalEndHour: endTime.hour,
          originalEndMin: endTime.min,
          isOff: false,
          store: 'A',
          isEditingStore: false,
          remarks: shift.remarks || ''
        };
      });
    setEditRows(rows);
    setIsEditing(true);
  };

  const handleDateSelect = (dateIndex) => {
    setCurrentDateIndex(dateIndex);
    handleEditStart(dateIndex);
    setShowDateDropdown(false);
  };

  const handleCheckboxChange = (index, checked) => {
    const updated = [...editRows];
    updated[index].isOff = checked;
    if (checked) {
      updated[index].startHour = '0';
      updated[index].startMin = '0';
      updated[index].endHour = '0';
      updated[index].endMin = '0';
    }
    setEditRows(updated);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...editRows];
    updated[index][field] = value;
    setEditRows(updated);
  };

  const toggleStoreEdit = (index) => {
    const updated = [...editRows];
    updated[index].isEditingStore = !updated[index].isEditingStore;
    setEditRows(updated);
  };

  const handleStoreInputChange = (index, value) => {
    const updated = [...editRows];
    updated[index].store = value;
    setEditRows(updated);
  };

  const handleSave = async () => {
    try {
      for (const row of editRows) {
        const storeValue = row.store;
        
        if (!storeValue || storeValue.trim() === '') {
          alert(`${row.name}の店舗を選択または入力してください`);
          return false;
        }

        const startTime = row.isOff 
          ? null 
          : `${String(row.startHour).padStart(2, '0')}:${String(row.startMin).padStart(2, '0')}:00`;
        const endTime = row.isOff 
          ? null 
          : `${String(row.endHour).padStart(2, '0')}:${String(row.endMin).padStart(2, '0')}:00`;

        const updateData = {
          date: selectedDate,
          manager_number: row.manager_number,
          start_time: startTime,
          end_time: endTime,
          is_off: row.isOff,
          store: storeValue
        };

        const { error } = await supabase
          .from('final_shifts')
          .upsert(updateData, {
            onConflict: 'date,manager_number'
          });

        if (error) {
          console.error(`${row.name} の保存エラー:`, error);
          alert(`${row.name} の保存に失敗しました: ${error.message}`);
          return false;
        }
      }

      return true;
      
    } catch (error) {
      console.error('予期しないエラー:', error);
      alert(`エラーが発生しました: ${error.message}`);
      return false;
    }
  };

  const handlePreviousDay = async () => {
    if (currentDateIndex > 0) {
      const saveSuccess = await handleSave();
      if (saveSuccess) {
        handleEditStart(currentDateIndex - 1);
      }
    }
  };

  const handleNextDay = async () => {
    if (currentDateIndex < dates.length - 1) {
      const saveSuccess = await handleSave();
      if (saveSuccess) {
        handleEditStart(currentDateIndex + 1);
      }
    }
  };

  const handleSaveAndExit = async () => {
    const saveSuccess = await handleSave();
    if (saveSuccess) {
      alert('保存しました');
      setIsEditing(false);
      fetchShiftData();
    }
  };

  const timeSlots = generateTimeSlots();

  if (!showTable) {
    return (
      <div className="login-wrapper" style={{ padding: '1rem', boxSizing: 'border-box' }}>
        <div className="login-card" style={{ maxWidth: '500px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          <h2>シフト作成</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            シフト作成時に1年半前の古いデータは自動削除されます
          </p>
          <label>開始日:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          <label>終了日:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          <div style={{ marginTop: '1rem' }}>
            <button onClick={fetchShiftData}>次へ</button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="fullscreen-table" style={{ padding: '0.5rem', boxSizing: 'border-box', overflow: 'hidden' }}>
        {isPortrait && (
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
            <p style={{ fontSize: '1rem', color: '#ccc' }}>シフト編集画面は横向きでの使用を推奨します</p>
            <style>{`
              @keyframes rotate {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(90deg); }
              }
            `}</style>
          </div>
        )}
        <div className="login-card" style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', padding: '1rem' }}>
          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', right: '0.5rem', display: 'flex', justifyContent: 'space-between', zIndex: 10, gap: '0.5rem' }}>
            {currentDateIndex > 0 ? (
              <button onClick={handlePreviousDay} className="nav-button-small" style={{ flex: '0 0 auto', minWidth: '60px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', marginLeft: '3rem' }}>
                前の日
              </button>
            ) : (
              <div style={{ flex: '0 0 auto', minWidth: '60px', marginLeft: '3rem' }}></div>
            )}
            <div style={{ flex: 1 }}></div>
            {currentDateIndex < dates.length - 1 && (
              <button onClick={handleNextDay} className="nav-button-small" style={{ flex: '0 0 auto', minWidth: '60px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
                次の日
              </button>
            )}
          </div>

          <div style={{ position: 'relative', display: 'inline-block', marginTop: '3rem', maxWidth: '100%' }}>
            <h2 
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-block', fontSize: 'clamp(1rem, 4vw, 1.5rem)', margin: 0 }}
            >
              {selectedDate} のシフト入力 ▼
            </h2>
            {showDateDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {dates.map((date, index) => (
                  <div
                    key={date}
                    onClick={() => handleDateSelect(index)}
                    style={{
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: index === currentDateIndex ? '#f0f0f0' : 'white',
                      borderBottom: index < dates.length - 1 ? '1px solid #eee' : 'none'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseOut={(e) => e.target.style.backgroundColor = index === currentDateIndex ? '#f0f0f0' : 'white'}
                  >
                    {date}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ overflowX: 'auto', overflowY: 'auto', marginTop: '1rem', width: '100%', position: 'relative', maxHeight: 'calc(100vh - 180px)', WebkitOverflowScrolling: 'touch' }}>
            <table className="shift-edit-table" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '35px', width: '35px', position: 'sticky', left: 0, zIndex: 3, backgroundColor: '#FFB6C1', border: '1px solid #ddd', color: 'black', fontSize: '0.65rem', padding: '0.1rem' }}>名前</th>
                  <th style={{ minWidth: '30px', width: '30px', position: 'sticky', left: '35px', zIndex: 3, backgroundColor: '#ADD8E6', border: '1px solid #ddd', color: 'black', fontSize: '0.65rem', padding: '0.1rem' }}>店舗</th>
                  <th style={{ minWidth: '60px', width: '60px', position: 'sticky', left: '65px', zIndex: 3, backgroundColor: '#FFDAB9', border: '1px solid #ddd', color: 'black', fontSize: '0.65rem', padding: '0.1rem' }}>備考</th>
                  <th style={{ minWidth: '25px', width: '25px', position: 'sticky', left: '125px', zIndex: 3, backgroundColor: '#E6E6FA', border: '1px solid #ddd', color: 'black', fontSize: '0.65rem', padding: '0.1rem' }}>休</th>
                  <th style={{ minWidth: '85px', width: '85px', position: 'sticky', left: '150px', zIndex: 3, backgroundColor: '#98FB98', border: '1px solid #ddd', color: 'black', fontSize: '0.65rem', padding: '0.1rem' }}>開始</th>
                  <th style={{ minWidth: '85px', width: '85px', position: 'sticky', left: '235px', zIndex: 3, backgroundColor: '#FFE4B5', border: '1px solid #ddd', color: 'black', fontSize: '0.65rem', padding: '0.1rem' }}>終了</th>
                  {timeSlots.map((t, i) => (
                    <th key={i} style={{ minWidth: '28px', width: '28px', backgroundColor: '#F0E68C', border: '1px solid #ddd', color: 'black', fontSize: '0.7rem', padding: '0.1rem' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editRows.map((row, rowIndex) => {
                  const originalStartStr = row.originalStartHour && row.originalStartMin 
                    ? `${String(row.originalStartHour).padStart(2, '0')}:${String(row.originalStartMin).padStart(2, '0')}` 
                    : '00:00';
                  const originalEndStr = row.originalEndHour && row.originalEndMin 
                    ? `${String(row.originalEndHour).padStart(2, '0')}:${String(row.originalEndMin).padStart(2, '0')}` 
                    : '00:00';
                  const finalStartStr = `${String(row.startHour).padStart(2, '0')}:${String(row.startMin).padStart(2, '0')}`;
                  const finalEndStr = `${String(row.endHour).padStart(2, '0')}:${String(row.endMin).padStart(2, '0')}`;

                  return (
                    <tr key={rowIndex} className={row.isOff ? 'off-row' : ''}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'white', minWidth: '35px', width: '35px', padding: '0.1rem', border: '1px solid #ddd', fontSize: '0.65rem' }}>{row.name}</td>
                      <td style={{ position: 'sticky', left: '35px', zIndex: 2, backgroundColor: 'white', minWidth: '30px', width: '30px', padding: '0.1rem', border: '1px solid #ddd' }}>
                        {row.isEditingStore ? (
                          <input
                            type="text"
                            value={row.store}
                            onChange={(e) => handleStoreInputChange(rowIndex, e.target.value)}
                            onBlur={() => toggleStoreEdit(rowIndex)}
                            autoFocus
                            placeholder="店舗"
                            style={{
                              padding: '0.05rem',
                              border: '1px solid #2196F3',
                              borderRadius: '2px',
                              width: '100%',
                              boxSizing: 'border-box',
                              fontSize: '0.65rem'
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => toggleStoreEdit(rowIndex)}
                            style={{
                              padding: '0.05rem',
                              cursor: 'pointer',
                              backgroundColor: 'white',
                              textAlign: 'center',
                              fontSize: '0.65rem',
                              minHeight: '16px'
                            }}
                          >
                            {row.store || 'A'}
                          </div>
                        )}
                      </td>
                      <td style={{ position: 'sticky', left: '65px', zIndex: 2, backgroundColor: 'white', minWidth: '60px', width: '60px', padding: '0.1rem', fontSize: '0.6rem', color: '#666', border: '1px solid #ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.remarks || ''}
                      </td>
                      <td style={{ position: 'sticky', left: '125px', zIndex: 2, backgroundColor: 'white', minWidth: '25px', width: '25px', padding: '0.1rem', border: '1px solid #ddd', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={row.isOff}
                          onChange={e => handleCheckboxChange(rowIndex, e.target.checked)}
                        />
                      </td>
                      <td style={{ position: 'sticky', left: '150px', zIndex: 2, backgroundColor: 'white', minWidth: '85px', width: '85px', padding: '0.1rem', border: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
                          <select
                            value={row.startHour}
                            onChange={e => handleTimeChange(rowIndex, 'startHour', e.target.value)}
                            disabled={row.isOff}
                            style={{ flex: 1, fontSize: '0.65rem', padding: '0.05rem' }}
                          >
                            {[...Array(37)].map((_, h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.65rem' }}>:</span>
                          <select
                            value={row.startMin}
                            onChange={e => handleTimeChange(rowIndex, 'startMin', e.target.value)}
                            disabled={row.isOff}
                            style={{ flex: 1, fontSize: '0.65rem', padding: '0.05rem' }}
                          >
                            {[...Array(60)].map((_, m) => (
                              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td style={{ position: 'sticky', left: '235px', zIndex: 2, backgroundColor: 'white', minWidth: '85px', width: '85px', padding: '0.1rem', border: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
                          <select
                            value={row.endHour}
                            onChange={e => handleTimeChange(rowIndex, 'endHour', e.target.value)}
                            disabled={row.isOff}
                            style={{ flex: 1, fontSize: '0.65rem', padding: '0.05rem' }}
                          >
                            {[...Array(37)].map((_, h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span style={{ fontSize: '0.65rem' }}>:</span>
                          <select
                            value={row.endMin}
                            onChange={e => handleTimeChange(rowIndex, 'endMin', e.target.value)}
                            disabled={row.isOff}
                            style={{ flex: 1, fontSize: '0.65rem', padding: '0.05rem' }}
                          >
                            {[...Array(60)].map((_, m) => (
                              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      {timeSlots.map((slot, colIndex) => {
                        const inRequest = slot >= originalStartStr && slot < originalEndStr;
                        const inFinal = slot >= finalStartStr && slot < finalEndStr;
                        let bgColor = 'transparent';
                        
                        if (row.isOff) {
                          bgColor = '#e0e0e0';
                        } else {
                          if (inRequest) {
                            bgColor = '#ffff99';
                          }
                          
                          if (inFinal) {
                            if (inRequest) {
                              bgColor = '#90EE90';
                            } else {
                              bgColor = '#ff9999';
                            }
                          }
                        }
                        
                        return <td key={colIndex} style={{ backgroundColor: bgColor, minWidth: '28px', width: '28px', border: '1px solid #ddd' }} />;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '1rem', textAlign: 'center', paddingBottom: '1rem' }}>
            <button onClick={handleSaveAndExit} className="save-button-small" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
              確定
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-table" style={{ padding: '0.5rem', boxSizing: 'border-box' }}>
      <div className="login-card" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)' }}>シフト表</h2>
        <div className="shift-table-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', WebkitOverflowScrolling: 'touch' }}>
          <table className="shift-table">
            <thead>
              <tr>
                <th>名前</th>
                {dates.map(date => (
                  <th key={date}>{date}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedByUser).map(([name, shifts]) => (
                <tr key={name}>
                  <td>{name}</td>
                  {dates.map(date => (
                    <td key={date}>{shifts[date] || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button onClick={() => handleEditStart(0)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto', minWidth: '100px' }}>
            作成
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManagerCreate;