import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { calculateBookingPrice, calculateBookingPriceSync, fetchPricingRules } from '../utils/pricingCalculator';
import { sendWhatsAppNotification } from '../utils/whatsappNotification';
import { sendCustomerConfirmationEmail, sendAdminNotificationEmail } from '../utils/emailNotification';
import { sendCustomerSMS, generateBookingSMS } from '../utils/smsNotification';
import { format, addDays } from 'date-fns';
import {
  generateTimeSlots,
  getDayOfWeek,
  getEndTime,
  isWeekend,
} from '../utils/timeSlots';
import type { TimeSlot } from '../utils/timeSlots';
import type { Booking } from '../lib/supabase';

interface SelectedSlot {
  date: string;
  time: string;
  endTime: string;
  dayOfWeek: string;
}

const Book = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // User info state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [table, setTable] = useState('Table A'); // Display name
  const [tableId, setTableId] = useState<'table_a' | 'table_b'>('table_a'); // Tibhar
  // const [coaching, setCoaching] = useState(false); // COACHING FEATURE - COMMENTED OUT FOR NOW
  const coaching = false; // Temporarily hardcoded to false until coaching feature is implemented
  const [duration, setDuration] = useState<30 | 60>(60);
  
  // Date and slot selection
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<Booking[]>([]); // Track booked slots
  const [fetchingSlots, setFetchingSlots] = useState(false);
  
  // Pricing state
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [pricePerSlot, setPricePerSlot] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookingStep, setBookingStep] = useState<'details' | 'slots'>('details');

  // Generate next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'MMM dd'),
      dayName: format(date, 'EEE'),
      dayOfWeek: getDayOfWeek(date),
      isToday: i === 0,
    };
  });

  // Initialize pricing on component load
  useEffect(() => {
    const initializePricing = async () => {
      await fetchPricingRules();
      setPricingLoaded(true);
    };
    initializePricing();
  }, []);

  // Update price when table/duration/coaching changes
  useEffect(() => {
    const updatePrice = async () => {
      const price = await calculateBookingPrice(tableId, duration, coaching);
      setPricePerSlot(price);
    };
    if (pricingLoaded) {
      updatePrice();
    }
  }, [tableId, duration, coaching, pricingLoaded]);

  // Fetch booked slots for selected date and table
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!selectedDate || !tableId) return;
      
      setFetchingSlots(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('date', selectedDate)
          .eq('table_id', tableId)
          .eq('slot_duration', duration);

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
  }, [selectedDate, tableId, duration]);

  // Update available time slots when date or duration changes
  useEffect(() => {
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const slots = generateTimeSlots(dateObj, duration); // Pass duration parameter
      setAvailableTimeSlots(slots);
    }
  }, [selectedDate, duration]);

  // Auto-select first date
  useEffect(() => {
    if (!selectedDate && next7Days.length > 0) {
      setSelectedDate(next7Days[0].date);
    }
  }, []);

  // Check if a slot is already booked
  const isSlotBooked = (slotValue: string) => {
    return bookedSlots.some(
      booking => booking.start_time === slotValue
    );
  };

  const handleSlotToggle = (slot: TimeSlot) => {
    // Prevent selecting already booked slots
    if (isSlotBooked(slot.value)) {
      setError('This slot is already booked. Please select another slot.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const existingSlotIndex = selectedSlots.findIndex(
      s => s.date === selectedDate && s.time === slot.value
    );

    if (existingSlotIndex >= 0) {
      // Remove slot
      setSelectedSlots(selectedSlots.filter((_, i) => i !== existingSlotIndex));
    } else {
      // Add slot
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bookingStep === 'details') {
      // Validate user details
      if (!name || !phone) {
        setError('Please fill in required fields');
        return;
      }
      setBookingStep('slots');
      return;
    }

    // Step 2: Submit bookings
    if (selectedSlots.length === 0) {
      setError('Please select at least one time slot');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // If user is not logged in, find or create a guest user
      let userId = user?.id;
      
      if (!userId) {
        // STEP 1: Check if user already exists (by email or phone)
        let existingUser = null;
        
        if (email) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
          existingUser = data;
        }
        
        // If not found by email, try phone
        if (!existingUser && phone) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();
          existingUser = data;
        }
        
        // STEP 2: Use existing user or create new one
        if (existingUser) {
          // User exists - use their ID
          userId = existingUser.id;
          console.log('✅ Found existing user:', existingUser.name);
        } else {
          // User doesn't exist - create new one
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
              name,
              email: email || null,
              phone: phone || null,
              rating_points: 0,
              level: 'Noob',
              total_hours_played: 0,
              approved: true,
              role: 'player',
            })
            .select()
            .single();

          if (userError) {
            console.error('Error creating user:', userError);
            throw new Error('Failed to create user profile. Please try again.');
          }
          
          userId = newUser.id;
          console.log('✅ Created new user:', newUser.name);
        }
      }

      // Create all bookings
      const bookings = selectedSlots.map(slot => ({
        user_id: userId,
        table_type: tableId, // Use tableId (lowercase) not table (display name)
        table_id: tableId,
        slot_duration: duration,
        coaching: coaching,
        date: slot.date,
        start_time: slot.time,
        end_time: slot.endTime,
        day_of_week: slot.dayOfWeek,
        price: pricePerSlot, // Use dynamic price
        whatsapp_sent: false,
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

      // Show immediate success toast
      toast.success('🎉 Booking confirmed!', {
        duration: 4000,
        icon: '✅',
      });

      // Send notifications (async, don't wait for all)
      const notificationPromises = selectedSlots.map(async (slot) => {
        // 1. WhatsApp notifications (to both admin and customer)
        sendWhatsAppNotification({
          name,
          phone,
          table,
          duration,
          date: slot.date,
          startTime: slot.time,
          endTime: slot.endTime,
          dayOfWeek: slot.dayOfWeek,
          coaching,
          price: pricePerSlot,
          totalSlots: selectedSlots.length,
          totalPrice: getTotalPrice(),
        });

        // 2. Email notifications (if email provided)
        if (email) {
          // Customer confirmation email
          sendCustomerConfirmationEmail({
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            table,
            date: slot.date,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.time,
            endTime: slot.endTime,
            duration,
            price: pricePerSlot,
            totalSlots: selectedSlots.length,
            totalPrice: getTotalPrice(),
          });

          // Admin notification email
          sendAdminNotificationEmail({
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            table,
            date: slot.date,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.time,
            endTime: slot.endTime,
            duration,
            price: pricePerSlot,
            totalSlots: selectedSlots.length,
            totalPrice: getTotalPrice(),
          });
        }
      });

      // 3. SMS notification (send one summary SMS for all bookings)
      if (phone && selectedSlots.length > 0) {
        const firstSlot = selectedSlots[0];
        const smsText = generateBookingSMS({
          name,
          table,
          date: firstSlot.date,
          startTime: firstSlot.time,
          endTime: firstSlot.endTime,
          totalPrice: getTotalPrice(),
        });
        sendCustomerSMS({
          to: phone,
          message: smsText,
        });
      }

      // Wait a moment for initial notifications to start
      await Promise.race([
        Promise.allSettled(notificationPromises),
        new Promise(resolve => setTimeout(resolve, 1000)),
      ]);

      // Show notification status toast
      toast.success('📲 Confirmation messages sent!', {
        duration: 3000,
      });

      setSuccess(true);
      
      // Redirect after 4 seconds
      setTimeout(() => {
        if (user) {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }, 4000);
    } catch (err: any) {
      console.error('❌ Booking error:', err);
      const errorMessage = err.message || 'Failed to create bookings';
      setError(errorMessage);
      
      // Show error toast
      toast.error(`Booking failed: ${errorMessage}`, {
        duration: 5000,
        icon: '❌',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card max-w-2xl w-full"
        >
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {selectedSlots.length} Slot{selectedSlots.length > 1 ? 's' : ''} Booked Successfully!
            </h2>
            <div className="space-y-2 mt-4">
              <p className="text-green-400 font-semibold">
                ✅ Booking confirmed!
              </p>
              <p className="text-gray-400 text-sm">
                📧 Confirmation email sent {email && `to ${email}`}
              </p>
              <p className="text-gray-400 text-sm">
                📱 WhatsApp confirmation sent {phone && `to ${phone}`}
              </p>
              <p className="text-gray-400 text-sm">
                💬 SMS confirmation sent {phone && `to ${phone}`}
              </p>
              <p className="text-blue-400 text-sm mt-3">
                🔔 Admin has been notified about your booking
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {selectedSlots.map((slot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm"
              >
                <div>
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white ml-2">{slot.date} ({slot.dayOfWeek})</span>
                </div>
                <div>
                  <span className="text-gray-400">Time:</span>
                  <span className="text-white ml-2">{slot.time} - {slot.endTime}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Table:</span>
              <span className="text-white">{table}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration per slot:</span>
              <span className="text-white">{duration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Coaching:</span>
              <span className="text-white">{coaching ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-2">
              <span className="text-gray-400 font-semibold">Total Price:</span>
              <span className="text-white font-bold text-xl">PKR {getTotalPrice()}</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            See you at SPINERGY! 🏓
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Book Your Slots</h1>
            <p className="text-gray-400">Select multiple slots for the next 7 days</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${bookingStep === 'details' ? 'text-primary-blue' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === 'details' ? 'bg-primary-blue text-white' : 'bg-gray-700'}`}>
                1
              </div>
              <span className="font-semibold">Your Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-700"></div>
            <div className={`flex items-center gap-2 ${bookingStep === 'slots' ? 'text-primary-blue' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === 'slots' ? 'bg-primary-blue text-white' : 'bg-gray-700'}`}>
                2
              </div>
              <span className="font-semibold">Select Slots</span>
            </div>
          </div>

          {/* Club Timings Info */}
          <div className="card mb-6 bg-gradient-to-r from-primary-blue/10 to-primary-red/10 border-primary-blue">
            <h3 className="text-lg font-bold text-white mb-3">🕐 Club Timings</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-primary-blue font-semibold mb-1">Monday - Friday</div>
                <div className="text-gray-300">2:00 PM to 2:00 AM</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-primary-red font-semibold mb-1">Saturday - Sunday</div>
                <div className="text-gray-300">12:00 PM to 3:00 AM</div>
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {bookingStep === 'details' ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="card space-y-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">Step 1: Your Details</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field"
                        placeholder="Ahmed Ali"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input-field"
                        placeholder="03XX XXXXXXX"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Email (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="label">
                      Select Table <span className="text-red-500">*</span>
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => { setTable('Table A'); setTableId('table_a'); }}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          tableId === 'table_a'
                            ? 'border-primary-blue bg-primary-blue/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-bold text-lg mb-1">Table A</div>
                        <div className="text-sm">Tibhar (25mm ITTF Approved)</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTable('Table B'); setTableId('table_b'); }}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          tableId === 'table_b'
                            ? 'border-primary-blue bg-primary-blue/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="font-bold text-lg mb-1">Table B</div>
                        <div className="text-sm">DC-700 (25mm Professional)</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      Slot Duration <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={async () => {
                          setDuration(30);
                        }}
                        className={`p-4 rounded-lg border-2 transition ${
                          duration === 30
                            ? 'border-primary-blue bg-primary-blue/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                        disabled={!pricingLoaded}
                      >
                        <div className="text-2xl font-bold">30 min</div>
                        <div className="text-sm">
                          {pricingLoaded 
                            ? `PKR ${calculateBookingPriceSync(tableId, 30, false)}/slot` 
                            : 'Loading...'}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setDuration(60);
                        }}
                        className={`p-4 rounded-lg border-2 transition ${
                          duration === 60
                            ? 'border-primary-blue bg-primary-blue/10 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                        disabled={!pricingLoaded}
                      >
                        <div className="text-2xl font-bold">60 min</div>
                        <div className="text-sm">
                          {pricingLoaded 
                            ? `PKR ${calculateBookingPriceSync(tableId, 60, false)}/slot` 
                            : 'Loading...'}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* COACHING FEATURE - COMMENTED OUT FOR NOW (TO BE IMPLEMENTED LATER) */}
                  {/* <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coaching}
                        onChange={(e) => setCoaching(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-700 text-primary-blue focus:ring-primary-blue"
                        disabled={!pricingLoaded}
                      />
                      <span className="text-white">
                        {pricingLoaded ? (
                          <>
                            Add Coaching (+PKR {calculateBookingPriceSync(tableId, duration, true) - calculateBookingPriceSync(tableId, duration, false)}/slot) 👨‍🏫
                          </>
                        ) : (
                          'Add Coaching (Loading...) 👨‍🏫'
                        )}
                      </span>
                    </label>
                  </div> */}

                  <button
                    type="submit"
                    className="btn-primary w-full text-lg"
                  >
                    Continue to Slot Selection →
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="slots"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Step 2: Select Time Slots</h2>
                    <button
                      type="button"
                      onClick={() => setBookingStep('details')}
                      className="text-primary-blue hover:underline text-sm"
                    >
                      ← Back to Details
                    </button>
                  </div>

                  {/* Date Tabs */}
                  <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Select Date</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {next7Days.map((day) => (
                        <button
                          key={day.date}
                          type="button"
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
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Available Time Slots - {next7Days.find(d => d.date === selectedDate)?.dayOfWeek}
                        </h3>
                        <div className="text-sm text-gray-400">
                          {isWeekend(new Date(selectedDate)) ? '12 PM - 3 AM' : '2 PM - 2 AM'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {fetchingSlots && (
                          <div className="col-span-full text-center text-gray-400 py-4">
                            Loading available slots...
                          </div>
                        )}
                        {!fetchingSlots && availableTimeSlots.map((slot) => {
                          const selected = isSlotSelected(slot.value);
                          const booked = isSlotBooked(slot.value);
                          return (
                            <motion.button
                              key={slot.value}
                              type="button"
                              onClick={() => handleSlotToggle(slot)}
                              whileHover={!booked ? { scale: 1.05 } : {}}
                              whileTap={!booked ? { scale: 0.95 } : {}}
                              disabled={booked}
                              className={`p-3 rounded-lg border-2 transition ${
                                booked
                                  ? 'border-red-900 bg-red-900/20 text-red-400 cursor-not-allowed opacity-50'
                                  : selected
                                  ? 'border-primary-blue bg-primary-blue/20 text-white shadow-lg shadow-primary-blue/20'
                                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                              }`}
                            >
                              <div className="font-semibold text-sm">{slot.label}</div>
                              {booked && (
                                <div className="text-xs text-red-400 mt-1">✗ Booked</div>
                              )}
                              {!booked && selected && (
                                <div className="text-xs text-primary-blue mt-1">✓ Selected</div>
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
                      className="card bg-gradient-to-r from-primary-blue/10 to-primary-red/10 border-primary-blue"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                          Selected Slots ({selectedSlots.length})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setSelectedSlots([])}
                          className="text-red-500 hover:text-red-400 text-sm"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mb-4">
                        {selectedSlots.map((slot, index) => (
                          <div
                            key={index}
                            className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div className="text-sm">
                              <div className="text-white font-semibold">
                                {slot.time} - {slot.endTime}
                              </div>
                              <div className="text-gray-400">
                                {slot.date} ({slot.dayOfWeek})
                              </div>
                            </div>
                            <button
                              type="button"
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

                  <button
                    type="submit"
                    disabled={loading || selectedSlots.length === 0}
                    className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Processing...' : `Confirm ${selectedSlots.length} Booking${selectedSlots.length > 1 ? 's' : ''}`}
                  </button>
                  
                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-400">
                      ✅ You'll receive confirmation via:
                    </p>
                    <p className="text-xs text-gray-500">
                      📧 Email {email && '• '}📱 WhatsApp {phone && '• '}💬 SMS
                    </p>
                    <p className="text-xs text-blue-400 mt-2">
                      🔔 Admin will be notified automatically
                    </p>
                  </div>

                  <p className="text-sm text-gray-500 text-center">
                    By booking, you agree to our terms and conditions
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Book;
