import { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthForm from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = location.state?.returnPath || null;
  const isBusiness = searchParams.get("type") === "business";
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  
  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6 relative">
        <Button 
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={handleClose}
          aria-label="Close authentication"
        >
          <X size={18} />
        </Button>

        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
          {isBusiness ? "Create Your Business Page" : "Join Ideya"}
        </h1>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="login">Login</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register">
            <AuthForm 
              mode="register" 
              isBusiness={isBusiness} 
              returnPath={returnPath} 
              onSignupSuccess={() => setActiveTab("login")}
            />
          </TabsContent>
          
          <TabsContent value="login">
            <AuthForm mode="login" isBusiness={isBusiness} returnPath={returnPath} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
