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
        // --- Try to log in first --- //
        let loginError: any = null;
        let loggedInSession: any = null;
        try {
          console.log("Register mode: Attempting sign-in first for email:", data.email);
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
          if (signInError) {
            // Throw error to be caught below
            throw signInError;
          } else {
            // Login successful!
            loggedInSession = signInData.session;
          }
        } catch (error: any) {
          // Store login error to check if we should proceed to signup
          loginError = error;
          console.log("Initial sign-in attempt failed:", loginError.message);
        }

        // --- Handle Successful Login (if loggedInSession is set) --- //
        if (loggedInSession?.user) {
          toast({ title: "Login successful!", description: "Welcome back!" });
          // Check for business and redirect
           const { data: businessData, error: businessError } = await supabase
             .from("businesses")
             .select("id")
             .eq("user_id", loggedInSession.user.id)
             .limit(1);

           if (businessError) {
             console.error("Error checking for business during register->login:", businessError);
             navigate("/creator"); // Fallback to creator on error
           } else if (businessData && businessData.length > 0) {
             navigate("/dashboard"); // Has business -> dashboard
           } else {
             navigate("/creator"); // No business -> creator
           }
           setLoading(false);
           return; // Exit early, login was successful
        }

        // --- Proceed to Sign Up only if initial login failed with invalid credentials --- //
        // Check for specific Supabase error messages or codes if available
        const proceedToSignup = loginError && 
          (loginError.message.includes("Invalid login credentials") || 
           loginError.message.includes("Email not confirmed")); // Or other relevant errors indicating user might exist but couldn't log in simply
        
        if (!proceedToSignup && loginError) {
           // Some other login error occurred (network, etc.), don't try signup
           throw loginError; // Rethrow the original login error
        }

        // --- Actual Sign Up Logic --- //
        console.log("Proceeding with actual signup for email:", data.email);
        const { error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });

        if (signUpError) {
          // Handle specific signup errors if needed (e.g., password too short)
          throw signUpError;
        }

        toast({ title: "Registration successful!", description: "Please check your email to confirm your account." });

        // PRIORITIZE returnPath after successful signup
        if (returnPath) {
          navigate(returnPath);
        } else if (onSignupSuccess) {
          onSignupSuccess(); // Fallback to switching tabs if no returnPath
        }

      } else {
        // Login Mode (existing logic)
        // ... (login logic remains largely the same, checking returnPath, isBusiness, then business presence) ...
         const { data: sessionData, error } = await supabase.auth.signInWithPassword({
           email: data.email,
           password: data.password,
         });
         if (error) throw error;
         if (!sessionData.user) throw new Error("Login successful but no user data found.");
         toast({ title: "Login successful!", description: "Welcome back!" });
         if (returnPath) {
           navigate(returnPath);
         } 
         // Priority 2: Came from Business flow -> CHECK if business exists first
         else if (isBusiness) {
           console.log("Login via business flow, checking existing business...");
           const { data: businessData, error: businessError } = await supabase
             .from("businesses")
             .select("id")
             .eq("user_id", sessionData.user.id)
             .limit(1);
           
           if (businessError) {
             console.error("Error checking for business (business flow):", businessError);
             navigate("/create-business"); // Fallback to create on error
           } else if (businessData && businessData.length > 0) {
             console.log("Business found, navigating to /dashboard");
             navigate("/dashboard"); // Has business -> dashboard
           } else {
             console.log("No business found, navigating to /create-business");
             navigate("/create-business"); // No business -> create page
           }
         } 
         // Priority 3: Generic login (already correct)
         else {
           const { data: businessData, error: businessError } = await supabase
             .from("businesses")
             .select("id")
             .eq("user_id", sessionData.user.id)
             .limit(1);
           if (businessError) {
             console.error("Error checking for business:", businessError);
             navigate("/creator");
           } else if (businessData && businessData.length > 0) {
             navigate("/dashboard");
           } else {
             navigate("/creator");
           }
         }
      }
    } catch (error: any) {
      console.error("AuthForm Error:", error);
      toast({
        title: mode === 'login' ? "Login Failed" : "Operation Failed", // More generic title for register mode now
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
          ? '/check-business-then-dashboard-or-create' // Priority 2: Business flow -> requires check
          : '/check-business-then-redirect'; // Priority 3: Generic flow -> requires check
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
