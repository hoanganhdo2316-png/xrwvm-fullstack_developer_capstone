import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import positive from '../assets/positive.png'; import neutral from '../assets/neutral.png'; import negative from '../assets/negative.png';
import './Dealers.css';
const icons = { positive, neutral, negative };
const Dealer = () => {
  const { id } = useParams(); const [dealer,setDealer]=useState(null); const [reviews,setReviews]=useState([]);
  const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{ let active=true; Promise.all([fetch(`/djangoapp/dealer/${id}`),fetch(`/djangoapp/reviews/dealer/${id}`)]).then(async ([d,r])=>{const dealerData=await d.json(); const reviewData=await r.json(); if(!d.ok) throw new Error(dealerData.error||'Dealer not found.'); if(!r.ok) throw new Error(reviewData.error||'Reviews could not be loaded.'); if(active){setDealer(dealerData.dealer?.[0]);setReviews(reviewData.reviews||[]);}}).catch((err)=>active&&setError(err.message)).finally(()=>active&&setLoading(false)); return()=>{active=false};},[id]);
  return <><Header/><main className="dealers-page">{loading?<div className="status-panel">Loading dealership...</div>:error?<div className="status-panel error" role="alert">{error}</div>:!dealer?<div className="status-panel">Dealership not found.</div>:<><div className="dealer-heading"><div><p className="eyebrow">Dealer profile</p><h1>{dealer.full_name}</h1><p>{dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}</p></div>{sessionStorage.getItem('username')?<Link className="primary-button" to={`/postreview/${id}`}>Write a review</Link>:<Link to="/login">Sign in to review</Link>}</div><section><h2>Customer reviews</h2>{reviews.length===0?<div className="status-panel">No reviews yet. Be the first to share your experience.</div>:<div className="reviews-grid">{reviews.map((review)=><article className="review-panel" key={review.id}><img src={icons[review.sentiment]||neutral} alt={`${review.sentiment||'neutral'} sentiment`}/><p>{review.review}</p><footer><strong>{review.name||'Anonymous'}</strong><span>{[review.car_year,review.car_make,review.car_model].filter(Boolean).join(' ')}</span><span>{review.purchase_date||''}</span></footer></article>)}</div>}</section></>}</main></>;
};
export default Dealer;
