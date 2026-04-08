import { sha256 } from "../../src/shared/utils/hash.js";
import { InMemoryOrdersRepository } from "../../src/modules/orders/repositories/inMemoryOrders.repository.js";

export const TEST_API_KEY_A = "test-key-a";
export const TEST_API_KEY_B = "test-key-b";

export const createSeedRepository = (): InMemoryOrdersRepository => {
  return new InMemoryOrdersRepository({
    restaurantes: [
      { id: "rest-a", slug: "sucursal-centro", nombre: "Centro", isActive: true, isSuspended: false },
      { id: "rest-b", slug: "sucursal-norte", nombre: "Norte", isActive: true, isSuspended: false },
      { id: "rest-inactive", slug: "sucursal-off", nombre: "Off", isActive: false, isSuspended: false }
    ],
    apiKeys: [
      {
        id: "key-a",
        restauranteId: "rest-a",
        keyHash: sha256(TEST_API_KEY_A),
        isActive: true,
        scopes: ["orders:create", "orders:read"]
      },
      {
        id: "key-b",
        restauranteId: "rest-b",
        keyHash: sha256(TEST_API_KEY_B),
        isActive: true,
        scopes: ["orders:create", "orders:read"]
      }
    ],
    productos: [
      { id: "prod-a-1", restauranteId: "rest-a", isActive: true },
      { id: "prod-b-1", restauranteId: "rest-b", isActive: true }
    ],
    tamanos: [
      { id: "size-a-1", restauranteId: "rest-a", isActive: true },
      { id: "size-b-1", restauranteId: "rest-b", isActive: true }
    ],
    modificadores: [
      { id: "mod-a-1", restauranteId: "rest-a", isActive: true },
      { id: "mod-b-1", restauranteId: "rest-b", isActive: true }
    ]
  });
};

export const basePayload = {
  externalOrderId: "ext-2026-04-08-000123",
  tipoPedido: "DELIVERY" as const,
  canal: "EXTERNAL_APP" as const,
  catalogVersion: "2026-04-08T00:00:00Z",
  cliente: {
    nombre: "Juan Perez",
    telefono: "+525512345678",
    direccion: "Calle 1 #123"
  },
  notas: "Sin cebolla",
  items: [
    {
      productoId: "prod-a-1",
      tamanoId: "size-a-1",
      cantidad: 2,
      notas: "Poco picante",
      modificadores: [{ modificadorId: "mod-a-1" }]
    }
  ],
  deliveryMetadata: {
    mode: "OWN_FLEET",
    driverRef: "DRV-11",
    vehicleNote: "Moto azul"
  }
};
