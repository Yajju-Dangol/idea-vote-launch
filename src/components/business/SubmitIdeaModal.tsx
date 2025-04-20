
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Upload } from "lucide-react";

interface SubmitIdeaModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  onSubmissionComplete: () => void;
}

const SubmitIdeaModal = ({ open, onClose, businessId, onSubmissionComplete }: SubmitIdeaModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      // Upload image if provided
      let imageUrl = "https://placehold.co/600x400?text=No+Image";
      
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, image);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }
      
      // Submit the idea
      const { data, error } = await supabase
        .from("submissions")
        .insert([
          {
            business_id: businessId,
            title,
            description,
            image_url: imageUrl,
            submitted_by: session.user.id
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Idea submitted successfully!",
        description: "Thank you for your suggestion."
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setImage(null);
      setImagePreview(null);
      
      // Close modal and refresh submissions
      onClose();
      onSubmissionComplete();
    } catch (error: any) {
      toast({
        title: "Error submitting idea",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit a Product Idea</DialogTitle>
          <DialogDescription>
            Share your product suggestion or feature request
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name of your product idea"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product idea in detail"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Image (optional)</Label>
            <div className="border rounded-md p-2">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 cursor-pointer rounded border border-dashed border-gray-300 bg-gray-50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-6 w-6 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Click to upload an image
                    </p>
                  </div>
                  <input 
                    id="image" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange} 
                  />
                </label>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title || !description}>
              {loading ? "Submitting..." : "Submit Idea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitIdeaModal;
