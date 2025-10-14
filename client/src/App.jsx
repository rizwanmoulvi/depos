import { useState } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CreateAgreementForm from './components/CreateAgreementForm';
import BonzoIntegrationInfo from './components/BonzoIntegrationInfo';
import USDCFaucet from './components/USDCFaucet';
import { BlockchainProvider } from './contexts/BlockchainContext';

function App() {
  const [refresh, setRefresh] = useState(0);

  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };

  return (
    <BlockchainProvider>
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <main className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 gap-8">
            <Dashboard key={`dashboard-${refresh}`} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CreateAgreementForm onAgreementCreated={handleRefresh} />
              
              <div className="space-y-4">
                <BonzoIntegrationInfo />
                <USDCFaucet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </BlockchainProvider>
  );
}

export default App;