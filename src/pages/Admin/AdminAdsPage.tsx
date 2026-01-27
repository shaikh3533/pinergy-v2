import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { Ad, League } from '../../lib/supabase';
import AdminLayout from '../../components/Admin/AdminLayout';
import { format } from 'date-fns';

const AdminAdsPage = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [upcomingLeagues, setUpcomingLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    image: '',
    link: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [adsRes, leaguesRes] = await Promise.all([
      supabase.from('ads').select('*').order('created_at', { ascending: false }),
      supabase.from('leagues').select('*').in('status', ['upcoming', 'registration']).order('date', { ascending: true }),
    ]);

    if (adsRes.data) setAds(adsRes.data);
    if (leaguesRes.data) setUpcomingLeagues(leaguesRes.data);
    
    setLoading(false);
  };

  const handleSaveAd = async () => {
    if (!adForm.title || !adForm.description) {
      toast.error('Please fill in title and description');
      return;
    }

    if (editingAd) {
      const { error } = await supabase.from('ads').update(adForm).eq('id', editingAd);
      if (error) {
        toast.error('Failed to update ad');
      } else {
        toast.success('Ad updated successfully');
      }
    } else {
      const { error } = await supabase.from('ads').insert(adForm);
      if (error) {
        toast.error('Failed to create ad');
      } else {
        toast.success('Ad created successfully');
      }
    }

    setAdForm({ title: '', description: '', image: '', link: '' });
    setEditingAd(null);
    fetchData();
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad.id);
    setAdForm({
      title: ad.title,
      description: ad.description,
      image: ad.image || '',
      link: ad.link || '',
    });
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Delete this ad?')) return;
    
    const { error } = await supabase.from('ads').delete().eq('id', adId);
    if (error) {
      toast.error('Failed to delete ad');
    } else {
      toast.success('Ad deleted');
      fetchData();
    }
  };

  return (
    <AdminLayout title="Ads & Events" subtitle="Manage advertisements and view upcoming events">
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading...</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upcoming Leagues/Tournaments */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">Upcoming Tournaments</h3>
              {upcomingLeagues.length === 0 ? (
                <div className="text-gray-400 text-center py-6">
                  No upcoming tournaments
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingLeagues.map((league) => (
                    <div key={league.id} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-white">{league.name}</h4>
                          <p className="text-sm text-gray-400">
                            {league.date 
                              ? format(new Date(league.date), 'EEEE, MMMM d, yyyy')
                              : 'Date TBD'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          league.status === 'registration' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-600 text-gray-200'
                        }`}>
                          {league.status === 'registration' ? 'Registration Open' : 'Upcoming'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Max {league.max_players} players • {
                          league.league_type === 'round_robin_knockouts' 
                            ? 'Round Robin + Knockouts' 
                            : league.league_type
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4">
                These will automatically appear on the Events page
              </p>
            </div>
          </div>

          {/* Ads Management */}
          <div className="space-y-6">
            {/* Create/Edit Form */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">
                {editingAd ? 'Edit Ad' : 'Create New Ad'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input
                    type="text"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Ad title"
                  />
                </div>
                <div>
                  <label className="label">Description *</label>
                  <textarea
                    value={adForm.description}
                    onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    placeholder="Ad description"
                  />
                </div>
                <div>
                  <label className="label">Image URL (optional)</label>
                  <input
                    type="url"
                    value={adForm.image}
                    onChange={(e) => setAdForm({ ...adForm, image: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="label">Link (optional)</label>
                  <input
                    type="url"
                    value={adForm.link}
                    onChange={(e) => setAdForm({ ...adForm, link: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveAd} className="btn-primary flex-1">
                    {editingAd ? 'Update Ad' : 'Create Ad'}
                  </button>
                  {editingAd && (
                    <button
                      onClick={() => {
                        setEditingAd(null);
                        setAdForm({ title: '', description: '', image: '', link: '' });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Existing Ads */}
            <div className="card">
              <h3 className="text-xl font-bold text-white mb-4">Current Ads</h3>
              {ads.length === 0 ? (
                <div className="text-gray-400 text-center py-6">No ads yet</div>
              ) : (
                <div className="space-y-3">
                  {ads.map((ad) => (
                    <div key={ad.id} className="bg-gray-800 rounded-lg p-4">
                      {ad.image && (
                        <img
                          src={ad.image}
                          alt={ad.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-bold text-white">{ad.title}</h4>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">{ad.description}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleEditAd(ad)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1 transition"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm flex items-center gap-1 transition"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAdsPage;
