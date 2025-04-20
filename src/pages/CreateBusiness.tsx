import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface BusinessFormData {
  name: string;
  tagline: string;
  logoUrl?: string;
}

const CreateBusiness = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<BusinessFormData>();

  const onSubmit = async (data: BusinessFormData) => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // Create slug from business name
      const slug = data.name.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-');
      
      // Insert business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert([
          {
            name: data.name,
            tagline: data.tagline,
            logo_url: null, // We'll add logo upload functionality later
            slug,
            user_id: userData.user.id,
          }
        ])
        .select()
        .single();
      
      if (businessError) throw businessError;
      
      toast({
        title: "Business created successfully!",
        description: "You can now start accepting product suggestions.",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error creating business",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Create Your Votely Business Page</CardTitle>
          <CardDescription>
            Set up your page where users can suggest and vote on product ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input 
                id="name"
                placeholder="Your Company or Brand Name"
                {...register("name", { required: "Business name is required" })}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Textarea 
                id="tagline"
                placeholder="Short description of your business"
                {...register("tagline", { required: "Tagline is required" })}
              />
              {errors.tagline && (
                <p className="text-sm text-red-500">{errors.tagline.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Business Page"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateBusiness;
