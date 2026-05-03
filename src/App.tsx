import '@/i18n';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Share from "./pages/Share";
import ShareSingle from "./pages/ShareSingle";
import Features from "./pages/Features";
import About from "./pages/About";
import Scan from "./pages/Scan";
import Help from "./pages/Help";
import GovSchemes from "./pages/GovSchemes";
import DigitalIDCard from "./components/DigitalIDCard";
function CardPreview() {
  return (
    <div style={{ padding: 40, background: '#e2e8f0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <DigitalIDCard name="Pranav Amit Borse" phone="+91 77580 40552" userId="abcd1234efgh5678"
        memberSince="May 2026" aadhaarMasked="XXXX XXXX 1234" dob="15/08/1998" aadhaarVerified={true}
        photoUrl="https://i.pravatar.cc/240?img=3" bloodGroup="B+"
        aadhaarAddress="42, Shivaji Nagar, Near State Bank, Pune, Maharashtra - 411005" />
    </div>
  );
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/about" element={<About />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/help" element={<Help />} />
              <Route path="/schemes" element={<GovSchemes />} />
              <Route path="/card-preview" element={<CardPreview />} />
              <Route path="/i/:uid" element={<Share />} />
              <Route path="/s/:token" element={<ShareSingle />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
