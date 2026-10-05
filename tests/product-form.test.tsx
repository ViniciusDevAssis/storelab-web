import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductForm } from "@/components/products/product-form";
import { ApiRequestError, normalizeApiError } from "@/lib/api/client";
import type { CategoryResponse, ProductResponse } from "@/lib/api/types";

const category: CategoryResponse = {
  id: "c",
  storeId: "s",
  name: "Roupas",
  active: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
const product: ProductResponse = {
  id: "p",
  storeId: "s",
  categoryId: "c",
  name: "Camisa",
  description: null,
  priceInCents: 1299,
  stock: 5,
  active: true,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
};

describe("formulário de produto", () => {
  it("envia somente campos do DTO e converte centavos sem arredondar", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm categories={[category]} onSave={save} onCancel={() => {}} />,
    );
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Camisa" },
    });
    fireEvent.change(screen.getByLabelText("Categoria"), {
      target: { value: "c" },
    });
    fireEvent.change(screen.getByLabelText("Preço"), {
      target: { value: "0,29" },
    });
    fireEvent.change(screen.getByLabelText("Estoque inicial"), {
      target: { value: "3" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Criar produto" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        categoryId: "c",
        name: "Camisa",
        description: "",
        priceInCents: 29,
        initialStock: 3,
      }),
    );
  });
  it("não altera estoque nem reenvia categoria inativa inalterada na edição", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm
        product={product}
        categories={[{ ...category, active: false }]}
        onSave={save}
        onCancel={() => {}}
      />,
    );
    expect(screen.queryByLabelText("Estoque inicial")).toBeNull();
    fireEvent.submit(screen.getByRole("form", { name: "Editar produto" }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({
        name: "Camisa",
        active: true,
        priceInCents: 1299,
      }),
    );
  });
  it("mantém dados preenchidos e apresenta o conflito retornado pela API", async () => {
    const save = vi
      .fn()
      .mockRejectedValue(
        new ApiRequestError(
          normalizeApiError(
            409,
            {
              code: "CONFLICT",
              message: "Products must use an active category",
            },
            "/stores/s/products/p",
          ),
        ),
      );
    render(
      <ProductForm
        product={product}
        categories={[category]}
        onSave={save}
        onCancel={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Novo nome" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Editar produto" }));
    expect(
      await screen.findByText("Products must use an active category"),
    ).toBeTruthy();
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe(
      "Novo nome",
    );
  });
  it("não envia preço com mais de duas casas decimais", async () => {
    const save = vi.fn();
    render(
      <ProductForm
        product={product}
        categories={[category]}
        onSave={save}
        onCancel={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText("Preço"), {
      target: { value: "1,999" },
    });
    fireEvent.submit(screen.getByRole("form", { name: "Editar produto" }));
    await screen.findByRole("alert");
    expect(save).not.toHaveBeenCalled();
  });
});
