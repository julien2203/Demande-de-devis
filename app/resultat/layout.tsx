import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Résultat - Simulateur de Devis",
  description: "Votre estimation de prix personnalisée",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResultatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
