import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulateur de Devis",
  description: "Répondez à quelques questions pour obtenir une estimation de prix",
  robots: {
    index: true,
    follow: true,
  },
};

export default function SimulateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
