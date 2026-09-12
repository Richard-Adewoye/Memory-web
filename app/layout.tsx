import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spaced Repetition & Learning Retention Journal',
  description:
    'Interactive flashcards powered by SM-2 spaced repetition with daily learning logs, notebook pasting for memory work, review forecasts, and reminder alerts.',
  openGraph: {
    title: 'Spaced Repetition & Learning Retention Journal',
    description:
      'Interactive flashcards powered by SM-2 spaced repetition with daily learning logs, notebook pasting for memory work, review forecasts, and reminder alerts.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased min-h-screen selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
