import type { ReactNode } from "react";
import { StoreShell } from "@/components/store/store-shell";

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  // A key descarta dados e permissões ao navegar para outra Store.
  return (
    <StoreShell key={storeId} storeId={storeId}>
      {children}
    </StoreShell>
  );
}
