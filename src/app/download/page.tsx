import Link from 'next/link';

export default function DownloadPage() {
  const parts = [
    { name: 'jaramana-part-aa', size: '50 MB', num: 1 },
    { name: 'jaramana-part-ab', size: '50 MB', num: 2 },
    { name: 'jaramana-part-ac', size: '50 MB', num: 3 },
    { name: 'jaramana-part-ad', size: '50 MB', num: 4 },
    { name: 'jaramana-part-ae', size: '40 MB', num: 5 },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          جارمانا نت
        </h1>
        <p className="text-slate-400 mb-10">Jaramana Net - تحميل تطبيق الكمبيوتر</p>

        {/* PWA Option */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">⭐ الطريقة الأسهل (موصى بها)</h2>
          <p className="text-slate-300 mb-4">التطبيق يعمل كـ PWA - تثبيت مباشر من المتصفح!</p>

          <Link
            href="https://jaramana-net-new.vercel.app"
            target="_blank"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            🌐 افتح الموقع
          </Link>

          <ol className="mt-6 space-y-3 text-slate-300">
            <li className="flex items-center gap-3">
              <span className="bg-cyan-500 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0">1</span>
              اضغط على زر &quot;افتح الموقع&quot; أعلاه
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-cyan-500 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0">2</span>
              من قائمة المتصفح (⋮) اختر &quot;تثبيت التطبيق&quot;
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-cyan-500 text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0">3</span>
              التطبيق يظهر على سطح المكتب تلقائياً!
            </li>
          </ol>
        </div>

        {/* Desktop Download */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">💻 تحميل تطبيق الكمبيوتر</h2>
          <p className="text-slate-300 mb-4">الملف كبير (240 MB) - مقسم إلى 5 أجزاء:</p>

          <div className="space-y-3">
            {parts.map((part) => (
              <a
                key={part.name}
                href={`/api/download?file=${part.name}`}
                className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-5 py-3 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-500 transition-colors"
              >
                <span>📦 الجزء {part.num}</span>
                <span className="text-slate-400 text-sm">{part.size}</span>
              </a>
            ))}
          </div>

          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
            <h3 className="text-yellow-400 font-bold mb-3">⚠️ طريقة الدمج</h3>
            <p className="text-slate-300 mb-3">بعد تحميل جميع الأجزاء، افتح CMD في نفس المجلد واكتب:</p>
            <code className="block bg-black/30 p-3 rounded-lg text-sm overflow-x-auto text-cyan-300">
              copy /b jaramana-part-aa+jaramana-part-ab+jaramana-part-ac+jaramana-part-ad+jaramana-part-ae jaramana-app.zip
            </code>
            <p className="text-slate-300 mt-3">
              ثم فك الضغط عن الملف وشغّل <code className="bg-black/30 px-2 py-1 rounded">Jaramana Net.exe</code>
            </p>
          </div>
        </div>

        {/* Android */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">📱 مشروع Android (للمطورين)</h2>
          <p className="text-slate-300 mb-4">للبناء على جهازك باستخدام Android Studio:</p>
          <a
            href="/api/download?file=jaramana-net-android-source.zip"
            className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-3 rounded-lg hover:bg-green-500/20 hover:border-green-500 transition-colors"
          >
            📥 تحميل مصدر Android (264 KB)
          </a>
        </div>
      </div>
    </div>
  );
}
