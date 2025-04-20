import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react'; // Or choose a different icon

const HomePageNavbar = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    // Navigate to the generic auth page.
    // AuthForm will handle the redirect logic after successful login
    // based on whether the user has a business or not.
    navigate('/auth');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Title */}
        <a href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          {/* <Flame size={24} className="text-primary" /> Optional Icon */}
          wantthis
        </a>

        {/* Login Button */}
        <Button variant="outline" onClick={handleLoginClick}>
          Login
        </Button>
      </nav>
    </header>
  );
};

export default HomePageNavbar; 