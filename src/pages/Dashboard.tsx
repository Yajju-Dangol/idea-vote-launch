
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus, Lightbulb, ArrowUpRight } from "lucide-react";
import SubmissionsList from "@/components/dashboard/SubmissionsList";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader business={business} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalVotes}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingReview}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Product Submissions</h2>
          <Button onClick={() => navigate(`/p/${business.slug}`)} className="gap-2">
            <ArrowUpRight size={16} />
            View Public Page
          </Button>
        </div>
        
        <SubmissionsList 
          submissions={submissions} 
          businessId={business.id} 
          onUpdate={(updatedSubmission) => {
            setSubmissions(submissions.map(s => 
              s.id === updatedSubmission.id ? updatedSubmission : s
            ));
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
