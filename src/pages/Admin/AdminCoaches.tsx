import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaImage,
  FaVideo,
  FaCalendarAlt,
  FaSave,
  FaTimes,
  FaUser,
  FaUsers,
  FaClock,
  FaCheck
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { Coach, CoachMedia, CoachingSession, SessionType, DayType, SkillLevel } from '../../lib/supabase';
import AdminLayout from '../../components/Admin/AdminLayout';

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DAY_TYPES: { value: DayType; label: string; days: string }[] = [
  { value: 'weekday', label: 'Weekdays', days: 'Tue, Wed, Thu' },
  { value: 'weekend', label: 'Weekends', days: 'Fri, Sat, Sun' },
  { value: 'all', label: 'All Days', days: 'Mon - Sun' },
];

const AdminCoaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'coaches' | 'sessions'>('coaches');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coachSessions, setCoachSessions] = useState<CoachingSession[]>([]);
  const [coachMedia, setCoachMedia] = useState<CoachMedia[]>([]);

  // Coach Form
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [coachForm, setCoachForm] = useState({
    name: '',
    title: '',
    bio: '',
    profile_pic: '',
    experience_years: 0,
    specializations: '',
    achievements: '',
    contact_phone: '',
    contact_email: '',
  });

  // Session Form
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<CoachingSession | null>(null);
  const [sessionForm, setSessionForm] = useState({
    session_name: '',
    session_type: 'one_on_one' as SessionType,
    duration_minutes: 60,
    fee_pkr: 1000,
    max_participants: 1,
    day_type: 'all' as DayType,
    description: '',
    skill_level: 'all' as SkillLevel,
  });

  // Media Form
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [mediaForm, setMediaForm] = useState({
    media_type: 'photo' as 'photo' | 'video',
    media_url: '',
    thumbnail_url: '',
    title: '',
    description: '',
    event_name: '',
    event_date: '',
    is_featured: false,
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .order('display_order');

    if (!error) setCoaches(data || []);
    setLoading(false);
  };

  const fetchCoachData = async (coachId: string) => {
    const [sessionsRes, mediaRes] = await Promise.all([
      supabase.from('coaching_sessions').select('*').eq('coach_id', coachId).order('created_at'),
      supabase.from('coach_media').select('*').eq('coach_id', coachId).order('display_order'),
    ]);

    setCoachSessions(sessionsRes.data || []);
    setCoachMedia(mediaRes.data || []);
  };

  const selectCoach = async (coach: Coach) => {
    setSelectedCoach(coach);
    await fetchCoachData(coach.id);
  };

  // Coach CRUD
  const openCoachForm = (coach?: Coach) => {
    if (coach) {
      setEditingCoach(coach);
      setCoachForm({
        name: coach.name,
        title: coach.title || '',
        bio: coach.bio || '',
        profile_pic: coach.profile_pic || '',
        experience_years: coach.experience_years,
        specializations: coach.specializations?.join(', ') || '',
        achievements: coach.achievements?.join('\n') || '',
        contact_phone: coach.contact_phone || '',
        contact_email: coach.contact_email || '',
      });
    } else {
      setEditingCoach(null);
      setCoachForm({
        name: '', title: '', bio: '', profile_pic: '',
        experience_years: 0, specializations: '', achievements: '',
        contact_phone: '', contact_email: '',
      });
    }
    setShowCoachForm(true);
  };

  const saveCoach = async () => {
    if (!coachForm.name.trim()) {
      toast.error('Please enter coach name');
      return;
    }

    const coachData = {
      name: coachForm.name.trim(),
      title: coachForm.title || null,
      bio: coachForm.bio || null,
      profile_pic: coachForm.profile_pic || null,
      experience_years: coachForm.experience_years,
      specializations: coachForm.specializations ? coachForm.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
      achievements: coachForm.achievements ? coachForm.achievements.split('\n').map(s => s.trim()).filter(Boolean) : [],
      contact_phone: coachForm.contact_phone || null,
      contact_email: coachForm.contact_email || null,
    };

    if (editingCoach) {
      const { error } = await supabase.from('coaches').update(coachData).eq('id', editingCoach.id);
      if (error) toast.error('Failed to update coach');
      else toast.success('Coach updated');
    } else {
      const { error } = await supabase.from('coaches').insert({ ...coachData, display_order: coaches.length });
      if (error) toast.error('Failed to add coach');
      else toast.success('Coach added');
    }

    setShowCoachForm(false);
    fetchCoaches();
  };

  const deleteCoach = async (coach: Coach) => {
    if (!confirm(`Delete ${coach.name}? This will also delete their sessions and media.`)) return;

    const { error } = await supabase.from('coaches').delete().eq('id', coach.id);
    if (error) toast.error('Failed to delete coach');
    else {
      toast.success('Coach deleted');
      if (selectedCoach?.id === coach.id) setSelectedCoach(null);
      fetchCoaches();
    }
  };

  const toggleCoachActive = async (coach: Coach) => {
    const { error } = await supabase.from('coaches').update({ is_active: !coach.is_active }).eq('id', coach.id);
    if (!error) fetchCoaches();
  };

  // Session CRUD
  const openSessionForm = (session?: CoachingSession) => {
    if (session) {
      setEditingSession(session);
      setSessionForm({
        session_name: session.session_name,
        session_type: session.session_type,
        duration_minutes: session.duration_minutes,
        fee_pkr: session.fee_pkr,
        max_participants: session.max_participants,
        day_type: session.day_type,
        description: session.description || '',
        skill_level: session.skill_level,
      });
    } else {
      setEditingSession(null);
      setSessionForm({
        session_name: '', session_type: 'one_on_one', duration_minutes: 60,
        fee_pkr: 1000, max_participants: 1, day_type: 'all',
        description: '', skill_level: 'all',
      });
    }
    setShowSessionForm(true);
  };

  const saveSession = async () => {
    if (!selectedCoach || !sessionForm.session_name.trim()) {
      toast.error('Please enter session name');
      return;
    }

    const sessionData = {
      coach_id: selectedCoach.id,
      ...sessionForm,
      available_days: [],
      available_times: [],
    };

    if (editingSession) {
      const { error } = await supabase.from('coaching_sessions').update(sessionData).eq('id', editingSession.id);
      if (error) toast.error('Failed to update session');
      else toast.success('Session updated');
    } else {
      const { error } = await supabase.from('coaching_sessions').insert(sessionData);
      if (error) toast.error('Failed to add session');
      else toast.success('Session added');
    }

    setShowSessionForm(false);
    fetchCoachData(selectedCoach.id);
  };

  const deleteSession = async (session: CoachingSession) => {
    if (!confirm(`Delete "${session.session_name}"?`)) return;

    const { error } = await supabase.from('coaching_sessions').delete().eq('id', session.id);
    if (error) toast.error('Failed to delete session');
    else {
      toast.success('Session deleted');
      if (selectedCoach) fetchCoachData(selectedCoach.id);
    }
  };

  // Media CRUD
  const openMediaForm = () => {
    setMediaForm({
      media_type: 'photo', media_url: '', thumbnail_url: '',
      title: '', description: '', event_name: '', event_date: '', is_featured: false,
    });
    setShowMediaForm(true);
  };

  const saveMedia = async () => {
    if (!selectedCoach || !mediaForm.media_url.trim()) {
      toast.error('Please enter media URL');
      return;
    }

    const { error } = await supabase.from('coach_media').insert({
      coach_id: selectedCoach.id,
      ...mediaForm,
      display_order: coachMedia.length,
    });

    if (error) toast.error('Failed to add media');
    else {
      toast.success('Media added');
      setShowMediaForm(false);
      fetchCoachData(selectedCoach.id);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this media?')) return;

    const { error } = await supabase.from('coach_media').delete().eq('id', mediaId);
    if (error) toast.error('Failed to delete');
    else {
      if (selectedCoach) fetchCoachData(selectedCoach.id);
    }
  };

  return (
    <AdminLayout title="Coaches Management" subtitle="Manage coach profiles, sessions, and media">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coaches List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Coaches</h3>
              <button
                onClick={() => openCoachForm()}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <FaPlus />
              </button>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-6">Loading...</div>
            ) : coaches.length === 0 ? (
              <div className="text-center text-gray-400 py-6">
                <FaUserTie className="text-4xl mx-auto mb-2 text-gray-600" />
                <p>No coaches yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {coaches.map((coach) => (
                  <div
                    key={coach.id}
                    onClick={() => selectCoach(coach)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      selectedCoach?.id === coach.id
                        ? 'bg-primary-blue/20 border border-primary-blue'
                        : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {coach.profile_pic ? (
                        <img src={coach.profile_pic} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          <FaUserTie className="text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{coach.name}</p>
                        <p className="text-xs text-gray-500">{coach.title || 'Coach'}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${coach.is_active ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coach Details */}
        <div className="lg:col-span-2">
          {selectedCoach ? (
            <div className="space-y-6">
              {/* Coach Header */}
              <div className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {selectedCoach.profile_pic ? (
                      <img src={selectedCoach.profile_pic} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary-blue/20 flex items-center justify-center">
                        <FaUserTie className="text-primary-blue text-2xl" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedCoach.name}</h2>
                      <p className="text-gray-400">{selectedCoach.title || 'Coach'}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                        selectedCoach.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {selectedCoach.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCoachActive(selectedCoach)}
                      className={`p-2 rounded transition ${
                        selectedCoach.is_active ? 'bg-gray-600 hover:bg-gray-500' : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                    >
                      {selectedCoach.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => openCoachForm(selectedCoach)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
                      <FaEdit />
                    </button>
                    <button onClick={() => deleteCoach(selectedCoach)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'sessions' ? 'bg-primary-blue text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <FaCalendarAlt className="inline mr-2" /> Sessions ({coachSessions.length})
                </button>
                <button
                  onClick={() => setActiveTab('coaches')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    activeTab === 'coaches' ? 'bg-primary-blue text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <FaImage className="inline mr-2" /> Media ({coachMedia.length})
                </button>
              </div>

              {/* Sessions Tab */}
              {activeTab === 'sessions' && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Training Sessions</h3>
                    <button onClick={() => openSessionForm()} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm">
                      <FaPlus /> Add Session
                    </button>
                  </div>

                  {coachSessions.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No sessions yet</div>
                  ) : (
                    <div className="space-y-3">
                      {coachSessions.map((session) => (
                        <div key={session.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{session.session_name}</h4>
                              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                  {session.session_type === 'one_on_one' ? '1-on-1' : 'Group'}
                                </span>
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                  {session.duration_minutes} min
                                </span>
                                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                  {DAY_TYPES.find(d => d.value === session.day_type)?.days}
                                </span>
                                <span className="px-2 py-1 bg-primary-blue text-white rounded">
                                  PKR {session.fee_pkr}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => openSessionForm(session)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded">
                                <FaEdit />
                              </button>
                              <button onClick={() => deleteSession(session)} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'coaches' && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Photos & Videos</h3>
                    <button onClick={openMediaForm} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm">
                      <FaPlus /> Add Media
                    </button>
                  </div>

                  {coachMedia.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No media yet</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {coachMedia.map((media) => (
                        <div key={media.id} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group">
                          {media.media_type === 'photo' ? (
                            <img src={media.media_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-700">
                              <FaVideo className="text-3xl text-gray-500" />
                            </div>
                          )}
                          <button
                            onClick={() => deleteMedia(media.id)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
                          >
                            <FaTrash size={12} />
                          </button>
                          {media.event_name && (
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2">
                              <p className="text-white text-xs truncate">{media.event_name}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <FaUserTie className="text-6xl text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select a Coach</h3>
              <p className="text-gray-400">Click on a coach from the list to manage their details</p>
            </div>
          )}
        </div>
      </div>

      {/* Coach Form Modal */}
      {showCoachForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{editingCoach ? 'Edit Coach' : 'Add Coach'}</h3>
              <button onClick={() => setShowCoachForm(false)} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" value={coachForm.name} onChange={(e) => setCoachForm({ ...coachForm, name: e.target.value })} className="input-field" placeholder="Coach name" />
              </div>
              <div>
                <label className="label">Title</label>
                <input type="text" value={coachForm.title} onChange={(e) => setCoachForm({ ...coachForm, title: e.target.value })} className="input-field" placeholder="e.g., Head Coach" />
              </div>
              <div>
                <label className="label">Profile Picture URL</label>
                <input type="url" value={coachForm.profile_pic} onChange={(e) => setCoachForm({ ...coachForm, profile_pic: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea value={coachForm.bio} onChange={(e) => setCoachForm({ ...coachForm, bio: e.target.value })} className="input-field" rows={3} placeholder="Brief bio..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Experience (Years)</label>
                  <input type="number" value={coachForm.experience_years} onChange={(e) => setCoachForm({ ...coachForm, experience_years: parseInt(e.target.value) || 0 })} className="input-field" min={0} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input type="text" value={coachForm.contact_phone} onChange={(e) => setCoachForm({ ...coachForm, contact_phone: e.target.value })} className="input-field" placeholder="+923..." />
                </div>
              </div>
              <div>
                <label className="label">Specializations (comma separated)</label>
                <input type="text" value={coachForm.specializations} onChange={(e) => setCoachForm({ ...coachForm, specializations: e.target.value })} className="input-field" placeholder="Spin, Footwork, Defense" />
              </div>
              <div>
                <label className="label">Achievements (one per line)</label>
                <textarea value={coachForm.achievements} onChange={(e) => setCoachForm({ ...coachForm, achievements: e.target.value })} className="input-field" rows={3} placeholder="National Champion 2020&#10;Certified Coach" />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowCoachForm(false)} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
              <button onClick={saveCoach} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2">
                <FaSave /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Form Modal */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{editingSession ? 'Edit Session' : 'Add Session'}</h3>
              <button onClick={() => setShowSessionForm(false)} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Session Name *</label>
                <input type="text" value={sessionForm.session_name} onChange={(e) => setSessionForm({ ...sessionForm, session_name: e.target.value })} className="input-field" placeholder="e.g., Beginner Training" />
              </div>
              <div>
                <label className="label">Session Type</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSessionForm({ ...sessionForm, session_type: 'one_on_one', max_participants: 1 })} className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${sessionForm.session_type === 'one_on_one' ? 'border-primary-blue bg-primary-blue/10 text-white' : 'border-gray-700 text-gray-400'}`}>
                    <FaUser /> 1-on-1
                  </button>
                  <button type="button" onClick={() => setSessionForm({ ...sessionForm, session_type: 'group', max_participants: 4 })} className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${sessionForm.session_type === 'group' ? 'border-primary-blue bg-primary-blue/10 text-white' : 'border-gray-700 text-gray-400'}`}>
                    <FaUsers /> Group
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duration</label>
                  <select value={sessionForm.duration_minutes} onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) })} className="input-field">
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
                <div>
                  <label className="label">Fee (PKR)</label>
                  <input type="number" value={sessionForm.fee_pkr} onChange={(e) => setSessionForm({ ...sessionForm, fee_pkr: parseInt(e.target.value) || 0 })} className="input-field" min={0} />
                </div>
              </div>
              {sessionForm.session_type === 'group' && (
                <div>
                  <label className="label">Max Participants</label>
                  <input type="number" value={sessionForm.max_participants} onChange={(e) => setSessionForm({ ...sessionForm, max_participants: parseInt(e.target.value) || 2 })} className="input-field" min={2} max={10} />
                </div>
              )}
              <div>
                <label className="label">Available Days</label>
                <div className="grid grid-cols-3 gap-2">
                  {DAY_TYPES.map((dt) => (
                    <button key={dt.value} type="button" onClick={() => setSessionForm({ ...sessionForm, day_type: dt.value })} className={`p-3 rounded-lg border-2 text-center ${sessionForm.day_type === dt.value ? 'border-primary-blue bg-primary-blue/10 text-white' : 'border-gray-700 text-gray-400'}`}>
                      <div className="font-medium text-sm">{dt.label}</div>
                      <div className="text-xs text-gray-500">{dt.days}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Skill Level</label>
                <select value={sessionForm.skill_level} onChange={(e) => setSessionForm({ ...sessionForm, skill_level: e.target.value as SkillLevel })} className="input-field">
                  {SKILL_LEVELS.map((sl) => (
                    <option key={sl.value} value={sl.value}>{sl.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={sessionForm.description} onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })} className="input-field" rows={2} placeholder="What this session covers..." />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowSessionForm(false)} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
              <button onClick={saveSession} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2">
                <FaSave /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Form Modal */}
      {showMediaForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add Media</h3>
              <button onClick={() => setShowMediaForm(false)} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Media Type</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setMediaForm({ ...mediaForm, media_type: 'photo' })} className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${mediaForm.media_type === 'photo' ? 'border-primary-blue bg-primary-blue/10 text-white' : 'border-gray-700 text-gray-400'}`}>
                    <FaImage /> Photo
                  </button>
                  <button type="button" onClick={() => setMediaForm({ ...mediaForm, media_type: 'video' })} className={`flex-1 p-3 rounded-lg border-2 flex items-center justify-center gap-2 ${mediaForm.media_type === 'video' ? 'border-primary-blue bg-primary-blue/10 text-white' : 'border-gray-700 text-gray-400'}`}>
                    <FaVideo /> Video
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Media URL * (Google Cloud/Drive)</label>
                <input type="url" value={mediaForm.media_url} onChange={(e) => setMediaForm({ ...mediaForm, media_url: e.target.value })} className="input-field" placeholder="https://..." />
              </div>
              {mediaForm.media_type === 'video' && (
                <div>
                  <label className="label">Thumbnail URL</label>
                  <input type="url" value={mediaForm.thumbnail_url} onChange={(e) => setMediaForm({ ...mediaForm, thumbnail_url: e.target.value })} className="input-field" placeholder="https://..." />
                </div>
              )}
              <div>
                <label className="label">Title</label>
                <input type="text" value={mediaForm.title} onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })} className="input-field" placeholder="Optional title" />
              </div>
              <div>
                <label className="label">Event Name</label>
                <input type="text" value={mediaForm.event_name} onChange={(e) => setMediaForm({ ...mediaForm, event_name: e.target.value })} className="input-field" placeholder="e.g., National Championship 2024" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={mediaForm.is_featured} onChange={(e) => setMediaForm({ ...mediaForm, is_featured: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-white">Featured Media</span>
              </label>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowMediaForm(false)} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancel</button>
              <button onClick={saveMedia} className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2">
                <FaSave /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCoaches;
