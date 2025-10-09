import React, { useState } from 'react';
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
        .lte('date', endDate);

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

      const filteredShifts = shifts.filter(shift => userManagerNumbers.has(String(shift.manager_number)));

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
    for (let h = 0; h < 24; h++) {
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
      .filter(shift => shift.date === date && !(shift.start_time === '00:00' && shift.end_time === '00:00'))
      .map(shift => ({
        id: shift.id,
        name: userMap[shift.manager_number],
        manager_number: shift.manager_number,
        start: '00:00',
        end: '00:00',
        originalStart: shift.start_time,
        originalEnd: shift.end_time,
        isOff: false,
        store: 'A',
        isCustomStore: false,
        showStoreDropdown: false
      }));
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
      updated[index].start = '00:00';
      updated[index].end = '00:00';
    }
    setEditRows(updated);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...editRows];
    updated[index][field] = value;
    setEditRows(updated);
  };

  const handleStoreChange = (index, value) => {
    const updated = [...editRows];
    if (value === 'その他') {
      updated[index].isCustomStore = true;
      updated[index].store = '';
    } else {
      updated[index].isCustomStore = false;
      updated[index].store = value;
    }
    updated[index].showStoreDropdown = false;
    setEditRows(updated);
  };

  const handleCustomStoreChange = (index, value) => {
    const updated = [...editRows];
    updated[index].store = value;
    setEditRows(updated);
  };

  const toggleStoreDropdown = (index) => {
    const updated = [...editRows];
    updated[index].showStoreDropdown = !updated[index].showStoreDropdown;
    setEditRows(updated);
  };

  const getStoreValue = (row) => {
    if (row.isCustomStore) {
      return row.store || '';
    }
    return row.store;
  };

  const handleSave = async () => {
    try {
      for (const row of editRows) {
        const storeValue = row.store;
        
        if (!storeValue || storeValue.trim() === '') {
          alert(`${row.name}の店舗を選択または入力してください`);
          return false;
        }

        const updateData = {
          date: selectedDate,
          manager_number: row.manager_number,
          start_time: row.isOff ? null : row.start,
          end_time: row.isOff ? null : row.end,
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
      <div className="login-wrapper">
        <div className="login-card">
          <h2>シフト作成</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            シフト作成時に1年半前の古いデータは自動削除されます
          </p>
          <label>開始日:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>終了日:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <div style={{ marginTop: '1rem' }}>
            <button onClick={fetchShiftData}>次へ</button>
          </div>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="fullscreen-table">
        <div className="login-card" style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div style={{ position: 'absolute', top: '1rem', width: 'calc(100% - 4rem)', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
            {currentDateIndex > 0 && (
              <button onClick={handlePreviousDay} className="nav-button-small">
                前の日
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            {currentDateIndex < dates.length - 1 && (
              <button onClick={handleNextDay} className="nav-button-small">
                次の日
              </button>
            )}
          </div>

          <div style={{ position: 'relative', display: 'inline-block', marginTop: '3rem' }}>
            <h2 
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              style={{ cursor: 'pointer', userSelect: 'none', display: 'inline-block' }}
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
          
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="shift-edit-table">
              <thead>
                <tr>
                  <th className="name-header" style={{ minWidth: '100px', position: 'sticky', left: 0, zIndex: 3 }}>名前</th>
                  <th className="store-header" style={{ minWidth: '140px', position: 'sticky', left: '100px', zIndex: 3 }}>店舗</th>
                  <th className="checkbox-header" style={{ minWidth: '60px', position: 'sticky', left: '240px', zIndex: 3 }}>休み</th>
                  <th className="start-header" style={{ minWidth: '120px', position: 'sticky', left: '300px', zIndex: 3 }}>開始</th>
                  <th className="end-header" style={{ minWidth: '120px', position: 'sticky', left: '420px', zIndex: 3 }}>終了</th>
                  {timeSlots.map((t, i) => (
                    <th key={i} className="time-header" style={{ minWidth: '30px' }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {editRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={row.isOff ? 'off-row' : ''}>
                    <td className="name-cell" style={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'white', minWidth: '100px' }}>{row.name}</td>
                    <td className="store-cell" style={{ position: 'sticky', left: '100px', zIndex: 2, backgroundColor: 'white', minWidth: '140px' }}>
                      {row.isCustomStore ? (
                        <input
                          type="text"
                          value={row.store}
                          onChange={(e) => handleCustomStoreChange(rowIndex, e.target.value)}
                          placeholder="店舗名を入力"
                          style={{
                            padding: '0.5rem',
                            border: '2px solid #FF9800',
                            borderRadius: '4px',
                            width: '100%',
                            boxSizing: 'border-box',
                            fontWeight: 'bold',
                            color: '#E65100',
                            textAlign: 'center'
                          }}
                          onFocus={(e) => {
                            const updated = [...editRows];
                            updated[rowIndex].showStoreDropdown = false;
                            setEditRows(updated);
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => toggleStoreDropdown(rowIndex)}
                          style={{
                            padding: '0.5rem',
                            border: '2px solid #2196F3',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                            minWidth: '100px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: '#1976D2',
                            position: 'relative'
                          }}
                        >
                          {getStoreValue(row)}店舗 ▼
                        </div>
                      )}
                      {row.showStoreDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          backgroundColor: 'white',
                          border: '2px solid #2196F3',
                          borderRadius: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 1000,
                          minWidth: '150px',
                          marginTop: '4px'
                        }}>
                          <div
                            onClick={() => handleStoreChange(rowIndex, 'A')}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              backgroundColor: row.store === 'A' ? '#E3F2FD' : 'white'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseOut={(e) => e.target.style.backgroundColor = row.store === 'A' ? '#E3F2FD' : 'white'}
                          >
                            A店舗
                          </div>
                          <div
                            onClick={() => handleStoreChange(rowIndex, 'B')}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              backgroundColor: row.store === 'B' ? '#E3F2FD' : 'white'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseOut={(e) => e.target.style.backgroundColor = row.store === 'B' ? '#E3F2FD' : 'white'}
                          >
                            B店舗
                          </div>
                          <div
                            onClick={() => handleStoreChange(rowIndex, 'その他')}
                            style={{
                              padding: '0.75rem',
                              cursor: 'pointer',
                              backgroundColor: row.isCustomStore ? '#E3F2FD' : 'white'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseOut={(e) => e.target.style.backgroundColor = row.isCustomStore ? '#E3F2FD' : 'white'}
                          >
                            その他
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="checkbox-cell" style={{ position: 'sticky', left: '240px', zIndex: 2, backgroundColor: 'white', minWidth: '60px' }}>
                      <input 
                        type="checkbox" 
                        checked={row.isOff}
                        onChange={e => handleCheckboxChange(rowIndex, e.target.checked)}
                      />
                    </td>
                    <td className="start-cell" style={{ position: 'sticky', left: '300px', zIndex: 2, backgroundColor: 'white', minWidth: '120px' }}>
                      <input 
                        type="time" 
                        value={row.start} 
                        onChange={e => handleTimeChange(rowIndex, 'start', e.target.value)}
                        disabled={row.isOff}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td className="end-cell" style={{ position: 'sticky', left: '420px', zIndex: 2, backgroundColor: 'white', minWidth: '120px' }}>
                      <input 
                        type="time" 
                        value={row.end} 
                        onChange={e => handleTimeChange(rowIndex, 'end', e.target.value)}
                        disabled={row.isOff}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                    {timeSlots.map((slot, colIndex) => {
                      const inRequest = slot >= row.originalStart && slot < row.originalEnd;
                      const inFinal = slot >= row.start && slot < row.end;
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
                      
                      return <td key={colIndex} className="time-cell" style={{ backgroundColor: bgColor, minWidth: '30px' }} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button onClick={handleSaveAndExit} className="save-button-small">
              確定
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-table">
      <div className="login-card">
        <h2>シフト表</h2>
        <div className="shift-table-wrapper">
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
        <div style={{ marginTop: '1rem' }}>
          <button onClick={() => handleEditStart(0)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}>
            作成
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManagerCreate;