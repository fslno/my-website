
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

export default function ProductsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Products</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Add and manage your store inventory.</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-black/90 text-white font-bold h-9">
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-headline">Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" placeholder="e.g. Sculpted Merino Knit" value={productName} onChange={(e) => setProductName(e.target.value)} />
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
                <Button className="w-full bg-black text-white h-11 font-bold">Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-lg">
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
            <Button variant="outline" size="sm" className="h-9 border-[#babfc3]">
              Sort By
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
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i} className="hover:bg-[#f6f6f7] transition-colors border-[#e1e3e5]">
                <TableCell>
                  <div className="w-12 h-16 bg-gray-100 relative overflow-hidden">
                    <img src={`https://picsum.photos/seed/lux${i}/100/150`} alt="Product" className="object-cover" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Oversized Raw Trench</span>
                    <span className="text-xs text-[#5c5f62]">Outerwear</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                </TableCell>
                <TableCell className="text-sm">24 in stock</TableCell>
                <TableCell className="text-sm font-semibold">$890.00</TableCell>
                <TableCell>
                  <button className="p-1 hover:bg-[#e1e3e5] rounded transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-[#5c5f62]" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
