import { useState, useRef } from 'react';
import {
  FaPrint,
  FaUpload,
  FaDollarSign,
  FaUser,
  FaFileInvoiceDollar,
  FaStamp,
} from 'react-icons/fa';
import AdminLayout from '../../components/Admin/AdminLayout';
import spinergyLogo from '../../assets/primary white variant logo copy.jpeg';

const AdminReceipt = () => {
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Table Tennis Club Fees');
  const [logo, setLogo] = useState<string>(spinergyLogo);
  const [showStamp, setShowStamp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AdminLayout
      title="Receipt Generator"
      subtitle="Create printable receipts for club payments"
    >
      <div className="min-h-[calc(100vh-6rem)] bg-gray-950 text-gray-100 flex flex-col lg:flex-row rounded-2xl overflow-hidden border border-gray-800">
        {/* CONTROL PANEL - HIDDEN WHEN PRINTING */}
        <div className="w-full lg:w-1/3 p-6 bg-gray-900 shadow-inner print:hidden z-10 overflow-y-auto border-r border-gray-800">
          <h1 className="text-2xl font-bold mb-6 text-blue-400 flex items-center gap-2">
            <FaFileInvoiceDollar className="w-6 h-6" />
            Receipt Generator
          </h1>

          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:bg-gray-800/60 transition">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full text-sm text-gray-400"
              >
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo Preview"
                    className="h-16 object-contain mb-2"
                  />
                ) : (
                  <FaUpload className="w-8 h-8 mb-2 text-gray-500" />
                )}
                <span className="font-medium text-blue-400">
                  Click to Upload Club Logo
                </span>
              </button>
            </div>

            {/* Form Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Customer Name
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="pl-10 w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Amount Paid (PKR)
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000 (PKR)"
                  className="pl-10 w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description / For
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly Membership"
                className="w-full p-2 bg-gray-900 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-100"
              />
            </div>

            {/* Stamp Toggle */}
            <button
              type="button"
              className="flex items-center gap-3 p-3 bg-blue-950/40 rounded-lg border border-blue-900/60 cursor-pointer w-full text-left"
              onClick={() => setShowStamp(!showStamp)}
            >
              <input
                type="checkbox"
                checked={showStamp}
                onChange={() => {}}
                className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex items-center gap-2 text-sm font-medium text-blue-300 select-none">
                <FaStamp className="w-4 h-4" />
                Add Digital Signature Stamp
              </div>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded flex items-center justify-center gap-2 mt-6 transition-colors shadow-md"
            >
              <FaPrint className="w-5 h-5" />
              Print Receipt
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Tip: Use the browser print settings to remove headers/footers for a
              clean receipt.
            </p>
          </div>
        </div>

        {/* RECEIPT PREVIEW AREA */}
        <div className="flex-1 bg-gray-950 p-4 md:p-8 overflow-auto flex justify-center items-start print:bg-white print:p-0 print:m-0 print:overflow-visible">
          {/* THE ACTUAL RECEIPT PAPER */}
          <div className="print-receipt-area bg-white w-full max-w-[21cm] min-h-[14cm] shadow-2xl p-8 md:p-12 relative print:shadow-none print:w-full print:max-w-none print:h-auto border border-gray-200 print:border-none text-gray-800">
            {/* Watermark Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden">
              <div className="transform -rotate-45 text-9xl font-black text-black select-none">
                SPINERGY
              </div>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-blue-900 pb-6 mb-8 relative z-10">
              <div className="flex flex-col justify-center">
                {/* Logo Section */}
                {logo ? (
                  <img
                    src={logo}
                    alt="Spinergy Logo"
                    className="h-24 w-auto object-contain mb-2"
                  />
                ) : (
                  <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-2 border-2 border-gray-300 border-dashed">
                    <span className="text-xs text-gray-400 text-center px-2">
                      Logo Placeholder
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <h1 className="text-4xl font-extrabold text-blue-900 tracking-wider">
                  SPINERGY
                </h1>
                <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase mt-1">
                  Table Tennis Club
                </p>
                <div className="mt-4 bg-blue-900 text-white px-4 py-1 inline-block font-bold text-sm tracking-widest uppercase rounded-sm">
                  Official Receipt
                </div>
              </div>
            </div>

            {/* Body Content */}
            <div className="space-y-8 mt-10 px-4 relative z-10">
              {/* Received From Row */}
              <div className="flex items-end gap-4 text-lg">
                <span className="font-bold text-gray-700 whitespace-nowrap">
                  Received with thanks from:
                </span>
                <div className="flex-1 border-b border-gray-400 border-dashed px-2 pb-1 font-serif text-xl text-blue-900 italic">
                  {customerName || '____________________________________'}
                </div>
              </div>

              {/* Amount Row */}
              <div className="flex items-end gap-4 text-lg">
                <span className="font-bold text-gray-700 whitespace-nowrap">
                  The Sum of Amount (PKR):
                </span>
                <div className="flex-1 border-b border-gray-400 border-dashed px-2 pb-1 font-serif text-xl text-blue-900 italic">
                  {amount ? `PKR ${amount}` : '____________________________________'}
                </div>
              </div>

              {/* Description Row */}
              <div className="flex items-end gap-4 text-lg">
                <span className="font-bold text-gray-700 whitespace-nowrap">
                  On Account of:
                </span>
                <div className="flex-1 border-b border-gray-400 border-dashed px-2 pb-1 font-serif text-xl text-black">
                  {description}
                </div>
              </div>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-24 flex justify-between items-end px-4 relative z-10">
              {/* Date Section */}
              <div className="text-center">
                <div className="w-48 border-b-2 border-gray-800 mb-2"></div>
                <p className="font-bold text-gray-600 text-sm uppercase tracking-wide">
                  Date
                </p>
              </div>

              {/* Signature Section with Optional Stamp */}
              <div className="text-center relative">
                {/* The Stamp Graphic */}
                {showStamp && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 -rotate-6 pointer-events-none z-20">
                    <div className="w-32 h-32 rounded-full border-4 border-blue-800 border-double flex items-center justify-center bg-blue-900/5 mix-blend-multiply opacity-90 shadow-sm backdrop-blur-[1px]">
                      <div className="text-center">
                        <h3 className="text-blue-800 font-black text-lg uppercase tracking-tight scale-x-110">
                          SPINERGY
                        </h3>
                        <div className="w-full h-px bg-blue-800 my-1"></div>
                        <p className="text-blue-800 text-[10px] font-bold uppercase tracking-widest">
                          Authorized
                        </p>
                        <p className="text-blue-800/80 text-[9px] uppercase mt-0.5">
                          Signature
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-48 border-b-2 border-gray-800 mb-2 relative z-10"></div>
                <p className="font-bold text-gray-600 text-sm uppercase tracking-wide">
                  Authorized Signature
                </p>
              </div>
            </div>

            {/* Footer Contact Info */}
            <div className="mt-12 text-center text-xs text-gray-400 border-t border-gray-100 pt-4 relative z-10">
              Thank you for your business!
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            @page { margin: 0.5cm; size: auto; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

            /* Hide everything by default */
            body * {
              visibility: hidden;
            }

            /* Only show the receipt area */
            .print-receipt-area,
            .print-receipt-area * {
              visibility: visible;
            }

            .print-receipt-area {
              position: absolute;
              inset: 0;
              margin: 0;
              width: 100% !important;
              max-width: none !important;
              box-shadow: none !important;
              border: none !important;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
};

export default AdminReceipt;

