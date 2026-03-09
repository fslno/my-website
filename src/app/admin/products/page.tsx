'use client';

import React, { useState, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  Play,
  X,
  PlusCircle
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
  const [inventory, setInventory] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [features, setFeatures] = useState('');

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedia([...media, { url: reader.result as string, type }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
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
      inventory: parseInt(inventory) || 0,
      media,
      features: features.split(',').map(f => f.trim()),
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
    setInventory('');
    setMedia([]);
    setFeatures('');
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
          <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
            <DialogHeader className="p-6 border-b">
              <DialogTitle className="text-xl font-headline font-bold">New Archive Entry</DialogTitle>
            </DialogHeader>
            
            <div className="p-8 space-y-12">
              {/* Media Section - Comes First */}
              <section className="space-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Visual Content</h3>
                  <p className="text-xs text-gray-500">Upload multiple images or videos for the product gallery.</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {media.map((item, index) => (
                    <div key={index} className="relative aspect-[3/4] bg-gray-100 border rounded-lg overflow-hidden group">
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <Play className="h-8 w-8 text-white opacity-50" />
                          <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-60" muted loop />
                        </div>
                      ) : (
                        <Image src={item.url} alt={`Media ${index}`} fill className="object-cover" />
                      )}
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
                    className="aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors group"
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
                    accept="image/*,video/*" 
                    onChange={handleMediaUpload} 
                  />
                </div>
              </section>

              {/* Product Details Section - "One Topic" */}
              <section className="space-y-8 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Product Specifications</h3>
                  <p className="text-xs text-gray-500">Define the core attributes and narrative of this piece.</p>
                </div>

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
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">SKU Number</Label>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Size & Fit Description</Label>
                      <Input placeholder="e.g. Oversized fit, model is 6'2\" value={sizeFit} onChange={(e) => setSizeFit(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Available Inventory</Label>
                      <Input type="number" placeholder="24" value={inventory} onChange={(e) => setInventory(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Narrative / Description</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !name}
                        className="h-8 text-[10px] uppercase font-bold tracking-wider gap-2 bg-white"
                      >
                        {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        Generate Narrative
                      </Button>
                    </div>
                    <Textarea 
                      className="h-40 resize-none bg-white" 
                      placeholder="Craft a compelling story for this piece..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>

            <DialogFooter className="p-6 border-t bg-gray-50/50">
              <Button 
                onClick={handleSaveProduct} 
                disabled={isSaving || !name || !price || !categoryId}
                className="w-full bg-black text-white h-12 font-bold uppercase tracking-[0.2em] text-[10px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Commit to Archive
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#e1e3e5] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input 
              placeholder="Filter archive..." 
              className="pl-10 h-9 border-[#babfc3] focus:ring-black" 
            />
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
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Stock</TableHead>
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
                <TableCell colSpan={6} className="text-center py-20 text-gray-400">
                  No archive entries found.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product: any) => {
                const category = categories?.find((c: any) => c.id === product.categoryId);
                const firstMedia = product.media?.[0]?.url;
                
                return (
                  <TableRow key={product.id} className="hover:bg-[#f6f6f7]/50 transition-colors border-[#e1e3e5] group">
                    <TableCell>
                      <div className="w-12 h-16 bg-gray-100 relative overflow-hidden rounded border border-gray-100 flex items-center justify-center">
                        {firstMedia ? (
                          <img src={firstMedia} alt={product.name} className="object-cover w-full h-full" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{product.name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-[#8c9196]">{product.brand || 'Unbranded'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                        <Tag className="h-3 w-3" />
                        {category?.name || 'Unlinked'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{product.inventory} PCS</TableCell>
                    <TableCell className="text-sm font-semibold">${product.price.toFixed(2)}</TableCell>
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