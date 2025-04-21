import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/ui/HeroSection";
import HomePageNavbar from "@/components/layout/HomePageNavbar";

const Index = () => {
  const navigate = useNavigate();

  // Handlers for Navbar actions
  const handleBusinessSignUp = () => {
    navigate("/auth?type=business");
  };

  const handleCreatorSignUp = () => {
    navigate("/creator");
  };

  return (
    <div>
      <HomePageNavbar 
        onBusinessSignUpClick={handleBusinessSignUp}
        onCreatorSignUpClick={handleCreatorSignUp}
      />
      <HeroSection
        className="pt-16"
        subtitle={{
          regular: "Turn Your Followers into ",
          gradient: "Product Creators",
        }}
        description="Let your audience suggest and vote on your next products. Get started by creating your business page or joining as a creator."
        bottomImage={{
          light: "https://placehold.co/1200x600/f0f0f0/png?text=App+Screenshot+Light",
          dark: "https://images2.imgbox.com/76/15/tvHxQqkh_o.png",
        }}
        gridOptions={{
          angle: 75,
          opacity: 0.3,
          cellSize: 50,
        }}
      >
        <Button 
          size="lg"
          onClick={() => navigate("/auth?type=business")} 
        >
          Create Your Page (for Businesses)
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate("/creator")} 
        >
          Join as Creator
        </Button>
      </HeroSection>
    </div>
  );
};

export default Index;
