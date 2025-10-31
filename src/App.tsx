import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Book from './pages/Book';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin/Admin';
import Ratings from './pages/Ratings';
import Rules from './pages/Rules';
import Ads from './pages/Ads';
import Contact from './pages/Contact';
import Suggestions from './pages/Suggestions';
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';

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
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Book />} />
            <Route path="/ratings" element={<Ratings />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
