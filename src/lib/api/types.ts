// Contrato JSON de ApiDtos.java. IDs permanecem opacos e não expõem persistência.
export type Role = "OWNER" | "MANAGER" | "EMPLOYEE";
export type MovementType = "IN" | "OUT";
export type IsoDate = string;

export interface MeResponse {
  id: string;
  name: string;
  email: string | null;
  provider: "GOOGLE" | "APPLE";
}
export interface StoreResponse {
  id: string;
  name: string;
  active: boolean;
  createdBy: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  role: Role;
}
export interface MemberResponse {
  personId: string;
  storeId: string;
  role: Role;
  createdAt: IsoDate;
}
export interface CategoryResponse {
  id: string;
  storeId: string;
  name: string;
  active: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}
export interface ProductResponse {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  description: string | null;
  priceInCents: number;
  stock: number;
  active: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}
export interface MovementResponse {
  id: string;
  productId: string;
  storeId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdBy: string;
  createdAt: IsoDate;
}
export interface PagedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
export interface ApiError {
  status: number;
  code: string;
  message: string;
  path: string;
  timestamp: IsoDate;
  validationErrors: { field: string; message: string }[];
}

export interface CreateStoreRequest {
  name: string;
}
export interface UpdateStoreRequest {
  name?: string;
  active?: boolean;
}
export interface AddMemberRequest {
  personId: string;
  role: Role;
}
export interface UpdateMemberRequest {
  role: Role;
}
export interface CreateCategoryRequest {
  name: string;
}
export interface UpdateCategoryRequest {
  name?: string;
  active?: boolean;
}
export interface CreateProductRequest {
  categoryId: string;
  name: string;
  description?: string;
  priceInCents: number;
  initialStock: number;
}
export interface UpdateProductRequest {
  categoryId?: string;
  name?: string;
  description?: string;
  priceInCents?: number;
  active?: boolean;
}
export interface CreateMovementRequest {
  type: MovementType;
  quantity: number;
  reason?: string;
}
export interface ProductQuery {
  categoryId?: string;
  active?: boolean;
  limit?: number;
  cursor?: string;
}
