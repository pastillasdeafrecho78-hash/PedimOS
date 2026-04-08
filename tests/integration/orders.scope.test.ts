import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { basePayload, createSeedRepository, TEST_API_KEY_A, TEST_API_KEY_B } from "../helpers/testData.js";

describe("Orders scope routing", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it("branch_scope_mismatch cuando key no corresponde al slug", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers: {
        "x-api-key": TEST_API_KEY_A,
        "x-restaurante-slug": "sucursal-norte",
        "x-idempotency-key": "idem-scope-1",
        "content-type": "application/json"
      },
      payload: { ...basePayload, externalOrderId: "scope-1" }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe("branch_scope_mismatch");
  });

  it("invalid_item_scope cuando item pertenece a otro tenant", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers: {
        "x-api-key": TEST_API_KEY_A,
        "x-restaurante-slug": "sucursal-centro",
        "x-idempotency-key": "idem-scope-2",
        "content-type": "application/json"
      },
      payload: {
        ...basePayload,
        externalOrderId: "scope-2",
        items: [{ ...basePayload.items[0], productoId: "prod-b-1" }]
      }
    });

    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe("invalid_item_scope");
  });

  it("branch_inactive cuando sucursal está desactivada", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers: {
        "x-api-key": TEST_API_KEY_B,
        "x-restaurante-slug": "sucursal-off",
        "x-idempotency-key": "idem-scope-3",
        "content-type": "application/json"
      },
      payload: { ...basePayload, externalOrderId: "scope-3" }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().code).toBe("branch_inactive");
  });

  it("GET status funciona para EXTERNAL_API en sucursal correcta", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const create = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers: {
        "x-api-key": TEST_API_KEY_A,
        "x-restaurante-slug": "sucursal-centro",
        "x-idempotency-key": "idem-scope-4",
        "content-type": "application/json"
      },
      payload: { ...basePayload, externalOrderId: "scope-4" }
    });

    const orderId = create.json().data.orderId as string;
    const status = await app.inject({
      method: "GET",
      url: `/api/public/integraciones/pedidos/orders/${orderId}`,
      headers: {
        "x-api-key": TEST_API_KEY_A,
        "x-restaurante-slug": "sucursal-centro",
        "x-idempotency-key": "idem-scope-4-read"
      }
    });

    expect(status.statusCode).toBe(200);
    expect(status.json().data.estado).toBe("PENDIENTE");
  });
});
