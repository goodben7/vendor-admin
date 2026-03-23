import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/dashboard/Dashboard';
import OrdersList from './pages/orders/OrdersList';
import OrderDetail from './pages/orders/OrderDetail';
import OrderCreate from './pages/orders/OrderCreate';
import PaymentsList from './pages/payments/PaymentsList';
import PaymentCreate from './pages/payments/PaymentCreate';
import PaymentDetail from './pages/payments/PaymentDetail';
import ProductsList from './pages/products/ProductsList';
import ProductForm from './pages/products/ProductForm';
import CategoriesList from './pages/categories/CategoriesList';
import CategoryForm from './pages/categories/CategoryForm';
import OptionGroupsList from './pages/option-groups/OptionGroupsList';
import OptionItemsList from './pages/option-items/OptionItemsList';
import OptionItemForm from './pages/option-items/OptionItemForm';
import PlatformsList from './pages/platforms/PlatformsList';
import PlatformDetail from './pages/platforms/PlatformDetail';
import PlatformForm from './pages/platforms/PlatformForm';
import PlatformTablesList from './pages/platform-tables/PlatformTablesList';
import PlatformTableForm from './pages/platform-tables/PlatformTableForm';
import TabletsList from './pages/tablets/TabletsList';
import UsersList from './pages/users/UsersList';
import UserForm from './pages/users/UserForm';
import UserDetailLayout from './pages/users/userDetail/UserDetailLayout';
import UserDetailOverview from './pages/users/userDetail/UserDetailOverview';
import UserDetailProfile from './pages/users/userDetail/UserDetailProfile';
import UserDetailPermissions from './pages/users/userDetail/UserDetailPermissions';
import UserDetailSecurity from './pages/users/userDetail/UserDetailSecurity';
import ProfilesList from './pages/profiles/ProfilesList';
import CurrenciesList from './pages/currencies/CurrenciesList';
import ExchangeRatesList from './pages/exchange-rates/ExchangeRatesList';
import KitchenDisplay from './pages/kitchen/KitchenDisplay';
import Settings from './pages/settings/Settings';
import MenusList from './pages/menus/MenusList';
import MenuForm from './pages/menus/MenuForm';
import AccountLayout from './pages/account/AccountLayout';
import AccountOverview from './pages/account/AccountOverview';
import AccountProfile from './pages/account/AccountProfile';
import AccountSecurity from './pages/account/AccountSecurity';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import './styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Users */}
              <Route path="users" element={<UsersList />} />
              <Route path="users/create" element={<UserForm />} />
              <Route path="users/:id" element={<UserDetailLayout />}>
                <Route index element={<UserDetailOverview />} />
                <Route path="profile" element={<UserDetailProfile />} />
                <Route path="permissions" element={<UserDetailPermissions />} />
                <Route path="security" element={<UserDetailSecurity />} />
              </Route>
              <Route path="users/:id/edit" element={<UserForm />} />

              {/* Profiles */}
              <Route path="profiles" element={<ProfilesList />} />

              {/* Currencies */}
              <Route path="currencies" element={<CurrenciesList />} />

              {/* Exchange Rates */}
              <Route path="exchange-rates" element={<ExchangeRatesList />} />

              {/* Orders */}
              <Route path="orders" element={<OrdersList />} />
              <Route path="orders/create" element={<OrderCreate />} />
              <Route path="orders/:id" element={<OrderDetail />} />

              {/* Payments */}
              <Route path="payments" element={<PaymentsList />} />
              <Route path="payments/create" element={<PaymentCreate />} />
              <Route path="payments/:id" element={<PaymentDetail />} />

              {/* Products & Categories */}
              <Route path="products" element={<ProductsList />} />
              <Route path="products/create" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="categories" element={<CategoriesList />} />
              <Route path="categories/create" element={<CategoryForm />} />
              <Route path="categories/:id/edit" element={<CategoryForm />} />

              {/* Option Groups & Items */}
              <Route path="option-groups" element={<OptionGroupsList />} />
              <Route path="option-items" element={<OptionItemsList />} />
              <Route path="option-items/create" element={<OptionItemForm />} />
              <Route path="option-items/:id/edit" element={<OptionItemForm />} />

              {/* Platforms & Tables */}
              <Route path="platforms" element={<PlatformsList />} />
              <Route path="platforms/create" element={<PlatformForm />} />
              <Route path="platforms/:id" element={<PlatformDetail />} />
              <Route path="platforms/:id/edit" element={<PlatformForm />} />
              <Route path="platform-tables" element={<PlatformTablesList />} />
              <Route path="platform-tables/create" element={<PlatformTableForm />} />
              <Route path="platform-tables/:id/edit" element={<PlatformTableForm />} />

              {/* Tablets */}
              <Route path="tablets" element={<TabletsList />} />


              {/* Menus */}
              <Route path="menus" element={<MenusList />} />
              <Route path="menus/create" element={<MenuForm />} />
              <Route path="menus/:id/edit" element={<MenuForm />} />
              {/* Kitchen */}
              <Route path="kitchen" element={<KitchenDisplay />} />

              {/* Settings */}
              <Route path="settings" element={<Settings />} />

              {/* My Account */}
              <Route path="account" element={<AccountLayout />}>
                <Route index element={<AccountOverview />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="security" element={<AccountSecurity />} />
              </Route>
            </Route>



            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast notifications */}
        <Toaster position="top-right" richColors />

        {/* React Query DevTools (Development Only) */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
