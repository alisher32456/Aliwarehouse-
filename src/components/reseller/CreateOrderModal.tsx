import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShoppingBag, Truck, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CreateOrderModalProps {
  product: Product | null;
  initialPrice?: number;
  onClose: () => void;
  onOrderSuccess: (orderNumber: string) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  product,
  initialPrice,
  onClose,
  onOrderSuccess
}) => {
  const { user } = useAuth();

  const [quantity, setQuantity] = useState<number>(1);
  const [sellingPrice, setSellingPrice] = useState<number>(initialPrice || 1000);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerProvince, setCustomerProvince] = useState('Punjab');
  const [customerCity, setCustomerCity] = useState('');
  const [customerArea, setCustomerArea] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerLandmark, setCustomerLandmark] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSellingPrice(
        initialPrice || Math.max(product.min_selling_price, product.base_price + 250)
      );
      setQuantity(1);
      setError(null);
    }
  }, [product, initialPrice]);

  if (!product) return null;

  // Calculations
  const subtotal = sellingPrice * quantity;
  const deliveryCharge = product.delivery_charge;
  const customerTotal = subtotal + deliveryCharge;
  const resellerProfit = (sellingPrice - product.base_price) * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName || !customerPhone || !customerCity || !customerAddress) {
      setError('Please provide complete customer name, mobile, city and delivery address');
      return;
    }

    if (sellingPrice < product.min_selling_price || sellingPrice > product.max_selling_price) {
      setError(`Selling price must be between Rs. ${product.min_selling_price} and Rs. ${product.max_selling_price}`);
      return;
    }

    setLoading(true);

    try {
      const res = await api.createCustomerOrder({
        reseller_id: user?.id,
        reseller_username: user?.username,
        product_id: product.id,
        quantity,
        selling_price: sellingPrice,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_province: customerProvince,
        customer_city: customerCity,
        customer_area: customerArea,
        customer_address: customerAddress,
        customer_landmark: customerLandmark,
        notes
      });

      if (res.success && res.data) {
        onOrderSuccess(res.data.order_number);
        onClose();
      } else {
        setError(res.message || 'Failed to place order');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Direct Customer Booking
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display mt-0.5">
              Create Customer Order (COD)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Product Summary Mini Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <img
              src={product.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Platform Base: Rs. {product.base_price.toLocaleString()} · Delivery: Rs. {product.delivery_charge}
              </p>
            </div>
          </div>

          {/* Pricing & Quantity Inputs */}
          <div className="grid grid-cols-2 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price per item (Rs.)
              </label>
              <input
                type="number"
                min={product.min_selling_price}
                max={product.max_selling_price}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Quantity
              </label>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-sm font-bold font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Sadia Imran"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Mobile (WhatsApp)</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Delivery Location (Pakistan)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Province</label>
                <select
                  value={customerProvince}
                  onChange={(e) => setCustomerProvince(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="KPK">Khyber Pakhtunkhwa</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Islamabad Capital">Islamabad Capital</option>
                  <option value="Azad Kashmir">Azad Kashmir</option>
                  <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="e.g. Lahore, Karachi, Rawalpindi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Colony</label>
                <input
                  type="text"
                  value={customerArea}
                  onChange={(e) => setCustomerArea(e.target.value)}
                  placeholder="e.g. DHA Phase 5 / Gulshan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={customerLandmark}
                  onChange={(e) => setCustomerLandmark(e.target.value)}
                  placeholder="e.g. Near Jalal Sons"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Complete Street Address</label>
              <textarea
                required
                rows={2}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House #, Street #, Sector..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Customer Subtotal ({quantity}x):</span>
              <span className="font-mono text-white">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>TCS Delivery Fee:</span>
              <span className="font-mono text-white">Rs. {deliveryCharge}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
              <span>Customer Pays on Delivery:</span>
              <span className="font-mono text-emerald-400">Rs. {customerTotal.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-emerald-300">
              <span>Your Expected Reseller Profit:</span>
              <span className="font-mono font-bold text-base">Rs. {resellerProfit.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
          >
            {loading ? 'Booking Order & Notifying Warehouse...' : 'Confirm Cash on Delivery Order'}
          </button>
        </form>
      </div>
    </div>
  );
};
