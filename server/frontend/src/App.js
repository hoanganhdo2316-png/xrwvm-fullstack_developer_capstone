import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './components/Pages/Home';
import About from './components/Pages/About';
import Contact from './components/Pages/Contact';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Dealers from './components/Dealers/Dealers';
import Dealer from './components/Dealers/Dealer';
import PostReview from './components/Dealers/PostReview';
import './App.css';

function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/dealers" element={<Dealers />} />
    <Route path="/dealer/:id" element={<Dealer />} />
    <Route path="/postreview/:id" element={<PostReview />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
export default App;
