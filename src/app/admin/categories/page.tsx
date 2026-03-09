
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
  Plus, 
  Trash2, 
  Loader2, 
  Tag, 
  MoreHorizontal,
  Ruler,
  Image as ImageIcon
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

  const handleSave = async () => {
    if (!db || !name) return;
    setIsSaving(true);
    
    const categoryData = {
      name,
      description,
      imageUrl: imageUrl || `https://picsum.photos/seed/${Math.random()}/600/400`,
      sizeChartId
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
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Product Categories</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Organize your archive and link categories to specific size guides.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-bold h-10 gap-2">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-headline">New Category</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest font-bold text-gray-500">Category Name</Label>
                <Input 
                  placeholder="e.g. Knitwear" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest font-bold text-gray-500">Description</Label>
                <Input 
                  placeholder="Essential sculpted layers..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest font-bold text-gray-500">Image URL</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://..." 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                  />
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest font-bold text-gray-500">Link Size Chart</Label>
                <Select value={sizeChartId} onValueChange={setSizeChartId}>
                  <SelectTrigger>
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
            <DialogFooter>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !name}
                className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-xs"
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
          <div className="bg-white border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-gray-500">Image</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Size Chart Reference</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category: any) => {
                  const chart = sizeCharts?.find((c: any) => c.id === category.sizeChartId);
                  return (
                    <TableRow key={category.id} className="hover:bg-gray-50/50 group">
                      <TableCell>
                        <div className="w-12 h-12 bg-gray-100 relative overflow-hidden rounded">
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
                          <span className="text-xs text-gray-500 line-clamp-1">{category.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {chart ? (
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700 bg-gray-100 w-fit px-2 py-1 rounded">
                            <Ruler className="h-3 w-3" />
                            {chart.name}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No chart linked</span>
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
