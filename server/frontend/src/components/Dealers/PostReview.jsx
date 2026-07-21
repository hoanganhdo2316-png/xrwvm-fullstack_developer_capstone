import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import './Dealers.css';

const initialForm = { review: '', purchase: true, purchase_date: '', car: '', car_year: '' };

const PostReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const validDealerId = /^\d+$/.test(id) && Number(id) > 0;

  useEffect(() => {
    if (!validDealerId) {
      setLoadError('Invalid dealer ID.');
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    Promise.all([
      fetch(`/djangoapp/dealer/${id}`, { signal: controller.signal }),
      fetch('/djangoapp/get_cars', { signal: controller.signal }),
    ]).then(async ([dealerResponse, carsResponse]) => {
      const dealerData = await dealerResponse.json();
      const carsData = await carsResponse.json();
      if (!dealerResponse.ok) throw new Error(dealerData.error || 'Dealer not found.');
      if (!carsResponse.ok) throw new Error(carsData.error || 'Vehicles could not be loaded.');
      setDealer(dealerData.dealer?.[0] || null);
      setCars(carsData.CarModels || []);
    }).catch((error) => {
      if (error.name !== 'AbortError') setLoadError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [id, validDealerId]);

  if (!sessionStorage.getItem('username')) return <Navigate to="/login" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setSubmitError('');
    const car = cars.find((item) => `${item.CarMake}|${item.CarModel}|${item.CarYear}` === form.car);
    if (!car || !form.review.trim() || !form.car_year || (form.purchase && !form.purchase_date)) {
      setSubmitError('Review, vehicle details, and the applicable purchase date are required.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/djangoapp/add_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealership: Number(id), review: form.review.trim(), purchase: form.purchase,
          purchase_date: form.purchase ? form.purchase_date : '', car_make: car.CarMake,
          car_model: car.CarModel, car_year: Number(form.car_year),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Review could not be posted.');
      navigate(`/dealer/${id}`, { replace: true });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return <><Header /><main className="auth-page">
    {loading ? <div className="status-panel">Loading review form...</div>
      : loadError || !dealer ? <div className="status-panel error" role="alert">{loadError || 'Dealer not found.'}</div>
        : <form className="auth-form review-form" onSubmit={submit}>
          <p className="eyebrow">Share your experience</p>
          <h1>Review {dealer.full_name}</h1>
          {submitError && <div className="form-message error" role="alert">{submitError}</div>}
          <label>Your review<textarea required maxLength="5000" rows="6" value={form.review} onChange={(event) => setForm({ ...form, review: event.target.value })} /></label>
          <label className="checkbox-field"><input type="checkbox" checked={form.purchase} onChange={(event) => setForm({ ...form, purchase: event.target.checked, purchase_date: event.target.checked ? form.purchase_date : '' })} />I purchased this vehicle</label>
          {form.purchase && <label>Purchase date<input required type="date" max={new Date().toISOString().slice(0, 10)} value={form.purchase_date} onChange={(event) => setForm({ ...form, purchase_date: event.target.value })} /></label>}
          <label>Vehicle<select required value={form.car} onChange={(event) => {
            const value = event.target.value;
            const selected = cars.find((item) => `${item.CarMake}|${item.CarModel}|${item.CarYear}` === value);
            setForm({ ...form, car: value, car_year: selected?.CarYear || '' });
          }}><option value="">Choose make and model</option>{cars.map((car) => <option key={`${car.CarMake}-${car.CarModel}-${car.CarYear}`} value={`${car.CarMake}|${car.CarModel}|${car.CarYear}`}>{car.CarMake} {car.CarModel} ({car.CarYear})</option>)}</select></label>
          <label>Vehicle year<input required type="number" min="2015" max={new Date().getFullYear() + 1} value={form.car_year} onChange={(event) => setForm({ ...form, car_year: event.target.value })} /></label>
          <button className="primary-button" disabled={busy}>{busy ? 'Posting...' : 'Post review'}</button>
        </form>}
  </main></>;
};

export default PostReview;
