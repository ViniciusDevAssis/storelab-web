"use client";

import { useState, type FormEvent } from "react";
import { ApiErrorMessage, Field, FormActions } from "@/components/ui";
import type {
  CategoryResponse,
  CreateProductRequest,
  ProductResponse,
  UpdateProductRequest,
} from "@/lib/api/types";
import { centsToInput, integerInput, moneyToCents } from "@/lib/format";

type Props = {
  categories: CategoryResponse[];
  onCancel: () => void;
} & (
  | {
      product: ProductResponse;
      onSave: (request: UpdateProductRequest) => Promise<void>;
    }
  | {
      product?: undefined;
      onSave: (request: CreateProductRequest) => Promise<void>;
    }
);

export function ProductForm(props: Props) {
  const { categories, product, onCancel } = props;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const safePrice = !product || Number.isSafeInteger(product.priceInCents);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const categoryId = String(data.get("categoryId") ?? "");
      const name = String(data.get("name") ?? "");
      const description = String(data.get("description") ?? "");
      if (props.product) {
        // Não reenviar categoria inalterada: ela pode ter sido desativada desde a criação.
        const request: UpdateProductRequest = {
          name,
          active: data.get("active") === "true",
        };
        if (categoryId !== props.product.categoryId)
          request.categoryId = categoryId;
        if (description !== (props.product.description ?? ""))
          request.description = description;
        if (safePrice)
          request.priceInCents = moneyToCents(String(data.get("price") ?? ""));
        await props.onSave(request);
      } else {
        await props.onSave({
          categoryId,
          name,
          description,
          priceInCents: moneyToCents(String(data.get("price") ?? "")),
          initialStock: integerInput(
            String(data.get("initialStock") ?? ""),
            true,
          ),
        });
      }
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      className="panel mb-6 p-5 sm:p-6"
      onSubmit={submit}
      aria-label={product ? "Editar produto" : "Criar produto"}
    >
      <h2 className="mb-5 text-lg font-semibold">
        {product ? "Editar produto" : "Novo produto"}
      </h2>
      <fieldset disabled={pending} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome" htmlFor="product-name">
            <input
              autoFocus
              className="input"
              id="product-name"
              name="name"
              required
              maxLength={160}
              defaultValue={product?.name}
            />
          </Field>
          <Field label="Categoria" htmlFor="product-category">
            <select
              className="input"
              id="product-category"
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
            >
              <option value="" disabled>
                Selecione uma categoria
              </option>
              {categories
                .filter(
                  (category) =>
                    category.active || category.id === product?.categoryId,
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!category.active && " (inativa — atual)"}
                  </option>
                ))}
              {product &&
                !categories.some(
                  (category) => category.id === product.categoryId,
                ) && (
                  <option value={product.categoryId}>
                    {product.categoryId} (atual)
                  </option>
                )}
            </select>
          </Field>
        </div>
        <Field label="Descrição (opcional)" htmlFor="product-description">
          <textarea
            className="input min-h-24"
            id="product-description"
            name="description"
            maxLength={2000}
            defaultValue={product?.description ?? ""}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preço"
            htmlFor="product-price"
            hint={
              safePrice
                ? "Até duas casas decimais. A API não informa a moeda."
                : "O preço excede a precisão do navegador. Ele será mantido sem reenvio."
            }
          >
            <input
              className="input"
              id="product-price"
              name="price"
              inputMode="decimal"
              required
              disabled={!safePrice}
              aria-describedby="product-price-hint"
              placeholder="0,00"
              defaultValue={
                product && safePrice
                  ? centsToInput(product.priceInCents).replace(".", ",")
                  : ""
              }
            />
          </Field>
          {product ? (
            <Field label="Status" htmlFor="product-active">
              <select
                className="input"
                id="product-active"
                name="active"
                defaultValue={String(product.active)}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </Field>
          ) : (
            <Field
              label="Estoque inicial"
              htmlFor="product-stock"
              hint="O saldo inicial não gera um movimento no histórico."
            >
              <input
                className="input"
                id="product-stock"
                name="initialStock"
                type="number"
                required
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                step={1}
                defaultValue="0"
                aria-describedby="product-stock-hint"
              />
            </Field>
          )}
        </div>
        {product && (
          <p className="text-sm text-slate-500">
            Para alterar o estoque, registre uma entrada ou saída na página do
            produto.
          </p>
        )}
        <ApiErrorMessage error={error} />
        <FormActions
          pending={pending}
          onCancel={onCancel}
          label={product ? "Salvar produto" : "Criar produto"}
        />
      </fieldset>
    </form>
  );
}
