import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Avatar Chatbot',
  description: 'Browser-based AI avatar chatbot with real-time lip-synchronization',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              imports: {
                three: 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js',
                'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/',
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
