import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ArrowUpRight } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { motion } from "framer-motion";

// Reuse animation variants from BusinessPage or define here
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4 }
  }
};

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
    <div className="min-h-screen">
      <DashboardHeader title="Creator Dashboard" />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {businesses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No businesses available yet</p>
            </div>
          ) : (
            businesses.map((business) => (
              <motion.div key={business.id} variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">{business.name}</CardTitle>
                    {business.tagline && (
                      <p className="text-muted-foreground text-sm">{business.tagline}</p>
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
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
