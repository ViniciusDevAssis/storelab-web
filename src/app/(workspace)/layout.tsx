import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/auth-gate";

// O grupo organiza telas privadas sem adicionar um segmento à URL.
// AuthGate consulta /auth/me no navegador; a sessão pertence à StoreLab API.
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
