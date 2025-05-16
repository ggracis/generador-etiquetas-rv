import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import ImpresionEtiquetas from "./ImpresionEtiquetas";
import * as XLSX from "xlsx";
import "./index.css";

const provincias = [
  "-",
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];
const ivas = ["21%", "10.5%", "Exento"];
const unidades = ["Sin unidades", "Kilogramos", "Litros"];

const hojaSizes = {
  A4: { width: 21, height: 29.7 },
  Carta: { width: 21.6, height: 27.9 },
  Oficio: { width: 21.6, height: 33 },
};

const unidadesValidas = ["Sin unidades", "Kilogramos", "Litros"];
const unidadMap = [
  { match: ["lt", "lts", "litros", "litro"], value: "Litros" },
  { match: ["kg", "kgs", "kilogramo", "kilogramos"], value: "Kilogramos" },
];

function normalizarUnidad(valor) {
  if (!valor) return "Sin unidades";
  const v = valor.toString().trim().toLowerCase();
  for (const u of unidadMap) {
    if (u.match.some((m) => v === m)) return u.value;
  }
  if (unidadesValidas.map((x) => x.toLowerCase()).includes(v)) {
    return unidadesValidas.find((x) => x.toLowerCase() === v) || "Sin unidades";
  }
  return "Sin unidades";
}

function normalizarIVA(valor) {
  if (!valor) return "21%";
  const v = valor.toString().replace(",", ".").replace("%", "").trim();
  if (v === "21" || v === "21.0" || v === "21%") return "21%";
  if (v === "10.5" || v === "10,5" || v === "10.5%") return "10.5%";
  if (
    v.toLowerCase().includes("exento") ||
    v === "0" ||
    v === "0%" ||
    v === "sin iva"
  )
    return "Exento";
  return "21%";
}

// Toast simple
function Toast({ message, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#222",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 8,
        zIndex: 9999,
        fontSize: 16,
        minWidth: 200,
        textAlign: "center",
        boxShadow: "0 2px 12px #0005",
      }}
      onClick={onClose}
    >
      {message}
    </div>
  );
}

function App() {
  // Estados de campos
  const [provincia, setProvincia] = useState("-");
  const [producto, setProducto] = useState("");
  const [iva, setIva] = useState("21%");
  const [precio, setPrecio] = useState("");
  const [unidad, setUnidad] = useState("Sin unidades");
  const [cantidad, setCantidad] = useState("");
  const [ean, setEan] = useState("");
  // Personalización
  const [colorTexto, setColorTexto] = useState("#000000");
  const [productos, setProductos] = useState([]);

  // NUEVO: tamaño de hoja y etiqueta
  const [hoja, setHoja] = useState("A4");
  const [margenHoja, setMargenHoja] = useState(0.1); // NUEVO: margen de hoja
  const [etiquetaWidth, setEtiquetaWidth] = useState(6.9);
  const [etiquetaHeight, setEtiquetaHeight] = useState(3.4);

  const hojaWidth = hojaSizes[hoja].width;
  const hojaHeight = hojaSizes[hoja].height;

  // Cálculos
  let precioValido = false;
  let precioFinal = 0;
  let precioSinIva = 0;
  let precioPorUnidad = 0;
  try {
    precioFinal = parseFloat(
      (precio + "").replace(/[^\d.,]/g, "").replace(",", ".")
    );
    if (!isNaN(precioFinal)) precioValido = true;
  } catch {
    /* ignorar error de parseo */
  }
  if (precioValido) {
    if (iva === "21%") precioSinIva = precioFinal / 1.21;
    else if (iva === "10.5%") precioSinIva = precioFinal / 1.105;
    else precioSinIva = precioFinal;
    if (unidad !== "Sin unidades" && cantidad)
      precioPorUnidad = precioFinal / parseFloat(cantidad);
  }

  // Formateo
  const format = (n) =>
    n
      ? n.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "";

  // Para mostrar precio grande con decimales chicos
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

  // Limpiar campos (no borra provincia)
  const limpiarCampos = () => {
    setProducto("");
    setPrecio("");
    setUnidad("Sin unidades");
    setCantidad("");
    setIva("21%");
    setEan("");
  };

  // NUEVO: Limpiar todos los productos
  const limpiarProductos = () => {
    setProductos([]);
    showToast("Productos eliminados.");
  };

  // Toast state
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef();

  function showToast(msg, ms = 2500) {
    setToast(msg);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), ms);
  }

  // Envía el registro de uso al servidor (AJAX POST)
  async function enviarRegistroUso(registro) {
    try {
      await fetch("/etiquetas/registro-uso.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro),
      });
    } catch (e) {
      // No mostrar error al usuario, solo log
      // console.error("No se pudo registrar el uso", e);
    }
  }

  // NUEVO: Guardar registro de uso en el servidor como CSV
  function registrarUso(tipo = "imprimir") {
    const now = new Date();
    const fecha = now.toLocaleDateString("es-AR");
    const hora = now.toLocaleTimeString("es-AR");
    const userAgent = navigator.userAgent;
    const registro = {
      accion: tipo,
      provincia,
      cantidad: productos.length,
      fecha,
      hora,
      userAgent,
    };
    enviarRegistroUso(registro);
  }

  // NUEVO: Descargar CSV de uso
  const descargarCSVuso = () => {
    const csv = localStorage.getItem("etiquetas-uso-csv") || "";
    if (!csv) {
      showToast("No hay registros de uso.");
      return;
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uso-etiquetas.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV de uso descargado.");
  };

  // Agregar producto a la tabla (no requiere provincia)
  const agregarProducto = () => {
    if (!precioValido || !producto.trim()) {
      showToast(
        "Por favor, ingrese un número válido en el campo de Precio Final."
      );
      return;
    }
    setProductos([
      ...productos,
      {
        producto,
        iva,
        precio: precioFinal,
        unidad,
        cantidad: unidad !== "Sin unidades" ? cantidad : "",
        precioSinIva,
        precioPorUnidad:
          unidad !== "Sin unidades" && cantidad
            ? precioFinal / parseFloat(cantidad)
            : null,
        ean,
        colorTexto,
      },
    ]);
    limpiarCampos();
    showToast("Producto agregado.");
  };

  // NUEVO: Importar productos desde Excel
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const nuevos = [];
      for (const row of rows) {
        // Normalizar y validar columnas
        const producto = row.Producto?.toString().trim() || "";
        const precio = parseFloat(
          (row.Precio || "").toString().replace(",", ".")
        );
        const unidad = normalizarUnidad(row.Unidad);
        const cantidad =
          unidad !== "Sin unidades"
            ? row.Cantidad
              ? row.Cantidad.toString().replace(",", ".")
              : ""
            : "";
        const iva = normalizarIVA(row.IVA);
        const ean = row.EAN?.toString().trim() || "";

        if (!producto || isNaN(precio)) continue;

        // Cálculos
        let precioSinIva = precio;
        if (iva === "21%") precioSinIva = precio / 1.21;
        else if (iva === "10.5%") precioSinIva = precio / 1.105;
        let precioPorUnidad = null;
        if (unidad !== "Sin unidades" && cantidad) {
          const cant = parseFloat(cantidad);
          if (!isNaN(cant) && cant > 0) precioPorUnidad = precio / cant;
        }

        nuevos.push({
          producto,
          iva,
          precio,
          unidad,
          cantidad: unidad !== "Sin unidades" ? cantidad : "",
          precioSinIva,
          precioPorUnidad,
          ean,
          colorTexto,
        });
      }
      setProductos((prev) => [...prev, ...nuevos]);
      showToast(`Importados ${nuevos.length} productos.`);
      registrarUso("importar");
    };
    reader.readAsArrayBuffer(file);
    // Limpiar input para permitir importar el mismo archivo de nuevo si se desea
    e.target.value = "";
  };

  // NUEVO: Exportar productos a Excel (plantilla si vacío)
  const handleExportExcel = () => {
    let data;
    if (productos.length === 0) {
      // Plantilla vacía
      data = [
        {
          Producto: "",
          Precio: "",
          Unidad: "",
          Cantidad: "",
          IVA: "",
          EAN: "",
        },
      ];
      showToast("Descargaste la plantilla de productos.");
    } else {
      data = productos.map((p) => ({
        Producto: p.producto,
        Precio: p.precio,
        Unidad: p.unidad,
        Cantidad: p.cantidad,
        IVA: p.iva,
        EAN: p.ean,
      }));
      showToast("Productos exportados a Excel.");
      registrarUso("exportar");
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "productos-etiquetas.xlsx");
  };

  // Alerta solo si precio no válido (reemplazado por Toast)
  // let showAlerta = false;
  // if (!precioValido) showAlerta = true;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7fafc]">
      <Card className="max-w-3xl w-full mx-auto px-4 py-6 rounded-2xl shadow-lg">
        <CardContent>
          <div className="flex flex-row justify-between items-center mb-2">
            <h1 className="text-4xl font-bold text-gray-800">
              Generador de etiquetas
            </h1>
            <img src="CAME.png" alt="CAME" className="max-w-[120px]" />
          </div>
          <p className="mb-2 text-lg">
            De acuerdo a la{" "}
            <a
              href="https://www.argentina.gob.ar/sites/default/files/exhibicion_de_precios_resolucion_4_2025.pdf"
              className="text-blue-700 underline"
            >
              resolución 04/2025
            </a>
            .
          </p>
          <hr className="my-4" />
          <div className="mb-2 text-sm">
            <p>
              Según la Ley N° 23.349 - ley de IVA - las alícuotas se aplican del
              siguiente modo:
            </p>
            <ul className="list-disc ml-6">
              <li>
                <b>21%</b> = Consumo general (electrodomésticos, textiles,
                alimentos procesados, etc.).
              </li>
              <li>
                <b>10,5%</b> = Productos agropecuarios, carne, pan, frutas y
                verduras.
              </li>
              <li>
                <b>0%</b> = Libros, folletos, diarios.
              </li>
            </ul>
          </div>
          <hr className="my-4" />
          {/* Provincia como campo general */}
          <div className="mb-4">
            <Label>Seleccione su provincia</Label>
            <Select value={provincia} onValueChange={setProvincia}>
              <SelectTrigger>
                <SelectValue placeholder="Provincia" />
              </SelectTrigger>
              <SelectContent>
                {provincias.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <div>
              <Label>Producto</Label>
              <Input
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <Label>IVA</Label>
              <Select value={iva} onValueChange={setIva}>
                <SelectTrigger>
                  <SelectValue placeholder="IVA" />
                </SelectTrigger>
                <SelectContent>
                  {ivas.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Precio Final del Producto</Label>
              <Input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="$"
              />
            </div>
            <div>
              <Label>Unidad</Label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger>
                  <SelectValue placeholder="Unidad" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {unidad !== "Sin unidades" && (
              <div>
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>Código EAN</Label>
              <Input
                value={ean}
                onChange={(e) => setEan(e.target.value)}
                placeholder="Ingrese código EAN"
                maxLength={13}
              />
            </div>
          </div>
          {/* Personalización de hoja y etiqueta */}
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div>
              <Label className="block text-xs mb-1">Tamaño de hoja</Label>
              <Select value={hoja} onValueChange={setHoja}>
                <SelectTrigger>
                  <SelectValue placeholder="Tamaño de hoja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (21 x 29.7 cm)</SelectItem>
                  <SelectItem value="Carta">Carta (21.6 x 27.9 cm)</SelectItem>
                  <SelectItem value="Oficio">Oficio (21.6 x 33 cm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-xs mb-1">Margen de hoja (cm)</Label>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.01}
                value={margenHoja}
                onChange={(e) => setMargenHoja(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div>
              <Label className="block text-xs mb-1">Ancho etiqueta (cm)</Label>
              <Input
                type="number"
                min={5.9}
                max={hojaWidth}
                step={0.1}
                value={etiquetaWidth}
                onChange={(e) => setEtiquetaWidth(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div>
              <Label className="block text-xs mb-1">Alto etiqueta (cm)</Label>
              <Input
                type="number"
                min={3.5}
                max={hojaHeight}
                step={0.1}
                value={etiquetaHeight}
                onChange={(e) => setEtiquetaHeight(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div>
              <Label className="block text-xs mb-1">Color de texto</Label>
              <Input
                type="color"
                value={colorTexto}
                onChange={(e) => setColorTexto(e.target.value)}
                className="w-10 h-10 p-0 border-0"
              />
            </div>
            <button
              type="button"
              className="ml-4 px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              onClick={agregarProducto}
              disabled={!precioValido || !producto.trim()}
            >
              Agregar producto
            </button>
          </div>
          {/* Importar/Exportar/Limpiar Excel */}
          <div className="flex gap-4 mb-4">
            <label className="px-4 py-2 rounded bg-gray-200 text-gray-800 text-sm font-semibold cursor-pointer hover:bg-gray-300 transition">
              Importar Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                style={{ display: "none" }}
              />
            </label>
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300 transition"
              onClick={handleExportExcel}
            >
              Exportar Excel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded bg-red-200 text-red-800 text-sm font-semibold hover:bg-red-300 transition"
              onClick={limpiarProductos}
              disabled={productos.length === 0}
            >
              Limpiar productos
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-300 hover:bg-gray-200 transition"
              onClick={descargarCSVuso}
            >
              Descargar CSV de uso
            </button>
          </div>
          {/* Tabla de productos */}
          {productos.length > 0 && (
            <div className="mb-8">
              <table className="w-full text-xs border mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Producto</th>
                    <th className="border px-2 py-1">Precio</th>
                    <th className="border px-2 py-1">Cantidad</th>
                    <th className="border px-2 py-1">Unidad</th>
                    <th className="border px-2 py-1">Precio por unidad</th>
                    <th className="border px-2 py-1">IVA</th>
                    <th className="border px-2 py-1">Precio sin IVA</th>
                    <th className="border px-2 py-1">EAN</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{p.producto}</td>
                      <td className="border px-2 py-1">${format(p.precio)}</td>
                      <td className="border px-2 py-1">
                        {p.unidad !== "Sin unidades" ? (
                          <span>{p.cantidad}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border px-2 py-1">{p.unidad}</td>
                      <td className="border px-2 py-1">
                        {" "}
                        ${format(p.precioPorUnidad)}
                      </td>

                      <td className="border px-2 py-1">{p.iva}</td>
                      <td className="border px-2 py-1">
                        ${format(p.precioSinIva)}
                      </td>
                      <td className="border px-2 py-1">{p.ean}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Botón para imprimir y área de impresión */}
          {productos.length > 0 && (
            <ImpresionEtiquetas
              productos={productos}
              provincia={provincia}
              hoja={hoja}
              hojaWidth={hojaWidth}
              hojaHeight={hojaHeight}
              etiquetaWidth={etiquetaWidth}
              etiquetaHeight={etiquetaHeight}
              colorTexto={colorTexto}
              margenHoja={margenHoja}
              onImprimir={() => {
                showToast("Enviando a imprimir...");
                registrarUso("imprimir");
              }}
            />
          )}
          {/* Toast */}
          {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
