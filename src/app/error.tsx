"use client";

// Error boundaries precisam ser cliente para permitir tentar renderizar novamente.
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">
        Não foi possível abrir esta página
      </h1>
      <p className="my-4 text-slate-600">
        Ocorreu uma falha inesperada na interface.
      </p>
      <button className="btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
