/**
 * ============================================================
 * HOGAR.SYS — SERVICIO DE IA (THE HIVE AI + DEEPSEEK)
 * ============================================================
 */

const HIVE_API_URL = "/api-hive/api/v3/chat/completions";
const HIVE_TIMEOUT_MS = 25000;

const HIVE_MODEL =
  import.meta.env.VITE_LLM_MODEL?.trim() ||
  "deepseek-ai/deepseek-v4.1-flash-1017";

const MAX_PRODUCTOS_IA = 50;
const MAX_VENTAS_IA = 20;
const MAX_SUGERENCIAS = 2;
const MAX_PROMOCIONES = 3;

const cacheSugerencias = new Map();

// ============================================================
// UTILIDADES SEGURAS
// ============================================================

const obtenerNombre = producto =>
  String(producto?.nombre || producto?.name || "Producto").trim().slice(0, 100);

const obtenerId = producto =>
  producto?.id == null ? "" : String(producto.id);

const tieneStock = producto =>
  Number.isFinite(Number(producto?.stock)) && Number(producto.stock) > 0;

const numeroSeguro = valor => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

const textoSeguro = (valor, max = 300) =>
  String(valor ?? "").trim().slice(0, max);

const extraerJson = contenido => {
  if (typeof contenido !== "string" || !contenido.trim()) return null;

  let texto = contenido
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Aislar el objeto JSON descartando razonamientos previos
  const inicio = texto.indexOf("{");
  const fin = texto.lastIndexOf("}");

  if (inicio < 0) return null;

  // Si existe una llave de cierre válida
  if (fin > inicio) {
    texto = texto.slice(inicio, fin + 1);
  } else {
    texto = texto.slice(inicio);
  }

  // Intento 1: Parseo directo
  try {
    return JSON.parse(texto);
  } catch {
    // Intento 2: Cierre automático si quedó truncado por tokens
    try {
      let textoReparado = texto;
      const comillas = (textoReparado.match(/"/g) || []).length;
      if (comillas % 2 !== 0) textoReparado += '"';

      const corchetesAbiertos = (textoReparado.match(/\[/g) || []).length;
      const corchetesCerrados = (textoReparado.match(/\]/g) || []).length;
      for (let i = 0; i < corchetesAbiertos - corchetesCerrados; i++) {
        textoReparado += "]";
      }

      const llavesAbiertas = (textoReparado.match(/\{/g) || []).length;
      const llavesCerradas = (textoReparado.match(/\}/g) || []).length;
      for (let i = 0; i < llavesAbiertas - llavesCerradas; i++) {
        textoReparado += "}";
      }

      return JSON.parse(textoReparado);
    } catch {
      return null;
    }
  }
};
/**
 * ============================================================
 * HELPER: PETICIÓN A THE HIVE AI API (CORREGIDO PARA DEEPSEEK)
 * ============================================================
 */
const consultarHive = async (systemPrompt, userPrompt, apiKeyDummy = "", maxTokens = 1500) => {
  console.log("📡 [consultarHive] Petición enviada al backend interno /api/chat");

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), HIVE_TIMEOUT_MS || 25000);

  try {
    // Apuntamos al endpoint interno de Vercel (el backend lee la API Key en privado)
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controlador.signal,
      body: JSON.stringify({
        systemPrompt: `${systemPrompt}\n\nResponde ÚNICAMENTE en formato JSON. Ejemplo de formato:\n{"promociones":[]}`,
        userPrompt,
        maxTokens
      })
    });

    clearTimeout(temporizador);
    console.log("📥 [consultarHive] HTTP Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      
      // Mantiene intacta la captura de contenido crudo o reasoning_content
      const choice = data?.choices?.[0];
      const contenido = 
        choice?.message?.content || 
        choice?.message?.reasoning_content || 
        choice?.text || 
        "";

      console.log("📝 [consultarHive] Contenido crudo recibido:", contenido);

      const resultado = extraerJson(contenido);

      if (resultado && typeof resultado === "object") {
        console.log(`🚀 [IA REAL ACTIVA] Respuesta parseada correctamente`);
        return resultado;
      } else {
        console.warn("⚠️ [consultarHive] No se pudo extraer JSON estructurado del texto recibido.");
      }
    } else {
      const errorText = await response.text();
      console.error(`🚨 [ERROR SERVERLESS ${response.status}]:`, errorText);
    }
  } catch (error) {
    clearTimeout(temporizador);
    console.error("🚨 [ERROR DE CONEXIÓN EN IA]:", error?.message || error);
  }

  return null;
};

// ============================================================
// RESPALDOS LOCALES
// ============================================================

const generarSugerenciasLocales = (carrito, catalogo) => {
  console.warn("⚠️ Utilizando respaldos locales para Copiloto");
  const carritoSeguro = Array.isArray(carrito) ? carrito : [];
  const catalogoSeguro = Array.isArray(catalogo) ? catalogo : [];
  const idsCarrito = new Set(carritoSeguro.map(obtenerId));

  return catalogoSeguro
    .filter(p => obtenerId(p) && !idsCarrito.has(obtenerId(p)) && tieneStock(p))
    .slice(0, MAX_SUGERENCIAS)
    .map(producto => {
      const nombre = obtenerNombre(producto);
      return {
        productoId: obtenerId(producto),
        nombre,
        fraseVenta: `Completa tu compra llevando ${nombre}.`
      };
    });
};

const generarPromocionesLocales = productos => {
  console.warn("⚠️ Utilizando respaldos locales para Estratega de Promociones");
  const productosSeguros = Array.isArray(productos) ? productos : [];

  return productosSeguros
    .filter(p => obtenerId(p) && tieneStock(p) && numeroSeguro(p.stock) > 10)
    .slice(0, 2)
    .map(producto => ({
      titulo: `Liquidación de inventario: ${obtenerNombre(producto)}`,
      tipo: "Descuento por Volumen",
      descuentoSugerido: "15%",
      razon: `Hay ${numeroSeguro(producto.stock)} unidades en almacén sin un volumen de salida alto.`,
      impactoEsperado: "Liberar espacio en almacén y acelerar rotación."
    }));
};

const validarSugerencias = (data, catalogo, carrito) => {
  if (!Array.isArray(data?.sugerencias)) return [];

  const idsCarrito = new Set(carrito.map(obtenerId));
  const disponibles = new Map(
    catalogo
      .filter(p => obtenerId(p) && !idsCarrito.has(obtenerId(p)) && tieneStock(p))
      .map(p => [obtenerId(p), p])
  );

  const resultado = [];
  const usados = new Set();

  for (const sugerencia of data.sugerencias) {
    if (resultado.length >= MAX_SUGERENCIAS) break;
    if (sugerencia?.productoId == null) continue;

    const id = String(sugerencia.productoId);
    const producto = disponibles.get(id);

    if (!producto || usados.has(id)) continue;

    const fraseVenta = textoSeguro(sugerencia.fraseVenta, 200)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 10)
      .join(" ");

    if (!fraseVenta) continue;

    resultado.push({
      productoId: id,
      nombre: obtenerNombre(producto),
      fraseVenta
    });

    usados.add(id);
  }

  return resultado;
};

// ============================================================
// AGENTE 1: COPILOTO DE VENTAS
// ============================================================

export const obtenerSugerenciasVenta = async (carrito, catalogo) => {
  console.log("🔍 [CopilotoVentas] Ejecutando agente...");
  if (!Array.isArray(carrito) || carrito.length === 0) return [];

  const catalogoSeguro = Array.isArray(catalogo) ? catalogo : [];
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY?.trim();

  const cacheKey = carrito.map(i => obtenerId(i)).sort().join(',');
  if (cacheSugerencias.has(cacheKey)) {
    console.log("⚡ [Cache] Devolviendo respuesta almacenada");
    return cacheSugerencias.get(cacheKey);
  }

  if (!apiKey) {
    console.error("❌ [CopilotoVentas] VITE_DEEPSEEK_API_KEY no existe en .env");
    return generarSugerenciasLocales(carrito, catalogoSeguro);
  }

  const idsCarrito = new Set(carrito.map(obtenerId));
  const carritoSimplificado = carrito.slice(0, 30).map(item => ({
    id: obtenerId(item),
    nombre: obtenerNombre(item).slice(0, 60)
  }));

  const catalogoFiltrado = catalogoSeguro
    .filter(p => obtenerId(p) && !idsCarrito.has(obtenerId(p)) && tieneStock(p))
    .slice(0, 100)
    .map(producto => ({
      id: obtenerId(producto),
      nombre: obtenerNombre(producto).slice(0, 60),
      precio: Math.max(0, numeroSeguro(producto.precio_lista ?? producto.precio))
    }));

  if (!catalogoFiltrado.length) return [];

  const systemPrompt = `
Eres el Copiloto de Ventas de HOGAR.SYS.
Sugiere máximo 2 productos complementarios del catálogo disponible.
No sugieras productos que ya estén en el carrito.
La frase de venta debe tener máximo 10 palabras.
REGLA ESTRICTA: Responde ÚNICAMENTE el JSON empezando DIRECTAMENTE con el carácter '{'. Sin texto introductorio ni pensamientos.
Estructura JSON:
{"sugerencias":[{"productoId":"ID","nombre":"Producto","fraseVenta":"Frase corta"}]}
`;

  const userPrompt = JSON.stringify({
    carrito: carritoSimplificado,
    catalogo: catalogoFiltrado
  });

  // Aumentamos a 1500 tokens para cubrir espacio de razonamiento + JSON
  const data = await consultarHive(systemPrompt, userPrompt, apiKey, 1500);
  const sugerencias = validarSugerencias(data, catalogoSeguro, carrito);

  if (sugerencias.length > 0) {
    cacheSugerencias.set(cacheKey, sugerencias);
    return sugerencias;
  }

  return generarSugerenciasLocales(carrito, catalogoSeguro);
};

// ============================================================
// AGENTE 2: ESTRATEGA DE PROMOCIONES
// ============================================================

export const obtenerEstrategiaPromociones = async (productos, ventas) => {
  console.log("🔍 [EstrategaPromociones] Función invocada...");
  
  const productosSeguros = Array.isArray(productos) ? productos : [];
  const ventasSeguras = Array.isArray(ventas) ? ventas : [];
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY?.trim();

  console.log("🔑 [EstrategaPromociones] Estado de API Key:", apiKey ? "DETECTADA ✅" : "NO ENCONTRADA ❌");

  if (!apiKey) {
    console.error("❌ [EstrategaPromociones] La API Key no está cargada en Vite. Revisa tu archivo .env");
    return generarPromocionesLocales(productosSeguros);
  }

  const resumenInventario = productosSeguros
    .filter(p => obtenerId(p))
    .slice(0, MAX_PRODUCTOS_IA)
    .map(producto => ({
      id: obtenerId(producto),
      nombre: obtenerNombre(producto).slice(0, 60),
      stock: numeroSeguro(producto.stock),
      precio: numeroSeguro(producto.precio_lista ?? producto.precio)
    }));

  const resumenVentas = ventasSeguras
    .slice(-MAX_VENTAS_IA)
    .map(venta => ({
      productoId: venta?.productoId == null ? undefined : String(venta.productoId).slice(0, 50),
      producto: textoSeguro(venta?.nombre || venta?.producto, 60),
      cantidad: numeroSeguro(venta?.cantidad),
      total: numeroSeguro(venta?.total)
    }));

  const systemPrompt = `
Eres el Estratega de Promociones de HOGAR.SYS.
Analiza el inventario y ventas. Recomienda hasta 3 promociones estratégicas.
REGLA STRICTA: Empieza tu respuesta DIRECTAMENTE con el carácter '{' sin escribir introducciones, explicaciones ni notas.
Estructura JSON requerida:
{"promociones":[{"titulo":"Título","tipo":"Tipo","descuentoSugerido":"Propuesta","razon":"Justificación","impactoEsperado":"Beneficio estimado"}]}
`;

  const userPrompt = JSON.stringify({
    inventario: resumenInventario,
    ventas: resumenVentas
  });

  // Cambiamos el límite a 2000 tokens para dar espacio al modelo de pensar y responder
const data = await consultarHive(systemPrompt, userPrompt, apiKey, 2000);

  if (!Array.isArray(data?.promociones)) {
    console.warn("⚠️ [EstrategaPromociones] La IA no devolvió el array 'promociones' esperado.");
    return generarPromocionesLocales(productosSeguros);
  }

  const promociones = data.promociones
    .filter(p => p && typeof p.titulo === "string" && p.titulo.trim())
    .slice(0, MAX_PROMOCIONES)
    .map(p => ({
      titulo: textoSeguro(p.titulo, 120),
      tipo: textoSeguro(p.tipo || "Promoción", 60),
      descuentoSugerido: textoSeguro(p.descuentoSugerido || "15%", 80),
      razon: textoSeguro(p.razon || "Revisión comercial sugerida.", 300),
      impactoEsperado: textoSeguro(p.impactoEsperado || "Optimizar flujo de caja.", 200)
    }));

  return promociones.length ? promociones : generarPromocionesLocales(productosSeguros);
};

// ============================================================
// AGENTE 3: INTELIGENCIA DE REABASTECIMIENTO Y COMPRAS
// ============================================================

export const obtenerPlanReabastecimiento = async (productos, ventas) => {
  console.log("🔍 [AgenteCompras] Calculando lista óptima de reposición...");

  const productosSeguros = Array.isArray(productos) ? productos : [];
  const ventasSeguras = Array.isArray(ventas) ? ventas : [];
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY?.trim();

  const generarRespuestaLocal = () => {
    const faltantes = productosSeguros.filter(p => numeroSeguro(p.stock) <= 5);
    return {
      presupuestoEstimado: "Por determinar",
      resumenOrden: `Hay ${faltantes.length} productos en stock bajo que requieren reposición inmediata.`,
      listaCompras: faltantes.slice(0, 5).map(p => ({
        productoId: obtenerId(p),
        nombre: obtenerNombre(p),
        stockActual: numeroSeguro(p.stock),
        cantidadSugerida: 10,
        prioridad: numeroSeguro(p.stock) <= 0 ? "URGENTE" : "ALTA",
        justificacion: "Nivel de stock por debajo del umbral mínimo."
      }))
    };
  };

  if (!apiKey) return generarRespuestaLocal();

  const inventarioResumen = productosSeguros
    .filter(p => obtenerId(p))
    .slice(0, MAX_PRODUCTOS_IA)
    .map(p => ({
      id: obtenerId(p),
      nombre: obtenerNombre(p).slice(0, 50),
      stock: numeroSeguro(p.stock),
      precio: numeroSeguro(p.precio_lista ?? p.precio)
    }));

  const systemPrompt = `
Eres el Agente Jefe de Compras y Reabastecimiento de HOGAR.SYS.
Analiza el stock actual e identifica qué productos deben recomprarse urgentemente, calculando cantidades sugeridas para evitar quiebres de stock.
REGLA ESTRICTA: Empieza tu respuesta DIRECTAMENTE con el carácter '{'. Sin introducciones ni markdown.
Estructura JSON requerida:
{"compras":{"presupuestoEstimado":"Rango en S/.","resumenOrden":"Breve explicación comercial","listaCompras":[{"productoId":"ID","nombre":"Nombre","stockActual":0,"cantidadSugerida":10,"prioridad":"URGENTE/ALTA/MEDIA","justificacion":"Razonamiento corto"}]}}
`;

  const userPrompt = JSON.stringify({
    inventarioTotal: inventarioResumen,
    volumenVentasRecientes: ventasSeguras.length
  });

  const data = await consultarHive(systemPrompt, userPrompt, apiKey, 1500);

  if (data?.compras && typeof data.compras === "object") {
    const c = data.compras;
    return {
      presupuestoEstimado: textoSeguro(c.presupuestoEstimado || "A calcular con proveedor", 80),
      resumenOrden: textoSeguro(c.resumenOrden || "Evaluación de reposición completada.", 200),
      listaCompras: Array.isArray(c.listaCompras) 
        ? c.listaCompras.slice(0, 8).map(item => ({
            productoId: textoSeguro(item.productoId, 50),
            nombre: textoSeguro(item.nombre, 80),
            stockActual: numeroSeguro(item.stockActual),
            cantidadSugerida: numeroSeguro(item.cantidadSugerida),
            prioridad: textoSeguro(item.prioridad || "ALTA", 20),
            justificacion: textoSeguro(item.justificacion, 150)
          }))
        : []
    };
  }

  return generarRespuestaLocal();
};

// ============================================================
// AGENTE 4: ANALISTA Y DIAGNOSTICADOR DEL NEGOCIO (BI)
// ============================================================

export const obtenerDiagnosticoNegocio = async (ingresosHoy, transaccionesHoy, deliveriesHoy, productosBajoStock) => {
  console.log("🔍 [AgenteBI] Generando diagnóstico ejecutivo del negocio...");

  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY?.trim();

  const generarRespuestaLocal = () => ({
    saludNegocio: "ESTABLE",
    diagnosticoGeneral: "Flujo de ventas constante en el turno actual.",
    puntosCriticos: [
      `Atención a los ${productosBajoStock?.length || 0} productos con stock bajo.`
    ],
    accionInmediata: "Mantener la disponibilidad de productos de alta rotación."
  });

  if (!apiKey) return generarRespuestaLocal();

  const systemPrompt = `
Eres el Agente Director de Inteligencia de Negocios de HOGAR.SYS.
Analiza las métricas comerciales en tiempo real y genera un diagnóstico ejecutivo conciso.
REGLA ESTRICTA: Empieza tu respuesta DIRECTAMENTE con el carácter '{'. Sin introducciones ni markdown.
Estructura JSON requerida:
{"diagnostico":{"saludNegocio":"OPTIMA/ESTABLE/RIESGO","diagnosticoGeneral":"Resumen estratégico en 1 frase","puntosCriticos":["Punto 1","Punto 2"],"accionInmediata":"Recomendación clave urgente"}}
`;

  const userPrompt = JSON.stringify({
    ingresosHoy: numeroSeguro(ingresosHoy),
    ventasTotales: numeroSeguro(transaccionesHoy),
    deliveriesCount: numeroSeguro(deliveriesHoy),
    productosAgotandose: Array.isArray(productosBajoStock) 
      ? productosBajoStock.slice(0, 5).map(p => ({
          nombre: obtenerNombre(p),
          stock: numeroSeguro(p.stock)
        }))
      : []
  });

  const data = await consultarHive(systemPrompt, userPrompt, apiKey, 1500);

  if (data?.diagnostico && typeof data.diagnostico === "object") {
    const d = data.diagnostico;
    return {
      saludNegocio: textoSeguro(d.saludNegocio || "ESTABLE", 20),
      diagnosticoGeneral: textoSeguro(d.diagnosticoGeneral || "Operaciones normales.", 180),
      puntosCriticos: Array.isArray(d.puntosCriticos) ? d.puntosCriticos.slice(0, 3).map(p => textoSeguro(p, 100)) : [],
      accionInmediata: textoSeguro(d.accionInmediata || "Continuar atención en caja.", 150)
    };
  }

  return generarRespuestaLocal();
};

// ============================================================
// AGENTE 5: ANALISTA DE TENDENCIAS Y EXPANSIÓN DE CATÁLOGO
// ============================================================

export const obtenerSugerenciasNuevosProductos = async (productos) => {
  console.log("🔍 [AgenteTendencias] Analizando oportunidades de catálogo...");

  const productosSeguros = Array.isArray(productos) ? productos : [];
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY?.trim();

  const generarRespuestaLocal = () => ({
    resumenOportunidad: "Categorías de hogar y accesorios muestran alta demanda.",
    sugerencias: [
      {
        nombreProducto: "Balanza Digital de Precisión",
        categoria: "Menaje / Cocina",
        razonComercial: "Complemento de alta rotación para productos de cocina y balanzas existentes.",
        impactoEsperado: "Atraer clientes que buscan equipamiento moderno."
      }
    ]
  });

  if (!apiKey || productosSeguros.length === 0) return generarRespuestaLocal();

  const catalogoResumen = productosSeguros
    .filter(p => obtenerId(p))
    .slice(0, MAX_PRODUCTOS_IA)
    .map(p => ({
      nombre: obtenerNombre(p).slice(0, 60),
      precio: numeroSeguro(p.precio_lista ?? p.precio)
    }));

  const systemPrompt = `
Eres el Agente de Tendencias de Mercado y Expansión de Catálogo de HOGAR.SYS.
Analiza el catálogo actual de la tienda y sugiere hasta 3 productos novedosos o tendencias del mercado que el negocio DEBERÍA incorporar para atraer más clientes.
REGLA ESTRICTA: Empieza tu respuesta DIRECTAMENTE con el carácter '{'. Sin introducciones ni markdown.
Estructura JSON requerida:
{"tendencias":{"resumenOportunidad":"Explicación corta de la oportunidad","sugerencias":[{"nombreProducto":"Nombre sugerido","categoria":"Categoría","razonComercial":"Por qué funcionaría en la tienda","impactoEsperado":"Beneficio estimado"}]}}
`;

  const userPrompt = JSON.stringify({
    catalogoActual: catalogoResumen
  });

  const data = await consultarHive(systemPrompt, userPrompt, apiKey, 1500);

  if (data?.tendencias && typeof data.tendencias === "object") {
    const t = data.tendencias;
    return {
      resumenOportunidad: textoSeguro(t.resumenOportunidad || "Oportunidades de expansión detectadas.", 200),
      sugerencias: Array.isArray(t.sugerencias)
        ? t.sugerencias.slice(0, 3).map(item => ({
            nombreProducto: textoSeguro(item.nombreProducto, 80),
            categoria: textoSeguro(item.categoria, 50),
            razonComercial: textoSeguro(item.razonComercial, 180),
            impactoEsperado: textoSeguro(item.impactoEsperado, 150)
          }))
        : []
    };
  }

  return generarRespuestaLocal();
};

