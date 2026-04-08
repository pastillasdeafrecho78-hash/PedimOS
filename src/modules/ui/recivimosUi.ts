type PageOptions = {
  title: string;
  badge: string;
  heading: string;
  description: string;
  content: string;
  script?: string;
};

const baseCss = `
  :root {
    --bg: #faf6f2;
    --bg-soft: #f3ebe4;
    --surface: #fffaf6;
    --surface-muted: #f7efe9;
    --text: #352f2f;
    --muted: #7d6f6d;
    --border: #e8d8cf;
    --brand: #dc2626;
    --brand-soft: #f97316;
    --ok: #0f766e;
    --danger: #b91c1c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: var(--text);
    background:
      radial-gradient(circle at 15% 12%, rgba(249, 115, 22, 0.2), transparent 24%),
      radial-gradient(circle at 86% 8%, rgba(220, 38, 38, 0.16), transparent 22%),
      linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 100%);
    padding: 24px;
  }
  .wrap {
    margin: 0 auto;
    width: min(980px, 100%);
  }
  .card {
    border: 1px solid var(--border);
    background: linear-gradient(145deg, rgba(255, 250, 246, 0.96), rgba(247, 239, 233, 0.94));
    border-radius: 28px;
    box-shadow: 0 24px 50px -24px rgba(127, 29, 29, 0.34);
    padding: 28px;
  }
  .badge {
    display: inline-block;
    border-radius: 999px;
    border: 1px solid rgba(220, 38, 38, 0.28);
    color: #7f1d1d;
    background: rgba(249, 115, 22, 0.12);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    padding: 6px 12px;
  }
  h1 {
    margin: 14px 0 10px;
    font-size: clamp(28px, 5vw, 42px);
    line-height: 1.1;
  }
  p.desc {
    margin: 0;
    color: var(--muted);
    font-size: 16px;
  }
  .grid {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .panel {
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.72);
    border-radius: 16px;
    padding: 14px;
  }
  .row { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn {
    border-radius: 999px;
    padding: 10px 16px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    border: 0;
    cursor: pointer;
  }
  .btn-primary {
    color: #fff;
    background: linear-gradient(135deg, var(--brand-soft), var(--brand));
  }
  .btn-secondary {
    color: var(--text);
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.8);
  }
  label {
    display: block;
    margin: 8px 0 4px;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
  }
  input, select, textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.86);
    color: var(--text);
    padding: 10px 12px;
    font: inherit;
  }
  textarea {
    min-height: 120px;
    resize: vertical;
  }
  .nav {
    margin-top: 18px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .log {
    margin-top: 10px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.74);
    padding: 12px;
    font-size: 12px;
    white-space: pre-wrap;
    color: #4b4444;
  }
  .ok { color: var(--ok); font-weight: 700; }
  .err { color: var(--danger); font-weight: 700; }
  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
  }
`;

const renderLayout = (options: PageOptions): string => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${options.title}</title>
    <style>${baseCss}</style>
  </head>
  <body>
    <main class="wrap">
      <section class="card">
        <span class="badge">${options.badge}</span>
        <h1>${options.heading}</h1>
        <p class="desc">${options.description}</p>
        <div class="nav">
          <a class="btn btn-secondary" href="/">Inicio</a>
          <a class="btn btn-secondary" href="/login">Login</a>
          <a class="btn btn-secondary" href="/register">Register</a>
          <a class="btn btn-secondary" href="/integration-status">Integration status</a>
          <a class="btn btn-secondary" href="/orders/new">Capture order</a>
          <a class="btn btn-secondary" href="/api/public/integraciones/pedidos/contract">API contract</a>
        </div>
        ${options.content}
      </section>
    </main>
    ${options.script ? `<script>${options.script}</script>` : ""}
  </body>
</html>`;

export const renderHomePage = (): string =>
  renderLayout({
    title: "RecivimOS",
    badge: "ecosistema operativo",
    heading: "RecivimOS integration gateway",
    description:
      "Producto de captura e ingestion de pedidos externos con reglas canonicas y routing tenant-scoped hacia ServimOS.",
    content: `
      <div class="grid">
        <article class="panel">
          <h3>Proposito</h3>
          <p>Recibir pedidos externos de forma segura y consistente.</p>
        </article>
        <article class="panel">
          <h3>Contrato</h3>
          <p>POST /orders con idempotencia y GET /orders/:id para estado.</p>
        </article>
        <article class="panel">
          <h3>Boundaries</h3>
          <p>Sin duplicar dominio operativo; ServimOS sigue como source of truth.</p>
        </article>
        <article class="panel">
          <h3>Siguiente paso</h3>
          <p>Configurar credenciales en Login y validar estado en Integration status.</p>
        </article>
      </div>
    `
  });

export const renderLoginPage = (): string =>
  renderLayout({
    title: "RecivimOS Login",
    badge: "login",
    heading: "Access credentials for integration",
    description:
      "Este flujo no crea sesion humana. Guarda API key y sucursal para pruebas operativas de integracion.",
    content: `
      <form id="integration-login" class="grid">
        <section class="panel">
          <label for="apiKey">API key</label>
          <input id="apiKey" name="apiKey" placeholder="Ingresa x-api-key" required />
          <label for="slug">Restaurante slug</label>
          <select id="slug" name="slug" required>
            <option value="">Cargando sucursales...</option>
          </select>
          <label for="defaultOrderId">Default order id check</label>
          <input id="defaultOrderId" name="defaultOrderId" placeholder="health-check-order" />
          <div class="row" style="margin-top:12px">
            <button class="btn btn-primary" type="submit">Guardar credenciales</button>
            <a class="btn btn-secondary" href="/integration-status">Ir a estado</a>
          </div>
        </section>
        <section class="panel">
          <h3>Que se guarda</h3>
          <p>Se persiste localmente en el navegador para facilitar pruebas desde esta UI.</p>
          <div id="login-status" class="log">Sin guardar aun.</div>
        </section>
      </form>
    `,
    script: `
      const KEY = "recivimos.integration.v1";
      const form = document.getElementById("integration-login");
      const statusEl = document.getElementById("login-status");
      const existing = JSON.parse(localStorage.getItem(KEY) || "{}");
      const loadRestaurants = async () => {
        const res = await fetch("/api/public/integraciones/pedidos/restaurantes");
        const json = await res.json().catch(() => ({ data: [] }));
        const rows = Array.isArray(json.data) ? json.data : [];
        const select = document.getElementById("slug");
        if (!rows.length) {
          select.innerHTML = '<option value="">No hay sucursales activas</option>';
          return;
        }
        select.innerHTML = ['<option value="">Selecciona sucursal</option>']
          .concat(rows.map((r) => '<option value="' + r.slug + '">' + r.nombre + ' (' + r.slug + ')</option>'))
          .join("");
        if (existing.slug) select.value = existing.slug;
      };
      for (const id of ["apiKey", "defaultOrderId"]) {
        const el = document.getElementById(id);
        if (el && existing[id]) el.value = existing[id];
      }
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const payload = {
          apiKey: document.getElementById("apiKey").value.trim(),
          slug: document.getElementById("slug").value.trim(),
          defaultOrderId: document.getElementById("defaultOrderId").value.trim() || "health-check-order"
        };
        if (!payload.apiKey || !payload.slug) {
          statusEl.innerHTML = '<span class="err">Debes capturar api key y slug.</span>';
          return;
        }
        localStorage.setItem(KEY, JSON.stringify(payload));
        statusEl.innerHTML = '<span class="ok">Credenciales guardadas. Continunua en Integration status.</span>';
      });
      void loadRestaurants();
    `
  });

export const renderRegisterPage = (): string =>
  renderLayout({
    title: "RecivimOS Register",
    badge: "register",
    heading: "Register integration workspace",
    description:
      "Registro operativo de entorno de integracion para un operador/canal. No crea usuario de app principal.",
    content: `
      <form id="integration-register" class="grid">
        <section class="panel">
          <label for="operatorName">Operator name</label>
          <input id="operatorName" name="operatorName" placeholder="Operador externo" />
          <label for="channelName">Channel name</label>
          <input id="channelName" name="channelName" placeholder="whatsapp-bot" />
          <label for="apiKeyR">API key</label>
          <input id="apiKeyR" name="apiKeyR" placeholder="x-api-key" required />
          <label for="slugR">Restaurante slug</label>
          <select id="slugR" name="slugR" required>
            <option value="">Cargando sucursales...</option>
          </select>
          <div class="row" style="margin-top:12px">
            <button class="btn btn-primary" type="submit">Registrar entorno</button>
            <a class="btn btn-secondary" href="/orders/new">Capturar pedido</a>
          </div>
        </section>
        <section class="panel">
          <h3>Resultado</h3>
          <div id="register-status" class="log">Pendiente de registro.</div>
        </section>
      </form>
    `,
    script: `
      const KEY = "recivimos.integration.v1";
      const form = document.getElementById("integration-register");
      const statusEl = document.getElementById("register-status");
      const loadRestaurants = async () => {
        const res = await fetch("/api/public/integraciones/pedidos/restaurantes");
        const json = await res.json().catch(() => ({ data: [] }));
        const rows = Array.isArray(json.data) ? json.data : [];
        const select = document.getElementById("slugR");
        if (!rows.length) {
          select.innerHTML = '<option value="">No hay sucursales activas</option>';
          return;
        }
        select.innerHTML = ['<option value="">Selecciona sucursal</option>']
          .concat(rows.map((r) => '<option value="' + r.slug + '">' + r.nombre + ' (' + r.slug + ')</option>'))
          .join("");
      };
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const payload = {
          operatorName: document.getElementById("operatorName").value.trim(),
          channelName: document.getElementById("channelName").value.trim(),
          apiKey: document.getElementById("apiKeyR").value.trim(),
          slug: document.getElementById("slugR").value.trim(),
          defaultOrderId: "health-check-order"
        };
        if (!payload.apiKey || !payload.slug) {
          statusEl.innerHTML = '<span class="err">API key y slug son obligatorios.</span>';
          return;
        }
        localStorage.setItem(KEY, JSON.stringify(payload));
        statusEl.textContent = JSON.stringify({ success: true, data: payload }, null, 2);
      });
      void loadRestaurants();
    `
  });

export const renderIntegrationStatusPage = (): string =>
  renderLayout({
    title: "RecivimOS Integration Status",
    badge: "integration",
    heading: "Integration status and diagnostics",
    description:
      "Valida conectividad, contrato y autenticacion de integracion usando las credenciales guardadas.",
    content: `
      <div class="grid">
        <section class="panel">
          <label for="orderId">Order id for auth check</label>
          <input id="orderId" placeholder="health-check-order" />
          <div class="row" style="margin-top:12px">
            <button id="run-checks" class="btn btn-primary" type="button">Ejecutar checks</button>
            <a class="btn btn-secondary" href="/login">Configurar credenciales</a>
          </div>
        </section>
        <section class="panel">
          <h3>Output</h3>
          <div id="status-output" class="log">Sin ejecucion.</div>
        </section>
      </div>
    `,
    script: `
      const KEY = "recivimos.integration.v1";
      const output = document.getElementById("status-output");
      const button = document.getElementById("run-checks");
      const orderInput = document.getElementById("orderId");
      const readConfig = () => JSON.parse(localStorage.getItem(KEY) || "{}");
      const run = async () => {
        const cfg = readConfig();
        const orderId = orderInput.value.trim() || cfg.defaultOrderId || "health-check-order";
        const lines = [];
        lines.push("Config loaded: " + (cfg.apiKey && cfg.slug ? "yes" : "missing"));
        const health = await fetch("/health");
        lines.push("GET /health -> " + health.status);
        const contract = await fetch("/api/public/integraciones/pedidos/contract");
        lines.push("GET /contract -> " + contract.status);
        if (cfg.apiKey && cfg.slug) {
          const statusResp = await fetch("/api/public/integraciones/pedidos/orders/" + encodeURIComponent(orderId), {
            headers: {
              "x-api-key": cfg.apiKey,
              "x-restaurante-slug": cfg.slug,
              "x-idempotency-key": "diag-" + Date.now()
            }
          });
          lines.push("GET /orders/:id auth check -> " + statusResp.status);
          const json = await statusResp.json().catch(() => ({}));
          lines.push("response code: " + (json.code || "n/a"));
        } else {
          lines.push("Auth check skipped: missing credentials.");
        }
        output.textContent = lines.join("\\n");
      };
      button.addEventListener("click", () => { void run(); });
      const cfg = readConfig();
      if (cfg.defaultOrderId) orderInput.value = cfg.defaultOrderId;
    `
  });

export const renderCreateOrderPage = (): string =>
  renderLayout({
    title: "RecivimOS Capture Order",
    badge: "capture",
    heading: "Capture external order",
    description:
      "Vertical slice UX: crear pedido externo y observar su estado con polling en la sucursal objetivo.",
    content: `
      <form id="create-order-form" class="grid">
        <section class="panel">
          <label for="apiKey">API key</label>
          <input id="apiKey" placeholder="x-api-key" required />
          <label for="slug">Restaurante (sucursal)</label>
          <select id="slug" required>
            <option value="">Cargando sucursales...</option>
          </select>
          <label for="catalogStatus">Estado del menu</label>
          <input id="catalogStatus" value="Selecciona sucursal para cargar menu" readonly />
          <label for="externalOrderId">External order id (idempotency)</label>
          <input id="externalOrderId" placeholder="ext-1001" required />
          <label for="tipoPedido">Tipo pedido</label>
          <select id="tipoPedido">
            <option value="LOCAL">LOCAL</option>
            <option value="DOMICILIO">DOMICILIO</option>
            <option value="DELIVERY">DELIVERY</option>
          </select>
          <label for="productoId">Producto</label>
          <select id="productoId" required>
            <option value="">Selecciona una sucursal</option>
          </select>
          <label for="cantidad">Cantidad</label>
          <input id="cantidad" type="number" min="1" value="1" required />
          <label for="tamanoId">Tamano (optional)</label>
          <select id="tamanoId">
            <option value="">Sin tamano</option>
          </select>
          <label for="itemNotas">Notas item (optional)</label>
          <input id="itemNotas" placeholder="sin cebolla" />
          <label for="clienteNombre">Cliente nombre (optional)</label>
          <input id="clienteNombre" />
          <label for="clienteTelefono">Cliente telefono (optional)</label>
          <input id="clienteTelefono" />
          <label for="clienteDireccion">Cliente direccion (optional)</label>
          <input id="clienteDireccion" />
          <div class="row" style="margin-top:12px">
            <button class="btn btn-primary" type="submit">Crear pedido</button>
            <button id="poll-status" class="btn btn-secondary" type="button">Consultar estado</button>
          </div>
        </section>
        <section class="panel">
          <h3>Request / response</h3>
          <div id="order-output" class="log">Sin envios.</div>
        </section>
      </form>
    `,
    script: `
      const KEY = "recivimos.integration.v1";
      const form = document.getElementById("create-order-form");
      const pollBtn = document.getElementById("poll-status");
      const output = document.getElementById("order-output");
      let lastOrderId = "";

      const byId = (id) => document.getElementById(id);
      const readConfig = () => JSON.parse(localStorage.getItem(KEY) || "{}");
      const setOptions = (selectId, options, placeholder) => {
        const select = byId(selectId);
        const html = ['<option value="">' + placeholder + '</option>']
          .concat(options.map((item) => '<option value="' + item.id + '">' + item.nombre + '</option>'))
          .join("");
        select.innerHTML = html;
      };
      const loadRestaurants = async () => {
        const res = await fetch("/api/public/integraciones/pedidos/restaurantes");
        const json = await res.json().catch(() => ({ data: [] }));
        const rows = Array.isArray(json.data) ? json.data : [];
        const select = byId("slug");
        if (!rows.length) {
          select.innerHTML = '<option value="">No hay sucursales activas</option>';
          return;
        }
        select.innerHTML = ['<option value="">Selecciona sucursal</option>']
          .concat(rows.map((r) => '<option value="' + r.slug + '">' + r.nombre + ' (' + r.slug + ')</option>'))
          .join("");
      };
      const loadCatalog = async (slug) => {
        if (!slug) return;
        byId("catalogStatus").value = "Cargando menu...";
        const res = await fetch("/api/public/integraciones/pedidos/menu/" + encodeURIComponent(slug));
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.data) {
          byId("catalogStatus").value = "No se pudo cargar menu";
          setOptions("productoId", [], "Sin productos");
          setOptions("tamanoId", [], "Sin tamano");
          return;
        }
        setOptions("productoId", json.data.productos || [], "Selecciona producto");
        setOptions("tamanoId", json.data.tamanos || [], "Sin tamano");
        byId("catalogStatus").value = "Menu de " + json.data.restaurante.nombre + " cargado";
      };
      const setFromConfig = () => {
        const cfg = readConfig();
        if (cfg.apiKey) byId("apiKey").value = cfg.apiKey;
      };
      const headers = () => ({
        "content-type": "application/json",
        "x-api-key": byId("apiKey").value.trim(),
        "x-restaurante-slug": byId("slug").value.trim(),
        "x-idempotency-key": byId("externalOrderId").value.trim()
      });
      const buildPayload = () => {
        const payload = {
          externalOrderId: byId("externalOrderId").value.trim(),
          tipoPedido: byId("tipoPedido").value,
          canal: "EXTERNAL_APP",
          items: [
            {
              productoId: byId("productoId").value.trim(),
              cantidad: Number(byId("cantidad").value || 1),
              modificadores: []
            }
          ]
        };
        const tamanoId = byId("tamanoId").value.trim();
        const notas = byId("itemNotas").value.trim();
        if (tamanoId) payload.items[0].tamanoId = tamanoId;
        if (notas) payload.items[0].notas = notas;
        const nombre = byId("clienteNombre").value.trim();
        const telefono = byId("clienteTelefono").value.trim();
        const direccion = byId("clienteDireccion").value.trim();
        if (nombre && telefono && direccion) {
          payload.cliente = { nombre, telefono, direccion };
        }
        return payload;
      };
      const print = (obj) => { output.textContent = JSON.stringify(obj, null, 2); };

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = buildPayload();
        const response = await fetch("/api/public/integraciones/pedidos/orders", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        print({ status: response.status, payload, data });
        if (response.ok && data?.data?.orderId) {
          lastOrderId = data.data.orderId;
          const cfg = readConfig();
          localStorage.setItem(KEY, JSON.stringify({
            ...cfg,
            apiKey: byId("apiKey").value.trim(),
            slug: byId("slug").value.trim(),
            defaultOrderId: lastOrderId
          }));
        }
      });

      pollBtn.addEventListener("click", async () => {
        const orderId = lastOrderId || byId("externalOrderId").value.trim();
        if (!orderId) {
          print({ error: "No hay orderId para consultar." });
          return;
        }
        const lines = [];
        for (let i = 0; i < 8; i++) {
          const res = await fetch("/api/public/integraciones/pedidos/orders/" + encodeURIComponent(orderId), {
            headers: {
              "x-api-key": byId("apiKey").value.trim(),
              "x-restaurante-slug": byId("slug").value.trim(),
              "x-idempotency-key": "poll-" + Date.now() + "-" + i
            }
          });
          const data = await res.json().catch(() => ({}));
          lines.push({ step: i + 1, status: res.status, data });
          if (res.ok && data?.data?.estado) {
            if (["LISTO", "SERVIDO", "PAGADO", "CANCELADO"].includes(data.data.estado)) break;
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
        print({ orderId, polling: lines });
      });

      byId("slug").addEventListener("change", async (e) => {
        const slug = e.target.value.trim();
        await loadCatalog(slug);
      });
      void loadRestaurants().then(async () => {
        setFromConfig();
        const cfg = readConfig();
        if (cfg.slug) {
          byId("slug").value = cfg.slug;
          await loadCatalog(cfg.slug);
        }
      });
    `
  });
