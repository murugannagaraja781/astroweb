import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AdminDashboard = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', languages: '', specialties: '', ratePerMinute: 10, bio: ''
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchAstrologers();
  }, []);

  const fetchAstrologers = async () => {
    try {
      const res = await axios.get('https://astroweb-y0i6.onrender.com/api/admin/astrologers');
      setAstrologers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/astrologer`, {
        ...formData,
        languages: formData.languages.split(','),
        specialties: formData.specialties.split(',')
      });
      fetchAstrologers();
      alert('Astrologer added');
      setFormData({ name: '', email: '', password: '', languages: '', specialties: '', ratePerMinute: 10, bio: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add astrologer');
    }
  };

  const removeAstrologer = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/astrologer/${id}`);
        fetchAstrologers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Add Astrologer</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={onChange} className="p-2 border rounded" required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={onChange} className="p-2 border rounded" required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={onChange} className="p-2 border rounded" required />
          <input type="text" name="languages" placeholder="Languages (comma separated)" value={formData.languages} onChange={onChange} className="p-2 border rounded" />
          <input type="text" name="specialties" placeholder="Specialties (comma separated)" value={formData.specialties} onChange={onChange} className="p-2 border rounded" />
          <input type="number" name="ratePerMinute" placeholder="Rate/Min" value={formData.ratePerMinute} onChange={onChange} className="p-2 border rounded" />
          <textarea name="bio" placeholder="Bio" value={formData.bio} onChange={onChange} className="p-2 border rounded md:col-span-2"></textarea>
          <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600 md:col-span-2">Add Astrologer</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Astrologers List</h2>
        <ul>
          {astrologers.map(astro => (
            <li key={astro._id} className="border-b p-2 flex justify-between items-center">
              <div>
                <p className="font-bold">{astro.name} ({astro.email})</p>
                <p className="text-sm text-gray-600">
                  {astro.profile?.languages.join(', ')} | {astro.profile?.specialties.join(', ')} | ₹{astro.profile?.ratePerMinute}/min
                </p>
              </div>
              <button onClick={() => removeAstrologer(astro._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboard;
