import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NotariApp",
  description: "Asistente virtual de WhatsApp para notarías.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO">
      <body>{children}</body>
    </html>
  );
}
