import { LoginEntry } from "@/components/auth/auth-gate";

// A rota permanece Server Component; somente a decisão baseada na sessão é cliente.
export default function Home() {
  return <LoginEntry />;
}
