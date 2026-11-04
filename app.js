const STORAGE_KEY = "ecomarket-productos";
const productosUrl = "./productos.json";

const productGrid = document.querySelector("#product-grid");
const catalogEmpty = document.querySelector("#catalog-empty");
const catalogError = document.querySelector("#catalog-error");
const productCountLabel = document.querySelector("#product-count-label");
const productSearch = document.querySelector("#product-search");
const categoryFilter = document.querySelector("#category-filter");
const cityFilter = document.querySelector("#city-filter");
const statusFilter = document.querySelector("#status-filter");
const productDialog = document.querySelector("#product-dialog");
const productForm = document.querySelector("#product-form");
const productFormError = document.querySelector("#product-form-error");

let productos = [];
let catalogoListo = false;

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CO");

function obtenerEstado(producto) {
  if (producto.stock === 0) {
    return "Agotado";
  }

  if (producto.stock <= producto.stockMinimo) {
    return "Stock bajo";
  }

  return "Disponible";
}

function crearElemento(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function mostrarError(mensaje) {
  catalogError.textContent = mensaje;
  catalogError.hidden = false;
}

function limpiarError() {
  catalogError.textContent = "";
  catalogError.hidden = true;
}

function renderizarKpis() {
  const activos = productos.filter((producto) => producto.activo);
  const inventarioBajo = activos.filter(
    (producto) => producto.stock <= producto.stockMinimo,
  ).length;
  const valorInventario = activos.reduce(
    (total, producto) => total + producto.precio * producto.stock,
    0,
  );

  document.querySelector("#kpi-product-count").textContent = numberFormatter.format(
    activos.length,
  );
  document.querySelector("#kpi-low-stock").textContent = numberFormatter.format(
    inventarioBajo,
  );
  document.querySelector("#kpi-inventory-value").textContent =
    currencyFormatter.format(valorInventario);
}

function crearProductCard(producto) {
  const card = crearElemento("article", "product-card catalog-product-card");
  const details = crearElemento("div", "product-details");
  const heading = crearElemento("div", "catalog-card-heading");
  const title = crearElemento("h3", "", producto.nombre);
  const badgeClasses = {
    Disponible: "status-available",
    "Stock bajo": "status-low",
    Agotado: "status-out",
  };
  const state = obtenerEstado(producto);
  const badge = crearElemento(
    "span",
    `status-badge ${badgeClasses[state]}`,
    state,
  );
  const category = crearElemento("p", "product-category", producto.categoria);
  const price = crearElemento(
    "p",
    "catalog-product-price",
    currencyFormatter.format(producto.precio),
  );
  const facts = crearElemento("dl", "catalog-product-facts");
  const producer = crearProductFact("Productor", producto.productor);
  const city = crearProductFact("Ciudad", producto.ciudad);
  const stock = crearProductFact(
    "Stock",
    `${numberFormatter.format(producto.stock)} · mínimo ${numberFormatter.format(producto.stockMinimo)}`,
  );
  const organic = crearProductFact("Orgánico", producto.organico ? "Sí" : "No");
  const active = crearProductFact("Catálogo", producto.activo ? "Activo" : "Inactivo");
  const actions = crearElemento("div", "catalog-card-actions");
  const editButton = crearElemento("button", "row-action row-action-edit", "Editar");
  const deleteButton = crearElemento(
    "button",
    "row-action row-action-delete",
    "Eliminar",
  );

  heading.append(title, badge);
  details.append(heading, category, price);
  facts.append(producer, city, stock, organic, active);
  editButton.type = "button";
  editButton.dataset.action = "edit";
  editButton.dataset.productId = String(producto.id);
  editButton.setAttribute("aria-label", `Editar ${producto.nombre}`);
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.productId = String(producto.id);
  deleteButton.setAttribute("aria-label", `Eliminar ${producto.nombre}`);
  actions.append(editButton, deleteButton);
  card.append(details, facts, actions);

  return card;
}

function crearProductFact(label, value) {
  const wrapper = document.createElement("div");
  const term = crearElemento("dt", "", label);
  const description = crearElemento("dd", "", value);
  wrapper.append(term, description);
  return wrapper;
}

function obtenerProductosFiltrados() {
  const query = productSearch.value.trim().toLocaleLowerCase("es");
  const category = categoryFilter.value;
  const city = cityFilter.value;
  const state = statusFilter.value;

  return productos.filter((producto) => {
    const matchesQuery =
      !query ||
      producto.nombre.toLocaleLowerCase("es").includes(query) ||
      producto.productor.toLocaleLowerCase("es").includes(query);

    return (
      matchesQuery &&
      (!category || producto.categoria === category) &&
      (!city || producto.ciudad === city) &&
      (!state || obtenerEstado(producto) === state)
    );
  });
}

function renderizarProductos() {
  productGrid.replaceChildren();

  if (!catalogoListo) {
    productGrid.setAttribute("aria-busy", "true");
    catalogEmpty.hidden = true;
    productCountLabel.textContent = "No se pudo cargar el catálogo.";
    return;
  }

  productGrid.setAttribute("aria-busy", "false");
  const filtrados = obtenerProductosFiltrados();

  filtrados.forEach((producto) => {
    productGrid.append(crearProductCard(producto));
  });

  productCountLabel.textContent =
    filtrados.length === productos.length
      ? `${numberFormatter.format(productos.length)} productos`
      : `${numberFormatter.format(filtrados.length)} de ${numberFormatter.format(productos.length)} productos`;

  if (filtrados.length === 0) {
    catalogEmpty.textContent =
      productos.length === 0
        ? "El catálogo está vacío. Agrega un producto para comenzar."
        : "No hay productos que coincidan con los filtros seleccionados.";
    catalogEmpty.hidden = false;
  } else {
    catalogEmpty.textContent = "";
    catalogEmpty.hidden = true;
  }
}

function mostrarErroresValidacion(errores) {
  productFormError.textContent = errores
    .map(
      (error) =>
        `Producto ${error.producto?.id ?? error.producto?.indice ?? ""}, campo ${error.campo}: ${error.causa}`,
    )
    .join(" ");
  productFormError.hidden = false;
}

function validarLista(lista) {
  return validarProductos(lista);
}

function guardarProductos(lista) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return true;
  } catch (error) {
    console.error("No se pudo guardar el catálogo en localStorage.", error);
    mostrarError(
      "No se guardaron los cambios en este navegador. Revisa el almacenamiento disponible e inténtalo de nuevo.",
    );
    return false;
  }
}

function confirmarCambios(lista) {
  const errores = validarLista(lista);

  if (errores.length > 0) {
    mostrarErroresValidacion(errores);
    return false;
  }

  if (!guardarProductos(lista)) {
    return false;
  }

  productos = lista;
  limpiarError();
  renderizarKpis();
  renderizarProductos();
  return true;
}

function establecerValor(id, value) {
  document.getElementById(id).value = value;
}

function abrirDialogo(producto) {
  productForm.reset();
  productFormError.textContent = "";
  productFormError.hidden = true;

  if (producto) {
    document.querySelector("#product-dialog-title").textContent = "Editar producto";
    establecerValor("product-id", producto.id);
    establecerValor("product-name", producto.nombre);
    establecerValor("product-category", producto.categoria);
    establecerValor("product-price", producto.precio);
    establecerValor("product-stock", producto.stock);
    establecerValor("product-min-stock", producto.stockMinimo);
    establecerValor("product-producer", producto.productor);
    establecerValor("product-city", producto.ciudad);
    establecerValor("product-date", producto.fechaRegistro);
    document.querySelector("#product-organic").checked = producto.organico;
    document.querySelector("#product-active").checked = producto.activo;
  } else {
    document.querySelector("#product-dialog-title").textContent = "Agregar producto";
    establecerValor("product-id", "");
    establecerValor("product-date", "2026-11-03");
  }

  productDialog.showModal();
  document.querySelector("#product-name").focus();
}

function leerProductoDesdeFormulario() {
  const formData = new FormData(productForm);
  const idValue = formData.get("id");
  const maxId = productos.reduce(
    (maximo, producto) => Math.max(maximo, producto.id),
    0,
  );

  return {
    id: idValue === "" ? maxId + 1 : Number(idValue),
    nombre: String(formData.get("nombre")).trim(),
    categoria: String(formData.get("categoria")),
    precio: Number(formData.get("precio")),
    stock: Number(formData.get("stock")),
    stockMinimo: Number(formData.get("stockMinimo")),
    productor: String(formData.get("productor")).trim(),
    ciudad: String(formData.get("ciudad")),
    organico: document.querySelector("#product-organic").checked,
    fechaRegistro: String(formData.get("fechaRegistro")),
    activo: document.querySelector("#product-active").checked,
  };
}

async function cargarCatalogo() {
  let contenidoGuardado;

  try {
    contenidoGuardado = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("No se pudo leer localStorage.", error);
    mostrarError(
      "No se pudo consultar el almacenamiento del navegador. Revisa la configuración del navegador para este sitio.",
    );
    renderizarProductos();
    return;
  }

  if (contenidoGuardado !== null) {
    let datosGuardados;

    try {
      datosGuardados = JSON.parse(contenidoGuardado);
    } catch (error) {
      console.error("El catálogo guardado no contiene JSON válido.", error);
      mostrarError(
        "Los datos guardados no son JSON válido. No se modificaron ni se reemplazaron; revisa o elimina la clave localStorage «ecomarket-productos» para cargar el dataset inicial.",
      );
      renderizarProductos();
      return;
    }

    const errores = validarLista(datosGuardados);

    if (errores.length > 0) {
      mostrarError(
        `El catálogo guardado contiene errores y no se cargó: ${errores
          .slice(0, 5)
          .map((error) => `${error.campo}: ${error.causa}`)
          .join(" ")}${errores.length > 5 ? ` Hay ${errores.length - 5} errores más.` : ""}`,
      );
      renderizarProductos();
      return;
    }

    productos = datosGuardados;
    catalogoListo = true;
    limpiarError();
    renderizarKpis();
    renderizarProductos();
    return;
  }

  try {
    const response = await fetch(productosUrl);

    if (!response.ok) {
      throw new Error(`El servidor respondió ${response.status}.`);
    }

    const datosIniciales = await response.json();
    const errores = validarLista(datosIniciales);

    if (errores.length > 0) {
      mostrarError(
        `El dataset inicial no pasó la validación: ${errores
          .slice(0, 5)
          .map((error) => `${error.campo}: ${error.causa}`)
          .join(" ")}${errores.length > 5 ? ` Hay ${errores.length - 5} errores más.` : ""}`,
      );
      renderizarProductos();
      return;
    }

    productos = datosIniciales;
    catalogoListo = true;
    limpiarError();
    renderizarKpis();
    renderizarProductos();
  } catch (error) {
    console.error("No se pudo cargar productos.json.", error);
    mostrarError(
      "No se pudo cargar productos.json. Ejecuta el proyecto desde un servidor local (por ejemplo, Live Server) y vuelve a cargar la página.",
    );
    renderizarProductos();
  }
}

productSearch.addEventListener("input", renderizarProductos);
categoryFilter.addEventListener("change", renderizarProductos);
cityFilter.addEventListener("change", renderizarProductos);
statusFilter.addEventListener("change", renderizarProductos);

document.querySelector("#clear-filters-button").addEventListener("click", () => {
  productSearch.value = "";
  categoryFilter.value = "";
  cityFilter.value = "";
  statusFilter.value = "";
  renderizarProductos();
  productSearch.focus();
});

document.querySelector("#add-product-button").addEventListener("click", () => {
  if (!catalogoListo) {
    mostrarError("No es posible modificar el catálogo hasta que sus datos se carguen correctamente.");
    return;
  }

  abrirDialogo(null);
});

document.querySelector("#close-product-dialog").addEventListener("click", () => {
  productDialog.close();
});

document.querySelector("#cancel-product-dialog").addEventListener("click", () => {
  productDialog.close();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const producto = productos.find(
    (item) => item.id === Number(button.dataset.productId),
  );

  if (!producto) {
    mostrarError("No se encontró el producto seleccionado. Recarga el catálogo e inténtalo de nuevo.");
    return;
  }

  if (button.dataset.action === "edit") {
    abrirDialogo(producto);
    return;
  }

  if (
    button.dataset.action === "delete" &&
    window.confirm(`¿Seguro que quieres eliminar «${producto.nombre}»?`)
  ) {
    confirmarCambios(productos.filter((item) => item.id !== producto.id));
  }
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  productFormError.textContent = "";
  productFormError.hidden = true;

  if (!productForm.reportValidity()) {
    return;
  }

  const producto = leerProductoDesdeFormulario();
  const existingId = producto.id;
  const esEdicion = document.querySelector("#product-id").value !== "";
  const listaActualizada = esEdicion
    ? productos.map((item) => (item.id === existingId ? producto : item))
    : [...productos, producto];

  if (esEdicion && !productos.some((item) => item.id === existingId)) {
    mostrarError("El producto que intentas editar ya no existe en el catálogo.");
    return;
  }

  if (confirmarCambios(listaActualizada)) {
    productDialog.close();
  }
});

cargarCatalogo();
