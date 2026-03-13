
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
  MoreHorizontal,
  Ruler,
  Image as ImageIcon,
  Search,
  Globe,
  Upload,
  Link as LinkIcon,
  X,
  LayoutGrid,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Save,
  ArrowUp,
  ArrowDown
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

  // Stable references for queries - strictly guarded and sorted by order
  const categoriesQuery = useMemoFirebase(() => 
    db && isAdmin ? query(collection(db, 'categories'), orderBy('order', 'asc')) : null, 
    [db, isAdmin]
  );
  const chartsQuery = useMemoFirebase(() => db && isAdmin ? collection(db, 'sizeCharts') : null, [db, isAdmin]);

  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);
  const { data: sizeCharts } = useCollection(chartsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sizeChartId, setSizeChartId] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Assigned Products Query - strictly guarded
  const assignedProductsQuery = useMemoFirebase(() => {
    if (!db || !editingId || !isAdmin) return null;
    return query(collection(db, 'products'), where('categoryId', '==', editingId));
  }, [db, editingId, isAdmin]);

  const { data: assignedProducts, isLoading: productsLoading } = useCollection(assignedProductsQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
          setIsDialogOpen(false);
          resetForm();
          toast({ title: "Category Updated", description: "All changes have been committed." });
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
      const nextOrder = categories && categories.length > 0 
        ? Math.max(...categories.map(c => c.order || 0)) + 1 
        : 0;
      
      const newData = { 
        ...categoryData, 
        order: nextOrder,
        createdAt: new Date().toISOString() 
      };
      
      addDoc(collection(db, 'categories'), newData)
        .then(() => {
          setIsDialogOpen(false);
          resetForm();
          toast({ title: "Category Created", description: `${name} has been added to your catalog.` });
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
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    const current = categories[index];
    const other = categories[otherIndex];

    const batch = writeBatch(db);
    batch.update(doc(db, 'categories', current.id), { order: other.order ?? otherIndex });
    batch.update(doc(db, 'categories', other.id), { order: current.order ?? index });

    await batch.commit().then(() => {
      toast({ title: "Order Synchronized", description: "Category hierarchy updated." });
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db) return;
    if (!confirm("Authoritatively decommissioning this collection? This will not delete linked products but will remove their collection assignment.")) {
      return;
    }
    deleteDoc(doc(db, 'categories', id))
      .then(() => {
        toast({ title: "Category Deleted", description: "Archival collection removed." });
      })
      .catch((error) => {
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

  const tabs = [
    { id: 'general', label: '01. General & Visuals', icon: LayoutGrid },
    { id: 'seo', label: '02. SEO Settings', icon: Globe },
    { id: 'products', label: '03. Assigned Products', icon: ShoppingBag, hidden: !editingId },
  ];

  const visibleTabs = tabs.filter(t => !t.hidden);

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
          <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none bg-white flex flex-col p-0 border-none">
            <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-xl font-headline font-bold">
                {editingId ? `Edit Category: ${name}` : 'New Category Entry'}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 border-b bg-gray-50/50 shrink-0">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  {visibleTabs.map((tab) => (
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
                <TabsContent value="general" className="p-8 m-0 space-y-12 max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Category Name</Label>
                        <Input 
                          placeholder="e.g. Outerwear" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="h-12 bg-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Description</Label>
                        <Textarea 
                          placeholder="Essential architectural layers..." 
                          value={description} 
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-[150px] bg-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Measurement Guide</Label>
                        <Select value={sizeChartId} onValueChange={setSizeChartId}>
                          <SelectTrigger className="h-12 bg-white">
                            <SelectValue placeholder="Link a technical chart..." />
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
                    
                    <div className="space-y-4">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Editorial Cover</Label>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                      <div 
                        onClick={() => !imageUrl && fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 bg-gray-50 group hover:border-black transition-all min-h-[300px] ${!imageUrl ? 'cursor-pointer' : ''}`}
                      >
                        {imageUrl ? (
                          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border shadow-sm bg-white">
                            <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageUrl('');
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                              <Upload className="h-6 w-6" />
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Click to upload visual</p>
                              <p className="text-[8px] text-gray-400 mt-1 uppercase">Recommended: 1200x800px</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {!imageUrl && (
                        <div className="relative mt-2">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <LinkIcon className="h-3 w-3" />
                          </div>
                          <Input 
                            placeholder="Or paste remote URL..." 
                            value={imageUrl} 
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="h-9 text-[10px] pl-8 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="seo" className="p-8 m-0 space-y-12 max-w-5xl mx-auto">
                  <div className="bg-blue-50/50 p-8 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-6">
                      <Globe className="h-4 w-4 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Search Engine Simulation</span>
                    </div>
                    <div className="space-y-1 max-w-2xl">
                      <p className="text-blue-700 text-xl hover:underline cursor-pointer font-medium line-clamp-1">
                        {seoTitle || (name || 'Category Title')} | FSLNO STUDIO
                      </p>
                      <p className="text-green-800 text-sm line-clamp-1">https://fslno.com/collections/{(name || 'category').toLowerCase().replace(/\s+/g, '-')}</p>
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {seoDescription || (description || 'Add a refined meta description to improve click-through rates from search results.')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Custom Meta Title</Label>
                      <Input 
                        placeholder="e.g. Sculpted Outerwear & Luxury Coats | FSLNO" 
                        value={seoTitle} 
                        onChange={(e) => setSeoTitle(e.target.value)} 
                        className="h-12 bg-white"
                      />
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Optimal: 50-60 characters • {seoTitle.length}/60</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Custom Meta Description</Label>
                      <Textarea 
                        placeholder="Discover the FSLNO archive of sculpted coats and refined outerwear..." 
                        value={seoDescription} 
                        onChange={(e) => setSeoDescription(e.target.value)}
                        className="min-h-[120px] bg-white"
                      />
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Optimal: 150-160 characters • {seoDescription.length}/160</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="products" className="p-8 m-0 max-w-6xl mx-auto space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest">Assigned Inventory</h3>
                      <p className="text-xs text-gray-500 mt-1">Products currently linked to this collection across the storefront.</p>
                    </div>
                    <div className="bg-black text-white px-4 py-2 rounded flex items-center gap-3">
                      <ShoppingBag className="h-4 w-4" />
                      <span className="text-sm font-bold">{assignedProducts?.length || 0} ITEMS</span>
                    </div>
                  </div>

                  {productsLoading ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : !assignedProducts || assignedProducts.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50/50">
                      <ShoppingBag className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No products assigned yet.</p>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow>
                            <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-widest">Preview</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest">Product Name</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Price</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Stock Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignedProducts.map((product: any) => (
                            <TableRow key={product.id} className="hover:bg-gray-50/30">
                              <TableCell>
                                <div className="w-12 h-16 bg-gray-100 relative rounded border overflow-hidden">
                                  {product.media?.[0]?.url && <img src={product.media[0].url} alt="" className="object-cover w-full h-full" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm uppercase">{product.name}</span>
                                  <span className="text-[10px] font-mono text-gray-400 uppercase">{product.sku || 'NO-SKU'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium font-mono">${Number(product.price).toFixed(2)}</TableCell>
                              <TableCell className="text-center">
                                <span className={cn("text-[10px] font-bold px-2 py-1 rounded", Number(product.inventory) > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                                  {Number(product.inventory) > 0 ? `${product.inventory} IN STOCK` : 'OUT OF STOCK'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0 flex flex-row items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 px-6 font-bold uppercase tracking-widest text-[10px]"
                >
                  Close
                </Button>
                {activeTab !== 'general' && (
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      const idx = visibleTabs.findIndex(t => t.id === activeTab);
                      setActiveTab(visibleTabs[idx-1].id);
                    }}
                    className="gap-2 h-11 px-6 font-bold uppercase tracking-widest text-[10px]"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                )}
                {activeTab !== visibleTabs[visibleTabs.length - 1].id && (
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      const idx = visibleTabs.findIndex(t => t.id === activeTab);
                      setActiveTab(visibleTabs[idx+1].id);
                    }}
                    className="gap-2 h-11 px-6 font-bold uppercase tracking-widest text-[10px]"
                  >
                    Next Step <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !name}
                className="h-11 px-10 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {editingId ? 'Update Collection' : 'Commit Category'}
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
        ) : !categories || categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-gray-50/50">
            <Tag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-500">No categories found. Start by adding your first drop.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-gray-500">Editorial</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category Identity</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SEO Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Technical Chart</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Display Order</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: any, idx: number) => {
                  const chart = sizeCharts?.find((c: any) => c.id === category.sizeChartId);
                  
                  return (
                    <TableRow 
                      key={category.id} 
                      className="hover:bg-gray-50/50 group cursor-pointer"
                      onClick={() => openEdit(category)}
                    >
                      <TableCell>
                        <div className="w-14 h-14 bg-gray-100 relative overflow-hidden rounded border shadow-sm">
                          {category.imageUrl ? (
                            <Image 
                              src={category.imageUrl} 
                              alt={category.name} 
                              fill 
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-300">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm uppercase">{category.name}</span>
                          <span className="text-[10px] text-gray-500 line-clamp-1 uppercase tracking-tight">{category.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[9px] font-bold uppercase", category.seoTitle ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                          {category.seoTitle ? 'OPTIMIZED' : 'PENDING'}
                        </Badge>
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
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-black hover:text-white disabled:opacity-20"
                            onClick={(e) => handleMoveOrder(category.id, 'up', e)}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-[10px] font-mono font-bold w-6 text-center">{idx + 1}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-black hover:text-white disabled:opacity-20"
                            onClick={(e) => handleMoveOrder(category.id, 'down', e)}
                            disabled={idx === categories.length - 1}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-red-50" 
                            onClick={(e) => handleDelete(category.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
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
