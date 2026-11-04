function validarProductos(lista) {
  const errores = [];
  const categoriasValidas = [
    "Frutas y verduras",
    "Despensa",
    "Cuidado personal",
    "Hogar sostenible",
  ];
  const ciudadesValidas = [
    "Bucaramanga",
    "Floridablanca",
    "Girón",
    "Bogotá",
    "Medellín",
    "Cali",
    "Tunja",
    "Cúcuta",
  ];
  const fechaMinima = "2026-01-01";
  const fechaMaxima = "2026-11-03";

  function agregarError(producto, campo, causa) {
    errores.push({ producto, campo, causa });
  }

  if (!Array.isArray(lista)) {
    agregarError(null, "lista", "Se esperaba un arreglo de productos.");
    return errores;
  }

  const idsVistos = new Set();

  lista.forEach((producto, indice) => {
    const referencia = {
      indice: indice + 1,
      id: producto && typeof producto === "object" ? producto.id ?? null : null,
    };

    if (producto === null || typeof producto !== "object" || Array.isArray(producto)) {
      agregarError(referencia, "producto", "Cada elemento debe ser un objeto de producto.");
      return;
    }

    if (!Number.isInteger(producto.id) || producto.id <= 0) {
      agregarError(referencia, "id", "Debe ser un entero mayor que cero.");
    } else if (idsVistos.has(producto.id)) {
      agregarError(referencia, "id", `El ID ${producto.id} está repetido.`);
    } else {
      idsVistos.add(producto.id);
    }

    if (typeof producto.nombre !== "string" || producto.nombre.trim() === "") {
      agregarError(referencia, "nombre", "Debe ser un texto no vacío.");
    }

    if (typeof producto.productor !== "string" || producto.productor.trim() === "") {
      agregarError(referencia, "productor", "Debe ser un texto no vacío.");
    }

    if (!categoriasValidas.includes(producto.categoria)) {
      agregarError(
        referencia,
        "categoria",
        `Debe pertenecer a: ${categoriasValidas.join(", ")}.`,
      );
    }

    if (!Number.isInteger(producto.precio) || producto.precio <= 0) {
      agregarError(referencia, "precio", "Debe ser un entero positivo en pesos colombianos.");
    }

    if (!Number.isInteger(producto.stock) || producto.stock < 0) {
      agregarError(referencia, "stock", "Debe ser un entero mayor o igual a cero.");
    }

    if (!Number.isInteger(producto.stockMinimo) || producto.stockMinimo < 0) {
      agregarError(referencia, "stockMinimo", "Debe ser un entero mayor o igual a cero.");
    }

    if (!ciudadesValidas.includes(producto.ciudad)) {
      agregarError(
        referencia,
        "ciudad",
        `Debe pertenecer a: ${ciudadesValidas.join(", ")}.`,
      );
    }

    if (typeof producto.organico !== "boolean") {
      agregarError(referencia, "organico", "Debe ser un valor booleano.");
    }

    if (typeof producto.activo !== "boolean") {
      agregarError(referencia, "activo", "Debe ser un valor booleano.");
    }

    const fechaEsValida =
      typeof producto.fechaRegistro === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(producto.fechaRegistro) &&
      !Number.isNaN(Date.parse(`${producto.fechaRegistro}T00:00:00Z`)) &&
      new Date(`${producto.fechaRegistro}T00:00:00Z`).toISOString().slice(0, 10) ===
        producto.fechaRegistro;

    if (!fechaEsValida) {
      agregarError(referencia, "fechaRegistro", "Debe ser una fecha válida con formato AAAA-MM-DD.");
    } else if (producto.fechaRegistro < fechaMinima || producto.fechaRegistro > fechaMaxima) {
      agregarError(
        referencia,
        "fechaRegistro",
        `Debe estar entre ${fechaMinima} y ${fechaMaxima}, inclusive.`,
      );
    }
  });

  return errores;
}
