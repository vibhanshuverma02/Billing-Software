'use client' ;

import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { verifySchema } from '@/schema/verifySchema'
import { ApiResponse } from '@/type/ApiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@react-email/components'
import axios, { AxiosError } from 'axios'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import React from 'react'
import {  useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z  from 'zod'

export default function VerifyAccount () {
    const router = useRouter()
    const param = useParams<{username: string}>()
    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
       
      });
  const onSubmit = async (data:z.infer<typeof verifySchema>) =>{
    try{
     const response=   await axios.post('/api/verify-code',{
          username: param.username,
          code : data.code
        })
        toast(
            response.data.message,
        )
        router.replace('/sign-in')
    }
    catch(error){
        console.error('Error during sign-up:', error);
        
              const axiosError = error as AxiosError<ApiResponse>;
        
              // Default error message
              const errorMessage = axiosError.response?.data.message || 'There was a problem with your sign-up. Please try again.';
        
              toast(
               errorMessage
                //variant: 'destructive',
              );
            }
          };
    
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            verify your account
          </h1>
          <p className="mb-4">Enter verification code recieved on your EmailId</p>

        </div>
        <div>
        <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <Input  {...field} />
              {/* <FormControl>
                <Input placeholder="code" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription> */}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
        </div>
        </div>
    </div>
  );
}

// export default verifyaccount
