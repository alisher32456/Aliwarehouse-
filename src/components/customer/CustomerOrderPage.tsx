import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, CheckCircle2, ShoppingBag, MapPin, Phone, User as UserIcon, AlertCircle, ArrowLeft, Star } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';

interface CustomerOrderPageProps {
  username: string;
  productId: string;
  initialPrice?: number;
  onBackToHome: () => void;
}

export const CustomerOrderPage: React.FC<CustomerOrderPageProps> = ({
  username,
  productId,
  initialPrice,
  onBackToHome
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reseller, setReseller] = useState<{ id: string; name: string; business_name?: string; city?: string } | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [sellingPrice, setSellingPrice] = useState<number>(initialPrice || 0);

  // Customer Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerProvince, setCustomerProvince] = useState('Punjab');
  const [customerCity, setCustomerCity] = useState('');
  const [customerArea, setCustomerArea] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerLandmark, setCustomerLandmark] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ order_number: string; total_amount: number } | null>(null);

  useEffect(() => {
    async function loadStorefront() {
      setLoading(true);
      setError(null);
      const res = await api.getCustomerStorefront(username, productId);
      if (res.success && res.data) {
        setReseller(res.data.reseller);
        setProduct(res.data.product);
        if (!initialPrice || initialPrice < res.data.product.min_selling_price) {
          setSellingPrice(res.data.product.min_selling_price + 250);
        } else {
          setSellingPrice(initialPrice);
        }
      } else {
        setError(res.message || 'Product or store link not found');
      }
      setLoading(false);
    }
    loadStorefront();
  }, [username, productId, initialPrice]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Store Link Unavailable</h2>
          <p className="text-xs text-slate-500">{error || 'This product link is no longer active.'}</p>
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
          >
            Visit Rozgar Marketplace
          </button>
        </div>
      </div>
    );
  }

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const allImages: string[] = (product.images && product.images.length > 0)
    ? product.images.map((img: any) => typeof img === 'string' ? img : img.image_url)
    : [product.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'];

  // Order Calculations
  const subtotal = sellingPrice * quantity;
  const deliveryFee = product.delivery_charge;
  const totalPayable = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerCity || !customerAddress) {
      alert('Please fill all mandatory delivery details');
      return;
    }

    setOrderSubmitting(true);
    try {
      const res = await api.createCustomerOrder({
        reseller_id: reseller?.id,
        reseller_username: username,
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
        notes: orderNotes
      });

      if (res.success && res.data) {
        setOrderSuccess({
          order_number: res.data.order_number,
          total_amount: res.data.total_amount
        });
      } else {
        alert(res.message || 'Could not place order');
      }
    } catch (err: any) {
      alert(err.message || 'Error communicating with server');
    } finally {
      setOrderSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Order Confirmed (Cash on Delivery)
            </span>
            <h1 className="text-xl font-bold text-slate-900 font-display mt-2">
              Thank You, {customerName}!
            </h1>
            <p className="text-xs text-slate-500">
              Your order has been forwarded to our warehouse for dispatch.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Reference:</span>
              <span className="font-mono font-bold text-slate-900">#{orderSuccess.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Merchant Store:</span>
              <span className="font-semibold text-slate-900">{reseller?.business_name || reseller?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Cash to Pay Courier:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                Rs. {orderSuccess.total_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Address:</span>
              <span className="text-slate-800 text-right truncate max-w-[200px]">{customerAddress}, {customerCity}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-left flex items-start gap-2.5 text-xs text-emerald-900">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Standard delivery takes 2 to 4 working days via TCS Courier. Please keep exact cash ready upon arrival.
            </p>
          </div>

          <button
            onClick={onBackToHome}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Merchant Branding Top Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              {reseller?.name.charAt(0) || 'R'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {reseller?.business_name || `${reseller?.name}'s Store`}
              </p>
              <p className="text-[10px] text-slate-500">Verified Rozgar Merchant · {reseller?.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
            <Truck className="w-3.5 h-3.5" />
            <span>Cash on Delivery</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Product Visual & Info Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
              <img
                src={allImages[activeImageIdx] || allImages[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/product_embroidered_kurti_1790877397139.jpg';
                }}
              />
              {allImages.length > 1 && (
                <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {activeImageIdx + 1} / {allImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail navigation */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 scale-102'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/product_embroidered_kurti_1790877397139.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                {product.category_name}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display mt-0.5">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 mt-2 text-xs">
                <div className="flex items-center text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 mr-1" />
                  <span>{product.rating}</span>
                </div>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">{product.reviews_count} verified buyer ratings</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-500">Special Price:</span>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  Rs. {sellingPrice.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500">Delivery Fee:</span>
                <div className="text-sm font-semibold font-mono text-slate-700">
                  Rs. {deliveryFee}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Product Specifications:</p>
              <p className="whitespace-pre-line text-[11px] leading-relaxed">
                {product.specifications || product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Checkout Form */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Fast Cash on Delivery Checkout
              </h2>
              <p className="text-xs text-slate-500">
                No bank account or card needed. Pay cash when the courier arrives at your doorstep.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe &amp; Protected</span>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-5">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <label className="text-xs font-semibold text-slate-800">
                Quantity:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-100"
                >
                  -
                </button>
                <span className="font-mono font-bold text-slate-900 text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 flex items-center justify-center hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Sadia Imran"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-2 gap-3.5">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="e.g. Lahore / Karachi"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Colony</label>
                <input
                  type="text"
                  value={customerArea}
                  onChange={(e) => setCustomerArea(e.target.value)}
                  placeholder="e.g. DHA / Johar Town"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nearest Landmark</label>
                <input
                  type="text"
                  value={customerLandmark}
                  onChange={(e) => setCustomerLandmark(e.target.value)}
                  placeholder="e.g. Near Shell Pump"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complete Street Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House / Flat #, Street #, Sector..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Total Payable Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal ({quantity}x):</span>
                <span className="font-mono text-white">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>TCS Delivery Charges:</span>
                <span className="font-mono text-white">Rs. {deliveryFee}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-sm">Total Cash on Delivery:</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  Rs. {totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={orderSubmitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {orderSubmitting ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Confirm Cash on Delivery Order</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
