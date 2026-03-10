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
  Ruler, 
  MoreHorizontal,
  X,
  PlusCircle,
  Settings2,
  Table as TableIcon,
  Tag
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
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

interface RowData {
  label: string;
  values: string[];
}

export default function SizeChartPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const chartsQuery = useMemoFirebase(() => db ? collection(db, 'sizeCharts') : null, [db]);
  const { data: charts, isLoading: loading } = useCollection(chartsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Dynamic Form State
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
  const [category, setCategory] = useState('');
  const [columns, setColumns] = useState<string[]>(['Chest', 'Length', 'Shoulder']);
  const [rows, setRows] = useState<RowData[]>([
    { label: 'XS', values: ['', '', ''] },
    { label: 'S', values: ['', '', ''] },
    { label: 'M', values: ['', '', ''] },
    { label: 'L', values: ['', '', ''] },
    { label: 'XL', values: ['', '', ''] }
  ]);

  const addColumn = () => {
    setColumns([...columns, '']);
    setRows(rows.map(row => ({ ...row, values: [...row.values, ''] })));
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, i) => i !== index));
    setRows(rows.map(row => ({
      ...row,
      values: row.values.filter((_, i) => i !== index)
    })));
  };

  const addRow = () => {
    setRows([...rows, { label: '', values: new Array(columns.length).fill('') }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateColumnLabel = (index: number, label: string) => {
    const updated = [...columns];
    updated[index] = label;
    setColumns(updated);
  };

  const updateRowLabel = (index: number, label: string) => {
    const updated = [...rows];
    updated[index].label = label;
    setRows(updated);
  };

  const updateValue = (rowIndex: number, colIndex: number, value: string) => {
    const updated = [...rows];
    updated[rowIndex].values[colIndex] = value;
    setRows(updated);
  };

  const handleSave = () => {
    if (!db || !name) return;
    setIsSaving(true);
    
    const chartData = { 
      name, 
      unit, 
      category,
      columns,
      rows,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      updateDoc(doc(db, 'sizeCharts', editingId), chartData)
        .then(() => {
          setIsDialogOpen(false);
          resetForm();
          toast({ title: "Chart Updated", description: `${name} has been updated.` });
        })
        .catch((error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `sizeCharts/${editingId}`,
            operation: 'update',
            requestResourceData: chartData
          }));
        })
        .finally(() => setIsSaving(false));
    } else {
      addDoc(collection(db, 'sizeCharts'), { ...chartData, createdAt: serverTimestamp() })
        .then(() => {
          setIsDialogOpen(false);
          resetForm();
          toast({ title: "Chart Created", description: `${name} has been added.` });
        })
        .catch((error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'sizeCharts',
            operation: 'create',
            requestResourceData: chartData
          }));
        })
        .finally(() => setIsSaving(false));
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db) return;
    deleteDoc(doc(db, 'sizeCharts', id)).catch((error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `sizeCharts/${id}`,
        operation: 'delete'
      }));
    });
  };

  const resetForm = () => {
    setName('');
    setUnit('cm');
    setCategory('');
    setColumns(['Chest', 'Length', 'Shoulder']);
    setRows([
      { label: 'XS', values: ['', '', ''] },
      { label: 'S', values: ['', '', ''] },
      { label: 'M', values: ['', '', ''] },
      { label: 'L', values: ['', '', ''] },
      { label: 'XL', values: ['', '', ''] }
    ]);
    setEditingId(null);
  };

  const openEdit = (chart: any) => {
    setName(chart.name || '');
    setUnit(chart.unit || 'cm');
    setCategory(chart.category || '');
    setColumns(chart.columns || ['Chest', 'Length', 'Shoulder']);
    setRows(chart.rows || []);
    setEditingId(chart.id);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Size Charts</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Create reusable measurement guides for your products.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-bold h-10 gap-2">
              <Plus className="h-4 w-4" /> Create Chart
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none bg-white flex flex-col p-0 border-none">
            <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-xl font-headline font-bold">
                {editingId ? `Edit Guide: ${name}` : 'New Measurement Guide'}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-6xl mx-auto w-full p-8 space-y-12">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 p-8 rounded-xl border border-gray-100">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings2 className="h-4 w-4 text-gray-400" />
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Configuration</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Chart Name</Label>
                        <Input 
                          placeholder="e.g. Mens Jersey Guide" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          className="h-12 bg-white text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Category Tag</Label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="e.g. Tops" 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            className="h-12 bg-white text-sm pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Unit of Measure</Label>
                      <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">Centimeters (cm)</SelectItem>
                          <SelectItem value="inch">Inches (in)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center border-l pl-8 border-gray-100">
                    <div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white">
                        <Ruler className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Global Template</p>
                        <p className="text-xs text-gray-500">This guide can be linked to any category in your store.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableIcon className="h-4 w-4 text-gray-400" />
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Measurement Matrix</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={addColumn} className="h-9 px-4 gap-2 uppercase tracking-widest font-bold text-[10px]">
                        <PlusCircle className="h-4 w-4" /> Add Column
                      </Button>
                      <Button variant="outline" size="sm" onClick={addRow} className="h-9 px-4 gap-2 uppercase tracking-widest font-bold text-[10px]">
                        <PlusCircle className="h-4 w-4" /> Add Row
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-widest text-gray-400 p-6">
                            Size \ Metric
                          </TableHead>
                          {columns.map((col, colIdx) => (
                            <TableHead key={colIdx} className="p-0 border-l min-w-[140px]">
                              <div className="flex items-center p-4 group">
                                <Input 
                                  value={col} 
                                  onChange={(e) => updateColumnLabel(colIdx, e.target.value)}
                                  placeholder="Metric"
                                  className="h-10 text-[10px] font-bold uppercase tracking-[0.1em] text-center border-none bg-transparent focus-visible:ring-1 focus-visible:ring-black"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeColumn(colIdx)} 
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, rowIdx) => (
                          <TableRow key={rowIdx} className="hover:bg-gray-50/30 group/row border-b last:border-0">
                            <TableCell className="p-0 border-r bg-gray-50/20">
                              <div className="flex items-center p-4">
                                <Input 
                                  value={row.label} 
                                  onChange={(e) => updateRowLabel(rowIdx, e.target.value)}
                                  placeholder="Size"
                                  className="h-10 text-xs font-bold border-none bg-transparent focus-visible:ring-1 focus-visible:ring-black"
                                />
                              </div>
                            </TableCell>
                            {row.values.map((val, colIdx) => (
                              <TableCell key={colIdx} className="p-0 border-r">
                                <Input 
                                  value={val} 
                                  onChange={(e) => updateValue(rowIdx, colIdx, e.target.value)}
                                  className="h-12 text-sm text-center border-none bg-transparent focus-visible:ring-1 focus-visible:ring-black"
                                  placeholder="--"
                                />
                              </TableCell>
                            ))}
                            <TableCell className="text-right p-4">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeRow(rowIdx)} 
                                className="h-10 w-10 opacity-0 group-hover/row:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                                disabled={rows.length <= 1}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              </div>
            </div>

            <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !name}
                className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[11px] hover:bg-black/90 transition-all shadow-xl"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : null}
                {isSaving ? 'Saving Changes...' : 'Save Size Chart'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : charts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-gray-50/50">
            <Ruler className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-500">No size charts found. Start by creating a template.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500 p-6">Template Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Unit</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category Tag</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Structure</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charts?.map((chart: any) => (
                  <TableRow 
                    key={chart.id} 
                    className="hover:bg-gray-50/50 group border-b last:border-0 cursor-pointer"
                    onClick={() => openEdit(chart)}
                  >
                    <TableCell className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{chart.name}</span>
                        <span className="text-[10px] text-gray-400 mt-0.5">Updated {chart.updatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded tracking-widest">{chart.unit}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{chart.category || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-500">
                      {chart.rows?.length || 0} Sizes × {chart.columns?.length || 0} Metrics
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={(e) => handleDelete(chart.id, e)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
