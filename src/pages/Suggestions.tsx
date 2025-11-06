import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const Suggestions = () => {
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    type: 'suggestion' as 'suggestion' | 'complaint' | 'feedback',
    subject: '',
    message: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: submitError } = await supabase.from('suggestions').insert({
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        type: formData.type,
        subject: formData.subject,
        message: formData.message,
        status: 'pending',
      });

      if (submitError) throw submitError;

      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          type: 'suggestion',
          subject: '',
          message: '',
        });
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Suggestions & Complaints</h1>
            <p className="text-gray-400">
              We value your feedback! Help us improve SPINERGY
            </p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500 text-center"
            >
              <div className="text-3xl mb-2">✅</div>
              <div className="font-semibold">Thank you for your feedback!</div>
              <div className="text-sm mt-1">We'll review it and get back to you soon.</div>
            </motion.div>
          )}

          <div className="card">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="Ahmed Ali"
                    required
                  />
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="03XX XXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="label">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'suggestion' })}
                    className={`p-4 rounded-lg border-2 transition ${
                      formData.type === 'suggestion'
                        ? 'border-primary-blue bg-primary-blue/10 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">💡</div>
                    <div className="text-sm font-semibold">Suggestion</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'complaint' })}
                    className={`p-4 rounded-lg border-2 transition ${
                      formData.type === 'complaint'
                        ? 'border-primary-red bg-primary-red/10 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">⚠️</div>
                    <div className="text-sm font-semibold">Complaint</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'feedback' })}
                    className={`p-4 rounded-lg border-2 transition ${
                      formData.type === 'feedback'
                        ? 'border-green-500 bg-green-500/10 text-white'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">⭐</div>
                    <div className="text-sm font-semibold">Feedback</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="label">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  placeholder="Brief description of your feedback"
                  required
                />
              </div>

              <div>
                <label className="label">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-field"
                  rows={6}
                  placeholder="Please provide detailed information..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The more details you provide, the better we can address your feedback
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid md:grid-cols-3 gap-4"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">📧</div>
              <div className="text-sm text-gray-400">Email</div>
              <div className="text-white font-semibold">spinergy.info@gmail.com</div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">📱</div>
              <div className="text-sm text-gray-400">WhatsApp</div>
              <div className="text-white font-semibold">0325-9898900</div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <div className="text-sm text-gray-400">Response Time</div>
              <div className="text-white font-semibold">24-48 hours</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Suggestions;


