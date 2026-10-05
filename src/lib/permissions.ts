import type { Role } from "./api/types";

// Apenas apresentação. A API decide permissões novamente em cada requisição.
export const canManageStore = (role: Role) => role === "OWNER";
export const canManageCatalog = (role: Role) =>
  role === "OWNER" || role === "MANAGER";
export const roleLabel: Record<Role, string> = {
  OWNER: "Proprietário",
  MANAGER: "Gerente",
  EMPLOYEE: "Colaborador",
};
