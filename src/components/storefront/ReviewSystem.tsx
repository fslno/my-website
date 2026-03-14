'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Camera, Loader2, MessageSquare, ShieldCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ReviewSystemProps {
  productId: string;
}

export function ReviewSystem({ productId }: ReviewSystemProps) {
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';

  // Zero-Error Listing Protocol: Use a simple query to avoid permission and index exceptions.
  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allReviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

  // Authoritative Client-Side Filtration for zero-error manifest.
  const productReviews = useMemo(() => {
    if (!allReviews || !productId) return [];
    return allReviews.filter(r => r.productId === productId && r.published === true);
  }, [allReviews, productId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || isSubmitting) return;

    setIsSubmitting(true);
    let imageUrl = null;

    try {
      if (imageFile && storage) {
        const storageRef = ref(storage, `reviews/${productId}/${user.uid}-${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const reviewData = {
        productId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Studio Participant',
        rating,
        comment,
        imageUrl,
        published: false, // New reviews require forensic moderation
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      toast({
        title: "Review Transmitted",
        description: "Your feedback is pending archival moderation.",
      });

      setComment('');
      setRating(5);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failure",
        description: "Could not sync review with the archive.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!db || !confirm("Authoritatively delete this review?")) return;
    deleteDoc(doc(db, 'reviews', reviewId)).then(() => {
      toast({ title: "Deleted", description: "Review removed from the archive." });
    });
  };

  return (
    <div className="space-y-16 py-12 border-t w-full">
      <section className="max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Studio Feedback</h2>
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 border rounded-none shadow-sm">
            <div className="space-y-4">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Rating Scale</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star className={cn(
                      "h-6 w-6 transition-all duration-300",
                      s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                    )} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Testimonial</Label>
              <Textarea 
                required 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on the silhouette..."
                className="min-h-[120px] bg-white text-sm rounded-none border-gray-200 resize-none font-medium"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Visuals (Optional)</Label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => document.getElementById('review-image')?.click()}
                  className="w-20 h-20 border-2 border-dashed rounded-none flex flex-col items-center justify-center gap-2 bg-white cursor-pointer hover:border-primary transition-all group"
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <>
                      <Camera className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                      <span className="text-[8px] font-bold uppercase text-gray-400">Add Photo</span>
                    </>
                  )}
                </div>
                <input 
                  id="review-image"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
                {imagePreview && (
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-[9px] font-bold text-red-500 uppercase underline">Remove</button>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-none hover:bg-black/90 transition-all shadow-xl"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
            </Button>
            <div className="text-[8px] text-center text-gray-400 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Security: All reviews undergo forensic moderation.
            </div>
          </form>
        ) : (
          <div className="p-12 text-center border-2 border-dashed rounded-none bg-gray-50/50">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Sign in to provide selection feedback.</p>
          </div>
        )}
      </section>

      <section className="space-y-12">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-400 border-b pb-4">Verified Testimonials</h3>
        
        {reviewsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-200" /></div>
        ) : productReviews.length === 0 ? (
          <div className="py-8 text-center"><p className="text-[10px] font-bold uppercase text-gray-300 tracking-widest italic">No public testimonials for this piece.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {productReviews.map((review) => (
              <div key={review.id} className="space-y-4 animate-in fade-in duration-700 group">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-3 w-3", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100")} />
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-mono text-gray-300 uppercase">{new Date(review.createdAt?.toDate?.() || review.createdAt).toLocaleDateString()}</span>
                    {isAdmin && (
                      <button onClick={() => handleDelete(review.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-6">
                  {review.imageUrl && (
                    <div className="w-24 h-32 relative bg-gray-100 rounded-sm border overflow-hidden shrink-0 shadow-sm">
                      <Image src={review.imageUrl} alt="Reviewer photo" fill className="object-cover" />
                    </div>
                  )}
                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-medium leading-relaxed italic text-gray-600">"{review.comment}"</p>
                    <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {review.userName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
