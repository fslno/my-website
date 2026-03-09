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
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Tag, 
  MoreHorizontal,
  Ruler,
  Image as ImageIcon,
  Search,
  Globe,
  Upload
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function CategoriesPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Stable references for queries
  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const chartsQuery = useMemoFirebase(() => db ? collection(db, 'sizeCharts') : null, [db]);

  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  const { data: sizeCharts, loading: chartsLoading } = useCollection(chartsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sizeChartId, setSizeChartId] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const handleSave = async () => {
    if (!db || !name) return;
    setIsSaving(true);
    
    const categoryData = {
      name,
      description,
      imageUrl: imageUrl || `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/600/400`,
      sizeChartId,
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || description
    };

    addDoc(collection(db, 'categories'), categoryData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Category Created", description: `${name} has been added to your catalog.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'categories',
          operation: 'create',
          requestResourceData: categoryData
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'categories', id)).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `categories/${id}`,
        operation: 'delete'
      }));
    });
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setImageUrl('');
    setSizeChartId('');
    setSeoTitle('');
    setSeoDescription('');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Product Categories</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Organize your archive and manage search engine presence.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-bold h-10 gap-2">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl font-headline">New Category</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-12 px-6 gap-6">
                <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none bg-transparent px-0 pb-3 shadow-none">General</TabsTrigger>
                <TabsTrigger value="seo" className="data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none bg-transparent px-0 pb-3 shadow-none">SEO Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="p-6 space-y-6 m-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Category Name</Label>
                      <Input 
                        placeholder="e.g. Knitwear" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Description</Label>
                      <Textarea 
                        placeholder="Essential sculpted layers..." 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Category Image</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-gray-50 group hover:border-black transition-colors min-h-[120px]">
                        {imageUrl ? (
                          <div className="relative w-full aspect-video rounded overflow-hidden">
                            <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => setImageUrl('')}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                              <Upload className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add Category Visual</span>
                            <Input 
                              placeholder="Paste Image URL" 
                              value={imageUrl} 
                              onChange={(e) => setImageUrl(e.target.value)}
                              className="h-8 text-xs mt-2"
                            />
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Measurement Guide</Label>
                      <Select value={sizeChartId} onValueChange={setSizeChartId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a measurement guide" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeCharts?.map((chart: any) => (
                            <SelectItem key={chart.id} value={chart.id}>
                              {chart.name} ({chart.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="seo" className="p-6 space-y-6 m-0">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Google Search Preview</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-blue-700 text-lg hover:underline cursor-pointer font-medium line-clamp-1">
                      {seoTitle || (name || 'New Category')} | FSLNO
                    </p>
                    <p className="text-green-800 text-sm line-clamp-1">https://fslno.com/collections/{(name || 'category').toLowerCase().replace(/\s+/g, '-')}</p>
                    <p className="text-gray-600 text-sm line-clamp-2">{seoDescription || (description || 'Add a meta description to see how this appears in search results.')}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Meta Title</Label>
                    <Input 
                      placeholder="e.g. Luxury Knitwear Archive | FSLNO" 
                      value={seoTitle} 
                      onChange={(e) => setSeoTitle(e.target.value)} 
                      className="h-11"
                    />
                    <p className="text-[10px] text-gray-400">Optimal length: 50-60 characters. {seoTitle.length}/60</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Meta Description</Label>
                    <Textarea 
                      placeholder="Discover the FSLNO archive of sculpted knitwear..." 
                      value={seoDescription} 
                      onChange={(e) => setSeoDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <p className="text-[10px] text-gray-400">Optimal length: 150-160 characters. {seoDescription.length}/160</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="p-6 pt-0">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !name}
                className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {categoriesLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : categories?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-gray-50/50">
            <Tag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-500">No categories found. Start by adding your first drop.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-gray-500">Image</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SEO Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Size Chart Reference</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category: any) => {
                  const chart = sizeCharts?.find((c: any) => c.id === category.sizeChartId);
                  const isSeoComplete = category.seoTitle && category.seoDescription;
                  
                  return (
                    <TableRow key={category.id} className="hover:bg-gray-50/50 group">
                      <TableCell>
                        <div className="w-12 h-12 bg-gray-100 relative overflow-hidden rounded border">
                          <Image 
                            src={category.imageUrl} 
                            alt={category.name} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{category.name}</span>
                          <span className="text-[10px] text-gray-500 line-clamp-1">{category.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isSeoComplete ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded">
                            <Globe className="h-3 w-3" /> OPTIMIZED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-50 w-fit px-2 py-1 rounded">
                            <Search className="h-3 w-3" /> PENDING
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {chart ? (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-700 bg-gray-100 w-fit px-2 py-1 rounded">
                            <Ruler className="h-3 w-3" />
                            {chart.name}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No chart linked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(category.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}