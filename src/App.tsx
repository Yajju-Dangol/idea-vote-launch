import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreateBusiness from "./pages/CreateBusiness";
import BusinessPage from "./pages/BusinessPage";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

// Helper component to handle post-OAuth redirect
const AuthRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // On successful sign-in after OAuth redirect
      if (event === 'SIGNED_IN') {
        const destination = localStorage.getItem('oauth_destination');
        if (destination) {
          console.log('OAuth destination found:', destination, '. Navigating...');
          localStorage.removeItem('oauth_destination'); // Clean up immediately
          navigate(destination, { replace: true }); // Use replace to avoid back button issues
        }
      }
    });

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]); // Re-run if navigate changes (shouldn't, but good practice)

  return null; // This component renders nothing
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthRedirectHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route path="/create-business" element={<CreateBusiness />} />
          <Route path="/p/:slug" element={<BusinessPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
