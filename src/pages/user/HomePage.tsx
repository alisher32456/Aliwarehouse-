import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '../../components/landing/LandingPage';
import { Product, Category } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadData() {
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts()
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data.categories);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data.products);
    }
    loadData();
  }, []);

  return (
    <LandingPage
      categories={categories}
      featuredProducts={products}
      onExploreCatalog={() => navigate('/products')}
      onOpenAuth={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
      onSelectProduct={(p) => navigate(`/products/${p.id}`)}
    />
  );
};
