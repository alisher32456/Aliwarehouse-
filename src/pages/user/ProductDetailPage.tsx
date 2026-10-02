import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Copy, Check, MessageSquare, Facebook, ExternalLink, ShoppingCart, Sparkles, Star } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CreateOrderModal } from '../../components/reseller/CreateOrderModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sellingPrice, setSellingPrice] = useState<number>(1000);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      const res = await api.getProductById(id);
      if (res.success && res.data) {
        setProduct(res.data.product);
        setSellingPrice(
          Math.min(res.data.product.max_selling_price, Math.max(res.data.product.min_selling_price, res.data.product.base_price + 250))
        );
      } else {
        setError(res.message || 'Product not found');
      }
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">{error || 'Product not found'}</p>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
        >
          Return to Wholesale Catalog
        </button>
      </div>
    );
  }

  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const resellerUsername = user?.username || 'store';
  const profit = Math.max(0, sellingPrice - product.base_price);
  const customerTotal = sellingPrice + product.delivery_charge;

  const isBelowMin = sellingPrice < product.min_selling_price;
  const isAboveMax = sellingPrice > product.max_selling_price;
  const isValidPrice = !isBelowMin && !isAboveMax;

  const allImages: string[] = product.images && product.images.length > 0
    ? product.images.map(img => img.image_url)
    : [product.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'];

  const addMargin = (amount: number) => {
    const newPrice = product.base_price + amount;
    if (newPrice <= product.max_selling_price) {
      setSellingPrice(newPrice);
    }
  };

  const productShareUrl = `${window.location.origin}/r/${resellerUsername}/product/${product.id}?price=${sellingPrice}`;

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <button
        onClick={() => navigate('/products')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Product Visual & Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            {/* Main Featured Photo */}
            <div className="aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative">
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

            {/* Thumbnail Navigation Bar for Multiple Images (Requirement 2) */}
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                {product.category_name} · SKU: {product.sku}
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
                <span className="text-[11px] text-slate-500">Platform Base Price:</span>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  Rs. {product.base_price.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500">Delivery Fee:</span>
                <div className="text-sm font-semibold font-mono text-slate-700">
                  Rs. {product.delivery_charge}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Specifications &amp; Details:</p>
              <p className="whitespace-pre-line text-[11px] leading-relaxed">
                {product.specifications || product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Core Reseller Margin Customizer */}
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 font-display flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Customize Your Selling Price &amp; Profit
              </h3>
              <p className="text-[11px] text-emerald-800">
                Choose your customer selling price within admin-defined parameters.
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
                  type="button"
                  onClick={() => addMargin(150)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-md hover:bg-emerald-100"
                >
                  +Rs. 150
                </button>
                <button
                  type="button"
                  onClick={() => addMargin(250)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-emerald-300 text-emerald-800 rounded-md hover:bg-emerald-100"
                >
                  +Rs. 250
                </button>
                <button
                  type="button"
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
                  <p className="text-[10px] text-slate-400">Credited upon delivery clearance</p>
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
              Customer COD Link: <span className="font-mono text-slate-900">/r/{resellerUsername}/product/{product.id}</span>
            </span>
            <a
              href={`/r/${resellerUsername}/product/${product.id}?price=${sellingPrice}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-900 font-semibold whitespace-nowrap flex items-center gap-1"
            >
              <span>Preview Customer View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500">Customer Total (COD): </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              Rs. {customerTotal.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsOrderModalOpen(true)}
            disabled={!isValidPrice}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Book Direct Order for Customer</span>
          </button>
        </div>
      </div>

      {/* Direct Order Modal */}
      {isOrderModalOpen && (
        <CreateOrderModal
          product={product}
          initialPrice={sellingPrice}
          onClose={() => setIsOrderModalOpen(false)}
          onOrderSuccess={(orderNum) => {
            navigate('/orders');
            alert(`Order #${orderNum} created successfully! Forwarded to warehouse.`);
          }}
        />
      )}
    </div>
  );
};
