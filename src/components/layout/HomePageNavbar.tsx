import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react'; // Or choose a different icon
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Import Popover components

interface HomePageNavbarProps {
  onBusinessSignUpClick: () => void;
  onCreatorSignUpClick: () => void;
}

const HomePageNavbar: React.FC<HomePageNavbarProps> = ({ onBusinessSignUpClick, onCreatorSignUpClick }) => {
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Login Button */}
          <Button variant="outline" onClick={handleLoginClick}>
            Login
          </Button>

          {/* Sign Up Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button>Sign Up</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex flex-col gap-2">
                 <Button
                   variant="ghost"
                   className="justify-start px-2"
                   onClick={() => {
                      onBusinessSignUpClick();
                      // Optionally close popover here if needed, though clicking usually does
                   }}
                 >
                   Create Your Page (for Businesses)
                 </Button>
                 <Button
                   variant="ghost"
                   className="justify-start px-2"
                   onClick={() => {
                      onCreatorSignUpClick();
                      // Optionally close popover here
                   }}
                 >
                   Join as Creator
                 </Button>
               </div>
            </PopoverContent>
          </Popover>
        </div>
      </nav>
    </header>
  );
};

export default HomePageNavbar; 