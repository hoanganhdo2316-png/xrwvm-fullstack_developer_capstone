import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import './Dealers.css';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loggedIn = Boolean(sessionStorage.getItem('username'));

  const load = async (state = 'All') => {
    setLoading(true);
    setError('');

    try {
      const endpoint =
        state === 'All'
          ? '/djangoapp/get_dealers'
          : `/djangoapp/get_dealers/${encodeURIComponent(state)}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to load dealerships.');
      }

      const dealerList = data.dealers || [];
      setDealers(dealerList);

      if (state === 'All') {
        setStates(
          [...new Set(dealerList.map((dealer) => dealer.state).filter(Boolean))].sort()
        );
      }
    } catch (err) {
      setError(err.message);
      setDealers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Header />

      <main className="dealers-page">
        <div className="list-heading">
          <div>
            <p className="eyebrow">Nationwide directory</p>
            <h1>Dealerships</h1>
          </div>

          <label>
            Filter by state
            <select
              defaultValue="All"
              onChange={(event) => load(event.target.value)}
            >
              <option value="All">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="status-panel">Loading dealerships...</div>
        ) : error ? (
          <div className="status-panel error" role="alert">
            {error}
          </div>
        ) : dealers.length === 0 ? (
          <div className="status-panel">
            No dealerships match this filter.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dealer</th>
                  <th>City</th>
                  <th>Address</th>
                  <th>ZIP</th>
                  <th>State</th>
                  {loggedIn && <th>Review Dealer</th>}
                </tr>
              </thead>

              <tbody>
                {dealers.map((dealer) => (
                  <tr key={dealer.id}>
                    <td>{dealer.id}</td>

                    <td>
                      <Link to={`/dealer/${dealer.id}`}>
                        {dealer.full_name}
                      </Link>
                    </td>

                    <td>{dealer.city}</td>
                    <td>{dealer.address}</td>
                    <td>{dealer.zip}</td>
                    <td>{dealer.state}</td>

                    {loggedIn && (
                      <td>
                        <Link to={`/postreview/${dealer.id}`}>
                          Review Dealer
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
};

export default Dealers;
