const BonzoIntegrationInfo = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">💰 Bonzo Finance Integration</h2>
      
      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded">
        <p className="text-gray-700">
          Deposits are automatically supplied to Bonzo Finance lending pool to generate yield. 
          No manual intervention required!
        </p>
      </div>
      
      <div className="mt-4">
        <h3 className="font-semibold text-gray-800 mb-2">How It Works</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Tenant deposits are supplied to Bonzo Finance lending pool</li>
          <li>Yield is automatically generated from real lending activities</li>
          <li>aTokens (aUSDC) represent your deposit + accrued yield</li>
          <li>When agreements settle, yield is distributed to landlords</li>
        </ul>
        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Lending Pool:</span>
            <span className="font-mono ml-2">{import.meta.env.VITE_LENDING_POOL_ADDRESS}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BonzoIntegrationInfo;