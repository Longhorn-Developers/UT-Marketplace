import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/globals/Navbar";
import { AuthProvider } from './context/AuthContext';
import FooterWrapper from "../components/globals/FooterWrapper";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <AuthProvider>
            <Navbar />
            {children}
            <FooterWrapper />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
