export function apiUrl(path: string): URL {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  return new URL(`${base.replace(/\/$/, "")}${path}`);
}

// Apenas /auth/me existe no contrato atual. Login e logout são caminhos PREVISTOS:
// confirmar com a próxima versão da StoreLab API antes de integrar em produção.
// Nenhum destes caminhos é implementado ou simulado pelo Next.js.
export const authRoutes = {
  me: "/auth/me",
  googleLogin: "/auth/google/login",
  appleLogin: "/auth/apple/login",
  logout: "/auth/logout",
} as const;
