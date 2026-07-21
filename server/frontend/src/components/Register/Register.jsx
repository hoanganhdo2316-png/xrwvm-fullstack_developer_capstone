import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import './Register.css';

const initialForm = {
  userName: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (Object.values(form).some((value) => !value.trim())) {
      setMessage('All registration fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/djangoapp/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      sessionStorage.setItem('username', data.userName);
      sessionStorage.setItem('firstname', data.firstName || '');
      sessionStorage.setItem('lastname', data.lastName || '');
      navigate('/dealers');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return <><Header /><main className="auth-page">
    <form className="auth-form" onSubmit={submit}>
      <h1>Create your account</h1>
      {message && <div className="form-message error" role="alert">{message}</div>}
      <div className="form-row">
        <label>First name<input required name="firstName" autoComplete="given-name" value={form.firstName} onChange={update} /></label>
        <label>Last name<input required name="lastName" autoComplete="family-name" value={form.lastName} onChange={update} /></label>
      </div>
      <label>Username<input required name="userName" autoComplete="username" value={form.userName} onChange={update} /></label>
      <label>Email<input required name="email" type="email" autoComplete="email" value={form.email} onChange={update} /></label>
      <label>Password<input required minLength="8" name="password" type="password" autoComplete="new-password" value={form.password} onChange={update} /></label>
      <label>Confirm password<input required minLength="8" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update} /></label>
      <button className="primary-button" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
      <p>Already registered? <Link to="/login">Sign in</Link>.</p>
    </form>
  </main></>;
};

export default Register;
