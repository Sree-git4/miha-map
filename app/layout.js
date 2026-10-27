import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata = {
  title: 'MIHA map',
  description: 'Mapped Intangible Heritage Assets and their soulbound tokens',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
