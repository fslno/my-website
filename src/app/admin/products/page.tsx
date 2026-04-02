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
  Sparkles,
  Images as ImagesIcon,
  FileText,
  Crop,
  Mic,
  ScanLine,
  AlertTriangle,
  Volume2,
  Wand2,
  DollarSign
} from 'lucide-react';
import { ProductListSkeleton } from '@/components/admin/AdminSkeletons';
import { BarcodeScanner } from '@/components/admin/BarcodeScanner';
import { ImageCropper } from '@/components/admin/ImageCropper';
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
import { VoiceSearch } from '@/components/ui/VoiceSearch';
import { useVoiceSearch } from '@/hooks/use-voice-search';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, useIsAdmin, useStorage } from '@/firebase';
import { collection, addDoc, doc, serverTimestamp, writeBatch, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { adminGenerateProductDescription } from '@/ai/flows/admin-generate-product-description';
import { getLivePath } from '@/lib/paths';

interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'file';
  name?: string;
}

interface Variant {
  size: string;
  stock: number;
  sku: string;
  isPreorder?: boolean;
  lowStockThreshold?: number;
}

export default function ProductsPage() {
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvImportRef = useRef<HTMLInputElement>(null);

  const isAdmin = useIsAdmin();

  const productsRef = useMemoFirebase(() => db && isAdmin ? collection(db, 'products') : null, [db, isAdmin]);
  const categoriesRef = useMemoFirebase(() => db && isAdmin ? collection(db, 'categories') : null, [db, isAdmin]);
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const shippingConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'shipping') : null, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsRef);
  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesRef);
  const { data: storeConfig } = useDoc(storeConfigRef);
  const { data: shippingConfig } = useDoc(shippingConfigRef);
  
  const globalThreshold = Number(storeConfig?.globalLowStockThreshold) || 10;
  const globalVariantThreshold = Number(storeConfig?.globalVariantLowStockThreshold) || 5;
  
  const [isSaving, setIsSaving] = useState(false);
  const [aiTone, setAiTone] = useState('luxurious');
  const [aiAudience, setAiAudience] = useState('premium');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const lastSelectedId = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const deferredSearch = React.useDeferredValue(searchQuery);

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
  const [preorderEstimate, setPreorderEstimate] = useState('EST. 2-4 WEEKS');
  
  const [customizationEnabled, setCustomizationEnabled] = useState(true);
  const [customizationFee, setCustomizationFee] = useState('10');

  const [variants, setVariants] = useState<Variant[]>([]);
  const [inventory, setInventory] = useState('0');
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [globalLowStockThreshold, setGlobalLowStockThreshold] = useState('10');
  const [globalVariantLowStockThreshold, setGlobalVariantLowStockThreshold] = useState('5');

  // Drag and Drop State
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);

  // Cropping Queue State
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<File[]>([]);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  
  const [showBrand, setShowBrand] = useState(true);
  
  // Bulk Pricing State
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [bulkPriceAction, setBulkPriceAction] = useState<'set' | 'increase_fixed' | 'increase_percent' | 'decrease_fixed' | 'decrease_percent'>('set');
  const [bulkPriceValue, setBulkPriceValue] = useState('');

  const { isListening, startVoiceSearch } = useVoiceSearch({
    onResult: (transcript) => setSearchQuery(transcript)
  });
  const [showSku, setShowSku] = useState(true);

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (storeConfig) {
      setGlobalLowStockThreshold((storeConfig.globalLowStockThreshold ?? 10).toString());
      setGlobalVariantLowStockThreshold((storeConfig.globalVariantLowStockThreshold ?? 5).toString());
      setShowBrand(storeConfig.showBrandStorefront !== false);
      setShowSku(storeConfig.showSkuStorefront !== false);

    }
  }, [storeConfig]);

  // Debounced Auto-Save for Thresholds
  useEffect(() => {
    if (!hasMounted || !isDirty) return;
    const timeout = setTimeout(() => {
      updateGlobalThresholds(globalLowStockThreshold, globalVariantLowStockThreshold);
      setIsDirty(false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [globalLowStockThreshold, globalVariantLowStockThreshold, hasMounted, isDirty]);

  const updateDisplayOptions = async (field: 'showBrandStorefront' | 'showSkuStorefront', value: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'config', 'store'), {
        [field]: value,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Display option update failed", err);
    }
  };

  const updateGlobalThresholds = async (totalVal: string, sizeVal: string) => {
    if (!db) return;
    setIsSaving(true);
    try {
      const totalNum = parseInt(totalVal) || 0;
      const sizeNum = parseInt(sizeVal) || 0;

      // 1. Update the global config
      await updateDoc(doc(db, 'config', 'store'), {
        globalLowStockThreshold: totalNum,
        globalVariantLowStockThreshold: sizeNum,
        updatedAt: serverTimestamp()
      });

      // 2. Bulk update all products to use these values "rightaway"
      const productsPath = getLivePath('products');
      const snapshot = await getDocs(collection(db, productsPath));
      
      let batch = writeBatch(db);
      let count = 0;
      let totalUpdated = 0;

      for (const d of snapshot.docs) {
        const data = d.data();
        // Update product level threshold and individual variant thresholds
        const updatedVariants = (data.variants || []).map((v: any) => ({
          ...v,
          lowStockThreshold: sizeNum
        }));

        batch.update(d.ref, {
          lowStockThreshold: totalNum,
          variantLowStockThreshold: sizeNum,
          variants: updatedVariants,
          updatedAt: serverTimestamp()
        });

        count++;
        totalUpdated++;
        
        // Firestore batch limit is 500
        if (count >= 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      toast({ 
        title: "Inventory Synced Successfully", 
        description: `Updated thresholds for ${totalUpdated} products and their variants.` 
      });
    } catch (err) {
      console.error("Threshold sync failed", err);
      toast({ 
        variant: "destructive",
        title: "Sync Error", 
        description: "Failed to synchronize some products. Please try again." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStartMedia = (index: number) => {
    setDraggedMediaIndex(index);
  };

  const handleDragOverMedia = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedMediaIndex === null || draggedMediaIndex === index) return;
    
    const newMedia = [...media];
    const draggedItem = newMedia[draggedMediaIndex];
    newMedia.splice(draggedMediaIndex, 1);
    newMedia.splice(index, 0, draggedItem);
    setDraggedMediaIndex(index);
    setMedia(newMedia);
  };

  const handleDragEndMedia = () => {
    setDraggedMediaIndex(null);
  };

  const getMillis = (date: any) => {
    if (!date) return 0;
    if (date.toMillis) return date.toMillis();
    if (date.seconds) return date.seconds * 1000;
    return new Date(date).getTime();
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    const calculateTotalStock = (variants?: Variant[], inventory?: number) => {
      if (variants && variants.length > 0) {
        return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      }
      return Number(inventory) || 0;
    };

    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(deferredSearch.toLowerCase()) || 
                           (p.sku && p.sku.toLowerCase().includes(deferredSearch.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
      
      const totalStock = calculateTotalStock(p.variants, p.inventory);
      const isActuallyOut = p.isSoldOut || totalStock <= 0;
      
      const hasLowVariant = p.variants?.some((v: any) => {
        const threshold = Number(v.lowStockThreshold) || globalVariantThreshold;
        return (Number(v.stock) || 0) > 0 && (Number(v.stock) || 0) <= threshold;
      });
      const hasOutVariant = p.variants?.some((v: any) => (Number(v.stock) || 0) <= 0);

      const productLowThreshold = Number(p.lowStockThreshold) || globalThreshold;
      const matchesStock = stockFilter === 'all' || 
                          (stockFilter === 'low' && (hasLowVariant || (!isActuallyOut && totalStock <= productLowThreshold))) || 
                          (stockFilter === 'out' && (hasOutVariant || isActuallyOut));
      
      return matchesSearch && matchesCategory && matchesStock;
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
          return (Number(a.price) || 0) - (Number(a.price) || 0);
        case 'stock-high':
          return (Number(b.inventory) || 0) - (Number(a.inventory) || 0);
        case 'stock-low':
          return (Number(a.inventory) || 0) - (Number(a.inventory) || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [products, deferredSearch, categoryFilter, sortBy, stockFilter, globalThreshold, globalVariantThreshold]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

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

  const handleToggleSelect = (id: string, checked: boolean | "indeterminate", isShiftKey = false) => {
    if (checked === true) {
      if (isShiftKey && lastSelectedId.current) {
        const productIds = filteredProducts.map(p => p.id);
        const lastIndex = productIds.indexOf(lastSelectedId.current);
        const currentIndex = productIds.indexOf(id);
        
        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeIds = productIds.slice(start, end + 1);
          setSelectedIds(prev => Array.from(new Set([...prev, ...rangeIds])));
          lastSelectedId.current = id;
          return;
        }
      }
      setSelectedIds(prev => [...prev, id]);
      lastSelectedId.current = id;
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
      lastSelectedId.current = null;
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

    const updates: any = {};
    if (bulkCategoryId && bulkCategoryId !== 'keep') updates.categoryId = bulkCategoryId;
    if (bulkStatus && bulkStatus !== 'keep') updates.status = bulkStatus;
    
    if (Object.keys(updates).length === 0 && !bulkPriceValue) {
      setIsBulkEditDialogOpen(false);
      setIsSaving(false);
      return;
    }

    const updateTasks: Promise<void>[] = [];
    
    selectedIds.forEach(id => {
      const docRef = doc(db, 'products', id);
      const docUpdates: any = { ...updates, updatedAt: serverTimestamp() };
      
      // Handle bulk price specifically if provided
      if (bulkPriceValue) {
        docUpdates.price = parseFloat(bulkPriceValue).toFixed(2);
      }
      
      updateTasks.push(updateDoc(docRef, docUpdates));
    });

    Promise.all(updateTasks)
      .then(() => {
        setSelectedIds([]);
        setIsBulkEditDialogOpen(false);
        setBulkCategoryId('');
        setBulkStatus('');
        setBulkPriceValue('');
        toast({ title: "Success", description: `Updated ${selectedIds.length} products successfully.` });
      })
      .catch((error) => {
        console.error("Bulk update error:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to update all products." });
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
      toast({ 
        title: "Bulk Duplicate Successful", 
        description: `${selectedIds.length} copies added to your archive.` 
      });
      setSelectedIds([]);
    });
  };

  const handleBulkPriceUpdate = async () => {
    if (!db || selectedIds.length === 0 || !bulkPriceValue) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const val = parseFloat(bulkPriceValue);
      
      selectedIds.forEach(id => {
        const product = products?.find(p => p.id === id);
        if (!product) return;
        
        let newPrice = parseFloat(product.price || '0');
        
        switch (bulkPriceAction) {
          case 'set':
            newPrice = val;
            break;
          case 'increase_fixed':
            newPrice += val;
            break;
          case 'increase_percent':
            newPrice *= (1 + val / 100);
            break;
          case 'decrease_fixed':
            newPrice -= val;
            break;
          case 'decrease_percent':
            newPrice *= (1 - val / 100);
            break;
        }
        
        batch.update(doc(db, 'products', id), { 
          price: newPrice.toFixed(2),
          updatedAt: serverTimestamp() 
        });
      });
      
      await batch.commit();
      toast({ 
        title: "Bulk Price Update", 
        description: `Successfully updated prices for ${selectedIds.length} products.` 
      });
      setIsBulkPriceOpen(false);
      setBulkPriceValue('');
      setSelectedIds([]);
    } catch (error) {
      console.error("Bulk Price Error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update prices." });
    } finally {
      setIsSaving(false);
    }
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

  const handleBarcodeScan = (code: string) => {
    setSearchQuery(code);
    setIsScannerOpen(false);
    toast({ title: "Barcode Scanned", description: `Searching for SKU: ${code}` });
  };

  const generateSku = (productName: string) => {
    if (!productName) return '';
    const namePart = productName.replace(/[^A-Z0-9]/gi, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
    const randomPart = Math.floor(100 + Math.random() * 900);
    return `${namePart}${randomPart}`;
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
    if (variants && variants.length > 0) {
      return variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    }
    return Number(inventory) || 0;
  }, [variants, inventory]);

  const handleAddVariant = () => {
    setVariants([...variants, { size: '', stock: 0, sku: sku ? `${sku}-NEW` : '', isPreorder: preorderEnabled, lowStockThreshold: 5 }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

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

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    setCropQueue(fileArray);
    setProcessedFiles([]);
    setIsCropperOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob | null) => {
    const currentFile = cropQueue[0];
    if (!currentFile) return;

    let finalFile = currentFile;
    if (croppedBlob) {
      finalFile = new File([croppedBlob], currentFile.name, { type: 'image/jpeg' });
    }

    const newProcessed = [...processedFiles, finalFile];
    const newQueue = cropQueue.slice(1);

    if (newQueue.length > 0) {
      setProcessedFiles(newProcessed);
      setCropQueue(newQueue);
    } else {
      // End of queue - start the actually upload
      setCropQueue([]);
      setIsCropperOpen(false);
      await startUpload(newProcessed);
    }
  };

  const startUpload = async (files: File[]) => {
    if (!storage || files.length === 0) return;
    
    setIsSaving(true);
    setUploadProgress({ current: 0, total: files.length });
    
    const BATCH_SIZE = 10;
    const allResults: MediaItem[] = [];
    
    try {
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (file) => {
          let type: 'image' | 'video' | 'file' = 'file';
          if (file.type.startsWith('video/')) type = 'video';
          else if (file.type.startsWith('image/')) type = 'image';
          
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const storageRef = ref(storage, `products/${fileName}`);
          
          try {
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            return { url, type, name: file.name } as MediaItem;
          } catch (error) {
            console.error("Storage Batch Upload Error:", error);
            throw error;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);
        setUploadProgress(prev => prev ? { ...prev, current: i + batch.length } : null);
      }
      
      setMedia(prev => [...prev, ...allResults]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ 
        title: "Upload Complete", 
        description: `Successfully processed and saved ${allResults.length} files.` 
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Upload Error", 
        description: "A critical error occurred during upload. Some files may not have been saved." 
      });
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const handleAiGenerate = async () => {
    if (!name) {
      toast({ variant: "destructive", title: "Missing Name", description: "Provide a product name for the AI to analyze." });
      return;
    }
    setIsGeneratingAi(true);
    try {
      const result = await adminGenerateProductDescription({
        productName: name,
        features: features.split(',').map(f => f.trim()).filter(Boolean),
        tone: aiTone,
        targetAudience: aiAudience
      });
      
      setDescription(result.description);
      setSeoTitle(result.metaTitle);
      setSeoDescription(result.metaDescription);
      
      toast({ title: "AI Text Generated", description: "Description and metadata added." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Generation failed. Check your API limit." });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!db) return;

    if (!name || name.trim() === '') {
      toast({ variant: "destructive", title: "Missing Name", description: "Provide a product name to save this item." });
      return;
    }
    if (!price || isNaN(parseFloat(price))) {
      toast({ variant: "destructive", title: "Invalid Price", description: "Set a numeric baseline value for this piece." });
      return;
    }
    if (!categoryId || categoryId === '') {
      toast({ variant: "destructive", title: "Missing Category", description: "Assign this item to a category." });
      return;
    }

    setIsSaving(true);

    // Helper to clear storefront cache
    const revalidate = async (id: string, name: string) => {
      try {
        const handle = name.toLowerCase().replace(/\s+/g, '-');
        await Promise.all([
          fetch(`/api/revalidate?path=/products/${id}`),
          fetch(`/api/revalidate?path=/products/${handle}`),
          fetch(`/api/revalidate?path=/`)
        ]);
      } catch (e) { console.error('Revalidation failed', e); }
    };

    // Sanitize numeric inputs to avoid Firestore NaN rejections
    const sanitizeNum = (val: string | number, fallback: number | null = 0) => {
      const parsed = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(parsed) ? fallback : parsed;
    };

    const productData = {
      name: name.trim(),
      description,
      price: sanitizeNum(price),
      comparedPrice: comparedPrice ? sanitizeNum(comparedPrice, null) : null,
      brand: brand.trim(),
      isSoldOut: isSoldOut,
      sku: sku.trim(),
      sizeFit: sizeFit.trim(),
      badge,
      categoryId,
      customizationEnabled,
      customizationFee: customizationEnabled ? sanitizeNum(customizationFee) : 0,
      inventory: totalInventory,
      lowStockThreshold: sanitizeNum(lowStockThreshold, 10),
      preorderEnabled,
      preorderEstimate: preorderEstimate.trim() || 'EST. 2-4 WEEKS',
      variants: variants.map(v => ({
        ...v,
        stock: isNaN(v.stock) ? 0 : v.stock,
        lowStockThreshold: Number(v.lowStockThreshold) || 5,
        sku: v.sku.trim()
      })),
      media,
      features: features.split(',').map(f => f.trim()).filter(Boolean),
      seo: {
        title: seoTitle.trim() || name.trim(),
        description: seoDescription.trim() || description,
        handle: seoHandle.trim() || name.trim().toLowerCase().replace(/\s+/g, '-')
      },
      logistics: {
        weight: sanitizeNum(weight, Number(shippingConfig?.defaultWeight) || 0.6),
        length: sanitizeNum(length, Number(shippingConfig?.defaultLength) || 35),
        width: sanitizeNum(width, Number(shippingConfig?.defaultWidth) || 25),
        height: sanitizeNum(height, Number(shippingConfig?.defaultHeight) || 10),
        shippingClass
      },
      status: 'active',
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData);
        await revalidate(editingId, name);
        toast({ title: "Product Updated", description: `${name} has been updated.` });
      } else {
        const newData = { ...productData, createdAt: serverTimestamp() };
        const docRef = await addDoc(collection(db, 'products'), newData);
        await revalidate(docRef.id, name);
        setEditingId(docRef.id);
        toast({ title: "Product Created", description: `${name} has been added to the catalog.` });
      }
    } catch (error: any) {
      console.error("Save Product Error:", error);
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: editingId ? `products/${editingId}` : 'products',
          operation: editingId ? 'update' : 'create',
          requestResourceData: productData,
        }));
      } else {
        toast({ 
          variant: "destructive", 
          title: "Save Error", 
          description: "Encountered a server error. Check console for details." 
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName(''); setPrice(''); setComparedPrice(''); setBrand(''); setSku(''); setSizeFit(''); setBadge('none'); setDescription(''); setCategoryId('');
    setCustomizationEnabled(true); setCustomizationFee('10'); setPreorderEnabled(false); setPreorderEstimate('EST. 2-4 WEEKS'); setIsSoldOut(false);
    setLowStockThreshold('10');
    setVariants([]);
    setInventory('0');
    setMedia([]); setFeatures(''); setSeoTitle(''); setSeoDescription(''); setSeoHandle(''); setWeight(''); setLength(''); setWidth(''); setHeight(''); setActiveTab('general');
    setEditingId(null);
  };

  const openEdit = (product: any) => {
    setName(product.name || '');
    setPrice(String(product.price || ''));
    setComparedPrice(String(product.comparedPrice || ''));
    setIsSoldOut(product.isSoldOut || false);
    setBrand(product.brand || '');
    setSku(product.sku || '');
    setSizeFit(product.sizeFit || '');
    setBadge(product.badge || 'none');
    setDescription(product.description || '');
    setCategoryId(product.categoryId || '');
    setCustomizationEnabled(product.customizationEnabled ?? true);
    setCustomizationFee(String(product.customizationFee ?? '10'));
    setPreorderEnabled(product.preorderEnabled ?? false);
    setPreorderEstimate(product.preorderEstimate || 'EST. 2-4 WEEKS');
    setLowStockThreshold(String(product.lowStockThreshold ?? '10'));
    setVariants(product.variants || []);
    setInventory(String(product.inventory || '0'));
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

  if (!hasMounted) return null;

  return (
    <>
      {(productsLoading || categoriesLoading) && (
        <div className="h-48 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-black opacity-20" />
        </div>
      )}
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Products</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Add, edit, and manage your products.</p>
        </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => {
                updateGlobalThresholds(globalLowStockThreshold, globalVariantLowStockThreshold);
                setIsDirty(false);
              }}
              disabled={isSaving}
              className={cn(
                "h-10 px-6 gap-2 font-bold uppercase tracking-widest text-[10px] transition-all duration-500 shadow-lg",
                isDirty 
                  ? "bg-orange-600 hover:bg-orange-700 text-white ring-4 ring-orange-500/20" 
                  : "bg-white border text-gray-400 hover:text-black shadow-none"
              )}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Syncing...' : 'Save & Sync'}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none bg-black hover:bg-black/90 text-white font-bold h-10 gap-2">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none bg-white flex flex-col p-0 border-none">
                <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsDialogOpen(false)} 
                      className="h-9 gap-2 font-bold uppercase tracking-widest text-[10px] hidden xs:flex items-center text-muted-foreground hover:text-black transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Previous</span>
                    </Button>
                <DialogTitle className="text-lg sm:text-xl font-headline font-bold uppercase tracking-tight truncate">
                  {editingId ? `Edit: ${name}` : 'New Product'}
                </DialogTitle>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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
              <div className="px-4 sm:px-6 border-b bg-gray-50/50 shrink-0">
                <TabsList className="bg-transparent h-auto p-1 flex flex-wrap gap-2 sm:gap-8 justify-start">
                  {[{ id: 'general', label: '01. Details', icon: LayoutGrid }, { id: 'inventory', label: '02. Stock', icon: Layers }, { id: 'seo', label: '03. SEO', icon: Globe }, { id: 'logistics', label: '04. Shipping', icon: Truck }].map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="flex-grow sm:flex-grow-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none shadow-none px-0 h-12 gap-2 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">
                      <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <div className="flex-1 overflow-y-auto">
                <TabsContent value="general" className="p-4 sm:p-8 m-0 space-y-8 sm:space-y-12 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ImagesIcon className={cn("h-4 w-4", uploadProgress ? "text-blue-500 animate-pulse" : "text-gray-400")} />
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                        {uploadProgress 
                          ? `Uploading Media (${uploadProgress.current}/${uploadProgress.total})` 
                          : 'Media Selection'
                        }
                      </h3>
                    </div>
                    {uploadProgress && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300" 
                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-blue-600 tabular-nums">
                          {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                        </span>
                      </div>
                    )}
                    {!uploadProgress && media.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          const sorted = [...media].sort((a, b) => 
                            (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
                          );
                          setMedia(sorted);
                        }}
                        className="h-8 gap-2 font-bold uppercase tracking-widest text-[9px] text-gray-500 hover:text-black hover:bg-gray-100"
                      >
                        <ArrowUpDown className="h-3 w-3" /> Sort by Name
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {media.map((item, index) => (
                      <div 
                        key={index} 
                        draggable
                        onDragStart={() => handleDragStartMedia(index)}
                        onDragOver={(e) => handleDragOverMedia(e, index)}
                        onDragEnd={handleDragEndMedia}
                        className={cn(
                          "relative aspect-square bg-gray-100 border rounded-lg overflow-hidden group shadow-sm cursor-move touch-none transition-all duration-300",
                          draggedMediaIndex === index && "opacity-50 border-black ring-2 ring-black/5 scale-95"
                        )}
                      >
                        {item.type === 'video' ? (
                          <video src={item.url} className="absolute inset-0 w-full h-full object-cover" muted loop />
                        ) : item.type === 'image' ? (
                          <NextImage src={item.url} alt={`Media ${index}`} fill className="object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full bg-white gap-2">
                            <FileText className="h-6 w-6 text-gray-400" />
                            <span className="text-[8px] font-mono text-gray-500 truncate w-full px-2 text-center">{item.name || 'FILE'}</span>
                          </div>
                        )}
                        <button onClick={() => setMedia(media.filter((_, i) => i !== index))} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                        
                        <div className="absolute top-2 left-2 flex gap-1">
                          <Badge className={cn(
                            "text-[8px] font-bold uppercase tracking-widest h-5 px-1.5 border-none shadow-md",
                            index === 0 ? "bg-black text-white" : "bg-white/80 text-black backdrop-blur-sm"
                          )}>
                            {index === 0 ? 'Primary' : (index + 1).toString().padStart(2, '0')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <PlusCircle className="h-5 w-5 text-gray-400 group-hover:text-black transition-colors" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black">Add Media</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="*/*" onChange={handleMediaUpload} />
                  </div>
                  <section className="space-y-6 sm:space-y-8 bg-white p-4 sm:p-8 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[7px] font-bold uppercase tracking-tighter text-gray-400">AI Context</span>
                          <div className="flex gap-1 mt-0.5">
                            <Select value={aiTone} onValueChange={setAiTone}>
                              <SelectTrigger className="h-6 w-20 text-[8px] font-bold uppercase bg-gray-50 border-none shadow-none focus:ring-0">
                                <SelectValue placeholder="Tone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="luxurious" className="text-[8px] font-bold uppercase">Luxurious</SelectItem>
                                <SelectItem value="sporty" className="text-[8px] font-bold uppercase">Sporty</SelectItem>
                                <SelectItem value="minimalist" className="text-[8px] font-bold uppercase">Minimalist</SelectItem>
                                <SelectItem value="technical" className="text-[8px] font-bold uppercase">Technical</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select value={aiAudience} onValueChange={setAiAudience}>
                              <SelectTrigger className="h-6 w-20 text-[8px] font-bold uppercase bg-gray-50 border-none shadow-none focus:ring-0">
                                <SelectValue placeholder="Audience" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="premium" className="text-[8px] font-bold uppercase">Premium</SelectItem>
                                <SelectItem value="athletes" className="text-[8px] font-bold uppercase">Athletes</SelectItem>
                                <SelectItem value="gen-z" className="text-[8px] font-bold uppercase">Gen-Z</SelectItem>
                                <SelectItem value="collectors" className="text-[8px] font-bold uppercase">Collectors</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAiGenerate}
                          disabled={isGeneratingAi || !name}
                          className="h-10 px-4 gap-2 font-bold uppercase tracking-widest text-[9px] border-black hover:bg-black hover:text-white transition-all shadow-lg shadow-purple-100"
                        >
                          {isGeneratingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
                          Generate with AI
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2"><Info className="h-4 w-4 text-gray-400" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Product Details</h3></div>
                    <div className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Name <span className="text-red-500">*</span></Label><Input placeholder="e.g. Sculpted Merino Knit" value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-white" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Brand</Label><Input placeholder="e.g. FSLNO" value={brand} onChange={(e) => setBrand(e.target.value)} className="h-12 bg-white" /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Price ($) <span className="text-red-500">*</span></Label><Input type="number" placeholder="890" value={price} onChange={(e) => setPrice(e.target.value)} className="h-12 bg-white font-mono" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Regular Price ($)</Label><Input type="number" placeholder="1200" value={comparedPrice} onChange={(e) => setComparedPrice(e.target.value)} className="h-12 bg-white font-mono opacity-60" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Category <span className="text-red-500">*</span></Label>
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
                        <div className="space-y-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold text-gray-500">Key Features</Label>
                            <span className="text-[8px] font-bold text-gray-400">COMMA SEPARATED</span>
                          </div>
                          <Input placeholder="e.g. 100% Cotton, Adjustable Cuff, Premium Stitching" value={features} onChange={(e) => setFeatures(e.target.value)} className="h-12 bg-white" />
                        </div>
                        <div className="space-y-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase font-bold text-gray-500">Description</Label>
                          </div>
                          <Textarea className="min-h-[150px] resize-none bg-white p-4 text-sm" placeholder="Describe this product..." value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
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
                    <div className="flex items-center gap-6 flex-wrap justify-center sm:justify-end">
                      <div className="flex flex-col items-center gap-1.5 pt-2 px-2 border-r border-white/10 pr-6">
                        <Label className="text-[8px] uppercase font-bold text-gray-400">Sold Out Override</Label>
                        <Switch checked={isSoldOut} onCheckedChange={setIsSoldOut} className="data-[state=checked]:bg-red-500 scale-75"/>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 pt-2 px-2 border-r border-white/10 pr-6">
                        <Label className="text-[8px] uppercase font-bold text-orange-400">Low Stock Alert</Label>
                        <Input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="h-8 w-16 bg-white/10 border-white/20 text-white font-mono text-center text-[10px]" />
                      </div>
                      <div className="w-full sm:w-[200px] text-center sm:text-right"><Label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Master SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} className="bg-white/10 border-white/20 text-white font-mono mt-1 text-center sm:text-right h-11" /></div>
                    </div>
                  </div>
                  <div className="p-6 bg-orange-50 border border-orange-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <h3 className="text-xs font-bold uppercase tracking-widest text-orange-900">Pre-order</h3>
                      </div>
                      <p className="text-[9px] uppercase font-bold text-orange-700 tracking-tight">Enable pre-orders for this product.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {preorderEnabled && (
                        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                          <Label className="text-[8px] uppercase font-bold text-orange-400 mb-1 block">Shipping Estimate</Label>
                          <Input 
                            value={preorderEstimate} 
                            onChange={(e) => setPreorderEstimate(e.target.value.toUpperCase())} 
                            className="h-9 w-40 bg-white border-orange-200 text-[10px] font-bold uppercase tracking-widest"
                            placeholder="E.G. EST. 2-4 WEEKS"
                          />
                        </div>
                      )}
                      <Switch checked={preorderEnabled} onCheckedChange={handleToggleGlobalPreorder} className="data-[state=checked]:bg-orange-600"/>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Size Variants</h3>
                    <Button onClick={handleAddVariant} variant="outline" size="sm" className="h-8 gap-2 font-bold uppercase tracking-widest text-[9px] border-black">
                      <Plus className="h-3 w-3" /> Add Size
                    </Button>
                  </div>

                  <div className="flex flex-col border rounded-xl bg-white divide-y overflow-hidden shadow-sm">
                    {variants.map((v, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-4 p-3 hover:bg-gray-50/50 transition-colors group relative bg-white">
                        <div className="w-full sm:w-20"><Label className="text-[8px] uppercase font-bold text-gray-400">Size</Label><Input value={v.size} onChange={(e) => handleUpdateVariant(i, 'size', e.target.value)} className="h-9 font-bold uppercase transition-all duration-300" /></div>
                        <div className="flex-1 min-w-[150px]"><Label className="text-[8px] uppercase font-bold text-gray-400">SKU</Label><Input value={v.sku} onChange={(e) => handleUpdateVariant(i, 'sku', e.target.value)} className="h-9 font-mono text-[9px] transition-all duration-300" /></div>
                        <div className="w-full sm:w-32"><Label className="text-[8px] uppercase font-bold text-gray-400">In Stock</Label><Input type="number" value={v.stock} onChange={(e) => handleUpdateVariant(i, 'stock', parseInt(e.target.value) || 0)} className="h-9 font-mono transition-all duration-300" /></div>
                        <div className="w-full sm:w-24"><Label className="text-[8px] uppercase font-bold text-orange-400">Threshold</Label><Input type="number" value={v.lowStockThreshold} onChange={(e) => handleUpdateVariant(i, 'lowStockThreshold', parseInt(e.target.value) || 0)} className="h-9 font-mono transition-all duration-300" /></div>
                        <div className="flex flex-col items-center gap-1.5 pt-2 px-2"><Label className="text-[7px] uppercase font-bold text-gray-400">Pre-order</Label><Switch checked={v.isPreorder ?? false} onCheckedChange={(checked) => handleUpdateVariant(i, 'isPreorder', checked)} className="scale-75"/></div>
                        <div className="flex items-end pb-1 ml-auto">
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveVariant(i)} className="h-10 w-10 text-red-500 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {variants.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50 space-y-4 px-6 transition-all duration-300">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">No sizes defined.</p>
                          <p className="text-[8px] uppercase font-bold text-gray-400/80">Stock will be managed at the product level.</p>
                        </div>
                        <div className="max-w-[200px] mx-auto space-y-2 pt-2">
                          <Label className="text-[9px] uppercase font-bold text-gray-500">Manual Inventory</Label>
                          <div className="relative group">
                            <Input 
                              type="number" 
                              value={inventory} 
                              onChange={(e) => setInventory(e.target.value)} 
                              className="h-12 text-center font-headline text-2xl bg-white border-2 border-dashed border-gray-200 group-hover:border-black transition-all" 
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-bold text-gray-400">PCS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="seo" className="p-4 sm:p-8 m-0 space-y-8 max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-gray-400" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">SEO Settings</h3></div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleAiGenerate}
                      disabled={isGeneratingAi || !name}
                      className="h-8 gap-2 font-bold uppercase tracking-widest text-[9px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      {isGeneratingAi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Update with AI
                    </Button>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Meta Title</Label>
                      <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className="h-12 bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Meta Description</Label>
                      <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className="min-h-[120px] bg-white resize-none" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-500">URL Handle</Label>
                      <div className="flex items-center gap-2 border rounded-md px-3 bg-gray-50">
                        <span className="text-[10px] text-gray-400 hidden sm:inline">fslno.ca/products/</span>
                        <Input value={seoHandle} onChange={(e) => setSeoHandle(e.target.value)} className="border-none bg-transparent shadow-none px-0 h-12 flex-1" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="logistics" className="p-4 sm:p-8 m-0 space-y-12 max-w-5xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8"><div className="flex items-center gap-2 mb-2"><Scale className="h-4 w-4 text-gray-400" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Shipping Info</h3></div><div className="grid gap-6"><div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Weight (kg)</Label><Input type="number" step="0.01" placeholder={shippingConfig?.defaultWeight || "0.6"} value={weight} onChange={(e) => setWeight(e.target.value)} className="h-12 bg-white font-mono" /></div><div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-500">Shipping Type</Label><Select value={shippingClass} onValueChange={setShippingClass}><SelectTrigger className="h-12 bg-white"><SelectValue placeholder="Select type..." /></SelectTrigger><SelectContent><SelectItem value="standard" className="text-[10px] font-bold uppercase">Standard</SelectItem><SelectItem value="heavy" className="text-[10px] font-bold uppercase">Heavy</SelectItem><SelectItem value="fragile" className="text-[10px] font-bold uppercase">Fragile</SelectItem></SelectContent></Select></div></div></div>
                    <div className="space-y-8"><div className="flex items-center gap-2 mb-2"><Maximize2 className="h-4 w-4 text-gray-400" /><h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Box Dimensions</h3></div><div className="grid grid-cols-3 gap-4"><div className="space-y-2"><Label className="text-[8px] uppercase font-bold text-gray-400">L (cm)</Label><Input type="number" placeholder={shippingConfig?.defaultLength || "35"} value={length} onChange={(e) => setLength(e.target.value)} className="h-12 bg-white font-mono" /></div><div className="space-y-2"><Label className="text-[8px] uppercase font-bold text-gray-400">W (cm)</Label><Input type="number" placeholder={shippingConfig?.defaultWidth || "25"} value={width} onChange={(e) => setWidth(e.target.value)} className="h-12 bg-white font-mono" /></div><div className="space-y-2"><Label className="text-[8px] uppercase font-bold text-gray-400">H (cm)</Label><Input type="number" placeholder={shippingConfig?.defaultHeight || "10"} value={height} onChange={(e) => setHeight(e.target.value)} className="h-12 bg-white font-mono" /></div></div></div>
                  </div>
                </TabsContent>
              </div>
              <DialogFooter className="sticky bottom-0 p-4 sm:p-6 border-t bg-white/95 backdrop-blur-md z-50 shrink-0 flex flex-col sm:flex-row justify-end items-center gap-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                <Button onClick={handleSaveProduct} disabled={isSaving || !name || !price || !categoryId} className="w-full sm:w-auto h-12 px-12 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-black/90 transition-all">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}{editingId ? 'Save Changes' : 'Add Product'}
                </Button>
              </DialogFooter>
            </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>

      <div className="bg-white border border-[#e1e3e5] rounded-none overflow-hidden shadow-sm">
        {selectedIds.length > 0 && (
          <div className="sticky bottom-0 sm:static z-40 p-4 border-t sm:border-t-0 sm:border-b bg-white sm:bg-blue-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-2 sm:slide-in-from-top-2 duration-300 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] sm:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white rounded-none uppercase text-[9px] font-bold px-2 h-5 border-none">Selected Items</Badge>
                <span className="text-[10px] font-bold uppercase text-blue-700 tracking-widest">{selectedIds.length} Products Selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 border-blue-200 text-blue-700 font-bold uppercase tracking-widest text-[9px] gap-2 bg-white hover:bg-blue-50"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Bulk Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md bg-white border-none rounded-none shadow-2xl">
                    <DialogHeader className="pt-6">
                      <DialogTitle className="text-xl font-bold uppercase tracking-tight">Bulk Status Update</DialogTitle>
                      <DialogDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Update settings for {selectedIds.length} products.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Category</Label>
                        <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                          <SelectTrigger className="h-12 uppercase font-bold text-[10px]">
                            <SelectValue placeholder="SELECT CATEGORY" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keep" className="uppercase font-bold text-[10px]">Keep Current</SelectItem>
                            {categories?.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id} className="uppercase font-bold text-[10px]">{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Status</Label>
                        <Select value={bulkStatus} onValueChange={setBulkStatus}>
                          <SelectTrigger className="h-12 uppercase font-bold text-[10px]">
                            <SelectValue placeholder="SELECT STATUS" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keep" className="uppercase font-bold text-[10px]">Keep Current</SelectItem>
                            <SelectItem value="active" className="uppercase font-bold text-[10px]">Active</SelectItem>
                            <SelectItem value="draft" className="uppercase font-bold text-[10px]">Draft</SelectItem>
                            <SelectItem value="archived" className="uppercase font-bold text-[10px]">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Set Price ($)</Label>
                        <Input 
                          type="number" 
                          placeholder="Leave empty to keep current prices"
                          value={bulkPriceValue} 
                          onChange={(e) => setBulkPriceValue(e.target.value)} 
                          className="h-12 font-mono"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleBulkUpdate} 
                        disabled={isSaving || (!bulkCategoryId && !bulkStatus && !bulkPriceValue)} 
                        className="w-full bg-black text-white h-14 font-bold uppercase tracking-widest text-[10px]"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Update {selectedIds.length} Products
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                 <Dialog open={isBulkPriceOpen} onOpenChange={setIsBulkPriceOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 border-emerald-200 text-emerald-700 font-bold uppercase tracking-widest text-[9px] gap-2 bg-white hover:bg-emerald-50"
                    >
                      <DollarSign className="h-3.5 w-3.5" /> Edit Prices
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-none border-t-4 border-t-emerald-500">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-headline font-black uppercase tracking-tight">Bulk Price Editor</DialogTitle>
                      <DialogDescription className="text-[10px] uppercase font-bold text-gray-400">Apply changes to {selectedIds.length} products.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Action</Label>
                        <Select value={bulkPriceAction} onValueChange={(v: any) => setBulkPriceAction(v)}>
                          <SelectTrigger className="h-12 rounded-none border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none">
                            <SelectItem value="set" className="text-[10px] font-bold uppercase">Set to fixed amount</SelectItem>
                            <SelectItem value="increase_fixed" className="text-[10px] font-bold uppercase">Increase by fixed amount ($)</SelectItem>
                            <SelectItem value="increase_percent" className="text-[10px] font-bold uppercase">Increase by percentage (%)</SelectItem>
                            <SelectItem value="decrease_fixed" className="text-[10px] font-bold uppercase">Decrease by fixed amount ($)</SelectItem>
                            <SelectItem value="decrease_percent" className="text-[10px] font-bold uppercase">Decrease by percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-500">Value</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">
                            {bulkPriceAction.includes('percent') ? '%' : '$'}
                          </span>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            value={bulkPriceValue} 
                            onChange={(e) => setBulkPriceValue(e.target.value)} 
                            className="h-12 pl-8 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleBulkPriceUpdate} 
                        disabled={isSaving || !bulkPriceValue} 
                        className="w-full bg-emerald-600 text-white h-14 font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-700"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Update Prices
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDuplicate}
                  className="h-9 border-blue-200 text-blue-700 font-bold uppercase tracking-widest text-[9px] gap-2 bg-white hover:bg-blue-50"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBulkDelete}
                  disabled={isSaving}
                  className="h-9 border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase tracking-widest text-[9px] gap-2 flex-1 sm:flex-none"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedIds([])} className="h-9 w-9 text-blue-400 hover:text-blue-700 self-end sm:self-auto">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex border-b bg-white">
          <button 
            onClick={() => setStockFilter('all')} 
            className={cn(
              "px-8 h-14 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all relative overflow-hidden",
              stockFilter === 'all' ? "border-black text-black bg-gray-50/50" : "border-transparent text-gray-400 hover:text-black hover:bg-gray-50/30"
            )}
          >
            Product Management
          </button>
          <button 
            onClick={() => setStockFilter('low')} 
            className={cn(
              "px-8 h-14 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2",
              stockFilter === 'low' ? "border-black text-orange-600 bg-orange-50/10" : "border-transparent text-gray-400 hover:text-orange-600 hover:bg-orange-50/5"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", stockFilter === 'low' ? "bg-orange-500 animate-pulse" : "bg-gray-300")} />
            Low Stock
          </button>
          <button 
            onClick={() => setStockFilter('out')} 
            className={cn(
              "px-8 h-14 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2",
              stockFilter === 'out' ? "border-black text-red-600 bg-red-50/10" : "border-transparent text-gray-400 hover:text-red-600 hover:bg-red-50/5"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", stockFilter === 'out' ? "bg-red-500 animate-pulse" : "bg-gray-300")} />
            Out of Stock
          </button>
        </div>

        <div className="p-4 border-b bg-gray-50/50 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="relative w-full lg:flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9196]" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 pr-24 h-10 border-[#babfc3] focus:ring-black bg-white uppercase text-[10px] font-bold rounded-none" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <div className="absolute right-0 top-0 h-full flex items-center pr-1 gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={startVoiceSearch}
                className={cn(
                  "h-8 w-8 rounded-none transition-colors",
                  isListening ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-black hover:bg-gray-100"
                )}
              >
                <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsScannerOpen(true)}
                className="h-8 w-8 rounded-none text-gray-400 hover:text-black hover:bg-gray-100"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="lg:hidden flex items-center gap-3 mr-3 border-r pr-4 border-[#e1e3e5]">
                <Checkbox 
                  checked={isAllFilteredSelected ? true : isSomeFilteredSelected ? "indeterminate" : false} 
                  onCheckedChange={handleSelectAll} 
                  className="h-6 w-6 border-gray-300"
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">All</span>
              </div>
              <input type="file" ref={csvImportRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
              <Button variant="ghost" size="sm" onClick={() => csvImportRef.current?.click()} className="flex-1 sm:flex-none h-9 text-[9px] font-bold uppercase tracking-widest gap-2 bg-white border border-[#babfc3] rounded-none">
                <Upload className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Import CSV</span><span className="sm:hidden">Import</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportCSV} className="flex-1 sm:flex-none h-9 text-[9px] font-bold uppercase tracking-widest gap-2 bg-white border border-[#babfc3] rounded-none">
                <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export CSV</span><span className="sm:hidden">Export</span>
              </Button>
            </div>
            <Separator orientation="vertical" className="h-6 mx-1 hidden lg:block" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={sortBy} onValueChange={(v: string) => setSortBy(v)}>
                <SelectTrigger className="flex-1 sm:w-[140px] h-10 text-[9px] font-bold uppercase tracking-widest bg-white border-[#babfc3] rounded-none"><ArrowUpDown className="h-3 w-3 mr-2" /><span className="truncate">Sort</span></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-[10px] uppercase font-bold">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-[10px] uppercase font-bold">Oldest First</SelectItem>
                  <SelectItem value="name-asc" className="text-[10px] uppercase font-bold">Name: A - Z</SelectItem>
                  <SelectItem value="name-desc" className="text-[10px] uppercase font-bold">Name: Z - A</SelectItem>
                  <SelectItem value="price-high" className="text-[10px] uppercase font-bold">Price: High to Low</SelectItem>
                  <SelectItem value="price-low" className="text-[10px] uppercase font-bold">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="flex-1 sm:w-[140px] h-10 text-[9px] font-bold uppercase tracking-widest bg-white border-[#babfc3] rounded-none"><Filter className="h-3 w-3 mr-2" /><span className="truncate">{categoryFilter === 'all' ? 'Category' : categories?.find(c => c.id === categoryFilter)?.name}</span></SelectTrigger>
                <SelectContent><SelectItem value="all" className="text-[10px] uppercase font-bold">All</SelectItem>{categories?.map(c => (<SelectItem key={c.id} value={c.id} className="text-[10px] uppercase font-bold">{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-[#f6f6f7]">
              <TableRow className="hover:bg-transparent border-[#e1e3e5]">
                <TableHead className="w-[40px] px-4">
                  <Checkbox checked={isAllFilteredSelected ? true : isSomeFilteredSelected ? "indeterminate" : false} onCheckedChange={handleSelectAll} />
                </TableHead>
                <TableHead className="w-[80px] text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Image</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Product</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Category</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Custom</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Stock</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-[#5c5f62]">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading || categoriesLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <ProductListSkeleton />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-gray-400 uppercase text-[10px] font-bold tracking-[0.2em]">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product: any) => {
                  const category = categories?.find((c: any) => c.id === product.categoryId);
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <TableRow key={product.id} onClick={() => openEdit(product)} className={`transition-colors border-[#e1e3e5] group cursor-pointer ${isSelected ? 'bg-blue-50/30' : 'hover:bg-[#f6f6f7]/50'}`}>
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={isSelected} 
                          onCheckedChange={(checked) => {
                            const event = window.event as any;
                            handleToggleSelect(product.id, checked, event?.shiftKey);
                          }} 
                        />
                      </TableCell>
                      <TableCell><div className="w-16 h-16 bg-gray-100 relative overflow-hidden rounded border border-gray-100 flex items-center justify-center">{product.media?.[0]?.url ? (product.media[0].type === 'video' ? <video src={product.media[0].url} className="object-cover w-full h-full" /> : <NextImage src={product.media[0].url} alt={product.name} fill className="object-cover" />) : <Layers className="h-4 w-4 text-gray-300" />}</div></TableCell>
                      <TableCell><div className="flex flex-col"><span className="font-bold text-sm uppercase">{product.name}</span><div className="flex flex-wrap gap-2 items-center">{showBrand && product.brand && <span className="text-[9px] uppercase tracking-widest text-blue-600 font-bold bg-blue-50 px-1 rounded-sm">{product.brand}</span>}{showSku && <span className="text-[9px] uppercase tracking-widest text-[#8c9196] font-mono">{product.sku || 'No SKU'}</span>}</div></div></TableCell>
                      <TableCell><div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><Tag className="h-3 w-3" /> {category?.name || 'None'}</div></TableCell>
                      <TableCell>
                        {product.customizationEnabled ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] font-bold uppercase px-1.5 py-0.5 flex items-center gap-1 w-fit">
                            <Wand2 className="h-2.5 w-2.5" /> YES
                          </Badge>
                        ) : (
                          <span className="text-[8px] font-bold text-gray-300 uppercase">No</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        {(() => {
                          const totalStock = product.variants && product.variants.length > 0 
                            ? product.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
                            : (Number(product.inventory) || 0);
                          const isActuallyOut = product.isSoldOut || totalStock <= 0;
                          
                          const lowVariants = product.variants?.filter((v: any) => (Number(v.stock) || 0) > 0 && (Number(v.stock) || 0) <= 5);
                          const outVariants = product.variants?.filter((v: any) => (Number(v.stock) || 0) <= 0);

                          return (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] h-6 font-bold uppercase tracking-widest border-none px-2 w-fit",
                                    isActuallyOut 
                                      ? "bg-red-500 text-white animate-pulse" 
                                      : totalStock <= (Number(product.lowStockThreshold) || globalThreshold)
                                        ? "bg-orange-500 text-white" 
                                        : "bg-black text-white"
                                  )}
                                >
                                  {totalStock} PCS
                                </Badge>
                                {product.preorderEnabled && (
                                  <Badge variant="outline" className="text-[8px] h-5 font-bold uppercase bg-orange-100 text-orange-700 border-orange-200">PRE-ORDER</Badge>
                                )}
                                {outVariants?.length > 0 && (
                                  <Badge variant="outline" className="text-[8px] h-5 font-bold uppercase bg-red-50 text-red-600 border-red-100">
                                    {outVariants.length} Sizes Empty
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                  {product.variants?.map((v: any, idx: number) => {
                                    const variantStock = Number(v.stock) || 0;
                                    const variantThreshold = Number(v.lowStockThreshold) || globalVariantThreshold;
                                    if (variantStock > 0 && variantStock <= variantThreshold) {
                                      return (
                                        <span key={idx} className="text-[7px] font-bold text-orange-600 uppercase bg-orange-50 px-1 rounded-sm border border-orange-100">
                                          {v.size}: {v.stock} LEFT
                                        </span>
                                      );
                                    }
                                    return null;
                                  })}
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm font-semibold">C${formatCurrency(Number(product.price))}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          
          {/* Desktop Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-gray-50/30">
              <div className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                Displaying {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} Products
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 gap-2 font-bold uppercase tracking-widest text-[9px] border-[#babfc3]"
                >
                  <ChevronLeft className="h-3 w-3" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "h-8 w-8 p-0 font-bold text-[9px]",
                        currentPage === page ? "bg-black text-white" : "border-[#babfc3]"
                      )}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 gap-2 font-bold uppercase tracking-widest text-[9px] border-[#babfc3]"
                >
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:hidden divide-y">
          {productsLoading || categoriesLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">No products found.</div>
          ) : (
            paginatedProducts.map((product: any) => {
              const category = categories?.find((c: any) => c.id === product.categoryId);
              const isSelected = selectedIds.includes(product.id);
              return (
                <div key={product.id} onClick={() => openEdit(product)} className={cn("p-4 flex flex-col gap-4 bg-white transition-colors hover:bg-gray-50 border-b last:border-0", isSelected && "bg-blue-50/30")}>
                  <div className="flex items-start gap-4">
                    <div onClick={(e) => e.stopPropagation()} className="pt-2 -ml-1 pr-4">
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={(checked) => handleToggleSelect(product.id, checked)} 
                        className="h-7 w-7 rounded-sm border-gray-300"
                      />
                    </div>
                    <div className="w-16 h-20 bg-gray-100 relative overflow-hidden border shrink-0 shadow-sm">{product.media?.[0]?.url ? (product.media[0].type === 'video' ? <video src={product.media[0].url} className="object-cover w-full h-full" /> : <NextImage src={product.media[0].url} alt={product.name} fill className="object-cover" />) : <Layers className="h-6 w-6 text-gray-200" />}</div>
                    <div className="flex-1 min-0 space-y-1">
                      <div className="flex justify-between items-start gap-2"><h3 className="font-bold text-xs uppercase line-clamp-2 leading-tight">{product.name}</h3><span className="font-bold text-xs shrink-0">C${formatCurrency(Number(product.price))}</span></div>
                      {showSku && <p className="text-[9px] font-mono text-gray-400 uppercase truncate">SKU: {product.sku || 'N/A'}</p>}
                      {showBrand && product.brand && <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 w-fit rounded-sm mt-1">{product.brand}</p>}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className="text-[8px] h-4 font-bold uppercase tracking-tighter border-none bg-gray-100 text-gray-600 px-1.5"><Tag className="h-2 w-2 mr-1" /> {category?.name || 'None'}</Badge>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[8px] h-4 font-bold uppercase tracking-tighter border-none px-1.5",
                            (product.isSoldOut || (product.inventory || 0) <= 0) 
                              ? "bg-red-500 text-white animate-pulse" 
                              : (product.inventory || 0) <= (Number(product.lowStockThreshold) || globalThreshold) 
                                ? "bg-orange-500 text-white" 
                                : "bg-black text-white"
                          )}
                        >
                          {product.inventory || 0} {(product.isSoldOut || (product.inventory || 0) <= 0) ? 'OUT OF STOCK' : (product.inventory || 0) <= (Number(product.lowStockThreshold) || globalThreshold) ? 'LOW STOCK' : 'IN STOCK'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-300"><ChevronRight className="h-4 w-4" /></div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Mobile Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 p-6 bg-gray-50/50">
              <div className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                  className="flex-1 h-10 gap-2 font-bold uppercase tracking-widest text-[9px] border-[#babfc3]"
                >
                  <ChevronLeft className="h-3 w-3" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                  className="flex-1 h-10 gap-2 font-bold uppercase tracking-widest text-[9px] border-[#babfc3]"
                >
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 space-y-10 pt-8 border-t border-gray-100 pb-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings2 className="h-6 w-6 text-orange-500 fill-orange-500/5" strokeWidth={2.5} />
              <h2 className="text-[14px] uppercase tracking-[0.3em] font-heavy text-black">Global Storefront Controls</h2>
            </div>
            
            <div className="flex items-center gap-2">
              {isSaving ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
                  <Loader2 className="h-3 w-3 text-orange-500 animate-spin" />
                  <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-orange-600">Syncing Changes...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                  <CheckCircle2 className="h-3 w-3 text-gray-400" />
                  <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-gray-500">All Changes Saved</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Display Visibility Controls */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <LayoutGrid className="h-5 w-5 text-orange-500 fill-orange-500/5" strokeWidth={2.5} />
                <Label className="text-[12px] uppercase tracking-[0.25em] font-heavy text-orange-500">Storefront Layout</Label>
              </div>
              <div className="p-12 bg-white border-2 border-dashed border-orange-100 rounded-[2.5rem] space-y-10 shadow-sm/10">
                {/* Brand Toggle */}
                <div className="flex items-center gap-6 pb-6 border-b border-orange-50">
                  <button 
                    onClick={() => {
                      const newVal = !showBrand;
                      setShowBrand(newVal);
                      updateDisplayOptions('showBrandStorefront', newVal);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      showBrand ? "bg-black" : "bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white transition-all duration-300",
                      showBrand ? "opacity-100 scale-100" : "opacity-30 scale-75"
                    )} />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[12px] uppercase font-heavy tracking-[0.2em] text-black">All Brand Visibility</span>
                    <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-orange-400 mt-0.5">Toggle brand names on product cards</span>
                  </div>
                </div>

                {/* SKU Toggle */}
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => {
                      const newVal = !showSku;
                      setShowSku(newVal);
                      updateDisplayOptions('showSkuStorefront', newVal);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                      showSku ? "bg-black" : "bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white transition-all duration-300",
                      showSku ? "opacity-100 scale-100" : "opacity-30 scale-75"
                    )} />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[12px] uppercase font-heavy tracking-[0.2em] text-black">Global SKU Toggle</span>
                    <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-orange-400 mt-0.5">Toggle SKU display globally</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Alerts Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 fill-orange-500/5" strokeWidth={2.5} />
                <Label className="text-[12px] uppercase tracking-[0.25em] font-heavy text-orange-500">Inventory Alert Levels</Label>
              </div>
              <div className="p-12 bg-white border-2 border-dashed border-orange-100 rounded-[2.5rem] space-y-10 shadow-sm/10 flex flex-col">


                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-5">
                    <Label className="text-[12px] uppercase text-[#2d3748] font-heavy tracking-[0.12em]">Total Threshold</Label>
                    <Input 
                      type="number" 
                      value={globalLowStockThreshold} 
                      onChange={(e) => {
                        setGlobalLowStockThreshold(e.target.value);
                        setIsDirty(true);
                      }} 
                      disabled={isSaving}
                      className="h-24 text-4xl font-bold bg-white border-gray-100 rounded-lg focus-visible:ring-0 focus-visible:border-orange-200 transition-all px-8 text-left shadow-none hover:border-orange-100/50" 
                    />
                    <p className="text-[10px] text-orange-500 font-heavy uppercase tracking-[0.2em]">All sizes combined</p>
                  </div>
                  <div className="space-y-5">
                    <Label className="text-[12px] uppercase text-[#2d3748] font-heavy tracking-[0.12em]">Size Threshold</Label>
                    <Input 
                      type="number" 
                      value={globalVariantLowStockThreshold} 
                      onChange={(e) => {
                        setGlobalVariantLowStockThreshold(e.target.value);
                        setIsDirty(true);
                      }} 
                      disabled={isSaving}
                      className="h-24 text-4xl font-bold bg-white border-gray-100 rounded-lg focus-visible:ring-0 focus-visible:border-orange-200 transition-all px-8 text-left shadow-none hover:border-orange-100/50" 
                    />
                    <p className="text-[10px] text-orange-500 font-heavy uppercase tracking-[0.2em]">Per individual size</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-orange-50 mt-4">
                  <Button 
                    onClick={() => {
                      updateGlobalThresholds(globalLowStockThreshold, globalVariantLowStockThreshold);
                      setIsDirty(false);
                    }}
                    disabled={isSaving}
                    className={cn(
                      "w-full h-16 bg-black text-white font-heavy uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-xl transition-all duration-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] group",
                      isDirty && "ring-4 ring-orange-500/20 bg-orange-600"
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-3 text-white" />
                    ) : (
                      <Save className={cn("h-4 w-4 mr-3 transition-transform duration-500 group-hover:rotate-12", isDirty ? "text-white" : "text-orange-500")} />
                    )}
                    {isSaving ? 'Syncing To Products...' : (isDirty ? 'Save & Sync Now' : 'Sync All Settings')}
                  </Button>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.1em] text-center mt-4">Update all products in the database immediately.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ImageCropper
        image={cropQueue.length > 0 ? URL.createObjectURL(cropQueue[0]) : null}
        open={isCropperOpen}
        aspectRatio={1} // Product images are usually 1:1
        onCropComplete={handleCropComplete}
        onClose={() => setIsCropperOpen(false)}
      />

      {isScannerOpen && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {/* Floating Save Bar */}
      <div className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform",
        isDirty && !isSaving ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      )}>
        <div className="bg-black text-white px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center gap-8 backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[10px] font-heavy uppercase tracking-[0.2em] text-orange-500">Unsaved Changes</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400 mt-0.5">Global thresholds modified</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <Button 
            onClick={() => {
              updateGlobalThresholds(globalLowStockThreshold, globalVariantLowStockThreshold);
              setIsDirty(false);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white font-heavy uppercase tracking-[0.2em] text-[10px] h-11 px-8 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            <Save className="h-3.5 w-3.5 mr-2" /> Save & Sync Now
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}

