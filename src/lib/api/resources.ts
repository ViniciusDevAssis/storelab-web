import { apiFetch, ApiRequestError, type RequestOptions } from "./client";
import { authRoutes } from "./config";
import type {
  AddMemberRequest,
  CategoryResponse,
  CreateCategoryRequest,
  CreateMovementRequest,
  CreateProductRequest,
  CreateStoreRequest,
  MeResponse,
  MemberResponse,
  MovementResponse,
  PagedResponse,
  ProductQuery,
  ProductResponse,
  StoreResponse,
  UpdateCategoryRequest,
  UpdateMemberRequest,
  UpdateProductRequest,
  UpdateStoreRequest,
} from "./types";

const segment = encodeURIComponent;
export const storePath = (id: string) => `/stores/${segment(id)}`;
export const productPath = (storeId: string, id: string) =>
  `${storePath(storeId)}/products/${segment(id)}`;

export function createApi(onUnauthorized: () => void = () => {}) {
  async function request<T>(
    path: string,
    options?: RequestOptions,
  ): Promise<T> {
    try {
      return await apiFetch<T>(path, options);
    } catch (error) {
      if (
        !options?.signal?.aborted &&
        error instanceof ApiRequestError &&
        error.detail.status === 401
      )
        onUnauthorized();
      throw error;
    }
  }
  return {
    getMe: (signal?: AbortSignal) =>
      request<MeResponse>(authRoutes.me, { signal }),
    // Contrato previsto, ainda dependente da implementação no backend.
    logout: () => request<void>(authRoutes.logout, { method: "POST" }),
    listStores: (signal?: AbortSignal) =>
      request<StoreResponse[]>("/stores", { signal }),
    createStore: (body: CreateStoreRequest) =>
      request<StoreResponse>("/stores", { method: "POST", body }),
    getStore: (id: string, signal?: AbortSignal) =>
      request<StoreResponse>(storePath(id), { signal }),
    updateStore: (id: string, body: UpdateStoreRequest) =>
      request<StoreResponse>(storePath(id), { method: "PATCH", body }),
    listMembers: (id: string, signal?: AbortSignal) =>
      request<MemberResponse[]>(`${storePath(id)}/members`, { signal }),
    addMember: (id: string, body: AddMemberRequest) =>
      request<MemberResponse>(`${storePath(id)}/members`, {
        method: "POST",
        body,
      }),
    updateMember: (id: string, personId: string, body: UpdateMemberRequest) =>
      request<MemberResponse>(`${storePath(id)}/members/${segment(personId)}`, {
        method: "PATCH",
        body,
      }),
    removeMember: (id: string, personId: string) =>
      request<void>(`${storePath(id)}/members/${segment(personId)}`, {
        method: "DELETE",
      }),
    listCategories: (id: string, signal?: AbortSignal) =>
      request<CategoryResponse[]>(`${storePath(id)}/categories`, { signal }),
    createCategory: (id: string, body: CreateCategoryRequest) =>
      request<CategoryResponse>(`${storePath(id)}/categories`, {
        method: "POST",
        body,
      }),
    updateCategory: (
      id: string,
      categoryId: string,
      body: UpdateCategoryRequest,
    ) =>
      request<CategoryResponse>(
        `${storePath(id)}/categories/${segment(categoryId)}`,
        { method: "PATCH", body },
      ),
    listProducts: (
      id: string,
      query: ProductQuery = {},
      signal?: AbortSignal,
    ) =>
      request<PagedResponse<ProductResponse>>(`${storePath(id)}/products`, {
        query: { limit: 20, ...query },
        signal,
      }),
    createProduct: (id: string, body: CreateProductRequest) =>
      request<ProductResponse>(`${storePath(id)}/products`, {
        method: "POST",
        body,
      }),
    getProduct: (id: string, productId: string, signal?: AbortSignal) =>
      request<ProductResponse>(productPath(id, productId), { signal }),
    updateProduct: (
      id: string,
      productId: string,
      body: UpdateProductRequest,
    ) =>
      request<ProductResponse>(productPath(id, productId), {
        method: "PATCH",
        body,
      }),
    listMovements: (id: string, productId: string, signal?: AbortSignal) =>
      request<MovementResponse[]>(
        `${productPath(id, productId)}/inventory-movements`,
        { signal },
      ),
    createMovement: (
      id: string,
      productId: string,
      body: CreateMovementRequest,
    ) =>
      request<MovementResponse>(
        `${productPath(id, productId)}/inventory-movements`,
        { method: "POST", body },
      ),
  };
}
export type StoreLabApi = ReturnType<typeof createApi>;
