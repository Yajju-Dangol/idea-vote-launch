import { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthForm from "@/components/auth/AuthForm";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const returnPath = location.state?.returnPath || null;
  const isBusiness = searchParams.get("type") === "business";
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {isBusiness ? "Create Your Business Page" : "Join Votely"}
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
