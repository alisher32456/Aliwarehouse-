import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CustomerOrderPage } from '../../components/customer/CustomerOrderPage';

export const CustomerStorefrontPage: React.FC = () => {
  const { username, productId } = useParams<{ username: string; productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const priceParam = searchParams.get('price');
  const initialPrice = priceParam ? parseFloat(priceParam) : undefined;

  if (!username || !productId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-xs text-slate-500">
        Invalid product storefront link.
      </div>
    );
  }

  return (
    <CustomerOrderPage
      username={username}
      productId={productId}
      initialPrice={initialPrice}
      onBackToHome={() => navigate('/')}
    />
  );
};
