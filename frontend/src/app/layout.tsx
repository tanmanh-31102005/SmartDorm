import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastContext';
import { AiAssistantWidget } from '@/components/AiAssistantWidget';

export const metadata: Metadata = {
  title: 'SmartDorm — Smart Campus & IoT Building Platform',
  description: 'Nền tảng quản lý Ký Túc Xá thông minh thương mại: Giám sát vi khí hậu, điều khiển thiết bị IoT, an ninh RFID và tối ưu năng lượng.',
  keywords: ['smart dormitory', 'IoT', 'smart campus', 'smart building', 'telemetry', 'RFID access control'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <ToastProvider>
          {children}
          <AiAssistantWidget />
        </ToastProvider>
      </body>
    </html>
  );
}
