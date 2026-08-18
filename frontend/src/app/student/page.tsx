'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}
