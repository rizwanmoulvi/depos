import { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { parseUSDC } from '../utils/format';

const CreateAgreementForm = ({ onAgreementCreated }) => {
  const { account, contracts } = useBlockchain();
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
      alert('Contract not connected');
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
      
      alert('Agreement created successfully!');
    } catch (error) {
      console.error('Error creating agreement:', error);
      alert(`Error creating agreement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Escrow Agreement</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Landlord Address</label>
            <input
              type="text"
              name="landlord"
              placeholder="0x..."
              value={formData.landlord}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Tenant Address</label>
            <input
              type="text"
              name="tenant"
              placeholder="0x..."
              value={formData.tenant}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Deposit Amount (USDC)</label>
            <input
              type="number"
              name="depositAmount"
              placeholder="1000"
              value={formData.depositAmount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Start Date</label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-2/3 border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-1/3 border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">End Date</label>
            <div className="flex space-x-2">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-2/3 border border-gray-300 rounded px-3 py-2"
                required
              />
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-1/3 border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Property Name</label>
            <input
              type="text"
              name="propertyName"
              placeholder="Apartment 123"
              value={formData.propertyName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Property Location</label>
            <input
              type="text"
              name="propertyLocation"
              placeholder="123 Main St"
              value={formData.propertyLocation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded bg-blue-600 text-white ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Agreement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAgreementForm;