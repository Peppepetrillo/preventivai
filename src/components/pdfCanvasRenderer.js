/**
 * Caricamento e render PDF → canvas same-document (pinch controllabile).
 * Nessuna scrittura IndexedDB / Base64: solo lettura del blobUrl già esistente.
 *
 * Qualità zoom: il bitmap è reso a fit × DPR × zoomRender.
 * Il pinch CSS resta fluido; a fine gesto si re-renderizza se lo zoom supera
 * la soglia rispetto al bitmap corrente (evita canvas piccolo ingrandito).
 */

import * as pdfjs from "pdfjs-dist";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Cap DPR (iPhone 3×): oltre 3 il costo memoria/CPU sale poco utile. */
export const PDF_DPR_CAP = 3;

/** Lato massimo canvas (memoria WKWebView). */
export const PDF_MAX_CANVAS_EDGE = 4096;

/** Differenza minima di zoom (fit=1) per triggerare un re-render HD. */
export const PDF_ZOOM_RERENDER_THRESHOLD = 0.25;

/**
 * @param {{ devicePixelRatio?: number }|null|undefined} win
 * @returns {number}
 */
export function leggiDevicePixelRatio(win) {
  const grezzo =
    win && typeof win.devicePixelRatio === "number"
      ? win.devicePixelRatio
      : typeof window !== "undefined"
        ? window.devicePixelRatio || 1
        : 1;
  return Math.min(Math.max(Number(grezzo) || 1, 1), PDF_DPR_CAP);
}

/**
 * Calcolo deterministico dimensioni canvas vs CSS (no side-effect).
 * @param {{
 *   larghezzaCss: number,
 *   pageWidth: number,
 *   pageHeight: number,
 *   dpr?: number,
 *   zoomRender?: number,
 *   maxEdge?: number,
 * }} input
 */
export function calcolaDimensioniCanvasPdf(input = {}) {
  const larghezzaCss = Math.max(1, Number(input.larghezzaCss) || 320);
  const pageWidth = Math.max(1, Number(input.pageWidth) || 1);
  const pageHeight = Math.max(1, Number(input.pageHeight) || 1);
  const dpr = Math.min(
    Math.max(Number(input.dpr) || 1, 1),
    PDF_DPR_CAP
  );
  const zoomRender = Math.max(1, Number(input.zoomRender) || 1);
  const maxEdge = Math.max(256, Number(input.maxEdge) || PDF_MAX_CANVAS_EDGE);

  const scalaFit = larghezzaCss / pageWidth;
  let viewportScale = scalaFit * dpr * zoomRender;

  const rawW = pageWidth * viewportScale;
  const rawH = pageHeight * viewportScale;
  const edge = Math.max(rawW, rawH);
  if (edge > maxEdge) {
    viewportScale *= maxEdge / edge;
  }

  const canvasWidth = Math.max(1, Math.floor(pageWidth * viewportScale));
  const canvasHeight = Math.max(1, Math.floor(pageHeight * viewportScale));
  const cssWidth = Math.floor(larghezzaCss);
  const cssHeight = Math.max(1, Math.floor(pageHeight * scalaFit));
  const zoomRenderEffettivo =
    scalaFit * dpr > 0 ? viewportScale / (scalaFit * dpr) : 1;

  return {
    scalaFit,
    viewportScale,
    canvasWidth,
    canvasHeight,
    cssWidth,
    cssHeight,
    dpr,
    zoomRender,
    zoomRenderEffettivo,
  };
}

/**
 * @param {number} zoomAttuale
 * @param {number} zoomRenderizzato
 * @param {number=} soglia
 */
export function deveRirenderizzarePerZoom(
  zoomAttuale,
  zoomRenderizzato,
  soglia = PDF_ZOOM_RERENDER_THRESHOLD
) {
  const a = Math.max(1, Number(zoomAttuale) || 1);
  const b = Math.max(1, Number(zoomRenderizzato) || 1);
  return Math.abs(a - b) >= soglia;
}

/**
 * @param {string} blobUrl
 * @returns {Promise<import('pdfjs-dist').PDFDocumentProxy>}
 */
export async function caricaDocumentoPdf(blobUrl) {
  const risposta = await fetch(blobUrl);
  if (!risposta.ok) {
    throw new Error(`PDF non raggiungibile (${risposta.status})`);
  }
  const data = await risposta.arrayBuffer();
  return pdfjs.getDocument({ data }).promise;
}

/**
 * Render di tutte le pagine in canvas 2d (DPR + zoomRender aware).
 * @param {import('pdfjs-dist').PDFDocumentProxy} documento
 * @param {HTMLElement} contenitore
 * @param {{
 *   maxPagine?: number,
 *   zoomRender?: number,
 *   dpr?: number,
 *   larghezzaCss?: number,
 *   signal?: { aborted?: boolean },
 *   onRenderTask?: (task: { cancel?: () => void }) => void,
 * }=} opzioni
 * @returns {Promise<{ pagine: number, zoomRender: number }>}
 */
export async function renderPaginePdfSuContenitore(
  documento,
  contenitore,
  opzioni = {}
) {
  const maxPagine = opzioni.maxPagine ?? 40;
  const totale = Math.min(documento.numPages, maxPagine);
  const dpr =
    opzioni.dpr != null
      ? Math.min(Math.max(Number(opzioni.dpr) || 1, 1), PDF_DPR_CAP)
      : leggiDevicePixelRatio(
          typeof window !== "undefined" ? window : null
        );
  const zoomRender = Math.max(1, Number(opzioni.zoomRender) || 1);
  const larghezzaCss = Math.max(
    280,
    Math.floor(
      opzioni.larghezzaCss != null
        ? opzioni.larghezzaCss
        : contenitore.clientWidth || 320
    )
  );

  const frammento = document.createDocumentFragment();
  const taskAttivi = [];

  try {
    for (let numero = 1; numero <= totale; numero += 1) {
      if (opzioni.signal?.aborted) {
        throw new DOMException("Render PDF annullato", "AbortError");
      }

      const pagina = await documento.getPage(numero);
      const viewportBase = pagina.getViewport({ scale: 1 });
      const dimensioni = calcolaDimensioniCanvasPdf({
        larghezzaCss,
        pageWidth: viewportBase.width,
        pageHeight: viewportBase.height,
        dpr,
        zoomRender,
      });

      const canvas = document.createElement("canvas");
      canvas.width = dimensioni.canvasWidth;
      canvas.height = dimensioni.canvasHeight;
      canvas.style.width = `${dimensioni.cssWidth}px`;
      canvas.style.height = `${dimensioni.cssHeight}px`;
      canvas.style.display = "block";
      canvas.style.margin = "0 auto 12px";
      canvas.style.background = "#fff";
      canvas.setAttribute("data-pdf-page", String(numero));
      canvas.setAttribute("data-pdf-zoom-render", String(zoomRender));
      canvas.setAttribute(
        "aria-label",
        `Pagina ${numero} di ${totale}`
      );

      const contesto = canvas.getContext("2d", { alpha: false });
      if (!contesto) {
        throw new Error("Canvas 2D non disponibile");
      }

      const viewport = pagina.getViewport({
        scale: dimensioni.viewportScale,
      });
      const task = pagina.render({ canvasContext: contesto, viewport });
      taskAttivi.push(task);
      opzioni.onRenderTask?.(task);
      await task.promise;

      if (opzioni.signal?.aborted) {
        throw new DOMException("Render PDF annullato", "AbortError");
      }

      frammento.appendChild(canvas);
    }

    if (opzioni.signal?.aborted) {
      throw new DOMException("Render PDF annullato", "AbortError");
    }

    contenitore.replaceChildren(frammento);
    return { pagine: totale, zoomRender };
  } catch (err) {
    for (const task of taskAttivi) {
      try {
        task.cancel?.();
      } catch {
        /* ignore */
      }
    }
    throw err;
  }
}
