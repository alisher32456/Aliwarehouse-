import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Truck, Smartphone, Share2, Wallet, Users, HelpCircle, Sparkles } from 'lucide-react';
import { Category, Product } from '../../types';

interface LandingPageProps {
  categories: Category[];
  featuredProducts: Product[];
  onExploreCatalog: () => void;
  onOpenAuth: () => void;
  onSelectProduct: (product: Product) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  categories,
  featuredProducts,
  onExploreCatalog,
  onOpenAuth,
  onSelectProduct
}) => {
  // Profit simulator state
  const [sellingPrice, setSellingPrice] = useState<number>(1250);
  const basePrice = 1000;
  const [ordersPerMonth, setOrdersPerMonth] = useState<number>(30);

  const profitPerItem = Math.max(0, sellingPrice - basePrice);
  const projectedMonthlyProfit = profitPerItem * ordersPerMonth;

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-4 shadow-xl">
        <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
          <img
            src="/src/assets/images/hero_reseller_app_1790877386517.jpg"
            alt="Pakistani Reseller Entrepreneur"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-24 text-center sm:text-left grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Pakistan's Zero-Capital Social Commerce Platform
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-display leading-tight text-balance">
              Start Your Online Reselling Business Today.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Source verified products at direct wholesale rates. Set your custom profit margin, share on WhatsApp and social media, and let us handle nationwide Cash on Delivery.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <span>Start Reselling Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onExploreCatalog}
                className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2"
              >
                <span>Browse Wholesale Catalog</span>
              </button>
            </div>

            {/* Trust factors */}
            <div className="pt-4 flex flex-wrap items-center justify-center sm:justify-start gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Inventory Investment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Nationwide TCS COD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Weekly Easypaisa Payouts</span>
              </div>
            </div>
          </div>

          {/* Quick Real-World Example Card */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl text-left space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Business Model Example
                </span>
                <span className="text-xs text-slate-300">Stitched Lawn Suit</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-300">Platform Base Price:</span>
                  <span className="font-mono font-semibold text-white">Rs. 1,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-300">Your Chosen Reselling Price:</span>
                  <span className="font-mono font-bold text-emerald-400">Rs. 1,250</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-300">Customer Pays (COD):</span>
                  <span className="font-mono text-white">Rs. 1,250 + Delivery</span>
                </div>
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-slate-200 font-medium">Your Net Profit:</p>
                    <p className="text-[10px] text-emerald-300">Released to wallet after delivery</p>
                  </div>
                  <span className="text-xl font-bold font-mono text-emerald-300">Rs. 250</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                * Note: Wholesale supplier costs remain confidential to the platform. You control your customer selling price and margin within set limits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Profit Calculator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display">
              Calculate Your Potential Reseller Earnings
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              See how setting your custom margins scales into significant monthly profits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/70">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span>Platform Base Price:</span>
                  <span className="font-mono text-slate-900">Rs. {basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Your Selling Price:</span>
                  <span className="font-mono text-emerald-700 text-sm">Rs. {sellingPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={2000}
                  step={50}
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Min: Rs. 1,000</span>
                  <span>Max: Rs. 2,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Customer Orders per Month:</span>
                  <span className="font-mono text-emerald-700 text-sm">{ordersPerMonth} orders</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={150}
                  step={5}
                  value={ordersPerMonth}
                  onChange={(e) => setOrdersPerMonth(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>5 orders</span>
                  <span>150 orders</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 bg-emerald-900 text-white rounded-2xl shadow-lg">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                  Estimated Profit Breakdown
                </span>
                <p className="text-xs text-slate-300">
                  Transparent earnings based on delivered Cash-on-Delivery customer orders.
                </p>
              </div>

              <div className="space-y-3 py-3 border-y border-emerald-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Profit per item:</span>
                  <span className="font-mono font-bold text-white text-sm">Rs. {profitPerItem.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Monthly volume:</span>
                  <span className="font-mono text-white">{ordersPerMonth} successful deliveries</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-emerald-200">Projected Monthly Reseller Profit:</span>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-emerald-400 mt-1">
                  Rs. {projectedMonthlyProfit.toLocaleString()}
                </div>
              </div>

              <button
                onClick={onOpenAuth}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-md shadow-emerald-950/40 text-center"
              >
                Sign Up &amp; Start Selling
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4-Step Social Commerce Flow */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Simple 4-Step Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display mt-3">
            How Social Commerce Reselling Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            No stock purchasing required. Earn profit by connecting your social network to wholesale suppliers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Select Products</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore 100+ wholesale factory products spanning ladies suits, gadgets, and kitchen essentials.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Add Your Margin</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Decide your customer price. If base price is Rs. 1,000, set your price at Rs. 1,250 to earn Rs. 250 profit.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Share on WhatsApp</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate personalized customer ordering links and one-click share to WhatsApp groups and Facebook.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900 font-display">Get Paid to Wallet</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once courier delivers and collects cash, your profit is credited to your wallet for instant Easypaisa withdrawal.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Featured Wholesale Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-display">
              Trending Wholesale Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              High-demand products with healthy profit margins for resellers.
            </p>
          </div>
          <button
            onClick={onExploreCatalog}
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.slice(0, 4).map((p) => {
            const maxProfit = p.max_selling_price - p.base_price;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={p.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    Earn up to Rs. {maxProfit.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                      {p.category_name || 'Fashion'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 mt-0.5 group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-slate-500">Base Price:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        Rs. {p.base_price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px] text-emerald-700 font-medium">
                      <span>Max Selling:</span>
                      <span>Rs. {p.max_selling_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Everything you need to know about starting as a Rozgar reseller.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Do I have to buy stock upfront?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No. You never buy inventory upfront. When a customer confirms an order with you, our fulfillment center packages the product and ships it directly to your customer with Cash on Delivery.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              When does my reseller profit become available?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When an order is created, your profit is recorded in your wallet as <strong>Pending Profit</strong>. Once the courier delivers the parcel, collects cash, and the 7-day customer return period completes, your profit automatically transitions into <strong>Available Balance</strong>.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              How do I withdraw my earnings?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              As soon as your Available Balance reaches the minimum threshold of Rs. 500, you can request an instant payout to your Easypaisa, JazzCash, or Bank Account. Payouts are reviewed and dispatched within 24 hours.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              What happens if a customer returns or cancels an order?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an order is cancelled or returned during the return window, the pending profit is reversed and the product is returned to the supplier warehouse. You are not penalized or charged any inventory penalty.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-slate-200 bg-white pt-12 pb-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                R
              </div>
              <span className="font-bold text-lg text-slate-900 font-display">Rozgar</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pakistan's trusted wholesale reselling network. Empowering women and youth entrepreneurs nationwide.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Categories</h4>
            <ul className="text-xs text-slate-600 space-y-2">
              <li>Women's Stitched Lawn</li>
              <li>Men's Wallets &amp; Accessories</li>
              <li>Audio &amp; Electronics</li>
              <li>Kitchen Appliances</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Reseller Support</h4>
            <ul className="text-xs text-slate-600 space-y-2">
              <li>WhatsApp: +92 300 1234567</li>
              <li>Email: help@rozgar.pk</li>
              <li>Delivery: Nationwide TCS COD</li>
              <li>Return Window: 7 Days</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Quick Links</h4>
            <div className="space-y-2">
              <button
                onClick={onOpenAuth}
                className="text-xs font-semibold text-emerald-700 hover:underline block"
              >
                Reseller Sign In / Register
              </button>
              <button
                onClick={onExploreCatalog}
                className="text-xs text-slate-600 hover:text-slate-900 block"
              >
                Explore Wholesale Catalog
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© 2026 Rozgar Reseller Marketplace. All rights reserved.</p>
          <p>Financial ledger &amp; ACID transaction security built-in.</p>
        </div>
      </footer>
    </div>
  );
};
