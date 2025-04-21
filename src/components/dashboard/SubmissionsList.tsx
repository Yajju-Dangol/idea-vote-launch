import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { ChevronUp, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  status: "pending" | "trending" | "under_review" | "selected" | "rejected";
  created_at: string;
  votes: { count: number }[];
}

interface SubmissionsListProps {
  submissions: Submission[];
  businessId: string;
  onUpdate: (updatedSubmission: Submission) => void;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07
    }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4 }
  }
};

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

  return (
    <>
      {submissions.length === 0 ? (
         <div className="text-center py-12 rounded-lg border dark:border-gray-700">
           <p className="text-muted-foreground">No product suggestions yet</p>
           <p className="text-sm text-muted-foreground/80 mt-2">
             Share your page with customers to get suggestions
           </p>
         </div>
       ) : (
        submissions.map(submission => (
          <motion.div key={submission.id} variants={itemVariants}>
            <Card className="flex flex-col overflow-hidden h-full">
              {submission.image_url ? (
                <img
                  src={submission.image_url}
                  alt={submission.title}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="h-48 w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No Image</span>
                </div>
              )}
              <CardContent className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold tracking-tight text-lg mb-1 text-card-foreground">{submission.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{submission.description}</p>
              </CardContent>
              <CardFooter className="p-4 border-t dark:border-gray-700 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                   <ChevronUp size={16} />
                   <span className="font-semibold text-card-foreground">{submission.votes[0]?.count || 0}</span>
                   <span>votes</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                   <Calendar size={14} />
                   <span>{formatDate(submission.created_at)}</span>
                </div>
                <div className="w-full sm:w-auto">
                  <Select
                    value={submission.status}
                    onValueChange={(value) => updateStatus(submission.id, value as any)}
                    disabled={updating[submission.id]}
                  >
                    <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
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
              </CardFooter>
            </Card>
          </motion.div>
        ))
      )}
    </>
  );
};

export default SubmissionsList;
