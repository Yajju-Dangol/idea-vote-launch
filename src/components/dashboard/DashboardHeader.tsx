import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User } from "lucide-react";

interface DashboardHeaderProps {
  business?: {
    name: string;
    slug: string;
  };
  title?: string;
}

const DashboardHeader = ({ business, title }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{business?.name || title || "Dashboard"}</h1>
        </div>
        <div className="flex items-center gap-4">
          {userEmail && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User size={16} />
              <span className="hidden sm:inline">{userEmail}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loading}
            className="gap-1"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
