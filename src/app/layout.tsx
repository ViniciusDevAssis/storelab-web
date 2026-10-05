import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "StoreLab · Gestão de lojas", template: "%s · StoreLab" },
  description: "Administração de lojas, catálogo, equipe e estoque.",
};

// O layout é servidor. Renderizar um provider cliente não transforma children em Client Components.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
