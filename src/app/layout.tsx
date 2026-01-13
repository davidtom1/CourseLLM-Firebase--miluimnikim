import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Inter } from 'next/font/google';
import AuthProviderMock from '@/components/AuthProviderMock';
import AuthRedirector from '@/components/AuthRedirector';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'CourseWise',
  description: 'An app that manages university courses in CS to improve learning and teaching.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`}>
        <AuthProviderMock>
          {children}
          <AuthRedirector />
        </AuthProviderMock>
        <Toaster />
      </body>
    </html>
  );
}