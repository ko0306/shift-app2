import React, { useState } from 'react';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchShiftData = async () => {
    if (!startDate || !endDate || startDate > endDate) {
      alert('正しい開始日と終了日を入力してください');
      return;
    }

    try {
      const allDates = [];
      const d = new Date(startDate);
      while (d <= new Date(endDate)) {
        allDates.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
      }

      const userMapTemp = { '001': '山田太郎', '002': '鈴木花子', '003': '佐藤次郎' };
      setDates(allDates);
      setUserMap(userMapTemp);
      setShiftData([]);
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
    if (row.isCustomStore) return row.store || '';
    return row.store;
  };

  const handleSave = async () => {
    try {
      for (const row of editRows) {
        if (!row.store || row.store.trim() === '') {
          alert(`${row.name}の店舗を選択または入力してください`);
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : '2rem', backgroundColor: '#f5f5f5' }}>
        <div style={{ backgroundColor: 'white', padding: isMobile ? '1.5rem' : '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginTop: 0, textAlign: 'center', fontSize: isMobile ? '1.3rem' : '1.5rem' }}>作成</h2>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem', textAlign: 'center' }}>
            シフト作成時に1年半前の古いデータは自動削除されます
          </p>
          
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>開始日:</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1rem' }}
          />
          
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>終了日:</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1.5rem' }}
          />
          
          <button 
            onClick={fetchShiftData}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1976D2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
          >
            次へ
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: isMobile ? '0.75rem' : '1rem', paddingBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: isMobile ? '0.75rem' : '1rem', maxWidth: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currentDateIndex > 0 && (
              <button 
                onClick={handlePreviousDay}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
              >
                前の日
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            {currentDateIndex < dates.length - 1 && (
              <button 
                onClick={handleNextDay}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.9rem' }}
              >
                次の日
              </button>
            )}
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <button 
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              style={{
                width: isMobile ? '100%' : 'auto',
                padding: isMobile ? '0.75rem' : '0.5rem 1rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold'
              }}
            >
              {selectedDate} のシフト入力 ▼
            </button>
            {showDateDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: isMobile ? 0 : 'auto',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '150px',
                maxHeight: '300px',
                overflowY: 'auto',
                marginTop: '0.5rem'
              }}>
                {dates.map((date, index) => (
                  <div
                    key={date}
                    onClick={() => handleDateSelect(index)}
                    style={{
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: index === currentDateIndex ? '#f0f0f0' : 'white',
                      borderBottom: index < dates.length - 1 ? '1px solid #eee' : 'none',
                      fontSize: '0.9rem'
                    }}
                  >
                    {date}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isMobile ? (
            // スマホ用：簡素表示（名前、店舗、休み、開始、終了のみ）
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {editRows.map((row, rowIndex) => (
                <div key={rowIndex} style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  backgroundColor: row.isOff ? '#f0f0f0' : '#fafafa'
                }}>
                  <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#333' }}>
                    {row.name}
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.2rem', fontWeight: '500' }}>店舗</label>
                    {row.isCustomStore ? (
                      <input
                        type="text"
                        value={row.store}
                        onChange={(e) => handleCustomStoreChange(rowIndex, e.target.value)}
                        placeholder="店舗名"
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          border: '2px solid #FF9800',
                          borderRadius: '4px',
                          boxSizing: 'border-box',
                          fontWeight: 'bold',
                          color: '#E65100',
                          fontSize: '0.8rem'
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => toggleStoreDropdown(rowIndex)}
                        style={{
                          padding: '0.4rem',
                          border: '2px solid #2196F3',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: 'white',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: '#1976D2',
                          fontSize: '0.8rem'
                        }}
                      >
                        {getStoreValue(row)}店舗 ▼
                      </div>
                    )}
                    {row.showStoreDropdown && (
                      <div style={{
                        marginTop: '0.2rem',
                        border: '2px solid #2196F3',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        {['A', 'B'].map(store => (
                          <div
                            key={store}
                            onClick={() => handleStoreChange(rowIndex, store)}
                            style={{
                              padding: '0.4rem',
                              borderBottom: '1px solid #eee',
                              cursor: 'pointer',
                              backgroundColor: row.store === store ? '#E3F2FD' : 'white',
                              fontSize: '0.75rem'
                            }}
                          >
                            {store}店舗
                          </div>
                        ))}
                        <div
                          onClick={() => handleStoreChange(rowIndex, 'その他')}
                          style={{
                            padding: '0.4rem',
                            cursor: 'pointer',
                            backgroundColor: row.isCustomStore ? '#E3F2FD' : 'white',
                            fontSize: '0.75rem'
                          }}
                        >
                          その他
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <input 
                      type="checkbox" 
                      checked={row.isOff}
                      onChange={e => handleCheckboxChange(rowIndex, e.target.checked)}
                      id={`off-${rowIndex}`}
                    />
                    <label htmlFor={`off-${rowIndex}`} style={{ fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer' }}>休み</label>
                  </div>

                  {!row.isOff && (
                    <>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.15rem', fontWeight: '500' }}>開始</label>
                        <input 
                          type="time" 
                          value={row.start} 
                          onChange={e => handleTimeChange(rowIndex, 'start', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#666', marginBottom: '0.15rem', fontWeight: '500' }}>終了</label>
                        <input 
                          type="time" 
                          value={row.end} 
                          onChange={e => handleTimeChange(rowIndex, 'end', e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // PC用：テーブル表示（タイムライン付き）
            <div style={{ overflowX: 'auto', marginBottom: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5' }}>
                  <tr>
                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '60px', position: 'sticky', left: 0, zIndex: 4, backgroundColor: '#f5f5f5' }}>名前</th>
                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '60px', position: 'sticky', left: '60px', zIndex: 4, backgroundColor: '#f5f5f5' }}>店舗</th>
                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '50px', position: 'sticky', left: '120px', zIndex: 4, backgroundColor: '#f5f5f5' }}>休み</th>
                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '65px', position: 'sticky', left: '170px', zIndex: 4, backgroundColor: '#f5f5f5' }}>開始</th>
                    <th style={{ padding: '0.4rem 0.3rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '65px', position: 'sticky', left: '235px', zIndex: 3, backgroundColor: '#f5f5f5' }}>終了</th>
                    {timeSlots.map((t, i) => (
                      <th key={i} style={{ padding: '0.4rem 0.2rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '28px', fontSize: '0.65rem' }}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editRows.map((row, rowIndex) => (
                    <tr key={rowIndex} style={{ backgroundColor: row.isOff ? '#e8e8e8' : (rowIndex % 2 === 0 ? 'white' : '#f9f9f9') }}>
                      <td style={{ padding: '0.4rem 0.3rem', borderBottom: '1px solid #eee', position: 'sticky', left: 0, zIndex: 2, backgroundColor: row.isOff ? '#e8e8e8' : (rowIndex % 2 === 0 ? 'white' : '#f9f9f9'), textAlign: 'center', fontSize: '0.7rem', fontWeight: '500' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '0.3rem 0.2rem', borderBottom: '1px solid #eee', textAlign: 'center', position: 'sticky', left: '60px', zIndex: 2, backgroundColor: row.isOff ? '#e8e8e8' : (rowIndex % 2 === 0 ? 'white' : '#f9f9f9') }}>
                        {row.isCustomStore ? (
                          <input
                            type="text"
                            value={row.store}
                            onChange={(e) => handleCustomStoreChange(rowIndex, e.target.value)}
                            placeholder="店舗"
                            style={{
                              padding: '0.2rem',
                              border: '1px solid #FF9800',
                              borderRadius: '3px',
                              width: '100%',
                              fontWeight: 'bold',
                              color: '#E65100',
                              fontSize: '0.65rem',
                              boxSizing: 'border-box'
                            }}
                          />
                        ) : (
                          <div
                            onClick={() => toggleStoreDropdown(rowIndex)}
                            style={{
                              padding: '0.2rem',
                              border: '1px solid #2196F3',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              color: '#1976D2',
                              fontSize: '0.65rem',
                              position: 'relative'
                            }}
                          >
                            {getStoreValue(row)}
                          </div>
                        )}
                        {row.showStoreDropdown && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            backgroundColor: 'white',
                            border: '1px solid #2196F3',
                            borderRadius: '3px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            minWidth: '80px',
                            marginTop: '1px'
                          }}>
                            {['A', 'B'].map(store => (
                              <div
                                key={store}
                                onClick={() => handleStoreChange(rowIndex, store)}
                                style={{
                                  padding: '0.3rem',
                                  borderBottom: '1px solid #eee',
                                  cursor: 'pointer',
                                  backgroundColor: row.store === store ? '#E3F2FD' : 'white',
                                  fontSize: '0.7rem'
                                }}
                              >
                                {store}
                              </div>
                            ))}
                            <div
                              onClick={() => handleStoreChange(rowIndex, 'その他')}
                              style={{
                                padding: '0.3rem',
                                cursor: 'pointer',
                                backgroundColor: row.isCustomStore ? '#E3F2FD' : 'white',
                                fontSize: '0.7rem'
                              }}
                            >
                              その他
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.4rem 0.3rem', borderBottom: '1px solid #eee', textAlign: 'center', position: 'sticky', left: '120px', zIndex: 2, backgroundColor: row.isOff ? '#e8e8e8' : (rowIndex % 2 === 0 ? 'white' : '#f9f9f9') }}>
                        <input 
                          type="checkbox" 
                          checked={row.isOff}
                          onChange={e => handleCheckboxChange(rowIndex, e.target.checked)}
                        />
                      </td>
                      <td style={{ padding: '0.3rem 0.2rem', borderBottom: '1px solid #eee', textAlign: 'center', position: 'sticky', left: '170px', zIndex: 2, backgroundColor: row.isOff ? '#e8e8e8' : (rowIndex % 2 === 0 ? 'white' : '#f9f9f9') }}>
                        <input 
                          type="time" 
                          value={row.start} 
                          onChange={e => handleTimeChange(rowIndex, 'start', e.target.value)}
                          disabled={row.isOff}
                          style={{ width: '100%', padding: '0.2rem', boxSizing: 'border-box', borderRadius: '3px', border: '1px solid #ddd', fontSize: '0.65rem' }}
                        />
                      </td>
                      <td style={{ padding: '0.3rem 0.2rem', borderBottom: '1px solid #eee', textAlign: 'center', position: 'sticky', left: '235px', zIndex: 2, backgroundColor: row.isOff ? '#e8e8e8' : (rowIndex % 2 === 0 ? 'white' : '#f9f9f9') }}>
                        <input 
                          type="time" 
                          value={row.end} 
                          onChange={e => handleTimeChange(rowIndex, 'end', e.target.value)}
                          disabled={row.isOff}
                          style={{ width: '100%', padding: '0.2rem', boxSizing: 'border-box', borderRadius: '3px', border: '1px solid #ddd', fontSize: '0.65rem' }}
                        />
                      </td>
                      {timeSlots.map((slot, colIndex) => {
                        let bgColor = 'transparent';
                        if (row.isOff) bgColor = '#d0d0d0';
                        return <td key={colIndex} style={{ borderBottom: '1px solid #eee', backgroundColor: bgColor, minWidth: '28px', padding: '0.3rem 0.2rem' }} />;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button 
              onClick={handleSaveAndExit}
              style={{
                padding: isMobile ? '0.6rem 2rem' : '0.5rem 1.5rem',
                fontSize: isMobile ? '0.9rem' : '0.85rem',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: isMobile ? '100%' : 'auto',
                maxWidth: isMobile ? '100%' : '300px'
              }}
            >
              確定
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: isMobile ? '1rem' : '1.5rem', backgroundColor: '#f5f5f5' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: isMobile ? '1rem' : '1.5rem', maxWidth: '100%', margin: '0 auto' }}>
        <h2 style={{ marginTop: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', textAlign: 'center' }}>シフト表</h2>
        <div style={{ overflowX: 'auto', maxHeight: isMobile ? '60vh' : '70vh', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: isMobile ? '0.5rem' : '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '100px', position: 'sticky', left: 0, zIndex: 3, backgroundColor: '#f5f5f5' }}>名前</th>
                {dates.map(date => (
                  <th key={date} style={{ padding: isMobile ? '0.5rem' : '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontWeight: '600', minWidth: '80px', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                    {isMobile ? date.slice(5) : date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedByUser).map(([name, shifts]) => (
                <tr key={name}>
                  <td style={{ padding: isMobile ? '0.5rem' : '0.75rem', borderBottom: '1px solid #eee', position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'white', fontWeight: '500' }}>
                    {isMobile ? name.slice(0, 3) : name}
                  </td>
                  {dates.map(date => (
                    <td key={date} style={{ padding: isMobile ? '0.5rem' : '0.75rem', borderBottom: '1px solid #eee', textAlign: 'center', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                      {shifts[date] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button 
            onClick={() => handleEditStart(0)}
            style={{
              padding: isMobile ? '0.6rem 2rem' : '0.5rem 1.5rem',
              fontSize: isMobile ? '0.9rem' : '0.9rem',
              backgroundColor: '#1976D2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? '100%' : '300px'
            }}
          >
            
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManagerCreate;