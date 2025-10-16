import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { parseUSDC } from '../utils/format';
import { showSuccess, showError, showWarning } from '../utils/toast';

const CreateAgreementForm = ({ onAgreementCreated }) => {
  const { account, contracts, invalidateVaultsCache } = useBlockchain();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    landlord: '',
    tenant: '',
    depositAmount: '',
    startDate: '',
    startTime: '12:00',
    endDate: '',
    endTime: '12:00',
    propertyName: '',
    propertyLocation: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contracts.factory) {
      showWarning('Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert dates with time to timestamps
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const startDate = new Date(formData.startDate);
      startDate.setHours(startHours, startMinutes, 0);
      const startTs = Math.floor(startDate.getTime() / 1000);
      
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      const endDate = new Date(formData.endDate);
      endDate.setHours(endHours, endMinutes, 0);
      const endTs = Math.floor(endDate.getTime() / 1000);
      
      // Convert amount to USDC units (6 decimals)
      const depositAmount = parseUSDC(formData.depositAmount);
      
      // Call contract
      const tx = await contracts.factory.createAgreement(
        formData.landlord,
        formData.tenant,
        depositAmount,
        startTs,
        endTs,
        formData.propertyName,
        formData.propertyLocation
      );
      
      await tx.wait();
      
      // Invalidate cache so new agreement will be fetched
      if (invalidateVaultsCache) {
        invalidateVaultsCache();
      }
      
      // Reset form
      setFormData({
        landlord: '',
        tenant: '',
        depositAmount: '',
        startDate: '',
        startTime: '12:00',
        endDate: '',
        endTime: '12:00',
        propertyName: '',
        propertyLocation: ''
      });
      
      if (onAgreementCreated) {
        onAgreementCreated();
      }
      
      showSuccess('Agreement Created!', 'New rental agreement has been created successfully');
    } catch (error) {
      console.error('Error creating agreement:', error);
      showError(error.message || 'Failed to create agreement');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ label, icon, ...props }) => (
    <div className="group">
      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 
                   transition-all duration-200 outline-none"
      />
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-2xl">
            📝
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Create Agreement</h2>
            <p className="text-sm text-gray-400">Set up a new rental agreement with security deposit</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Parties */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold text-white">Agreement Parties</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <InputField
              label="Landlord Wallet Address"
              icon="🏠"
              type="text"
              name="landlord"
              placeholder="0x..."
              value={formData.landlord}
              onChange={handleChange}
              required
            />
            <InputField
              label="Tenant Wallet Address"
              icon="👤"
              type="text"
              name="tenant"
              placeholder="0x..."
              value={formData.tenant}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Section 2: Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold text-white">Agreement Timeline</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <span className="text-lg">📅</span>
                Start Date & Time
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white 
                           focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/10 
                           transition-all duration-200 outline-none"
                  required
                />
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white 
                           focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/10 
                           transition-all duration-200 outline-none"
                  required
                />
              </div>
            </div>
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <span className="text-lg">🏁</span>
                End Date & Time
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white 
                           focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/10 
                           transition-all duration-200 outline-none"
                  required
                />
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white 
                           focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/10 
                           transition-all duration-200 outline-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Property Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold text-white">Property Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <InputField
              label="Property Name"
              icon="🏢"
              type="text"
              name="propertyName"
              placeholder="e.g., Downtown Apartment 5B"
              value={formData.propertyName}
              onChange={handleChange}
              required
            />
            <InputField
              label="Property Location"
              icon="📍"
              type="text"
              name="propertyLocation"
              placeholder="e.g., 123 Main Street, NYC"
              value={formData.propertyLocation}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Section 4: Deposit */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">
              4
            </div>
            <h3 className="text-lg font-semibold text-white">Security Deposit</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-10">
            <div className="relative md:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <span className="text-lg">💰</span>
                Deposit Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="depositAmount"
                  placeholder="1000"
                  value={formData.depositAmount}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-16 py-3.5 text-white placeholder-gray-500 
                           focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:bg-white/10 
                           transition-all duration-200 outline-none text-lg font-semibold"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-yellow-500/20 rounded-lg">
                  <span className="text-yellow-400 font-bold text-sm">USDC</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <span>💡</span>
                Funds will be supplied to Bonzo Finance to earn yield
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            type="submit"
            disabled={isLoading}
            className={`group relative px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              isLoading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 hover:-translate-y-0.5'
            }`}
          >
            <span className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Agreement...
                </>
              ) : (
                <>
                  Create Agreement
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAgreementForm;