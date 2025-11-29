import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const OffersList = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/offers`);
        setOffers(res.data);
      } catch (err) {
        console.error('Failed to fetch offers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) return <div className="h-24 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div></div>;
  if (offers.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 px-4">
        <Gift className="text-purple-600" size={20} />
        <span>Special Offers</span>
      </h3>
      <div className="flex overflow-x-auto gap-4 pb-4 px-4 scrollbar-hide -mx-4 md:mx-0">
        {offers.map((offer, index) => (
          <motion.div
            key={offer._id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-72 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-4 text-white relative overflow-hidden shadow-lg"
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-10 rounded-full -ml-8 -mb-8"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  {offer.type === 'percentage' ? `${offer.discount}% OFF` : `₹${offer.discount} OFF`}
                </span>
                <Gift className="text-white opacity-80" size={20} />
              </div>

              <h4 className="font-bold text-lg mb-1 truncate">{offer.title}</h4>
              <p className="text-purple-100 text-xs mb-3 line-clamp-2">{offer.description}</p>

              <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/10">
                <code className="font-mono font-bold text-yellow-300 tracking-wider">{offer.code}</code>
                <button
                  onClick={() => copyToClipboard(offer.code)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                >
                  {copiedCode === offer.code ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-white" />}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OffersList;
