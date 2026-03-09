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
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { adminGenerateProductDescription } from '@/ai/flows/admin-generate-product-description';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProductsPage() {
  const db = useFirestore();
  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const { data: products, loading } = useCollection(productsQuery);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
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
    if (!db || !productName || !price) return;
    setIsSaving(true);
    
    const productData = {
      name: productName,
      description: generatedDescription,
      features: features.split(',').map(f => f.trim()),
      price: parseFloat(price),
      category: category || 'Uncategorized',
      inventory: parseInt(inventory) || 0,
      status: 'active',
      imageUrl: `https://picsum.photos/seed/${Math.random()}/600/800`,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'products'), productData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'products',
          operation: 'create',
          requestResourceData: productData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const resetForm = () => {
    setProductName('');
    setFeatures('');
    setPrice('');
    setCategory('');
    setInventory('');
    setGeneratedDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Products</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Add and manage your store inventory.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-black/90 text-white font-bold h-9">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-headline">Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" placeholder="e.g. Sculpted Merino Knit" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" placeholder="e.g. Knitwear" value={category} onChange={(e) => setCategory(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input id="price" type="number" placeholder="890" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inventory">Initial Inventory</Label>
                    <Input id="inventory" type="number" placeholder="24" value={inventory} onChange={(e) => setInventory(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="features">Features (comma separated)</Label>
                  <Input id="features" placeholder="Raw edges, heavyweight wool, oversized fit" value={features} onChange={(e) => setFeatures(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description">Description</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !productName}
                      className="h-8 text-xs gap-2"
                    >
                      {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate with AI
                    </Button>
                  </div>
                  <Textarea 
                    id="description" 
                    className="h-48" 
                    placeholder="Describe your masterpiece..." 
                    value={generatedDescription}
                    onChange={(e) => setGeneratedDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleSaveProduct} 
                  disabled={isSaving || !productName || !price}
                  className="w-full bg-black text-white h-11 font-bold"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#e1e3e5] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 h-9 border-[#babfc3] focus:ring-black" 
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 border-[#babfc3]">
              <Filter className="h-4 w-4 mr-2" /> Filter
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader className="bg-[#f6f6f7]">
            <TableRow className="hover:bg-transparent border-[#e1e3e5]">
              <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Image</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Product</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Inventory</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  No products found. Start by adding one.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product: any) => (
                <TableRow key={product.id} className="hover:bg-[#f6f6f7] transition-colors border-[#e1e3e5]">
                  <TableCell>
                    <div className="w-12 h-16 bg-gray-100 relative overflow-hidden">
                      <img src={product.imageUrl || `https://picsum.photos/seed/${product.id}/100/150`} alt={product.name} className="object-cover w-full h-full" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{product.name}</span>
                      <span className="text-xs text-[#5c5f62]">{product.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{product.status}</span>
                  </TableCell>
                  <TableCell className="text-sm">{product.inventory} in stock</TableCell>
                  <TableCell className="text-sm font-semibold">${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <button className="p-1 hover:bg-[#e1e3e5] rounded transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-[#5c5f62]" />
                    </button>
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
