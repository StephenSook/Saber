interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Provides the required App Router root layout shell.
 */
export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
