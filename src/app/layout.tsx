import './globals.css';
import '@near-wallet-selector/modal-ui/styles.css';

import { Navbar } from '@/components/Navbar';
import { PropsWithChildren } from 'react';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
