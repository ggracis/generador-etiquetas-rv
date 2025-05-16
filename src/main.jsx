import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// SEO: agregar título, descripción y meta tags
const seoTitle = "Generador de Etiquetas CAME";
const seoDescription =
  "Herramienta gratuita para generar e imprimir etiquetas de precios según la resolución 04/2025. Compatible con Excel. Desarrollado por la Confederación Argentina de la Mediana Empresa (CAME).";
const seoUrl = "https://came.ar/etiquetas/";
const seoImage = "https://came.ar/etiquetas/CAME.png";

document.title = seoTitle;

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setProperty(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

// Meta tags básicos
setMeta("description", seoDescription);
setMeta("robots", "index, follow");

// Open Graph
setProperty("og:title", seoTitle);
setProperty("og:description", seoDescription);
setProperty("og:type", "website");
setProperty("og:url", seoUrl);
setProperty("og:image", seoImage);

// Twitter Card
setMeta("twitter:card", "summary_large_image");
setMeta("twitter:title", seoTitle);
setMeta("twitter:description", seoDescription);
setMeta("twitter:image", seoImage);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
