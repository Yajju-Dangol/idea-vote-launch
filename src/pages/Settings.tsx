
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface ProfileData {
  businessName: string;
  businessTagline: string;
  email: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileData>();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        navigate("/auth");
        return;
      }
      
      setUser(data.session.user);
      fetchBusinessData(data.session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const fetchBusinessData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) {
        if (error.code === "PGRST116") {
          // No business found - redirect to create
          navigate("/create-business");
          return;
        }
        throw error;
      }
      
      setBusiness(data);
      
      // Set form values
      setValue("businessName", data.name);
      setValue("businessTagline", data.tagline);
      setValue("email", user.email);
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileData) => {
    try {
      setUpdating(true);
      
      // Update business info
      const { error: businessError } = await supabase
        .from("businesses")
        .update({
          name: data.businessName,
          tagline: data.businessTagline,
        })
        .eq("id", business.id);
      
      if (businessError) throw businessError;
      
      // Update user email if changed
      if (data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        });
        
        if (emailError) throw emailError;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      
      // Update local state
      setBusiness({
        ...business,
        name: data.businessName,
        tagline: data.businessTagline
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
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
      <DashboardHeader business={business} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your business information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName"
                    {...register("businessName", { required: "Business name is required" })}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-500">{errors.businessName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessTagline">Business Tagline</Label>
                  <Input 
                    id="businessTagline"
                    {...register("businessTagline", { required: "Business tagline is required" })}
                  />
                  {errors.businessTagline && (
                    <p className="text-sm text-red-500">{errors.businessTagline.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <Button type="submit" disabled={updating}>
                    {updating ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Public Page</CardTitle>
                <CardDescription>
                  View or share your public submission page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-grow">
                    <p className="text-sm font-medium">Your public page URL:</p>
                    <p className="text-sm text-gray-500">{window.location.origin}/p/{business.slug}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/p/${business.slug}`)}
                  >
                    View Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
