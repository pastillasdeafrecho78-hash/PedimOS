import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { basePayload, createSeedRepository, TEST_API_KEY_A } from "../helpers/testData.js";

describe("CreateExternalOrder contract v1", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it("happy path devuelve 201 y shape de contrato", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers: {
        "x-api-key": TEST_API_KEY_A,
        "x-restaurante-slug": "sucursal-centro",
        "x-idempotency-key": "idem-1",
        "content-type": "application/json"
      },
      payload: basePayload
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.idempotent).toBe(false);
    expect(body.data.origen).toBe("EXTERNAL_API");
    expect(body.data.restauranteSlug).toBe("sucursal-centro");
    expect(body.data.estado).toBe("PENDIENTE");
  });

  it("errores invalid_payload incluyen code canonico", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers: {
        "x-api-key": TEST_API_KEY_A,
        "x-restaurante-slug": "sucursal-centro",
        "x-idempotency-key": "idem-2",
        "content-type": "application/json"
      },
      payload: { ...basePayload, items: [] }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      success: false,
      code: "invalid_payload"
    });
  });
});
