import { useState, useEffect } from 'react';
import axios from 'axios';
import MobileHome from './MobileHome';
import DesktopHome from './DesktopHome';

const Home = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/astrologers`);
      setAstrologers(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching astrologers:', err);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileHome astrologers={astrologers} loading={loading} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <DesktopHome astrologers={astrologers} loading={loading} />
      </div>
    </>
  );
};

export default Home;
