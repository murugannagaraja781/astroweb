import { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import MobileHome from './mobile/MobileHome';
import DesktopHome from './desktop/DesktopHome';

const Home = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAstrologers();

    // Socket connection for real-time updates
    const socket = io(import.meta.env.VITE_API_URL);

    socket.on('astrologerStatusUpdate', ({ astrologerId, isOnline }) => {
      setAstrologers(prev => prev.map(astro => {
        if (astro._id === astrologerId) {
          return {
            ...astro,
            profile: {
              ...astro.profile,
              isOnline
            }
          };
        }
        return astro;
      }));
    });

    return () => {
      socket.disconnect();
    };
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
