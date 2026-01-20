import "./globals.css";

export const metadata = {
  title: "Business Assistant · Powered by Pulse",
  description:
    "Business Assistant powered by Pulse — write quotes, emails, and replies faster.",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
