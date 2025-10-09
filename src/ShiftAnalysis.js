import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function ShiftAnalysis({ onBack }) {
  const [users, setUsers] = useState([]);
  const [shiftData, setShiftData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState('yearly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUser, setSelectedUser] = useState('all');
  const [analysisData, setAnalysisData] = useState({});
  const [previousState, setPreviousState] = useState(null);

  // カラーパレット
  const colors = {
    primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'],
    background: ['#FFF5F5', '#F0FDFA', '#F0F9FF', '#F0FDF4', '#FFFBEB', '#FAF5FF', '#ECFDF5', '#FEFCE8'],
    gradients: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ]
  };

  useEffect(() => {
    fetchUsers();
    fetchShiftData();
  }, []);

  useEffect(() => {
    if (shiftData.length > 0) {
      calculateAnalysis();
    }
  }, [shiftData, selectedYear, selectedUser, viewType]);

  const saveState = () => {
    setPreviousState({
      viewType,
      selectedYear,
      selectedUser
    });
  };

  const goBackToPrevious = () => {
    if (previousState) {
      setViewType(previousState.viewType);
      setSelectedYear(previousState.selectedYear);
      setSelectedUser(previousState.selectedUser);
      setPreviousState(null);
    } else {
      onBack();
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('manager_number');

      if (error) {
        console.error('ユーザー取得エラー:', error);
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
    }
  };

  const fetchShiftData = async () => {
    setLoading(true);
    try {
      const { data: finalShifts, error } = await supabase
        .from('final_shifts')
        .select('*')
        .order('date');

      if (error) {
        console.error('シフトデータ取得エラー:', error);
        return;
      }

      setShiftData(finalShifts || []);
    } catch (error) {
      console.error('シフトデータ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkingHours = (startTime, endTime) => {
    if (!startTime || !endTime || startTime === '00:00' && endTime === '00:00') return 0;
    
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return (end - start) / (1000 * 60 * 60); // 時間単位
  };

  const getUserName = (managerNumber) => {
    const user = users.find(u => u.manager_number === managerNumber);
    return user ? user.name : `ユーザー${managerNumber}`;
  };

  const calculateAnalysis = () => {
    const currentDate = new Date();
    const analysisResult = {};

    // ユーザーごとの分析
    users.forEach(user => {
      const userShifts = shiftData.filter(shift => 
        shift.manager_number === user.manager_number &&
        !shift.is_off &&
        shift.start_time &&
        shift.end_time
      );

      const yearlyHours = userShifts
        .filter(shift => new Date(shift.date).getFullYear() === selectedYear)
        .reduce((total, shift) => total + calculateWorkingHours(shift.start_time, shift.end_time), 0);

      // 月別データ
      const monthlyData = {};
      for (let month = 1; month <= 12; month++) {
        const monthlyHours = userShifts
          .filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate.getFullYear() === selectedYear && shiftDate.getMonth() + 1 === month;
          })
          .reduce((total, shift) => total + calculateWorkingHours(shift.start_time, shift.end_time), 0);
        monthlyData[month] = monthlyHours;
      }

      // 週別データ（直近12週間）
      const weeklyData = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay()) - (7 * i));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weeklyHours = userShifts
          .filter(shift => {
            const shiftDate = new Date(shift.date);
            return shiftDate >= weekStart && shiftDate <= weekEnd;
          })
          .reduce((total, shift) => total + calculateWorkingHours(shift.start_time, shift.end_time), 0);

        weeklyData.push({
          week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          hours: weeklyHours
        });
      }

      analysisResult[user.manager_number] = {
        name: user.name,
        yearlyHours,
        monthlyData,
        weeklyData,
        totalShifts: userShifts.filter(shift => new Date(shift.date).getFullYear() === selectedYear).length
      };
    });

    setAnalysisData(analysisResult);
  };

  const handleFilterChange = (filterType, value) => {
    saveState();
    switch(filterType) {
      case 'viewType':
        setViewType(value);
        break;
      case 'year':
        setSelectedYear(parseInt(value));
        break;
      case 'user':
        setSelectedUser(value);
        break;
    }
  };

  const renderYearlyView = () => {
    if (selectedUser === 'all') {
      const usersList = Object.values(analysisData);
      
      return (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            background: colors.gradients[1],
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedYear}年 勤務時間一覧</h3>
          </div>
          
          <div style={{ 
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
          }}>
            {usersList.map((user, index) => (
              <div key={user.name} style={{
                background: `linear-gradient(135deg, ${colors.background[index % colors.background.length]} 0%, white 100%)`,
                border: `3px solid ${colors.primary[index % colors.primary.length]}`,
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: colors.primary[index % colors.primary.length]
                  }}>
                    {user.name}
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#FF6B6B' }}>
                      {user.yearlyHours.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>時間</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ECDC4' }}>
                      {user.totalShifts}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>回</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#45B7D1' }}>
                      {user.totalShifts > 0 ? (user.yearlyHours / user.totalShifts).toFixed(1) : '0'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>h/回</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      const userData = analysisData[selectedUser];
      if (!userData) return <div>データがありません</div>;

      return (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            background: colors.gradients[2],
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
              {userData.name}さんの{selectedYear}年勤務実績
            </h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: colors.gradients[0],
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {userData.yearlyHours.toFixed(1)}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>総勤務時間（時間）</div>
            </div>
            
            <div style={{
              background: colors.gradients[3],
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {userData.totalShifts}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>総シフト回数</div>
            </div>
            
            <div style={{
              background: colors.gradients[4],
              padding: '2rem',
              borderRadius: '16px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
            }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {userData.totalShifts > 0 ? (userData.yearlyHours / userData.totalShifts).toFixed(1) : '0'}
              </div>
              <div style={{ fontSize: '1rem', opacity: 0.9 }}>平均勤務時間/回（時間）</div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderMonthlyView = () => {
    if (selectedUser === 'all') {
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      
      return (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            background: colors.gradients[5],
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedYear}年 月別勤務時間比較</h3>
          </div>
          
          <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ background: colors.gradients[6] }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    position: 'sticky', 
                    left: 0, 
                    background: colors.gradients[6],
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    名前
                  </th>
                  {months.map((month, index) => (
                    <th key={month} style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      minWidth: '80px',
                      color: 'white',
                      fontSize: '0.9rem',
                      background: `linear-gradient(135deg, ${colors.primary[index % colors.primary.length]} 0%, ${colors.primary[(index + 1) % colors.primary.length]} 100%)`
                    }}>
                      {month}
                    </th>
                  ))}
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'center',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>合計</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(analysisData).map((user, userIndex) => (
                  <tr key={user.name} style={{
                    backgroundColor: userIndex % 2 === 0 ? 'white' : '#f8fffe'
                  }}>
                    <td style={{ 
                      padding: '1rem', 
                      fontWeight: 'bold',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: userIndex % 2 === 0 ? 'white' : '#f8fffe',
                      color: colors.primary[userIndex % colors.primary.length],
                      fontSize: '1rem'
                    }}>
                      {user.name}
                    </td>
                    {months.map((month, monthIndex) => {
                      const hours = user.monthlyData[monthIndex + 1] || 0;
                      return (
                        <td key={month} style={{ 
                          padding: '1rem', 
                          textAlign: 'center',
                          color: hours > 0 ? colors.primary[monthIndex % colors.primary.length] : '#999',
                          fontWeight: hours > 0 ? 'bold' : 'normal',
                          fontSize: hours > 0 ? '1rem' : '0.9rem'
                        }}>
                          {hours > 0 ? `${hours.toFixed(1)}h` : '-'}
                        </td>
                      );
                    })}
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      backgroundColor: colors.background[userIndex % colors.background.length],
                      color: colors.primary[userIndex % colors.primary.length],
                      fontSize: '1.1rem'
                    }}>
                      {user.yearlyHours.toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      const userData = analysisData[selectedUser];
      if (!userData) return <div>データがありません</div>;

      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      const maxHours = Math.max(...Object.values(userData.monthlyData));

      return (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            background: colors.gradients[7],
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
              {userData.name}さんの{selectedYear}年 月別勤務時間
            </h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {months.map((month, index) => {
              const hours = userData.monthlyData[index + 1] || 0;
              const percentage = maxHours > 0 ? (hours / maxHours) * 100 : 0;
              
              return (
                <div key={month} style={{
                  background: colors.background[index % colors.background.length],
                  border: `3px solid ${colors.primary[index % colors.primary.length]}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  textAlign: 'center',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
                >
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '1rem',
                    color: colors.primary[index % colors.primary.length],
                    fontSize: '1rem'
                  }}>
                    {month}
                  </div>
                  <div style={{
                    height: '120px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    position: 'relative',
                    marginBottom: '1rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${Math.max(percentage, hours > 0 ? 10 : 0)}%`,
                      background: hours > 0 ? colors.gradients[index % colors.gradients.length] : '#ddd',
                      borderRadius: '8px',
                      transition: 'height 0.5s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {hours > 0 && percentage > 15 ? `${hours.toFixed(1)}h` : ''}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: hours > 0 ? colors.primary[index % colors.primary.length] : '#999'
                  }}>
                    {hours > 0 ? `${hours.toFixed(1)}h` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const renderWeeklyView = () => {
    if (selectedUser === 'all') {
      const weekLabels = analysisData[Object.keys(analysisData)[0]]?.weeklyData.map(w => w.week) || [];
      
      return (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            background: colors.gradients[0],
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>直近12週間の勤務時間推移</h3>
          </div>
          
          <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              backgroundColor: 'white'
            }}>
              <thead>
                <tr style={{ background: colors.gradients[2] }}>
                  <th style={{ 
                    padding: '1rem', 
                    textAlign: 'left', 
                    position: 'sticky', 
                    left: 0, 
                    background: colors.gradients[2],
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}>
                    名前
                  </th>
                  {weekLabels.map((week, index) => (
                    <th key={week} style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center', 
                      minWidth: '70px',
                      color: 'white',
                      fontSize: '0.8rem',
                      background: `linear-gradient(135deg, ${colors.primary[index % colors.primary.length]} 0%, ${colors.primary[(index + 1) % colors.primary.length]} 100%)`
                    }}>
                      {week}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(analysisData).map((user, userIndex) => (
                  <tr key={user.name} style={{
                    backgroundColor: userIndex % 2 === 0 ? 'white' : '#f8fffe'
                  }}>
                    <td style={{ 
                      padding: '1rem', 
                      fontWeight: 'bold',
                      position: 'sticky',
                      left: 0,
                      backgroundColor: userIndex % 2 === 0 ? 'white' : '#f8fffe',
                      color: colors.primary[userIndex % colors.primary.length],
                      fontSize: '1rem'
                    }}>
                      {user.name}
                    </td>
                    {user.weeklyData.map((weekData, weekIndex) => (
                      <td key={weekIndex} style={{ 
                        padding: '0.75rem', 
                        textAlign: 'center',
                        color: weekData.hours > 0 ? colors.primary[weekIndex % colors.primary.length] : '#999',
                        fontWeight: weekData.hours > 0 ? 'bold' : 'normal'
                      }}>
                        {weekData.hours > 0 ? weekData.hours.toFixed(1) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      const userData = analysisData[selectedUser];
      if (!userData) return <div>データがありません</div>;

      const maxWeeklyHours = Math.max(...userData.weeklyData.map(w => w.hours));

      return (
        <div style={{ marginTop: '2rem' }}>
          <div style={{
            background: colors.gradients[3],
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
              {userData.name}さんの直近12週間勤務時間
            </h3>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-between',
            gap: '0.5rem',
            padding: '3rem 2rem 2rem',
            backgroundColor: 'white',
            border: '3px solid #4ECDC4',
            borderRadius: '16px',
            overflowX: 'auto',
            boxShadow: '0 12px 30px rgba(0,0,0,0.1)'
          }}>
            {userData.weeklyData.map((weekData, index) => {
              const percentage = maxWeeklyHours > 0 ? (weekData.hours / maxWeeklyHours) * 100 : 0;
              
              return (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '70px',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <div style={{
                    width: '50px',
                    height: `${Math.max(percentage * 2, weekData.hours > 0 ? 30 : 10)}px`,
                    background: weekData.hours > 0 ? colors.gradients[index % colors.gradients.length] : '#ddd',
                    borderRadius: '8px 8px 0 0',
                    marginBottom: '1rem',
                    transition: 'height 0.5s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    boxShadow: weekData.hours > 0 ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                  }}>
                    {weekData.hours > 0 && percentage > 20 ? `${weekData.hours.toFixed(1)}` : ''}
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    textAlign: 'center',
                    color: weekData.hours > 0 ? colors.primary[index % colors.primary.length] : '#999',
                    marginBottom: '0.5rem',
                    fontWeight: 'bold'
                  }}>
                    {weekData.hours > 0 ? `${weekData.hours.toFixed(1)}h` : '-'}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#666',
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {weekData.week}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const renderCurrentView = () => {
    switch(viewType) {
      case 'yearly':
        return renderYearlyView();
      case 'monthly':
        return renderMonthlyView();
      case 'weekly':
        return renderWeeklyView();
      default:
        return renderYearlyView();
    }
  };

  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <h2>シフト分析</h2>
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            background: colors.gradients[0],
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '1.2rem' }}>データを読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-card" style={{ width: '95vw', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{
          background: colors.gradients[1],
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>📊 シフト分析ダッシュボード</h2>
        </div>
        
        {/* フィルター */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.8rem', 
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '1rem'
            }}>
              📋 表示タイプ
            </label>
            <select 
              value={viewType} 
              onChange={(e) => handleFilterChange('viewType', e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '3px solid #3498db',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2980b9'}
              onBlur={(e) => e.target.style.borderColor = '#3498db'}
            >
              <option value="yearly">📊 年間総計</option>
              <option value="monthly">📅 月別詳細</option>
              <option value="weekly">📈 週別推移</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.8rem', 
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '1rem'
            }}>
              🗓️ 年度
            </label>
            <select 
              value={selectedYear} 
              onChange={(e) => handleFilterChange('year', e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '3px solid #e74c3c',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#c0392b'}
              onBlur={(e) => e.target.style.borderColor = '#e74c3c'}
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.8rem', 
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '1rem'
            }}>
              👤 対象者
            </label>
            <select 
              value={selectedUser} 
              onChange={(e) => handleFilterChange('user', e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                border: '3px solid #2ecc71',
                borderRadius: '12px',
                fontSize: '1rem',
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#27ae60'}
              onBlur={(e) => e.target.style.borderColor = '#2ecc71'}
            >
              <option value="all">👥 全員</option>
              {users.map(user => (
                <option key={user.manager_number} value={user.manager_number}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 分析結果表示 */}
        {Object.keys(analysisData).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            background: colors.gradients[4],
            borderRadius: '16px',
            color: 'white'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>シフトデータがありません</div>
            <div style={{ fontSize: '1rem', opacity: 0.8 }}>データが入力されると、ここに分析結果が表示されます</div>
          </div>
        ) : (
          renderCurrentView()
        )}

        {/* 戻るボタン */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <button 
            onClick={goBackToPrevious}
            style={{
              background: colors.gradients[7],
              color: 'white',
              padding: '1rem 3rem',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              boxShadow: '0 8px 20px rgba(197, 126, 126, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 25px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
            }}
          >
            {previousState ? '← 前の設定に戻る' : '← メニューに戻る'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShiftAnalysis;