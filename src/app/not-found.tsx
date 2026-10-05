import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <p className="text-sm text-slate-500">404</p>
      <h1 className="my-4 text-2xl font-semibold">Página não encontrada</h1>
      <Link className="text-link" href="/dashboard">
        Voltar às minhas lojas
      </Link>
    </main>
  );
}
