import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata = {
  title: "MeRa Poly — Polyglot Code Console",
  description:
    "A beautiful, fast code console. Write and run C, C++, Java, JavaScript and Python. Download your code as a file or as a gorgeous image.",
  applicationName: "MeRa Poly",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#07070d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
