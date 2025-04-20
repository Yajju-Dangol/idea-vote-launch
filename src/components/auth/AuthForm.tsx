
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface AuthFormProps {
  mode: "login" | "register";
  isBusiness?: boolean;
}

interface FormData {
  email: string;
  password: string;
  businessName?: string;
}

const AuthForm = ({ mode, isBusiness }: AuthFormProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      if (mode === "register") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        
        if (signUpError) throw signUpError;

        if (isBusiness && data.businessName) {
          const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const { error: businessError } = await supabase
            .from("businesses")
            .insert([
              {
                name: data.businessName,
                slug,
                user_id: (await supabase.auth.getUser()).data.user?.id,
              },
            ]);
          
          if (businessError) throw businessError;
        }

        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (signInError) throw signInError;
        
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mode === "register" && isBusiness && (
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
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email", { required: "Email is required" })}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register("password", { required: "Password is required" })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Loading..." : mode === "register" ? "Register" : "Login"}
      </Button>
    </form>
  );
};

export default AuthForm;
