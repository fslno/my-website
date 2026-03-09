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
  ChevronRight,
  ChevronLeft,
  Layers,
  Box,
  GripVertical,
  RefreshCcw,
  Image as ImageIcon,
  Play
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
import { adminGenerateProductDescription } from '@/ai/flows/admin-generate-product-description';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

  // Stable queries
  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Product Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [comparedPrice, setComparedPrice] = useState('');
  const [customizationFee, setCustomizationFee] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [sizeFit, setSizeFit] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // Variants State
  const [variants, setVariants] = useState<Variant[]>([{ size: 'M', stock: 0, sku: '' }]);
  
  // SEO State
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoHandle, setSeoHandle] = useState('');

  // Logistics State
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [shippingClass, setShippingClass] = useState('standard');

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [features, setFeatures] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Auto-generate Root SKU
  const handleAutoGenerateSku = () => {
    if (!name) return;
    const prefix = 'FSL';
    const namePart = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const generated = `${prefix}-${namePart}-${randomPart}`;
    setSku(generated);
  };

  // Sync Variant SKUs when Root SKU changes
  useEffect(() => {
    if (sku) {
      setVariants(prev => prev.map(v => ({
        ...v,
        sku: v.sku.startsWith(sku) || !v.sku ? `${sku}-${v.size.toUpperCase().replace(/\s+/g, '')}` : v.sku
      })));
    }
  }, [sku]);

  // Real-time Inventory Calculation
  const totalInventory = useMemo(() => {
    return variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
  }, [variants]);

  const handleAddVariant = () => {
    const newSize = 'NEW';
    const newVariantSku = sku ? `${sku}-${newSize}` : '';
    setVariants([...variants, { size: newSize, stock: 0, sku: newVariantSku }]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleUpdateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const updated = [...variants];
    const item = { ...updated[index], [field]: value };
    
    // If size changes, update SKU if it follows the pattern
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
        reader.onloadend = () => {
          resolve({ url: reader.result as string, type });
        };
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

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const onDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const onDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    const newMedia = [...media];
    const draggedItem = newMedia[draggedIndex];
    newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, draggedItem);
    setMedia(newMedia);
    setDraggedIndex(null);
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
    setName('');
    setPrice('');
    setComparedPrice('');
    setCustomizationFee('');
    setBrand('');
    setSku('');
    setSizeFit('');
    setDescription('');
    setCategoryId('');
    setVariants([{ size: 'M', stock: 0, sku: '' }]);
    setMedia([]);
    setFeatures('');
    setSeoTitle('');
    setSeoDescription('');
    setSeoHandle('');
    setWeight('');
    setLength('');
    setWidth('');
    setHeight('');
    setActiveTab('general');
  };

  const tabs = [
    { id: 'general', label: '01. General & Media', icon: LayoutGrid },
    { id: 'inventory', label: '02. Inventory & Sizes', icon: Layers },
    { id: 'seo', label: '03. SEO Settings', icon: Globe },
    { id: 'logistics', label: '04. Logistics', icon: Truck },
  ];

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
                  {tabs.map((tab) => (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id} 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none shadow-none px-0 h-full gap-2 font-bold uppercase tracking-widest text-[10px]"
                    >
                      <tab.icon className="h-4 w-4" /> {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* General Content */}
                <TabsContent value="general" className="p-8 m-0 space-y-12 max-w-5xl mx-auto">
                  <section className="space-y-6">
                    <div>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Visual Content</h3>
                      <p className="text-xs text-gray-500">Upload multiple images or videos for the product gallery. Hold and drag to reorder.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {media.map((item, index) => (
                        <div 
                          key={index} 
                          draggable
                          onDragStart={() => onDragStart(index)}
                          onDragOver={(e) => onDragOver(e, index)}
                          onDrop={() => onDrop(index)}
                          className={`relative aspect-square bg-gray-100 border rounded-lg overflow-hidden group cursor-move transition-opacity ${draggedIndex === index ? 'opacity-40' : 'opacity-100'}`}
                        >
                          {item.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                              <Play className="h-8 w-8 text-white opacity-50" />
                              <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-60" muted loop />
                            </div>
                          ) : (
                            <Image src={item.url} alt={`Media ${index}`} fill className="object-cover" />
                          )}
                          <div className="absolute top-2 left-2 p-1 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-3 w-3 text-white" />
                          </div>
                          <button 
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                          <PlusCircle className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add Media</span>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple
                        accept="image/*,video/*" 
                        onChange={handleMediaUpload} 
                      />
                    </div>
                  </section>

                  <section className="space-y-8 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Name</Label>
                          <Input placeholder="e.g. Sculpted Merino Knit" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Brand Attribution</Label>
                          <Input placeholder="e.g. FSLNO Studio" value={brand} onChange={(e) => setBrand(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Sale Price ($)</Label>
                          <Input type="number" placeholder="890" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Compared Price ($)</Label>
                          <Input type="number" placeholder="1200" value={comparedPrice} onChange={(e) => setComparedPrice(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Customization Fee ($)</Label>
                          <Input type="number" placeholder="0.00" value={customizationFee} onChange={(e) => setCustomizationFee(e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Root SKU</Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleAutoGenerateSku}
                              className="h-6 px-2 text-[8px] uppercase font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <RefreshCcw className="h-3 w-3 mr-1" /> Auto-Generate
                            </Button>
                          </div>
                          <Input placeholder="e.g. FSL-MN-001" value={sku} onChange={(e) => setSku(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Collection / Category</Label>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Link to a collection..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Size & Fit Description</Label>
                        <Input placeholder="e.g. Oversized fit, models wears size M" value={sizeFit} onChange={(e) => setSizeFit(e.target.value)} />
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Narrative</Label>
                          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating || !name} className="h-8 gap-2 uppercase tracking-widest font-bold text-[10px]">
                            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Generate
                          </Button>
                        </div>
                        <Textarea className="h-32 resize-none" placeholder="Craft a story..." value={description} onChange={(e) => setDescription(e.target.value)} />
                      </div>
                    </div>
                  </section>
                </TabsContent>

                {/* Inventory & Variants Content */}
                <TabsContent value="inventory" className="p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-foreground">Sizing & Availability</h3>
                      <p className="text-xs text-gray-500 mt-1">Manage individual stock and unique SKUs for each size variant.</p>
                    </div>
                    <div className="bg-black text-white px-4 py-2 rounded flex items-center gap-4">
                      <Box className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-[0.2em] font-bold opacity-70">Total Stock</span>
                        <span className="text-sm font-bold">{totalInventory} PCS</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest">Size Label</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest">Variant SKU</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest">Available Units</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((v, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <Input 
                                value={v.size} 
                                onChange={(e) => handleUpdateVariant(i, 'size', e.target.value)}
                                className="h-9 font-bold text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                value={v.sku} 
                                onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value)}
                                className="h-9 font-mono text-[10px]"
                                placeholder="Auto-generated SKU"
                              />
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number"
                                value={v.stock} 
                                onChange={(e) => handleUpdateVariant(i, 'stock', e.target.value)}
                                className="h-9 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveVariant(i)}
                                disabled={variants.length <= 1}
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="p-4 bg-gray-50/50 border-t">
                      <Button variant="outline" onClick={handleAddVariant} className="w-full gap-2 border-dashed h-11 uppercase tracking-widest font-bold text-[10px]">
                        <Plus className="h-4 w-4" /> Add Size Variant
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* SEO Content */}
                <TabsContent value="seo" className="p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-blue-600 mb-4 flex items-center gap-2">
                      <Globe className="h-3 w-3" /> Search Results Preview
                    </h4>
                    <div className="space-y-1">
                      <p className="text-blue-700 text-lg hover:underline cursor-pointer font-medium line-clamp-1">
                        {seoTitle || (name || 'New Product Title')} | FSLNO
                      </p>
                      <p className="text-green-800 text-sm line-clamp-1">https://fslno.com/products/{seoHandle || (name || 'product').toLowerCase().replace(/\s+/g, '-')}</p>
                      <p className="text-gray-600 text-sm line-clamp-2">{seoDescription || (description || 'Meta description will appear here...')}</p>
                    </div>
                  </div>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Meta Title</Label>
                      <Input placeholder="Luxury Merino Knit | FSLNO" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">URL Handle / Slug</Label>
                      <Input placeholder="sculpted-merino-knit" value={seoHandle} onChange={(e) => setSeoHandle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Meta Description</Label>
                      <Textarea className="h-24" placeholder="Discover the sculpted Merino Knit..." value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                {/* Logistics Content */}
                <TabsContent value="logistics" className="p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-foreground mb-1">Physical Attributes</h3>
                        <p className="text-xs text-gray-500">Define weight and dimensions for real-time rates.</p>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Weight (kg)</Label>
                          <Input type="number" placeholder="1.2" value={weight} onChange={(e) => setWeight(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Length (cm)</Label>
                            <Input type="number" placeholder="40" value={length} onChange={(e) => setLength(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Width (cm)</Label>
                            <Input type="number" placeholder="30" value={width} onChange={(e) => setWidth(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Height (cm)</Label>
                            <Input type="number" placeholder="10" value={height} onChange={(e) => setHeight(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-foreground mb-1">Fulfillment Logic</h3>
                        <p className="text-xs text-gray-500">Assign shipping rules and classes.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Shipping Class</Label>
                        <Select value={shippingClass} onValueChange={setShippingClass}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Archive</SelectItem>
                            <SelectItem value="heavy">Heavy Items (Outerwear)</SelectItem>
                            <SelectItem value="fragile">Fragile Accessories</SelectItem>
                            <SelectItem value="express">Priority Drop Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0 flex flex-row items-center justify-between">
              <div className="flex gap-2">
                {activeTab !== 'general' && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const idx = tabs.findIndex(t => t.id === activeTab);
                      setActiveTab(tabs[idx-1].id);
                    }}
                    className="gap-2 h-11 px-6 font-bold uppercase tracking-widest text-[10px]"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                {activeTab !== 'logistics' ? (
                  <Button 
                    onClick={() => {
                      const idx = tabs.findIndex(t => t.id === activeTab);
                      setActiveTab(tabs[idx+1].id);
                    }}
                    className="gap-2 h-11 px-6 bg-black text-white font-bold uppercase tracking-widest text-[10px]"
                  >
                    Next Step <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSaveProduct} 
                    disabled={isSaving || !name || !price || !categoryId}
                    className="h-11 px-10 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px]"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Commit to Archive
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#e1e3e5] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-sm:max-w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input placeholder="Filter archive..." className="pl-10 h-9 border-[#babfc3] focus:ring-black" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 border-[#babfc3] text-xs font-bold uppercase tracking-widest">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="hover:bg-transparent border-[#e1e3e5]">
              <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Preview</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Product</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Collection</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Total Stock</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsLoading || categoriesLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" />
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400">No archive entries found.</TableCell>
              </TableRow>
            ) : (
              products?.map((product: any) => {
                const category = categories?.find((c: any) => c.id === product.categoryId);
                const firstMedia = product.media?.[0]?.url;
                return (
                  <TableRow key={product.id} className="hover:bg-[#f6f6f7]/50 transition-colors border-[#e1e3e5] group">
                    <TableCell>
                      <div className="w-12 h-16 bg-gray-100 relative overflow-hidden rounded border border-gray-100 flex items-center justify-center">
                        {firstMedia ? <img src={firstMedia} alt={product.name} className="object-cover w-full h-full" /> : <ImageIcon className="h-4 w-4 text-gray-300" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{product.name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-[#8c9196]">{product.sku || 'No SKU'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                        <Tag className="h-3 w-3" /> {category?.name || 'Unlinked'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold">{product.inventory || 0} PCS</TableCell>
                    <TableCell className="text-sm font-semibold">${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <button className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4 text-[#5c5f62]" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
