import { useEffect, useMemo, useState } from "react";
import { apiClient, type Branch, type MenuCatalog } from "./api/client";
import { cartState, type CartItem } from "./state/cart";

const randomExternalOrderId = (): string => `ext-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

const asCurrency = (amount: number): string =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

const tabs = ["Mapa", "Explorar", "Menu", "Cuenta", "Pedido", "Historial"] as const;
type TabId = (typeof tabs)[number];

const tabsVisibleInNav: TabId[] = ["Explorar", "Menu"];

const readIntegrationConfig = (): { slug: string } => {
  try {
    const raw = localStorage.getItem("pedimos.integration.v1");
    if (!raw) return { slug: "" };
    const parsed = JSON.parse(raw) as { slug?: string };
    return { slug: parsed.slug ?? "" };
  } catch {
    return { slug: "" };
  }
};

const writeIntegrationSlug = (slug: string): void => {
  try {
    localStorage.setItem("pedimos.integration.v1", JSON.stringify({ slug }));
  } catch {
    /* ignore */
  }
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>("Explorar");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchSlug, setSelectedBranchSlug] = useState("");
  const [menu, setMenu] = useState<MenuCatalog | null>(null);
  const [exploreQuery, setExploreQuery] = useState("");
  const [menuQuery, setMenuQuery] = useState("");
  const [menuDegraded, setMenuDegraded] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [sessionReadySlug, setSessionReadySlug] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [lastOrderId, setLastOrderId] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(randomExternalOrderId());
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uiNotice, setUiNotice] = useState("");

  useEffect(() => {
    const cfg = readIntegrationConfig();
    setSelectedBranchSlug(cfg.slug);
    setCart(cartState.read());
    void apiClient
      .getBranches()
      .then((loaded) => {
        setBranches(loaded);
      })
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    setMenuQuery("");
  }, [selectedBranchSlug]);

  useEffect(() => {
    if (!selectedBranchSlug) return;
    setSessionReadySlug("");
    setLoadingMenu(true);
    setMenuError("");
    setMenuDegraded(false);
    void apiClient
      .startPublicSession(selectedBranchSlug)
      .then(() => {
        setSessionReadySlug(selectedBranchSlug);
        return apiClient.getMenuBySlug(selectedBranchSlug);
      })
      .then(({ data, degraded }) => {
        setMenu(data);
        const isDegraded = Boolean(degraded);
        setMenuDegraded(isDegraded);
        if (isDegraded) {
          setMenuError("No pudimos cargar el menú completo. Intenta de nuevo en un momento.");
        } else {
          setMenuError("");
        }
      })
      .catch((error) => {
        setMenu(null);
        setMenuDegraded(false);
        setMenuError(error instanceof Error ? error.message : "No se pudo cargar el menú.");
      })
      .finally(() => {
        setLoadingMenu(false);
      });
  }, [selectedBranchSlug]);

  const total = useMemo(() => cart.reduce((acc, item) => acc + item.qty * item.unitPrice, 0), [cart]);
  const filteredBranches = useMemo(() => {
    const term = exploreQuery.trim().toLowerCase();
    if (!term) return branches;
    return branches.filter((branch) => branch.nombre.toLowerCase().includes(term) || branch.slug.toLowerCase().includes(term));
  }, [branches, exploreQuery]);
  const catalogProducts = menu?.productos ?? [];
  const visibleProducts = useMemo(() => {
    const term = menuQuery.trim().toLowerCase();
    if (!term) return catalogProducts;
    return catalogProducts.filter((product) => product.nombre.toLowerCase().includes(term));
  }, [catalogProducts, menuQuery]);
  const branchDisplayName = useMemo(() => {
    if (!selectedBranchSlug) return "";
    return (
      branches.find((b) => b.slug === selectedBranchSlug)?.nombre ??
      menu?.restaurante?.nombre ??
      selectedBranchSlug
    );
  }, [branches, menu?.restaurante?.nombre, selectedBranchSlug]);

  const selectBranchAndGoMenu = (slug: string, nombre: string) => {
    writeIntegrationSlug(slug);
    setSelectedBranchSlug(slug);
    setActiveTab("Menu");
    setUiNotice(`Sucursal activa: ${nombre}`);
  };

  const getProductPrice = (product: (typeof visibleProducts)[number]): number => {
    const firstSize = product.tamanos?.[0];
    return firstSize?.precio ?? 38;
  };

  const addProduct = (productId: string, productName: string) => {
    const product = visibleProducts.find((item) => item.id === productId);
    const unitPrice = product ? getProductPrice(product) : 38;
    const next = cartState.add({
      id: `${productId}-${Date.now()}`,
      productId,
      name: productName,
      qty: 1,
      unitPrice
    });
    setCart(next);
    setUiNotice(`${productName} se agrego al pedido`);
  };

  const checkout = async () => {
    if (!selectedBranchSlug) {
      setStatusLog(["Selecciona sucursal para continuar."]);
      return;
    }
    if (!cart.length) {
      setStatusLog(["Agrega productos al carrito."]);
      return;
    }
    const first = customerFirstName.trim();
    const last = customerLastName.trim();
    const addrTrim = customerAddress.trim();
    if (!first || !last || !addrTrim) {
      setStatusLog(["Completa nombre, apellido y dirección de entrega para confirmar."]);
      return;
    }

    const fullName = `${first} ${last}`.trim();

    setSubmitting(true);
    const currentIdempotency = idempotencyKey.trim() || randomExternalOrderId();
    try {
      const payload = {
        externalOrderId: currentIdempotency,
        tipoPedido: "DELIVERY" as const,
        canal: "EXTERNAL_APP" as const,
        cliente: {
          nombre: fullName,
          telefono: "sin telefono",
          direccion: addrTrim
        },
        items: cart.map((item) => ({
          productoId: item.productId,
          cantidad: item.qty,
          modificadores: []
        }))
      };

      const created = await apiClient.createOrder({
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
      cartState.clear();
      setCart([]);
      setIdempotencyKey(randomExternalOrderId());
    } catch (error) {
      setStatusLog([error instanceof Error ? error.message : "Error al crear pedido."]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="bg-orbs" />
      <div className="layout-wide">
        <header className="top-nav">
          <div className="top-nav-header">
            <div className="brand-row">
              <div className="badge">PedimOS</div>
              <div>
                <strong className="brand-title">
                  {branchDisplayName || menu?.restaurante?.nombre || "Pide lo que se te antoje"}
                </strong>
                <p className="brand-subtitle">Explora locales, arma tu pedido y confirma la entrega</p>
              </div>
            </div>
            <div className="follow-chip">Pedidos a domicilio · Elige sucursal en Explorar</div>
          </div>
          <nav className="tab-grid tab-grid-two">
            {tabsVisibleInNav.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="top-nav-branch-bar">
            {selectedBranchSlug ? (
              <span className="branch-context-label">
                En: <strong>{branchDisplayName}</strong>
              </span>
            ) : (
              <p className="muted branch-context-hint">Selecciona la sucursal en Explorar.</p>
            )}
          </div>
          {uiNotice ? <div className="ui-notice">{uiNotice}</div> : null}
        </header>

        {activeTab === "Explorar" ? (
          <section className="panel">
            <div className="panel-head">
              <h2>Explorar</h2>
              <span className="muted">Elige un local</span>
            </div>
            <input
              className="search explore-search"
              value={exploreQuery}
              onChange={(event) => setExploreQuery(event.target.value)}
              placeholder="Buscar por nombre o slug de sucursal..."
            />
            <div className="list">
              {filteredBranches.map((branch) => (
                <article key={branch.id} className={`branch-card ${selectedBranchSlug === branch.slug ? "active" : ""}`}>
                  <div>
                    <h3>{branch.nombre}</h3>
                    <p>{branch.slug}</p>
                  </div>
                  <button type="button" onClick={() => selectBranchAndGoMenu(branch.slug, branch.nombre)}>
                    Entrar
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "Menu" ? (
          <section className="panel">
            {!selectedBranchSlug ? (
              <>
                <div className="panel-head">
                  <h2>Menu</h2>
                </div>
                <p className="muted">Primero elige una sucursal en Explorar.</p>
                <button type="button" className="primary" onClick={() => setActiveTab("Explorar")}>
                  Ir a Explorar
                </button>
              </>
            ) : (
              <>
                <div className="panel-head menu-panel-head">
                  <div>
                    <h2>Menu</h2>
                    <span className="muted">
                      {loadingMenu ? "Cargando..." : `${visibleProducts.length} productos mostrados`}
                      {!loadingMenu && catalogProducts.length !== visibleProducts.length && menuQuery.trim()
                        ? ` · ${catalogProducts.length} en la carta`
                        : null}
                    </span>
                  </div>
                  <input
                    className="search menu-search"
                    value={menuQuery}
                    onChange={(event) => setMenuQuery(event.target.value)}
                    placeholder="Buscar en el menú..."
                  />
                </div>
                <p className="muted session-line">Sesión: {sessionReadySlug || "sin sesión activa"}</p>
                {lastOrderId ? (
                  <div className="last-order-banner">
                    <p className="muted">
                      <strong>Último pedido:</strong> {lastOrderId}
                    </p>
                  </div>
                ) : null}
                {menuError ? <p className="muted menu-alert">{menuError}</p> : null}
                {!loadingMenu && catalogProducts.length === 0 && !menuDegraded && !menuError ? (
                  <p className="muted">Este local aún no tiene productos activos en la carta.</p>
                ) : null}
                {!loadingMenu &&
                catalogProducts.length > 0 &&
                visibleProducts.length === 0 &&
                menuQuery.trim() ? (
                  <p className="muted">
                    Ningún producto coincide con tu búsqueda. Prueba otro término o borra el filtro del menú.
                  </p>
                ) : null}
                <div className="products-grid-lite">
                  {visibleProducts.map((product) => (
                    <article key={product.id} className="product-focus">
                      <img
                        src={product.imageUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200"}
                        alt={product.nombre}
                      />
                      <h3>{product.nombre}</h3>
                      <p className="muted">Desde {asCurrency(getProductPrice(product))}</p>
                      <button type="button" onClick={() => addProduct(product.id, product.nombre)}>
                        Agregar
                      </button>
                    </article>
                  ))}
                </div>

                <div className="menu-cart-block">
                  <h3 className="pedido-subtitle">Tu carrito</h3>
                  <div className="cart-items">
                    {cart.length === 0 ? <p className="muted">Aún no hay productos.</p> : null}
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

                  {cart.length > 0 ? (
                    <div className="delivery-confirm-card">
                      <h4 className="pedido-subtitle">Datos de entrega</h4>
                      <p className="muted confirm-hint">Nombre, apellido y dirección donde llevamos tu pedido.</p>
                      <label>Nombre</label>
                      <input
                        value={customerFirstName}
                        onChange={(event) => setCustomerFirstName(event.target.value)}
                        placeholder="Ej. María"
                        autoComplete="given-name"
                      />
                      <label>Apellido</label>
                      <input
                        value={customerLastName}
                        onChange={(event) => setCustomerLastName(event.target.value)}
                        placeholder="Ej. López"
                        autoComplete="family-name"
                      />
                      <label>Dirección</label>
                      <input
                        value={customerAddress}
                        onChange={(event) => setCustomerAddress(event.target.value)}
                        placeholder="Calle, número, colonia, referencias"
                        autoComplete="street-address"
                      />
                    </div>
                  ) : null}

                  <details className="pedido-advanced">
                    <summary>Avanzado (idempotency)</summary>
                    <label>Idempotency key</label>
                    <input value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} />
                  </details>

                  <div className="actions">
                    <button type="button" className="secondary" onClick={() => setCart(cartState.read())}>
                      Refrescar carrito
                    </button>
                    <button type="button" className="primary" disabled={submitting} onClick={checkout}>
                      {submitting ? "Enviando..." : "Confirmar pedido"}
                    </button>
                  </div>
                  <pre className="log">{statusLog.join("\n")}</pre>
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
