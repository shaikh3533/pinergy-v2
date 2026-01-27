import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaTrash, FaWhatsapp, FaPhone, FaWalking } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { Booking } from '../../lib/supabase';
import { formatDate } from '../../utils/dateUtils';
import AdminLayout from '../../components/Admin/AdminLayout';

const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*, user:user_id(name, email, phone)')
      .order('date', { ascending: false })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const handleDeleteBooking = async (bookingId: string, userName: string) => {
    if (!confirm(`Delete booking for ${userName}? This cannot be undone.`)) return;

    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);

    if (error) {
      toast.error('Failed to delete booking');
    } else {
      toast.success('Booking deleted');
      fetchBookings();
    }
  };

  const getBookingSourceIcon = (source?: string) => {
    switch (source) {
      case 'whatsapp': return <FaWhatsapp className="text-green-500" title="WhatsApp booking" />;
      case 'phone': return <FaPhone className="text-blue-500" title="Phone booking" />;
      case 'walkin': return <FaWalking className="text-purple-500" title="Walk-in booking" />;
      default: return <span className="text-gray-500 text-xs">Online</span>;
    }
  };

  const filteredBookings = filterDate
    ? bookings.filter(b => b.date === filterDate)
    : bookings;

  return (
    <AdminLayout title="Booking Management" subtitle="View and manage all slot bookings">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="input-field w-auto"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="px-3 py-2 text-gray-400 hover:text-white transition"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Bookings Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading bookings...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/50">
                  <th className="text-left py-4 px-3 text-gray-400 font-semibold">Source</th>
                  <th className="text-left py-4 px-3 text-gray-400 font-semibold">Customer</th>
                  <th className="text-left py-4 px-3 text-gray-400 font-semibold">Table</th>
                  <th className="text-left py-4 px-3 text-gray-400 font-semibold">Date & Time</th>
                  <th className="text-left py-4 px-3 text-gray-400 font-semibold">Duration</th>
                  <th className="text-left py-4 px-3 text-gray-400 font-semibold">Price</th>
                  <th className="text-left py-4 px-3 text-gray-400 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-3">
                      {getBookingSourceIcon((booking as any).booking_source)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white font-medium">{(booking.user as any)?.name || 'Unknown'}</div>
                      <div className="text-gray-500 text-xs">{(booking.user as any)?.phone}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-300">
                      {booking.table_id === 'table_a' ? 'Table A' :
                       booking.table_id === 'table_b' ? 'Table B' :
                       booking.table_type}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white">{formatDate(booking.date)}</div>
                      <div className="text-gray-500 text-xs">{booking.start_time} - {booking.end_time}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-300">
                      {booking.slot_duration} min
                    </td>
                    <td className="py-3 px-3 text-primary-blue font-bold">
                      PKR {booking.price}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => handleDeleteBooking(booking.id, (booking.user as any)?.name || 'Unknown')}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                        title="Delete booking"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                {filterDate ? 'No bookings for selected date' : 'No bookings found'}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookingsPage;
