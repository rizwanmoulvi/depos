import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { BlockchainProvider } from './contexts/BlockchainContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LandlordPage from './pages/LandlordPage';
import TenantPage from './pages/TenantPage';

function App() {
  return (
    <Router>
      <BlockchainProvider>
        <div className="min-h-screen bg-gray-900">
          <Navbar />
          <Toaster
            position="top-right"
            toastOptions={{
              className: '',
              style: {
                marginTop: '60px',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/role-selection" element={<RoleSelectionPage />} />
            <Route path="/landlord" element={<LandlordPage />} />
            <Route path="/tenant" element={<TenantPage />} />
          </Routes>
        </div>
      </BlockchainProvider>
    </Router>
  );
}

export default App;