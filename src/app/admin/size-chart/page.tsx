
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
  ChevronRight
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

interface Measurement {
  label: string;
  xs: string;
  s: string;
  m: string;
  l: string;
  xl: string;
}

export default function SizeChartPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const chartsQuery = useMemoFirebase(() => db ? collection(db, 'sizeCharts') : null, [db]);
  const { data: charts, loading } = useCollection(chartsQuery);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');
  const [measurements, setMeasurements] = useState<Measurement[]>([
    { label: 'Chest', xs: '', s: '', m: '', l: '', xl: '' },
    { label: 'Length', xs: '', s: '', m: '', l: '', xl: '' }
  ]);

  const addMeasurementRow = () => {
    setMeasurements([...measurements, { label: '', xs: '', s: '', m: '', l: '', xl: '' }]);
  };

  const removeMeasurementRow = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const updateMeasurement = (index: number, field: keyof Measurement, value: string) => {
    const updated = [...measurements];
    updated[index] = { ...updated[index], [field]: value };
    setMeasurements(updated);
  };

  const handleSave = () => {
    if (!db || !name) return;
    setIsSaving(true);
    
    const chartData = { name, unit, measurements };

    addDoc(collection(db, 'sizeCharts'), chartData)
      .then(() => {
        setIsDialogOpen(false);
        resetForm();
        toast({ title: "Size Chart Created", description: `${name} has been added to the library.` });
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
    setMeasurements([
      { label: 'Chest', xs: '', s: '', m: '', l: '', xl: '' },
      { label: 'Length', xs: '', s: '', m: '', l: '', xl: '' }
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
          <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-headline">New Measurement Guide</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold text-gray-500">Template Name</Label>
                  <Input 
                    placeholder="e.g. Oversized Heavyweight Hoodie" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest font-bold text-gray-500">Unit of Measure</Label>
                  <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
                    <SelectTrigger>
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
                <Label className="text-xs uppercase tracking-widest font-bold text-gray-500">Measurement Matrix</Label>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[180px]">Point of Measure</TableHead>
                        <TableHead>XS</TableHead>
                        <TableHead>S</TableHead>
                        <TableHead>M</TableHead>
                        <TableHead>L</TableHead>
                        <TableHead>XL</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {measurements.map((m, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input 
                              placeholder="e.g. Sleeve Length" 
                              value={m.label} 
                              onChange={(e) => updateMeasurement(idx, 'label', e.target.value)}
                              className="h-8 text-xs font-bold"
                            />
                          </TableCell>
                          <TableCell><Input className="h-8 text-xs" value={m.xs} onChange={(e) => updateMeasurement(idx, 'xs', e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8 text-xs" value={m.s} onChange={(e) => updateMeasurement(idx, 's', e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8 text-xs" value={m.m} onChange={(e) => updateMeasurement(idx, 'm', e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8 text-xs" value={m.l} onChange={(e) => updateMeasurement(idx, 'l', e.target.value)} /></TableCell>
                          <TableCell><Input className="h-8 text-xs" value={m.xl} onChange={(e) => updateMeasurement(idx, 'xl', e.target.value)} /></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeMeasurementRow(idx)} className="h-8 w-8 text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-2 bg-gray-50 border-t">
                    <Button variant="ghost" size="sm" onClick={addMeasurementRow} className="text-xs gap-2">
                      <Plus className="h-3 w-3" /> Add Measurement Row
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !name}
                className="w-full bg-black text-white h-12 font-bold uppercase tracking-widest text-xs"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Template
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
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Measurement Points</TableHead>
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
                      {chart.measurements?.length || 0} points defined
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
