
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Star,
  Save,
  Upload,
  MoreHorizontal
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
import { useFirestore, useCollection, useMemoFirebase, useUser, useIsAdmin, useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function AdminTestimonialsPage() {
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = useIsAdmin();

  const testimonialsQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')) : null, 
    [db, isAdmin]
  );

  const { data: testimonials, isLoading } = useCollection(testimonialsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [customerName, setCustomerName] = useState('');
  const [quote, setQuote] = useState('');
  const [customerImageUrl, setCustomerImageUrl] = useState('');
  const [rating, setRating] = useState('5');
  const [isFeatured, setIsFeatured] = useState(true);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsSaving(true);
    toast({
      title: "Uploading Image...",
      description: "Synchronizing testimonial visual with cloud storage.",
    });

    try {
      const storageRef = ref(storage, `testimonials/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setCustomerImageUrl(downloadURL);
      toast({
        title: "Image Uploaded",
        description: "Testimonial asset is now hosted securely.",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: "Critical error in storage transmission.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!db || !customerName || !quote) return;
    setIsSaving(true);
    const payload = { customerName: customerName.toUpperCase(), quote, customerImageUrl, rating: Number(rating), isFeatured, updatedAt: serverTimestamp() };
    if (editingId) {
      updateDoc(doc(db, 'testimonials', editingId), payload)
        .then(() => { setIsDialogOpen(false); resetForm(); toast({ title: "Updated", description: "Testimonial synchronized." }); })
        .finally(() => setIsSaving(false));
    } else {
      addDoc(collection(db, 'testimonials'), { ...payload, createdAt: serverTimestamp() })
        .then(() => { setIsDialogOpen(false); resetForm(); toast({ title: "Created", description: "Testimonial ingested." }); })
        .finally(() => setIsSaving(false));
    }
  };

  const handleDelete = (id: string) => {
    if (!db || !confirm("Authoritatively delete?")) return;
    deleteDoc(doc(db, 'testimonials', id)).then(() => { toast({ title: "Deleted", description: "Removed from archive." }); });
  };

  const toggleFeatured = (id: string, current: boolean) => {
    if (!db) return;
    updateDoc(doc(db, 'testimonials', id), { isFeatured: !current });
  };

  const resetForm = () => { setCustomerName(''); setQuote(''); setCustomerImageUrl(''); setRating('5'); setIsFeatured(true); setEditingId(null); };

  const openEdit = (t: any) => {
    setCustomerName(t.customerName || ''); setQuote(t.quote || ''); setCustomerImageUrl(t.customerImageUrl || '');
    setRating(String(t.rating || '5')); setIsFeatured(t.isFeatured ?? true); setEditingId(t.id); setIsDialogOpen(true);
  };

  if (!isAdmin) return <div className="p-8">Access Denied.</div>;

  return (
    <div className="space-y-8 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Testimonials</h1><p className="text-[#5c5f62] mt-1 text-sm uppercase tracking-tight">Featured archival feedback.</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button className="bg-black text-white font-bold h-10 gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> Add Testimonial</Button></DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl p-0">
            <DialogHeader className="p-6 border-b"><DialogTitle className="text-lg font-headline font-bold uppercase tracking-tight">Testimonial Protocol</DialogTitle></DialogHeader>
            <div className="p-6 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[9px] uppercase font-bold text-gray-500">Name</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-10 uppercase font-bold text-[11px]" /></div>
                <div className="space-y-1.5"><Label className="text-[9px] uppercase font-bold text-gray-500">Rating</Label><Input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="h-10 text-[11px]" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[9px] uppercase font-bold text-gray-500">Quote</Label><Textarea value={quote} onChange={(e) => setQuote(e.target.value)} className="min-h-[80px] resize-none text-[11px]" /></div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="p-3 bg-gray-50 border rounded-none"><Label className="text-[9px] uppercase font-bold text-gray-500">Featured</Label><div className="flex items-center gap-2 mt-1"><Switch checked={isFeatured} onCheckedChange={setIsFeatured} className="scale-75" /><span className="text-[8px] font-bold uppercase">{isFeatured ? 'Live' : 'Draft'}</span></div></div>
                <div className="space-y-1.5"><Label className="text-[9px] uppercase font-bold text-gray-500">Visual</Label><div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-none h-12 flex items-center justify-center gap-2 bg-gray-50 cursor-pointer">{customerImageUrl ? <div className="relative w-8 h-8 rounded-full overflow-hidden border"><Image src={customerImageUrl} alt="Preview" fill sizes="40px" className="object-cover" /></div> : <Upload className="h-4 w-4 text-gray-400" />}</div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} /></div>
              </div>
            </div>
            <DialogFooter className="p-6 border-t"><Button onClick={handleSave} disabled={isSaving || !customerName || !quote} className="w-full bg-black text-white h-12 font-bold uppercase tracking-[0.2em] text-[10px]">{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{editingId ? 'Update' : 'Ingest'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-gray-50/50"><TableRow><TableHead className="w-[80px] p-6">Avatar</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-widest">Participant</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-widest">Quote</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Rating</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Featured</TableHead><TableHead className="w-[100px]"></TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
              ) : !testimonials || testimonials.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-[10px] font-bold uppercase text-gray-400">No testimonials cataloged.</TableCell></TableRow>
              ) : testimonials.map((t) => (
                <TableRow key={t.id} className="hover:bg-gray-50/30 cursor-pointer group border-b last:border-0" onClick={() => openEdit(t)}>
                  <TableCell className="p-6"><div className="w-10 h-10 rounded-full border bg-gray-100 overflow-hidden relative shrink-0">{t.customerImageUrl && <Image src={t.customerImageUrl} alt={t.customerName} fill sizes="40px" className="object-cover" />}</div></TableCell>
                  <TableCell><p className="font-bold text-xs uppercase tracking-widest">{t.customerName}</p></TableCell>
                  <TableCell><p className="text-[11px] text-gray-500 line-clamp-2 italic">"{t.quote}"</p></TableCell>
                  <TableCell><div className="flex justify-center gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("h-3 w-3", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />)}</div></TableCell>
                  <TableCell className="text-center"><div className="flex justify-center" onClick={e => e.stopPropagation()}><Switch checked={t.isFeatured} onCheckedChange={() => toggleFeatured(t.id, t.isFeatured)} /></div></TableCell>
                  <TableCell className="pr-6"><div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"><Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(t.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="lg:hidden divide-y">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : !testimonials || testimonials.length === 0 ? (
            <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest">Empty manifest.</div>
          ) : testimonials.map((t) => (
            <div key={t.id} className="p-4 bg-white space-y-4 hover:bg-gray-50 transition-colors" onClick={() => openEdit(t)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full border bg-gray-100 overflow-hidden relative shrink-0">{t.customerImageUrl && <Image src={t.customerImageUrl} alt={t.customerName} fill sizes="40px" className="object-cover" />}</div><p className="font-bold text-xs uppercase tracking-widest">{t.customerName}</p></div>
                <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={cn("h-2.5 w-2.5", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />)}</div>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-3 italic leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}><Label className="text-[8px] uppercase font-bold text-gray-400">Featured</Label><Switch checked={t.isFeatured} onCheckedChange={() => toggleFeatured(t.id, t.isFeatured)} className="scale-75" /></div>
                <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); handleDelete(t.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

