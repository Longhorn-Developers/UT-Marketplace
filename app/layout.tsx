import type { Metadata } from "next";
import { Inter, Roboto_Flex } from "next/font/google";
import "./globals.css";
import Navbar from "../components/globals/Navbar";
import { AuthProvider } from './context/AuthContext';
import FooterWrapper from "../components/globals/FooterWrapper";
import AdminRedirectWrapper from "../components/layout/AdminRedirectWrapper";
import ScrollToTop from "../components/globals/ScrollToTop";

// Using Roboto Flex for better typography flexibility
const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "UT Marketplace",
  description: "Buy and sell items within the UT community",
  icons: {
    icon: "/icons/ios-light.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={robotoFlex.variable}>
      <body className="font-sans">
        <div className="flex flex-col min-h-screen">
          <AuthProvider>
            <ScrollToTop />
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
