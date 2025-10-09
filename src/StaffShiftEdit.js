import React, { useState } from 'react';
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
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkStore, setBulkStore] = useState('');

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
        .order('date');

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

      const dates = shifts.map(s => s.date);
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
      const editableShifts = shifts.filter(shift => !createdDates.has(shift.date));

      if (editableShifts.length === 0) {
        setMessage('編集可能なシフトがありません（既にシフトが作成済みです）');
        setLoading(false);
        return;
      }

      setShiftData(editableShifts);
      setEditingShifts(editableShifts.map(shift => ({
        ...shift,
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        store: shift.store || ''
      })));
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
        const newItem = { ...item };
        if (bulkStart) newItem.start_time = bulkStart;
        if (bulkEnd) newItem.end_time = bulkEnd;
        if (bulkStore) newItem.store = bulkStore;
        return newItem;
      }
      return item;
    });
    setEditingShifts(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const shift of editingShifts) {
        const { error } = await supabase
          .from('shifts')
          .update({
            start_time: shift.start_time,
            end_time: shift.end_time,
            store: shift.store
          })
          .eq('id', shift.id);

        if (error) {
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
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
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
              cursor: 'pointer'
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
      <div className="login-card" style={{ width: '800px', maxWidth: '95vw' }}>
        <h2>シフト変更</h2>
        <p>管理番号: <strong>{managerNumber}</strong> | 名前: <strong>{name}</strong></p>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          編集可能なシフト: {editingShifts.length}件
        </p>

        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#f9f9f9'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>一括適用</h4>
          
          <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '1rem' }}>
            {['全て', '月', '火', '水', '木', '金', '土', '日'].map((day) => (
              <button
                key={day}
                onClick={() => toggleSelectedDay(day)}
                style={{
                  backgroundColor: selectedDays.includes(day) ? '#95a5a6' : getColorForDay(day),
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {selectedDays.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '0.9rem' }}>開始時間：</label>
                <input 
                  type="time" 
                  value={bulkStart} 
                  onChange={(e) => setBulkStart(e.target.value)}
                  style={{ padding: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem' }}>終了時間：</label>
                <input 
                  type="time" 
                  value={bulkEnd} 
                  onChange={(e) => setBulkEnd(e.target.value)}
                  style={{ padding: '0.25rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.9rem' }}>店舗：</label>
                <input 
                  type="text" 
                  value={bulkStore} 
                  onChange={(e) => setBulkStore(e.target.value)}
                  placeholder="店舗番号"
                  style={{ padding: '0.25rem', width: '80px' }}
                />
              </div>
              <button 
                onClick={handleBulkApply}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                一括適用
              </button>
            </div>
          )}
        </div>

        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '1rem'
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
                  開始時間
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                  終了時間
                </th>
              </tr>
            </thead>
            <tbody>
              {editingShifts.map((shift, index) => (
                <tr key={shift.id} style={{
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9'
                }}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                    <strong>{shift.date}</strong> ({getWeekday(shift.date)})
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                    <input
                      type="text"
                      value={shift.store || ''}
                      onChange={(e) => handleTimeChange(index, 'store', e.target.value)}
                      placeholder="店舗"
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
                      value={shift.start_time ? shift.start_time.slice(0, 5) : ''}
                      onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '120px'
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                    <input
                      type="time"
                      value={shift.end_time ? shift.end_time.slice(0, 5) : ''}
                      onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        width: '120px'
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
              fontSize: '1rem'
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
              fontSize: '1rem'
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