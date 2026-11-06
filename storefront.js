const PRODUCT_STORAGE_KEY = "ecomarket-productos";
const CART_STORAGE_KEY = "ecomarket-carrito";
const PRODUCTS_URL = "./productos.json";

const productImages = {
  1: "photo-1587049352851-8d4e89133924",
  2: "photo-1546094096-0df4bcaaa337",
  3: "photo-1608248543803-ba4f8c70ae0b",
  4: "photo-1586201375761-83865001e31c",
  5: "",
  6: "photo-1523049673857-eb18f1d7b578",
  7: "photo-1528825871115-3581a5387919",
  8: "photo-1576045057995-568f588f82fb",
  9: "photo-1518977676601-b53f82aba655",
  10: "photo-1464965911861-746a04b4bca6",
  11: "photo-1586201375761-83865001e31c",
  12: "photo-1515543904379-3d757afe72e4",
  13: "photo-1447933601403-0c6688de566e",
  14: "photo-1589367920969-ab8e050bbb04",
  15: "photo-1606313564200-e75d5e30476c",
  16: "photo-1517673132405-a56a62b18caf",
  17: "photo-1544787219-7f47ccb76574",
  18: "photo-1608248543803-ba4f8c70ae0b",
  19: "photo-1608248543803-ba4f8c70ae0b",
  20: "photo-1608248543803-ba4f8c70ae0b",
  21: "photo-1608248543803-ba4f8c70ae0b",
  22: "photo-1608248543803-ba4f8c70ae0b",
  23: "photo-1608571423902-eed4a5ad8108",
  24: "photo-1600369671236-e74521d4b6ad",
  25: "photo-1597481499750-3e6b22637e12",
  26: "photo-1608248543803-ba4f8c70ae0b",
  27: "photo-1603006905003-be475563bc59",
  28: "photo-1563453392212-326f5e854473",
  29: "photo-1576045057995-568f588f82fb",
  30: "photo-1547514701-42782101795e",
  31: "photo-1445282768818-728615cc910a",
  32: "photo-1509440159596-0249088772ff",
  33: "photo-1474979266404-7eaacbcd87c5",
  34: "",
  35: "photo-1600369671236-e74521d4b6ad",
};

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const catalogGrid = document.querySelector("#store-product-grid");
const homeGrid = document.querySelector("#home-product-grid");
const cartLines = document.querySelector("#store-cart-lines");
const productSearch = document.querySelector("#store-search");
const categoryFilter = document.querySelector("#store-category");
const priceFilter = document.querySelector("#store-price");
const availabilityFilter = document.querySelector("#store-available");
const sortControl = document.querySelector("#store-sort");
const catalogStatus = document.querySelector("#store-feedback");
const cartStatus = document.querySelector("#cart-feedback");
const homeStatus = document.querySelector("#home-store-feedback");

let products = [];
let cart = [];
let catalogReady = false;
let cartReady = false;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function fallbackImage(product) {
  const name = product.nombre.toLocaleLowerCase("es");
  const iconByCategory = {
    "Frutas y verduras": "🥬",
    Despensa: "🌾",
    "Cuidado personal": "🌿",
    "Hogar sostenible": "♻",
  };
  const productIcons = [
    [/aguacate/, "🥑"],
    [/banano/, "🍌"],
    [/tomate/, "🍅"],
    [/fresa/, "🍓"],
    [/naranja/, "🍊"],
    [/zanahoria/, "🥕"],
    [/miel|abeja/, "🍯"],
    [/café/, "☕"],
    [/chocolate|cacao/, "🍫"],
    [/cepillo|dental/, "🪥"],
    [/jabón|champú|crema|bálsamo|acondicionador|desodorante/, "🧼"],
    [/bolsa/, "🛍"],
    [/toalla|paños|algodón/, "🧺"],
    [/vela/, "🕯"],
  ];
  const icon = productIcons.find(([pattern]) => pattern.test(name))?.[1]
    || iconByCategory[product.categoria]
    || "🌱";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="#e8f0df"/><circle cx="320" cy="210" r="118" fill="#fff" opacity=".8"/><text x="320" y="255" text-anchor="middle" font-size="126">${icon}</text><text x="320" y="414" text-anchor="middle" fill="#1f3a2d" font-family="Arial,sans-serif" font-size="25">EcoMarket</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", isError);
  element.hidden = !message;
}

function getImageUrl(product) {
  const photoId = productImages[product.id];
  if (!photoId || photoId.includes("?")) return fallbackImage(product);
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=640&q=82`;
}

function setProductImage(image, product) {
  image.src = getImageUrl(product);
  image.alt = product.nombre;
  image.loading = "lazy";
  image.addEventListener(
    "error",
    () => {
      image.src = fallbackImage(product);
    },
    { once: true },
  );
}

function getStoredProducts() {
  let stored;
  try {
    stored = localStorage.getItem(PRODUCT_STORAGE_KEY);
  } catch (error) {
    throw new Error("No se pudo leer el catálogo guardado en este navegador.");
  }

  if (stored === null) return null;

  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new Error("El catálogo guardado no es JSON válido. Revisa la clave localStorage «ecomarket-productos».");
  }

  if (typeof validarProductos !== "function") {
    throw new Error("No se encontró el validador del catálogo.");
  }

  const errors = validarProductos(parsed);
  if (errors.length) {
    throw new Error(`El catálogo guardado tiene errores y no se cargó: ${errors
      .slice(0, 3)
      .map((item) => `${item.campo}: ${item.causa}`)
      .join(" ")}${errors.length > 3 ? " Hay más errores." : ""}`);
  }

  return parsed;
}

async function loadProducts() {
  try {
    const storedProducts = getStoredProducts();
    if (storedProducts) {
      products = storedProducts;
    } else {
      const response = await fetch(PRODUCTS_URL);
      if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);
      products = await response.json();
      const errors = validarProductos(products);
      if (errors.length) {
        throw new Error(`El dataset inicial no pasó la validación: ${errors[0].campo}: ${errors[0].causa}`);
      }
    }
    catalogReady = true;
    configurePriceFilter();
    renderCatalog();
    renderHomeProducts();
    renderCart();
  } catch (error) {
    console.error("No se pudo cargar el catálogo de EcoMarket.", error);
    const message = error instanceof TypeError
      ? "No se pudo cargar productos.json. Abre el proyecto desde un servidor local."
      : error.message;
    setStatus(catalogStatus, message, true);
    setStatus(cartStatus, message, true);
    if (catalogGrid) catalogGrid.setAttribute("aria-busy", "false");
    if (homeGrid) {
      homeGrid.setAttribute("aria-busy", "false");
      homeGrid.replaceChildren(createElement("p", "catalog-empty", message));
    }
    if (cartLines) cartLines.setAttribute("aria-busy", "false");
  }
}

function readCart() {
  let stored;
  try {
    stored = localStorage.getItem(CART_STORAGE_KEY);
  } catch (error) {
    throw new Error("No se pudo leer el carrito guardado en este navegador.");
  }
  if (stored === null) return [];

  let parsed;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new Error("El carrito guardado no es JSON válido. Revisa la clave localStorage «ecomarket-carrito».");
  }
  if (
    !Array.isArray(parsed) ||
    new Set(parsed.map((item) => item?.id)).size !== parsed.length ||
    parsed.some(
      (item) =>
        !item ||
        !Number.isInteger(item.id) ||
        !Number.isInteger(item.cantidad) ||
        item.cantidad < 1,
    )
  ) {
    throw new Error("El carrito guardado tiene un formato no válido.");
  }
  return parsed;
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("No se pudo guardar el carrito.", error);
    setStatus(cartStatus || catalogStatus || homeStatus, "No se guardaron los cambios del carrito. Revisa el almacenamiento disponible e inténtalo de nuevo.", true);
    return false;
  }
  renderCartCount();
  return true;
}

function loadCart() {
  try {
    cart = readCart();
    cartReady = true;
    renderCart();
    renderCartCount();
  } catch (error) {
    console.error("No se pudo cargar el carrito de EcoMarket.", error);
    setStatus(cartStatus, error.message, true);
  }
}

function configurePriceFilter() {
  if (!priceFilter) return;
  const maximum = Math.max(...products.map((product) => product.precio), 0);
  priceFilter.max = String(maximum);
  priceFilter.value = String(maximum);
  updatePriceLabel();
}

function updatePriceLabel() {
  const label = document.querySelector("#store-price-label");
  if (label && priceFilter) label.textContent = currency.format(Number(priceFilter.value));
}

function getProductStatus(product) {
  if (!product.activo) return "Inactivo";
  if (product.stock === 0) return "Agotado";
  if (product.stock <= product.stockMinimo) return "Stock bajo";
  return "Disponible";
}

function getFilteredProducts() {
  const query = productSearch?.value.trim().toLocaleLowerCase("es") || "";
  const category = categoryFilter?.value || "";
  const maximumPrice = Number(priceFilter?.value ?? Infinity);
  const onlyAvailable = availabilityFilter?.checked || false;
  const filtered = products.filter((product) => {
    const searchText = `${product.nombre} ${product.productor} ${product.categoria} ${product.ciudad}`
      .toLocaleLowerCase("es");
    return (
      product.activo &&
      (!query || searchText.includes(query)) &&
      (!category || product.categoria === category) &&
      product.precio <= maximumPrice &&
      (!onlyAvailable || product.stock > 0)
    );
  });

  const sort = sortControl?.value || "featured";
  if (sort === "name") filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  if (sort === "price-asc") filtered.sort((a, b) => a.precio - b.precio);
  if (sort === "price-desc") filtered.sort((a, b) => b.precio - a.precio);
  return filtered;
}

function createProductCard(product, home = false) {
  const card = createElement("article", home ? "product-card" : "store-product-card");
  const imageWrap = createElement("div", home ? "product-image-link" : "store-product-image");
  const image = document.createElement("img");
  setProductImage(image, product);
  imageWrap.append(image);

  const details = createElement("div", home ? "product-details" : "store-product-details");
  if (home) {
    details.append(createElement("p", "product-category", product.categoria));
    details.append(createElement("h3", "", product.nombre));
    const description = createElement(
      "p",
      "product-description",
      `${product.productor} · ${product.ciudad}`,
    );
    details.append(description);
  } else {
    const title = createElement("h2", "", product.nombre);
    const price = createElement("strong", "", currency.format(product.precio));
    const producer = createElement("p", "store-product-meta", `${product.categoria} · ${product.ciudad}`);
    const availability = createElement(
      "span",
      `store-stock ${product.stock > 0 ? "" : "is-out"}`,
      product.stock > 0 ? `${product.stock} disponibles` : "Agotado",
    );
    details.append(title, price, producer, availability);
  }

  const addButton = createElement(
    "button",
    home ? "button store-add-button" : "store-add-button",
    product.stock > 0 ? "＋ Agregar al carrito" : "Agotado",
  );
  addButton.type = "button";
  addButton.dataset.storeAction = "add";
  addButton.dataset.productId = String(product.id);
  addButton.disabled = product.stock < 1;
  addButton.setAttribute(
    "aria-label",
    product.stock > 0 ? `Agregar ${product.nombre} al carrito` : `${product.nombre} agotado`,
  );
  details.append(addButton);
  card.append(imageWrap, details);
  return card;
}

function renderCatalog() {
  if (!catalogGrid) return;
  catalogGrid.replaceChildren();
  catalogGrid.setAttribute("aria-busy", "false");
  const visibleProducts = getFilteredProducts();
  visibleProducts.forEach((product) => catalogGrid.append(createProductCard(product)));
  const count = document.querySelector("#store-results-count");
  if (count) count.textContent = `${visibleProducts.length} de ${products.filter((product) => product.activo).length} productos`;
  const empty = document.querySelector("#store-empty");
  if (empty) empty.hidden = visibleProducts.length > 0;
}

function renderHomeProducts() {
  if (!homeGrid) return;
  homeGrid.replaceChildren();
  homeGrid.setAttribute("aria-busy", "false");
  const featured = products.filter((product) => product.activo && product.stock > 0).slice(0, 3);
  featured.forEach((product) => homeGrid.append(createProductCard(product, true)));
}

function getCartQuantity() {
  return cart.reduce((total, item) => total + item.cantidad, 0);
}

function renderCartCount() {
  const count = getCartQuantity();
  document.querySelectorAll(".store-cart-count").forEach((badge) => {
    badge.textContent = String(count);
  });
  document.querySelectorAll(".store-cart-link").forEach((link) => {
    link.setAttribute("aria-label", count === 1 ? "Ver carrito, 1 producto" : `Ver carrito, ${count} productos`);
  });
}

function createCartLine(item, product) {
  const row = createElement("article", "store-cart-row");
  const productCell = createElement("div", "store-cart-product");
  if (product) {
    const image = document.createElement("img");
    setProductImage(image, product);
    productCell.append(image, createElement("h3", "", product.nombre));
  } else {
    productCell.append(createElement("h3", "", "Producto no disponible"));
  }

  const unitPrice = product ? product.precio : 0;
  const available = Boolean(product && product.activo && product.stock > 0);
  const unit = createElement("strong", "store-cart-unit", product ? currency.format(unitPrice) : "—");
  const quantity = createElement("div", "store-quantity");
  quantity.setAttribute("aria-label", `Cantidad: ${item.cantidad}`);
  const decrease = createElement("button", "", "−");
  decrease.type = "button";
  decrease.dataset.cartAction = "decrease";
  decrease.dataset.productId = String(item.id);
  decrease.disabled = item.cantidad <= 1;
  decrease.setAttribute("aria-label", `Reducir ${product?.nombre || "producto"}`);
  const amount = createElement("span", "", String(item.cantidad));
  const increase = createElement("button", "", "＋");
  increase.type = "button";
  increase.dataset.cartAction = "increase";
  increase.dataset.productId = String(item.id);
  increase.disabled = !available || item.cantidad >= product.stock;
  increase.setAttribute("aria-label", `Aumentar ${product?.nombre || "producto"}`);
  quantity.append(decrease, amount, increase);

  const subtotal = createElement(
    "strong",
    "store-cart-subtotal",
    product ? currency.format(unitPrice * item.cantidad) : "—",
  );
  const remove = createElement("button", "store-remove-item", "×");
  remove.type = "button";
  remove.dataset.cartAction = "remove";
  remove.dataset.productId = String(item.id);
  remove.setAttribute("aria-label", `Quitar ${product?.nombre || "producto"} del carrito`);
  row.append(productCell, unit, quantity, subtotal, remove);

  if (!available || item.cantidad > product.stock) {
    const warning = createElement(
      "p",
      "store-cart-warning",
      !product || !product.activo || product.stock === 0
        ? "Este producto ya no está disponible. Quítalo para continuar."
        : `Stock actualizado: solo quedan ${product.stock} unidades.`,
    );
    row.append(warning);
  }
  return row;
}

function renderCart() {
  if (!cartLines || !catalogReady || !cartReady) return;
  cartLines.replaceChildren();
  cartLines.setAttribute("aria-busy", "false");
  const empty = document.querySelector("#store-cart-empty");
  if (empty) empty.hidden = cart.length > 0;
  let subtotal = 0;
  let hasUnavailable = false;

  cart.forEach((item) => {
    const product = products.find((candidate) => candidate.id === item.id);
    cartLines.append(createCartLine(item, product));
    if (!product || !product.activo || product.stock < item.cantidad) {
      hasUnavailable = true;
    } else {
      subtotal += product.precio * item.cantidad;
    }
  });

  const shipping = subtotal > 0 ? 10000 : 0;
  document.querySelector("#store-cart-subtotal").textContent = currency.format(subtotal);
  document.querySelector("#store-cart-shipping").textContent = currency.format(shipping);
  document.querySelector("#store-cart-total").textContent = currency.format(subtotal + shipping);
  const checkout = document.querySelector("#store-checkout");
  checkout.disabled = cart.length === 0 || hasUnavailable;
  if (hasUnavailable) {
    setStatus(cartStatus, "Revisa los productos con disponibilidad o stock actualizado antes de continuar.", true);
  } else if (cartStatus?.classList.contains("is-error")) {
    setStatus(cartStatus, "");
  }
}

function addToCart(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product || !product.activo || product.stock < 1) {
    setStatus(catalogStatus || homeStatus, "Este producto no está disponible.", true);
    return;
  }
  const cartItem = cart.find((item) => item.id === productId);
  if (cartItem && cartItem.cantidad >= product.stock) {
    setStatus(catalogStatus || homeStatus, `Solo hay ${product.stock} unidades de «${product.nombre}» disponibles.`, true);
    return;
  }
  if (cartItem) cartItem.cantidad += 1;
  else cart.push({ id: productId, cantidad: 1 });
  if (!saveCart()) return;
  setStatus(catalogStatus || homeStatus, `«${product.nombre}» se agregó al carrito.`);
  renderCart();
}

function handleStoreAction(event) {
  const button = event.target.closest("button[data-store-action]");
  if (!button) return;
  addToCart(Number(button.dataset.productId));
}

function handleCartAction(event) {
  const button = event.target.closest("button[data-cart-action]");
  if (!button) return;
  const productId = Number(button.dataset.productId);
  const itemIndex = cart.findIndex((entry) => entry.id === productId);
  if (itemIndex < 0) return;
  const action = button.dataset.cartAction;
  if (action === "remove") {
    cart.splice(itemIndex, 1);
  } else if (action === "decrease" && cart[itemIndex].cantidad > 1) {
    cart[itemIndex].cantidad -= 1;
  } else if (action === "increase") {
    const product = products.find((entry) => entry.id === productId);
    if (!product || cart[itemIndex].cantidad >= product.stock) {
      setStatus(cartStatus, "No hay más unidades disponibles para este producto.", true);
      return;
    }
    cart[itemIndex].cantidad += 1;
  }
  if (saveCart()) {
    setStatus(cartStatus, "");
    renderCart();
  }
}

function resetFilters() {
  if (productSearch) productSearch.value = "";
  if (categoryFilter) categoryFilter.value = "";
  if (availabilityFilter) availabilityFilter.checked = false;
  if (priceFilter) priceFilter.value = priceFilter.max;
  if (sortControl) sortControl.value = "featured";
  updatePriceLabel();
  renderCatalog();
}

function finishDemoOrder() {
  if (!cart.length) return;
  if (cart.some((item) => {
    const product = products.find((entry) => entry.id === item.id);
    return !product || !product.activo || product.stock < item.cantidad;
  })) {
    setStatus(cartStatus, "Ajusta o quita los productos sin stock antes de continuar.", true);
    return;
  }
  const accepted = window.confirm(
    "Este es un pedido de demostración. No se realizará un cobro ni se descontará inventario. ¿Deseas confirmar y vaciar el carrito?",
  );
  if (!accepted) return;
  cart = [];
  if (saveCart()) {
    setStatus(cartStatus, "Pedido de prueba confirmado. No se procesó un pago ni se modificó el inventario.");
    renderCart();
  }
}

catalogGrid?.addEventListener("click", handleStoreAction);
homeGrid?.addEventListener("click", handleStoreAction);
cartLines?.addEventListener("click", handleCartAction);
productSearch?.addEventListener("input", renderCatalog);
categoryFilter?.addEventListener("change", renderCatalog);
priceFilter?.addEventListener("input", () => {
  updatePriceLabel();
  renderCatalog();
});
availabilityFilter?.addEventListener("change", renderCatalog);
sortControl?.addEventListener("change", renderCatalog);
document.querySelector("#store-reset")?.addEventListener("click", resetFilters);
document.querySelector("#store-checkout")?.addEventListener("click", finishDemoOrder);
window.addEventListener("storage", (event) => {
  if (event.key === PRODUCT_STORAGE_KEY) {
    loadProducts();
  }
  if (event.key === CART_STORAGE_KEY) {
    loadCart();
    renderCart();
  }
});

loadCart();
loadProducts();
