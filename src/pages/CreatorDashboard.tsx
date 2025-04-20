
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ArrowUpRight } from "lucide-react";

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }
      fetchBusinesses();
    };

    checkAuth();
  }, [navigate]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("businesses")
        .select("*");

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading businesses",
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
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
          <p className="text-gray-600">Vote and submit ideas for businesses</p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businesses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No businesses available yet</p>
            </div>
          ) : (
            businesses.map((business) => (
              <Card key={business.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{business.name}</CardTitle>
                  {business.tagline && (
                    <p className="text-gray-600 text-sm">{business.tagline}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(`/p/${business.slug}`)} 
                    className="w-full gap-2"
                  >
                    View & Vote
                    <ArrowUpRight size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
