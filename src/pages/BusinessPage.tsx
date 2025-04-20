
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ChevronUp, Plus } from "lucide-react";
import SubmitIdeaModal from "@/components/business/SubmitIdeaModal";

const BusinessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user (if logged in)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
        
        // Get business data
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*")
          .eq("slug", slug)
          .single();
        
        if (businessError) throw businessError;
        setBusiness(businessData);
        
        // Get submissions for this business
        await fetchSubmissions(businessData.id);
      } catch (error: any) {
        toast({
          title: "Error loading page",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchSubmissions = async (businessId: string) => {
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        votes(count)
      `)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    // Check if user has voted on each submission
    if (user) {
      const submissionsWithVoteStatus = await Promise.all(
        data.map(async (submission) => {
          const { data: userVotes } = await supabase
            .from("votes")
            .select("id")
            .eq("submission_id", submission.id)
            .eq("user_id", user.id);
          
          return {
            ...submission,
            hasVoted: userVotes && userVotes.length > 0,
            voteCount: submission.votes[0]?.count || 0
          };
        })
      );
      setSubmissions(submissionsWithVoteStatus);
    } else {
      // If no user is logged in, just set vote counts
      setSubmissions(
        data.map(submission => ({
          ...submission,
          hasVoted: false,
          voteCount: submission.votes[0]?.count || 0
        }))
      );
    }
  };

  const handleVote = async (submissionId: string) => {
    try {
      if (!user) {
        // Redirect to login if not logged in
        navigate("/auth");
        return;
      }
      
      // Check if already voted
      const submission = submissions.find(s => s.id === submissionId);
      if (submission.hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        // Update local state
        setSubmissions(submissions.map(s => 
          s.id === submissionId ? 
          { ...s, hasVoted: false, voteCount: s.voteCount - 1 } : s
        ));
      } else {
        // Add vote
        const { error } = await supabase
          .from("votes")
          .insert([{ submission_id: submissionId, user_id: user.id }]);
        
        if (error) throw error;
        
        // Update local state
        setSubmissions(submissions.map(s => 
          s.id === submissionId ? 
          { ...s, hasVoted: true, voteCount: s.voteCount + 1 } : s
        ));
      }
    } catch (error: any) {
      toast({
        title: "Error voting",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Business not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{business.name}</h1>
              <p className="text-gray-600">{business.tagline}</p>
            </div>
            
            <Button 
              onClick={() => setSubmitModalOpen(true)} 
              className="gap-2"
            >
              <Plus size={16} />
              Submit Idea
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Product Ideas</h2>
        
        <div className="grid gap-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No product ideas submitted yet. Be the first!</p>
              <Button 
                onClick={() => setSubmitModalOpen(true)} 
                className="mt-4"
              >
                Submit an Idea
              </Button>
            </div>
          ) : (
            submissions.map(submission => (
              <Card key={submission.id} className="overflow-hidden">
                <div className="flex border-0">
                  <div className="p-4 flex flex-col items-center justify-center bg-gray-50 border-r">
                    <Button 
                      variant={submission.hasVoted ? "default" : "outline"} 
                      size="sm"
                      className="gap-1 h-auto py-1 px-2"
                      onClick={() => handleVote(submission.id)}
                    >
                      <ChevronUp size={16} />
                      <span>{submission.voteCount}</span>
                    </Button>
                  </div>
                  
                  <div className="p-4 flex-grow">
                    <h3 className="font-semibold text-lg mb-1">{submission.title}</h3>
                    <p className="text-gray-600">{submission.description}</p>
                    
                    {submission.status !== 'pending' && (
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          submission.status === 'trending' ? 'bg-blue-100 text-blue-700' :
                          submission.status === 'under_review' ? 'bg-yellow-100 text-yellow-700' :
                          submission.status === 'selected' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {submission.status === 'trending' ? 'Trending' :
                           submission.status === 'under_review' ? 'Under Review' :
                           submission.status === 'selected' ? 'Selected' :
                           'Rejected'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {submission.image_url && (
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200">
                      <img 
                        src={submission.image_url} 
                        alt={submission.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <SubmitIdeaModal 
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        businessId={business.id}
        onSubmissionComplete={() => {
          fetchSubmissions(business.id);
        }}
      />
    </div>
  );
};

export default BusinessPage;
