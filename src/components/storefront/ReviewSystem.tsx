'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, query, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, Camera, Loader2, MessageSquare, ShieldCheck, Trash2, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet"; 
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReviewSystemProps {
  productId: string;
}

/**
 * Authoritative Compact Review Discovery Protocol.
 * Forensicly reduced by 25% for viewport optimization.
 * Repositioned to the header manifest for universal archival prominence.
 */
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
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';

  // Global Review Config
  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'reviews') : null, [db]);
  const { data: config } = useDoc(configRef);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allReviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

  const productReviews = useMemo(() => {
    if (!allReviews || !productId) return [];
    return allReviews.filter(r => r.productId === productId && r.published === true);
  }, [allReviews, productId]);

  const stats = useMemo(() => {
    if (productReviews.length === 0) return { avg: 5, count: 0 };
    const avg = productReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / productReviews.length;
    return { avg: Number(avg.toFixed(1)), count: productReviews.length };
  }, [productReviews]);

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
        published: false,
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
        description: "Could not sync review.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!db || !confirm("Delete review?")) return;
    deleteDoc(doc(db, 'reviews', reviewId)).then(() => {
      toast({ title: "Deleted", description: "Review removed." });
    });
  };

  if (config && config.enabled === false) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="inline-block cursor-pointer group">
          <div className="bg-black text-white py-1.5 sm:py-2 px-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center gap-0.5 min-w-[110px]">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-headline leading-none">{stats.avg === 5 && stats.count === 0 ? "5" : stats.avg}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={cn(
                      "h-3 w-3 transition-all duration-500", 
                      s <= Math.round(stats.avg) ? "fill-yellow-400 text-yellow-400" : "text-zinc-800"
                    )} 
                  />
                ))}
              </div>
            </div>
            <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-zinc-400 whitespace-nowrap">
              Based on {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-2xl bg-white p-0 flex flex-col border-l border-black/10">
        <SheetHeader className="p-8 border-b bg-gray-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <SheetTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Studio Feedback</SheetTitle>
              </div>
              <SheetDescription className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Verified participant testimonials for this piece.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-16">
            <section className="space-y-8">
              <div className="flex items-center gap-2 border-b pb-4">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Provide Feedback</h3>
              </div>

              {user ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Rating Manifest</Label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="transition-transform active:scale-90"
                        >
                          <Star className={cn(
                            "h-7 w-7 transition-all duration-300",
                            s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100"
                          )} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Your Experience</Label>
                    <Textarea 
                      required 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="DESCRIBE THE SILHOUETTE..."
                      className="min-h-[120px] bg-gray-50 text-sm rounded-none border-none resize-none font-medium uppercase p-4"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Media Sync</Label>
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => document.getElementById('review-image-drawer')?.click()}
                        className="w-24 h-24 border-2 border-dashed rounded-none flex flex-col items-center justify-center gap-2 bg-gray-50 cursor-pointer hover:border-black transition-all group"
                      >
                        {imagePreview ? (
                          <div className="relative w-full h-full">
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                          </div>
                        ) : (
                          <>
                            <Camera className="h-5 w-5 text-gray-300 group-hover:text-black transition-colors" />
                            <span className="text-[8px] font-bold uppercase text-gray-400">Upload</span>
                          </>
                        )}
                      </div>
                      <input id="review-image-drawer" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      {imagePreview && (
                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-[9px] font-bold text-red-500 uppercase underline">Clear</button>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-none hover:bg-black/90 transition-all shadow-xl"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transmit Feedback"}
                  </Button>
                </form>
              ) : (
                <div className="p-8 text-center border-2 border-dashed rounded-none bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Sign in to leave a review.</p>
                </div>
              )}
            </section>

            <section className="space-y-8">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Verified Feed</h3>
                </div>
                <Badge variant="outline" className="text-[8px] font-bold border-none bg-black text-white px-2 h-5">{productReviews.length} PIECES</Badge>
              </div>
              
              {reviewsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-200" /></div>
              ) : productReviews.length === 0 ? (
                <div className="py-8 text-center"><p className="text-[10px] font-bold uppercase text-gray-300 tracking-widest italic">No public data for this piece.</p></div>
              ) : (
                <div className="space-y-12">
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
                            <button onClick={() => handleDelete(review.id)} className="text-red-500 hover:scale-110 transition-transform">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-6">
                        {review.imageUrl && (
                          <div className="w-20 h-28 relative bg-gray-100 rounded-sm border overflow-hidden shrink-0 shadow-sm">
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
        </ScrollArea>

        <div className="p-8 border-t bg-gray-50/50 shrink-0">
          <Button onClick={() => setIsOpen(false)} className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[9px]">Close Feedback</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
