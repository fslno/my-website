
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
  Loader2,
  Tag,
  Trash2,
  X,
  PlusCircle,
  Globe,
  Truck,
  LayoutGrid,
  Layers,
  Copy,
  Download,
  Upload,
  ArrowUpDown,
  Edit2,
  CheckCircle2,
  Info,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Save,
  Clock,
  Scale,
  Maximize2,
  MoreHorizontal
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

interface Variant {
  size: string;
  stock: number;
  sku: string;
  isPreorder?: boolean;
}

export default function ProductsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvImportRef = useRef<HTMLInputElement>(null);

  const isAdmin = useMemo(() => {
    return user?.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2';
  }, [user]);

  const productsQuery = useMemoFirebase(() => db && isAdmin ? collection(db, 'products') : null, [db, isAdmin]);
  const categoriesQuery = useMemoFirebase(() => db && isAdmin ? collection(db, 'categories') : null, [db, isAdmin]);

  const { data: products, loading: productsLoading } = useCollection(productsQuery);
  const { data: categories, loading: categoriesLoading } = useCollection(categoriesQuery);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
  const [bulkStatus, setBulkStatus] = useState<string>('');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [comparedPrice, setComparedPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [sizeFit, setSizeFit] = useState('');
  const [badge, setBadge] = useState('none');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [preorderEnabled, setPreorderEnabled] = useState(false);
  
  const [customizationEnabled, setCustomizationEnabled] = useState(true);
  const [customizationFee, setCustomizationFee] = useState('10');

  const [variants, setVariants] = useState<Variant[]>([
    { size: 'XS', stock: 0, sku: '', isPreorder: false },
    { size: 'S', stock: 0, sku: '', isPreorder: false },
    { size: 'M', stock: 0, sku: '', isPreorder: false },
    { size: 'L', stock: 0, sku: '', isPreorder: false },
    { size: 'XL', stock: 0, sku: '', isPreorder: false }
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

  const getMillis = (date: any) => {
    if (!date) return 0;
    if (date.toMillis) return date.toMillis();
    if (date.seconds) return date.seconds * 1000;
    return new Date(date).getTime();
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return getMillis(b.createdAt) - getMillis(a.createdAt);
        case 'oldest':
          return getMillis(a.createdAt) - getMillis(b.createdAt);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-high':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'price-low':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'stock-high':
          return (Number(b.inventory) || 0) - (Number(a.inventory) || 0);
        case 'stock-low':
          return (Number(a.inventory) || 0) - (Number(b.inventory) || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, categoryFilter, sortBy]);

  const currentIndex = useMemo(() => {
    if (!editingId || !filteredProducts) return -1;
    return filteredProducts.findIndex(p => p.id === editingId);
  }, [editingId, filteredProducts]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const isAllFilteredSelected = useMemo(() => {
    return filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id));
  }, [filteredProducts, selectedIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return filteredProducts.some(p => selectedIds.includes(p.id)) && !isAllFilteredSelected;
  }, [filteredProducts, selectedIds, isAllFilteredSelected]);

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      const currentFilteredIds = filteredProducts.map(p => p.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
    } else {
      const currentFilteredIds = new Set(filteredProducts.map(p => p.id));
      setSelectedIds(prev => prev.filter(id => !currentFilteredIds.has(id)));
    }
  };

  const handleToggleSelect = (id: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.length === 0) return;
    const confirmMessage = selectedIds.length === 1 
      ? "Are you sure you want to permanently delete this product?" 
      : `Are you sure you want to permanently delete these ${selectedIds.length} products?`;
    
    if (!confirm(confirmMessage)) return;

    setIsSaving(true);
    const batch = writeBatch(db);
    selectedIds.forEach(id => {
      batch.delete(doc(db, 'products', id));
    });

    batch.commit()
      .then(() => {
        setSelectedIds([]);
        toast({ title: "Updated", description: "Selected products have been removed." });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'products',
          operation: 'delete'
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleBulkUpdate = async () => {
    if (!db || selectedIds.length === 0) return;
    setIsSaving(true);

    const batch = writeBatch(db);
    const updates: any = {};
    if (bulkCategoryId) updates.categoryId = bulkCategoryId;
    if (bulkStatus) updates.status = bulkStatus;
    
    if (Object.keys(updates).length === 0) {
      setIsBulkEditDialogOpen(false);
      setIsSaving(false);
      return;
    }

    selectedIds.forEach(id => {
      batch.update(doc(db, 'products', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    });

    batch.commit()
      .then(() => {
        setSelectedIds([]);
        setIsBulkEditDialogOpen(false);
        setBulkCategoryId('');
        setBulkStatus('');
        toast({ title: "Success", description: `Updated ${selectedIds.length} products successfully.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'products',
          operation: 'update'
        }));
      })
      .finally(() => setIsSaving(false));
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
          sku: `${data.sku}-COPY-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: serverTimestamp(),
          status: 'draft'
        });
      }
    });

    batch.commit().then(() => {
      setSelectedIds([]);
      toast({ title: "Success", description: `${selectedIds.length} copies added to your products.` });
    });
  };

  const handleExportCSV = () => {
    if (!products || products.length === 0) return;
    const headers = ['Name', 'SKU', 'Brand', 'Price', 'Stock', 'Category'];
    const rows = products.map(p => {
      const cat = categories?.find(c => c.id === p.categoryId)?.name || 'None';
      return [p.name, p.sku || '', p.brand || '', p.price, p.inventory || 0, cat].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Product_Export_${new Date().toISOString().split('T')[0]}.csv`);
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
        const parts = line.split(',');
        if (parts.length >= 2) {
          const [name, sku, brand, price, inventory] = parts;
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
        }
      });
      batch.commit().then(() => {
        toast({ title: "Import Complete", description: "New products added to your list." });
      });
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
    if (name && name.length >= 2 && !sku && !editingId) {
      setSku(generateSku(name));
    }
  }, [name, sku, editingId]);

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

  const handleUpdateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
    const updated = [...variants];
    const item = { ...updated[index], [field]: value };
    if (field === 'size' && sku && (item.sku.startsWith(sku) || !item.sku)) {
      item.sku = `${sku}-${String(value).toUpperCase().replace(/\s+/g, '')}`;
    }
    updated[index] = item;
    setVariants(updated);
  };

  const handleToggleGlobalPreorder = (checked: boolean) => {
    setPreorderEnabled(checked);
    setVariants(prev => prev.map(v => ({ ...v, isPreorder: checked })));
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

  const handleSaveProduct = async () => {
    if (!db || !name || !price || !categoryId) return;
    setIsSaving(true);
    const productData = {
      name,
      description,
      price: parseFloat(price),
      comparedPrice: comparedPrice ? parseFloat(comparedPrice) : null,
      brand,
      sku,
      sizeFit,
      badge,
      categoryId,
      customizationEnabled,
      customizationFee: customizationEnabled ? parseFloat(customizationFee) : 0,
      inventory: totalInventory,
      preorderEnabled,
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
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      updateDoc(doc(db, 'products', editingId), productData)
        .then(() => {
          toast({ title: "Product Updated", description: `${name} has been saved.` });
        })
        .catch((error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `products/${editingId}`,
            operation: 'update',
            requestResourceData: productData,
          }));
        })
        .finally(() => setIsSaving(false));
    } else {
      const newData = { ...productData, createdAt: serverTimestamp() };
      addDoc(collection(db, 'products'), newData)
        .then((docRef) => {
          setEditingId(docRef.id);
          toast({ title: "Product Created", description: `${name} has been added to your products.` });
        })
        .catch((error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'products',
            operation: 'create',
            requestResourceData: newData,
          }));
        })
        .finally(() => setIsSaving(false));
    }
  };

  const resetForm = () => {
    setName(''); setPrice(''); setComparedPrice(''); setBrand(''); setSku(''); setSizeFit(''); setBadge('none'); setDescription(''); setCategoryId('');
    setCustomizationEnabled(true); setCustomizationFee('10'); setPreorderEnabled(false);
    setVariants([{ size: 'XS', stock: 0, sku: '', isPreorder: false }, { size: 'S', stock: 0, sku: '', isPreorder: false }, { size: 'M', stock: 0, sku: '', isPreorder: false }, { size: 'L', stock: 0, sku: '', isPreorder: false }, { size: 'XL', stock: 0, sku: '', isPreorder: false }]);
    setMedia([]); setFeatures(''); setSeoTitle(''); setSeoDescription(''); setSeoHandle(''); setWeight(''); setLength(''); setWidth(''); setHeight(''); setActiveTab('general');
    setEditingId(null);
  };

  const openEdit = (product: any) => {
    setName(product.name || '');
    setPrice(String(product.price || ''));
    setComparedPrice(String(product.comparedPrice || ''));
    setBrand(product.brand || '');
    setSku(product.sku || '');
    setSizeFit(product.sizeFit || '');
    setBadge(product.badge || 'none');
    setDescription(product.description || '');
    setCategoryId(product.categoryId || '');
    setCustomizationEnabled(product.customizationEnabled ?? true);
    setCustomizationFee(String(product.customizationFee ?? '10'));
    setPreorderEnabled(product.preorderEnabled ?? false);
    setVariants(product.variants || []);
    setMedia(product.media || []);
    setFeatures(product.features?.join(', ') || '');
    setSeoTitle(product.seo?.title || '');
    setSeoDescription(product.seo?.description || '');
    setSeoHandle(product.seo?.handle || '');
    setWeight(String(product.logistics?.weight || ''));
    setLength(String(product.logistics?.length || ''));
    setWidth(String(product.logistics?.width || ''));
    setHeight(String(product.logistics?.height || ''));
    setShippingClass(product.logistics?.shippingClass || 'standard');
    
    setEditingId(product.id);
    setIsDialogOpen(true);
  };

  const handlePreviousProduct = () => {
    if (currentIndex > 0) openEdit(filteredProducts[currentIndex - 1]);
  };

  const handleNextProduct = () => {
    if (currentIndex < filteredProducts.length - 1) openEdit(filteredProducts[currentIndex + 1]);
  };

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Products</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Add, edit, and manage your products.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-black hover:bg-black/90 text-white font-bold h-10 gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none bg-white flex flex-col p-0 border-none">
            <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl font-headline font-bold uppercase tracking-tight truncate max-w-[60%]">
                {editingId ? `Edit: ${name}` : 'New Product'}
              </DialogTitle>
              
              <div className="flex items-center gap-2 sm:gap-4">
                {editingId && (
                  <div className="flex items-center gap-1 border-r pr-2 sm:pr-4 sm:mr-2">
                    <Button variant="ghost" size="sm" onClick={handlePreviousProduct} disabled={currentIndex <= 0} className="h-8 gap-1 font-bold uppercase tracking-widest text-[8px] sm:text-[9px]">
                      <ChevronLeft className="h-3 w-3" /> <span className="hidden xs:inline">Prev</span>
                    </Button>
                    <span className="text-[8px] sm:text-[9px] font-mono text-gray-400 px-1 sm:px-2">{currentIndex + 1} / {filteredProducts.length}</span>
                    <Button variant="ghost" size="sm" onClick={handleNextProduct} disabled={currentIndex >= filteredProducts.length - 1} className="h-8 gap-1 font-bold uppercase tracking-widest text-[8px] sm:text-[9px]">
                      <span className="hidden xs:inline">Next</span> <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full h-10 w-10">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 sm:px-6 border-b bg-gray-50/50 shrink-0 overflow-x-auto scrollbar-hide">
                <TabsList className="bg-transparent h-14 p-0 gap-4 sm:gap-8 min-w-max">
                  {[{ id: 'general', label: '01. Details', icon: LayoutGrid }, { id: 'inventory', label: '02. Stock', icon: Layers }, { id: 'seo', label: '03. SEO', icon: Globe }, { id: 'logistics', label: '04. Shipping', icon: Truck }].map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none shadow-none px-0 h-full gap-2 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                      <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="general" className="p-4 sm:p-8 m-0 space-y-8 sm:space-y-12 max-w-5xl mx-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {media.map((item, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 border rounded-lg overflow-hidden group shadow-sm">
                        {item.type === 'video' ? <video src={item.url} className="absolute inset-0 w-full h-full object-cover" muted loop /> : <Image src={item.url} alt={`Media ${index}`} fill className="object-cover" />}
                        <button onClick={() => setMedia(media.filter((_, i) => i !== index))} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <PlusCircle className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black">Add Image</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleMediaUpload} />
                  </div>
                  <section className="space-y-6 sm:space-y-8 bg-gray-50/50 p-4 sm:p-8 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2"><Info className="h-4 w-4 text-gray-400" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Details</h3></div>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Name</Label><Input placeholder="e.g. Sculpted Merino Knit" value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-white" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Brand</Label><Input placeholder="e.g. FSLNO Studio" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-12 bg-white" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Price ($)</Label><Input type="number" placeholder="890" value={price} onChange={(e) => setPrice(e.target.value)} className="h-12 bg-white font-mono" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Regular Price ($)</Label><Input type="number" placeholder="1200" value={comparedPrice} onChange={(e) => setComparedPrice(e.target.value)} className="h-12 bg-white font-mono opacity-60" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Category</Label>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Select category..." /></SelectTrigger>
                            <SelectContent>{categories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Fit Info</Label><Input placeholder="e.g. True to size" value={sizeFit} onChange={(e) => setSizeFit(e.target.value)} className="h-12 bg-white" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Label/Badge</Label>
                          <Select value={badge} onValueChange={setBadge}>
                            <SelectTrigger className="h-12 bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="none" className="text-[10px] font-bold uppercase">No Label</SelectItem><SelectItem value="NEW DROP" className="text-[10px] font-bold uppercase">New Drop</SelectItem><SelectItem value="LIMITED" className="text-[10px] font-bold uppercase">Limited</SelectItem><SelectItem value="RESTOCK" className="text-[10px] font-bold uppercase">Restock</SelectItem><SelectItem value="ARCHIVE" className="text-[10px] font-bold uppercase">Archive</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-4 pt-4 border-t"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Description</Label><Textarea className="min-h-[150px] resize-none bg-white p-4 text-sm" placeholder="Describe this product..." value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                    </div>
                  </section>
                  <section className="bg-blue-50/30 p-4 sm:p-8 rounded-xl border border-blue-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1"><div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-blue-600" /><h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-900">Personalization</h3></div><p className="text-[8px] sm:text-[9px] uppercase font-bold text-blue-700 tracking-tight">Allow custom name or number at checkout.</p></div>
                      <Switch checked={customizationEnabled} onCheckedChange={setCustomizationEnabled} className="data-[state=checked]:bg-blue-600"/>
                    </div>
                    {customizationEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-blue-800">Fee ($)</Label><Input type="number" value={customizationFee} onChange={(e) => setCustomizationFee(e.target.value)} className="h-12 bg-white border-blue-200 font-mono"/></div>
                        <div className="flex items-center p-4 bg-white/50 border border-blue-100 rounded-lg"><p className="text-[9px] sm:text-[10px] text-blue-800 leading-relaxed uppercase font-medium">Enabling this will add custom name and number fields to the product page for an extra fee.</p></div>
                      </div>
                    )}
                  </section>
                </TabsContent>
                <TabsContent value="inventory" className="p-4 sm:p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="bg-black text-white p-6 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl">
                    <div className="text-center sm:text-left"><p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Total In Stock</p><p className="text-3xl font-bold font-headline">{totalInventory} PCS</p></div>
                    <div className="w-full sm:w-[300px] text-center sm:text-right"><Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Master SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} className="bg-white/10 border-white/20 text-white font-mono mt-1 text-center sm:text-right h-11" /></div>
                  </div>
                  <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between"><div className="space-y-1"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-orange-600" /><h3 className="text-xs font-bold uppercase tracking-widest text-orange-900">Pre-order</h3></div><p className="text-[9px] uppercase font-bold text-orange-700 tracking-tight">Enable pre-orders for this product.</p></div><Switch checked={preorderEnabled} onCheckedChange={handleToggleGlobalPreorder} className="data-[state=checked]:bg-orange-600"/></div>
                  <div className="grid gap-4">
                    {variants.map((v, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-4 p-4 border rounded-xl bg-white shadow-sm hover:border-black transition-colors group">
                        <div className="w-full sm:w-20"><Label className="text-[8px] uppercase font-bold text-gray-400">Size</Label><Input value={v.size} onChange={(e) => handleUpdateVariant(i, 'size', e.target.value)} className="h-10 font-bold uppercase" /></div>
                        <div className="flex-1 min-w-[150px]"><Label className="text-[8px] uppercase font-bold text-gray-400">SKU</Label><Input value={v.sku} onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value)} className="h-10 font-mono text-[10px]" /></div>
                        <div className="w-full sm:w-32"><Label className="text-[8px] uppercase font-bold text-gray-400">In Stock</Label><Input type="number" value={v.stock} onChange={(e) => handleUpdateVariant(i, 'stock', parseInt(e.target.value) || 0)} className="h-10 font-mono" /></div>
                        <div className="flex flex-col items-center gap-1.5 pt-2 px-2 ml-auto sm:ml-0"><Label className="text-[7px] uppercase font-bold text-gray-400">Pre-order</Label><Switch checked={v.isPreorder ?? false} onCheckedChange={(checked) => handleUpdateVariant(i, 'isPreorder', checked)} className="scale-75"/></div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="seo" className="p-4 sm:p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="space-y-6"><div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Meta Title</Label><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="h-12 bg-white" /></div><div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Meta Description</Label><Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="min-h-[120px] bg-white resize-none" /></div><div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">URL Handle</Label><div className="flex items-center gap-2 border rounded-md px-3 bg-gray-50"><span className="text-[10px] text-gray-400 hidden sm:inline">fslno.ca/products/</span><Input value={seoHandle} onChange={(e) => setSeoHandle(e.target.value)} className="border-none bg-transparent shadow-none px-0 h-12 flex-1" /></div></div></div>
                </TabsContent>
                <TabsContent value="logistics" className="p-4 sm:p-8 m-0 space-y-12 max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8"><div className="flex items-center gap-2 mb-2"><Scale className="h-4 w-4 text-gray-400" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Shipping Info</h3></div><div className="grid gap-6"><div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Weight (kg)</Label><Input type="number" step="0.01" placeholder="0.00" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-12 bg-white font-mono" /></div><div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Shipping Type</Label><Select value={shippingClass} onValueChange={setShippingClass}><SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Select type..." /></SelectTrigger><SelectContent><SelectItem value="standard" className="text-[10px] font-bold uppercase">Standard</SelectItem><SelectItem value="heavy" className="text-[10px] font-bold uppercase">Heavy</SelectItem><SelectItem value="fragile" className="text-[10px] font-bold uppercase">Fragile</SelectItem></SelectContent></Select></div></div></div>
                    <div className="space-y-8"><div className="flex items-center gap-2 mb-2"><Maximize2 className="h-4 w-4 text-gray-400" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Box Dimensions</h3></div><div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-[8px] uppercase font-bold text-gray-400">L (cm)</Label><Input type="number" value={length} onChange={(e) => setLength(e.target.value)} className="h-12 bg-white font-mono" /></div><div className="space-y-2"><Label className="text-[8px] uppercase font-bold text-gray-400">W (cm)</Label><Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="h-12 bg-white font-mono" /></div><div className="space-y-2"><Label className="text-[8px] uppercase font-bold text-gray-400">H (cm)</Label><Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="h-12 bg-white font-mono" /></div></div></div>
                  </div>
                </TabsContent>
              </div>
              <DialogFooter className="p-4 sm:p-6 border-t bg-gray-50/50 shrink-0 flex flex-col sm:flex-row justify-end items-center gap-4">
                <Button onClick={handleSaveProduct} disabled={isSaving || !name || !price || !categoryId} className="w-full sm:w-auto h-12 px-12 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-black/90 transition-all">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}{editingId ? 'Save Changes' : 'Add Product'}
                </Button>
              </DialogFooter>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-[#e1e3e5] rounded-none overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50/50 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" disabled={selectedIds.length === 0} onClick={handleBulkDuplicate} className="h-9 border-[#babfc3] text-[9px] font-bold uppercase tracking-widest gap-2 bg-white"><Copy className="h-3.5 w-3.5" /> Duplicate {selectedIds.length > 0 && `(${selectedIds.length})`}</Button>
              <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm" disabled={selectedIds.length === 0} className="h-9 border-[#babfc3] text-[9px] font-bold uppercase tracking-widest gap-2 bg-white"><Edit2 className="h-3.5 w-3.5" /> Bulk Edit {selectedIds.length > 0 && `(${selectedIds.length})`}</Button></DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                  <DialogHeader className="pt-6"><DialogTitle className="text-sm font-bold uppercase tracking-widest">Bulk Edit</DialogTitle><DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Update {selectedIds.length} products at once.</DialogDescription></DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-500">Move to Category</Label><Select value={bulkCategoryId} onValueChange={setBulkCategoryId}><SelectTrigger className="h-11"><SelectValue placeholder="Select category..." /></SelectTrigger><SelectContent>{categories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.id} className="text-[10px] uppercase font-bold">{cat.name}</SelectItem>))}</SelectContent></Select></div>
                    <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-500">Update Status</Label><Select value={bulkStatus} onValueChange={setBulkStatus}><SelectTrigger className="h-11"><SelectValue placeholder="Select status..." /></SelectTrigger><SelectContent><SelectItem value="active" className="text-[10px] uppercase font-bold">Active (Visible)</SelectItem><SelectItem value="draft" className="text-[10px] uppercase font-bold">Draft (Hidden)</SelectItem><SelectItem value="archived" className="text-[10px] uppercase font-bold">Archived</SelectItem></SelectContent></Select></div>
                  </div>
                  <DialogFooter><Button onClick={handleBulkUpdate} disabled={isSaving} className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[9px]">{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Apply Changes</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="destructive" size="sm" disabled={selectedIds.length === 0} onClick={handleBulkDelete} className="h-9 text-[9px] font-bold uppercase tracking-widest gap-2">{isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Delete {selectedIds.length > 0 && `(${selectedIds.length})`}</Button>
            </div>
            <div className="flex items-center gap-2"><input type="file" ref={csvImportRef} className="hidden" accept=".csv" onChange={handleImportCSV} /><Button variant="ghost" size="sm" onClick={() => csvImportRef.current?.click()} className="h-9 text-[9px] font-bold uppercase tracking-widest gap-2"><Upload className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Import CSV</span></Button><Button variant="ghost" size="sm" onClick={handleExportCSV} className="h-9 text-[9px] font-bold uppercase tracking-widest gap-2"><Download className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Export CSV</span></Button></div>
          </div>
          <Separator />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:flex-1 md:max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" /><Input placeholder="Search products..." className="pl-10 h-10 border-[#babfc3] focus:ring-black bg-white uppercase text-[10px] font-bold rounded-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={sortBy} onValueChange={(v: string) => setSortBy(v)}>
                <SelectTrigger className="flex-1 md:w-[180px] h-10 text-[9px] font-bold uppercase tracking-widest bg-white border-[#babfc3] rounded-none"><ArrowUpDown className="h-3 w-3 mr-2" /><span className="truncate">Sort By</span></SelectTrigger>
                <SelectContent><SelectItem value="newest" className="text-[10px] uppercase font-bold">Newest First</SelectItem><SelectItem value="oldest" className="text-[10px] uppercase font-bold">Oldest First</SelectItem><SelectItem value="name-asc" className="text-[10px] uppercase font-bold">Name: A - Z</SelectItem><SelectItem value="name-desc" className="text-[10px] uppercase font-bold">Name: Z - A</SelectItem><SelectItem value="price-high" className="text-[10px] uppercase font-bold">Price: High to Low</SelectItem><SelectItem value="price-low" className="text-[10px] uppercase font-bold">Price: Low to High</SelectItem></SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="flex-1 md:w-[180px] h-10 text-[9px] font-bold uppercase tracking-widest bg-white border-[#babfc3] rounded-none"><Filter className="h-3 w-3 mr-2" /><span className="truncate">{categoryFilter === 'all' ? 'All Categories' : categories?.find(c => c.id === categoryFilter)?.name}</span></SelectTrigger>
                <SelectContent><SelectItem value="all" className="text-[10px] uppercase font-bold">All Categories</SelectItem>{categories?.map(c => (<SelectItem key={c.id} value={c.id} className="text-[10px] uppercase font-bold">{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-[#f6f6f7]">
              <TableRow className="hover:bg-transparent border-[#e1e3e5]"><TableHead className="w-[40px] px-4"><Checkbox checked={isAllFilteredSelected ? true : isSomeFilteredSelected ? "indeterminate" : false} onCheckedChange={handleSelectAll} /></TableHead><TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Image</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Product</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Category</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Stock</TableHead><TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Price</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading || categoriesLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-gray-400 uppercase text-[10px] font-bold tracking-[0.2em]">No products found.</TableCell></TableRow>
              ) : (
                filteredProducts.map((product: any) => {
                  const category = categories?.find((c: any) => c.id === product.categoryId);
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <TableRow key={product.id} onClick={() => openEdit(product)} className={`transition-colors border-[#e1e3e5] group cursor-pointer ${isSelected ? 'bg-blue-50/30' : 'hover:bg-[#f6f6f7]/50'}`}>
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}><Checkbox checked={isSelected} onCheckedChange={(checked) => handleToggleSelect(product.id, checked)} /></TableCell>
                      <TableCell><div className="w-12 h-16 bg-gray-100 relative overflow-hidden rounded border border-gray-100 flex items-center justify-center">{product.media?.[0]?.url ? <img src={product.media[0].url} alt={product.name} className="object-cover w-full h-full" /> : <Layers className="h-4 w-4 text-gray-300" />}</div></TableCell>
                      <TableCell><div className="flex flex-col"><span className="font-bold text-sm uppercase">{product.name}</span><span className="text-[9px] uppercase tracking-widest text-[#8c9196] font-mono">{product.sku || 'No SKU'}</span></div></TableCell>
                      <TableCell><div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><Tag className="h-3 w-3" /> {category?.name || 'None'}</div></TableCell>
                      <TableCell className="text-sm font-bold">{product.inventory || 0} PCS</TableCell>
                      <TableCell className="text-sm font-semibold">C$${formatCurrency(Number(product.price))}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="lg:hidden divide-y">
          {productsLoading || categoriesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No products found.</div>
          ) : (
            filteredProducts.map((product: any) => {
              const category = categories?.find((c: any) => c.id === product.categoryId);
              const isSelected = selectedIds.includes(product.id);
              return (
                <div key={product.id} onClick={() => openEdit(product)} className={cn("p-4 flex flex-col gap-4 bg-white transition-colors hover:bg-gray-50", isSelected && "bg-blue-50/30")}>
                  <div className="flex items-start gap-4">
                    <div onClick={(e) => e.stopPropagation()} className="pt-1"><Checkbox checked={isSelected} onCheckedChange={(checked) => handleToggleSelect(product.id, checked)} /></div>
                    <div className="w-16 h-20 bg-gray-100 relative overflow-hidden border shrink-0 shadow-sm">{product.media?.[0]?.url ? <img src={product.media[0].url} alt={product.name} className="object-cover w-full h-full" /> : <Layers className="h-6 w-6 text-gray-200" />}</div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start gap-2"><h3 className="font-bold text-xs uppercase truncate leading-tight">{product.name}</h3><span className="font-bold text-xs shrink-0">C$${formatCurrency(Number(product.price))}</span></div>
                      <p className="text-[9px] font-mono text-gray-400 uppercase truncate">SKU: {product.sku || 'N/A'}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase tracking-tighter border-none bg-gray-100 text-gray-600 px-1.5"><Tag className="h-2 w-2 mr-1" /> {category?.name || 'None'}</Badge>
                        <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase tracking-tighter border-none bg-black text-white px-1.5">{product.inventory || 0} IN STOCK</Badge>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300"><ChevronRight className="h-4 w-4" /></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
