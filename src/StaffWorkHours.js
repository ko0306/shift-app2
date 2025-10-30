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
        <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>就労時間確認（認証画面）の使い方</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f5f5f5'/%3E%3Crect x='50' y='30' width='300' height='240' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Ctext x='200' y='60' text-anchor='middle' font-size='18' font-weight='bold'%3E就労時間確認%3C/text%3E%3Ctext x='200' y='85' text-anchor='middle' font-size='11' fill='%23666'%3E自分の勤務記録を確認できます%3C/text%3E%3Crect x='80' y='110' width='240' height='35' rx='5' fill='%23e3f2fd' stroke='%231976D2'/%3E%3Ctext x='90' y='133' font-size='14' fill='%23666'%3E管理番号を入力%3C/text%3E%3Crect x='130' y='165' width='140' height='35' rx='6' fill='%231976D2'/%3E%3Ctext x='200' y='189' text-anchor='middle' font-size='15' fill='white'%3E確認%3C/text%3E%3Crect x='130' y='220' width='140' height='30' rx='6' fill='%23607D8B'/%3E%3Ctext x='200' y='241' text-anchor='middle' font-size='13' fill='white'%3Eメニューに戻る%3C/text%3E%3C/svg%3E" alt="認証画面" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
        </div>
        <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>使い方：</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>管理番号</strong>を入力します</li>
          <li><strong>確認</strong>ボタンをクリックします</li>
          <li>認証が成功すると、勤務記録が表示されます</li>
        </ol>
        
        <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
          <strong>⚠️ 注意：</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
            <li>管理番号が正しくない場合、エラーが表示されます</li>
            <li>勤怠データが登録されていない場合は表示されません</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ color: '#1976D2', marginBottom: '1rem' }}>就労時間確認の使い方</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='550'%3E%3Crect width='400' height='550' fill='%23f5f5f5'/%3E%3Crect x='30' y='20' width='340' height='510' rx='10' fill='white' stroke='%231976D2' stroke-width='2'/%3E%3Ctext x='200' y='50' text-anchor='middle' font-size='18' font-weight='bold'%3E就労時間確認%3C/text%3E%3Ctext x='60' y='75' font-size='11'%3E管理番号: 12345 | 名前: 山田太郎%3C/text%3E%3Crect x='50' y='90' width='300' height='40' rx='6' fill='%23f9f9f9' stroke='%23ddd'/%3E%3Ctext x='60' y='110' font-size='11' font-weight='bold'%3E年度:%3C/text%3E%3Crect x='100' y='100' width='70' height='25' rx='4' fill='white' stroke='%23ddd'/%3E%3Ctext x='115' y='118' font-size='11'%3E2025年%3C/text%3E%3Ctext x='190' y='110' font-size='11' font-weight='bold'%3E月:%3C/text%3E%3Crect x='220' y='100' width='60' height='25' rx='4' fill='white' stroke='%23ddd'/%3E%3Ctext x='235' y='118' font-size='11'%3E1月%3C/text%3E%3Crect x='290' y='100' width='50' height='25' rx='4' fill='%23FF9800'/%3E%3Ctext x='315' y='118' text-anchor='middle' font-size='10' fill='white'%3E⚙️設定%3C/text%3E%3Crect x='50' y='145' width='300' height='60' rx='6' fill='%23E3F2FD' stroke='%231976D2'/%3E%3Ctext x='90' y='168' font-size='10' font-weight='bold'%3E月別%3C/text%3E%3Ctext x='150' y='168' font-size='10'%3E週別%3C/text%3E%3Ctext x='210' y='168' font-size='10'%3E日別%3C/text%3E%3Ctext x='260' y='168' font-size='10'%3E時間帯別%3C/text%3E%3Ctext x='60' y='190' font-size='9' fill='%23666'%3E全表示%3C/text%3E%3Crect x='50' y='220' width='300' height='80' rx='6' fill='%23E8F5E9'/%3E%3Ctext x='80' y='240' font-size='10' fill='%23666'%3E勤務日数%3C/text%3E%3Ctext x='80' y='260' font-size='16' font-weight='bold' fill='%231976D2'%3E15日%3C/text%3E%3Ctext x='180' y='240' font-size='10' fill='%23666'%3E総労働時間%3C/text%3E%3Ctext x='180' y='260' font-size='16' font-weight='bold' fill='%231976D2'%3E120h30m%3C/text%3E%3Ctext x='280' y='240' font-size='10' fill='%23666'%3E総給料%3C/text%3E%3Ctext x='280' y='260' font-size='14' font-weight='bold' fill='%234CAF50'%3E¥120,000%3C/text%3E%3Crect x='50' y='315' width='300' height='30' rx='4' fill='%23FFF3E0'/%3E%3Ctext x='60' y='335' font-size='12' font-weight='bold' fill='%23E65100'%3E2025年1月%3C/text%3E%3Ctext x='280' y='335' font-size='10' fill='%23666'%3E15日 | 120h%3C/text%3E%3Crect x='50' y='355' width='300' height='120' rx='6' fill='white' stroke='%23ddd'/%3E%3Crect x='55' y='360' width='290' height='25' fill='%23f5f5f5'/%3E%3Ctext x='60' y='377' font-size='10' font-weight='bold'%3E日付%3C/text%3E%3Ctext x='140' y='377' font-size='10' font-weight='bold'%3E開始%3C/text%3E%3Ctext x='190' y='377' font-size='10' font-weight='bold'%3E終了%3C/text%3E%3Ctext x='240' y='377' font-size='10' font-weight='bold'%3E休憩%3C/text%3E%3Ctext x='290' y='377' font-size='10' font-weight='bold'%3E時間%3C/text%3E%3Crect x='55' y='390' width='290' height='25' fill='white'/%3E%3Ctext x='60' y='407' font-size='9'%3E2025-01-15 (水)%3C/text%3E%3Ctext x='140' y='407' font-size='9'%3E09:00%3C/text%3E%3Ctext x='190' y='407' font-size='9'%3E17:00%3C/text%3E%3Ctext x='240' y='407' font-size='9'%3E60分%3C/text%3E%3Ctext x='290' y='407' font-size='9' font-weight='bold'%3E7h0m%3C/text%3E%3Crect x='80' y='490' width='240' height='30' rx='6' fill='%23607D8B'/%3E%3Ctext x='200' y='511' text-anchor='middle' font-size='13' fill='white'%3Eメニューに戻る%3C/text%3E%3C/svg%3E" alt="メイン画面" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
      </div>

      <h3 style={{ color: '#1976D2', marginTop: '1.5rem' }}>主な機能：</h3>
      
      <h4 style={{ color: '#1976D2', marginTop: '1rem' }}>📅 期間選択</h4>
      <ul style={{ lineHeight: '1.8' }}>
        <li><strong>年度選択</strong>：過去10年分のデータを選択可能</li>
        <li><strong>月選択</strong>：1月〜12月を選択して表示</li>
      </ul>

      <h4 style={{ color: '#1976D2', marginTop: '1rem' }}>📊 表示モード</h4>
      <ul style={{ lineHeight: '1.8' }}>
        <li><strong>月別</strong>：月ごとに集計して表示</li>
        <li><strong>週別</strong>：週ごとに集計して表示（第1週、第2週...）</li>
        <li><strong>日別</strong>：日付ごとに表示</li>
        <li><strong>時間帯別</strong>：朝・昼・夕・夜など時間帯で集計</li>
        <li><strong>全表示</strong>：すべてのデータを一覧表示</li>
      </ul>

      <h4 style={{ color: '#1976D2', marginTop: '1rem' }}>⚙️ 時間帯設定</h4>
      <ul style={{ lineHeight: '1.8' }}>
        <li><strong>デフォルト設定</strong>：朝(6-12時)、昼(12-17時)、夕(17-22時)、夜(22-6時)</li>
        <li><strong>カスタマイズ</strong>：自分の働き方に合わせて時間帯を追加・編集・削除</li>
        <li><strong>設定方法</strong>：
          <ol style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
            <li>「⚙️ 時間帯設定」ボタンをクリック</li>
            <li>既存の時間帯を編集、または新規追加</li>
            <li>不要な時間帯は「削除」ボタンで削除</li>
          </ol>
        </li>
      </ul>

      <h4 style={{ color: '#1976D2', marginTop: '1rem' }}>📈 統計情報</h4>
      <div style={{ backgroundColor: '#E8F5E9', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
        <ul style={{ lineHeight: '1.8', margin: 0 }}>
          <li><strong>勤務日数</strong>：選択した期間の出勤日数</li>
          <li><strong>総労働時間</strong>：実働時間の合計（休憩時間を除く）</li>
          <li><strong>総給料</strong>：給料が登録されている場合に表示</li>
        </ul>
      </div>

      <h4 style={{ color: '#1976D2', marginTop: '1rem' }}>📋 詳細テーブル</h4>
      <ul style={{ lineHeight: '1.8' }}>
        <li><strong>日付</strong>：勤務した日と曜日</li>
        <li><strong>店舗</strong>：どの店舗で勤務したか</li>
        <li><strong>開始・終了時刻</strong>：実際の勤務時間</li>
        <li><strong>休憩時間</strong>：取得した休憩の長さ（分）</li>
        <li><strong>労働時間</strong>：実働時間（終了-開始-休憩）</li>
        <li><strong>給料</strong>：その日の給料（登録されている場合）</li>
      </ul>

      <div style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>💡 便利な使い方：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li><strong>月別表示</strong>で月ごとの稼働状況を把握</li>
          <li><strong>時間帯別表示</strong>でいつ働くことが多いか分析</li>
          <li><strong>週別表示</strong>で週ごとの労働パターンを確認</li>
          <li>年度・月を変更して過去のデータと比較</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>📱 モバイルでの操作：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li>表は横にスクロールできます</li>
          <li>ボタンは自動的に最適なサイズに調整されます</li>
          <li>統計情報は画面幅に応じて自動レイアウト</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#ffebee', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>⚠️ 注意事項：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
          <li>表示されるのは店長が登録した勤怠データのみです</li>
          <li>給料は店長が入力した場合のみ表示されます</li>
          <li>時間帯設定は自分の画面でのみ有効（保存はされません）</li>
          <li>データに誤りがある場合は店長に確認してください</li>
        </ul>
      </div>
    </div>
  );
};

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
  const [showHelp, setShowHelp] = useState(false);
  const [timeSlots, setTimeSlots] = useState([
    { name: '朝', start: '06:00', end: '12:00' },
    { name: '昼', start: '12:00', end: '17:00' },
    { name: '夕', start: '17:00', end: '22:00' },
    { name: '夜', start: '22:00', end: '06:00' }
  ]);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('00:00');
  const [newSlotEnd, setNewSlotEnd] = useState('00:00');

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 36; hour++) {
      options.push(`${String(hour).padStart(2, '0')}:00`);
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkData(managerNumber, selectedYear, selectedMonth);
    }
  }, [selectedYear, selectedMonth, isAuthenticated, managerNumber]);

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

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const isTimeInSlot = (timeStr, slotStart, slotEnd) => {
    if (!timeStr) return false;
    
    const timeMinutes = timeToMinutes(timeStr);
    const startMinutes = timeToMinutes(slotStart);
    let endMinutes = timeToMinutes(slotEnd);
    
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
      
      if (timeMinutes < startMinutes) {
        return (timeMinutes + 24 * 60) >= startMinutes && (timeMinutes + 24 * 60) < endMinutes;
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
    setNewSlotStart('00:00');
    setNewSlotEnd('00:00');
  };

  const deleteTimeSlot = (index) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index, field, value) => {
    const updated = [...timeSlots];
    updated[index][field] = value;
    setTimeSlots(updated);
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
      <>
        <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
          content={getHelpContent(false)} 
        />
        <div className="login-wrapper">
          <div className="login-card" style={{ position: 'relative', paddingTop: '4rem' }}>
            <HelpButton onClick={() => setShowHelp(true)} />
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
      </>
    );
  }

  const stats = calculateTotalStats();
  const groupedData = getGroupedData();

  return (
    <>
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        content={getHelpContent(true)} 
      />
      <div className="login-wrapper">
        <div className="login-card" style={{ width: '900px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '1rem', position: 'relative', paddingTop: '4rem' }}>
          <HelpButton onClick={() => setShowHelp(true)} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 1.5rem)' }}>就労時間確認</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>年度:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  minWidth: '80px'
                }}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>
          </div>
          
          <p style={{ fontSize: 'clamp(0.75rem, 3vw, 0.9rem)', wordBreak: 'break-word' }}>管理番号: <strong>{managerNumber}</strong> | 名前: <strong>{userName}</strong></p>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: 'clamp(0.8rem, 3vw, 1rem)' }}>月:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minWidth: '70px',
                  fontSize: 'clamp(0.8rem, 3vw, 1rem)'
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
                padding: '0.5rem 1rem',
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
                    borderRadius: '4px',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="text"
                      value={slot.name}
                      onChange={(e) => updateTimeSlot(index, 'name', e.target.value)}
                      style={{
                        minWidth: '60px',
                        padding: '0.25rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}
                    />
                    <select
                      value={slot.start}
                      onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                      style={{
                        padding: '0.25rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <span>-</span>
                    <select
                      value={slot.end}
                      onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                      style={{
                        padding: '0.25rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
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
                    minWidth: '80px',
                    flex: '1 1 auto'
                  }}
                />
                <select
                  value={newSlotStart}
                  onChange={(e) => setNewSlotStart(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    flex: '1 1 auto'
                  }}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <span>-</span>
                <select
                  value={newSlotEnd}
                  onChange={(e) => setNewSlotEnd(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    flex: '1 1 auto'
                  }}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                <button
                  onClick={addTimeSlot}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    flex: '1 1 auto',
                    minWidth: '80px'
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '0.5rem',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setViewMode('monthly')}
              style={{
                backgroundColor: viewMode === 'monthly' ? '#1976D2' : 'white',
                color: viewMode === 'monthly' ? 'white' : '#1976D2',
                padding: '0.5rem 0.75rem',
                border: '2px solid #1976D2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              月別
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              style={{
                backgroundColor: viewMode === 'weekly' ? '#1976D2' : 'white',
                color: viewMode === 'weekly' ? 'white' : '#1976D2',
                padding: '0.5rem 0.75rem',
                border: '2px solid #1976D2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              週別
            </button>
            <button
              onClick={() => setViewMode('daily')}
              style={{
                backgroundColor: viewMode === 'daily' ? '#1976D2' : 'white',
                color: viewMode === 'daily' ? 'white' : '#1976D2',
                padding: '0.5rem 0.75rem',
                border: '2px solid #1976D2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              日別
            </button>
            <button
              onClick={() => setViewMode('time')}
              style={{
                backgroundColor: viewMode === 'time' ? '#1976D2' : 'white',
                color: viewMode === 'time' ? 'white' : '#1976D2',
                padding: '0.5rem 0.75rem',
                border: '2px solid #1976D2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              時間帯別
            </button>
            <button
              onClick={() => setViewMode('all')}
              style={{
                backgroundColor: viewMode === 'all' ? '#1976D2' : 'white',
                color: viewMode === 'all' ? 'white' : '#1976D2',
                padding: '0.5rem 0.75rem',
                border: '2px solid #1976D2',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
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
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <h3 style={{ margin: 0, color: '#E65100', fontSize: '1rem' }}>{group.key}</h3>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
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
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5' }}>
                          <tr>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #ddd', minWidth: '100px' }}>日付</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '50px' }}>店舗</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '60px' }}>開始時刻</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '60px' }}>終了時刻</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '60px' }}>休憩(分)</th>
                            <th style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '70px' }}>労働時間</th>
                            {group.data.some(d => d.salary) && (
                              <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #ddd', minWidth: '70px' }}>給料</th>
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
                                <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                                  <strong>{record.date}</strong> ({getWeekday(record.date)})
                                </td>
                                <td style={{ 
                                  padding: '0.5rem', 
                                  textAlign: 'center', 
                                  borderBottom: '1px solid #eee',
                                  fontWeight: 'bold',
                                  color: '#1976D2'
                                }}>
                                  {record.store}店舗
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                  {formatTime(record.actual_start)}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                  {formatTime(record.actual_end)}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                  {record.break_minutes || 0}分
                                </td>
                                <td style={{ 
                                  padding: '0.5rem', 
                                  textAlign: 'center', 
                                  borderBottom: '1px solid #eee',
                                  fontWeight: 'bold'
                                }}>
                                  {hours}時間{minutes}分
                                </td>
                                {group.data.some(d => d.salary) && (
                                  <td style={{ 
                                    padding: '0.5rem', 
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
              cursor: 'pointer',
              width: '100%',
              maxWidth: '300px'
            }}>
              メニューに戻る
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default StaffWorkHours;