// dealer-bill-form.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type Category = { id: number; name: string };
type Dealer = { id: number; name: string };

const dealerSchema = z.object({
  categoryName: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  contact: z.string().min(1, 'Contact is required'),
  address: z.string().min(1, 'Address is required'),
});

const billSchema = z.object({
  categoryId:  z.coerce.number(),
  dealerId:  z.coerce.number(),
  file: z.any(),
  date: z.string().min(1),
  uniqueNo: z.string().min(1),
  chequeNo: z.string().min(1),
  totalAmount: z.string().min(1),
  less: z.string().min(1),
});

type DealerFormData = z.infer<typeof dealerSchema>;
type BillFormData = z.infer<typeof billSchema>;

export default function DealerForm() {
  const [mode, setMode] = useState<'dealer' | 'bill'>('dealer');
  const [categories, setCategories] = useState<Category[]>([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingCatLoading, setCreatingCatLoading] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);


 
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const form = useForm<DealerFormData>({
    resolver: zodResolver(dealerSchema),
    defaultValues: { categoryName: '', name: '', contact: '', address: '' },
  });

  const billForm = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      categoryId: 0 ,
      dealerId:0 ,
      file: null,
      date: '',
      uniqueNo: '',
      chequeNo: '',
      totalAmount: '',
      less: '',
    },
  });

  useEffect(() => {
    axios.get('/api/dealer').then(res => setCategories(res.data.categories || []));
  }, []);

  useEffect(() => {
    const sub = billForm.watch((value, { name }) => {
      if (name === 'categoryId' && value.categoryId) {
        axios.get(`/api/dealer?categoryId=${value.categoryId}`)
          .then(res => setDealers(res.data.dealers))
          .catch(console.error);
      }
    });
    return () => sub.unsubscribe();
  }, [billForm]);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    setCreatingCatLoading(true);
    try {
      const res = await axios.post('/api/dealer', { categoryName: newCategory });
      const created = res.data.category;
      setCategories(prev => [...prev, created]);
      form.setValue('categoryName', created.name);
      setNewCategory('');
      setCreatingCategory(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error creating category');
    } finally {
      setCreatingCatLoading(false);
    }
  };


  const handleDealerSubmit = async (data: DealerFormData) => {
    console.log(data)
    setMessage('');
    try {
      await axios.post('/api/dealer', data);
      form.reset();
      setMessage('Dealer created');
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Error');
    }
  };

  const handleBillSubmit = async (data: BillFormData) => {
    setMessage('');
    if (!file) return alert('Upload a file');
    const category = categories.find(c => c.id == (data.categoryId));
    console.log("category", category);
    console.log("dealers",dealers)
    
    const dealer = dealers.find(d => d.id === data.dealerId);

    const billPayload = {
      name: dealer?.name || '',
      categoryName: category?.name || '',
      billData: {
        date: new Date(data.date).toISOString(),
        uniqueNo: data.uniqueNo,
        chequeNo: data.chequeNo,
        totalAmount: parseFloat(data.totalAmount),
        less: parseFloat(data.less),
      },
    };

    const formData = new FormData();
    formData.append('json', JSON.stringify(billPayload));
    formData.append('file', file);
    console.log(formData)

    try {
      await axios.post('/api/dealer', formData);
      billForm.reset();
      setFile(null);
      setMessage('Bill created');
    } catch (e: any) {
      setMessage(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Switch checked={mode === 'bill'} onCheckedChange={() => setMode(mode === 'dealer' ? 'bill' : 'dealer')} />
        <span>{mode === 'dealer' ? 'Add New bill' : 'close button to create New dealer'}</span>
      </div>

      {mode === 'dealer' ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDealerSubmit)} className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch checked={creatingCategory} onCheckedChange={setCreatingCategory} />
              <span className="text-sm text-muted-foreground">Create new category</span>
            </div>

            <FormField name="categoryName" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  {creatingCategory ? (
                    <div className="flex gap-2">
                      <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category" />
                      <Button type="button" onClick={handleCreateCategory} disabled={creatingCatLoading}>
                        {creatingCatLoading ? 'Creating...' : 'Add'}
                      </Button>
                    </div>
                  ) : (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Dealer Name</FormLabel>
                <FormControl><Input {...field} placeholder="Enter dealer name" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="contact" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Contact</FormLabel>
                <FormControl><Input {...field} placeholder="Enter contact number" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField name="address" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl><Input {...field} placeholder="Enter address" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Dealer'}</Button>
          </form>
        </Form>
      ) : (
        <Form key={mode} {...billForm}>
          <form onSubmit={billForm.handleSubmit(handleBillSubmit)} className="space-y-4">
          <FormField name="categoryId" control={billForm.control} render={({ field }) => (
  <FormItem>
    <FormLabel>Category</FormLabel>
    <FormControl>
      <Select value={String(field.value)} onValueChange={(val) => field.onChange(Number(val))}>
        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  </FormItem>
)} />

<FormField name="dealerId" control={billForm.control} render={({ field }) => (
  <FormItem>
    <FormLabel>Dealer</FormLabel>
    <FormControl>
      <Select value={String(field.value)} onValueChange={(val) => field.onChange(Number(val))}>
        <SelectTrigger><SelectValue placeholder="Select dealer" /></SelectTrigger>
        <SelectContent>
          {dealers.map(dealer => (
            <SelectItem key={dealer.id} value={String(dealer.id)}>{dealer.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormControl>
  </FormItem>
)} />

            <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />

            <FormField name="date" control={billForm.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField name="uniqueNo" control={billForm.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Unique No</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField name="chequeNo" control={billForm.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Cheque No</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField name="totalAmount" control={billForm.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Total Amount</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />

            <FormField name="less" control={billForm.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Less</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />

            <Button type="submit">Submit Bill</Button>
          </form>
        </Form>
      )}

      {message && <div className="text-sm text-green-600">{message}</div>}
    </div>
  );
}
