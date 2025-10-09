import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { AuthError } from '@supabase/supabase-js';

function RegisterUser({ onBack }) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(true);

  const handleRegister = async () => {
    if (!name || !number) {
      setMessage('名前と番号を入力してください');
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('manager_number', number);

    if (fetchError) {
      console.error(fetchError);
      setMessage('確認中にエラーが発生しました');
      return;
    }

    if (existing.length > 0) {
      setMessage('この番号はすでに登録されています');
      return;
    }

    const { error } = await supabase
      .from('users')
      .insert([{ name, manager_number: number }]);

    if (error) {
      console.error(error);
      setMessage('登録に失敗しました');
    } else {
      setMessage('登録が完了しました');
      setName('');
      setNumber('');
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error(error);
      setMessage('ユーザー取得に失敗しました');
    } else {
      setUsers(data);
      setShowConfirm(false);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('users').delete().eq('id', id);
    fetchUsers();
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>新人登録</h2>

        <label>名前:</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <label>管理番号:</label>
        <input
          type="text"
          value={number}
          onChange={e => setNumber(e.target.value)}
        />

        {message && <p style={{ color: 'red', marginTop: '0.5rem' }}>{message}</p>}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
          flexWrap: 'nowrap',
          overflowX: 'auto',
        }}>
          <button onClick={handleRegister}>登録</button>
          {showConfirm && <button onClick={fetchUsers}>番号確認</button>}
        </div>

        {users.length > 0 && (
          <>
            <div style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <h4 style={{ margin:'auto' }}>登録一覧</h4>
              <button
  onClick={fetchUsers}
  style={{
    fontSize: '0.75rem',
    padding: '0.2rem 0.4rem',  // 横パディングを少し狭く
    cursor: 'pointer',
    height: '24px',
    minWidth: 'auto',          // 幅を自動調整
    width: 'auto',
    whiteSpace: 'nowrap',      // テキストを1行に固定
  }}
  title="一覧を更新"
>
  更新
</button>

            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              marginTop: '6.0rem'
            }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc' }}>管理番号</th>
                  <th style={{ borderBottom: '1px solid #ccc' }}>名前</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.manager_number}</td>
                    <td>{user.name}</td>
                    <td>
                      <button onClick={() => handleDelete(user.id)} style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}>
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default RegisterUser;
