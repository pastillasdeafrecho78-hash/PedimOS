import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import { createSeedRepository } from "../helpers/testData.js";

describe("Public catalog discovery", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));
    apps.length = 0;
  });

  it("returns only active restaurantes for public discovery", async () => {
    const app = buildApp(createSeedRepository());
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/public/integraciones/pedidos/restaurantes"
    });

    expect(response.statusCode).toBe(200);
    const slugs = response.json().data.map((row: { slug: string }) => row.slug);
    expect(slugs).toContain("sucursal-centro");
    expect(slugs).toContain("sucursal-norte");
    expect(slugs).not.toContain("sucursal-off");
  });

  it("returns menu by slug and degraded payload for inactive/not-found branch", async () => {
    const app = buildApp(createSeedRepository());
    apps.push(app);

    const ok = await app.inject({
      method: "GET",
      url: "/api/public/integraciones/pedidos/menu/sucursal-centro"
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().data.productos.length).toBeGreaterThan(0);

    const fail = await app.inject({
      method: "GET",
      url: "/api/public/integraciones/pedidos/menu/sucursal-off"
    });
    expect(fail.statusCode).toBe(200);
    expect(fail.json().degraded).toBe(true);
    expect(fail.json().data.productos).toEqual([]);
  });
});
