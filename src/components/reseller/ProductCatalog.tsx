import React, { useState } from 'react';
import { Search, SlidersHorizontal, Share2, ShoppingCart, Sparkles, Star } from 'lucide-react';
import { Product, Category } from '../../types';

interface ProductCatalogProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onSelectProduct
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Wholesale Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select any product, add your desired reseller profit, and share your personalized link.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium"
          >
            <option value="newest">Newest First</option>
            <option value="profit_high">Highest Reseller Profit</option>
            <option value="price_low">Base Price: Low to High</option>
            <option value="price_high">Base Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Filter Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          All Categories ({products.length})
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectCategory(c.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              selectedCategory === c.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No products match your filters</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => {
            const maxProfit = p.max_selling_price - p.base_price;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Image & Badges */}
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
                  {p.stock <= 5 && p.stock > 0 && (
                    <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Only {p.stock} left
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{p.category_name || 'Retail'}</span>
                      <div className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                        <span>{p.rating}</span>
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-slate-500">Platform Base:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        Rs. {p.base_price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline text-[11px] text-slate-600">
                      <span>Delivery Fee:</span>
                      <span className="font-mono">Rs. {p.delivery_charge}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(p);
                      }}
                      className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Customize &amp; Share</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
