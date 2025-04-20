
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Upload } from "lucide-react";

interface SubmitIdeaModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  onSubmissionComplete: () => void;
}

interface IdeaFormData {
  title: string;
  description: string;
  image?: FileList;
}

const SubmitIdeaModal = ({ 
  open, 
  onClose, 
  businessId, 
  onSubmissionComplete 
}: SubmitIdeaModalProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<IdeaFormData>();

  // Watch for file changes to show preview
  const watchImage = watch("image");
  
  const onSubmit = async (data: IdeaFormData) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Please login first",
          description: "You need to be logged in to submit an idea."
        });
        navigate("/auth");
        return;
      }
      
      setLoading(true);
      let imageUrl = null;
      
      // Upload image if provided
      if (data.image && data.image[0]) {
        const file = data.image[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }
      
      // Insert submission
      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .insert([
          {
            title: data.title,
            description: data.description,
            image_url: imageUrl || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image",
            business_id: businessId,
            submitted_by: session.user.id,
            status: "pending"
          }
        ]);
      
      if (submissionError) throw submissionError;
      
      toast({
        title: "Idea submitted successfully!",
        description: "Thank you for your suggestion."
      });
      
      reset();
      setImagePreview(null);
      onSubmissionComplete();
      onClose();
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

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit a Product Idea</DialogTitle>
          <DialogDescription>
            Share your idea for a new product or feature
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              placeholder="Name of your product idea"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              placeholder="Describe your idea in detail"
              rows={4}
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Image (optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById("image")?.click()}
              >
                <Upload size={16} />
                Choose Image
              </Button>
              <Input
                id="image"
                type="file"
                accept="image/*"
                className="hidden"
                {...register("image")}
                onChange={handleImageChange}
              />
              <span className="text-sm text-gray-500">
                {watchImage?.[0]?.name || "No file chosen"}
              </span>
            </div>
            
            {imagePreview && (
              <div className="mt-4 relative w-full max-w-[200px]">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-auto rounded border"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Idea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitIdeaModal;
