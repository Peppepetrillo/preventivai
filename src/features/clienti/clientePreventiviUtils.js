function stessoId(a, b) {
  return a != null && a !== "" && b != null && b !== "" && String(a) === String(b);
}

/**
 * Preventivi collegati a un cliente (UX-12).
 * - Con `clienteId` sul preventivo: match esclusivamente per ID.
 * - Senza `clienteId`: fallback legacy per nome esatto.
 *
 * @param {{ clienteId?: string|number, nome?: string }} cliente
 * @param {object[]} preventivi
 * @returns {object[]}
 */
export function preventiviPerCliente({ clienteId, nome }, preventivi) {
  const elenco = Array.isArray(preventivi) ? preventivi : [];
  const nomeCliente = String(nome || "").trim();
  const idCliente =
    clienteId != null && clienteId !== "" ? String(clienteId) : null;

  return elenco.filter((preventivo) => {
    const idPreventivo = preventivo?.clienteId;

    if (idPreventivo != null && idPreventivo !== "") {
      return idCliente != null && String(idPreventivo) === idCliente;
    }

    return nomeCliente !== "" && String(preventivo?.cliente || "").trim() === nomeCliente;
  });
}

/**
 * Cantieri collegati a un cliente (denormalizzazione + legacy).
 * Stesse regole di `preventiviPerCliente`.
 *
 * @param {{ clienteId?: string|number, nome?: string }} cliente
 * @param {object[]} cantieri
 * @returns {object[]}
 */
export function cantieriPerCliente({ clienteId, nome }, cantieri) {
  const elenco = Array.isArray(cantieri) ? cantieri : [];
  const nomeCliente = String(nome || "").trim();
  const idCliente =
    clienteId != null && clienteId !== "" ? String(clienteId) : null;

  return elenco.filter((cantiere) => {
    const idCantiere = cantiere?.clienteId;

    if (idCantiere != null && idCantiere !== "") {
      return idCliente != null && String(idCantiere) === idCliente;
    }

    return nomeCliente !== "" && String(cantiere?.cliente || "").trim() === nomeCliente;
  });
}

export { stessoId };
