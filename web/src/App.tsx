import { useEffect, useMemo, useState } from "react";
import { apiClient, type Branch, type MenuCatalog } from "./api/client";
import { cartState, type CartItem } from "./state/cart";

const randomExternalOrderId = (): string => `ext-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

const asCurrency = (amount: number): string =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

const readIntegrationConfig = (): { apiKey: string; slug: string } => {
  try {
    const raw = localStorage.getItem("pedimos.integration.v1");
    if (!raw) return { apiKey: "", slug: "" };
    const parsed = JSON.parse(raw) as { apiKey?: string; slug?: string };
    return { apiKey: parsed.apiKey ?? "", slug: parsed.slug ?? "" };
  } catch {
    return { apiKey: "", slug: "" };
  }
};

export function App() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchSlug, setSelectedBranchSlug] = useState("");
  const [menu, setMenu] = useState<MenuCatalog | null>(null);
  const [query, setQuery] = useState("");
  const [activeProductId, setActiveProductId] = useState("");
  const [menuError, setMenuError] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [lastOrderId, setLastOrderId] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(randomExternalOrderId());
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [statusTimeline, setStatusTimeline] = useState<Array<{ at: string; status: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cfg = readIntegrationConfig();
    setApiKey(cfg.apiKey);
    setSelectedBranchSlug(cfg.slug);
    setCart(cartState.read());
    void apiClient
      .getBranches()
      .then((loaded) => {
        setBranches(loaded);
        if (!cfg.slug && loaded.length) {
          setSelectedBranchSlug(loaded[0]?.slug ?? "");
        }
      })
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (!selectedBranchSlug) return;
    setLoadingMenu(true);
    setMenuError("");
    void apiClient
      .getMenuBySlug(selectedBranchSlug)
      .then(({ data, degraded }) => {
        setMenu(data);
        if (degraded) {
          setMenuError("El menu está en modo degradado. Verifica configuración de sucursal.");
        }
      })
      .catch((error) => {
        setMenu(null);
        setMenuError(error instanceof Error ? error.message : "No se pudo cargar menu.");
      })
      .finally(() => setLoadingMenu(false));
  }, [selectedBranchSlug]);

  const total = useMemo(() => cart.reduce((acc, item) => acc + item.qty * item.unitPrice, 0), [cart]);
  const filteredBranches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return branches;
    return branches.filter((branch) => branch.nombre.toLowerCase().includes(term) || branch.slug.toLowerCase().includes(term));
  }, [branches, query]);
  const visibleProducts = useMemo(() => {
    const products = menu?.productos ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => product.nombre.toLowerCase().includes(term));
  }, [menu?.productos, query]);
  const selectedProduct =
    visibleProducts.find((product) => product.id === activeProductId) ?? visibleProducts[0] ?? null;

  const addProduct = (productId: string, productName: string) => {
    const next = cartState.add({
      id: `${productId}-${Date.now()}`,
      productId,
      name: productName,
      qty: 1,
      unitPrice: 38
    });
    setCart(next);
  };

  const checkout = async () => {
    if (!apiKey.trim()) {
      setStatusLog(["Configura x-api-key para continuar."]);
      return;
    }
    if (!selectedBranchSlug) {
      setStatusLog(["Selecciona sucursal para continuar."]);
      return;
    }
    if (!cart.length) {
      setStatusLog(["Agrega productos al carrito."]);
      return;
    }

    setSubmitting(true);
    const currentIdempotency = idempotencyKey.trim() || randomExternalOrderId();
    try {
      const payload = {
        externalOrderId: currentIdempotency,
        tipoPedido: "DELIVERY" as const,
        canal: "EXTERNAL_APP" as const,
        cliente:
          customerName && customerPhone && customerAddress
            ? { nombre: customerName, telefono: customerPhone, direccion: customerAddress }
            : undefined,
        items: cart.map((item) => ({
          productoId: item.productId,
          cantidad: item.qty,
          modificadores: []
        }))
      };

      const created = await apiClient.createOrder({
        apiKey: apiKey.trim(),
        restauranteSlug: selectedBranchSlug,
        idempotencyKey: currentIdempotency,
        payload
      });

      const maybeOrderId = (created as { data?: { orderId?: string } }).data?.orderId ?? "";
      setLastOrderId(maybeOrderId);
      setStatusLog([
        "Pedido creado correctamente.",
        `Idempotency: ${currentIdempotency}`,
        JSON.stringify(created, null, 2),
        maybeOrderId ? `OrderId: ${maybeOrderId}` : "No se recibió orderId."
      ]);
      setStatusTimeline([]);
      cartState.clear();
      setCart([]);
      setIdempotencyKey(randomExternalOrderId());
    } catch (error) {
      setStatusLog([error instanceof Error ? error.message : "Error al crear pedido."]);
    } finally {
      setSubmitting(false);
    }
  };

  const pollStatus = async () => {
    if (!lastOrderId) {
      setStatusLog(["No hay orderId para consultar."]);
      return;
    }
    if (!apiKey.trim() || !selectedBranchSlug) {
      setStatusLog(["Faltan credenciales o sucursal."]);
      return;
    }

    const lines: string[] = [];
    const timeline: Array<{ at: string; status: string }> = [];
    for (let i = 0; i < 6; i++) {
      try {
        const response = await apiClient.getOrderStatus({
          apiKey: apiKey.trim(),
          restauranteSlug: selectedBranchSlug,
          orderId: lastOrderId,
          idempotencyKey: `poll-${Date.now()}-${i}`
        });
        const estado = (response as { data?: { estado?: string } }).data?.estado ?? "n/a";
        lines.push(`Intento ${i + 1}: estado ${estado}`);
        timeline.push({ at: new Date().toLocaleTimeString("es-MX"), status: estado });
      } catch (error) {
        lines.push(`Intento ${i + 1}: ${error instanceof Error ? error.message : "error"}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    setStatusLog(lines);
    setStatusTimeline(timeline);
  };

  return (
    <div className="app-shell">
      <div className="bg-orbs" />
      <div className="layout-wide">
        <header className="hero-card">
          <div className="hero-row">
            <div>
              <div className="badge">PedimOS</div>
              <h1>{menu?.restaurante?.nombre ?? "Pide lo que se te antoje"}</h1>
              <p>Canal cliente conectado al flujo operativo: sucursal, menu, carrito, pedido y seguimiento.</p>
            </div>
            <div className="hero-controls">
              <div className="chip">Sucursales activas: {branches.length}</div>
              <div className="chip">Productos: {menu?.productos.length ?? 0}</div>
              <div className="chip alert">{menuError ? menuError : "Operacion en linea"}</div>
            </div>
          </div>
        </header>

        <section className="three-col">
          <aside className="panel">
            <div className="panel-head">
              <h2>Cerca de ti</h2>
              <span className="muted">Mapa</span>
            </div>
            <div className="map-box">Mapa de sucursales</div>
            <p className="muted">El tiempo/estado real puede reflejarse por sucursal en el ecosistema ServimOS + PedimOS.</p>
          </aside>

          <main className="panel">
            <div className="panel-head">
              <h2>Explorar</h2>
              <input
                className="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar sucursal o producto..."
              />
            </div>
            <div className="list">
              {filteredBranches.map((branch) => (
                <article key={branch.id} className={`branch-card ${selectedBranchSlug === branch.slug ? "active" : ""}`}>
                  <div>
                    <h3>{branch.nombre}</h3>
                    <p>{branch.slug}</p>
                  </div>
                  <button onClick={() => setSelectedBranchSlug(branch.slug)}>Ver menu</button>
                </article>
              ))}
            </div>
          </main>

          <aside className="panel">
            <div className="panel-head">
              <h2>Portal del local</h2>
              <div className="chip">Mi tarjeta</div>
            </div>
            <div className="product-focus">
              {selectedProduct ? (
                <>
                  <img
                    src={selectedProduct.imageUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200"}
                    alt={selectedProduct.nombre}
                  />
                  <h3>{selectedProduct.nombre}</h3>
                  <p>ID {selectedProduct.id}</p>
                  <button onClick={() => addProduct(selectedProduct.id, selectedProduct.nombre)}>Agregar al pedido</button>
                </>
              ) : (
                <p className="muted">{loadingMenu ? "Cargando menu..." : "Selecciona una sucursal para cargar menu."}</p>
              )}
            </div>

            <div className="products-inline">
              {visibleProducts.slice(0, 6).map((product) => (
                <button
                  key={product.id}
                  className={`product-pill ${activeProductId === product.id ? "active" : ""}`}
                  onClick={() => setActiveProductId(product.id)}
                >
                  {product.nombre}
                </button>
              ))}
            </div>

            <section className="cart-card">
              <h3>Pedido</h3>
              <label>API key</label>
              <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="x-api-key" />
              <label>Idempotency key</label>
              <input value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} />
              <label>Sucursal</label>
              <select value={selectedBranchSlug} onChange={(event) => setSelectedBranchSlug(event.target.value)}>
                <option value="">Selecciona</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.slug}>
                    {branch.nombre}
                  </option>
                ))}
              </select>
              <label>Nombre cliente</label>
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              <label>Telefono</label>
              <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
              <label>Direccion</label>
              <input value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} />

              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div>
                      <strong>{item.name}</strong>
                      <p>Cantidad {item.qty}</p>
                    </div>
                    <span>{asCurrency(item.qty * item.unitPrice)}</span>
                  </div>
                ))}
              </div>
              <div className="total">Total {asCurrency(total)}</div>
              <div className="actions">
                <button className="secondary" onClick={() => setCart(cartState.read())}>
                  Refrescar
                </button>
                <button className="primary" disabled={submitting} onClick={checkout}>
                  {submitting ? "Enviando..." : "Confirmar pedido"}
                </button>
              </div>
              <button className="secondary full" onClick={pollStatus}>
                Consultar estado
              </button>
              <div className="timeline">
                {statusTimeline.map((row, index) => (
                  <div key={`${row.at}-${index}`} className="timeline-row">
                    <span>{row.at}</span>
                    <strong>{row.status}</strong>
                  </div>
                ))}
              </div>
              <pre className="log">{statusLog.join("\n")}</pre>
            </section>
          </aside>
        </section>

        <section className="windows-card">
          <h3>Navegacion por ventanas</h3>
          <p className="muted">Mapa, explorar, menu, cuenta, pedido e historial con acceso rapido.</p>
          <div className="windows-grid">
            {["Mapa", "Explorar", "Menu", "Cuenta", "Pedido", "Historial"].map((item) => (
              <div key={item} className="window-item">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
