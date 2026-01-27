import AdminLayout from '../../components/Admin/AdminLayout';
import AdminBooking from './AdminBooking';

const AdminAddBookingPage = () => {
  return (
    <AdminLayout 
      title="Add New Booking" 
      subtitle="Manually add bookings for WhatsApp, phone, or walk-in customers"
    >
      <AdminBooking />
    </AdminLayout>
  );
};

export default AdminAddBookingPage;
