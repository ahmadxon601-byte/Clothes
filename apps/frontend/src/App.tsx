import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './context/AuthContext';

import { Home } from './ui/pages/shop/Home';
import { Cart } from './ui/pages/shop/Cart';
import { Favorites } from './ui/pages/shop/Favorites';
import { OrdersList } from './ui/pages/shop/OrdersList';
import { Profile } from './ui/pages/shop/Profile';
import { ProductDetails } from './ui/pages/shop/ProductDetails';
import { Categories } from './ui/pages/shop/Categories';
import { SearchResults } from './ui/pages/shop/SearchResults';
import { Checkout } from './ui/pages/shop/Checkout';
import { OrderSuccess } from './ui/pages/shop/OrderSuccess';

import { SignIn } from './ui/pages/auth/SignIn';
import { SignUp } from './ui/pages/auth/SignUp';
import { Splash } from './ui/pages/auth/Splash';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F5F5]">
        <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"           element={<Home />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/search"     element={<SearchResults />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/signin"     element={<SignIn />} />
      <Route path="/signup"     element={<SignUp />} />
      <Route path="/splash"     element={<Splash />} />

      {/* Protected */}
      <Route path="/cart"     element={<PrivateRoute><Cart /></PrivateRoute>} />
      <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
      <Route path="/orders"   element={<PrivateRoute><OrdersList /></PrivateRoute>} />
      <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
      <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
