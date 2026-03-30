'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, useIsAdmin, useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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
  Plus,
  Upload,
  X,
  Save
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminReviewsPage() {
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = useIsAdmin();

  const configRef = useMemoFirebase(() => db ? doc(db, 'config', 'reviews') : null, [db]);
  const { data: config, isLoading: configLoading } = useDoc(configRef);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, isAdmin]);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'products'), orderBy('name', 'asc'));
  }, [db, isAdmin]);

  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);
  const { data: products } = useCollection(productsQuery);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: '',
    userName: '',
    rating: 5,
    comment: '',
    imageUrl: '',
    published: true
  });

  const handleToggleGlobal = async (enabled: boolean) => {
    if (!configRef) return;
    setDoc(configRef, { enabled, updatedAt: serverTimestamp() }, { merge: true })
      .then(() => {
        toast({
          title: enabled ? "Reviews enabled" : "Reviews disabled",
          description: `Storefront status updated.`,
        });
      });
  };

  const handleTogglePublish = async (review: any) => {
    if (!db) return;
    const newStatus = !review.published;
    
    updateDoc(doc(db, 'reviews', review.id), {
      published: newStatus,
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({
        title: newStatus ? "Published" : "Hidden",
        description: `Visibility updated.`,
      });
    });
  };

  const handleDeleteReview = async (review: any) => {
    if (!db || !confirm("Delete review?")) return;
    deleteDoc(doc(db, 'reviews', review.id)).then(() => {
      toast({
        title: "Deleted",
        description: "Review removed.",
      });
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsSaving(true);
    toast({
      title: "Uploading Image...",
      description: "Synchronizing review visual with cloud storage.",
    });

    try {
      const storageRef = ref(storage, `reviews/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setNewReview({ ...newReview, imageUrl: downloadURL });
      toast({
        title: "Image Uploaded",
        description: "Review asset is now hosted securely.",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: "Encountered a deviation in the storage transmission.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewReview = async () => {
    if (!db || !newReview.productId || !newReview.userName || !newReview.comment) return;
    setIsSaving(true);

    const reviewData = {
      ...newReview,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    addDoc(collection(db, 'reviews'), reviewData)
      .then(() => {
        setIsAddOpen(false);
        setNewReview({
          productId: '',
          userName: '',
          rating: 5,
          comment: '',
          imageUrl: '',
          published: true
        });
        toast({ title: "Saved", description: "Review added." });
      })
      .finally(() => setIsSaving(false));
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Reviews</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Moderate studio feedback.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-black text-white font-bold h-10 gap-2 uppercase tracking-widest text-[10px]">
              <Plus className="h-4 w-4" /> Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl p-0 flex flex-col h-fit max-h-[95vh]">
            <DialogHeader className="p-4 sm:p-6 border-b shrink-0">
              <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">New Review</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Add feedback for the studio.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Product</Label>
                  <Select value={newReview.productId} onValueChange={(v) => setNewReview({ ...newReview, productId: v })}>
                    <SelectTrigger className="h-12 uppercase font-bold text-[10px]">
                      <SelectValue placeholder="SELECT PIECE" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id} className="uppercase font-bold text-[10px]">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Name</Label>
                    <Input 
                      value={newReview.userName} 
                      onChange={(e) => setNewReview({ ...newReview, userName: e.target.value })}
                      placeholder="Name"
                      className="h-12 uppercase font-bold text-[10px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Rating</Label>
                    <Select value={String(newReview.rating)} onValueChange={(v) => setNewReview({ ...newReview, rating: Number(v) })}>
                      <SelectTrigger className="h-12 font-bold text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((r) => (
                          <SelectItem key={r} value={String(r)} className="font-bold text-[10px]">{r} STARS</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Feedback</Label>
                  <Textarea 
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Feedback text"
                    className="min-h-[100px] resize-none uppercase font-medium text-[11px]"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-none">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold uppercase">Publish now</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Visibility active</p>
                  </div>
                  <Switch checked={newReview.published} onCheckedChange={(v) => setNewReview({ ...newReview, published: v })} />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Photo</Label>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <div 
                    onClick={() => !newReview.imageUrl && fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-none h-24 flex items-center justify-center gap-3 bg-gray-50 cursor-pointer hover:border-black transition-all"
                  >
                    {newReview.imageUrl ? (
                      <div className="relative w-16 h-16 rounded-sm overflow-hidden border shadow-sm">
                        <Image src={newReview.imageUrl} alt="Preview" fill className="object-cover" />
                        <button onClick={(e) => { e.stopPropagation(); setNewReview({ ...newReview, imageUrl: '' }); }} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <><Upload className="h-5 w-5 text-gray-400" /><span className="text-[10px] font-bold uppercase text-gray-500">Add Photo</span></>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-4 sm:p-6 border-t shrink-0">
              <Button 
                onClick={handleSaveNewReview} 
                disabled={isSaving || !newReview.productId || !newReview.userName || !newReview.comment}
                className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className={cn("border-[#e1e3e5] shadow-none rounded-none transition-all duration-500", config?.enabled ? 'bg-white' : 'bg-gray-50/50')}>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-gray-50/30 p-4 sm:p-6 gap-4">
          <div className="space-y-1">
            <CardTitle className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5" /> System Status
            </CardTitle>
            <CardDescription className="text-[9px] uppercase font-bold text-zinc-500 mt-1">Control all storefront reviews.</CardDescription>
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
              When disabled, reviews and ratings stay hidden from the store.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Rating</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest w-[300px]">Feedback</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Photo</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!reviews || reviews.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    No reviews found.
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

        <div className="lg:hidden divide-y">
          {(!reviews || reviews.length === 0) ? (
            <div className="text-center py-20 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              No reviews found.
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
                      <Image src={review.imageUrl} alt="Reviewer photo" fill className="object-cover" />
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
                    <Trash2 className="h-3.5 w-3.5" /> Delete
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

