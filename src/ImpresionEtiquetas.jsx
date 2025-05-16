import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";

function EtiquetasA4({
  productos,
  provincia,
  etiquetaWidth,
  etiquetaHeight,
  hojaWidth,
  hojaHeight,
  colorTexto,
  margenHoja,
}) {
  // Cálculo de tamaños de fuente base según el alto de la etiqueta
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Tamaños de fuente base
  const fontPrecio = clamp(
    Math.min(etiquetaHeight, etiquetaWidth) * 0.19,
    0.45,
    1.1
  );
  const fontPrecioDec = clamp(
    Math.min(etiquetaHeight, etiquetaWidth) * 0.11,
    0.22,
    0.65
  );
  const fontLabel = clamp(
    Math.min(etiquetaHeight, etiquetaWidth) * 0.065,
    0.22,
    0.38
  );
  const fontSec = clamp(
    Math.min(etiquetaHeight, etiquetaWidth) * 0.065,
    0.25,
    0.38
  );

  // Ajuste dinámico del tamaño de fuente del producto según largo y ancho
  function getFontMain(producto) {
    // Base: proporcional al menor de alto/ancho, pero baja si el texto es largo
    const base = clamp(
      Math.min(etiquetaHeight, etiquetaWidth) * 0.14,
      0.35,
      1.2
    );
    // Ajuste por cantidad de caracteres y ancho de etiqueta
    const maxChars = Math.floor(etiquetaWidth * 4.5 + 12); // más ancho, más chars permitidos
    if (!producto) return base;
    if (producto.length <= maxChars) return base;
    // Reduce el tamaño si es muy largo, pero nunca menos de 0.16cm
    return clamp(base * (maxChars / producto.length), 0.14, base);
  }

  // Formateo local
  const format = (n) =>
    n
      ? n.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "";
  const formatPrecioGrande = (n) => {
    if (!n) return "";
    const [entero, dec] = n
      .toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      .split(",");
    return { entero, dec };
  };

  // Calcular cuántas etiquetas caben por columna y por fila
  const etiquetasPorFila = Math.floor(
    (hojaWidth - margenHoja * 2 + 0.0001) / etiquetaWidth
  );
  const etiquetasPorColumna = Math.floor(
    (hojaHeight - margenHoja * 2 + 0.0001) / etiquetaHeight
  );
  const etiquetasPorPagina = etiquetasPorFila * etiquetasPorColumna;

  // Divide los productos en páginas
  const paginas = [];
  for (let i = 0; i < productos.length; i += etiquetasPorPagina) {
    paginas.push(productos.slice(i, i + etiquetasPorPagina));
  }

  return (
    <>
      {paginas.map((productosPagina, pageIdx) => (
        <div
          key={pageIdx}
          style={{
            width: `${hojaWidth}cm`,
            minHeight: `${hojaHeight}cm`,
            padding: `${margenHoja}cm`,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "0.01cm",
            background: "#fff",
            alignContent: "flex-start",
            pageBreakAfter: pageIdx < paginas.length - 1 ? "always" : "auto",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {productosPagina.map((p, i) => (
            <div
              key={i}
              style={{
                width: `${etiquetaWidth}cm`,
                height: `${etiquetaHeight}cm`,
                margin: "0 0.01cm 0 0",
                padding: "0.01cm",
                border: "1.2px solid #000",
                borderRadius: "0cm",
                background: "linear-gradient(to bottom, #ededed 62%, #fff 35%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                overflow: "hidden",
                color: colorTexto,
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "row", height: "60%" }}
              >
                <div
                  style={{
                    flex: 3,
                    display: "flex",
                    alignItems: "flex-start",
                    padding: "0.01cm 0.02cm 0.02cm 0.01cm",
                    overflow: "hidden",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: `${getFontMain(p.producto)}cm`,
                      textTransform: "uppercase",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      hyphens: "auto",
                      lineHeight: 1,
                      width: "100%",
                      maxWidth: "100%",
                      whiteSpace: "pre-line",
                      display: "flex",
                      alignItems: "center",
                      height: "100%",
                    }}
                    lang="es"
                    title={p.producto}
                  >
                    {p.producto}
                  </div>
                </div>
                <div
                  style={{
                    flex: 1.8,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    padding: "0.02cm 0.02cm 0 0.02cm",
                  }}
                >
                  <div
                    style={{
                      fontSize: `${fontLabel}cm`,
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: "-0.008cm",
                      margin: "0.02cm 0 0.02cm 0",
                    }}
                  >
                    Precio final al consumidor
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      marginBottom: "0.02cm",
                    }}
                  >
                    <span
                      style={{
                        fontSize: `${fontPrecio}cm`,
                        fontWeight: "bold",
                        lineHeight: 1,
                      }}
                    >
                      ${formatPrecioGrande(p.precio).entero}
                    </span>
                    <span
                      style={{
                        fontSize: `${fontPrecioDec}cm`,
                        fontWeight: "bold",
                        marginLeft: "0.06cm",
                        lineHeight: 2,
                      }}
                    >
                      {formatPrecioGrande(p.precio).dec}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: `${fontSec}cm`,
                      marginTop: "-0.08cm",
                      lineHeight: 1,
                      letterSpacing: "-0.008cm",
                    }}
                  >
                    Precio sin impuestos nacionales (IVA): $
                    {format(p.precioSinIva)}
                  </div>
                </div>
              </div>
              <div
                style={{ borderTop: "1px solid #ccc", margin: "0.04cm 0" }}
              />
              <div
                style={{
                  display: "flex",
                  margin: "0.001cm auto",
                  flexDirection: "column",
                  gap: "0.04cm",
                }}
              >
                {p.unidad !== "Sin unidades" &&
                  p.cantidad &&
                  p.precioPorUnidad && (
                    <div
                      style={{
                        fontSize: `${fontLabel}cm`,
                        fontWeight: 600,
                        lineHeight: 1,
                      }}
                    >
                      Precio al consumidor por cada {p.unidad.toLowerCase()} ${" "}
                      {p.precioPorUnidad.toFixed(2)}
                    </div>
                  )}
                {p.ean && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Barcode
                      value={p.ean}
                      width={1.8}
                      height={28}
                      fontSize={12}
                      displayValue={false}
                      background="#fff"
                      lineColor="#000"
                      margin={0}
                    />
                    <span
                      style={{
                        fontSize: "0.28cm",
                        color: "#444",
                        marginTop: "0.04cm",
                        letterSpacing: "0.04em",
                        fontFamily: "monospace",
                        userSelect: "all",
                      }}
                    >
                      {p.ean}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Pie de página CAME solo en la última página */}
          {pageIdx === paginas.length - 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: 0,
                width: "100%",
                textAlign: "center",
                fontSize: "0.85em",
                color: "#888",
                padding: "0.2cm 0",
                pointerEvents: "none",
                zIndex: 10,
              }}
            >
              Herramienta desarrollada por la Confederación Argentina de la
              Mediana Empresa - CAME
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default function ImpresionEtiquetas({
  productos,
  provincia,
  hoja,
  hojaWidth,
  hojaHeight,
  etiquetaWidth,
  etiquetaHeight,
  colorTexto,
  margenHoja,
  onImprimir, // NUEVO
}) {
  const contentRef = useRef(null);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: "etiquetas",
    // Ajusta el margin de la hoja en el CSS de impresión:
    pageStyle: `
      @page { 
        size: ${hojaWidth}cm ${hojaHeight}cm; 
        margin: ${margenHoja}cm; 
      } 
      body { background: white; margin: 0; }
    `,
    onBeforeGetContent: () => {
      if (onImprimir) onImprimir();
    },
  });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          className="px-4 py-2 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
          onClick={reactToPrintFn}
        >
          Imprimir etiquetas
        </button>
      </div>
      <div ref={contentRef}>
        <EtiquetasA4
          productos={productos}
          provincia={provincia}
          etiquetaWidth={etiquetaWidth}
          etiquetaHeight={etiquetaHeight}
          hojaWidth={hojaWidth}
          hojaHeight={hojaHeight}
          colorTexto={colorTexto}
          margenHoja={margenHoja}
        />
      </div>
    </>
  );
}
