'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
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
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Sparkles,
  Loader2,
  Tag,
  Trash2,
  X,
  PlusCircle,
  Globe,
  Truck,
  LayoutGrid,
  Layers,
  RefreshCcw,
  Image as ImageIcon,
  Copy,
  Download,
  Upload,
  ArrowUpDown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { adminGenerateProductDescription } from '@/ai/flows/admin-generate-product-description';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface Variant {
  size: string;
  stock: number;
  sku: string;
}

export default function ProductsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvImportRef = useRef<HTMLInputElement>(null);

  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [comparedPrice, setComparedPrice] = useState('');
  const [customizationFee, setCustomizationFee] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [sizeFit, setSizeFit] = useState('');
  const [badge, setBadge] = useState('none');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const [variants, setVariants] = useState<Variant[]>([
    { size: 'XS', stock: 0, sku: '' },
    { size: 'S', stock: 0, sku: '' },
    { size: 'M', stock: 0, sku: '' },
    { size: 'L', stock: 0, sku: '' },
    { size: 'XL', stock: 0, sku: '' }
  ]);
  
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoHandle, setSeoHandle] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [shippingClass, setShippingClass] = useState('standard');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [features, setFeatures] = useState('');

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'stock') {
        valA = a.inventory || 0;
        valB = b.inventory || 0;
      }
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchQuery, categoryFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedIds.length} archive entries?`)) return;

    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      batch.delete(doc(db, 'products', id));
    });

    await batch.commit();
    setSelectedIds([]);
    toast({ title: "Archive Updated", description: `${selectedIds.length} entries removed.` });
  };

  const handleBulkDuplicate = async () => {
    if (!db || selectedIds.length === 0) return;
    
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      const source = products?.find(p => p.id === id);
      if (source) {
        const { id: _, ...data } = source;
        const newRef = doc(collection(db, 'products'));
        batch.set(newRef, {
          ...data,
          name: `${data.name} - COPY`,
          sku: `${data.sku}-COPY-${Math.floor(Math.random() * 1000)}`,
          createdAt: serverTimestamp(),
          status: 'draft'
        });
      }
    });

    await batch.commit();
    setSelectedIds([]);
    toast({ title: "Entries Duplicated", description: `${selectedIds.length} copies added to archive.` });
  };

  const handleExportCSV = () => {
    if (!products || products.length === 0) return;
    const headers = ['Name', 'SKU', 'Brand', 'Price', 'Stock', 'Category'];
    const rows = products.map(p => {
      const cat = categories?.find(c => c.id === p.categoryId)?.name || 'Unlinked';
      return [p.name, p.sku || '', p.brand || '', p.price, p.inventory || 0, cat].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FSLNO_Archive_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length <= 1) return;
      const batch = writeBatch(db);
      lines.slice(1).forEach(line => {
        const [name, sku, brand, price, inventory] = line.split(',');
        if (name && price) {
          const newRef = doc(collection(db, 'products'));
          batch.set(newRef, {
            name: name.trim(),
            sku: (sku || '').trim(),
            brand: (brand || '').trim(),
            price: parseFloat(price),
            inventory: parseInt(inventory) || 0,
            status: 'draft',
            createdAt: serverTimestamp()
          });
        }
      });
      await batch.commit();
      toast({ title: "Import Complete", description: "New entries processed into archive." });
    };
    reader.readAsText(file);
  };

  const generateSku = (productName: string) => {
    if (!productName) return '';
    const prefix = 'FSL';
    const namePart = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${namePart}-${randomPart}`;
  };

  useEffect(() => {
    if (name && name.length >= 2 && !sku) {
      setSku(generateSku(name));
    }
  }, [name, sku]);

  useEffect(() => {
    if (sku) {
      setVariants(prev => prev.map(v => ({
        ...v,
        sku: v.sku.startsWith(sku) || !v.sku ? `${sku}-${v.size.toUpperCase().replace(/\s+/g, '')}` : v.sku
      })));
    }
  }, [sku]);

  const totalInventory = useMemo(() => {
    return variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
  }, [variants]);

  const handleUpdateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const updated = [...variants];
    const item = { ...updated[index], [field]: value };
    if (field === 'size' && sku && (item.sku.startsWith(sku) || !item.sku)) {
      item.sku = `${sku}-${String(value).toUpperCase().replace(/\s+/g, '')}`;
    }
    updated[index] = item;
    setVariants(updated);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const newMediaPromises = fileArray.map(file => {
      return new Promise<MediaItem>((resolve) => {
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        const reader = new FileReader();
        reader.onloadend = () => resolve({ url: reader.result as string, type });
        reader.readAsDataURL(file);
      });
    });
    try {
      const results = await Promise.all(newMediaPromises);
      setMedia(prev => [...prev, ...results]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Error", description: "Failed to process files." });
    }
  };

  const handleGenerate = async () => {
    if (!name || !features) return;
    setIsGenerating(true);
    try {
      const result = await adminGenerateProductDescription({
        productName: name,
        features: features.split(',').map(f => f.trim()),
        tone: 'luxurious'
      });
      setDescription(result.description);
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate description." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!db || !name || !price || !categoryId) return;
    setIsSaving(true);
    const productData = {
      name,
      description,
      price: parseFloat(price),
      comparedPrice: comparedPrice ? parseFloat(comparedPrice) : null,
      customizationFee: customizationFee ? parseFloat(customizationFee) : 0,
      brand,
      sku,
      sizeFit,
      badge,
      categoryId,
      inventory: totalInventory,
      variants,
      media,
      features: features.split(',').map(f => f.trim()),
      seo: {
        title: seoTitle || name,
        description: seoDescription || description,
        handle: seoHandle || name.toLowerCase().replace(/\s+/g, '-')
      },
      logistics: {
        weight: parseFloat(weight) || 0,
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
        shippingClass
      },
      status: 'active',
      createdAt: serverTimestamp(),
    };
    addDoc(collection(db, 'products'), productData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Product Created", description: `${name} has been committed to the archive.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'products',
          operation: 'create',
          requestResourceData: productData,
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const resetForm = () => {
    setName(''); setPrice(''); setComparedPrice(''); setCustomizationFee(''); setBrand(''); setSku(''); setSizeFit(''); setBadge('none'); setDescription(''); setCategoryId('');
    setVariants([{ size: 'XS', stock: 0, sku: '' }, { size: 'S', stock: 0, sku: '' }, { size: 'M', stock: 0, sku: '' }, { size: 'L', stock: 0, sku: '' }, { size: 'XL', stock: 0, sku: '' }]);
    setMedia([]); setFeatures(''); setSeoTitle(''); setSeoDescription(''); setSeoHandle(''); setWeight(''); setLength(''); setWidth(''); setHeight(''); setActiveTab('general');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Archive Inventory</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Manage and curate your high-fidelity product catalog.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-black/90 text-white font-bold h-10 gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none bg-white flex flex-col p-0 border-none">
            <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-xl font-headline font-bold">New Archive Entry</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b bg-gray-50/50 shrink-0">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  {[
                    { id: 'general', label: '01. General & Media', icon: LayoutGrid },
                    { id: 'inventory', label: '02. Inventory & Sizes', icon: Layers },
                    { id: 'seo', label: '03. SEO Settings', icon: Globe },
                    { id: 'logistics', label: '04. Logistics', icon: Truck },
                  ].map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none shadow-none px-0 h-full gap-2 font-bold uppercase tracking-widest text-[10px]">
                      <tab.icon className="h-4 w-4" /> {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="general" className="p-8 m-0 space-y-12 max-w-5xl mx-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.map((item, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 border rounded-lg overflow-hidden group">
                        {item.type === 'video' ? <video src={item.url} className="absolute inset-0 w-full h-full object-cover" muted loop /> : <Image src={item.url} alt={`Media ${index}`} fill className="object-cover" />}
                        <button onClick={() => setMedia(media.filter((_, i) => i !== index))} className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <PlusCircle className="h-5 w-5 text-gray-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add Media</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleMediaUpload} />
                  </div>
                  <section className="space-y-8 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Name</Label><Input placeholder="e.g. Sculpted Merino Knit" value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Brand Attribution</Label><Input placeholder="e.g. FSLNO Studio" value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Sale Price ($)</Label><Input type="number" placeholder="890" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Compared Price ($)</Label><Input type="number" placeholder="1200" value={comparedPrice} onChange={(e) => setComparedPrice(e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Collection / Category</Label>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Link to a collection..." /></SelectTrigger>
                            <SelectContent>{categories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Narrative</Label><Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating || !name} className="h-8 gap-2 uppercase tracking-widest font-bold text-[10px]">{isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Generate</Button></div>
                        <Textarea className="h-32 resize-none" placeholder="Craft a story..." value={description} onChange={(e) => setDescription(e.target.value)} />
                      </div>
                    </div>
                  </section>
                </TabsContent>
                <TabsContent value="inventory" className="p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="bg-black text-white p-6 rounded-xl flex justify-between items-center">
                    <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Available Units</p><p className="text-3xl font-bold font-headline">{totalInventory} PCS</p></div>
                    <div className="text-right"><Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Universal SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} className="bg-white/10 border-white/20 text-white font-mono mt-1" /></div>
                  </div>
                  <div className="grid gap-4">
                    {variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 border rounded-xl bg-white shadow-sm">
                        <div className="w-20"><Label className="text-[9px] uppercase font-bold text-gray-400">Size</Label><Input value={v.size} onChange={(e) => handleUpdateVariant(i, 'size', e.target.value)} className="h-9" /></div>
                        <div className="flex-1"><Label className="text-[9px] uppercase font-bold text-gray-400">Variant SKU</Label><Input value={v.sku} onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value)} className="h-9 font-mono text-xs" /></div>
                        <div className="w-32"><Label className="text-[9px] uppercase font-bold text-gray-400">Units in Stock</Label><Input type="number" value={v.stock} onChange={(e) => handleUpdateVariant(i, 'stock', parseInt(e.target.value) || 0)} className="h-9" /></div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="seo" className="p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="space-y-6">
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Custom SEO Title</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Meta Description</Label><Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">URL Handle</Label><div className="flex items-center gap-2 border rounded-md px-3 bg-gray-50"><span className="text-xs text-gray-400">fslno.com/products/</span><Input value={seoHandle} onChange={(e) => setSeoHandle(e.target.value)} className="border-none bg-transparent shadow-none px-0" /></div></div>
                  </div>
                </TabsContent>
                <TabsContent value="logistics" className="p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Weight (kg)</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Shipping Class</Label><Select value={shippingClass} onValueChange={setShippingClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="standard">Standard Dispatch</SelectItem><SelectItem value="heavy">Heavy Goods</SelectItem><SelectItem value="fragile">White Glove Service</SelectItem></SelectContent></Select></div>
                  </div>
                </TabsContent>
              </div>
              <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0 flex flex-row items-center justify-between">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                <Button onClick={handleSaveProduct} disabled={isSaving || !name || !price || !categoryId} className="h-11 px-10 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px]">{isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Commit to Archive</Button>
              </DialogFooter>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={selectedIds.length === 0} onClick={handleBulkDuplicate} className="h-9 border-[#babfc3] text-[10px] font-bold uppercase tracking-widest gap-2"><Copy className="h-3.5 w-3.5" /> Duplicate {selectedIds.length > 0 && `(${selectedIds.length})`}</Button>
              <Button variant="outline" size="sm" disabled={selectedIds.length === 0} className="h-9 border-[#babfc3] text-[10px] font-bold uppercase tracking-widest gap-2"><RefreshCcw className="h-3.5 w-3.5" /> Bulk Edit</Button>
              <Button variant="destructive" size="sm" disabled={selectedIds.length === 0} onClick={handleBulkDelete} className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2"><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" ref={csvImportRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
              <Button variant="ghost" size="sm" onClick={() => csvImportRef.current?.click()} className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2"><Upload className="h-3.5 w-3.5" /> CSV Import</Button>
              <Button variant="ghost" size="sm" onClick={handleExportCSV} className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2"><Download className="h-3.5 w-3.5" /> CSV Export</Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
              <Input placeholder="Search archive by name or SKU..." className="pl-10 h-9 border-[#babfc3] focus:ring-black" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}><SelectTrigger className="h-9 w-[140px] text-[10px] font-bold uppercase tracking-widest"><ArrowUpDown className="h-3 w-3 mr-2" /> {sortBy}</SelectTrigger><SelectContent><SelectItem value="name" className="text-[10px] uppercase font-bold">Name</SelectItem><SelectItem value="price" className="text-[10px] uppercase font-bold">Price</SelectItem><SelectItem value="stock" className="text-[10px] uppercase font-bold">Stock</SelectItem></SelectContent></Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="h-9 w-[160px] text-[10px] font-bold uppercase tracking-widest"><Filter className="h-3 w-3 mr-2" /> {categoryFilter === 'all' ? 'All Collections' : categories?.find(c => c.id === categoryFilter)?.name}</SelectTrigger><SelectContent><SelectItem value="all" className="text-[10px] uppercase font-bold">All Collections</SelectItem>{categories?.map(c => (<SelectItem key={c.id} value={c.id} className="text-[10px] uppercase font-bold">{c.name}</SelectItem>))}</SelectContent></Select>
              <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="h-9 w-9 border-[#babfc3]"><ArrowUpDown className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="hover:bg-transparent border-[#e1e3e5]">
              <TableHead className="w-[40px] px-4"><Checkbox checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} onCheckedChange={handleSelectAll} /></TableHead>
              <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Preview</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Product</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Collection</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Total Stock</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsLoading || categoriesLoading ? (<TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>) : filteredProducts.length === 0 ? (<TableRow><TableCell colSpan={7} className="text-center py-20 text-gray-400">No archive entries match your criteria.</TableCell></TableRow>) : (filteredProducts.map((product: any) => {
              const category = categories?.find((c: any) => c.id === product.categoryId);
              const firstMedia = product.media?.[0]?.url;
              const isSelected = selectedIds.includes(product.id);
              return (
                <TableRow key={product.id} className={`transition-colors border-[#e1e3e5] group ${isSelected ? 'bg-blue-50/30' : 'hover:bg-[#f6f6f7]/50'}`}>
                  <TableCell className="px-4"><Checkbox checked={isSelected} onCheckedChange={() => handleToggleSelect(product.id)} /></TableCell>
                  <TableCell><div className="w-12 h-16 bg-gray-100 relative overflow-hidden rounded border border-gray-100 flex items-center justify-center">{firstMedia ? <img src={firstMedia} alt={product.name} className="object-cover w-full h-full" /> : <ImageIcon className="h-4 w-4 text-gray-300" />}</div></TableCell>
                  <TableCell><div className="flex flex-col"><span className="font-bold text-sm">{product.name}</span><span className="text-[10px] uppercase tracking-widest text-[#8c9196]">{product.sku || 'No SKU'}</span></div></TableCell>
                  <TableCell><div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500"><Tag className="h-3 w-3" /> {category?.name || 'Unlinked'}</div></TableCell>
                  <TableCell className="text-sm font-bold">{product.inventory || 0} PCS</TableCell>
                  <TableCell className="text-sm font-semibold">${Number(product.price).toFixed(2)}</TableCell>
                  <TableCell><button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4 text-[#5c5f62]" /></button></TableCell>
                </TableRow>
              );
            }))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
