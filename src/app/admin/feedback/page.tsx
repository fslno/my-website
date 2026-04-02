'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useDoc, 
  useIsAdmin, 
  useStorage 
} from '@/firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
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
  Save,
  MessageSquareQuote,
  Quote
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminFeedbackPage() {
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const testimonialFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = useIsAdmin();

  // --- Reviews Data ---
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

  // --- Testimonials Data ---
  const testimonialsQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')) : null, 
    [db, isAdmin]
  );
  const { data: testimonials, isLoading: testimonialsLoading } = useCollection(testimonialsQuery);

  // --- State for Reviews ---
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: '',
    userName: '',
    rating: 5,
    comment: '',
    imageUrl: '',
    published: true
  });

  // --- State for Testimonials ---
  const [isAddTestimonialOpen, setIsAddTestimonialOpen] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialData, setTestimonialData] = useState({
    customerName: '',
    quote: '',
    customerImageUrl: '',
    rating: '5',
    isFeatured: true
  });

  // --- Review Actions ---
  const handleToggleReviewStatus = async (reviewId: string, currentStatus: boolean) => {
    if (!db) return;
    const reviewRef = doc(db, 'reviews', reviewId);
    updateDoc(reviewRef, { published: !currentStatus, updatedAt: serverTimestamp() })
      .then(() => toast({ title: currentStatus ? "Review Hidden" : "Review Published" }));
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!db || !confirm("Are you sure you want to delete this review?")) return;
    deleteDoc(doc(db, 'reviews', reviewId))
      .then(() => toast({ title: "Review Deleted", variant: "destructive" }));
  };

  const handleCreateReview = async () => {
    if (!db || !newReview.productId || !newReview.userName) return;
    setIsSaving(true);
    const reviewData = {
      ...newReview,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(collection(db, 'reviews'), reviewData)
      .then(() => {
        setIsAddReviewOpen(false);
        setNewReview({ productId: '', userName: '', rating: 5, comment: '', imageUrl: '', published: true });
        toast({ title: "Review Created" });
      })
      .finally(() => setIsSaving(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'review' | 'testimonial') => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsSaving(true);
    try {
      const storagePath = type === 'review' ? `reviews/${Date.now()}_${file.name}` : `testimonials/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      if (type === 'review') {
        setNewReview(prev => ({ ...prev, imageUrl: downloadURL }));
      } else {
        setTestimonialData(prev => ({ ...prev, customerImageUrl: downloadURL }));
      }
      
      toast({ title: "Image Uploaded" });
    } catch (error) {
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Testimonial Actions ---
  const handleCreateOrUpdateTestimonial = async () => {
    if (!db || !testimonialData.customerName || !testimonialData.quote) return;
    setIsSaving(true);
    
    const data = {
      ...testimonialData,
      rating: Number(testimonialData.rating),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingTestimonialId) {
        await updateDoc(doc(db, 'testimonials', editingTestimonialId), data);
        toast({ title: "Testimonial Updated" });
      } else {
        await addDoc(collection(db, 'testimonials'), { ...data, createdAt: serverTimestamp() });
        toast({ title: "Testimonial Created" });
      }
      setIsAddTestimonialOpen(false);
      resetTestimonialForm();
    } catch (error) {
      toast({ title: "Save Failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!db || !confirm("Are you sure you want to delete this testimonial?")) return;
    deleteDoc(doc(db, 'testimonials', id))
      .then(() => toast({ title: "Testimonial Deleted", variant: "destructive" }));
  };

  const resetTestimonialForm = () => {
    setTestimonialData({
      customerName: '',
      quote: '',
      customerImageUrl: '',
      rating: '5',
      isFeatured: true
    });
    setEditingTestimonialId(null);
  };

  const openTestimonialEdit = (t: any) => {
    setTestimonialData({
      customerName: t.customerName || '',
      quote: t.quote || '',
      customerImageUrl: t.customerImageUrl || '',
      rating: t.rating?.toString() || '5',
      isFeatured: t.isFeatured !== false
    });
    setEditingTestimonialId(t.id);
    setIsAddTestimonialOpen(true);
  };

  const handleToggleGlobalReviews = async (enabled: boolean) => {
    if (!configRef) return;
    setDoc(configRef, { enabled, updatedAt: serverTimestamp() }, { merge: true })
      .then(() => toast({ title: enabled ? "Reviews Enabled" : "Reviews Disabled" }));
  };

  if (reviewsLoading || testimonialsLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 min-w-0 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">User Feedback</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">
            Manage product reviews, site testimonials, and global customer sentiment.
          </p>
        </div>
      </div>

      <Tabs defaultValue="product-reviews" className="w-full">
        <TabsList className="bg-white border border-[#e1e3e5] h-auto flex-wrap p-1 mb-8 gap-2 rounded-none">
          <TabsTrigger value="product-reviews" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <Star className="h-3.5 w-3.5" /> Product Reviews
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <Quote className="h-3.5 w-3.5" /> Site Testimonials
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-grow sm:flex-grow-0 gap-2 px-4 sm:px-6 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] data-[state=active]:bg-black data-[state=active]:text-white h-10 transition-all">
            <Settings2 className="h-3.5 w-3.5" /> Sentiment Settings
          </TabsTrigger>
        </TabsList>

        {/* Product Reviews Content */}
        <TabsContent value="product-reviews" className="space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 border-b">
              <div className="space-y-1">
                <CardTitle className="text-lg font-headline uppercase tracking-tight">Active Reviews</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-tight text-gray-400">Reviews submitted for individual catalog items.</CardDescription>
              </div>
              <Dialog open={isAddReviewOpen} onOpenChange={setIsAddReviewOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white px-6 h-10 font-bold uppercase tracking-widest text-[10px] rounded-none shadow-xl">
                    <Plus className="mr-2 h-3 w-3" /> Manual Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-none font-admin-body">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-headline uppercase font-bold">Manual Product Review</DialogTitle>
                    <DialogDescription className="text-xs uppercase font-bold text-gray-400 tracking-widest">Submit a review on behalf of a verified purchaser.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Target Product</Label>
                      <Select value={newReview.productId} onValueChange={(val) => setNewReview(prev => ({ ...prev, productId: val }))}>
                        <SelectTrigger className="h-11 rounded-none border-gray-100 text-xs font-bold uppercase">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-gray-100">
                          {products?.map(p => (
                            <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Customer Name</Label>
                      <Input 
                        value={newReview.userName} 
                        onChange={(e) => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
                        className="h-11 rounded-none border-gray-100 text-xs font-bold uppercase placeholder:lowercase"
                        placeholder="Verified Athlete"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Rating (1-5)</Label>
                      <Input 
                        type="number" min="1" max="5" 
                        value={newReview.rating} 
                        onChange={(e) => setNewReview(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                        className="h-11 rounded-none border-gray-100 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Feedback Narrative</Label>
                      <Textarea 
                        value={newReview.comment} 
                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        className="rounded-none border-gray-100 text-xs min-h-[100px]"
                        placeholder="Performance details..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Visual Proof (Optional)</Label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-100 p-8 text-center cursor-pointer hover:border-black transition-all bg-gray-50/30 group"
                      >
                        {newReview.imageUrl ? (
                          <div className="relative w-24 h-24 mx-auto border bg-white p-1">
                            <Image src={newReview.imageUrl} alt="Review" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="space-y-2 grayscale group-hover:grayscale-0 transition-all">
                            <Upload className="h-6 w-6 mx-auto text-gray-400 group-hover:text-black" />
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black">Upload Attachment</p>
                          </div>
                        )}
                        <input 
                          type="file" ref={fileInputRef} 
                          onChange={(e) => handleFileUpload(e, 'review')} 
                          className="hidden" accept="image/*" 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-8 border-t pt-6">
                    <Button variant="ghost" onClick={() => setIsAddReviewOpen(false)} className="text-[9px] font-bold uppercase tracking-widest">Cancel</Button>
                    <Button 
                      onClick={handleCreateReview} 
                      disabled={isSaving}
                      className="bg-black text-white h-11 px-8 font-bold uppercase tracking-widest text-[10px] rounded-none shadow-xl"
                    >
                      {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Submit Review
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="w-[300px] h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400 pl-8">Reviewer & Product</TableHead>
                      <TableHead className="h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400">Rating</TableHead>
                      <TableHead className="h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400">Sentiment Content</TableHead>
                      <TableHead className="h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400">Visibility</TableHead>
                      <TableHead className="text-right h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400 pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews?.map((review) => (
                      <TableRow key={review.id} className="group hover:bg-gray-50/50 transition-all border-b border-gray-100">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            {review.imageUrl ? (
                              <div className="h-10 w-10 relative bg-gray-50 flex-shrink-0">
                                <Image src={review.imageUrl} alt={review.userName} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 bg-gray-50 flex items-center justify-center text-gray-300 flex-shrink-0">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold uppercase tracking-tight">{review.userName}</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest max-w-[180px] truncate">
                                {products?.find(p => p.id === review.productId)?.name || "Unknown Product"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn("h-3 w-3", i < (review.rating || 0) ? "fill-black text-black" : "text-gray-200")} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-[10px] text-gray-500 leading-relaxed italic line-clamp-2">"{review.comment}"</p>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "text-[8px] px-2 py-0.5 font-bold uppercase tracking-widest rounded-none border-0",
                              review.published ? "bg-emerald-50 text-emerald-600 shadow-sm" : "bg-gray-50 text-gray-400"
                            )}
                          >
                            {review.published ? 'Live' : 'Hidden'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 hover:bg-black hover:text-white rounded-none"
                              onClick={() => handleToggleReviewStatus(review.id, review.published)}
                            >
                              {review.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-none"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {reviews?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-60 text-center">
                          <div className="space-y-2 opacity-20">
                            <MessageSquare className="h-10 w-10 mx-auto" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">No sentiment logs detected</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Content */}
        <TabsContent value="testimonials" className="space-y-6">
          <Card className="border-[#e1e3e5] shadow-none rounded-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 border-b">
              <div className="space-y-1">
                <CardTitle className="text-lg font-headline uppercase tracking-tight">Public Testimonials</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-tight text-gray-400">Curated, archival feedback showcased on the storefront.</CardDescription>
              </div>
              <Dialog open={isAddTestimonialOpen} onOpenChange={(val) => {
                if (!val) resetTestimonialForm();
                setIsAddTestimonialOpen(val);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white px-6 h-10 font-bold uppercase tracking-widest text-[10px] rounded-none shadow-xl">
                    <Plus className="mr-2 h-3 w-3" /> Add Testimonial
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-none font-admin-body">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-headline uppercase font-bold">{editingTestimonialId ? 'Modify' : 'New'} Testimonial</DialogTitle>
                    <DialogDescription className="text-xs uppercase font-bold text-gray-400 tracking-widest">General feedback that represents the FSLNO experience.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Author Identity</Label>
                      <Input 
                        value={testimonialData.customerName} 
                        onChange={(e) => setTestimonialData(prev => ({ ...prev, customerName: e.target.value }))}
                        className="h-11 rounded-none border-gray-100 text-xs font-bold uppercase placeholder:lowercase"
                        placeholder="John Smith"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Narrative Quote</Label>
                      <Textarea 
                        value={testimonialData.quote} 
                        onChange={(e) => setTestimonialData(prev => ({ ...prev, quote: e.target.value }))}
                        className="rounded-none border-gray-100 text-xs min-h-[100px]"
                        placeholder="FSLNO has redefined my expectations..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest font-bold">Rating (1-5)</Label>
                        <Select value={testimonialData.rating} onValueChange={(val) => setTestimonialData(prev => ({ ...prev, rating: val }))}>
                          <SelectTrigger className="h-11 rounded-none border-gray-100 text-xs font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-gray-100">
                            {[1,2,3,4,5].map(v => (
                              <SelectItem key={v} value={v.toString()} className="text-xs font-bold">{v} Stars</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase tracking-widest font-bold">Featured Status</Label>
                        <div className="flex items-center h-11 px-4 bg-gray-50/50 border border-transparent">
                          <Switch 
                            checked={testimonialData.isFeatured} 
                            onCheckedChange={(val) => setTestimonialData(prev => ({ ...prev, isFeatured: val }))}
                          />
                          <span className="ml-3 text-[9px] font-bold uppercase tracking-widest text-gray-500">Show on Front</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase tracking-widest font-bold">Portrait Image</Label>
                      <div 
                        onClick={() => testimonialFileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-100 p-8 text-center cursor-pointer hover:border-black transition-all bg-gray-50/30 group"
                      >
                        {testimonialData.customerImageUrl ? (
                          <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-white shadow-xl">
                            <Image src={testimonialData.customerImageUrl} alt="Preview" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="space-y-2 grayscale group-hover:grayscale-0 transition-all">
                            <ImageIcon className="h-6 w-6 mx-auto text-gray-400 group-hover:text-black" />
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black">Upload Profile</p>
                          </div>
                        )}
                        <input 
                          type="file" ref={testimonialFileInputRef} 
                          onChange={(e) => handleFileUpload(e, 'testimonial')} 
                          className="hidden" accept="image/*" 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-8 border-t pt-6">
                    <Button variant="ghost" onClick={() => setIsAddTestimonialOpen(false)} className="text-[9px] font-bold uppercase tracking-widest">Cancel</Button>
                    <Button 
                      onClick={handleCreateOrUpdateTestimonial} 
                      disabled={isSaving}
                      className="bg-black text-white h-11 px-8 font-bold uppercase tracking-widest text-[10px] rounded-none shadow-xl"
                    >
                      {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} {editingTestimonialId ? 'Save' : 'Publish'} Testimonial
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[300px] h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400 pl-8">Customer Portrait</TableHead>
                    <TableHead className="h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400">Narrative</TableHead>
                    <TableHead className="h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400">Rating</TableHead>
                    <TableHead className="h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400">Featured</TableHead>
                    <TableHead className="text-right h-12 text-[9px] uppercase tracking-widest font-bold text-gray-400 pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials?.map((t) => (
                    <TableRow key={t.id} className="group hover:bg-gray-50/50 transition-all border-b border-gray-100">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-full relative bg-gray-50 overflow-hidden flex-shrink-0",
                            !t.customerImageUrl && "flex items-center justify-center text-gray-300"
                          )}>
                            {t.customerImageUrl ? (
                              <Image src={t.customerImageUrl} alt={t.customerName} fill className="object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4" />
                            )}
                          </div>
                          <p className="text-xs font-bold uppercase tracking-tight">{t.customerName || 'Anonymous'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-[10px] text-gray-500 leading-relaxed italic line-clamp-2">"{t.quote}"</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < (t.rating || 0) ? "fill-black text-black" : "text-gray-200")} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "text-[8px] px-2 py-0.5 font-bold uppercase tracking-widest rounded-none border-0",
                            t.isFeatured !== false ? "bg-amber-50 text-amber-600 shadow-sm" : "bg-gray-50 text-gray-400"
                          )}
                        >
                          {t.isFeatured !== false ? 'Featured' : 'Standard'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 hover:bg-black hover:text-white rounded-none"
                            onClick={() => openTestimonialEdit(t)}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-none"
                            onClick={() => handleDeleteTestimonial(t.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Global Settings Content */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-[#e1e3e5] shadow-none rounded-none">
              <CardHeader className="bg-gray-50/50 border-b">
                <CardTitle className="text-lg font-headline uppercase tracking-tight">Review Protocol</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-tight text-gray-400">Configure how reviews are displayed to the public.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-dashed border-gray-200">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">Enable Product Reviews</Label>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Allow verified users to submit sentiments on product pages.</p>
                  </div>
                  <Switch 
                    checked={config?.enabled !== false} 
                    onCheckedChange={handleToggleGlobalReviews}
                  />
                </div>
                <div className="p-4 bg-black text-white space-y-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">System Readiness</span>
                    </div>
                    <p className="text-[9px] text-gray-400 uppercase font-bold leading-relaxed tracking-tight">
                        FSLNO architecture supports automated sentiment analysis and visual verification for all incoming feeds.
                    </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
