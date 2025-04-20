
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface AuthFormProps {
  mode: "login" | "register";
  isBusiness?: boolean;
}

interface FormData {
  email: string;
  password: string;
}

const AuthForm = ({ mode, isBusiness = false }: AuthFormProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Registration successful!",
          description: "Please check your email to confirm your account."
        });
        
        // For development, we might skip email verification
        // So we'll redirect to the appropriate page
        if (isBusiness) {
          navigate("/create-business");
        } else {
          navigate("/dashboard");
        }
        
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Login successful!",
          description: "Welcome back!"
        });
        
        // Redirect based on whether they have a business or not
        const { data: businessData } = await supabase
          .from("businesses")
          .select("id")
          .limit(1);
        
        if (businessData && businessData.length > 0) {
          navigate("/dashboard");
        } else {
          navigate("/create-business");
        }
      }
    } catch (error: any) {
      toast({
        title: mode === "login" ? "Login failed" : "Registration failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register("email", { 
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })}
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
          placeholder="••••••••"
          {...register("password", { 
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters"
            }
          })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading 
          ? mode === "login" ? "Logging in..." : "Registering..."
          : mode === "login" ? "Sign In" : "Sign Up"
        }
      </Button>
    </form>
  );
};

export default AuthForm;
