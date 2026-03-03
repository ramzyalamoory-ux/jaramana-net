import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0891b2" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  title: "جرمانا نت - Jaramana Net",
  description: "نظام إدارة مشتركي الإنترنت - اختيارك الأفضل",
  authors: [{ name: "Eng Ramzy Amoory" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo-jaramana.jpg", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/logo-jaramana.jpg", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jaramana Net",
  },
  formatDetection: {
    telephone: true,
  },
  applicationName: "Jaramana Net",
  keywords: ["إنترنت", "مشتركين", "فاتورة", "جرمانا", "Jaramana", "ISP"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Jaramana Net" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Jaramana Net" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0891b2" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet" />
        
        {/* OneSignal SDK */}
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        
        {/* PWA & OneSignal Init */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // تسجيل Service Worker
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered successfully:', registration.scope);
                      
                      // فحص التحديثات
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New version available!');
                          }
                        });
                      });
                    })
                    .catch(function(error) {
                      console.log('SW registration failed:', error);
                    });
                });
              }
              
              // تهيئة OneSignal للإشعارات
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              window.OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "06d9e1b5-7db3-4a75-93a3-e761013786f1",
                  notifyButton: {
                    enable: true,
                    showCredit: false
                  },
                  promptOptions: {
                    slidedown: {
                      prompts: [
                        {
                          type: "push",
                          autoPromptTitle: "السماح بالإشعارات",
                          autoPromptAcceptButton: "سماح",
                          autoPromptCancelButton: "لا شكراً"
                        }
                      ]
                    }
                  },
                  welcomeNotification: {
                    title: "جرمانا نت",
                    message: "شكراً لاشتراكك في الإشعارات!"
                  }
                });
                
                // حفظ معرف المشترك عند التسجيل
                OneSignal.User.pushSubscription.addEventListener('change', function(event) {
                  if (event.current.token) {
                    console.log('OneSignal Player ID:', event.current.token);
                    // حفظ في localStorage للاستخدام لاحقاً
                    localStorage.setItem('onesignal_player_id', event.current.token);
                  }
                });
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground font-['Tajawal']`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
