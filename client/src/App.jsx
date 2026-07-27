import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import store from './store/store';
import Navbar from './components/Navbar';
import CookieConsent from './components/CookieConsent';
import PermissionsGate from './components/PermissionsGate';
import Dashboard from './pages/Dashboard';
import PhishingScanner from './pages/PhishingScanner';
import MalwareScanner from './pages/MalwareScanner';
import BreachMonitor from './pages/BreachMonitor';
import WifiScanner from './pages/WifiScanner';
import PasswordStrength from './pages/PasswordStrength';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// On GitHub Pages the app is served from a project subpath (/repo/) with no
// server-side routing, so HashRouter (URLs like /repo/#/phishing) avoids 404s
// on deep-links and refreshes. Local dev keeps clean BrowserRouter URLs.
const Router = process.env.REACT_APP_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;

// Inner component that can use useLocation (must be inside Router)
function AppRoutes() {
  const location = useLocation();

  return (
    <PermissionsGate>
      <div className="min-h-screen bg-navy font-inter">
        <Navbar />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#1C1C1C',
              border: '1px solid #E6E6E6',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#1FA463',
                secondary: '#1C1C1C',
              },
            },
            error: {
              iconTheme: {
                primary: '#E23744',
                secondary: '#1C1C1C',
              },
            },
          }}
        />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/phishing" element={<PhishingScanner />} />
            <Route path="/malware" element={<MalwareScanner />} />
            <Route path="/breach" element={<BreachMonitor />} />
            <Route path="/wifi" element={<WifiScanner />} />
            <Route path="/password" element={<PasswordStrength />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </div>
    </PermissionsGate>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />

        {/* Cookie consent — shows on top of everything */}
        <CookieConsent />
      </Router>
    </Provider>
  );
}

export default App;
