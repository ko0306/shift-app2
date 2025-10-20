import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// 時刻を24時以降の形式で表示（例: 25:00, 26:30）
const formatExtendedTime = (timeStr, workDate) => {
  if (!timeStr || !workDate) return timeStr;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const workDateObj = new Date(workDate);
  const currentDate = new Date();
  
  // 現在の日付と勤務日を比較
  const daysDiff = Math.floor((currentDate - workDateObj) / (1000 * 60 * 60 * 24));
  
  // 日をまたいでいる場合は時間に24を加算
  if (daysDiff > 0 && hours < 12) { // 深夜帯と判断（12時より前）
    const extendedHours = hours + (24 * daysDiff);
    return `${extendedHours}:${String(minutes).padStart(2, '0')}`;
  }
  
  return timeStr;
};

// 拡張時刻（25:00など）を通常の時刻に変換
const normalizeExtendedTime = (extendedTimeStr) => {
  if (!extendedTimeStr) return '';
  
  const [hours, minutes] = extendedTimeStr.split(':').map(Number);
  const normalizedHours = hours % 24;
  return `${String(normalizedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

function ClockInInput({ onBack }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mode, setMode] = useState('clockin'); // 'clockin' or 'clockout'
  const [managerNumber, setManagerNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [userMap, setUserMap] = useState({});
  const [currentDateTime, setCurrentDateTime] = useState('');

  // 初期表示時に日時を設定
  useEffect(() => {
    updateDateTime();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      const interval = setInterval(updateDateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const updateDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setCurrentDateTime(`${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`);
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
          const mn = user.manager_number;
          if (mn !== null && mn !== undefined) {
            userMapTemp[String(mn)] = user.name || `ユーザー${mn}`;
          }
        });
      }
      setUserMap(userMapTemp);
    } catch (error) {
      console.error('予期しないエラー:', error);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === '0306') {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('パスワードが違います');
    }
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateString = () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!managerNumber.trim()) {
      setMessage('管理番号を入力してください');
      setMessageType('error');
      return;
    }

    // 管理番号の存在確認
    if (!userMap[String(managerNumber)]) {
      setMessage('番号が間違っています');
      setMessageType('error');
      return;
    }

    const currentTime = getCurrentTimeString();
    const todayDate = getTodayDateString();

    try {
      if (mode === 'clockin') {
        // 出勤入力
        // すでに同じ管理番号・日付のレコードがあるか確認
        const { data: existingList, error: fetchError } = await supabase
          .from('attendance')
          .select('*')
          .eq('manager_number', managerNumber)
          .eq('date', todayDate);

        if (fetchError) {
          console.error('既存データ確認エラー:', fetchError);
          setMessage('エラーが発生しました');
          setMessageType('error');
          return;
        }

        if (existingList && existingList.length > 0) {
          // 上書き
          const { error: updateError } = await supabase
            .from('attendance')
            .update({
              actual_start: currentTime
            })
            .eq('id', existingList[0].id);

          if (updateError) {
            console.error('出勤更新エラー:', updateError);
            setMessage('エラーが発生しました');
            setMessageType('error');
            return;
          }
        } else {
          // 新規作成
          const { error: insertError } = await supabase
            .from('attendance')
            .insert([{
              date: todayDate,
              manager_number: managerNumber,
              actual_start: currentTime,
              actual_end: null,
              break_minutes: 0,
              work_minutes: 0,
              store: ''
            }]);

          if (insertError) {
            console.error('出勤登録エラー:', insertError);
            setMessage('エラーが発生しました');
            setMessageType('error');
            return;
          }
        }

        setMessage('出勤を記録しました');
        setMessageType('success');
      } else {
        // 退勤入力
        const todayDate = getTodayDateString();
        const yesterdayDate = getYesterdayDateString();

        let clockInRecord = null;
        
        // まず今日の出勤記録を確認
        const { data: todayRecords, error: todayError } = await supabase
          .from('attendance')
          .select('*')
          .eq('manager_number', managerNumber)
          .eq('date', todayDate);

        console.log('今日のレコード確認:', { todayRecords, todayError, todayDate });

        if (!todayError && todayRecords && todayRecords.length > 0) {
          const record = todayRecords[0];
          if (record.actual_start) {
            clockInRecord = record;
            console.log('今日の出勤記録を使用:', clockInRecord);
          }
        }
        
        // 今日のレコードがなければ昨日を確認
        if (!clockInRecord) {
          const { data: yesterdayRecords, error: yesterdayError } = await supabase
            .from('attendance')
            .select('*')
            .eq('manager_number', managerNumber)
            .eq('date', yesterdayDate);

          console.log('昨日のレコード確認:', { yesterdayRecords, yesterdayError, yesterdayDate });

          if (!yesterdayError && yesterdayRecords && yesterdayRecords.length > 0) {
            const record = yesterdayRecords[0];
            if (record.actual_start) {
              clockInRecord = record;
              console.log('昨日の出勤記録を使用:', clockInRecord);
            }
          }
        }

        if (!clockInRecord) {
          console.error('出勤記録が見つかりませんでした');
          setMessage('出勤記録が見つかりません');
          setMessageType('error');
          return;
        }

        // 退勤時刻を更新（既に退勤時刻がある場合も上書き）
        console.log('退勤時刻を更新:', { id: clockInRecord.id, currentTime, date: clockInRecord.date });
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            actual_end: currentTime
          })
          .eq('id', clockInRecord.id);

        if (updateError) {
          console.error('退勤更新エラー:', updateError);
          setMessage('エラーが発生しました: ' + updateError.message);
          setMessageType('error');
          return;
        }

        console.log('退勤記録成功');
        setMessage('退勤を記録しました');
        setMessageType('success');
      }

      // 入力欄をクリア
      setManagerNumber('');
      
      // メッセージを3秒後に消す
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);

    } catch (error) {
      console.error('送信エラー:', error);
      setMessage('エラーが発生しました');
      setMessageType('error');
    }
  };

  // パスワード認証画面
  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h2>退勤入力</h2>
          <p style={{ marginBottom: '1rem', color: '#666' }}>パスワードを入力してください</p>
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmit();
              }
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #ddd',
              borderRadius: '4px',
              marginBottom: '1rem'
            }}
          />
          <button
            onClick={handlePasswordSubmit}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '0.5rem'
            }}
          >
            認証
          </button>
          {passwordError && (
            <p style={{ color: '#F44336', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {passwordError}
            </p>
          )}
          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#607D8B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  // メイン入力画面
  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ width: '500px', maxWidth: '95vw' }}>
        <h2>退勤入力</h2>

        {/* 現在の日時表示 */}
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '2rem',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#333'
        }}>
          {currentDateTime}
        </div>

        {/* モード選択ボタン */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setMode('clockin')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: mode === 'clockin' ? '#4CAF50' : '#E0E0E0',
              color: mode === 'clockin' ? 'white' : '#999',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            出勤入力
          </button>
          <button
            onClick={() => setMode('clockout')}
            style={{
              flex: 1,
              padding: '1rem',
              backgroundColor: mode === 'clockout' ? '#2196F3' : '#E0E0E0',
              color: mode === 'clockout' ? 'white' : '#999',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            退勤入力
          </button>
        </div>

        {/* 管理番号入力 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}>
            管理番号
          </label>
          <input
            type="text"
            value={managerNumber}
            onChange={(e) => setManagerNumber(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="管理番号を入力"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1.2rem',
              border: '2px solid #ddd',
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          />
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: mode === 'clockin' ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          送信
        </button>

        {/* メッセージ表示 */}
        {message && (
          <div style={{
            padding: '1rem',
            backgroundColor: messageType === 'success' ? '#E8F5E9' : '#FFEBEE',
            color: messageType === 'success' ? '#2E7D32' : '#C62828',
            borderRadius: '4px',
            marginBottom: '1rem',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            {message}
          </div>
        )}

        {/* 戻るボタン */}
        <button
          onClick={onBack}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#607D8B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          メニューに戻る
        </button>
      </div>
    </div>
  );
}

export default ClockInInput;