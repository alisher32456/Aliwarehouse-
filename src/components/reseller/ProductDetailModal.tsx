import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Facebook, ExternalLink, ShoppingCart, Info, Sparkles, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenOrderModal: (product: Product, selectedPrice: number) => void;
  onOpenCustomerLink: (username: string, productId: string, price: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenOrderModal,
  onOpenCustomerLink
}) => {
  const { user } = useAuth();

  const [sellingPrice, setSellingPrice] = useState<number>(1000);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    if (product) {
      setSellingPrice(
        Math.min(product.max_selling_price, Math.max(product.min_selling_price, product.base_price + 250))
      );
    }
  }, [product]);

  if (!product) return null;

  const resellerUsername = user?.username || 'store';
  const profit = Math.max(0, sellingPrice - product.base_price);
  const customerTotal = sellingPrice + product.delivery_charge;

  // Validation
  const isBelowMin = sellingPrice < product.min_selling_price;
  const isAboveMax = sellingPrice > product.max_selling_price;
  const isValidPrice = !isBelowMin && !isAboveMax;

  // Quick margin preset buttons
  const addMargin = (amount: number) => {
    const newPrice = product.base_price + amount;
    if (newPrice <= product.max_selling_price) {
      setSellingPrice(newPrice);
    }
  };

  // Generate shareable URL
  const productShareUrl = `${window.location.origin}/#/r/${resellerUsername}/product/${product.id}?price=${sellingPrice}`;

  // Generate copy text for WhatsApp
  const shareText = `*${product.name}*\n\n` +
    `⭐ Premium Quality | Ready to Dispatch\n` +
    `💰 Price: Rs. ${sellingPrice.toLocaleString()} only\n` +
    `🚚 Delivery: Rs. ${product.delivery_charge} (Cash on Delivery Available)\n` +
    `📦 Total Payable: Rs. ${customerTotal.toLocaleString()}\n\n` +
    `👉 Order online with Cash on Delivery:\n${productShareUrl}\n\n` +
    `💬 Reply to this message or order directly!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleFacebookShare = () => {
    const encodedUrl = encodeURIComponent(productShareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="truncate max-w-[80%]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              {product.category_name || 'Product'} · SKU: {product.sku}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate font-display">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Visual & Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
              <img
                src={product.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500">Platform Base Price:</span>
                <p className="text-2xl font-bold font-mono text-slate-900">
                  Rs. {product.base_price.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Standard delivery: Rs. {product.delivery_charge} · In Stock: {product.stock} units
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-900">Specifications &amp; Highlights:</p>
                <p className="whitespace-pre-line text-[11px] leading-relaxed">
                  {product.specifications || product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Core Feature: Custom Reseller Profit & Selling Price */}
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-emerald-950 font-display flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Your Custom Selling Price &amp; Profit
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Choose how much profit you want to earn on this product.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                Min: Rs. {product.min_selling_price} · Max: Rs. {product.max_selling_price}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Selling Price (Rs.)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={product.min_selling_price}
                    max={product.max_selling_price}
                    step={10}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className={`w-full px-3 py-2.5 text-base font-bold font-mono bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                      isValidPrice ? 'border-slate-300 focus:ring-emerald-500' : 'border-rose-400 focus:ring-rose-500 text-rose-700'
                    }`}
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">PKR</span>
                </div>

                {isBelowMin && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    Cannot sell below minimum allowable price Rs. {product.min_selling_price}
                  </p>
                )}
                {isAboveMax && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    Cannot exceed maximum allowable price Rs. {product.max_selling_price}
                  </p>
                )}

                {/* Quick step buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500">Quick Margins:</span>
                  <button
                    onClick={() => addMargin(150)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-md hover:bg-emerald-100"
                  >
                    +Rs. 150
                  </button>
                  <button
                    onClick={() => addMargin(250)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-md hover:bg-emerald-100"
                  >
                    +Rs. 250
                  </button>
                  <button
                    onClick={() => addMargin(400)}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-md hover:bg-emerald-100"
                  >
                    +Rs. 400
                  </button>
                </div>
              </div>

              {/* Profit calculation readout */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Platform Base:</span>
                  <span className="font-mono text-slate-700">Rs. {product.base_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Your Selling Price:</span>
                  <span className="font-mono font-bold text-slate-900">Rs. {sellingPrice.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Your Net Profit:</p>
                    <p className="text-[10px] text-slate-400">Credited on delivery</p>
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-700">
                    Rs. {profit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Sharing Suite */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Share to Social Media &amp; Customers
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleWhatsAppShare}
                disabled={!isValidPrice}
                className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleFacebookShare}
                disabled={!isValidPrice}
                className="py-2.5 px-3 bg-[#1877F2] hover:bg-[#1567d3] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Facebook className="w-4 h-4 fill-white" />
                <span>Facebook</span>
              </button>

              <button
                onClick={handleCopyLink}
                disabled={!isValidPrice}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={handleCopyText}
                disabled={!isValidPrice}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedText ? 'Text Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            {/* Test Customer link preview */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 truncate mr-2">
                Reseller Store Link: <span className="font-mono text-slate-900">/r/{resellerUsername}/product/{product.id}</span>
              </span>
              <button
                onClick={() => onOpenCustomerLink(resellerUsername, product.id, sellingPrice)}
                className="text-emerald-700 hover:text-emerald-900 font-semibold whitespace-nowrap flex items-center gap-1"
              >
                <span>Preview Customer View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="hidden sm:block text-xs">
            <span className="text-slate-500">Customer Total (COD): </span>
            <span className="font-mono font-bold text-slate-900">
              Rs. {customerTotal.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenOrderModal(product, sellingPrice);
              }}
              disabled={!isValidPrice}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Book Direct Order for Customer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
