import AdminLayout from '../../components/Admin/AdminLayout';
import AdminSettings from './Settings';

const AdminSettingsPage = () => {
  return (
    <AdminLayout title="Settings" subtitle="Configure pricing, tables, and club settings">
      <AdminSettings />
    </AdminLayout>
  );
};

export default AdminSettingsPage;
