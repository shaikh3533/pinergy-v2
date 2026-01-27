import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Book from './pages/Book';
import Dashboard from './pages/Dashboard';
import Ratings from './pages/Ratings';
import Rules from './pages/Rules';
import Ads from './pages/Ads';
import Contact from './pages/Contact';
import Suggestions from './pages/Suggestions';
import Gallery from './pages/Gallery';
import Coaches from './pages/Coaches';
import Store from './pages/Store';
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import ResetPassword from './pages/Auth/ResetPassword';

// League Pages
import LeaguesList from './pages/Leagues/LeaguesList';
import LeagueDetail from './pages/Leagues/LeagueDetail';
import LeagueMatches from './pages/Leagues/LeagueMatches';
import LeagueStandings from './pages/Leagues/LeagueStandings';
import GlobalRankings from './pages/Leagues/GlobalRankings';

// Admin Pages (New)
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminBookingsPage from './pages/Admin/AdminBookingsPage';
import AdminAddBookingPage from './pages/Admin/AdminAddBookingPage';
import AdminTournamentsPage from './pages/Admin/AdminTournamentsPage';
import AdminGallery from './pages/Admin/AdminGallery';
import AdminAdsPage from './pages/Admin/AdminAdsPage';
import AdminSettingsPage from './pages/Admin/AdminSettingsPage';
import AdminCoaches from './pages/Admin/AdminCoaches';
import AdminStore from './pages/Admin/AdminStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#0047FF',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#FF1A1A',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes (with Layout) */}
          <Route element={<Layout><Home /></Layout>} path="/" />
          <Route element={<Layout><Book /></Layout>} path="/book" />
          <Route element={<Layout><Ratings /></Layout>} path="/ratings" />
          <Route element={<Layout><Rules /></Layout>} path="/rules" />
          <Route element={<Layout><Ads /></Layout>} path="/ads" />
          <Route element={<Layout><Contact /></Layout>} path="/contact" />
          <Route element={<Layout><Suggestions /></Layout>} path="/suggestions" />
          <Route element={<Layout><Gallery /></Layout>} path="/gallery" />
          <Route element={<Layout><Coaches /></Layout>} path="/coaches" />
          <Route element={<Layout><Store /></Layout>} path="/store" />
          <Route element={<Layout><SignIn /></Layout>} path="/auth/signin" />
          <Route element={<Layout><SignUp /></Layout>} path="/auth/signup" />
          <Route element={<Layout><ResetPassword /></Layout>} path="/auth/reset-password" />
          
          {/* League Routes (with Layout) */}
          <Route element={<Layout><LeaguesList /></Layout>} path="/leagues" />
          <Route element={<Layout><LeagueDetail /></Layout>} path="/leagues/:leagueId" />
          <Route element={<Layout><LeagueMatches /></Layout>} path="/leagues/:leagueId/matches" />
          <Route element={<Layout><LeagueStandings /></Layout>} path="/leagues/:leagueId/standings" />
          <Route element={<Layout><GlobalRankings /></Layout>} path="/rankings" />
          
          {/* User Dashboard (with Layout) */}
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            }
          />
          
          {/* Admin Routes (WITHOUT Layout - AdminLayout handles its own layout) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requireAdmin>
                <AdminBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-booking"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAddBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tournaments"
            element={
              <ProtectedRoute requireAdmin>
                <AdminTournamentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/gallery"
            element={
              <ProtectedRoute requireAdmin>
                <AdminGallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ads"
            element={
              <ProtectedRoute requireAdmin>
                <AdminAdsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coaches"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCoaches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/store"
            element={
              <ProtectedRoute requireAdmin>
                <AdminStore />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
