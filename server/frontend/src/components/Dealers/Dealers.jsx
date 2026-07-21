import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import reviewIcon from '../assets/reviewicon.png';
import './Dealers.css';

const Dealers = () => {
  const [dealers, setDealers] = useState([]); const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const loggedIn = Boolean(sessionStorage.getItem('username'));
  const load = async (state='All') => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/djangoapp/get_dealers${state === 'All' ? '' : `/${encodeURIComponent(state)}`}`);
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Unable to load dealerships.');
      setDealers(data.dealers || []);
      if (state === 'All') setStates([...new Set((data.dealers || []).map((dealer)=>dealer.state).filter(Boolean))].sort());
    } catch (err) { setError(err.message); setDealers([]); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <><Header/><main className="dealers-page"><div className="list-heading"><div><p className="eyebrow">Nationwide directory</p><h1>Dealerships</h1></div><label>Filter by state<select defaultValue="All" onChange={(e)=>load(e.target.value)}><option value="All">All states</option>{states.map((state)=><option key={state}>{state}</option>)}</select></label></div>{loading ? <div className="status-panel">Loading dealerships...</div> : error ? <div className="status-panel error" role="alert">{error}</div> : dealers.length === 0 ? <div className="status-panel">No dealerships match this filter.</div> : <div className="table-wrap"><table><thead><tr><th>Dealer</th><th>Location</th><th>Address</th><th>ZIP</th>{loggedIn && <th>Review</th>}</tr></thead><tbody>{dealers.map((dealer)=><tr key={dealer.id}><td><Link to={`/dealer/${dealer.id}`}>{dealer.full_name}</Link></td><td>{dealer.city}, {dealer.state}</td><td>{dealer.address}</td><td>{dealer.zip}</td>{loggedIn && <td><Link to={`/postreview/${dealer.id}`} aria-label={`Review ${dealer.full_name}`}><img className="review-icon" src={reviewIcon} alt=""/></Link></td>}</tr>)}</tbody></table></div>}</main></>;
};
export default Dealers;
