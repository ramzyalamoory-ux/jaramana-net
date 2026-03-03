'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // حذف الكاش عند حدوث خطأ Chunk
    if (error.message?.includes('chunk') || error.message?.includes('Loading chunk')) {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(reg => reg.unregister());
        });
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-4">حدث خطأ في التحميل</h2>
        <p className="text-white/70 mb-6">
          يبدو أن هناك نسخة قديمة محفوظة. اضغط على الزر أدناه لحل المشكلة.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              // مسح كل شيء وإعادة التحميل
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              window.location.reload();
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium"
          >
            🔄 إعادة التحميل
          </button>
          
          <button
            onClick={() => {
              // مسح شامل
              localStorage.clear();
              sessionStorage.clear();
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              window.location.href = window.location.href + '?v=' + Date.now();
            }}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-medium"
          >
            🗑️ مسح كل البيانات وإعادة التحميل
          </button>
          
          <p className="text-white/50 text-sm mt-4">
            إذا استمرت المشكلة، جرب فتح الموقع في نافذة خاصة (Ctrl+Shift+N)
          </p>
        </div>
      </div>
    </div>
  );
}
