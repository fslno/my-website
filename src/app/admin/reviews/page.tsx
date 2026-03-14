
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2, 
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function AdminReviewsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isAdmin = useMemo(() => {
    return user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [user]);

  // Zero-Error Listing Protocol: Use a simple query to ensure high-fidelity data ingestion.
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const { data: reviews, isLoading } = useCollection(reviewsQuery);

  const handleTogglePublish = async (review: any) => {
    if (!db) return;
    const newStatus = !review.published;
    
    updateDoc(doc(db, 'reviews', review.id), {
      published: newStatus,
      updatedAt: new Date().toISOString()
    }).then(() => {
      toast({
        title: newStatus ? "Review Published" : "Review Hidden",
        description: `Archival visibility updated for ${review.userName}.`,
      });
    });
  };

  const handleDeleteReview = async (review: any) => {
    if (!db || !confirm("Authoritatively delete this review?")) return;
    deleteDoc(doc(db, 'reviews', review.id)).then(() => {
      toast({
        title: "Review Purged",
        description: "Entry removed from the forensic manifest.",
      });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Review Moderation</h1>
        <p className="text-[#5c5f62] mt-1 text-sm uppercase font-medium tracking-tight">Manage archival feedback and curated testimonials.</p>
      </div>

      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Participant</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Rating</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest w-[300px]">Testimonial</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Media</TableHead>
              <TableHead className="w-[150px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!reviews || reviews.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                  No reviews cataloged in the archive.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id} className="hover:bg-gray-50/30 transition-colors group border-b last:border-0">
                  <TableCell className="p-6">
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-bold uppercase tracking-widest border-none px-2 py-1",
                      review.published ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                    )}>
                      {review.published ? 'Published' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs uppercase">{review.userName}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{new Date(review.createdAt?.toDate?.() || review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-3 w-3", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-gray-600 line-clamp-2 italic">"{review.comment}"</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {review.imageUrl ? (
                        <div className="relative w-10 h-10 border rounded overflow-hidden shadow-sm">
                          <Image src={review.imageUrl} alt="Review" fill className="object-cover" />
                        </div>
                      ) : (
                        <ImageIcon className="h-4 w-4 text-gray-200" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleTogglePublish(review)}
                        className="h-8 w-8"
                      >
                        {review.published ? <EyeOff className="h-4 w-4 text-orange-500" /> : <Eye className="h-4 w-4 text-green-600" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteReview(review)}
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
