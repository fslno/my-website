
'use client';

import React, { useState, useEffect } from 'react';
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
  X
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
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RowData {
  label: string;
  values: string[];
}

export default function SizeChartPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const chartsQuery = useMemoFirebase(() => db ? collection(db, 'sizeCharts') : null, [db]);
  const { data: charts, loading } = useCollection(chartsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dynamic Form State
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
  const [columns, setColumns] = useState<string[]>(['Chest', 'Length']);
  const [rows, setRows] = useState<RowData[]>([
    { label: 'XS', values: ['', ''] },
    { label: 'S', values: ['', ''] },
    { label: 'M', values: ['', ''] },
    { label: 'L', values: ['', ''] },
    { label: 'XL', values: ['', ''] }
  ]);

  const addColumn = () => {
    setColumns([...columns, 'New Point']);
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
    setRows([...rows, { label: 'Size', values: new Array(columns.length).fill('') }]);
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
      columns,
      rows 
    };

    addDoc(collection(db, 'sizeCharts'), chartData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Size Chart Created", description: `${name} has been added to your library.` });
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'sizeCharts',
          operation: 'create',
          requestResourceData: chartData
        }));
      })
      .finally(() => setIsSaving(false));
  };

  const handleDelete = (id: string) => {
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
    setColumns(['Chest', 'Length']);
    setRows([
      { label: 'XS', values: ['', ''] },
      { label: 'S', values: ['', ''] },
      { label: 'M', values: ['', ''] },
      { label: 'L', values: ['', ''] },
      { label: 'XL', values: ['', ''] }
    ]);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1c1e]">Size Chart Library</h1>
          <p className="text-[#5c5f62] mt-1 text-sm">Create reusable measurement guides for your luxury drops.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-bold h-10 gap-2">
              <Plus className="h-4 w-4" /> Create Chart
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-headline">New Measurement Guide</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Template Name</Label>
                  <Input 
                    placeholder="e.g. Oversized Heavyweight Hoodie" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Unit of Measure</Label>
                  <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">Centimeters (cm)</SelectItem>
                      <SelectItem value="inch">Inches (in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Measurement Matrix</Label>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={addColumn} className="text-[10px] uppercase tracking-widest font-bold gap-2">
                      <Plus className="h-3 w-3" /> Add Measure Column
                    </Button>
                    <Button variant="ghost" size="sm" onClick={addRow} className="text-[10px] uppercase tracking-widest font-bold gap-2">
                      <Plus className="h-3 w-3" /> Add Size Row
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md overflow-x-auto bg-gray-50/30">
                  <Table className="min-w-[800px]">
                    <TableHeader className="bg-gray-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[150px] text-[10px] font-bold uppercase tracking-widest">
                          Size \ Measure
                        </TableHead>
                        {columns.map((col, colIdx) => (
                          <TableHead key={colIdx} className="p-0 border-l min-w-[120px]">
                            <div className="flex items-center p-2 group">
                              <Input 
                                value={col} 
                                onChange={(e) => updateColumnLabel(colIdx, e.target.value)}
                                className="h-8 text-[10px] font-bold uppercase tracking-widest text-center border-none bg-transparent focus-visible:ring-1 focus-visible:ring-black"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeColumn(colIdx)} 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, rowIdx) => (
                        <TableRow key={rowIdx} className="bg-white hover:bg-white group/row">
                          <TableCell className="p-0 border-r">
                            <div className="flex items-center p-2">
                              <Input 
                                value={row.label} 
                                onChange={(e) => updateRowLabel(rowIdx, e.target.value)}
                                className="h-9 text-xs font-bold border-none bg-transparent focus-visible:ring-1 focus-visible:ring-black"
                              />
                            </div>
                          </TableCell>
                          {row.values.map((val, colIdx) => (
                            <TableCell key={colIdx} className="p-0 border-r">
                              <Input 
                                value={val} 
                                onChange={(e) => updateValue(rowIdx, colIdx, e.target.value)}
                                className="h-9 text-xs text-center border-none bg-transparent focus-visible:ring-1 focus-visible:ring-black"
                                placeholder="--"
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeRow(rowIdx)} 
                              className="h-8 w-8 opacity-0 group-hover/row:opacity-100 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !name}
                className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-[10px]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Template to Library
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
          <div className="bg-white border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Template Name</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Unit</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Structure</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charts?.map((chart: any) => (
                  <TableRow key={chart.id} className="hover:bg-gray-50/50 group">
                    <TableCell className="font-bold text-sm">{chart.name}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-0.5 rounded">{chart.unit}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {chart.rows?.length || 0} Sizes × {chart.columns?.length || 0} Measures
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(chart.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
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
