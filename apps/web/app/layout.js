export const metadata = {
  title: "6 Empires OS",
  description: "Control center for the 6 Empires OS platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
