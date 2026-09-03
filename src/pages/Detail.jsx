import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import slugify from "../utils/slugify";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import MapView from "../components/MapView";
import "../styles/pages/Detail.css";
import {
  getPatrimonioById,
  getPatrimonios,
} from "../services/patrimonioService";
import { getMunicipios } from "../services/municipioService";
import { API_HOST } from "../services/apiConfig.js";
import {
  getCategoryClass,
  getCategoryLabel,
  normalizeCategoryKey,
} from "../utils/categoryUtils";
import DOMPurify from "dompurify";
import androidLogo from "../Icons/logotipo-de-android.png";
import appleLogo from "../Icons/logotipo-de-apple.png";

const buildImageUrl = (value) => {
  if (!value) return null;
  if (typeof value !== "string") return null;
  return value.startsWith("http") ? value : `${API_HOST}${value}`;
};

// ---------- ESTA FUNCIÓN SE MANTIENE EXCLUSIVAMENTE PARA EL PDF ----------
const sanitizeDescriptionHtml = (html) => {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");

  const allowedTags = new Set([
    "B",
    "STRONG",
    "I",
    "EM",
    "BR",
    "UL",
    "OL",
    "LI",
    "FONT",
    "SPAN",
    "BLOCKQUOTE",
    "CITE",
    "IMG",
    "FIGURE",
    "FIGCAPTION",
    "TABLE",
    "THEAD",
    "TBODY",
    "TR",
    "TD",
    "TH",
    "CAPTION",
    "U",
    "DIV",
    "P",
    "S",
    "STRIKE",
    "DEL",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
  ]);

  const allowedCssProps = [
    "color",
    "background-color",
    "font-weight",
    "font-style",
    "text-decoration",
    "text-align",
    "width",
    "max-width",
    "min-width",
    "height",
    "border",
    "border-collapse",
    "border-spacing",
    "padding",
    "margin",
    "display",
  ];

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

      if (node.hasAttribute("style")) {
        const style = node.getAttribute("style");
        const rules = style
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        const filtered = rules.filter((rule) => {
          const [prop] = rule.split(":").map((s) => s.trim());
          return allowedCssProps.includes(prop.toLowerCase());
        });
        if (filtered.length > 0) {
          el.setAttribute("style", filtered.join("; "));
        }
      }

      if (node.hasAttribute("class")) {
        el.setAttribute("class", node.getAttribute("class"));
      }

      [
        "width",
        "height",
        "src",
        "alt",
        "colspan",
        "rowspan",
        "border",
        "cellpadding",
        "cellspacing",
      ].forEach((attr) => {
        if (node.hasAttribute(attr)) {
          el.setAttribute(attr, node.getAttribute(attr));
        }
      });

      if (tag === "FONT" && node.hasAttribute("color")) {
        el.setAttribute("color", node.getAttribute("color"));
      }

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

  cleanedHtml = cleanedHtml
    .replace(/&nbsp;/g, " ")
    .replace(/\s+<\/(strong|b|i|em|u|s|strike|del|span|font)>/gi, "</$1>")
    .replace(
      /<\/(strong|b|i|em|u|s|strike|del|span|font)>\s*([^\s<.,;:!?\)])/gi,
      "</$1> $2",
    )
    .replace(/ {2,}/g, " ");

  return cleanedHtml.trim();
};

// ---------- FUNCIÓN PARA LIMPIAR HTML EN LA VISTA WEB ----------
const cleanWebDescriptionHtml = (html) => {
  if (!html) return "";
  
  let cleanedHtml = html
    .replace(/&nbsp;/g, " ")
    .replace(/\s+<\/(strong|b|i|em|u|s|strike|del|span|font)>/gi, "</$1>")
    .replace(
      /<\/(strong|b|i|em|u|s|strike|del|span|font)>\s*([^\s<.,;:!?\)])/gi,
      "</$1> $2",
    )
    .replace(/ {2,}/g, " ");

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
    return [
      {
        lat,
        lng,
        nombre_punto: item.nombre || "Ubicación",
        municipio: item.municipio || item.municipioId || "",
      },
    ];
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
    imagen:
      normalizeImage(item.imagen_url || item.imagen || item.portada) ||
      "https://placehold.co/600x400?text=Sin+imagen",
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
    if (!url) return null;
    if (url.startsWith("data:")) return url;

    let fullUrl = url;
    if (!url.startsWith("http")) {
      fullUrl = `${API_HOST}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error("Network response was not ok");
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
      const doc = parser.parseFromString(
        `<div>${sanitized}</div>`,
        "text/html",
      );
      const root = doc.body.firstChild;
      if (!root) return [];

      const blocks = [];

      const processNode = (node, currentBlock = null, inheritedStyles = {}) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text || text.trim() === "") return;

          let block = currentBlock;
          if (!block) {
            block = {
              type: "paragraph",
              align: inheritedStyles.align || "left",
              segments: [],
            };
            blocks.push(block);
          }

          const segment = {
            text: text,
            style: { ...inheritedStyles },
            color: inheritedStyles.color || null,
          };

          if (block.type === "list") {
            const lastItem =
              block.items && block.items.length > 0
                ? block.items[block.items.length - 1]
                : null;
            if (lastItem) lastItem.segments.push(segment);
          } else {
            block.segments.push(segment);
          }
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName.toUpperCase();
        const nodeStyles = combineStyles(inheritedStyles, node);

        if (tag === "BR") {
          let block = currentBlock || blocks[blocks.length - 1];
          if (block && block.type === "paragraph") {
            block.segments.push({ br: true });
          } else {
            blocks.push({
              type: "paragraph",
              align: nodeStyles.align || inheritedStyles.align || "left",
              segments: [{ br: true }],
            });
          }
          return;
        }

        if (tag === "FIGURE") {
          let imageBlock = null;
          let captionText = "";

          Array.from(node.childNodes).forEach((child) => {
            if (child.nodeType !== Node.ELEMENT_NODE) return;
            const childTag = child.tagName.toUpperCase();
            if (childTag === "IMG") {
              const src = child.getAttribute("src") || "";
              if (src) {
                const { widthPercent, widthPx } = parseImageSize(child);
                imageBlock = {
                  type: "image",
                  src,
                  align:
                    combineStyles(nodeStyles, child).align ||
                    nodeStyles.align ||
                    "center",
                  alt: child.getAttribute("alt") || "",
                  caption: "",
                  widthPercent,
                  widthPx,
                  height: child.getAttribute("height"),
                };
              }
            } else if (childTag === "FIGCAPTION") {
              captionText = child.textContent?.trim() || "";
            }
          });

          if (imageBlock) {
            imageBlock.caption = captionText;
            blocks.push(imageBlock);
          }
          return;
        }

        if (tag === "IMG") {
          const src = node.getAttribute("src") || "";
          if (src) {
            const { widthPercent, widthPx } = parseImageSize(node);
            blocks.push({
              type: "image",
              src,
              align: nodeStyles.align || inheritedStyles.align || "center",
              alt: node.getAttribute("alt") || "",
              caption: "",
              widthPercent,
              widthPx,
              height: node.getAttribute("height"),
            });
          }
          return;
        }

        if (tag === "TABLE") {
          const rows = [];
          let hasHeader = false;

          Array.from(node.querySelectorAll("tr")).forEach((tr) => {
            const rowCells = [];
            Array.from(tr.children).forEach((cell) => {
              const cellTag = cell.tagName.toUpperCase();
              if (cellTag === "TH" || cellTag === "TD") {
                const cellText = cell.textContent?.trim() || "";
                rowCells.push(cellText);
                if (cellTag === "TH") hasHeader = true;
              }
            });
            if (rowCells.length > 0) rows.push(rowCells);
          });

          if (rows.length > 0) {
            blocks.push({ type: "table", rows, hasHeader });
          }
          return;
        }

        if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(tag)) {
          const pBlock = {
            type: "paragraph",
            align: nodeStyles.align || inheritedStyles.align || "left",
            segments: [],
          };
          blocks.push(pBlock);

          Array.from(node.childNodes).forEach((child) =>
            processNode(child, pBlock, nodeStyles),
          );
          return;
        }

        if (tag === "BLOCKQUOTE") {
          const quoteBlock = {
            type: "blockquote",
            align: nodeStyles.align || inheritedStyles.align || "left",
            segments: [],
          };
          blocks.push(quoteBlock);
          Array.from(node.childNodes).forEach((child) =>
            processNode(child, quoteBlock, nodeStyles),
          );
          return;
        }

        if (tag === "UL" || tag === "OL") {
          const listBlock = { type: "list", ordered: tag === "OL", items: [] };
          blocks.push(listBlock);
          Array.from(node.childNodes).forEach((child) => {
            if (
              child.nodeType === Node.ELEMENT_NODE &&
              child.tagName.toUpperCase() === "LI"
            ) {
              const itemStyles = combineStyles(nodeStyles, child);
              const item = {
                align: itemStyles.align || "left",
                segments: [],
              };
              listBlock.items.push(item);
              Array.from(child.childNodes).forEach((subChild) =>
                processNode(subChild, listBlock, itemStyles),
              );
            }
          });
          return;
        }

        Array.from(node.childNodes).forEach((child) =>
          processNode(child, currentBlock, nodeStyles),
        );
      };

      Array.from(root.childNodes).forEach((child) => processNode(child, null));

      return blocks.filter((block) => {
        if (block.type === "paragraph" || block.type === "blockquote") {
          return block.segments && block.segments.length > 0;
        }
        if (block.type === "list") {
          return block.items && block.items.length > 0;
        }
        return true;
      });
    };

    const splitWords = (segments) => {
      const tokens = [];
      segments.forEach((seg) => {
        if (seg.br) {
          tokens.push({ br: true });
          return;
        }
        if (!seg.text) return;
        const parts = seg.text.split(/(\s+)/);
        parts.forEach((part) => {
          if (!part) return;
          tokens.push({
            text: part,
            style: seg.style,
            color: seg.color || null,
            whitespace: /^\s+$/.test(part),
          });
        });
      });
      return tokens;
    };

    const combineStyles = (parentStyles = {}, node) => {
      const styles = { ...parentStyles };
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return styles;

      const tag = node.tagName ? node.tagName.toUpperCase() : "";

      // 1. Clases de Quill / editores WYSIWYG
      if (node.classList) {
        if (node.classList.contains("ql-align-center")) styles.align = "center";
        if (node.classList.contains("ql-align-right")) styles.align = "right";
        if (node.classList.contains("ql-align-justify"))
          styles.align = "justify";
      }

      // 2. Estilos inline
      if (node.getAttribute && node.getAttribute("style")) {
        const styleAttr = node.getAttribute("style").toLowerCase();
        if (
          styleAttr.includes("text-align: center") ||
          styleAttr.includes("text-align:center")
        ) {
          styles.align = "center";
        } else if (
          styleAttr.includes("text-align: right") ||
          styleAttr.includes("text-align:right")
        ) {
          styles.align = "right";
        } else if (
          styleAttr.includes("text-align: justify") ||
          styleAttr.includes("text-align:justify")
        ) {
          styles.align = "justify";
        } else if (
          styleAttr.includes("text-align: left") ||
          styleAttr.includes("text-align:left")
        ) {
          styles.align = "left";
        }

        if (
          styleAttr.includes("text-decoration: underline") ||
          styleAttr.includes("text-decoration:underline")
        ) {
          styles.underline = true;
        }
        if (
          styleAttr.includes("text-decoration: line-through") ||
          styleAttr.includes("text-decoration:line-through")
        ) {
          styles.strikethrough = true;
        }
        if (
          styleAttr.includes("float: right") ||
          styleAttr.includes("float:right")
        ) {
          styles.align = "right";
        }
        if (
          styleAttr.includes("float: left") ||
          styleAttr.includes("float:left")
        ) {
          styles.align = "left";
        }
        if (
          styleAttr.includes("font-style: italic") ||
          styleAttr.includes("font-style:italic")
        ) {
          styles.italic = true;
        }
        if (
          styleAttr.includes("font-weight: bold") ||
          styleAttr.includes("font-weight:bold") ||
          /font-weight\s*:\s*(?:[7-9]00|bold)/.test(styleAttr)
        ) {
          styles.bold = true;
        }

        const colorMatch = styleAttr.match(/(?:^|;)\s*color\s*:\s*([^;]+)/);
        if (colorMatch) {
          styles.color = colorMatch[1].trim();
        }
      }

      // 3. Atributo HTML align
      if (node.getAttribute && node.getAttribute("align")) {
        const alignAttr = node.getAttribute("align").toLowerCase();
        if (["center", "right", "justify", "left"].includes(alignAttr)) {
          styles.align = alignAttr;
        }
      }

      // Estilos de formato HTML
      if (tag === "B" || tag === "STRONG") styles.bold = true;
      if (tag === "I" || tag === "EM") styles.italic = true;
      if (tag === "U") styles.underline = true;
      if (tag === "S" || tag === "STRIKE" || tag === "DEL")
        styles.strikethrough = true;
      if (tag === "FONT" && node.getAttribute("color")) {
        styles.color = node.getAttribute("color");
      }

      return styles;
    };

    const parseImageSize = (node) => {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) {
        return { widthPercent: null, widthPx: null };
      }
      const widthAttr = node.getAttribute("width") || "";
      const styleAttr = node.getAttribute("style") || "";
      let widthPercent = null;
      let widthPx = null;

      const rawPercent = widthAttr.match(/^\s*(\d+(?:\.\d+)?)\s*%\s*$/);
      if (rawPercent) {
        widthPercent = parseFloat(rawPercent[1]);
      } else if (/^\s*(\d+(?:\.\d+)?)px\s*$/i.test(widthAttr)) {
        widthPx = parseFloat(widthAttr);
      }

      if (widthPercent == null && styleAttr) {
        const styleWidth = styleAttr.match(/width\s*:\s*(\d+(?:\.\d+)?)(%)?/i);
        if (styleWidth) {
          if (styleWidth[2] === "%") {
            widthPercent = parseFloat(styleWidth[1]);
          } else {
            widthPx = parseFloat(styleWidth[1]);
          }
        }
      }

      return { widthPercent, widthPx };
    };

    const splitLongWord = (word, maxWidth) => {
      const chunks = [];
      let current = "";
      for (const char of word.text) {
        const test = current + char;
        if (
          getStyledTextWidth(test, word.style) <= maxWidth ||
          current === ""
        ) {
          current = test;
        } else {
          chunks.push({ text: current, style: word.style, color: word.color });
          current = char;
        }
      }
      if (current)
        chunks.push({ text: current, style: word.style, color: word.color });
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
        if (token.br) {
          pushLine();
          return;
        }
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

    const renderLine = (lineWords, x, y, maxWidth, align = "left") => {
      if (!lineWords || lineWords.length === 0) return;

      doc.setFontSize(10);

      let totalLineWidth = 0;
      lineWords.forEach((word) => {
        setDocFont(word.style);
        doc.setFontSize(10);
        totalLineWidth += getStyledTextWidth(word.text, word.style);
      });

      let currentX = x;
      const cleanAlign = String(align || "left")
        .toLowerCase()
        .trim();

      if (cleanAlign === "center") {
        currentX = x + Math.max(0, (maxWidth - totalLineWidth) / 2);
      } else if (cleanAlign === "right") {
        currentX = x + Math.max(0, maxWidth - totalLineWidth);
      }

      lineWords.forEach((word) => {
        setDocFont(word.style);
        doc.setFontSize(10);

        if (word.color) {
          doc.setTextColor(word.color);
          doc.setDrawColor(word.color);
        } else {
          doc.setTextColor(0, 0, 0);
          doc.setDrawColor(0, 0, 0);
        }

        const text = word.text;
        const textWidth = getStyledTextWidth(text, word.style);
        doc.text(text, currentX, y);

        if (word.style && word.style.underline) {
          doc.setLineWidth(0.2);
          doc.line(currentX, y + 0.8, currentX + textWidth, y + 0.8);
        }

        if (word.style && word.style.strikethrough) {
          doc.setLineWidth(0.2);
          doc.line(currentX, y - 1.2, currentX + textWidth, y - 1.2);
        }

        currentX += textWidth;
      });
    };

    const renderDescriptionBlocks = async (
      html,
      x,
      y,
      maxWidth,
      lineHeight,
    ) => {
      const ensureLocalPageSpace = (height, currentY) => {
        if (currentY + height > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        return currentY;
      };

      const blocks = splitIntoBlocks(html);
      if (blocks.length === 0) return y;

      const blockSpacing = 3;

      for (const block of blocks) {
        if (block.type === "paragraph") {
          const align =
            block.align ||
            block.segments?.find((s) => s.style?.align)?.style?.align ||
            "left";
          const lines = buildLines(block.segments, maxWidth);

          lines.forEach((line) => {
            y = ensureLocalPageSpace(lineHeight, y);
            renderLine(line, x, y, maxWidth, align);
            y += lineHeight;
          });
          y += blockSpacing;
        } else if (block.type === "blockquote") {
          const quoteIndent = 10;
          const borderX = x + 5;
          const textX = x + quoteIndent + 5;
          const quoteWidth = maxWidth - quoteIndent - 5;

          const align =
            block.align ||
            block.segments?.find((s) => s.style?.align)?.style?.align ||
            "left";
          const lines = buildLines(block.segments, quoteWidth);
          let totalHeight = lines.length * lineHeight;
          y = ensureLocalPageSpace(totalHeight + 2, y);

          doc.setDrawColor(200, 200, 200);
          doc.line(borderX, y, borderX, y + totalHeight);

          lines.forEach((line) => {
            y = ensureLocalPageSpace(lineHeight, y);
            renderLine(line, textX, y, quoteWidth, align);
            y += lineHeight;
          });
          y += blockSpacing;
        } else if (block.type === "list") {
          const listIndent = 8;
          const bulletX = x + 2;
          const textX = x + listIndent + 2;
          const listWidth = maxWidth - listIndent - 2;

          block.items.forEach((item, index) => {
            const align =
              item.align ||
              item.segments?.find((s) => s.style?.align)?.style?.align ||
              "left";
            const lines = buildLines(item.segments, listWidth);
            if (lines.length === 0) return;

            let itemHeight = lines.length * lineHeight;
            y = ensureLocalPageSpace(itemHeight + 2, y);

            setDocFont({ bold: false, italic: false });
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            const bullet = block.ordered ? `${index + 1}.` : "•";
            doc.text(bullet, bulletX, y);

            lines.forEach((line) => {
              renderLine(line, textX, y, listWidth, align);
              y += lineHeight;
            });

            y += 1;
          });
          y += blockSpacing;
             } else if (block.type === "table") {
          const rows = block.rows || [];
          if (rows.length > 0) {
            
            // CORRECCIÓN 1: Espacio superior. Restamos el blockSpacing para que quede exactamente 1 renglón (lineHeight).
            const startY = y + blockSpacing - lineHeight; 
            
            const header = block.hasHeader ? [rows[0]] : [];
            const body = block.hasHeader ? rows.slice(1) : rows;

            autoTable(doc, {
              startY: startY, 
              head: header,
              body,
              theme: "grid",
              styles: {
                fontSize: 9,
                cellPadding: 3,
                overflow: "linebreak",
                valign: "middle",
                textColor: [0, 0, 0], // CORRECCIÓN 2: Se fuerza el color negro en el cuerpo
              },
              headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0], // CORRECCIÓN 3: Se fuerza el color negro en el encabezado
                halign: "center",
              },
              tableLineColor: [200, 200, 200],
              tableLineWidth: 0.1,
              margin: { left: x, right: margin },
              tableWidth: maxWidth,
            });

            // CORRECCIÓN 4: Espacio inferior. Aquí debe ir un renglón completo de espacio.
            y = doc.lastAutoTable.finalY + lineHeight; 
          }
        } else if (block.type === "image") {
          const src = block.src;
          if (!src) continue;
          try {
            const base64 = await Promise.race([
              urlToBase64(src),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 5000),
              ),
            ]);
            if (!base64) {
              throw new Error("No se pudo convertir a base64");
            }

            const maxImageWidth = maxWidth * 0.9;
            const maxImageHeight = 100;

            const naturalSize = await new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
              img.onerror = () => resolve({ width: null, height: null });
              img.src = base64;
            });

            let imgWidth = maxImageWidth;
            if (block.widthPercent != null) {
              imgWidth = Math.min(maxImageWidth, maxImageWidth * (block.widthPercent / 100));
            } else if (block.widthPx != null && naturalSize.width) {
              const widthRatio = block.widthPx / naturalSize.width;
              imgWidth = Math.min(maxImageWidth, maxImageWidth * widthRatio);
            }

            let imgHeight = naturalSize.width && naturalSize.height
              ? (imgWidth * naturalSize.height) / naturalSize.width
              : imgWidth * 0.75;

            if (imgHeight > maxImageHeight) {
              imgHeight = maxImageHeight;
              imgWidth = imgHeight * (naturalSize.width && naturalSize.height
                ? naturalSize.width / naturalSize.height
                : 4 / 3);
            }

            const captionLines = block.caption
              ? doc.splitTextToSize(block.caption, maxWidth)
              : [];
            const captionHeight = captionLines.length * lineHeight;
            y = ensureLocalPageSpace(imgHeight + 5 + captionHeight + blockSpacing, y);

            const imageType = base64.startsWith("data:image/png")
              ? "PNG"
              : base64.startsWith("data:image/jpeg") ||
                base64.startsWith("data:image/jpg")
              ? "JPEG"
              : "JPEG";

            doc.addImage(
              base64,
              imageType,
              x + (maxWidth - imgWidth) / 2,
              y,
              imgWidth,
              imgHeight,
            );
            y += imgHeight + 5;

            if (captionLines.length > 0) {
              doc.setFont("helvetica", "italic");
              doc.setFontSize(9);
              captionLines.forEach((captionLine) => {
                const captionX = block.align === "center"
                  ? x + Math.max(0, (maxWidth - doc.getTextWidth(captionLine)) / 2)
                  : x;
                doc.text(captionLine, captionX, y);
                y += lineHeight;
              });
            }
          } catch (error) {
            console.warn("Error al insertar imagen en PDF:", error);
            y = ensureLocalPageSpace(lineHeight, y);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text("[Imagen no disponible]", x, y);
            y += lineHeight;
          }
        }
      }

      return y;
    };

    // ===== TÍTULO =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(item.nombre, pageWidth - margin * 2);
    doc.text(titleLines, margin, currentY);
    currentY += titleLines.length * 10 + 5;

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
      const tagText = item.tags
        .map((t) => (typeof t === "string" ? t : t.nombre))
        .join(", ");
      const tagLines = doc.splitTextToSize(
        tagText,
        pageWidth - margin * 2 - 20,
      );
      doc.text(tagLines, margin + 20, currentY);
      currentY += tagLines.length * 5 + 5;
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
    currentY = await renderDescriptionBlocks(
      item.descripcion || "Sin descripción",
      margin,
      currentY,
      pageWidth - margin * 2,
      7.5,
    );
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
      const availableWidth = pageWidth - margin * 2 - gap * (imagesPerRow - 1);
      const imageWidth = availableWidth / imagesPerRow;
      const imageHeight = imageWidth * 0.75;
      const imagesToShow = Math.min(images.length, 6);

      let rowY = currentY;

      for (let i = 0; i < imagesToShow; i++) {
        try {
          const base64Image = await urlToBase64(images[i]);
          if (base64Image) {
            const colIndex = i % imagesPerRow;

            if (colIndex === 0 && i > 0) {
              rowY += imageHeight + gap;
            }

            if (
              rowY + imageHeight >
              doc.internal.pageSize.getHeight() - margin
            ) {
              doc.addPage();
              rowY = margin;
            }

            doc.addImage(
              base64Image,
              "JPEG",
              margin + colIndex * (imageWidth + gap),
              rowY,
              imageWidth,
              imageHeight,
            );
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
        const sourceLines = doc.splitTextToSize(
          sourceText,
          pageWidth - margin * 2,
        );
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

    // ===== AGREGAR PIE DE PÁGINA EN TODAS LAS PÁGINAS =====
    const generatedAt = new Date();
    const formattedDate = generatedAt.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const footerLabel = "Consulta:";
    const footerText = `${footerLabel} ${formattedDate}`;
    const totalPages = doc.internal.pages.length - 1; // Restar 1 porque la primera entrada es undefined
    const footerY = doc.internal.pageSize.getHeight() - 10; // 10mm desde el borde inferior

    // Iterar sobre todas las páginas para agregar el pie de página
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      
      // Dibujar línea separadora discreta
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Dibujar texto del pie de página
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      
      // Centrar el texto horizontalmente
      doc.setFont("helvetica", "italic");
      const labelWidth = doc.getTextWidth(footerLabel);
      doc.setFont("helvetica", "normal");
      const dateWidth = doc.getTextWidth(` ${formattedDate}`);
      const footerX = (pageWidth - labelWidth - dateWidth) / 2;

      doc.setFont("helvetica", "italic");
      doc.text(footerLabel, footerX, footerY);
      doc.setFont("helvetica", "normal");
      doc.text(` ${formattedDate}`, footerX + labelWidth, footerY);
    }

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
  const links = Array.isArray(item.links) ? item.links : [];
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
    navigate(
      `${adminBase}/explorar/categoria/${encodeURIComponent(normalizeCategoryKey(categoria))}`,
    );
  };

  const handleTagClick = (tag) => {
    const value = formatTag(tag).trim();
    if (!value) return;
    navigate(
      `${adminBase}/explorar/tag/${encodeURIComponent(value.toLowerCase())}`,
    );
  };

  const googleMapsUrl =
    mainLocation.lat != null && mainLocation.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${mainLocation.lat},${mainLocation.lng}`)}`
      : null;

  const appleMapsUrl =
    mainLocation.lat != null && mainLocation.lng != null
      ? `https://maps.apple.com/?ll=${encodeURIComponent(`${mainLocation.lat},${mainLocation.lng}`)}&q=${encodeURIComponent(`${mainLocation.lat},${mainLocation.lng}`)}`
      : null;

  const prevImage = () => {
    setCurrentImageIndex(
      (current) => (current - 1 + images.length) % images.length,
    );
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
          <div
            className="detail-image-container"
            aria-label={`Galería de ${item.nombre}`}
          >
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
              <button
                type="button"
                className="btn-secondary"
                onClick={prevImage}
              >
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
                  <img
                    src={src}
                    alt={`${item.nombre} miniatura ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="detail-info">
            <div
              className="detail-description"
              dangerouslySetInnerHTML={{
                __html: cleanWebDescriptionHtml(DOMPurify.sanitize(item.descripcion || "", {
                  ADD_TAGS: [
                    "blockquote",
                    "cite",
                    "font",
                    "figure",
                    "figcaption",
                    "table",
                    "thead",
                    "tbody",
                    "tr",
                    "td",
                    "th",
                    "caption",
                  ],
                  ADD_ATTR: [
                    "style",
                    "class",
                    "color",
                    "width",
                    "height",
                    "align",
                    "border",
                    "cellpadding",
                    "cellspacing",
                    "colspan",
                    "rowspan",
                    "src",
                    "alt",
                  ],
                  FORBID_TAGS: ["script", "style", "iframe"],
                })),
              }}
            />

            {links.length > 0 && (
              <div className="detail-links">
                <h3 className="section-title-small">Enlaces relacionados</h3>
                <ul className="links-list">
                  {links.map((link, idx) => (
                    <li key={idx}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="detail-category-below">
              Categoría:{" "}
              <button
                type="button"
                className={`category-badge ${getCategoryClass(item.categoria)}`}
                onClick={() => handleCategoryClick(item.categoria)}
              >
                {displayCategoryLabel(item.categoria)}
              </button>
            </div>

            <div className="detail-tags-below">
              {tags.length > 0 ? (
                <>
                  Etiqueta{tags.length > 1 ? "s" : ""}:{" "}
                  {tags.map((tag, index) => (
                    <button
                      key={index}
                      type="button"
                      className="tag-badge"
                      onClick={() => handleTagClick(tag)}
                    >
                      {formatTag(tag)}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  Etiquetas: <span className="tag-badge">Sin etiquetas</span>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="detail-location">
          <h2 className="section-title">Ubicación</h2>
          <div className="detail-map">
            <MapView
              patrimonios={[item]}
              center={[
                mainLocation.lat ?? 29.0729,
                mainLocation.lng ?? -110.9559,
              ]}
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
                  <li
                    key={`${ubi.lat}-${ubi.lng}-${index}`}
                    className="location-item"
                  >
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
          {googleMapsUrl && appleMapsUrl && (
            <div className="detail-map-actions">
              <span className="detail-map-actions-label">
                Abrir ubicación en:
              </span>
              <div className="detail-map-buttons">
                <a
                  className="detail-map-action-link"
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img
                    src={androidLogo}
                    alt="Google Maps"
                    className="detail-map-action-icon"
                  />
                  Google Maps
                </a>
                <a
                  className="detail-map-action-link"
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <img
                    src={appleLogo}
                    alt="Apple Maps"
                    className="detail-map-action-icon"
                  />
                  Apple Maps
                </a>
              </div>
            </div>
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
        <div
          className="image-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsImageOpen(false)}
        >
          <div
            className="image-modal-inner"
            onClick={(e) => e.stopPropagation()}
          >
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
  // 1. TODOS LOS HOOKS DECLARADOS AL PRINCIPIO
  const { id, slug, municipio } = useParams();
  const location = useLocation(); // <-- Mover aquí para evitar violar la regla de Hooks
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
                const mi =
                  it.municipio && typeof it.municipio === "string"
                    ? it.municipio
                    : it.municipio && typeof it.municipio === "object"
                      ? it.municipio.nombre || it.municipio.nombre_corto
                      : it.municipioNombre || it.municipio_nombre || null;

                if (mi) return slugify(mi) === String(municipio);

                if (it.municipioId && Array.isArray(municipiosData)) {
                  const m = municipiosData.find(
                    (m) => String(m.id) === String(it.municipioId),
                  );
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
      const matchesSearch =
        busquedaMunicipio.trim() === ""
          ? true
          : String(item.nombre || "")
              .toLowerCase()
              .includes(busquedaMunicipio.trim().toLowerCase());

      const matchesCategory = !categoriaMunicipio
        ? true
        : normalizeCategoryKey(item.categoria) ===
          normalizeCategoryKey(categoriaMunicipio);

      return matchesSearch && matchesCategory;
    });
  }, [
    municipioPatrimonios,
    busquedaMunicipio,
    categoriaMunicipio,
    selectedMunicipioId,
  ]);

  // 2. RETORNOS CONDICIONALES / EARLY RETURNS SÓLO DESPUÉS DE LOS HOOKS
  if (patrimonio === undefined) {
    return null;
  }

  if (patrimonio === null) {
    return <h2 className="heading-2">Patrimonio no encontrado</h2>;
  }

  const getPageNumbers = (paginaActual, totalPaginas) => {
    const inicio = Math.max(1, paginaActual - 1);
    const longitud = Math.min(3, totalPaginas - (inicio - 1));
    return Array.from({ length: longitud }, (_, i) => inicio + i).filter(
      (numero) => numero >= 1 && numero <= totalPaginas,
    );
  };

  const itemsPorPagina = 4;
  const totalPaginasMunicipio = Math.ceil(
    filteredMunicipioPatrimonios.length / itemsPorPagina,
  );
  const indicieInicio = (paginaMunicipio - 1) * itemsPorPagina;
  const patrimoniosPaginados = filteredMunicipioPatrimonios.slice(
    indicieInicio,
    indicieInicio + itemsPorPagina,
  );

  const nombreMunicipio =
    patrimonio && patrimonio.municipioId
      ? municipios.find((m) => String(m.id) === String(patrimonio.municipioId))
          ?.nombre || "Municipio"
      : "Municipio";

  const adminBase = location.pathname.startsWith("/admin") ? "/admin" : "/";
  const showMunicipioDetails = Boolean(selectedMunicipioId);

  return (
    <div className="page-inner detail-page">
      <nav className="breadcrumbs">
        <Link to={adminBase}>Inicio</Link>
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
            <p className="lead">
              No se encontraron patrimonios en {nombreMunicipio}.
            </p>
          ) : (
            <>
              <div className="municipio-results">
                {patrimoniosPaginados.map((item) => (
                  <PatrimonioDetailEntry
                    key={item.id}
                    item={item}
                    municipioNombre={nombreMunicipio}
                  />
                ))}
              </div>

              {totalPaginasMunicipio > 1 && (
                <div className="catalogo-municipio-pagination">
                  <button
                    className="catalogo-page-btn"
                    onClick={() =>
                      handleCambiarPaginaMunicipio(paginaMunicipio - 1)
                    }
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

                    {getPageNumbers(paginaMunicipio, totalPaginasMunicipio).map(
                      (num) => (
                        <button
                          key={num}
                          className={`catalogo-page-num ${num === paginaMunicipio ? "active" : ""}`}
                          onClick={() => handleCambiarPaginaMunicipio(num)}
                        >
                          {num}
                        </button>
                      ),
                    )}
                  </div>

                  <button
                    className="catalogo-page-btn"
                    onClick={() =>
                      handleCambiarPaginaMunicipio(paginaMunicipio + 1)
                    }
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
        <PatrimonioDetailEntry
          item={patrimonio}
          municipioNombre={nombreMunicipio}
        />
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
