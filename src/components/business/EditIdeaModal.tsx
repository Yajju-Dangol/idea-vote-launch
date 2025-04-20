'use client';

import React, { useState, useEffect } from 'react';
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
import { Upload, X } from 'lucide-react';

// Assuming ProcessedSubmission type is defined elsewhere or we define a similar one here
interface ProcessedSubmission {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  // Add other fields if needed by the component
}

interface EditIdeaModalProps {
  open: boolean;
  onClose: () => void;
  submission: ProcessedSubmission | null; // Submission to edit
  onUpdateComplete: () => void;
}

const EditIdeaModal: React.FC<EditIdeaModalProps> = ({ open, onClose, submission, onUpdateComplete }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  // Pre-fill form when submission prop changes
  useEffect(() => {
    if (submission) {
      setTitle(submission.title || "");
      setDescription(submission.description || "");
      setImagePreview(submission.image_url || null);
      setNewImage(null); // Reset any new image selection
      setIsRemovingImage(false);
    }
  }, [submission]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsRemovingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setNewImage(null);
    setImagePreview(null);
    setIsRemovingImage(true); // Mark image for removal
  };

  // Helper to delete image from storage
  const deleteStorageImage = async (imageUrlToDelete: string | null) => {
    if (!imageUrlToDelete || imageUrlToDelete.includes('placehold.co')) return; // Don't delete placeholders
    
    try {
      const imagePath = imageUrlToDelete.split('/product-images/').pop(); // Extract path/filename
      if (!imagePath) throw new Error("Could not extract image path from URL");
      
      console.log("Attempting to delete from storage:", imagePath);
      const { error: storageError } = await supabase.storage
        .from('product-images') // Use your bucket name
        .remove([imagePath]);
      
      if (storageError) {
        console.error("Error deleting image from storage (non-fatal):", storageError);
      } else {
        console.log("Successfully deleted image from storage:", imagePath);
      }
    } catch (error: any) {
      console.error("Exception deleting image from storage (non-fatal):", error.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;

    setLoading(true);
    let updatedImageUrl = submission.image_url; // Start with current URL
    const oldImageUrl = submission.image_url; // Keep track of the old one
    let imageToDelete = false;

    try {
      // 1. Handle new image upload
      if (newImage) {
        console.log("Uploading new image...");
        const fileExt = newImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images") // Use your bucket name
          .upload(filePath, newImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-images") // Use your bucket name
          .getPublicUrl(filePath);
          
        updatedImageUrl = urlData.publicUrl;
        console.log("New image uploaded, URL:", updatedImageUrl);
        imageToDelete = true; // Mark old image for deletion if new one is uploaded
      }
      // 2. Handle image removal
      else if (isRemovingImage) {
         console.log("Removing existing image link.");
         updatedImageUrl = null;
         imageToDelete = true; // Mark old image for deletion if explicitly removed
      }

      // 3. Update submission record in DB
      console.log("Updating submission record...");
      const { data: updatedData, error: updateError } = await supabase
        .from("submissions")
        .update({
          title: title,
          description: description,
          image_url: updatedImageUrl
        })
        .eq("id", submission.id)
        .select()
        .single();

      if (updateError) throw updateError;
      console.log("Submission record updated.");

      // 4. Delete old image from storage if needed (AFTER successful DB update)
      if (imageToDelete) {
        await deleteStorageImage(oldImageUrl);
      }

      toast({
        title: "Submission updated successfully!",
      });

      onClose(); // Close modal
      onUpdateComplete(); // Trigger data refresh

    } catch (error: any) {
      console.error("Error updating submission:", error);
      toast({
        title: "Error updating submission",
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
          <DialogTitle>Edit Product Idea</DialogTitle>
          <DialogDescription>
            Update the details for this product idea.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input 
              id="edit-title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name of your product idea"
              required
              disabled={loading}
            />
          </div>
          
          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea 
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product idea in detail"
              required
              disabled={loading}
            />
          </div>
          
          {/* Image Input/Preview */}
          <div className="space-y-2">
            <Label htmlFor="edit-image">Image (optional)</Label>
            <div className="border rounded-md p-2">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded" 
                  />
                  {/* More prominent remove button */}
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 h-7 w-7 rounded-full"
                    onClick={handleRemoveImage}
                    disabled={loading}
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 cursor-pointer rounded border border-dashed border-border bg-muted/50 hover:bg-muted/80">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click to upload a new image
                    </p>
                  </div>
                  <input 
                    id="edit-image" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageChange} 
                    disabled={loading}
                  />
                </label>
              )}
            </div>
          </div>
          
          {/* Footer Buttons */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title || !description}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditIdeaModal; 