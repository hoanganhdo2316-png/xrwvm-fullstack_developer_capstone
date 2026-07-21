import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import '../assets/bootstrap.min.css';
import '../assets/style.css';

const Header = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(sessionStorage.getItem('username') || '');
  useEffect(() => {
    let active = true;
    fetch('/djangoapp/loginstatus').then((res) => res.json()).then((data) => {
      if (!active) return;
      if (data.isAuthenticated) {
        sessionStorage.setItem('username', data.userName);
        setUsername(data.userName);
      } else if (sessionStorage.getItem('username')) {
        sessionStorage.removeItem('username');
        setUsername('');
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  const logout = async () => {
    try { await fetch('/djangoapp/logout', { method: 'POST' }); } finally {
      ['username', 'firstname', 'lastname'].forEach((key) => sessionStorage.removeItem(key));
      setUsername('');
      navigate('/');
    }
  };
  return <header className="site-header">
    <nav className="navbar navbar-expand-lg navbar-light container-fluid" aria-label="Primary navigation">
      <Link className="navbar-brand" to="/">Best Cars</Link>
      <div className="navbar-nav main-nav">
        <NavLink className="nav-link" to="/">Home</NavLink>
        <NavLink className="nav-link" to="/about">About Us</NavLink>
        <NavLink className="nav-link" to="/contact">Contact Us</NavLink>
        <NavLink className="nav-link" to="/dealers">Dealers</NavLink>
      </div>
      <div className="auth-nav">
        {username ? <><span className="username">{username}</span><button className="link-button" onClick={logout}>Logout</button></>
          : <><Link to="/login">Login</Link><Link to="/register">Register</Link></>}
      </div>
    </nav>
  </header>;
};
export default Header;
