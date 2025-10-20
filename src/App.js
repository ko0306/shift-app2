import React, { useState } from 'react';
import RegisterUser from './RegisterUser';
import ManagerCreate from './ManagerCreate';
import StaffShiftView from './StaffShiftView';
import ManagerShiftView from './ManagerShiftView';
import StaffShiftEdit from './StaffShiftEdit';
import ManagerAttendance from './ManagerAttendance';
import StaffWorkHours from './StaffWorkHours';
import ClockInInput from './ClockInInput';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [role, setRole] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [managerNumber, setManagerNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shiftTimes, setShiftTimes] = useState([]);
  const [bulkStartHour, setBulkStartHour] = useState('');
  const [bulkStartMin, setBulkStartMin] = useState('');
  const [bulkEndHour, setBulkEndHour] = useState('');
  const [bulkEndMin, setBulkEndMin] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [managerAuth, setManagerAuth] = useState(false);
  const [managerPass, setManagerPass] = useState('');
  const [managerPassError, setManagerPassError] = useState('');
  const [managerStep, setManagerStep] = useState('');
  
  const [navigationHistory, setNavigationHistory] = useState([]);

  const resetAllInputs = () => {
    setManagerNumber('');
    setStartDate('');
    setEndDate('');
    setShiftTimes([]);
    setBulkStartHour('');
    setBulkStartMin('');
    setBulkEndHour('');
    setBulkEndMin('');
    setSelectedDays([]);
    setManagerPass('');
    setManagerPassError('');
  };

  const pushToHistory = (state) => {
    setNavigationHistory(prev => [...prev, state]);
  };

  const goBack = () => {
    if (navigationHistory.length === 0) return;

    const previousState = navigationHistory[navigationHistory.length - 1];
    const newHistory = navigationHistory.slice(0, -1);
    
    setNavigationHistory(newHistory);
    setRole(previousState.role || '');
    setCurrentStep(previousState.currentStep || '');
    setManagerAuth(previousState.managerAuth || false);
    setManagerStep(previousState.managerStep || '');
    setIsLoggedIn(previousState.isLoggedIn !== undefined ? previousState.isLoggedIn : true);
    
    resetAllInputs();
  };

  const shouldShowBackButton = () => {
    return navigationHistory.length > 0;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (id === 'kouki' && password === '0306') {
      setIsLoggedIn(true);
      setLoginMessage('');
      setNavigationHistory([]);
    } else {
      setLoginMessage('IDまたはパスワードが違います');
    }
  };

  const selectRole = (selectedRole) => {
    pushToHistory({
      role: '',
      currentStep: '',
      managerAuth: false,
      managerStep: '',
      isLoggedIn: true
    });
    
    setRole(selectedRole);
    if (selectedRole === 'staff') setCurrentStep('');
  };

  const handleNext = async () => {
    if (!managerNumber.trim()) {
      alert('管理番号を入力してください');
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      alert('正しい開始日・終了日を入力してください');
      return;
    }

    // 管理番号の存在確認
    try {
      const { data, error } = await supabase
        .from('users')
        .select('manager_number')
        .eq('manager_number', managerNumber)
        .single();

      if (error || !data) {
        alert('管理番号が存在しません。');
        return;
      }
    } catch (err) {
      alert('管理番号が存在しません。');
      return;
    }

    pushToHistory({
      role: role,
      currentStep: 'shiftPeriod',
      managerAuth: managerAuth,
      managerStep: managerStep,
      isLoggedIn: true
    });

    const dates = [];
    const d = new Date(startDate);
    while (d <= new Date(endDate)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push({ 
        date: `${yyyy}-${mm}-${dd}`, 
        startHour: '', 
        startMin: '', 
        endHour: '', 
        endMin: '', 
        remarks: '' 
      });
      d.setDate(d.getDate() + 1);
    }

    setShiftTimes(dates);
    setCurrentStep('shiftInput');
  };

  const getWeekday = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...shiftTimes];
    updated[index][field] = value;
    setShiftTimes(updated);
  };

  const handleBulkApply = () => {
    const updated = shiftTimes.map(item => {
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
    setShiftTimes(updated);
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

  const handleSubmit = async () => {
    try {
      for (const shift of shiftTimes) {
        const startTime = shift.startHour !== '' && shift.startMin !== '' 
          ? `${String(shift.startHour).padStart(2, '0')}:${String(shift.startMin).padStart(2, '0')}` 
          : '';
        const endTime = shift.endHour !== '' && shift.endMin !== '' 
          ? `${String(shift.endHour).padStart(2, '0')}:${String(shift.endMin).padStart(2, '0')}` 
          : '';
        
        const { error } = await supabase
          .from('shifts')
          .insert([{
            manager_number: managerNumber,
            date: shift.date,
            start_time: startTime,
            end_time: endTime,
            remarks: shift.remarks,
          }]);
        if (error) throw error;
      }

      alert('シフトを保存しました！');
      setCurrentStep('');
      setRole('staff');
      resetAllInputs();
    } catch (error) {
      alert(`保存中にエラーが発生しました: ${error.message}`);
    }
  };

  const BackButton = () => {
    if (!shouldShowBackButton()) return null;
    
    return (
      <button
        onClick={goBack}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: '2px solid #45a049',
          borderRadius: '8px',
          width: '80px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#45a049';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#4CAF50';
          e.target.style.transform = 'translateY(0px)';
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        }}
        title="前のページに戻る"
      >
        ← 戻る
      </button>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        <form className="login-card" onSubmit={handleLogin}>
          <h2>ログイン</h2>
          <input type="text" placeholder="ログインID" value={id} onChange={e => setId(e.target.value)} required />
          <input type="password" placeholder="パスワード" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" style={{ backgroundColor: '#2196F3' }}>ログイン</button>
          {loginMessage && <p className="error-msg">{loginMessage}</p>}
        </form>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ position: 'relative' }}>
          <BackButton />
          <h2>役職を選択してください</h2>
          <div className="button-row" style={{ flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => selectRole('staff')} style={{ backgroundColor: '#1976D2' }}>アルバイト</button>
            <button onClick={() => selectRole('manager')} style={{ backgroundColor: '#1565C0' }}>店長</button>
            <button onClick={() => {
              pushToHistory({
                role: '',
                currentStep: '',
                managerAuth: false,
                managerStep: '',
                isLoggedIn: true
              });
              setRole('clockin');
            }} style={{ backgroundColor: '#00BCD4' }}>退勤入力</button>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'clockin') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <ClockInInput onBack={() => setRole('')} />
      </div>
    );
  }

  if (role === 'manager' && !managerAuth) {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ position: 'relative' }}>
          <BackButton />
          <h2>店長パスワード</h2>
          <input type="password" placeholder="パスワードを入力" value={managerPass} onChange={(e) => setManagerPass(e.target.value)} />
          <button onClick={() => {
            if (managerPass === '0306') {
              pushToHistory({
                role: role,
                currentStep: currentStep,
                managerAuth: false,
                managerStep: managerStep,
                isLoggedIn: true
              });
              setManagerAuth(true);
              setManagerPassError('');
            } else {
              setManagerPassError('パスワードが違います');
            }
          }} style={{ backgroundColor: '#1554A5' }}>認証</button>
          {managerPassError && <p className="error-msg">{managerPassError}</p>}
        </div>
      </div>
    );
  }

  if (role === 'manager' && managerAuth && managerStep === '') {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ position: 'relative' }}>
          <BackButton />
          <h2>店長メニュー</h2>
          <div className="button-row" style={{ flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: currentStep,
                managerAuth: managerAuth,
                managerStep: '',
                isLoggedIn: true
              });
              setManagerStep('create');
            }} style={{ backgroundColor: '#1E88E5' }}>シフト作成</button>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: currentStep,
                managerAuth: managerAuth,
                managerStep: '',
                isLoggedIn: true
              });
              setManagerStep('view');
            }} style={{ backgroundColor: '#1976D2' }}>シフト確認</button>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: currentStep,
                managerAuth: managerAuth,
                managerStep: '',
                isLoggedIn: true
              });
              setManagerStep('attendance');
            }} style={{ backgroundColor: '#0D47A1' }}>退勤管理</button>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: currentStep,
                managerAuth: managerAuth,
                managerStep: '',
                isLoggedIn: true
              });
              setManagerStep('register');
            }} style={{ backgroundColor: '#1554A5' }}>新人登録</button>
            <button onClick={() => {
              window.open('https://docs.google.com/forms/d/e/1FAIpQLSci0UYQ7BKfXjhVj8x3WBR5ncFxxCo_lsV11kY5TaI15wlKSQ/viewform?usp=header', '_blank');
            }} style={{ backgroundColor: '#1565C0' }}>お問い合わせ</button>
          </div>
          <button onClick={() => {
            setRole('');
            setId('');
            setPassword('');
            setIsLoggedIn(false);
            setManagerAuth(false);
            resetAllInputs();
            setNavigationHistory([]);
          }} style={{ backgroundColor: '#FF5722' }}>ログアウト</button>
        </div>
      </div>
    );
  }

  if (role === 'manager' && managerAuth && managerStep === 'register') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <RegisterUser onBack={() => setManagerStep('')} />
      </div>
    );
  }

  if (role === 'manager' && managerAuth && managerStep === 'create') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <ManagerCreate onNavigate={(page) => {
          if (page === 'staff') {
            setManagerStep('');
          }
        }} />
      </div>
    );
  }

  if (role === 'manager' && managerAuth && managerStep === 'view') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <ManagerShiftView onBack={() => setManagerStep('')} />
      </div>
    );
  }

  if (role === 'manager' && managerAuth && managerStep === 'attendance') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <ManagerAttendance onBack={() => setManagerStep('')} />
      </div>
    );
  }

  if (role === 'staff' && currentStep === 'shiftView') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <StaffShiftView onBack={() => setCurrentStep('')} />
      </div>
    );
  }

  if (role === 'staff' && currentStep === 'shiftEdit') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <StaffShiftEdit onBack={() => setCurrentStep('')} />
      </div>
    );
  }

  if (role === 'staff' && currentStep === 'workHours') {
    return (
      <div style={{ position: 'relative' }}>
        <BackButton />
        <StaffWorkHours onBack={() => setCurrentStep('')} />
      </div>
    );
  }

  if (role === 'staff' && currentStep === 'shiftPeriod') {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ position: 'relative' }}>
          <BackButton />
          <h2>新規提出</h2>
          <label>管理番号:</label>
          <input type="text" value={managerNumber} onChange={e => setManagerNumber(e.target.value)} />
          <label>開始日:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>終了日:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button onClick={handleNext} style={{ backgroundColor: '#1976D2' }}>次へ</button>
        </div>
      </div>
    );
  }

  if (role === 'staff' && currentStep === 'shiftInput') {
    return (
      <div className="login-wrapper">
        <div className="login-card shift-input-card" style={{ position: 'relative' }}>
          <BackButton />
          <h2>シフト入力</h2>
          <p>管理番号: <strong>{managerNumber}</strong></p>

          <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '1rem' }}>
            {['全て', '月', '火', '水', '木', '金', '土', '日'].map((day) => (
              <button
                key={day}
                onClick={() => toggleSelectedDay(day)}
                style={{
                  backgroundColor: selectedDays.includes(day) ? '#95a5a6' : getColorForDay(day),
                  color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontSize: 'clamp(12px, 2vw, 16px)',
                }}>
                {day}
              </button>
            ))}
          </div>

          {selectedDays.length > 0 && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px',
              border: '2px solid #2196F3'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#1976D2' }}>一括設定</div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1', minWidth: '140px' }}>
                  <label style={{ fontSize: 'clamp(12px, 2vw, 14px)', display: 'block', marginBottom: '0.25rem' }}>開始時間</label>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <select 
                      value={bulkStartHour} 
                      onChange={e => setBulkStartHour(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                    >
                      <option value="">時</option>
                      {[...Array(37)].map((_, h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>:</span>
                    <select 
                      value={bulkStartMin} 
                      onChange={e => setBulkStartMin(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                    >
                      <option value="">分</option>
                      {[...Array(60)].map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ flex: '1', minWidth: '140px' }}>
                  <label style={{ fontSize: 'clamp(12px, 2vw, 14px)', display: 'block', marginBottom: '0.25rem' }}>終了時間</label>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <select 
                      value={bulkEndHour} 
                      onChange={e => setBulkEndHour(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                    >
                      <option value="">時</option>
                      {[...Array(37)].map((_, h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>:</span>
                    <select 
                      value={bulkEndMin} 
                      onChange={e => setBulkEndMin(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                    >
                      <option value="">分</option>
                      {[...Array(60)].map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleBulkApply} 
                  style={{ 
                    backgroundColor: '#2196F3', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: 'clamp(12px, 2vw, 14px)',
                    fontWeight: 'bold',
                    minWidth: '80px'
                  }}
                >
                  一括適用
                </button>
              </div>
            </div>
          )}

          <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '1rem', width: '100%' }}>
            {shiftTimes.map((item, i) => (
              <div key={item.date} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.5rem', 
                marginBottom: '1.5rem', 
                padding: '1rem',
                backgroundColor: '#e8e8e8',
                borderRadius: '8px',
                border: '1px solid #d0d0d0'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 3vw, 18px)' }}>
                  {item.date}（{getWeekday(item.date)}）
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1', minWidth: '140px' }}>
                    <label style={{ fontSize: 'clamp(12px, 2vw, 14px)', display: 'block', marginBottom: '0.25rem' }}>開始時間</label>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <select 
                        value={item.startHour} 
                        onChange={e => handleTimeChange(i, 'startHour', e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                      >
                        <option value="">時</option>
                        {[...Array(37)].map((_, h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>:</span>
                      <select 
                        value={item.startMin} 
                        onChange={e => handleTimeChange(i, 'startMin', e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                      >
                        <option value="">分</option>
                        {[...Array(60)].map((_, m) => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ flex: '1', minWidth: '140px' }}>
                    <label style={{ fontSize: 'clamp(12px, 2vw, 14px)', display: 'block', marginBottom: '0.25rem' }}>終了時間</label>
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <select 
                        value={item.endHour} 
                        onChange={e => handleTimeChange(i, 'endHour', e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                      >
                        <option value="">時</option>
                        {[...Array(37)].map((_, h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: 'clamp(12px, 2vw, 14px)' }}>:</span>
                      <select 
                        value={item.endMin} 
                        onChange={e => handleTimeChange(i, 'endMin', e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', fontSize: 'clamp(12px, 2vw, 14px)' }}
                      >
                        <option value="">分</option>
                        {[...Array(60)].map((_, m) => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 'clamp(12px, 2vw, 14px)', display: 'block', marginBottom: '0.25rem', fontWeight: 'bold' }}>備考</label>
                  <textarea 
                    value={item.remarks} 
                    onChange={e => handleTimeChange(i, 'remarks', e.target.value)}
                    placeholder="例：朝遅刻予定、早退など"
                    style={{ 
                      width: '100%', 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      border: '2px solid #FF9800',
                      fontSize: 'clamp(12px, 2vw, 14px)',
                      minHeight: '60px',
                      fontFamily: 'inherit',
                      backgroundColor: '#FFF9E6'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} style={{ backgroundColor: '#1976D2', width: '100%', fontSize: 'clamp(14px, 3vw, 18px)', padding: '0.75rem' }}>送信</button>
        </div>
      </div>
    );
  }

  if (role === 'staff') {
    return (
      <div className="login-wrapper">
        <div className="login-card" style={{ position: 'relative' }}>
          <BackButton />
          <h2>アルバイトメニュー</h2>
          <div className="button-row" style={{ flexDirection: 'column', gap: '1rem' }}>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: '',
                managerAuth: managerAuth,
                managerStep: managerStep,
                isLoggedIn: true
              });
              setCurrentStep('shiftPeriod');
            }} style={{ backgroundColor: '#1E88E5' }}>新規提出</button>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: '',
                managerAuth: managerAuth,
                managerStep: managerStep,
                isLoggedIn: true
              });
              setCurrentStep('shiftView');
            }} style={{ backgroundColor: '#1976D2' }}>シフト確認</button>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: '',
                managerAuth: managerAuth,
                managerStep: managerStep,
                isLoggedIn: true
              });
              setCurrentStep('shiftEdit');
            }} style={{ backgroundColor: '#1565C0' }}>シフト変更</button>
            <button onClick={() => {
              pushToHistory({
                role: role,
                currentStep: '',
                managerAuth: managerAuth,
                managerStep: managerStep,
                isLoggedIn: true
              });
              setCurrentStep('workHours');
            }} style={{ backgroundColor: '#0D47A1' }}>就労時間</button>
            <button onClick={() => {
              window.open('https://docs.google.com/forms/d/e/1FAIpQLSci0UYQ7BKfXjhVj8x3WBR5ncFxxCo_lsV11kY5TaI15wlKSQ/viewform?usp=header', '_blank');
            }} style={{ backgroundColor: '#1554A5' }}>お問い合わせ</button>
          </div>
          <button onClick={() => {
            setRole('');
            setId('');
            setPassword('');
            setIsLoggedIn(false);
            setCurrentStep('');
            resetAllInputs();
            setNavigationHistory([]);
          }} style={{ backgroundColor: '#FF5722' }}>ログアウト</button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;