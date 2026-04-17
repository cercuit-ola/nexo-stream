import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { StellarProvider } from "@/contexts/StellarContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Scheduler from "@/pages/Scheduler";
import Vault from "@/pages/Vault";
import GiftCard from "@/pages/GiftCard";
import VirtualCard from "@/pages/VirtualCard";
import Transactions from "@/pages/Transactions";
import SettingsPage from "@/pages/SettingsPage";
import Contracts from "@/pages/Contracts";
import ContractDetail from "@/pages/ContractDetail";
import PublicContractFunding from "@/pages/PublicContractFunding";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StellarProvider>
            <WalletProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/contract/:code" element={<PublicContractFunding />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="scheduler" element={<Scheduler />} />
                  <Route path="vault" element={<Vault />} />
                  <Route path="contracts" element={<Contracts />} />
                  <Route path="contracts/:id" element={<ContractDetail />} />
                  <Route path="giftcard" element={<GiftCard />} />
                  <Route path="virtual-card" element={<VirtualCard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </WalletProvider>
          </StellarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
