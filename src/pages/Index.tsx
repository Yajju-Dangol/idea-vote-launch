import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/ui/HeroSection";

const Index = () => {
  const navigate = useNavigate();

  return (
    <HeroSection
      subtitle={{
        regular: "Turn Your Followers into ",
        gradient: "Product Creators",
      }}
      description="Let your audience suggest and vote on your next products. Get started by creating your business page or joining as a creator."
      bottomImage={{
        light: "https://placehold.co/1200x600/f0f0f0/png?text=App+Screenshot+Light",
        dark: "https://placehold.co/1200x600/1a1a1a/png?text=App+Screenshot+Dark",
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
  );
};

export default Index;
