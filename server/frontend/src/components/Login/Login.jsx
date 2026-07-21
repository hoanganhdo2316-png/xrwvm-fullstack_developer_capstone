import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ userName: '', password: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setMessage('');
    if (!form.userName.trim() || !form.password) return setMessage('Username and password are required.');
    setBusy(true);
    try {
      const res = await fetch('/djangoapp/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      sessionStorage.setItem('username', data.userName);
      sessionStorage.setItem('firstname', data.firstName || '');
      sessionStorage.setItem('lastname', data.lastName || '');
      navigate('/dealers');
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  return <><Header/><main className="auth-page"><form className="auth-form" onSubmit={submit}><h1>Welcome back</h1><p>Sign in to post dealership reviews.</p>{message && <div className="form-message error" role="alert">{message}</div>}<label>Username<input autoComplete="username" value={form.userName} onChange={(e)=>setForm({...form,userName:e.target.value})}/></label><label>Password<input type="password" autoComplete="current-password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/></label><button className="primary-button" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button><p>New here? <Link to="/register">Create an account</Link>.</p></form></main></>;
};
export default Login;
