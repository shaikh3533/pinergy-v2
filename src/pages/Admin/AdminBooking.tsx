import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaSearch, 
  FaUser, 
  FaPhone, 
  FaCalendarAlt, 
  FaClock, 
  FaCheck,
  FaTableTennis,
  FaWhatsapp,
  FaEnvelope
} from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import type { User, Booking } from '../../lib/supabase';
import { format, addDays } from 'date-fns';
import {
  generateTimeSlots,
  getDayOfWeek,
  getEndTime,
  formatTime12Hour,
} from '../../utils/timeSlots';
import type { TimeSlot } from '../../utils/timeSlots';
import { calculateBookingPrice, fetchPricingRules, calculateBookingPriceSync } from '../../utils/pricingCalculator';
import { sendWhatsAppNotification } from '../../utils/whatsappNotification';
import { sendCustomerConfirmationEmail } from '../../utils/emailNotification';

interface SelectedSlot {
  date: string;
  time: string;
  endTime: string;
  dayOfWeek: string;
}

const AdminBooking = () => {
  // User selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // New user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  
  // Booking details
  const [tableId, setTableId] = useState<'table_a' | 'table_b'>('table_a');
  const [duration, setDuration] = useState<30 | 60>(60);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Booking[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  
  // Pricing
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [pricePerSlot, setPricePerSlot] = useState(0);
  
  // Notification options
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [bookingSource, setBookingSource] = useState<'whatsapp' | 'phone' | 'walkin'>('whatsapp');
  
  // Generate next 14 days for admin (more flexibility)
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'MMM dd'),
      dayName: format(date, 'EEE'),
      dayOfWeek: getDayOfWeek(date),
      isToday: i === 0,
    };
  });

  // Initialize pricing
  useEffect(() => {
    const initializePricing = async () => {
      await fetchPricingRules();
      setPricingLoaded(true);
    };
    initializePricing();
  }, []);

  // Update price when table/duration changes
  useEffect(() => {
    const updatePrice = async () => {
      const price = await calculateBookingPrice(tableId, duration, false);
      setPricePerSlot(price);
    };
    if (pricingLoaded) {
      updatePrice();
    }
  }, [tableId, duration, pricingLoaded]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);
      
      if (!error && data) {
        setSearchResults(data);
      }
    };
    
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Auto-select first date
  useEffect(() => {
    if (!selectedDate && next14Days.length > 0) {
      setSelectedDate(next14Days[0].date);
    }
  }, []);

  // Fetch booked slots
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate || !tableId) return;
      
      setFetchingSlots(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('date', selectedDate)
          .eq('table_id', tableId);

        if (error) throw error;
        setBookedSlots(data || []);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setBookedSlots([]);
      } finally {
        setFetchingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate, tableId]);

  // Update available slots when date or duration changes
  useEffect(() => {
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const slots = generateTimeSlots(dateObj, duration);
      setAvailableTimeSlots(slots);
    }
  }, [selectedDate, duration]);

  // Check if slot is booked
  const isSlotBooked = (slotValue: string) => {
    const slotEndTime = getEndTime(slotValue, duration);
    
    return bookedSlots.some(booking => {
      const slotStartNum = parseInt(slotValue.replace(':', ''));
      const slotEndNum = parseInt(slotEndTime.replace(':', ''));
      const bookingStartNum = parseInt(booking.start_time.replace(':', ''));
      const bookingEndNum = parseInt(booking.end_time.replace(':', ''));
      
      const overlaps = (bookingStartNum < slotEndNum) && (bookingEndNum > slotStartNum);
      return overlaps;
    });
  };

  const handleSlotToggle = (slot: TimeSlot) => {
    if (isSlotBooked(slot.value)) {
      toast.error('This slot is already booked!');
      return;
    }

    const existingSlotIndex = selectedSlots.findIndex(
      s => s.date === selectedDate && s.time === slot.value
    );

    if (existingSlotIndex >= 0) {
      setSelectedSlots(selectedSlots.filter((_, i) => i !== existingSlotIndex));
    } else {
      const endTime = getEndTime(slot.value, duration);
      const dayOfWeek = getDayOfWeek(new Date(selectedDate));
      setSelectedSlots([
        ...selectedSlots,
        {
          date: selectedDate,
          time: slot.value,
          endTime,
          dayOfWeek,
        },
      ]);
    }
  };

  const isSlotSelected = (slotValue: string) => {
    return selectedSlots.some(
      s => s.date === selectedDate && s.time === slotValue
    );
  };

  const getTotalPrice = () => {
    return pricePerSlot * selectedSlots.length;
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
    setIsNewUser(false);
  };

  const handleCreateNewUser = () => {
    setIsNewUser(true);
    setSelectedUser(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setIsNewUser(false);
    setNewUserName('');
    setNewUserPhone('');
    setNewUserEmail('');
    setSelectedSlots([]);
    setSearchTerm('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedUser && !isNewUser) {
      toast.error('Please select or create a customer');
      return;
    }
    
    if (isNewUser && (!newUserName || !newUserPhone)) {
      toast.error('Please fill in customer name and phone');
      return;
    }
    
    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    setLoading(true);

    try {
      let userId = selectedUser?.id;
      let customerName = selectedUser?.name || newUserName;
      let customerPhone = selectedUser?.phone || newUserPhone;
      let customerEmail = selectedUser?.email || newUserEmail;

      // Create new user if needed
      if (isNewUser) {
        // Check if user already exists
        let existingUser = null;
        
        if (newUserPhone) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('phone', newUserPhone)
            .maybeSingle();
          existingUser = data;
        }
        
        if (!existingUser && newUserEmail) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', newUserEmail)
            .maybeSingle();
          existingUser = data;
        }
        
        if (existingUser) {
          userId = existingUser.id;
          customerName = existingUser.name;
          customerPhone = existingUser.phone || newUserPhone;
          customerEmail = existingUser.email || newUserEmail;
          toast.success(`Found existing customer: ${existingUser.name}`);
        } else {
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              name: newUserName,
              email: newUserEmail || null,
              phone: newUserPhone || null,
              rating_points: 0,
              level: 'Noob',
              total_hours_played: 0,
              approved: true,
              role: 'player',
            })
            .select()
            .single();

          if (userError) throw userError;
          userId = newUser.id;
          toast.success(`Created new customer: ${newUserName}`);
        }
      }

      // Create bookings
      const tableName = tableId === 'table_a' ? 'Table A' : 'Table B';
      const bookings = selectedSlots.map(slot => ({
        user_id: userId,
        table_type: tableId,
        table_id: tableId,
        slot_duration: duration,
        coaching: false,
        date: slot.date,
        start_time: slot.time,
        end_time: slot.endTime,
        day_of_week: slot.dayOfWeek,
        price: pricePerSlot,
        whatsapp_sent: sendWhatsApp,
        booking_source: bookingSource, // Track how the booking was received
      }));

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert(bookings);

      if (bookingError) throw bookingError;

      // Update total hours played
      const totalHours = (duration / 60) * selectedSlots.length;
      await supabase.rpc('increment_hours_played', {
        user_id: userId,
        hours: totalHours,
      });

      // Send notifications if enabled
      if (sendWhatsApp && customerPhone) {
        sendWhatsAppNotification({
          name: customerName,
          phone: customerPhone,
          table: tableName,
          duration,
          date: selectedSlots[0].date,
          startTime: selectedSlots[0].time,
          endTime: selectedSlots[selectedSlots.length - 1].endTime,
          dayOfWeek: selectedSlots[0].dayOfWeek,
          coaching: false,
          price: pricePerSlot,
          totalSlots: selectedSlots.length,
          totalPrice: getTotalPrice(),
          allSlots: selectedSlots,
        });
      }

      if (sendEmail && customerEmail) {
        selectedSlots.forEach(slot => {
          sendCustomerConfirmationEmail({
            customerName,
            customerEmail,
            customerPhone: customerPhone || '',
            table: tableName,
            date: slot.date,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.time,
            endTime: slot.endTime,
            duration,
            price: pricePerSlot,
            totalSlots: selectedSlots.length,
            totalPrice: getTotalPrice(),
          });
        });
      }

      toast.success(
        `Booking confirmed for ${customerName}!\n${selectedSlots.length} slot(s) on ${tableName}`,
        { duration: 5000 }
      );

      // Reset form
      resetForm();
      
      // Refresh booked slots
      const { data: refreshedSlots } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', selectedDate)
        .eq('table_id', tableId);
      setBookedSlots(refreshedSlots || []);

    } catch (err: any) {
      console.error('Booking error:', err);
      toast.error(`Failed to create booking: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Booking Source */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaTableTennis className="text-primary-blue" />
          Booking Source
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setBookingSource('whatsapp')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              bookingSource === 'whatsapp'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <FaWhatsapp /> WhatsApp
          </button>
          <button
            onClick={() => setBookingSource('phone')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              bookingSource === 'phone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <FaPhone /> Phone Call
          </button>
          <button
            onClick={() => setBookingSource('walkin')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              bookingSource === 'walkin'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <FaUser /> Walk-in
          </button>
        </div>
      </div>

      {/* Customer Selection */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaUser className="text-primary-blue" />
          Customer Details
        </h3>

        {!selectedUser && !isNewUser ? (
          <div className="space-y-4">
            {/* Search existing user */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="input-field pl-10"
              />
            </div>
            
            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="bg-gray-800 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 text-left hover:bg-gray-700 border-b border-gray-700 last:border-0 transition"
                  >
                    <div className="text-white font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-400 flex gap-3">
                      {user.phone && <span><FaPhone className="inline mr-1" />{user.phone}</span>}
                      {user.email && <span><FaEnvelope className="inline mr-1" />{user.email}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Create new customer button */}
            <button
              onClick={handleCreateNewUser}
              className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-primary-blue hover:text-primary-blue transition flex items-center justify-center gap-2"
            >
              <FaPlus /> Create New Customer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected user display */}
            {selectedUser && (
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold text-lg">{selectedUser.name}</div>
                  <div className="text-sm text-gray-400 flex gap-3 mt-1">
                    {selectedUser.phone && <span><FaPhone className="inline mr-1" />{selectedUser.phone}</span>}
                    {selectedUser.email && <span><FaEnvelope className="inline mr-1" />{selectedUser.email}</span>}
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="text-red-500 hover:text-red-400 text-sm"
                >
                  Change Customer
                </button>
              </div>
            )}

            {/* New user form */}
            {isNewUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary-blue font-semibold">New Customer</span>
                  <button
                    onClick={resetForm}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="input-field"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <label className="label">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="input-field"
                      placeholder="03XX XXXXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email (Optional)</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="input-field"
                    placeholder="customer@email.com"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table & Duration Selection */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaTableTennis className="text-primary-blue" />
          Booking Options
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Table Selection */}
          <div>
            <label className="label">Select Table</label>
            <div className="flex gap-3">
              <button
                onClick={() => setTableId('table_a')}
                className={`flex-1 p-3 rounded-lg border-2 transition ${
                  tableId === 'table_a'
                    ? 'border-primary-blue bg-primary-blue/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">Table A</div>
                <div className="text-xs mt-1">Tibhar (25mm)</div>
              </button>
              <button
                onClick={() => setTableId('table_b')}
                className={`flex-1 p-3 rounded-lg border-2 transition ${
                  tableId === 'table_b'
                    ? 'border-primary-blue bg-primary-blue/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">Table B</div>
                <div className="text-xs mt-1">DC-700 (25mm)</div>
              </button>
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="label">Duration</label>
            <div className="flex gap-3">
              <button
                onClick={() => setDuration(30)}
                className={`flex-1 p-3 rounded-lg border-2 transition ${
                  duration === 30
                    ? 'border-primary-blue bg-primary-blue/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">30 min</div>
                <div className="text-xs mt-1">
                  PKR {pricingLoaded ? calculateBookingPriceSync(tableId, 30, false) : '...'}
                </div>
              </button>
              <button
                onClick={() => setDuration(60)}
                className={`flex-1 p-3 rounded-lg border-2 transition ${
                  duration === 60
                    ? 'border-primary-blue bg-primary-blue/10 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="font-bold">60 min</div>
                <div className="text-xs mt-1">
                  PKR {pricingLoaded ? calculateBookingPriceSync(tableId, 60, false) : '...'}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FaCalendarAlt className="text-primary-blue" />
          Select Date
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {next14Days.slice(0, 7).map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`p-3 rounded-lg border-2 transition ${
                selectedDate === day.date
                  ? 'border-primary-blue bg-primary-blue/20 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="text-xs font-semibold mb-1">{day.dayName}</div>
              <div className="text-sm">{day.displayDate}</div>
              {day.isToday && (
                <div className="text-xs text-primary-blue mt-1">Today</div>
              )}
            </button>
          ))}
        </div>
        {/* Second week */}
        <div className="grid grid-cols-7 gap-2 mt-2">
          {next14Days.slice(7, 14).map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`p-3 rounded-lg border-2 transition ${
                selectedDate === day.date
                  ? 'border-primary-blue bg-primary-blue/20 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="text-xs font-semibold mb-1">{day.dayName}</div>
              <div className="text-sm">{day.displayDate}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FaClock className="text-primary-blue" />
              Available Slots - {next14Days.find(d => d.date === selectedDate)?.dayOfWeek}
            </h3>
            <span className="text-sm text-gray-400">4 PM - 12 AM</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {fetchingSlots && (
              <div className="col-span-full text-center text-gray-400 py-4">
                Loading available slots...
              </div>
            )}
            {!fetchingSlots && availableTimeSlots.map((slot) => {
              const booked = isSlotBooked(slot.value);
              const selected = isSlotSelected(slot.value);
              
              return (
                <motion.button
                  key={slot.value}
                  onClick={() => handleSlotToggle(slot)}
                  disabled={booked}
                  whileHover={{ scale: booked ? 1 : 1.05 }}
                  whileTap={{ scale: booked ? 1 : 0.95 }}
                  className={`p-3 rounded-lg border-2 transition ${
                    booked
                      ? 'border-red-900/50 bg-red-900/20 text-red-400 cursor-not-allowed'
                      : selected
                      ? 'border-primary-blue bg-primary-blue/20 text-white shadow-lg shadow-primary-blue/20'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  <div className="font-semibold text-sm">{slot.label}</div>
                  {booked && <div className="text-xs mt-1 text-red-400">Booked</div>}
                  {selected && (
                    <div className="text-xs text-primary-blue mt-1 flex items-center justify-center gap-1">
                      <FaCheck /> Selected
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Slots Summary */}
      {selectedSlots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-primary-blue/10 to-green-500/10 border-primary-blue"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Selected Slots ({selectedSlots.length})
            </h3>
            <button
              onClick={() => setSelectedSlots([])}
              className="text-red-500 hover:text-red-400 text-sm"
            >
              Clear All
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {selectedSlots.map((slot, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="text-sm">
                  <div className="text-white font-semibold">
                    {formatTime12Hour(slot.time)} - {formatTime12Hour(slot.endTime)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {slot.date} ({slot.dayOfWeek})
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSlots(selectedSlots.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Price per slot:</span>
              <span className="text-white">PKR {pricePerSlot}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Number of slots:</span>
              <span className="text-white">{selectedSlots.length}</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-white font-bold text-lg">Total Price:</span>
              <span className="text-white font-bold text-2xl">PKR {getTotalPrice()}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notification Options */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Notifications</h3>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 text-green-500"
            />
            <span className="text-gray-300 flex items-center gap-1">
              <FaWhatsapp className="text-green-500" /> Send WhatsApp
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-5 h-5 rounded border-gray-700 text-blue-500"
            />
            <span className="text-gray-300 flex items-center gap-1">
              <FaEnvelope className="text-blue-500" /> Send Email
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || selectedSlots.length === 0 || (!selectedUser && !isNewUser)}
        className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          '⏳ Processing...'
        ) : (
          <>
            <FaPlus /> Add Booking ({selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''})
          </>
        )}
      </button>
    </div>
  );
};

export default AdminBooking;
