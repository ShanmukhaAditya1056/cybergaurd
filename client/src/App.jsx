import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { SecurityProvider } from './context/SecurityContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PhishingScanner from './pages/PhishingScanner';
import MalwareScanner from './pages/MalwareScanner';
import BreachMonitor from './pages/BreachMonitor';
import WifiScanner from './pages/WifiScanner';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SecurityProvider>
        <Router>
          <div className="min-h-screen bg-navy font-inter">
            <Navbar />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#102540',
                  color: '#E8F0FA',
                  border: '1px solid #1A3C5E',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#4CAF82',
                    secondary: '#E8F0FA',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#E05555',
                    secondary: '#E8F0FA',
                  },
                },
              }}
            />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/phishing" element={<PhishingScanner />} />
                <Route path="/malware" element={<MalwareScanner />} />
                <Route path="/breach" element={<BreachMonitor />} />
                <Route path="/wifi" element={<WifiScanner />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AnimatePresence>
          </div>
        </Router>
      </SecurityProvider>
    </QueryClientProvider>
  );
}

export default App;
