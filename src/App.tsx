import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // On successful sign-in after OAuth redirect
      if (event === 'SIGNED_IN' && session?.user) {
        const destination = localStorage.getItem('oauth_destination');
        localStorage.removeItem('oauth_destination'); // Clean up immediately

        // Check for destinations requiring a business lookup
        if (destination === '/check-business-then-redirect' || destination === '/check-business-then-dashboard-or-create') {
          const isBusinessFlowCheck = destination === '/check-business-then-dashboard-or-create';
          console.log(`OAuth destination requires business check (Business Flow: ${isBusinessFlowCheck})...`);
          try {
            const { data: businessData, error: businessError } = await supabase
              .from("businesses")
              .select("id")
              .eq("user_id", session.user.id)
              .limit(1);

            if (businessError) {
              console.error("Error checking for business after OAuth:", businessError);
              // Throw to fall back in catch block
              throw businessError; 
            }
            
            const hasBusiness = businessData && businessData.length > 0;

            if (hasBusiness) {
              console.log('Business found, navigating to /dashboard');
              navigate("/dashboard", { replace: true });
            } else {
              // No business found, redirect depends on the original flow
              if (isBusinessFlowCheck) {
                 console.log('No business found (business flow check), navigating to /create-business');
                 navigate("/create-business", { replace: true });
              } else {
                 console.log('No business found (generic flow check), navigating to /creator');
                 navigate("/creator", { replace: true });
              }
            }
          } catch (error) {
            console.error("Error during post-OAuth business check:", error);
            // Fallback on error - direct to create-business if that was the intent, otherwise creator
            const fallbackPath = isBusinessFlowCheck ? "/create-business" : "/creator";
            console.log(`Falling back to ${fallbackPath}`);
            navigate(fallbackPath, { replace: true }); 
          }
        } 
        // Handle direct destinations (like returnPath)
        else if (destination) {
          console.log('OAuth destination found:', destination, '. Navigating...');
          navigate(destination, { replace: true });
        }
        // If no destination was stored, maybe default to /creator or /dashboard?
        // else { navigate("/creator", { replace: true }); } 
      }
    });

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  return null; // This component renders nothing
};

// Component to handle animated routes
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/*" 
          element={
            <motion.div
              key="page-motion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/creator" element={<CreatorDashboard />} />
                <Route path="/create-business" element={<CreateBusiness />} />
                <Route path="/p/:slug" element={<BusinessPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthRedirectHandler />
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
