import "./globals.css";

export const metadata = {
  title: "HRMS — Human Resource Management System",
  description: "AI-powered HRMS built for FWC Hackathon",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
