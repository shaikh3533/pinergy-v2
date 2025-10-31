import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { PricingRule, TableName } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { clearPricingCache } from '../../utils/pricingCalculator';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'pricing' | 'tables'>('pricing');
  
  // Pricing state
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<number>(0);
  
  // Table names state
  const [tables, setTables] = useState<TableName[]>([]);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [tableForm, setTableForm] = useState({
    display_name: '',
    full_name: '',
    specs: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pricing rules
      const { data: pricing, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('active', true)
        .order('table_type')
        .order('duration_minutes')
        .order('coaching');

      if (pricingError) throw pricingError;
      setPricingRules(pricing || []);

      // Fetch table names
      const { data: tableData, error: tableError } = await supabase
        .from('table_names')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (tableError) throw tableError;
      setTables(tableData || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Pricing functions
  const handleEditPrice = (rule: PricingRule) => {
    setEditingPrice(rule.id);
    setPriceInput(rule.price);
  };

  const handleSavePrice = async (rule: PricingRule) => {
    try {
      const { error } = await supabase
        .from('pricing_rules')
        .update({ price: priceInput, updated_at: new Date().toISOString() })
        .eq('id', rule.id);

      if (error) throw error;

      toast.success('Price updated! 💰');
      setEditingPrice(null);
      clearPricingCache(); // Clear cache so new prices are fetched
      fetchData();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  const handleCancelEditPrice = () => {
    setEditingPrice(null);
    setPriceInput(0);
  };

  // Table name functions
  const handleEditTable = (table: TableName) => {
    setEditingTable(table.id);
    setTableForm({
      display_name: table.display_name,
      full_name: table.full_name,
      specs: table.specs || ''
    });
  };

  const handleSaveTable = async (table: TableName) => {
    try {
      const { error } = await supabase
        .from('table_names')
        .update({
          display_name: tableForm.display_name,
          full_name: tableForm.full_name,
          specs: tableForm.specs,
          updated_at: new Date().toISOString()
        })
        .eq('id', table.id);

      if (error) throw error;

      toast.success('Table info updated! 🏓');
      setEditingTable(null);
      fetchData();
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Failed to update table info');
    }
  };

  const handleCancelEditTable = () => {
    setEditingTable(null);
    setTableForm({ display_name: '', full_name: '', specs: '' });
  };

  // Helper functions
  const getTableDisplayName = (tableId: string) => {
    const table = tables.find(t => t.table_id === tableId);
    return table?.display_name || tableId;
  };

  const formatDuration = (minutes: number) => {
    return minutes === 30 ? 'Half Hour (30 min)' : 'Full Hour (60 min)';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Settings & Pricing</h1>
            <p className="text-gray-400">Manage table names and pricing rules</p>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => setActiveSection('pricing')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeSection === 'pricing'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              💰 Pricing Rules
            </button>
            <button
              onClick={() => setActiveSection('tables')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeSection === 'tables'
                  ? 'bg-primary-blue text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🏓 Table Names
            </button>
          </div>

          {/* Pricing Section */}
          {activeSection === 'pricing' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Pricing Rules (PKR)</h2>
              <p className="text-gray-400 mb-6">
                Set prices for different combinations of table, duration, and coaching
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Table</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Duration</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Coaching</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Price (PKR)</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                        <td className="py-4 px-4 text-white font-medium">
                          {getTableDisplayName(rule.table_type)}
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          {formatDuration(rule.duration_minutes)}
                        </td>
                        <td className="py-4 px-4">
                          {rule.coaching ? (
                            <span className="text-green-400">✅ With Coaching</span>
                          ) : (
                            <span className="text-gray-500">❌ No Coaching</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingPrice === rule.id ? (
                            <input
                              type="number"
                              value={priceInput}
                              onChange={(e) => setPriceInput(Number(e.target.value))}
                              className="input-field w-32"
                              min="0"
                              step="50"
                            />
                          ) : (
                            <span className="text-primary-blue font-bold text-lg">
                              PKR {rule.price}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {editingPrice === rule.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSavePrice(rule)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEditPrice}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditPrice(rule)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm">
                  💡 <strong>Tip:</strong> Changes to pricing will apply to all new bookings immediately. 
                  The booking page will refresh pricing every 5 minutes automatically.
                </p>
              </div>
            </div>
          )}

          {/* Tables Section */}
          {activeSection === 'tables' && (
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-6">Table Information</h2>
              <p className="text-gray-400 mb-6">
                Update table display names and specifications
              </p>

              <div className="space-y-6">
                {tables.map((table) => (
                  <div key={table.id} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">
                        {table.table_id === 'table_a' ? '🏓 Table A' : '🏓 Table B'}
                      </h3>
                      {editingTable === table.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTable(table)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEditTable}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditTable(table)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {editingTable === table.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="label">Display Name (Short)</label>
                          <input
                            type="text"
                            value={tableForm.display_name}
                            onChange={(e) => setTableForm({ ...tableForm, display_name: e.target.value })}
                            className="input-field"
                            placeholder="e.g., Table A"
                          />
                        </div>
                        <div>
                          <label className="label">Full Name</label>
                          <input
                            type="text"
                            value={tableForm.full_name}
                            onChange={(e) => setTableForm({ ...tableForm, full_name: e.target.value })}
                            className="input-field"
                            placeholder="e.g., Tibhar Top Professional"
                          />
                        </div>
                        <div>
                          <label className="label">Specifications (Optional)</label>
                          <textarea
                            value={tableForm.specs}
                            onChange={(e) => setTableForm({ ...tableForm, specs: e.target.value })}
                            className="input-field"
                            rows={3}
                            placeholder="e.g., 25mm ITTF-approved, Anti-glare surface..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400">Display Name: </span>
                          <span className="text-white font-semibold">{table.display_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Full Name: </span>
                          <span className="text-white">{table.full_name}</span>
                        </div>
                        {table.specs && (
                          <div>
                            <span className="text-gray-400">Specs: </span>
                            <span className="text-gray-300 text-sm">{table.specs}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm">
                  💡 <strong>Tip:</strong> Table names will update across the entire website including the homepage, 
                  booking page, and all reports. Changes take effect immediately.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;

