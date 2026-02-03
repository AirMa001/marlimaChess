import React, { useState } from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { BANK_DETAILS } from '../constants';
import { toast } from 'sonner';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receiptImage: string) => void;
  email: string;
}

export const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({ isOpen, onClose, onSuccess, email }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File too large", { description: "Please upload an image smaller than 10MB." });
        e.target.value = ''; // Reset input
        return;
      }

      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!preview) return;
    setUploading(true);
    // Simulate upload delay or just pass the base64
    setTimeout(() => {
      onSuccess(preview);
      setUploading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h3 className="text-xl font-bold text-white">Bank Transfer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Bank Name</span>
              <span className="text-white font-medium text-sm sm:text-base">{BANK_DETAILS.bankName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t border-slate-900 pt-2 sm:border-0 sm:pt-0">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Account Number</span>
              <span className="text-green-400 font-mono font-bold tracking-wider text-lg sm:text-base">{BANK_DETAILS.accountNumber}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-t border-slate-900 pt-2 sm:border-0 sm:pt-0">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Account Name</span>
              <span className="text-white font-medium text-sm sm:text-base">{BANK_DETAILS.accountName}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Upload Receipt Proof</label>
            <div className="border-2 border-dashed border-slate-800 hover:border-green-500/30 rounded-2xl p-4 sm:p-8 text-center transition-all bg-slate-950/50 group">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Receipt" className="max-h-40 sm:max-h-48 mx-auto rounded-lg shadow-2xl" />
                  <button 
                    onClick={() => { setFile(null); setPreview(''); }}
                    className="absolute -top-3 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-xl transition-transform active:scale-90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3 py-4 sm:py-0">
                    <div className="p-4 bg-slate-900 rounded-2xl group-hover:bg-slate-800 transition-colors ring-1 ring-white/5">
                        <Upload className="h-6 w-6 text-slate-500 group-hover:text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-300">Tap to select photo</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">JPEG, PNG • Max 10MB</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full h-12 text-base font-medium"
            disabled={!preview || uploading}
          >
            {uploading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                </>
            ) : (
                <>
                    <Check className="mr-2 h-5 w-5" />
                    I Have Paid
                </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
