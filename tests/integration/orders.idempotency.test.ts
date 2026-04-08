import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { basePayload, createSeedRepository, TEST_API_KEY_A } from "../helpers/testData.js";

describe("Orders idempotency", () => {
  const apps: ReturnType<typeof buildApp>[] = [];
  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it("duplicate/idempotent retry retorna misma orden con idempotent=true", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const headers = {
      "x-api-key": TEST_API_KEY_A,
      "x-restaurante-slug": "sucursal-centro",
      "x-idempotency-key": "idem-retry-1",
      "content-type": "application/json"
    };

    const first = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers,
      payload: basePayload
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers,
      payload: basePayload
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.json().data.idempotent).toBe(true);
    expect(second.json().data.orderId).toBe(first.json().data.orderId);
  });

  it("misma idempotency key y payload distinto falla con idempotency_payload_mismatch", async () => {
    const repository = createSeedRepository();
    const app = buildApp(repository);
    apps.push(app);

    const headers = {
      "x-api-key": TEST_API_KEY_A,
      "x-restaurante-slug": "sucursal-centro",
      "x-idempotency-key": "idem-retry-2",
      "content-type": "application/json"
    };

    await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers,
      payload: basePayload
    });

    const changedPayload = { ...basePayload, notas: "cambiar payload" };
    const mismatch = await app.inject({
      method: "POST",
      url: "/api/public/integraciones/pedidos/orders",
      headers,
      payload: changedPayload
    });

    expect(mismatch.statusCode).toBe(409);
    expect(mismatch.json().code).toBe("idempotency_payload_mismatch");
  });
});
