'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { signInSchema } from '@/schema/signInSchema';
import SessionLogger from '@/components/ui/session_logger';

export default function SignInForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [status, router]);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

const onSubmit = async (data: z.infer<typeof signInSchema>) => {
  setIsSubmitting(true);

  const result = await signIn('credentials', {
    redirect: false,
    identifier: data.identifier,
    password: data.password,
  });

  if (result?.error) {
    try {
      const parsed = JSON.parse(result.error);
      toast.error(parsed.error || 'Login failed');
    } catch {
      toast.error(result.error === 'CredentialsSignin' ? 'Incorrect username or password' : result.error);
    }
  } else if (result?.ok) {
    sessionStorage.removeItem('splashShown');
    router.replace('/dashboard');
  }

  setIsSubmitting(false);
};

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg
                      sm:p-10
                      md:max-w-lg
                      ">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6 text-gray-900">
            <SessionLogger />
            Billing Counter
          </h1>
          <p className="mb-6 text-gray-700 text-lg sm:text-xl">
            Sign in to your account
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              name="identifier"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Email or Username</FormLabel>
                  <Input
                    {...field}
                    onChange={field.onChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your email or username"
                    autoComplete="username"
                    autoFocus
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                  <Input
                    type="password"
                    {...field}
                    onChange={field.onChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full py-3 text-lg font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Please wait...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-6 text-gray-700 text-sm sm:text-base">
          <p>
            Not a member?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
