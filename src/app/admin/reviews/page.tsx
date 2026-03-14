
'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  Image as ImageIcon,
  Settings2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function AdminReviewsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isAdmin = useMemo(() => {
    return user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [user]);

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'reviews') : null, [db]);
  const { data: config, isLoading: configLoading } = useDoc(configRef);

  // Zero-Error Listing Protocol: Use a simple query to ensure high-fidelity data ingestion.
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

  const handleToggleGlobal = async (enabled: boolean) => {
    if (!configRef) return;
    setDoc(configRef, { enabled, updatedAt: serverTimestamp() }, { merge: true })
      .then(() => {
        toast({
          title: enabled ? "System Enabled" : "System Disabled",
          description: `Product review manifest has been Authoritatively updated.`,
        });
      });
  };

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

  if (reviewsLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Review Moderation</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Manage archival feedback and curated testimonials.</p>
        </div>
      </div>

      {/* Global Configuration Card */}
      <Card className={cn("border-[#e1e3e5] shadow-none rounded-none transition-all duration-500", config?.enabled ? 'bg-white' : 'bg-gray-50/50')}>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-gray-50/30 p-4 sm:p-6 gap-4">
          <div className="space-y-1">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5" /> Global Review System
            </CardTitle>
            <CardDescription className="text-[9px] uppercase font-bold text-zinc-500 mt-1">Enable or decommission the entire storefront review manifest.</CardDescription>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-none pt-3 sm:pt-0">
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", config?.enabled ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{config?.enabled ? "Active" : "Offline"}</span>
            </div>
            <Switch checked={config?.enabled ?? true} onCheckedChange={handleToggleGlobal} />
          </div>
        </CardHeader>
        <CardContent className="pt-6 px-4 sm:px-6">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-none">
            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-blue-800 uppercase font-medium leading-relaxed">
              When disabled, the review form and all rating stars are strictly hidden from the storefront viewport to maintain editorial control.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Participant</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Rating</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest w-[300px]">Testimonial</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Media</TableHead>
                <TableHead className="w-[100px]"></TableHead>
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

        {/* Mobile Card View - Strictly Avoids Horizontal Sliding */}
        <div className="md:hidden divide-y">
          {(!reviews || reviews.length === 0) ? (
            <div className="text-center py-20 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              No reviews cataloged.
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-4 space-y-4 bg-white hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge variant="outline" className={cn(
                      "text-[7px] font-bold uppercase tracking-widest border-none px-1.5 py-0.5",
                      review.published ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                    )}>
                      {review.published ? 'Published' : 'Pending'}
                    </Badge>
                    <p className="font-bold text-sm uppercase tracking-tight text-primary">{review.userName}</p>
                    <p className="text-[9px] text-gray-400 font-mono uppercase">
                      {new Date(review.createdAt?.toDate?.() || review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-3 w-3", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  {review.imageUrl && (
                    <div className="w-16 h-20 relative bg-gray-100 rounded-sm border overflow-hidden shrink-0 shadow-sm">
                      <Image src={review.imageUrl} alt="Review" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 line-clamp-4 italic leading-relaxed">"{review.comment}"</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleTogglePublish(review)}
                    className="h-9 px-3 gap-2 font-bold uppercase tracking-widest text-[9px]"
                  >
                    {review.published ? <EyeOff className="h-3.5 w-3.5 text-orange-500" /> : <Eye className="h-3.5 w-3.5 text-green-600" />}
                    {review.published ? 'Hide' : 'Publish'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteReview(review)}
                    className="h-9 px-3 gap-2 font-bold uppercase tracking-widest text-[9px] text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Purge
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
