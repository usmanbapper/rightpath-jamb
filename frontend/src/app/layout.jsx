
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Rightpath JAMB – Your JAMB Success Partner',
  description: 'Practice JAMB questions, take mock exams, and track your progress with Rightpath.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              borderRadius: '10px',
              boxShadow: '0 4px 24px rgba(0,0,0,.12)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}