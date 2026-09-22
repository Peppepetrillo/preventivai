/**
 * Caricamento e render PDF → canvas same-document (pinch controllabile).
 * Nessuna scrittura IndexedDB / Base64: solo lettura del blobUrl già esistente.
 */

import * as pdfjs from "pdfjs-dist";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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
 * Render di tutte le pagine in canvas 2d (devicePixelRatio-aware).
 * @param {import('pdfjs-dist').PDFDocumentProxy} documento
 * @param {HTMLElement} contenitore
 * @param {{ maxPagine?: number }=} opzioni
 * @returns {Promise<{ pagine: number }>}
 */
export async function renderPaginePdfSuContenitore(
  documento,
  contenitore,
  opzioni = {}
) {
  const maxPagine = opzioni.maxPagine ?? 40;
  const totale = Math.min(documento.numPages, maxPagine);
  const dpr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    2
  );
  const larghezzaCss = Math.max(
    280,
    Math.floor(contenitore.clientWidth || 320)
  );

  contenitore.replaceChildren();

  for (let numero = 1; numero <= totale; numero += 1) {
    const pagina = await documento.getPage(numero);
    const viewportBase = pagina.getViewport({ scale: 1 });
    const scala = larghezzaCss / viewportBase.width;
    const viewport = pagina.getViewport({ scale: scala * dpr });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${larghezzaCss}px`;
    canvas.style.height = `${Math.floor(viewportBase.height * scala)}px`;
    canvas.style.display = "block";
    canvas.style.margin = "0 auto 12px";
    canvas.style.background = "#fff";
    canvas.setAttribute("data-pdf-page", String(numero));
    canvas.setAttribute("aria-label", `Pagina ${numero} di ${totale}`);

    const contesto = canvas.getContext("2d", { alpha: false });
    if (!contesto) {
      throw new Error("Canvas 2D non disponibile");
    }

    await pagina.render({ canvasContext: contesto, viewport }).promise;
    contenitore.appendChild(canvas);
  }

  return { pagine: totale };
}
