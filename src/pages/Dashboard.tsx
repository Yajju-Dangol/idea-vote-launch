import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus, Lightbulb, ArrowUpRight, ClipboardCopy } from "lucide-react";
import SubmissionsList from "@/components/dashboard/SubmissionsList";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";

// Define containerVariants outside the component
const containerVariants = {
  hidden: { opacity: 1 }, // Start visible for container
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07 // Adjust stagger if needed
    }
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalVotes: 0,
    pendingReview: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }
      
      fetchBusinessData(data.session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const fetchBusinessData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Get business data
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (businessError) throw businessError;
      if (!businessData) {
        // No business exists for this user, redirect to create
        navigate("/create-business");
        return;
      }
      
      setBusiness(businessData);
      
      // Get submissions for this business
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("*, votes(count)")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });
      
      if (submissionsError) throw submissionsError;
      
      setSubmissions(submissionsData);
      
      // Calculate stats
      const pendingCount = submissionsData.filter(s => s.status === 'pending').length;
      const votesCount = submissionsData.reduce((acc, s) => acc + (s.votes[0]?.count || 0), 0);
      
      setStats({
        totalSubmissions: submissionsData.length,
        totalVotes: votesCount,
        pendingReview: pendingCount
      });
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler function for copying URL
  const handleCopyUrl = async () => {
    if (!business?.slug) return; // Safety check
    
    const url = `${window.location.origin}/p/${business.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL Copied!",
        description: "Public page URL copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy URL: ', err);
      toast({
        title: "Error Copying URL",
        description: "Could not copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Added safety check - only render the dashboard if business data is available
  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>No business data found.</p>
        <Button onClick={() => navigate("/create-business")}>Create Business</Button>
      </div>
    );
  }

  return (
    // Apply dark theme page background and padding
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {/* DashboardHeader will be styled separately */}
      <DashboardHeader business={business} />
      
      {/* Make main content container a responsive grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards placed directly in the parent grid */}
        <Card className="lg:col-span-1"> {/* Span 1 column on large screens */}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.totalSubmissions}</p>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1"> {/* Span 1 column on large screens */}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.totalVotes}</p>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1"> {/* Span 1 column on large screens */}
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-card-foreground">{stats.pendingReview}</p>
          </CardContent>
        </Card>
        
         {/* Submissions Section Card - Spanning all columns below */}
         <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6"> {/* Span 3 columns on large screens */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6"> {/* Added flex-wrap and gap */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Product Submissions</h2>
            {/* Button Group */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" // Changed variant for visual distinction
                onClick={handleCopyUrl} 
                className="gap-2"
              >
                 <ClipboardCopy size={16} />
                 Copy URL
              </Button>
              <Button onClick={() => navigate(`/p/${business.slug}`)} className="gap-2">
                <ArrowUpRight size={16} />
                View Public Page
              </Button>
            </div>
          </div>
          
          {/* Add responsive grid classes and animation variants here */}
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            variants={containerVariants} // Assuming containerVariants is defined or imported
            initial="hidden"
            animate="visible"
          >
            <SubmissionsList 
              submissions={submissions} 
              businessId={business.id} 
              onUpdate={(updatedSubmission) => {
                setSubmissions(submissions.map(s => 
                  s.id === updatedSubmission.id ? updatedSubmission : s
                ));
              }}
            />
          </motion.div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
