import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Heart, Plus, LogOut, User, ArrowLeft, Pencil, Trash2, Users } from "lucide-react";
import SubmitIdeaModal from "@/components/business/SubmitIdeaModal";
import { Tilt } from "@/components/ui/tilt";
import { cn } from "@/lib/utils";
import Lightbox from "@/components/ui/Lightbox";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import EditIdeaModal from "@/components/business/EditIdeaModal";

// Define a more specific type for submissions after processing
type ProcessedSubmission = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  image_url: string | null;
  status: string; // Keep status if needed, adjust type as necessary
  submitted_by: string;
  business_id: string;
  hasVoted: boolean;
  voteCount: number;
};

// Animation variants for list container and items
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // Stagger children appearance
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

const BusinessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [submissions, setSubmissions] = useState<ProcessedSubmission[]>([]); // Use specific type
  const [user, setUser] = useState<any>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null); // State for lightbox
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Add state for logout button
  // Add state for delete confirmation
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [submissionToDeleteId, setSubmissionToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // For delete loading state
  // Add state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submissionToEdit, setSubmissionToEdit] = useState<ProcessedSubmission | null>(null);
  
  useEffect(() => {
    const fetchUserAndBusiness = async () => {
      setLoading(true);
      try {
        // Get current user (if logged in)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (!slug) {
           setLoading(false);
           return; // Exit if no slug
        }

        // Get business data
        const { data: businessData, error: businessError } = await supabase
          .from("businesses")
          .select("*" )
          .eq("slug", slug)
          .single();

        if (businessError) {
           if (businessError.code === 'PGRST116') { // Not found code
             toast({ title: "Business not found", variant: "destructive" });
             setBusiness(null); // Ensure business is null if not found
           } else {
             throw businessError;
           }
        } else {
            setBusiness(businessData);
            // Fetch submissions only if business exists, pass current user
            await fetchSubmissions(businessData.id, currentUser);
        }

      } catch (error: any) {
        console.error("Error fetching page data:", error);
        toast({
          title: "Error loading page",
          description: error.message,
          variant: "destructive"
        });
        setBusiness(null);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBusiness();
    // Re-run when slug changes (user is handled implicitly by re-running this whole effect)
  }, [slug]);

  const fetchSubmissions = async (businessId: string, currentUser: any) => {
    console.log("Fetching submissions for business:", businessId, "User:", currentUser?.id);
    try {
      // 1. Fetch all submissions for the business with total vote counts
      // Use type assertion for Supabase data
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select(`
          *,
          votes (count)
        `)
        .eq("business_id", businessId)
        // Order by vote count first (desc), then creation date (desc) for tie-breaking
        // Adjust 'votes(count)' based on how Supabase returns aggregate
        // This ordering might require specific DB indexing for performance
        // .order("votes(count)", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (submissionsError) throw submissionsError;
      if (!submissionsData) throw new Error("No submission data returned");

      console.log("Raw submissions data:", submissionsData);

      let userVotedIds = new Set<string>();

      // 2. If user is logged in, fetch the IDs of submissions they voted for
      if (currentUser) {
        const { data: userVotesData, error: userVotesError } = await supabase
          .from("votes")
          .select("submission_id")
          .eq("user_id", currentUser.id)
          .in("submission_id", submissionsData.map(s => s.id));

        if (userVotesError) {
          console.error("Error fetching user votes:", userVotesError);
          // Don't throw, just proceed without user vote info
        } else if (userVotesData) {
           console.log("User votes data:", userVotesData);
           userVotesData.forEach(vote => userVotedIds.add(vote.submission_id));
        }
      }
      console.log("User voted IDs set:", userVotedIds);

      // 3. Process submissions: calculate vote count and set hasVoted
      const processedSubmissions: ProcessedSubmission[] = submissionsData.map(submission => {
          // Adjust access to count based on actual Supabase response shape
          const voteCount = (submission.votes && Array.isArray(submission.votes) && submission.votes.length > 0)
                            ? submission.votes[0]?.count ?? 0
                            : 0;
          const hasVoted = currentUser ? userVotedIds.has(submission.id) : false;

          const { votes, ...restOfSubmission } = submission;
          return {
            ...restOfSubmission,
            image_url: restOfSubmission.image_url || null,
            hasVoted,
            voteCount: Number(voteCount) // Ensure it's a number
          };
      });

      console.log("Processed submissions (before sort):", processedSubmissions);

      // 4. Sort submissions by vote count descending
      const sortedSubmissions = processedSubmissions.sort((a, b) => b.voteCount - a.voteCount);

      console.log("Sorted submissions (final):", sortedSubmissions);
      setSubmissions(sortedSubmissions);

    } catch (error: any) {
       console.error("Error in fetchSubmissions:", error);
       toast({
         title: "Error loading submissions",
         description: error.message,
         variant: "destructive"
       });
       setSubmissions([]); // Clear submissions on error
    }
  };

  const handleVote = async (submissionId: string) => {
    if (!user) {
      navigate("/auth", { state: { returnPath: location.pathname } });
      return;
    }

    const originalSubmissions = [...submissions]; // Store original state for potential revert
    const submissionIndex = submissions.findIndex(s => s.id === submissionId);
    if (submissionIndex === -1) {
        console.error("Submission not found in local state:", submissionId);
        return;
    }

    const submissionToUpdate = submissions[submissionIndex];

    // --- Optimistic Update --- //
    const optimisticHasVoted = !submissionToUpdate.hasVoted;
    // Ensure vote count doesn't go below 0 visually
    const optimisticVoteCount = Math.max(0, optimisticHasVoted
      ? submissionToUpdate.voteCount + 1
      : submissionToUpdate.voteCount - 1);

    const optimisticSubmissions = submissions.map((s, index) =>
      index === submissionIndex
        ? { ...s, hasVoted: optimisticHasVoted, voteCount: optimisticVoteCount }
        : s
    );

    // Sort optimistically updated list immediately
    const sortedOptimisticSubmissions = [...optimisticSubmissions].sort((a, b) => b.voteCount - a.voteCount);
    setSubmissions(sortedOptimisticSubmissions);
    // --- End Optimistic Update --- //

    try {
      if (optimisticHasVoted) {
        // Add vote
        console.log(`Optimistic: Voted ${submissionId}. Sending insert to DB.`);
        const { error } = await supabase
          .from("votes")
          .insert([{ submission_id: submissionId, user_id: user.id }]);
        if (error) {
           if (error.code === '23505') {
             console.warn(`Vote already exists for ${submissionId} in DB (Constraint violation). Re-fetching.`);
             // Re-fetch to correct potential state mismatch
             throw new Error("Vote already exists, re-syncing state.");
           } else {
             throw error;
           }
        }
        console.log(`DB insert success for ${submissionId}`);
      } else {
        // Remove vote
        console.log(`Optimistic: Unvoted ${submissionId}. Sending delete to DB.`);
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", user.id);
        // We don't necessarily need to throw an error if delete affects 0 rows
        // (e.g., if the vote was already removed due to a race condition)
        if (error) throw error;
        console.log(`DB delete success/attempted for ${submissionId}`);
      }
    } catch (error: any) {
       console.error("Error updating vote in DB:", error);
       toast({
         title: "Error updating vote",
         // Provide a clearer message for unique constraint violation if possible
         description: error.message === "Vote already exists, re-syncing state." ? "Vote status re-synced." : error.message,
         variant: "destructive"
       });

       // --- Revert on Failure --- //
       console.log("Reverting UI state due to error by re-fetching.");
       if (business) {
           await fetchSubmissions(business.id, user);
       } else {
            // Fallback: Revert to the state before the optimistic update if business is somehow null
            console.warn("Business data missing, reverting to previous local state.");
            setSubmissions(originalSubmissions.sort((a, b) => b.voteCount - a.voteCount));
       }
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null); // Clear local user state
      toast({ title: "Logged out successfully." });
      // Re-fetch submissions for the logged-out state
      if (business) {
        await fetchSubmissions(business.id, null);
      }
      // Optional: navigate away, but staying might be fine
      // navigate("/"); 
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSubmitIdeaClick = () => {
    if (!user) {
      // Redirect to login if not logged in, but remember where to return
      navigate("/auth", { state: { returnPath: location.pathname } });
      return;
    }
    setSubmitModalOpen(true);
  };

  const handleGoBack = () => {
    navigate(-1); // Go back one step in history
  };

  // --- Delete Logic --- 
  const handleDeleteClick = (submissionId: string) => {
    console.log("Initiating delete for:", submissionId);
    setSubmissionToDeleteId(submissionId);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!submissionToDeleteId || !user) return; // Add user check for safety

    setIsDeleting(true);
    console.log(`Attempting to delete submission ID: ${submissionToDeleteId}`);

    try {
      // 1. Delete associated image from storage IF it exists
      const submissionToDelete = submissions.find(s => s.id === submissionToDeleteId);
      if (submissionToDelete?.image_url) {
        console.log(`Attempting to delete image: ${submissionToDelete.image_url}`);
        // Extract the file path from the full URL
        // Assuming URL is like: https://<project-ref>.supabase.co/storage/v1/object/public/submission-images/<business-slug>/<filename>
        // Adjust parsing logic based on your actual URL structure and bucket name
        try {
           const urlParts = submissionToDelete.image_url.split('/');
           const bucketName = urlParts[urlParts.length - 3]; // Adjust index if needed
           const filePath = urlParts.slice(urlParts.length - 2).join('/'); // e.g., <business-slug>/<filename>
           console.log(`Extracted Bucket: ${bucketName}, Path: ${filePath}`);

           if (bucketName === 'submission-images' && filePath) { // Double-check bucket name
             const { error: storageError } = await supabase
               .storage
               .from(bucketName) // Use extracted or hardcoded bucket name
               .remove([filePath]);

             if (storageError) {
               // Log storage error but proceed to attempt DB deletion
               console.error("Error deleting image from storage:", storageError);
               toast({
                 title: "Warning: Could not delete image",
                 description: storageError.message,
                 variant: "destructive", // Use warning or destructive
                 duration: 4000,
               });
             } else {
                console.log(`Successfully deleted image from storage: ${filePath}`);
             }
           } else {
             console.warn("Could not parse image path correctly or bucket name mismatch, skipping storage delete.");
           }
        } catch (parseError) {
            console.error("Error parsing image URL for deletion:", parseError, "URL:", submissionToDelete.image_url);
            toast({
                title: "Warning: Error processing image URL",
                description: "Could not determine image path for deletion.",
                variant: "destructive",
                duration: 4000,
            });
        }
      } else {
         console.log("No image associated with this submission.");
      }

      // 2. Delete the submission record from the database
      console.log(`Attempting to delete submission record ID: ${submissionToDeleteId} from database.`);
      const { error: dbError } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submissionToDeleteId); // Ensure RLS allows this based on auth.uid() = submitted_by

      if (dbError) {
        // Specific check for foreign key violation (likely due to votes without cascade delete)
        if (dbError.message.includes('violates foreign key constraint')) {
             console.error("Foreign key constraint violation:", dbError);
             toast({
                title: "Error Deleting Submission",
                description: "Cannot delete submission because it has associated votes. Please ensure cascade delete is configured on the 'votes' table.",
                variant: "destructive",
             });
        } else {
            throw dbError; // Re-throw other DB errors
        }
      } else {
         console.log(`Successfully deleted submission record ID: ${submissionToDeleteId}`);
         // 3. Update local state visually ONLY if DB delete was successful
         setSubmissions(prev => prev.filter(s => s.id !== submissionToDeleteId));
         toast({ title: "Submission deleted successfully" });
         setIsConfirmDeleteDialogOpen(false); // Close dialog on success
         setSubmissionToDeleteId(null);
      }

    } catch (error: any) {
      console.error("Error deleting submission:", error);
      toast({
        title: "Error deleting submission",
        description: error.message,
        variant: "destructive"
      });
      // Don't close the dialog on error, let the user retry or cancel
    } finally {
      setIsDeleting(false);
    }
  };
  // --- End Delete Logic --- 

  // --- Edit Logic --- 
  const handleEditClick = (submission: ProcessedSubmission) => {
    console.log("handleEditClick called with submission:", submission); // DEBUG
    if (!submission) {
        console.error("handleEditClick called with null/undefined submission");
        return;
    }
    setSubmissionToEdit(submission);
    setIsEditModalOpen(true);
    console.log("Edit modal state set:", { submissionToEdit: submission, isEditModalOpen: true }); // DEBUG
  };

  const handleEditComplete = () => {
    console.log("handleEditComplete called"); // DEBUG
    setIsEditModalOpen(false);
    setSubmissionToEdit(null);
    // Re-fetch submissions to show the updated data
    if (business?.id) {
      fetchSubmissions(business.id, user);
    }
  };
  // --- End Edit Logic --- 

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Business not found</p>
      </div>
    );
  }

  return (
    // Main page container with dark background
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {/* Header Box */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
         {/* Removed border-b from original header location */}
         {/* <div className="container mx-auto px-4 py-4"> -> Container adjusted */}
           <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGoBack}
                aria-label="Go back"
                 // Consistent dark mode styling for ghost button
                className="h-8 w-8 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{business.name}</h1>
                <p className="text-muted-foreground text-sm">{business.tagline}</p> { /* text-muted-foreground should adapt */}
              </div>
            </div>
            
            {/* Right side: Action Buttons - Add flex-wrap */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4"> {/* Added flex-wrap and justify-end */}
              {/* View Others Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/creator')}
                className="gap-1.5"
              >
                <Users size={16} />
                View Others
              </Button>
              {/* Submit Idea Button */}
              <Button 
                onClick={handleSubmitIdeaClick} 
                size="sm"
                className="gap-1.5"
              >
                <Plus size={16} />
                Submit Idea
              </Button>

              {/* User Info & Logout */}
              {user && (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
                    <User size={16} /> 
                    <span>{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="gap-1"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        {/*</div> -> End adjusted container */} 
      </div>
      
      {/* Main Content Area - Could be a grid later */}
      <div className="space-y-6">
         {/* Submissions Box */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
           <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Product Ideas</h2>
          
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" // Adjusted gap and added xl col
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {submissions.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No product ideas submitted yet. Be the first!</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <motion.div key={submission.id} variants={itemVariants} layout>
                  {/* Use Card component from Shadcn for consistency */}
                  {/* Ensure Card component styling adapts to dark mode */}
                  <Tilt 
                     rotationFactor={3} 
                     className={cn(
                      "w-full h-full",
                      submission.image_url && "cursor-pointer"
                     )}
                    >
                      {/* Card Styling - bg-card should adapt */}
                    <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm h-full dark:border-gray-700">
                      {submission.image_url ? (
                        <img
                          src={submission.image_url}
                          alt={submission.title}
                           className="h-48 w-full object-cover transition-opacity hover:opacity-90 cursor-pointer"
                          onClick={() => setSelectedImageUrl(submission.image_url)}
                        />
                      ) : (
                         // Darker placeholder for dark mode
                        <div className="h-48 w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">No Image</span>
                        </div>
                      )}
                      {/* Card Content */}
                       <div className="p-4 flex flex-col flex-grow">
                         <h3 className="font-semibold tracking-tight text-lg mb-1 text-card-foreground">{submission.title}</h3>
                         <p className="text-sm text-muted-foreground mb-4 flex-grow">{submission.description}</p>
                         {/* Card Footer - Instagram Style */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t dark:border-gray-700 gap-4">
                           <div className="flex items-center gap-3">
                             {/* New Like Button Implementation */}
                            <button
                              onClick={() => handleVote(submission.id)}
                              className={cn(
                                "flex items-center justify-center gap-2", // Flex container for icon and count
                                "h-10 px-4 rounded-lg", // Size and shape
                                "bg-gray-100 dark:bg-gray-700/50", // Background
                                "shadow-inner dark:shadow-inner-dark", // Subtle inner shadow 
                                "hover:bg-gray-200 dark:hover:bg-gray-600/50", // Hover state
                                "transition-colors duration-150",
                                "group" // Group for potential hover effects on children
                              )}
                            >
                              <motion.svg
                                key={submission.hasVoted ? 'liked' : 'unliked'} // Key change triggers animation
                                fillRule="nonzero"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  "h-6 w-6 transition-colors duration-200 ease-out",
                                  submission.hasVoted
                                    ? "fill-red-500 stroke-red-500" // Liked state: filled red
                                    : "fill-none stroke-current text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" // Unliked state: stroke only
                                )}
                                initial={{ scale: 1 }}
                                animate={{
                                  scale: submission.hasVoted ? [1, 1.3, 1] : 1, // Pop animation on like
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <path
                                  d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
                                />
                              </motion.svg>
                              {/* Add Vote Count inside button */}
                              <span className="text-sm font-medium text-card-foreground">
                                {submission.voteCount}
                              </span>
                            </button>
                            {/* Re-add Status Tag */}
                            {submission.status && submission.status !== 'pending' && (
                               <span
                                 className={cn(
                                   "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium",
                                   {
                                     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': submission.status === 'under_review',
                                     'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': submission.status === 'selected',
                                     'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': submission.status === 'rejected',
                                     'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200': !['under_review', 'selected', 'rejected'].includes(submission.status)
                                   }
                                 )}
                               >
                                 {submission.status.charAt(0).toUpperCase() + submission.status.slice(1).replace(/_/g, ' ')}
                               </span>
                            )}
                             
                           </div>
  
                           {user && submission.submitted_by === user.id && (
                              <div className="flex items-center gap-1">
                               {/* Edit/Delete Icons - Consistent Ghost style */}
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                 onClick={() => handleEditClick(submission)}
                                 aria-label="Edit submission"
                               >
                                 <Pencil size={16} />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                 onClick={() => handleDeleteClick(submission.id)}
                                 aria-label="Delete submission"
                                >
                                 <Trash2 size={16} />
                               </Button>
                             </div>
                           )}
                         </div>
                       </div>
                    </div>
                  </Tilt>
                </motion.div>
              ))
            )}
          </motion.div>
         </div> { /* End Submissions Box */}
       </div> { /* End Main Content Area */}
      
      {/* Modals remain unchanged, assuming they adapt via Shadcn UI */}
      <SubmitIdeaModal 
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        businessId={business?.id || ''}
        onSubmissionComplete={() => {
          if(business) fetchSubmissions(business.id, user);
          fetchSubmissions(business.id, user);
        }}
      />
      <Lightbox 
        imageUrl={selectedImageUrl} 
        onClose={() => setSelectedImageUrl(null)} 
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product idea submission and its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Idea Modal */}
      {submissionToEdit && ( // Ensure submissionToEdit is not null before rendering
         <EditIdeaModal
            open={isEditModalOpen}
            onClose={() => {
                console.log("Closing Edit Modal via onClose prop"); // DEBUG
                setIsEditModalOpen(false);
                setSubmissionToEdit(null); // Clear submission when closing
            }}
            submission={submissionToEdit}
            onUpdateComplete={handleEditComplete} // <-- FIX: Changed prop name
          />
      )}
    </div>
  );
};

export default BusinessPage;

