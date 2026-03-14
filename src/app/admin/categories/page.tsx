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
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Tag, 
  Image as ImageIcon,
  Upload,
  X,
  LayoutGrid,
  ShoppingBag,
  Save,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Globe
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function CategoriesPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = useMemo(() => {
    return user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [user]);

  const categoriesQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'categories'), orderBy('order', 'asc')) : null, 
    [db, isAdmin]
  );

  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sizeChartId, setSizeChartId] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Fetch products assigned to this category
  const assignedProductsQuery = useMemoFirebase(() => 
    db && editingId ? query(collection(db, 'products'), where('categoryId', '==', editingId)) : null, 
    [db, editingId]
  );
  const { data: assignedProducts, isLoading: productsLoading } = useCollection(assignedProductsQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!db || !categories) return;
    setIsSaving(true);
    
    // Authoritatively restricted to only restore "Kid's" per directive
    const defaults = [
      { name: "Kid's", description: 'Archival pieces for the younger generation.', order: 0 }
    ];

    const batch = writeBatch(db);
    let addedCount = 0;

    defaults.forEach(def => {
      const exists = categories.some(c => c.name.toLowerCase() === def.name.toLowerCase());
      if (!exists) {
        const newRef = doc(collection(db, 'categories'));
        batch.set(newRef, {
          ...def,
          imageUrl: '',
          seoTitle: def.name,
          seoDescription: def.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        addedCount++;
      }
    });

    if (addedCount === 0) {
      toast({ title: "Up to Date", description: "Default category already exists." });
      setIsSaving(false);
      return;
    }

    await batch.commit()
      .then(() => toast({ title: "Restored", description: `${addedCount} category manifested.` }))
      .catch(() => toast({ variant: "destructive", title: "Error", description: "Restore protocol failed." }))
      .finally(() => setIsSaving(false));
  };

  const handleSave = async () => {
    if (!db || !name) return;
    setIsSaving(true);
    const categoryData: any = {
      name, 
      description, 
      imageUrl: imageUrl || '', 
      sizeChartId,
      seoTitle: seoTitle || name, 
      seoDescription: seoDescription || description,
      updatedAt: new Date().toISOString()
    };
    
    if (editingId) {
      updateDoc(doc(db, 'categories', editingId), categoryData)
        .then(() => { 
          toast({ title: "Updated", description: "Category updated." }); 
        })
        .catch((error) => { 
          errorEmitter.emit('permission-error', new FirestorePermissionError({ 
            path: `categories/${editingId}`, 
            operation: 'update', 
            requestResourceData: categoryData 
          })); 
        })
        .finally(() => setIsSaving(false));
    } else {
      const nextOrder = categories && categories.length > 0 ? Math.max(...categories.map(c => c.order || 0)) + 1 : 0;
      const newData = { ...categoryData, order: nextOrder, createdAt: new Date().toISOString() };
      addDoc(collection(db, 'categories'), newData)
        .then((docRef) => { 
          setEditingId(docRef.id);
          toast({ title: "Created", description: "Category created." }); 
        })
        .catch((error) => { 
          errorEmitter.emit('permission-error', new FirestorePermissionError({ 
            path: 'categories', 
            operation: 'create', 
            requestResourceData: newData 
          })); 
        })
        .finally(() => setIsSaving(false));
    }
  };

  const handleMoveOrder = async (id: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db || !categories) return;
    const index = categories.findIndex(c => c.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;
    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    const current = categories[index];
    const other = categories[otherIndex];
    const batch = writeBatch(db);
    batch.update(doc(db, 'categories', current.id), { order: other.order ?? otherIndex });
    batch.update(doc(db, 'categories', other.id), { order: current.order ?? index });
    await batch.commit().then(() => { toast({ title: "Saved", description: "Order updated." }); });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db || !confirm("Delete category?")) return;
    deleteDoc(doc(db, 'categories', id)).then(() => { toast({ title: "Deleted", description: "Category removed." }); });
  };

  const resetForm = () => { 
    setName(''); 
    setDescription(''); 
    setImageUrl(''); 
    setSizeChartId(''); 
    setSeoTitle(''); 
    setSeoDescription(''); 
    setEditingId(null); 
    setActiveTab('general'); 
  };

  const openEdit = (category: any) => {
    setName(category.name || ''); 
    setDescription(category.description || ''); 
    setImageUrl(category.imageUrl || '');
    setSizeChartId(category.sizeChartId || ''); 
    setSeoTitle(category.seoTitle || ''); 
    setSeoDescription(category.seoDescription || '');
    setEditingId(category.id); 
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Categories</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Group products and manage SEO.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleRestoreDefaults} 
            disabled={isSaving}
            className="h-10 border-black font-bold uppercase tracking-widest text-[10px] bg-white gap-2 flex-1 sm:flex-none"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Restore Defaults
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none bg-black text-white font-bold h-10 gap-2 uppercase tracking-widest text-[10px]">
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none bg-white flex flex-col p-0 border-none">
              <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex flex-row items-center justify-between">
                <DialogTitle className="text-lg sm:text-xl font-headline font-bold uppercase tracking-tight">
                  {editingId ? `Edit: ${name}` : 'New Category'}
                </DialogTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </DialogHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 sm:px-6 border-b bg-gray-50/50 shrink-0">
                  <TabsList className="bg-transparent h-auto p-1 flex flex-wrap gap-2 sm:gap-8 justify-start">
                    {[
                      { id: 'general', label: '01. Info', icon: LayoutGrid }, 
                      { id: 'seo', label: '02. SEO', icon: Globe },
                      { id: 'products', label: '03. Products', icon: ShoppingBag }
                    ].map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id} className="flex-grow sm:flex-grow-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none shadow-none px-0 h-12 gap-2 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                        <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="general" className="p-4 sm:p-8 m-0 space-y-8 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-500">Name</Label>
                          <Input placeholder="e.g. Outerwear" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase font-bold text-gray-500">Description</Label>
                          <Textarea placeholder="..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Visual</Label>
                        <div 
                          onClick={() => !imageUrl && fileInputRef.current?.click()} 
                          className="border-2 border-dashed rounded-none p-6 flex flex-col items-center justify-center gap-4 bg-gray-50 min-h-[250px] cursor-pointer hover:border-black transition-all relative"
                        >
                          {imageUrl ? (
                            <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden border">
                              <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); setImageUrl(''); }} 
                                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-gray-400" />
                              <p className="text-[10px] font-bold uppercase text-gray-500">Upload</p>
                            </>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="seo" className="p-4 sm:p-8 m-0 space-y-8 max-w-5xl mx-auto">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">SEO Title</Label>
                        <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={name} className="h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">SEO Description</Label>
                        <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder={description} className="min-h-[120px]" />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="products" className="p-4 sm:p-8 m-0 space-y-8 max-w-5xl mx-auto">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Assigned Inventory</h3>
                        <Badge variant="outline" className="bg-black text-white text-[9px] font-bold px-2 py-0.5 border-none">
                          {assignedProducts?.length || 0} ITEMS
                        </Badge>
                      </div>
                      <div className="border rounded-none overflow-hidden bg-white shadow-sm">
                        <Table>
                          <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-black/5">
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest">Product</TableHead>
                              <TableHead className="text-[10px] font-bold uppercase tracking-widest">SKU</TableHead>
                              <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productsLoading ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-10">
                                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-300" />
                                </TableCell>
                              </TableRow>
                            ) : !assignedProducts || assignedProducts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-10 text-[9px] font-bold text-gray-400 uppercase">
                                  No products assigned.
                                </TableCell>
                              </TableRow>
                            ) : assignedProducts.map((p: any) => (
                              <TableRow key={p.id} className="border-black/5">
                                <TableCell className="text-xs font-bold uppercase">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 relative border overflow-hidden shrink-0 rounded-sm">
                                      {p.media?.[0]?.url ? (
                                        <Image src={p.media[0].url} alt="" fill className="object-cover" />
                                      ) : (
                                        <ShoppingBag className="h-4 w-4 text-gray-300 mx-auto mt-3" />
                                      )}
                                    </div>
                                    <span className="truncate max-w-[200px]">{p.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-[10px] font-mono text-gray-400 uppercase">{p.sku || 'N/A'}</TableCell>
                                <TableCell className="text-right text-xs font-bold">C${p.price?.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
              <DialogFooter className="p-4 sm:p-6 border-t bg-gray-50/50 shrink-0">
                <Button onClick={handleSave} disabled={isSaving || !name} className="w-full bg-black text-white h-12 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {editingId ? 'Save Changes' : 'Add Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-black/5">
                <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-gray-500">Visual</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SEO</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Order</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                  </TableCell>
                </TableRow>
              ) : categories?.map((category: any, idx: number) => (
                <TableRow key={category.id} className="hover:bg-gray-50/50 cursor-pointer border-black/5 group" onClick={() => openEdit(category)}>
                  <TableCell>
                    <div className="w-14 h-14 bg-gray-100 relative overflow-hidden border shadow-sm">
                      {category.imageUrl ? <Image src={category.imageUrl} alt={category.name} fill className="object-cover" /> : <ImageIcon className="h-6 w-6 text-gray-300 mx-auto mt-4" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase">{category.name}</span>
                      <span className="text-[10px] text-gray-500 line-clamp-1 uppercase">{category.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[9px] font-bold uppercase border-none", category.seoTitle ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                      {category.seoTitle ? 'OPTIMIZED' : 'PENDING'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={e => handleMoveOrder(category.id, 'up', e)} disabled={idx === 0}>
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-[10px] font-mono font-bold w-6 text-center">{idx + 1}</span>
                      <Button variant="ghost" size="icon" onClick={e => handleMoveOrder(category.id, 'down', e)} disabled={idx === (categories?.length || 0) - 1}>
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={e => handleDelete(category.id, e)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="lg:hidden divide-y">
          {categoriesLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : categories?.map((category: any, idx: number) => (
            <div key={category.id} onClick={() => openEdit(category)} className="p-4 bg-white space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-gray-100 relative border overflow-hidden shrink-0">
                    {category.imageUrl ? <Image src={category.imageUrl} alt={category.name} fill className="object-cover" /> : <ImageIcon className="h-5 w-5 text-gray-200 mx-auto mt-5" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm uppercase tracking-tight">{category.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase line-clamp-1">{category.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[8px] font-bold uppercase border-none h-4 px-1.5", category.seoTitle ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                  {category.seoTitle ? 'OK' : '...'}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 border" onClick={e => handleMoveOrder(category.id, 'up', e)} disabled={idx === 0}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <span className="text-[10px] font-mono font-bold w-4 text-center">{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 border" onClick={e => handleMoveOrder(category.id, 'down', e)} disabled={idx === (categories?.length || 0) - 1}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={e => handleDelete(category.id, e)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
