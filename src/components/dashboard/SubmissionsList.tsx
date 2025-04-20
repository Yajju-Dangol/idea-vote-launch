
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ChevronUp, Calendar } from "lucide-react";

interface Submission {
  id: string;
  title: string;
  description: string;
  image_url: string;
  status: "pending" | "trending" | "under_review" | "selected" | "rejected";
  created_at: string;
  votes: { count: number }[];
}

interface SubmissionsListProps {
  submissions: Submission[];
  businessId: string;
  onUpdate: (updatedSubmission: Submission) => void;
}

const SubmissionsList = ({ submissions, businessId, onUpdate }: SubmissionsListProps) => {
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const updateStatus = async (submissionId: string, newStatus: "pending" | "trending" | "under_review" | "selected" | "rejected") => {
    try {
      setUpdating(prev => ({ ...prev, [submissionId]: true }));
      
      const { data, error } = await supabase
        .from("submissions")
        .update({ status: newStatus })
        .eq("id", submissionId)
        .eq("business_id", businessId)
        .select("*, votes(count)")
        .single();
      
      if (error) throw error;
      
      onUpdate(data);
      
      toast({
        title: "Status updated",
        description: `The submission has been marked as ${newStatus.replace("_", " ")}.`
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500">No product suggestions yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Share your page with customers to get suggestions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map(submission => (
        <Card key={submission.id} className="overflow-hidden">
          <div className="flex border-0">
            <div className="p-4 flex flex-col items-center justify-center bg-gray-50 border-r min-w-[80px]">
              <div className="flex flex-col items-center">
                <ChevronUp size={16} />
                <span className="font-semibold">{submission.votes[0]?.count || 0}</span>
                <span className="text-xs text-gray-500">votes</span>
              </div>
            </div>
            
            <div className="p-4 flex-grow">
              <h3 className="font-semibold text-lg mb-1">{submission.title}</h3>
              <p className="text-gray-600">{submission.description}</p>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center text-xs text-gray-500 gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(submission.created_at)}</span>
                </div>
                
                <div>
                  <Select
                    value={submission.status}
                    onValueChange={(value) => updateStatus(submission.id, value as "pending" | "trending" | "under_review" | "selected" | "rejected")}
                    disabled={updating[submission.id]}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="trending">Trending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {submission.image_url && (
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-200">
                <img 
                  src={submission.image_url} 
                  alt={submission.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SubmissionsList;
