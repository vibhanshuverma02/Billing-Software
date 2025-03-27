'use client' ;
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/sign-in');  // Redirect to login page
  }, [router]);

  return null;  // No content displayed on the home page
}
