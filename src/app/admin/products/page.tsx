
'use client';

import React, { useState } from 'react';
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
  Tag
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

export default function ProductsPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Stable queries
  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [inventory, setInventory] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleGenerate = async () => {
    if (!productName || !features) return;
    setIsGenerating(true);
    try {
      const result = await adminGenerateProductDescription({
        productName,
        features: features.split(',').map(f => f.trim()),
        tone: 'luxurious'
      });
      setGeneratedDescription(result.description);
    } catch (error) {
      console.error('Failed to generate description', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!db || !productName || !price || !categoryId) return;
    setIsSaving(true);
    
    const productData = {
      name: productName,
      description: generatedDescription,
      features: features.split(',').map(f => f.trim()),
      price: parseFloat(price),
      categoryId: categoryId,
      inventory: parseInt(inventory) || 0,
      status: 'active',
      imageUrl: `https://picsum.photos/seed/${Math.random()}/600/800`,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'products'), productData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Product Created", description: `${productName} added to inventory.` });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'products',
          operation: 'create',
          requestResourceData: productData,
        }));
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const resetForm = () => {
    setProductName('');
    setFeatures('');
    setPrice('');
    setCategoryId('');
    setInventory('');
    setGeneratedDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Inventory Management</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Add and curate your luxury product archive.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-black/90 text-white font-bold h-9 gap-2">
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-headline">New Archive Entry</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Name</Label>
                    <Input 
                      placeholder="e.g. Sculpted Merino Knit" 
                      value={productName} 
                      onChange={(e) => setProductName(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Category Selection</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Link a collection..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Price ($)</Label>
                    <Input type="number" placeholder="890" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Initial Inventory</Label>
                    <Input type="number" placeholder="24" value={inventory} onChange={(e) => setInventory(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Features (comma separated)</Label>
                  <Input placeholder="Raw edges, heavyweight wool, oversized fit" value={features} onChange={(e) => setFeatures(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Description</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !productName}
                      className="h-8 text-[10px] uppercase font-bold tracking-wider gap-2"
                    >
                      {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate via AI
                    </Button>
                  </div>
                  <Textarea 
                    className="h-48 resize-none" 
                    placeholder="Describe your masterpiece..." 
                    value={generatedDescription}
                    onChange={(e) => setGeneratedDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveProduct} 
                  disabled={isSaving || !productName || !price || !categoryId}
                  className="w-full bg-black text-white h-12 font-bold uppercase tracking-[0.2em] text-[10px]"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Commit to Archive
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
              <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Image</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Product</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Collection</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Inventory</TableHead>
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
                return (
                  <TableRow key={product.id} className="hover:bg-[#f6f6f7]/50 transition-colors border-[#e1e3e5] group">
                    <TableCell>
                      <div className="w-12 h-16 bg-gray-100 relative overflow-hidden rounded border border-gray-100">
                        <img src={product.imageUrl || `https://picsum.photos/seed/${product.id}/100/150`} alt={product.name} className="object-cover w-full h-full" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{product.name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-[#8c9196]">{product.status}</span>
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
