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

// ヘルプボタンコンポーネント
const HelpButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
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
        zIndex: 1000,
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

// 使い方ガイドの内容
const getHelpContent = (isAuthenticated) => {
  if (!isAuthenticated) {
    return (
      <div>
        <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>シフト変更（認証画面）の使い方</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='350'%3E%3Crect width='400' height='350' fill='%23f5f5f5'/%3E%3Crect x='50' y='30' width='300' height='290' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Ctext x='200' y='70' text-anchor='middle' font-size='18' font-weight='bold'%3Eシフト変更%3C/text%3E%3Ctext x='200' y='95' text-anchor='middle' font-size='11' fill='%23666'%3Eシフトが作成される前の期間のみ変更可能です%3C/text%3E%3Crect x='80' y='120' width='240' height='35' rx='5' fill='%23e3f2fd' stroke='%231976D2'/%3E%3Ctext x='90' y='143' font-size='14' fill='%23666'%3E管理番号を入力%3C/text%3E%3Crect x='80' y='170' width='240' height='35' rx='5' fill='%23e3f2fd' stroke='%231976D2'/%3E%3Ctext x='90' y='193' font-size='14' fill='%23666'%3E名前を入力%3C/text%3E%3Crect x='130' y='230' width='140' height='35' rx='6' fill='%231976D2'/%3E%3Ctext x='200' y='254' text-anchor='middle' font-size='15' fill='white'%3E認証%3C/text%3E%3C/svg%3E" alt="認証画面" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
        </div>
        <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>認証手順：</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>管理番号</strong>を入力します</li>
          <li><strong>名前</strong>を入力します（登録されている名前と一致する必要があります）</li>
          <li><strong>認証</strong>ボタンをクリックします</li>
        </ol>
        <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <strong>⚠️ 重要：</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            <li>既にシフトが作成された期間は変更できません</li>
            <li>管理番号と名前が一致しない場合、エラーが表示されます</li>
            <li>編集可能なシフトがない場合もメッセージが表示されます</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>シフト変更（編集画面）の使い方</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='550'%3E%3Crect width='400' height='550' fill='%23f5f5f5'/%3E%3Crect x='30' y='20' width='340' height='510' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Ctext x='200' y='50' text-anchor='middle' font-size='18' font-weight='bold'%3Eシフト変更%3C/text%3E%3Ctext x='50' y='75' font-size='12'%3E管理番号: 12345 | 名前: 山田太郎%3C/text%3E%3Crect x='50' y='90' width='40' height='25' rx='4' fill='%23636e72'/%3E%3Ctext x='70' y='107' text-anchor='middle' font-size='11' fill='white'%3E全て%3C/text%3E%3Crect x='95' y='90' width='40' height='25' rx='4' fill='%236c5ce7'/%3E%3Ctext x='115' y='107' text-anchor='middle' font-size='11' fill='white'%3E月%3C/text%3E%3Crect x='140' y='90' width='40' height='25' rx='4' fill='%2300b894'/%3E%3Ctext x='160' y='107' text-anchor='middle' font-size='11' fill='white'%3E火%3C/text%3E%3Crect x='50' y='130' width='300' height='100' rx='8' fill='%23e3f2fd' stroke='%232196F3' stroke-width='2'/%3E%3Ctext x='60' y='150' font-size='12' font-weight='bold' fill='%231976D2'%3E一括設定%3C/text%3E%3Crect x='60' y='165' width='130' height='20' rx='4' fill='white' stroke='%23ccc'/%3E%3Ctext x='70' y='179' font-size='10' fill='%23666'%3E開始時間%3C/text%3E%3Crect x='200' y='165' width='130' height='20' rx='4' fill='white' stroke='%23ccc'/%3E%3Ctext x='210' y='179' font-size='10' fill='%23666'%3E終了時間%3C/text%3E%3Crect x='60' y='195' width='270' height='25' rx='4' fill='%232196F3'/%3E%3Ctext x='195' y='213' text-anchor='middle' font-size='12' fill='white'%3E一括適用%3C/text%3E%3Crect x='50' y='250' width='300' height='120' rx='8' fill='%23e8e8e8' stroke='%23d0d0d0'/%3E%3Ctext x='60' y='270' font-size='13' font-weight='bold'%3E2025-01-15（水）%3C/text%3E%3Crect x='60' y='280' width='130' height='20' rx='4' fill='white' stroke='%23ccc'/%3E%3Ctext x='70' y='294' font-size='10' fill='%23666'%3E開始: 09:00%3C/text%3E%3Crect x='200' y='280' width='130' height='20' rx='4' fill='white' stroke='%23ccc'/%3E%3Ctext x='210' y='294' font-size='10' fill='%23666'%3E終了: 17:00%3C/text%3E%3Crect x='60' y='310' width='270' height='50' rx='4' fill='%23FFF9E6' stroke='%23FF9800' stroke-width='2'/%3E%3Ctext x='70' y='330' font-size='10' fill='%23666'%3E備考：%3C/text%3E%3Ctext x='70' y='345' font-size='10' fill='%23666'%3E朝遅刻予定%3C/text%3E%3Crect x='80' y='390' width='110' height='30' rx='6' fill='%234CAF50'/%3E%3Ctext x='135' y='411' text-anchor='middle' font-size='13' fill='white'%3E保存%3C/text%3E%3Crect x='210' y='390' width='110' height='30' rx='6' fill='%23607D8B'/%3E%3Ctext x='265' y='411' text-anchor='middle' font-size='13' fill='white'%3Eメニューへ%3C/text%3E%3Crect x='50' y='440' width='300' height='80' rx='8' fill='%23FFF3CD' stroke='%23FFC107'/%3E%3Ctext x='60' y='460' font-size='11' fill='%23856404'%3E💡 編集可能なシフト: 15件%3C/text%3E%3Ctext x='60' y='480' font-size='10' fill='%23856404'%3E・曜日を選択して一括変更できます%3C/text%3E%3Ctext x='60' y='495' font-size='10' fill='%23856404'%3E・各日付ごとに個別調整も可能%3C/text%3E%3Ctext x='60' y='510' font-size='10' fill='%23856404'%3E・備考欄に予定を記入できます%3C/text%3E%3C/svg%3E" alt="編集画面" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
      </div>
      <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>編集手順：</h3>
      <ol style={{ lineHeight: '1.8' }}>
        <li><strong>曜日ボタン</strong>をクリックして一括変更する曜日を選択
          <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem', fontSize: '0.95em' }}>
            <li>「全て」で全曜日を選択可能</li>
            <li>複数の曜日を同時に選択できます</li>
          </ul>
        </li>
        <li><strong>一括設定</strong>で開始時間・終了時間を入力
          <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem', fontSize: '0.95em' }}>
            <li>時間と分を別々に選択します</li>
          </ul>
        </li>
        <li><strong>一括適用</strong>ボタンで選択した曜日に時間を反映</li>
        <li>各日付ごとに<strong>個別調整</strong>が可能
          <ul style={{ marginTop: '0.3rem', paddingLeft: '1.2rem', fontSize: '0.95em' }}>
            <li>時間を空欄にすると「休み」として扱われます</li>
          </ul>
        </li>
        <li><strong>備考欄</strong>に遅刻・早退などの予定を入力</li>
        <li><strong>保存</strong>ボタンで変更を確定</li>
      </ol>
      
      <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>🎯 便利な機能：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li><strong>一括設定</strong>：同じ曜日のシフトをまとめて変更</li>
          <li><strong>個別調整</strong>：特定の日だけ時間を変更</li>
          <li><strong>備考欄</strong>：遅刻・早退・その他の予定を記録</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>⚠️ 注意事項：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li>保存すると変更は即座に反映されます</li>
          <li>シフトが既に作成された日付は編集できません</li>
          <li>時間を空欄にすると休みとして登録されます</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#ffebee', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>🔴 トラブルシューティング：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li><strong>「編集可能なシフトがありません」</strong>と表示される
            <ul style={{ paddingLeft: '1rem', fontSize: '0.95em' }}>
              <li>→ シフトが既に作成済みの可能性があります</li>
              <li>→ 店長に確認してください</li>
            </ul>
          </li>
          <li><strong>保存がエラーになる</strong>
            <ul style={{ paddingLeft: '1rem', fontSize: '0.95em' }}>
              <li>→ ネットワーク接続を確認してください</li>
              <li>→ 時間入力が正しいか確認してください</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

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
  const [showHelp, setShowHelp] = useState(false);

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
      <>
        <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
          content={getHelpContent(false)} 
        />
        <div className="login-wrapper" style={{ padding: '0.5rem' }}>
          <div className="login-card" style={{ 
            width: '100%', 
            maxWidth: '500px',
            padding: '1rem',
            boxSizing: 'border-box',
            position: 'relative',
            paddingTop: '4rem'
          }}>
            <HelpButton onClick={() => setShowHelp(true)} />
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
      </>
    );
  }

  return (
    <>
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        content={getHelpContent(true)} 
      />
      <div className="login-wrapper" style={{ padding: '0.5rem' }}>
        <div className="login-card" style={{ 
          width: '100%',
          maxWidth: '900px',
          padding: isMobile ? '0.75rem' : '1rem',
          boxSizing: 'border-box',
          position: 'relative',
          paddingTop: isMobile ? '4rem' : '4.5rem'
        }}>
          <HelpButton onClick={() => setShowHelp(true)} />
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
    </>
  );
}

export default StaffShiftEdit;