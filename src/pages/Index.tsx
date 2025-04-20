
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">
            Turn Your Followers into Product Creators
          </h1>
          <p className="text-xl mb-8 text-gray-600">
            Let your audience suggest and vote on your next products
          </p>
          
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">For Businesses</h3>
              <p className="text-gray-600 mb-6">
                Create your voting page, get product suggestions, and know what your audience wants.
              </p>
              <Button onClick={() => navigate("/auth?type=business")} className="w-full">
                Create Your Page
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">For Creators</h3>
              <p className="text-gray-600 mb-6">
                Submit product ideas and vote on suggestions for your favorite brands.
              </p>
              <Button onClick={() => navigate("/creator")} className="w-full">
                Join as Creator
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}; // Added missing closing semicolon and brace

export default Index;
