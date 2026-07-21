import { Link } from 'react-router-dom';
import Header from '../Header/Header';
const Home = () => <><Header/><main className="hero"><div className="hero-copy"><p className="eyebrow">Find your next vehicle</p><h1>Trusted dealerships, honest customer reviews.</h1><p>Browse dealers across the United States and learn from verified purchase experiences.</p><Link className="primary-button" to="/dealers">Explore dealerships</Link></div><div className="hero-photo" role="img" aria-label="Cars at a dealership" /></main></>;
export default Home;
