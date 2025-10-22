import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function StaffShiftEdit({ onBack }) {
  const [managerNumber, setManagerNumber] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingShifts, setEditingShifts] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [bulkStartHour, setBulkStartHour] = useState('');
  const [bulkStartMin, setBulkStartMin] = useState('');
  const [bulkEndHour, setBulkEndHour] = useState('');
  const [bulkEndMin, setBulkEndMin] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: '', min: '' };
    const parts = timeStr.split(':');
    return { 
      hour: parts[0] ? parseInt(parts[0], 10).toString() : '', 
      min: parts[1] ? parseInt(parts[1], 10).toString() : '' 
    };
  };

  const handleAuthentication = async () => {
    if (!managerNumber || !name) {
      setMessage('管理番号と名前を入力してください');
      return;
    }

    setLoading(true);
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('manager_number', managerNumber)
        .eq('name', name)
        .eq('is_deleted', false)
        .single();

      if (userError || !user) {
        setMessage('管理番号または名前が一致しません');
        setLoading(false);
        return;
      }

      const { data: shifts, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('manager_number', managerNumber)
        .order('created_at', { ascending: false });

      if (shiftError) {
        setMessage('シフトデータの取得に失敗しました');
        setLoading(false);
        return;
      }

      if (!shifts || shifts.length === 0) {
        setMessage('編集可能なシフトがありません');
        setLoading(false);
        return;
      }

      const latestShiftsMap = {};
      shifts.forEach(shift => {
        if (!latestShiftsMap[shift.date]) {
          latestShiftsMap[shift.date] = shift;
        }
      });
      const latestShifts = Object.values(latestShiftsMap).sort((a, b) => a.date.localeCompare(b.date));

      const dates = latestShifts.map(s => s.date);
      const { data: finalShifts, error: finalError } = await supabase
        .from('final_shifts')
        .select('date')
        .eq('manager_number', managerNumber)
        .in('date', dates);

      if (finalError) {
        setMessage('シフト確認中にエラーが発生しました');
        setLoading(false);
        return;
      }

      const createdDates = new Set(finalShifts?.map(fs => fs.date) || []);
      const editableShifts = latestShifts.filter(shift => !createdDates.has(shift.date));

      if (editableShifts.length === 0) {
        setMessage('編集可能なシフトがありません（既にシフトが作成済みです）');
        setLoading(false);
        return;
      }

      setShiftData(editableShifts);
      setEditingShifts(editableShifts.map(shift => {
        const startTime = parseTime(shift.start_time);
        const endTime = parseTime(shift.end_time);
        return {
          ...shift,
          startHour: startTime.hour,
          startMin: startTime.min,
          endHour: endTime.hour,
          endMin: endTime.min,
          remarks: shift.remarks || ''
        };
      }));
      setIsAuthenticated(true);
      setMessage('認証成功');

    } catch (error) {
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

  const getColorForDay = (day) => {
    switch (day) {
      case '月': return '#6c5ce7';
      case '火': return '#00b894';
      case '水': return '#fd79a8';
      case '木': return '#e17055';
      case '金': return '#0984e3';
      case '土': return '#fab1a0';
      case '日': return '#d63031';
      case '全て': return '#636e72';
      default: return '#b2bec3';
    }
  };

  const toggleSelectedDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...editingShifts];
    updated[index][field] = value;
    setEditingShifts(updated);
  };

  const handleBulkApply = () => {
    const updated = editingShifts.map((item) => {
      const day = getWeekday(item.date);
      if (selectedDays.includes('全て') || selectedDays.includes(day)) {
        return {
          ...item,
          startHour: bulkStartHour,
          startMin: bulkStartMin,
          endHour: bulkEndHour,
          endMin: bulkEndMin
        };
      }
      return item;
    });
    setEditingShifts(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const shift of editingShifts) {
        const startTime = shift.startHour !== '' && shift.startMin !== ''
          ? `${String(shift.startHour).padStart(2, '0')}:${String(shift.startMin).padStart(2, '0')}:00`
          : null;
        const endTime = shift.endHour !== '' && shift.endMin !== ''
          ? `${String(shift.endHour).padStart(2, '0')}:${String(shift.endMin).padStart(2, '0')}:00`
          : null;

        console.log('Saving shift:', { id: shift.id, startTime, endTime, remarks: shift.remarks });

        const { error } = await supabase
          .from('shifts')
          .update({
            start_time: startTime,
            end_time: endTime,
            remarks: shift.remarks || null
          })
          .eq('id', shift.id);

        if (error) {
          console.error('Update error:', error);
          alert(`更新に失敗しました: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      alert('シフトを更新しました');
      setIsAuthenticated(false);
      setManagerNumber('');
      setName('');
      setShiftData([]);
      setEditingShifts([]);
      setMessage('');

    } catch (error) {
      console.error('Save error:', error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper" style={{ padding: '0.5rem' }}>
        <div className="login-card" style={{ 
          width: '100%', 
          maxWidth: '500px',
          padding: '1rem',
          boxSizing: 'border-box'
        }}>
          <h2>シフト変更</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            シフトが作成される前の期間のみ変更可能です
          </p>
          
          <label>管理番号:</label>
          <input
            type="text"
            value={managerNumber}
            onChange={(e) => setManagerNumber(e.target.value)}
            placeholder="管理番号を入力"
          />

          <label>名前:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
          />

          <button 
            onClick={handleAuthentication} 
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '確認中...' : '認証'}
          </button>

          {message && (
            <p style={{ 
              color: message.includes('成功') ? 'green' : 'red', 
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
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper" style={{ padding: '0.5rem' }}>
      <div className="login-card" style={{ 
        width: '100%',
        maxWidth: '900px',
        padding: isMobile ? '0.75rem' : '1rem',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}>シフト変更</h2>
        <p style={{ fontSize: 'clamp(13px, 2.5vw, 16px)' }}>
          管理番号: <strong>{managerNumber}</strong> | 名前: <strong>{name}</strong>
        </p>
        <p style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', color: '#666' }}>
          編集可能なシフト: {editingShifts.length}件
        </p>

        <div style={{
          border: '2px solid #2196F3',
          borderRadius: '8px',
          padding: isMobile ? '0.75rem' : '1rem',
          marginBottom: '1rem',
          backgroundColor: '#e3f2fd'
        }}>
          <h4 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: 'clamp(14px, 3vw, 16px)', 
            color: '#1976D2', 
            fontWeight: 'bold' 
          }}>
            一括設定
          </h4>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '0.3rem',
            marginBottom: '1rem',
            width: '100%'
          }}>
            {['全て', '月', '火', '水', '木', '金', '土', '日'].map((day) => (
              <button
                key={day}
                onClick={() => toggleSelectedDay(day)}
                style={{
                  backgroundColor: selectedDays.includes(day) ? '#95a5a6' : getColorForDay(day),
                  color: 'white',
                  padding: 'clamp(0.4rem, 2vw, 0.5rem) clamp(0.2rem, 1vw, 0.5rem)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 'clamp(11px, 2.5vw, 15px)',
                  minWidth: 0
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {selectedDays.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <label style={{ 
                    fontSize: 'clamp(11px, 2.5vw, 14px)', 
                    display: 'block', 
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}>
                    開始時間
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <select 
                      value={bulkStartHour} 
                      onChange={e => setBulkStartHour(e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">時</option>
                      {[...Array(37)].map((_, h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>:</span>
                    <select 
                      value={bulkStartMin} 
                      onChange={e => setBulkStartMin(e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">分</option>
                      {[...Array(60)].map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ flex: '1', minWidth: '130px' }}>
                  <label style={{ 
                    fontSize: 'clamp(11px, 2.5vw, 14px)', 
                    display: 'block', 
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}>
                    終了時間
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <select 
                      value={bulkEndHour} 
                      onChange={e => setBulkEndHour(e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">時</option>
                      {[...Array(37)].map((_, h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>:</span>
                    <select 
                      value={bulkEndMin} 
                      onChange={e => setBulkEndMin(e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">分</option>
                      {[...Array(60)].map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleBulkApply}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: 'clamp(0.5rem, 2vw, 0.6rem) 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 'clamp(12px, 2.5vw, 15px)',
                  fontWeight: 'bold',
                  width: '100%',
                  whiteSpace: 'nowrap'
                }}
              >
                一括適用
              </button>
            </div>
          )}
        </div>

        <div style={{
          maxHeight: isMobile ? '50vh' : '400px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '1rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
            {editingShifts.map((shift, index) => (
              <div 
                key={shift.id}
                style={{
                  backgroundColor: '#e8e8e8',
                  border: '1px solid #d0d0d0',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  marginBottom: '0.8rem',
                  color: '#333'
                }}>
                  {shift.date}（{getWeekday(shift.date)}）
                </div>
                
                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={{ 
                    fontSize: 'clamp(11px, 2.5vw, 14px)', 
                    display: 'block', 
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}>
                    開始時間
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <select 
                      value={shift.startHour} 
                      onChange={e => handleTimeChange(index, 'startHour', e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">時</option>
                      {[...Array(37)].map((_, h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>:</span>
                    <select 
                      value={shift.startMin} 
                      onChange={e => handleTimeChange(index, 'startMin', e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">分</option>
                      {[...Array(60)].map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '0.8rem' }}>
                  <label style={{ 
                    fontSize: 'clamp(11px, 2.5vw, 14px)', 
                    display: 'block', 
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap'
                  }}>
                    終了時間
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <select 
                      value={shift.endHour} 
                      onChange={e => handleTimeChange(index, 'endHour', e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">時</option>
                      {[...Array(37)].map((_, h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>:</span>
                    <select 
                      value={shift.endMin} 
                      onChange={e => handleTimeChange(index, 'endMin', e.target.value)}
                      style={{ 
                        flex: 1, 
                        padding: 'clamp(0.4rem, 2vw, 0.5rem)', 
                        fontSize: 'clamp(11px, 2.5vw, 14px)',
                        minWidth: 0
                      }}
                    >
                      <option value="">分</option>
                      {[...Array(60)].map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ 
                    fontSize: 'clamp(11px, 2.5vw, 14px)', 
                    display: 'block', 
                    marginBottom: '0.25rem', 
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}>
                    備考
                  </label>
                  <textarea
                    value={shift.remarks || ''}
                    onChange={(e) => handleTimeChange(index, 'remarks', e.target.value)}
                    placeholder="例：朝遅刻予定、早退など"
                    style={{
                      width: '100%',
                      padding: 'clamp(0.4rem, 2vw, 0.5rem)',
                      borderRadius: '4px',
                      border: '2px solid #FF9800',
                      fontSize: 'clamp(11px, 2.5vw, 14px)',
                      minHeight: '60px',
                      fontFamily: 'inherit',
                      backgroundColor: '#FFF9E6',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
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
              opacity: loading ? 0.6 : 1,
              fontSize: 'clamp(14px, 3vw, 16px)',
              flex: isMobile ? '1' : '0',
              minWidth: isMobile ? '0' : '120px'
            }}
          >
            {loading ? '保存中...' : '保存'}
          </button>
          
          <button 
            onClick={onBack}
            style={{
              backgroundColor: '#607D8B',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: 'clamp(14px, 3vw, 16px)',
              flex: isMobile ? '1' : '0',
              minWidth: isMobile ? '0' : '120px'
            }}
          >
            メニューに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffShiftEdit;