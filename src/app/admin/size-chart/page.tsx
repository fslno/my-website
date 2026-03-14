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
  X,
  Save
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

  const addColumn = () => { setColumns([...columns, '']); setRows(rows.map(row => ({ ...row, values: [...row.values, ''] }))); };
  const removeColumn = (index: number) => { if (columns.length <= 1) return; setColumns(columns.filter((_, i) => i !== index)); setRows(rows.map(row => ({ ...row, values: row.values.filter((_, i) => i !== index) }))); };
  const addRow = () => { setRows([...rows, { label: '', values: new Array(columns.length).fill('') }]); };
  const removeRow = (index: number) => { if (rows.length <= 1) return; setRows(rows.filter((_, i) => i !== index)); };
  const updateColumnLabel = (index: number, label: string) => { const updated = [...columns]; updated[index] = label; setColumns(updated); };
  const updateRowLabel = (index: number, label: string) => { const updated = [...rows]; updated[index].label = label; setRows(updated); };
  const updateValue = (rowIndex: number, colIndex: number, value: string) => { const updated = [...rows]; updated[rowIndex].values[colIndex] = value; setRows(updated); };

  const handleSave = () => {
    if (!db || !name) return;
    setIsSaving(true);
    const chartData = { name, unit, category, columns, rows, updatedAt: serverTimestamp() };
    
    if (editingId) {
      updateDoc(doc(db, 'sizeCharts', editingId), chartData)
        .then(() => { 
          setIsDialogOpen(false); 
          resetForm(); 
          toast({ title: "Updated", description: "Guide saved." }); 
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
          toast({ title: "Created", description: "Guide created." }); 
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
    if (!db || !confirm("Delete size guide?")) return; 
    
    const chartRef = doc(db, 'sizeCharts', id);
    deleteDoc(chartRef)
      .then(() => {
        toast({ title: "Deleted", description: "Guide removed." });
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `sizeCharts/${id}`,
          operation: 'delete',
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
    setColumns(chart.columns || []); 
    setRows(chart.rows || []); 
    setEditingId(chart.id); 
    setIsDialogOpen(true); 
  };

  return (
    <div className="space-y-8 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1e]">Size Guides</h1>
          <p className="text-[#5c5f62] mt-1 text-[10px] sm:text-sm uppercase font-medium tracking-tight">Reusable measurement templates.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white font-bold h-10 gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Create Guide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[100vw] w-screen h-screen m-0 rounded-none bg-white flex flex-col p-0 border-none">
            <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-lg font-headline font-bold uppercase tracking-tight">
                {editingId ? `Edit: ${name}` : 'New Guide'}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-6xl mx-auto w-full">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-none border">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Guide Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-gray-500">Unit</Label>
                    <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                      <SelectTrigger className="h-12 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm" className="text-[10px] font-bold uppercase">Centimeters (cm)</SelectItem>
                        <SelectItem value="inch" className="text-[10px] font-bold uppercase">Inches (in)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Measurements</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addColumn} className="h-8 text-[9px] uppercase font-bold border-black bg-white">
                      <Plus className="h-3 w-3 mr-1" /> Add Column
                    </Button>
                    <Button variant="outline" size="sm" onClick={addRow} className="h-8 text-[9px] uppercase font-bold border-black bg-white">
                      <Plus className="h-3 w-3 mr-1" /> Add Row
                    </Button>
                  </div>
                </div>

                <div className="md:hidden space-y-4 bg-gray-50 p-4 border border-dashed rounded-none">
                  <Label className="text-[9px] uppercase font-bold text-gray-400">Column Titles</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {columns.map((col, i) => (
                      <div key={i} className="flex gap-1">
                        <Input 
                          value={col} 
                          onChange={(e) => updateColumnLabel(i, e.target.value)} 
                          className="h-8 text-[9px] font-bold uppercase bg-white rounded-none" 
                          placeholder={`Title ${i+1}`}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeColumn(i)} 
                          className="h-8 w-8 text-red-500 shrink-0" 
                          disabled={columns.length <= 1}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block border rounded-none overflow-x-auto bg-white shadow-sm scrollbar-hide">
                  <Table className="min-w-[600px]">
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-widest p-4">Size Label</TableHead>
                        {columns.map((col, i) => (
                          <TableHead key={i} className="p-0 border-l min-w-[120px]">
                            <div className="flex items-center p-2 group">
                              <Input 
                                value={col} 
                                onChange={(e) => updateColumnLabel(i, e.target.value)} 
                                className="h-8 text-[9px] font-bold text-center border-none bg-transparent" 
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeColumn(i)} 
                                className="h-6 w-6 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                                disabled={columns.length <= 1}
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
                        <TableRow key={rowIdx} className="hover:bg-gray-50/30 border-b">
                          <TableCell className="p-2 border-r bg-gray-50/10">
                            <Input 
                              value={row.label} 
                              onChange={(e) => updateRowLabel(rowIdx, e.target.value)} 
                              className="h-10 text-[10px] font-bold uppercase border-none bg-transparent" 
                            />
                          </TableCell>
                          {row.values.map((val, colIdx) => (
                            <TableCell key={colIdx} className="p-0 border-r">
                              <Input 
                                value={val} 
                                onChange={(e) => updateValue(rowIdx, colIdx, e.target.value)} 
                                className="h-10 text-center border-none bg-transparent text-xs font-mono" 
                              />
                            </TableCell>
                          ))}
                          <TableCell className="p-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeRow(rowIdx)} 
                              className="h-8 w-8 text-gray-300 hover:text-red-500" 
                              disabled={rows.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-4">
                  {rows.map((row, rowIdx) => (
                    <Card key={rowIdx} className="rounded-none border shadow-none bg-white overflow-hidden">
                      <CardHeader className="py-3 px-4 bg-gray-50/50 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Label className="text-[9px] uppercase font-bold text-gray-400">Size</Label>
                          <Input 
                            value={row.label} 
                            onChange={(e) => updateRowLabel(rowIdx, e.target.value)} 
                            className="h-8 w-24 text-[10px] font-bold uppercase bg-white border-black/10 rounded-none" 
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeRow(rowIdx)} 
                          className="h-8 w-8 text-red-500" 
                          disabled={rows.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-2 gap-4">
                        {columns.map((col, colIdx) => (
                          <div key={colIdx} className="space-y-1.5">
                            <Label className="text-[8px] uppercase font-bold text-gray-400 truncate tracking-widest block">
                              {col || `Col ${colIdx+1}`}
                            </Label>
                            <Input 
                              value={row.values[colIdx]} 
                              onChange={(e) => updateValue(rowIdx, colIdx, e.target.value)} 
                              className="h-10 text-[11px] font-mono rounded-none" 
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
            <DialogFooter className="p-6 border-t bg-gray-50/50 shrink-0">
              <Button onClick={handleSave} disabled={isSaving || !name} className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl rounded-none">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}
                Save Guide
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border rounded-none overflow-hidden shadow-sm">
        <div className="hidden lg:block">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest p-6">Template Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Unit</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Category</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-300" /></TableCell></TableRow>
              ) : !charts || charts.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 text-[10px] font-bold uppercase text-gray-400">No guides created.</TableCell></TableRow>
              ) : charts?.map((chart: any) => (
                <TableRow key={chart.id} className="hover:bg-gray-50/30 border-b last:border-0 cursor-pointer group" onClick={() => openEdit(chart)}>
                  <TableCell className="p-6"><span className="font-bold text-sm uppercase tracking-tight">{chart.name}</span></TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-bold uppercase bg-black text-white border-none px-2 py-0.5 rounded-none">{chart.unit}</Badge></TableCell>
                  <TableCell><span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{chart.category || 'N/A'}</span></TableCell>
                  <TableCell className="pr-6">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={e => handleDelete(chart.id, e)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="lg:hidden divide-y">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : !charts || charts.length === 0 ? (
            <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-bold tracking-widest">Empty manifest.</div>
          ) : charts?.map((chart: any) => (
            <div key={chart.id} onClick={() => openEdit(chart)} className="p-4 bg-white flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div className="space-y-1">
                <p className="font-bold text-xs uppercase tracking-tight">{chart.name}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[7px] font-bold uppercase border-none bg-black text-white px-1.5">{chart.unit}</Badge>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">{chart.category || 'NO TAG'}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={e => handleDelete(chart.id, e)} className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
