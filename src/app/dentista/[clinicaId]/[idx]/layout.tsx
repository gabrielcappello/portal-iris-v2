import type { Metadata } from "next";
import type { ReactNode } from "react";

type Props = {
  params: Promise<{ clinicaId: string; idx: string }>;
  children: ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clinicaId, idx } = await params;
  return {
    title: "Iris — Agenda",
    manifest: `/api/manifest-dentista?clinica=${encodeURIComponent(clinicaId)}&idx=${encodeURIComponent(idx)}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Iris",
    },
  };
}

export default function DentistaLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
