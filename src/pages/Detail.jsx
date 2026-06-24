import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import slugify from "../utils/slugify";
import { jsPDF } from "jspdf";
import MapView from "../components/MapView";
import "../styles/pages/Detail.css";
import { getPatrimonioById, getPatrimonios } from "../services/patrimonioService";
import { getMunicipios } from "../services/municipioService";
import { API_HOST } from "../services/apiConfig.js";
import { getCategoryClass, getCategoryLabel, normalizeCategoryKey } from "../utils/categoryUtils";

const buildImageUrl = (value) => {
  if (!value) return null;
  if (typeof value !== "string") return null;
  return value.startsWith("http") ? value : `${API_HOST}${value}`;
};

const sanitizeDescriptionHtml = (html) => {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const allowedTags = new Set(["B", "STRONG", "I", "EM", "P", "DIV", "BR", "UL", "OL", "LI"]);

  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent);
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const fragment = document.createDocumentFragment();
    node.childNodes.forEach((child) => {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) fragment.appendChild(cleanedChild);
    });

    const tag = node.tagName.toUpperCase();
    if (allowedTags.has(tag)) {
      const el = document.createElement(tag);
      el.appendChild(fragment);
      return el;
    }

    return fragment;
  };

  const wrapper = document.createElement("div");
  const source = doc.body.firstChild;
  if (source) {
    source.childNodes.forEach((child) => {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) wrapper.appendChild(cleanedChild);
    });
  }

  let cleanedHtml = wrapper.innerHTML;
  cleanedHtml = cleanedHtml.replace(/<(p|div)><\/\1>/g, "");
  return cleanedHtml.trim();
};

const displayCategoryLabel = (categoria) => getCategoryLabel(categoria);

const normalizeImage = (image) => {
  if (!image) return null;
  if (typeof image === "string") return buildImageUrl(image);

  if (typeof image === "object") {
    return (
      buildImageUrl(image.url) ||
      buildImageUrl(image.imagen_url) ||
      buildImageUrl(image.path) ||
      buildImageUrl(image.src)
    );
  }

  return null;
};

const buildImageList = (item) => {
  const list = [];
  const main = normalizeImage(item.imagen_url || item.imagen || item.portada);
  if (main) list.push(main);

  const gallery = item.galeria || item.galeria_actual || item.imagenes || [];
  if (Array.isArray(gallery)) {
    gallery.forEach((entry) => {
      const url = normalizeImage(entry);
      if (url && !list.includes(url)) list.push(url);
    });
  }

  if (list.length === 0) {
    list.push("https://placehold.co/600x400?text=Sin+imagen");
  }

  return list;
};

const parseUbicaciones = (ubicaciones) => {
  if (!ubicaciones) return [];
  if (typeof ubicaciones === "string") {
    try {
      const parsed = JSON.parse(ubicaciones);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(ubicaciones) ? ubicaciones : [];
};

const normalizeLocation = (ubi) => ({
  ...ubi,
  lat: ubi.latitud ?? ubi.lat ?? null,
  lng: ubi.longitud ?? ubi.lng ?? null,
  nombre_punto: ubi.nombre_punto || ubi.nombre || ubi.label || "",
  municipio: ubi.municipio || ubi.municipioId || "",
});

const buildLocationList = (item) => {
  const rawLocations = parseUbicaciones(item.ubicaciones);
  const locations = rawLocations
    .map(normalizeLocation)
    .filter((loc) => loc.lat != null && loc.lng != null);

  if (locations.length > 0) {
    return locations;
  }

  const lat = item.latitud ?? item.lat ?? null;
  const lng = item.longitud ?? item.lng ?? null;
  if (lat != null && lng != null) {
    return [{
      lat,
      lng,
      nombre_punto: item.nombre || "Ubicación",
      municipio: item.municipio || item.municipioId || "",
    }];
  }

  return [];
};

const normalizePatrimonioData = (item) => {
  const ubicaciones = buildLocationList(item);

  return {
    ...item,
    ubicaciones,
    lat: ubicaciones[0]?.lat ?? item.latitud ?? item.lat ?? null,
    lng: ubicaciones[0]?.lng ?? item.longitud ?? item.lng ?? null,
    imagen: normalizeImage(item.imagen_url || item.imagen || item.portada) || "https://placehold.co/600x400?text=Sin+imagen",
    tags: Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : [],
    galeria: Array.isArray(item.galeria)
      ? item.galeria
      : Array.isArray(item.galeria_actual)
      ? item.galeria_actual
      : Array.isArray(item.imagenes)
      ? item.imagenes
      : [],
    links: Array.isArray(item.links) ? item.links : [],  
  };
};

// Función para convertir imagen URL a base64
const urlToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return null;
  }
};

const downloadPatrimonioPDF = async (item, municipioNombre, images) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    const drawLine = (y) => {
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
    };

    const pageHeight = doc.internal.pageSize.getHeight();

    const ensurePageSpace = (height) => {
      if (currentY + height > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
    };

    const PDF_FONT_FAMILY = "helvetica";

    const getFontStyle = (style = {}) => {
      if (style.bold && style.italic) return "bolditalic";
      if (style.bold) return "bold";
      if (style.italic) return "italic";
      return "normal";
    };

    const setDocFont = (style = {}) => {
      doc.setFont(PDF_FONT_FAMILY, getFontStyle(style));
    };

    const getStyledTextWidth = (text, style = {}) => {
      setDocFont(style);
      return doc.getTextWidth(String(text));
    };

    const splitIntoBlocks = (html) => {
      const sanitized = sanitizeDescriptionHtml(html);
      const parser = new DOMParser();
      const docHtml = parser.parseFromString(`<div>${sanitized}</div>`, "text/html");
      const root = docHtml.body.firstChild;
      if (!root) return [];

      const buildSegments = (node, style = { bold: false, italic: false }) => {
        const segments = [];

        const walk = (child, currentStyle) => {
          if (child.nodeType === Node.TEXT_NODE) {
            let text = child.textContent.replace(/\r?\n/g, " ");
            text = text.replace(/[ \t]+/g, " ");
            if (text !== "") {
              segments.push({ text, style: { ...currentStyle } });
            }
            return;
          }

          if (child.nodeType !== Node.ELEMENT_NODE) return;
          const tag = child.tagName.toUpperCase();
          if (tag === "BR") {
            segments.push({ br: true });
            return;
          }

          const nextStyle = { ...currentStyle };
          if (tag === "B" || tag === "STRONG") nextStyle.bold = true;
          if (tag === "I" || tag === "EM") nextStyle.italic = true;

          Array.from(child.childNodes).forEach((grandchild) => walk(grandchild, nextStyle));
        };

        Array.from(node.childNodes).forEach((child) => walk(child, style));
        return segments;
      };

      const splitByLineBreaks = (segments) => {
        const lines = [];
        let current = [];

        segments.forEach((seg) => {
          if (seg.br) {
            lines.push(current);
            current = [];
            return;
          }
          current.push(seg);
        });

        lines.push(current);
        return lines.map((line) => line.filter((seg) => seg.text || seg.br));
      };

      const blocks = [];

      const addParagraph = (node) => {
        const segments = buildSegments(node);
        const lines = splitByLineBreaks(segments);
        lines.forEach((line) => {
          blocks.push({ type: "paragraph", segments: line });
        });
      };

      const addList = (node, ordered) => {
        const items = Array.from(node.children).filter((child) => child.tagName.toUpperCase() === "LI");
        items.forEach((li, index) => {
          const segments = buildSegments(li);
          const lines = splitByLineBreaks(segments);
          blocks.push({ type: "listItem", ordered, index, lines });
        });
      };

      Array.from(root.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text) {
            blocks.push({ type: "paragraph", segments: [{ text, style: {} }] });
          }
          return;
        }

        const tag = node.tagName.toUpperCase();
        if (tag === "P" || tag === "DIV") {
          addParagraph(node);
          return;
        }

        if (tag === "UL" || tag === "OL") {
          addList(node, tag === "OL");
          return;
        }

        addParagraph(node);
      });

      return blocks;
    };

    const isLeadingPunctuation = (text) => {
      return /^[,.;:?!%)\]]/.test(text);
    };

    const isWhitespaceText = (text) => {
      return /^\s+$/.test(text);
    };

    const splitWords = (segments) => {
      const tokens = [];
      segments.forEach((seg) => {
        if (!seg.text) return;
        const parts = seg.text.split(/(\s+)/).filter((part) => part.length > 0);
        parts.forEach((part) => {
          tokens.push({
            text: part,
            style: seg.style,
            whitespace: isWhitespaceText(part),
          });
        });
      });
      return tokens;
    };

    const splitLongWord = (word, maxWidth) => {
      const chunks = [];
      let current = "";
      for (const char of word.text) {
        const test = current + char;
        if (getStyledTextWidth(test, word.style) <= maxWidth || current === "") {
          current = test;
        } else {
          chunks.push({ text: current, style: word.style });
          current = char;
        }
      }
      if (current) chunks.push({ text: current, style: word.style });
      return chunks;
    };

    const buildLines = (segments, maxWidth) => {
      const tokens = splitWords(segments);
      const lines = [];
      let currentLine = [];
      let currentWidth = 0;

      const pushLine = () => {
        lines.push(currentLine);
        currentLine = [];
        currentWidth = 0;
      };

      const addTokenToLine = (token, tokenWidth) => {
        currentLine.push(token);
        currentWidth += tokenWidth;
      };

      const addWhitespaceToken = (token) => {
        if (currentLine.length === 0) return;
        const tokenWidth = getStyledTextWidth(token.text, token.style);
        if (currentWidth + tokenWidth <= maxWidth) {
          addTokenToLine(token, tokenWidth);
        }
      };

      const addWordToken = (token) => {
        const tokenWidth = getStyledTextWidth(token.text, token.style);
        if (currentLine.length === 0) {
          if (tokenWidth <= maxWidth) {
            addTokenToLine(token, tokenWidth);
          } else {
            const chunks = splitLongWord(token, maxWidth);
            chunks.forEach((chunk, index) => {
              if (index > 0) pushLine();
              const chunkWidth = getStyledTextWidth(chunk.text, chunk.style);
              addTokenToLine(chunk, chunkWidth);
            });
          }
          return;
        }

        if (currentWidth + tokenWidth <= maxWidth) {
          addTokenToLine(token, tokenWidth);
          return;
        }

        pushLine();
        if (tokenWidth <= maxWidth) {
          addTokenToLine(token, tokenWidth);
        } else {
          const chunks = splitLongWord(token, maxWidth);
          chunks.forEach((chunk, index) => {
            if (index > 0) pushLine();
            const chunkWidth = getStyledTextWidth(chunk.text, chunk.style);
            addTokenToLine(chunk, chunkWidth);
          });
        }
      };

      tokens.forEach((token) => {
        if (token.whitespace) {
          addWhitespaceToken(token);
        } else {
          addWordToken(token);
        }
      });

      if (currentLine.length) pushLine();
      if (lines.length === 0) lines.push([]);
      return lines;
    };

    const renderLine = (lineWords, x, y) => {
      if (lineWords.length === 0) {
        return;
      }

      let currentX = x;
      lineWords.forEach((word) => {
        setDocFont(word.style);
        doc.text(word.text, currentX, y);
        currentX += getStyledTextWidth(word.text, word.style);
      });
    };

    const renderDescriptionBlocks = (html, x, y, maxWidth, lineHeight) => {
      const ensureLocalPageSpace = (height, currentY) => {
        if (currentY + height > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        return currentY;
      };

      const blocks = splitIntoBlocks(html);
      if (blocks.length === 0) return y;
      blocks.forEach((block) => {
        if (block.type === "paragraph") {
          const lines = buildLines(block.segments, maxWidth);
          if (lines.length === 0) {
            y = ensureLocalPageSpace(lineHeight, y);
            y += lineHeight;
          }
          lines.forEach((line) => {
            y = ensureLocalPageSpace(lineHeight, y);
            renderLine(line, x, y);
            y += lineHeight;
          });
          y += 3;
          return;
        }

        if (block.type === "listItem") {
          const marker = block.ordered ? `${block.index + 1}.` : "•";
          const markerText = `${marker} `;
          const markerWidth = getStyledTextWidth(markerText, {});
          const indent = markerWidth + 4;
          y = ensureLocalPageSpace(lineHeight, y);
          setDocFont({});
          doc.text(markerText, x, y);

          const listLines = [];
          block.lines.forEach((lineSegments) => {
            const built = buildLines(lineSegments, maxWidth - indent);
            if (built.length === 0) {
              listLines.push([]);
            } else {
              listLines.push(...built);
            }
          });

          if (listLines.length === 0) {
            y = ensureLocalPageSpace(lineHeight, y);
            y += lineHeight;
          }

          listLines.forEach((line) => {
            y = ensureLocalPageSpace(lineHeight, y);
            renderLine(line, x + indent, y);
            y += lineHeight;
          });
          y += 3;
          return;
        }
      });
      return y;
    };

    // ===== TÍTULO =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(item.nombre, pageWidth - margin * 2);
    doc.text(titleLines, margin, currentY);
    currentY += (titleLines.length * 10) + 5;

    // ===== INFORMACIÓN BÁSICA =====
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const infoText = `Municipio: ${municipioNombre} | Categoría: ${item.categoria || "No especificada"}`;
    doc.text(infoText, margin, currentY);
    currentY += 10;
    
    drawLine(currentY - 5);

    // ===== ETIQUETAS =====
    if (item.tags && item.tags.length > 0) {
      ensurePageSpace(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Etiquetas:", margin, currentY);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const tagText = item.tags.map((t) => (typeof t === "string" ? t : t.nombre)).join(", ");
      const tagLines = doc.splitTextToSize(tagText, pageWidth - margin * 2 - 20);
      doc.text(tagLines, margin + 20, currentY);
      currentY += (tagLines.length * 5) + 5;
    }

    // ===== DESCRIPCIÓN =====
    currentY += 5;
    ensurePageSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Descripción", margin, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    currentY = renderDescriptionBlocks(item.descripcion || "Sin descripción", margin, currentY, pageWidth - margin * 2, 7.5);
    currentY += 8;

    // ===== ENLACES RELACIONADOS =====
    if (item.links && item.links.length > 0) {
      ensurePageSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Enlaces relacionados", margin, currentY);
      currentY += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      for (let i = 0; i < item.links.length; i++) {
        const link = item.links[i];
        const url = link?.url || link?.href || String(link || "");
        const title = link?.titulo || link?.title || url;
        if (!url) continue;
        const linkText = `${title}: ${url}`;
        const lineItems = doc.splitTextToSize(linkText, pageWidth - margin * 2);
        lineItems.forEach((line) => {
          if (currentY > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.textWithLink(line, margin, currentY, { url });
          currentY += 5;
        });
        currentY += 2;
      }
      currentY += 10;
    }

    // ===== GALERÍA =====
    if (images && images.length > 0) {
      ensurePageSpace(24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Galería", margin, currentY);
      currentY += 8;

      const imagesPerRow = 3;
      const gap = 3;
      const availableWidth = pageWidth - (margin * 2) - (gap * (imagesPerRow - 1));
      const imageWidth = availableWidth / imagesPerRow;
      const imageHeight = imageWidth * 0.75; 
      const imagesToShow = Math.min(images.length, 6);

      let xPos = margin;
      let rowY = currentY;

      for (let i = 0; i < imagesToShow; i++) {
        try {
          const base64Image = await urlToBase64(images[i]);
          if (base64Image) {
            const colIndex = i % imagesPerRow;
            
            if (colIndex === 0 && i > 0) {
              rowY += imageHeight + gap;
            }

            if (rowY + imageHeight > doc.internal.pageSize.getHeight() - margin) {
              doc.addPage();
              rowY = margin;
            }

            doc.addImage(base64Image, "JPEG", margin + (colIndex * (imageWidth + gap)), rowY, imageWidth, imageHeight);
          }
        } catch (error) {
          console.error(`Error procesando imagen ${i}:`, error);
        }
      }
      currentY = rowY + imageHeight + gap + 15;
      if (currentY > doc.internal.pageSize.getHeight() - margin - 40) {
        doc.addPage();
        currentY = margin;
      }
    }

    // ===== FUENTES DE CONSULTA =====
    if (item.links && item.links.length > 0) {
      ensurePageSpace(24);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Fuentes de consulta", margin, currentY);
      currentY += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      for (let i = 0; i < item.links.length; i++) {
        const link = item.links[i];
        const url = link?.url || link?.href || String(link || "");
        const title = link?.titulo || link?.title || url;
        if (!url) continue;
        const sourceText = `${title}: ${url}`;
        const sourceLines = doc.splitTextToSize(sourceText, pageWidth - margin * 2);
        sourceLines.forEach((line) => {
          if (currentY > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            currentY = margin;
          }
          doc.textWithLink(line, margin, currentY, { url });
          currentY += 5;
        });
        currentY += 2;
      }
      currentY += 10;
    }

    // ===== FECHA Y HORA DE GENERACIÓN =====
    const generatedAt = new Date();
    const formattedDate = generatedAt.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (currentY > doc.internal.pageSize.getHeight() - margin - 20) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Consulta:", margin, currentY);
    currentY += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(formattedDate, margin, currentY);
    currentY += 10;

    doc.save(`${item.nombre}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error al generar el PDF.");
  }
};

function PatrimonioDetailEntry({ item, municipioNombre }) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = useMemo(() => buildImageList(item), [item]);

  const tags = Array.isArray(item.tags) ? item.tags : [];
  const ubicaciones = Array.isArray(item.ubicaciones) ? item.ubicaciones : [];
  const links = Array.isArray(item.links) ? item.links : [];   // ← NUEVO
  const mainLocation = ubicaciones[0] || { lat: item.lat, lng: item.lng };

  const navigate = useNavigate();
  const location = useLocation();
  const adminBase = location.pathname.startsWith("/admin") ? "/admin" : "";

  const formatTag = (tag) => {
    if (typeof tag === "string") return tag;
    if (tag && typeof tag.nombre === "string") return tag.nombre;
    return String(tag ?? "");
  };

  const handleCategoryClick = (categoria) => {
    if (!categoria) return;
    navigate(`${adminBase}/explorar/categoria/${encodeURIComponent(normalizeCategoryKey(categoria))}`);
  };

  const handleTagClick = (tag) => {
    const value = formatTag(tag).trim();
    if (!value) return;
    navigate(`${adminBase}/explorar/tag/${encodeURIComponent(value.toLowerCase())}`);
  };

  const formatCoordinate = (value) => {
    if (typeof value === "number") return value.toFixed(5);
    if (value == null || value === "") return "";
    return String(value);
  };

  const googleMapsUrl = mainLocation.lat != null && mainLocation.lng != null
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mainLocation.lat},${mainLocation.lng}`)}`
    : null;

  const prevImage = () => {
    setCurrentImageIndex((current) => (current - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setCurrentImageIndex((current) => (current + 1) % images.length);
  };

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item]);

  return (
    <article className="detail-entry">
      <div className="detail-header">
        <div className="detail-header-content">
          <h2 className="detail-title">{item.nombre}</h2>
          <p className="detail-subtitle">Municipio: {municipioNombre}</p>
        </div>
      </div>

      <div className="detail-layout">
        <section className="detail-card">
          <div className="detail-image-container" aria-label={`Galería de ${item.nombre}`}>
            <img
              src={images[currentImageIndex]}
              alt={`${item.nombre} foto ${currentImageIndex + 1}`}
              className="detail-image"
              onClick={() => setIsImageOpen(true)}
              onError={(e) => {
                e.target.src = "https://placehold.co/600x400?text=Sin+imagen";
              }}
            />
            <button
              className="image-zoom"
              type="button"
              onClick={() => setIsImageOpen(true)}
              aria-label="Ver imagen en grande"
            >
              ⤢
            </button>
          </div>

          {images.length > 1 && (
            <div className="detail-carousel-controls">
              <button type="button" className="btn-secondary" onClick={prevImage}>
                Anterior
              </button>
              <span className="carousel-counter">
                {currentImageIndex + 1} / {images.length}
              </span>
              <button type="button" className="btn-primary" onClick={nextImage}>
                Siguiente
              </button>
            </div>
          )}

          {images.length > 1 && (
            <div className="detail-thumbnails">
              {images.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={`thumb-button ${index === currentImageIndex ? "active" : ""}`}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  <img src={src} alt={`${item.nombre} miniatura ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className="detail-info">
            <div className="detail-description" dangerouslySetInnerHTML={{ __html: sanitizeDescriptionHtml(item.descripcion || "") }} />

            {/* ENLACES RELACIONADOS */}
            {links.length > 0 && (
              <div className="detail-links">
                <h3 className="section-title-small">Enlaces relacionados</h3>
                <ul className="links-list">
                  {links.map((link, idx) => (
                    <li key={idx}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="detail-category-below">
              Categoría: <button type="button" className={`category-badge ${getCategoryClass(item.categoria)}`} onClick={() => handleCategoryClick(item.categoria)}>{displayCategoryLabel(item.categoria)}</button>
            </div>

            <div className="detail-tags-below">
              {tags.length > 0 ? (
                <>
                  Tag{tags.length > 1 ? "s" : ""}: {" "}
                  {tags.map((tag, index) => (
                    <button key={index} type="button" className="tag-badge" onClick={() => handleTagClick(tag)}>
                      {formatTag(tag)}
                    </button>
                  ))}
                </>
              ) : (
                <>Tag: <span className="tag-badge">Sin tag</span></>
              )}
            </div>
          </div>
        </section>

        <aside className="detail-location">
          <h2 className="section-title">Ubicación</h2>
          <div className="detail-map">
            <MapView
              patrimonios={[item]}
              center={[mainLocation.lat ?? 29.0729, mainLocation.lng ?? -110.9559]}
              zoom={15}
              interactive={false}
            />
          </div>
          {ubicaciones.length > 0 && (
            <div className="detail-location-list">
              <h3 className="section-subtitle">
                {ubicaciones.length === 1 ? "Ubicación" : "Ubicaciones"}
              </h3>
              <ul>
                {ubicaciones.map((ubi, index) => (
                  <li key={`${ubi.lat}-${ubi.lng}-${index}`} className="location-item">
                    <div className="location-name">
                      {ubi.nombre_punto || `Ubicación ${index + 1}`}
                    </div>
                    <div className="location-meta">
                      {ubi.municipio || municipioNombre}
                    </div>
                    {ubi.lat != null && ubi.lng != null && (
                      <a
                        className="location-open-link"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ubi.lat},${ubi.lng}`)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Abrir ubicación
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {googleMapsUrl && (
            <a
              className="detail-map-link"
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Abrir en Google Maps
            </a>
          )}
          <button
            className="detail-map-link"
            type="button"
            onClick={() => downloadPatrimonioPDF(item, municipioNombre, images)}
            aria-label="Descargar información en PDF"
            title="Descargar información del patrimonio"
          >
            Descargar PDF
          </button>
        </aside>
      </div>

      {isImageOpen && (
        <div className="image-modal" role="dialog" aria-modal="true" onClick={() => setIsImageOpen(false)}>
          <div className="image-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Cerrar imagen"
              className="image-modal-close"
              onClick={() => setIsImageOpen(false)}
            >
              ×
            </button>
            <img
              src={images[currentImageIndex]}
              alt={`${item.nombre} imagen ampliada`}
              className="image-modal-img"
            />
            {images.length > 1 && (
              <div className="image-modal-nav">
                <button type="button" onClick={prevImage}>
                  Anterior
                </button>
                <button type="button" onClick={nextImage}>
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function Detail() {
  const { id, slug, municipio } = useParams();
  const [patrimonio, setPatrimonio] = useState();
  const [municipios, setMunicipios] = useState([]);
  const [municipioPatrimonios, setMunicipioPatrimonios] = useState([]);
  const [selectedMunicipioId, setSelectedMunicipioId] = useState(null);
  const [municipioLoading, setMunicipioLoading] = useState(false);
  const [busquedaMunicipio, setBusquedaMunicipio] = useState("");
  const [categoriaMunicipio, setCategoriaMunicipio] = useState("");
  const [paginaMunicipio, setPaginaMunicipio] = useState(1);
  const [mostrarBotonVolver, setMostrarBotonVolver] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const botonVolverRef = useRef(null);

  const handleCambiarPaginaMunicipio = (nuevaPagina) => {
    setPaginaMunicipio(nuevaPagina);
  };

  useEffect(() => {
    if (paginaMunicipio > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [paginaMunicipio]);

  useEffect(() => {
    if (selectedMunicipioId) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [selectedMunicipioId]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const municipiosData = await getMunicipios();
        if (Array.isArray(municipiosData)) {
          setMunicipios(municipiosData);
        }

        let item = null;
        if (id) {
          item = await getPatrimonioById(id);
        } else if (slug) {
          const items = await getPatrimonios();
          if (Array.isArray(items)) {
            item = items.find((it) => {
              const nameMatch = slugify(it.nombre) === String(slug);
              if (!nameMatch) return false;
              if (municipio) {
                const mi = (it.municipio && typeof it.municipio === "string")
                  ? it.municipio
                  : it.municipio && typeof it.municipio === "object"
                  ? it.municipio.nombre || it.municipio.nombre_corto
                  : it.municipioNombre || it.municipio_nombre || null;

                if (mi) return slugify(mi) === String(municipio);

                if (it.municipioId && Array.isArray(municipiosData)) {
                  const m = municipiosData.find((m) => String(m.id) === String(it.municipioId));
                  if (m) return slugify(m.nombre) === String(municipio);
                }

                return false;
              }

              return true;
            });
          }
        }

        if (!item) {
          setPatrimonio(null);
          return;
        }

        setPatrimonio(normalizePatrimonioData(item));
      } catch (error) {
        console.error("Error fetching patrimonio:", error);
        setPatrimonio(null);
      }
    };

    cargarDatos();
  }, [id, slug, municipio]);

  const cargarPatrimoniosMunicipio = async (municipioId) => {
    if (!municipioId) return;
    setSelectedMunicipioId(municipioId);
    setPaginaMunicipio(1);
    setMunicipioLoading(true);
    setMunicipioPatrimonios([]);
    window.scrollTo({ top: 0, behavior: "auto" });

    try {
      const items = await getPatrimonios();
      const filtered = Array.isArray(items)
        ? items
            .filter((item) => String(item.municipioId) === String(municipioId))
            .map((item) => normalizePatrimonioData(item))
        : [];
      setMunicipioPatrimonios(filtered);
    } catch (error) {
      console.error("Error loading patrimonios de municipio:", error);
      setMunicipioPatrimonios([]);
    } finally {
      setMunicipioLoading(false);
    }
  };

  useEffect(() => {
    setMunicipioPatrimonios([]);
    setSelectedMunicipioId(null);
    setBusquedaMunicipio("");
    setCategoriaMunicipio("");
    setPaginaMunicipio(1);
  }, [patrimonio]);

  useEffect(() => {
    setPaginaMunicipio(1);
  }, [busquedaMunicipio, categoriaMunicipio]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        if (!mostrarBotonVolver) setMostrarBotonVolver(true);
        setIsScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 2000);
      } else {
        setMostrarBotonVolver(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [mostrarBotonVolver]);

  const filteredMunicipioPatrimonios = useMemo(() => {
    if (!selectedMunicipioId) return [];

    return municipioPatrimonios.filter((item) => {
      const matchesSearch = busquedaMunicipio.trim() === ""
        ? true
        : String(item.nombre || "").toLowerCase().includes(busquedaMunicipio.trim().toLowerCase());

      const matchesCategory = !categoriaMunicipio
        ? true
        : normalizeCategoryKey(item.categoria) === normalizeCategoryKey(categoriaMunicipio);

      return matchesSearch && matchesCategory;
    });
  }, [municipioPatrimonios, busquedaMunicipio, categoriaMunicipio, selectedMunicipioId]);

  const getPageNumbers = (paginaActual, totalPaginas) => {
    const inicio = Math.max(1, paginaActual - 1);
    const longitud = Math.min(3, totalPaginas - (inicio - 1));
    return Array.from({ length: longitud }, (_, i) => inicio + i).filter(
      (numero) => numero >= 1 && numero <= totalPaginas
    );
  };

  const itemsPorPagina = 4;
  const totalPaginasMunicipio = Math.ceil(filteredMunicipioPatrimonios.length / itemsPorPagina);
  const indicieInicio = (paginaMunicipio - 1) * itemsPorPagina;
  const patrimoniosPaginados = filteredMunicipioPatrimonios.slice(indicieInicio, indicieInicio + itemsPorPagina);

  if (patrimonio === undefined) {
    return null;
  }

  if (patrimonio === null) {
    return <h2 className="heading-2">Patrimonio no encontrado</h2>;
  }

  const nombreMunicipio = patrimonio && patrimonio.municipioId
    ? municipios.find((m) => String(m.id) === String(patrimonio.municipioId))?.nombre || "Municipio"
    : "Municipio";

  const showMunicipioDetails = Boolean(selectedMunicipioId);

  return (
    <div className="page-inner detail-page">
      <nav className="breadcrumbs">
        <Link to="/">Inicio</Link>
        <span className="crumb-sep">›</span>
        {showMunicipioDetails ? (
          <span className="crumb-current">{nombreMunicipio}</span>
        ) : patrimonio && patrimonio.municipioId ? (
          <>
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => cargarPatrimoniosMunicipio(patrimonio.municipioId)}
            >
              {nombreMunicipio}
            </button>
            <span className="crumb-sep">›</span>
            <span className="crumb-current">{patrimonio.nombre}</span>
          </>
        ) : (
          <span className="crumb-current">{patrimonio.nombre}</span>
        )}
      </nav>

      {showMunicipioDetails ? (
        <section className="municipio-details">
          <div className="catalogo-filters-section">
            <div className="catalogo-search-box">
              <div className="filter-header">
                <span className="filter-label">Buscar patrimonio</span>
              </div>
              <div className="catalogo-search-input-wrapper">
                <input
                  type="text"
                  placeholder="Escribe el nombre..."
                  value={busquedaMunicipio}
                  onChange={(e) => setBusquedaMunicipio(e.target.value)}
                  className="catalogo-search-input"
                />
                {busquedaMunicipio && (
                  <button
                    className="catalogo-search-clear-btn"
                    onClick={() => setBusquedaMunicipio("")}
                    aria-label="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="catalogo-category-filter">
              <div className="filter-header">
                <span className="filter-label">Filtrar por categoría</span>
              </div>
              <select
                value={categoriaMunicipio}
                onChange={(e) => setCategoriaMunicipio(e.target.value)}
                className="catalogo-select"
              >
                <option value="">Todas</option>
                <option value="material">Material</option>
                <option value="inmaterial">Inmaterial</option>
                <option value="natural">Natural</option>
              </select>
            </div>
          </div>

          <h2 className="section-title">{nombreMunicipio}</h2>
          {municipioLoading ? (
            <p className="lead">Cargando detalles de {nombreMunicipio}...</p>
          ) : filteredMunicipioPatrimonios.length === 0 ? (
            <p className="lead">No se encontraron patrimonios en {nombreMunicipio}.</p>
          ) : (
            <>
              <div className="municipio-results">
                {patrimoniosPaginados.map((item) => (
                  <PatrimonioDetailEntry key={item.id} item={item} municipioNombre={nombreMunicipio} />
                ))}
              </div>

              {totalPaginasMunicipio > 1 && (
                <div className="catalogo-municipio-pagination">
                  <button
                    className="catalogo-page-btn"
                    onClick={() => handleCambiarPaginaMunicipio(paginaMunicipio - 1)}
                    disabled={paginaMunicipio === 1}
                    aria-label="Página anterior"
                  >
                    ← Anterior
                  </button>

                  <div className="catalogo-page-numbers">
                    {paginaMunicipio > 2 && totalPaginasMunicipio > 3 && (
                      <>
                        <button
                          className="catalogo-page-num"
                          onClick={() => handleCambiarPaginaMunicipio(1)}
                        >
                          1
                        </button>
                        {paginaMunicipio > 3 && (
                          <span className="pagination-dots">...</span>
                        )}
                      </>
                    )}

                    {getPageNumbers(paginaMunicipio, totalPaginasMunicipio).map((num) => (
                      <button
                        key={num}
                        className={`catalogo-page-num ${num === paginaMunicipio ? "active" : ""}`}
                        onClick={() => handleCambiarPaginaMunicipio(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    className="catalogo-page-btn"
                    onClick={() => handleCambiarPaginaMunicipio(paginaMunicipio + 1)}
                    disabled={paginaMunicipio === totalPaginasMunicipio}
                    aria-label="Página siguiente"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <PatrimonioDetailEntry item={patrimonio} municipioNombre={nombreMunicipio} />
      )}

      <button
        ref={botonVolverRef}
        className={`catalogo-scroll-top ${mostrarBotonVolver ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Volver al inicio"
        title="Volver al inicio"
      >
        ↑
      </button>
    </div>
  );
}

export default Detail;