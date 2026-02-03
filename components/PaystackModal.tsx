import React from 'react';
import { REGISTRATION_FEE } from '../constants';
import { Button } from './Button';

interface PaystackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reference: string) => void;
  email: string;
  amount: number;
}

export const PaystackModal: React.FC<PaystackModalProps> = ({ isOpen, onClose, onSuccess, email, amount }) => {
  if (!isOpen) return null;

  const handlePayment = () => {
    // Simulate API delay
    setTimeout(() => {
        const mockRef = "REF-" + Math.random().toString(36).substring(2, 9).toUpperCase();
        onSuccess(mockRef);
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-slate-900 p-6 text-center">
            <h3 className="text-xl font-bold text-white">Secure Checkout</h3>
            <p className="text-slate-400 text-sm mt-1">Powered by Paystack (Mock)</p>
        </div>
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-600">Customer</span>
                <span className="font-medium text-gray-900">{email}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold text-emerald-600 text-xl">₦{amount.toLocaleString()}</span>
            </div>
            
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                ⚠️ This is a demo. No real money will be charged. Click "Pay Now" to simulate a successful transaction.
            </div>

            <div className="pt-4 flex space-x-3">
                <button 
                    onClick={onClose}
                    className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
                <Button 
                    onClick={handlePayment}
                    variant="secondary"
                    className="flex-1 py-3"
                >
                    Pay Now
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};