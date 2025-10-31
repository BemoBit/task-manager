'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-4">
        <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-2xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground">Redirecting to dashboard</p>
      </div>
    </div>
  );
}
