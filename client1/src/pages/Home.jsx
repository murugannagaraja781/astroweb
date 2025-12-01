import { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import MobileHome from './mobile/MobileHome';
import DesktopHome from './desktop/DesktopHome';

const Home = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAstrologers();
    fetchBanners();

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

  const fetchBanners = async () => {
    try {
      // Detect device type
      const width = window.innerWidth;
      let deviceType = 'desktop';
      if (width < 768) deviceType = 'mobile';
      else if (width < 1024) deviceType = 'tablet';

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/banners`, {
        params: { deviceType, position: 'home_top' }
      });
      setBanners(res.data);
    } catch (err) {
      console.error('Error fetching banners:', err);
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileHome astrologers={astrologers} banners={banners} loading={loading} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <DesktopHome astrologers={astrologers} banners={banners} loading={loading} />
      </div>
    </>
  );
};

export default Home;
