import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iris Portal — Gestão de Clínica",
  description: "Painel de gestão para clínicas odontológicas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
