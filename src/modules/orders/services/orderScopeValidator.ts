import type { CreateExternalOrderBody } from "../contracts/createExternalOrder.contract.js";
import type { OrdersRepository, RestauranteRecord } from "../repositories/orders.repository.js";
import { canonicalError } from "../../../shared/errors/canonicalErrors.js";

const assertTenantScope = (
  entities: { id: string; restauranteId: string; isActive: boolean }[],
  expectedRestauranteId: string,
  message: string
): void => {
  const allInScope = entities.every((entity) => entity.restauranteId === expectedRestauranteId && entity.isActive);
  if (!allInScope) {
    throw canonicalError("invalid_item_scope", message);
  }
};

export class OrderScopeValidator {
  constructor(private readonly repository: OrdersRepository) {}

  async validate(restaurante: RestauranteRecord, payload: CreateExternalOrderBody): Promise<void> {
    const productIds = [...new Set(payload.items.map((item) => item.productoId))];
    const tamanoIds = [...new Set(payload.items.map((item) => item.tamanoId).filter(Boolean) as string[])];
    const modIds = [
      ...new Set(payload.items.flatMap((item) => item.modificadores.map((modificador) => modificador.modificadorId)))
    ];

    const [products, tamanos, modificadores] = await Promise.all([
      this.repository.findProductsByIds(productIds),
      this.repository.findTamanosByIds(tamanoIds),
      this.repository.findModificadoresByIds(modIds)
    ]);

    if (products.length !== productIds.length) {
      throw canonicalError("invalid_item_scope", "Producto no existe o no pertenece al tenant");
    }
    assertTenantScope(products, restaurante.id, "Producto fuera de scope de sucursal");

    if (tamanoIds.length) {
      if (tamanos.length !== tamanoIds.length) {
        throw canonicalError("invalid_item_scope", "Tamano no existe o no pertenece al tenant");
      }
      assertTenantScope(tamanos, restaurante.id, "Tamano fuera de scope de sucursal");
    }

    if (modIds.length) {
      if (modificadores.length !== modIds.length) {
        throw canonicalError("invalid_item_scope", "Modificador no existe o no pertenece al tenant");
      }
      assertTenantScope(modificadores, restaurante.id, "Modificador fuera de scope de sucursal");
    }
  }
}
