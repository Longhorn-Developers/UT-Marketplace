import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import Navbar from "../components/globals/Navbar";
import { AuthProvider } from './context/AuthContext';
import FooterWrapper from "../components/globals/FooterWrapper";
import AdminRedirectWrapper from "../components/layout/AdminRedirectWrapper";

// Using Roboto as a fallback since it's similar to Benton Sans
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "UT Marketplace",
  description: "Buy and sell items within the UT community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans">
        <div className="flex flex-col min-h-screen">
          <AuthProvider>
            <AdminRedirectWrapper 
              navbar={<Navbar />}
              footer={<FooterWrapper />}
            >
              {children}
            </AdminRedirectWrapper>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
