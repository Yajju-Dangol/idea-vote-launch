import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

interface AuthFormProps {
  mode: "login" | "register";
  isBusiness?: boolean;
  returnPath?: string | null;
  onSignupSuccess?: () => void;
}

interface FormData {
  email: string;
  password: string;
}

const AuthForm = ({ mode, isBusiness = false, returnPath = null, onSignupSuccess }: AuthFormProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
        
        if (returnPath) {
          console.log('Signup success, navigating back to returnPath:', returnPath);
          navigate(returnPath); 
        } else if (onSignupSuccess) {
          console.log('Signup success, no returnPath, calling onSignupSuccess (tab switch).');
          onSignupSuccess();
        }
        
      } else {
        // Login (Email/Password)
        const { data: sessionData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        
        if (error) throw error;
        if (!sessionData.user) throw new Error("Login successful but no user data found.");

        toast({ title: "Login successful!", description: "Welcome back!" });
        
        // Priority 1: Return Path
        if (returnPath) {
          navigate(returnPath);
        } 
        // Priority 2: Came from Business flow
        else if (isBusiness) {
          // User explicitly wanted business flow, send to create if needed
          navigate("/create-business"); 
        } 
        // Priority 3: Generic login (e.g., from Navbar) -> Check for existing business
        else {
          const { data: businessData, error: businessError } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", sessionData.user.id) // Check against logged-in user
            .limit(1);

          if (businessError) {
            console.error("Error checking for business:", businessError);
            // Fallback to creator dashboard on error
            navigate("/creator");
          } else if (businessData && businessData.length > 0) {
            // Business exists, go to dashboard
            navigate("/dashboard");
          } else {
            // No business exists, go to creator dashboard
            navigate("/creator");
          }
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Determine OAuth destination
      let destination = returnPath; // Priority 1: Return Path
      if (!destination) {
        destination = isBusiness 
          ? '/create-business' // Priority 2: Business flow
          : '/check-business-then-redirect'; // Priority 3: Generic flow -> requires check after callback
      }
      
      localStorage.setItem('oauth_destination', destination);
      console.log('Storing OAuth destination:', destination);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://xbbjjfjohdgfxzxzqxtt.supabase.co/auth/v1/callback',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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
            disabled={loading || googleLoading}
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
            disabled={loading || googleLoading}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          {loading 
            ? mode === "login" ? "Logging in..." : "Registering..."
            : mode === "login" ? "Sign In" : "Sign Up"
          }
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button 
        variant="outline" 
        className="w-full" 
        onClick={handleGoogleSignIn} 
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
    </div>
  );
};

export default AuthForm;
