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

// ヘルプコンテンツ
const getHelpContent = (page) => {
  const contents = {
    shiftCreate: (
      <div>
        <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>シフト作成の使い方</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f5f5f5'/%3E%3Crect x='50' y='40' width='300' height='220' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Ctext x='200' y='75' text-anchor='middle' font-size='18' font-weight='bold'%3Eシフト作成%3C/text%3E%3Ctext x='70' y='100' font-size='12'%3E開始日:%3C/text%3E%3Crect x='70' y='110' width='260' height='30' rx='5' fill='%23e3f2fd' stroke='%231976D2'/%3E%3Ctext x='85' y='131' font-size='12' fill='%23666'%3E2025-01-15%3C/text%3E%3Ctext x='70' y='155' font-size='12'%3E終了日:%3C/text%3E%3Crect x='70' y='165' width='260' height='30' rx='5' fill='%23e3f2fd' stroke='%231976D2'/%3E%3Ctext x='85' y='186' font-size='12' fill='%23666'%3E2025-01-31%3C/text%3E%3Crect x='130' y='215' width='140' height='30' rx='6' fill='%231976D2'/%3E%3Ctext x='200' y='236' text-anchor='middle' font-size='14' fill='white'%3E次へ%3C/text%3E%3C/svg%3E" alt="シフト作成" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
        </div>
        <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>基本的な流れ：</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>開始日と終了日を選択</strong>してシフト期間を指定</li>
          <li><strong>次へ</strong>をクリックしてシフト表を表示</li>
          <li><strong>作成</strong>ボタンでシフト編集画面に移動</li>
        </ol>
        <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <strong>💡 ポイント：</strong> シフト作成時に1年半前の古いデータは自動的に削除されます
        </div>
      </div>
    ),
    shiftEdit: (
      <div>
        <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>シフト編集画面の使い方</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f5f5f5'/%3E%3Crect x='20' y='20' width='360' height='360' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Ctext x='200' y='50' text-anchor='middle' font-size='16' font-weight='bold'%3E2025-01-15（水）のシフト入力%3C/text%3E%3Crect x='40' y='70' width='320' height='250' rx='8' fill='%23f9f9f9' stroke='%23ddd'/%3E%3Crect x='50' y='80' width='50' height='25' rx='4' fill='%23FFB6C1'/%3E%3Ctext x='75' y='97' text-anchor='middle' font-size='10' fill='black'%3E名前%3C/text%3E%3Crect x='105' y='80' width='40' height='25' rx='4' fill='%23ADD8E6'/%3E%3Ctext x='125' y='97' text-anchor='middle' font-size='10' fill='black'%3E店舗%3C/text%3E%3Crect x='150' y='80' width='40' height='25' rx='4' fill='%23E6E6FA'/%3E%3Ctext x='170' y='97' text-anchor='middle' font-size='10' fill='black'%3E休%3C/text%3E%3Crect x='195' y='80' width='70' height='25' rx='4' fill='%2398FB98'/%3E%3Ctext x='230' y='97' text-anchor='middle' font-size='10' fill='black'%3E開始%3C/text%3E%3Crect x='270' y='80' width='70' height='25' rx='4' fill='%23FFE4B5'/%3E%3Ctext x='305' y='97' text-anchor='middle' font-size='10' fill='black'%3E終了%3C/text%3E%3Crect x='50' y='110' width='50' height='20' rx='3' fill='white' stroke='%23ddd'/%3E%3Ctext x='75' y='124' text-anchor='middle' font-size='9'%3E田中%3C/text%3E%3Crect x='105' y='110' width='40' height='20' rx='3' fill='white' stroke='%23ddd'/%3E%3Ctext x='125' y='124' text-anchor='middle' font-size='9'%3EA%3C/text%3E%3Crect x='195' y='110' width='70' height='20' rx='3' fill='white' stroke='%23ddd'/%3E%3Ctext x='230' y='124' text-anchor='middle' font-size='9'%3E9:00%3C/text%3E%3Crect x='270' y='110' width='70' height='20' rx='3' fill='white' stroke='%23ddd'/%3E%3Ctext x='305' y='124' text-anchor='middle' font-size='9'%3E17:00%3C/text%3E%3Crect x='130' y='340' width='140' height='30' rx='6' fill='%231976D2'/%3E%3Ctext x='200' y='361' text-anchor='middle' font-size='14' fill='white'%3E確定%3C/text%3E%3C/svg%3E" alt="シフト編集" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
        </div>
        <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>各列の説明：</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong style={{color: '#FFB6C1'}}>名前</strong>：スタッフの名前</li>
          <li><strong style={{color: '#ADD8E6'}}>店舗</strong>：勤務店舗（A、Bなど）をクリックして編集</li>
          <li><strong style={{color: '#FFDAB9'}}>備考</strong>：スタッフが入力した備考を表示</li>
          <li><strong style={{color: '#E6E6FA'}}>休</strong>：休みの場合にチェック</li>
          <li><strong style={{color: '#98FB98'}}>開始</strong>：勤務開始時刻を選択</li>
          <li><strong style={{color: '#FFE4B5'}}>終了</strong>：勤務終了時刻を選択</li>
          <li><strong style={{color: '#F0E68C'}}>タイムライン</strong>：横のセルで時間帯を視覚的に確認</li>
        </ul>
        <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>色の意味：</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li><span style={{backgroundColor: '#ffff99', padding: '0.2rem 0.5rem', borderRadius: '3px'}}>黄色</span>：スタッフの希望時間</li>
          <li><span style={{backgroundColor: '#90EE90', padding: '0.2rem 0.5rem', borderRadius: '3px'}}>緑色</span>：確定シフト（希望と一致）</li>
          <li><span style={{backgroundColor: '#ff9999', padding: '0.2rem 0.5rem', borderRadius: '3px'}}>赤色</span>：確定シフト（希望外）</li>
          <li><span style={{backgroundColor: '#e0e0e0', padding: '0.2rem 0.5rem', borderRadius: '3px'}}>灰色</span>：休み</li>
        </ul>
        <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>操作方法：</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li>日付をクリックしてドロップダウンから別の日を選択可能</li>
          <li>店舗欄をクリックして店舗を入力・変更</li>
          <li>開始・終了時刻を選択（時・分のドロップダウン）</li>
          <li>休みの場合は「休」にチェック</li>
          <li><strong>前の日</strong>/<strong>次の日</strong>ボタンで日付を移動（自動保存）</li>
          <li><strong>確定</strong>ボタンで保存して終了</li>
        </ol>
        <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <strong>📱 推奨：</strong> シフト編集は横向き画面での使用を推奨します。縦向きの場合、画面回転を促すメッセージが表示されます。
        </div>
        <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <strong>⚠️ 注意：</strong> 日付を移動する際は自動的に保存されます。店舗が未入力の場合は保存できません。
        </div>
      </div>
    )
  };

  return contents[page] || contents.shiftCreate;
};

// ヘルプボタンコンポーネント
const HelpButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
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
        zIndex: 1500,
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
  const [showHelp, setShowHelp] = useState(false);
  const [currentHelpPage, setCurrentHelpPage] = useState('shiftCreate');

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

  const getDayOfWeek = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const formatDateWithDay = (dateStr) => {
    return `${dateStr} (${getDayOfWeek(dateStr)})`;
  };

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
      alert('開始日と終了日を正しく入力してください');
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
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} content={getHelpContent(currentHelpPage)} />
        <HelpButton onClick={() => {
          setCurrentHelpPage('shiftCreate');
          setShowHelp(true);
        }} />
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
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} content={getHelpContent(currentHelpPage)} />
        <HelpButton onClick={() => {
          setCurrentHelpPage('shiftEdit');
          setShowHelp(true);
        }} />
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
              {formatDateWithDay(selectedDate)} のシフト入力 ▼
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
                minWidth: '200px',
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
                    {formatDateWithDay(date)}
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
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} content={getHelpContent(currentHelpPage)} />
      <HelpButton onClick={() => {
        setCurrentHelpPage('shiftCreate');
        setShowHelp(true);
      }} />
      <div className="login-card" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.5rem)' }}>シフト表</h2>
        <div className="shift-table-wrapper" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', WebkitOverflowScrolling: 'touch' }}>
          <table className="shift-table">
            <thead>
              <tr>
                <th>名前</th>
                {dates.map(date => (
                  <th key={date}>{formatDateWithDay(date)}</th>
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