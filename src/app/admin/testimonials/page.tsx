
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
  MessageSquare, 
  Star,
  Save,
  Image as ImageIcon,
  X,
  Upload,
  UserCheck,
  LayoutGrid
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function AdminTestimonialsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = useMemo(() => {
    return user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [user]);

  // Zero-Error Listing Protocol: Use a simple query to ensure high-fidelity data ingestion.
  const testimonialsQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')) : null, 
    [db, isAdmin]
  );

  const { data: testimonials, isLoading } = useCollection(testimonialsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [quote, setQuote] = useState('');
  const [customerImageUrl, setCustomerImageUrl] = useState('');
  const [rating, setRating] = useState('5');
  const [isFeatured, setIsFeatured] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomerImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!db || !customerName || !quote) return;
    setIsSaving(true);
    
    const payload = {
      customerName: customerName.toUpperCase(),
      quote,
      customerImageUrl,
      rating: Number(rating),
      isFeatured,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      updateDoc(doc(db, 'testimonials', editingId), payload)
        .then(() => {
          setIsDialogOpen(false);
          resetForm();
          toast({ title: "Updated", description: "Testimonial manifest synchronized." });
        })
        .finally(() => setIsSaving(false));
    } else {
      addDoc(collection(db, 'testimonials'), { ...payload, createdAt: serverTimestamp() })
        .then(() => {
          setIsDialogOpen(false);
          resetForm();
          toast({ title: "Created", description: "New testimonial ingested." });
        })
        .finally(() => setIsSaving(false));
    }
  };

  const handleDelete = (id: string) => {
    if (!db || !confirm("Authoritatively delete this testimonial?")) return;
    deleteDoc(doc(db, 'testimonials', id)).then(() => {
      toast({ title: "Deleted", description: "Entry removed from archive." });
    });
  };

  const toggleFeatured = (id: string, current: boolean) => {
    if (!db) return;
    updateDoc(doc(db, 'testimonials', id), { isFeatured: !current });
  };

  const resetForm = () => {
    setCustomerName('');
    setQuote('');
    setCustomerImageUrl('');
    setRating('5');
    setIsFeatured(true);
    setEditingId(null);
  };

  const openEdit = (t: any) => {
    setCustomerName(t.customerName || '');
    setQuote(t.quote || '');
    setCustomerImageUrl(t.customerImageUrl || '');
    setRating(String(t.rating || '5'));
    setIsFeatured(t.isFeatured ?? true);
    setEditingId(t.id);
    setIsDialogOpen(true);
  };

  if (!isAdmin) return <div className="p-8">Access Denied.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Participant Testimonials</h1>
          <p className="text-[#5c5f62] mt-1 text-sm uppercase tracking-tight">Manage social proof and featured archival feedback.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-bold h-10 gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
            <DialogHeader className="pt-6">
              <DialogTitle className="text-xl font-headline font-bold uppercase tracking-tight">Testimonial Protocol</DialogTitle>
              <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Ingest new verified feedback into the studio manifest.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Participant Name</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. JAMES ARCHIVE" className="h-12 uppercase font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Testimonial Quote</Label>
                <Textarea value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="The fit was absolute precision..." className="min-h-[100px] resize-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Rating</Label>
                  <Input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="h-12" />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-500">Featured</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                    <span className="text-[9px] font-bold uppercase">{isFeatured ? 'Home Page' : 'Draft'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-gray-500">Avatar Visual</Label>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-none p-4 h-24 flex flex-col items-center justify-center gap-2 bg-gray-50 cursor-pointer hover:border-black transition-all"
                >
                  {customerImageUrl ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                      <Image src={customerImageUrl} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <><Upload className="h-5 w-5 text-gray-400" /><span className="text-[9px] font-bold uppercase text-gray-400">Ingest Avatar</span></>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isSaving || !customerName || !quote} className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px]">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {editingId ? 'Update Entry' : 'Ingest Entry'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-widest p-6">Avatar</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Participant</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Quote</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Rating</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Featured</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
            ) : !testimonials || testimonials.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-[10px] font-bold uppercase tracking-widest text-gray-400">No testimonials cataloged.</TableCell></TableRow>
            ) : (
              testimonials.map((t) => (
                <TableRow key={t.id} className="hover:bg-gray-50/30 group border-b last:border-0 cursor-pointer" onClick={() => openEdit(t)}>
                  <TableCell className="p-6">
                    <div className="w-10 h-10 rounded-full border bg-gray-100 overflow-hidden relative shrink-0">
                      {t.customerImageUrl ? <Image src={t.customerImageUrl} alt={t.customerName} fill className="object-cover" /> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-xs uppercase tracking-widest">{t.customerName}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-[11px] text-gray-500 line-clamp-2 italic">"{t.quote}"</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-3 w-3", s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={t.isFeatured} onCheckedChange={() => toggleFeatured(t.id, t.isFeatured)} />
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>
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
