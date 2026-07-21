import { STORAGE_FALLBACKS, STORAGE_KEYS } from "../../../app/storageKeys";
import { WIZARD_EXTENSION_SLOTS } from "../wizard/wizardConfig";

function leggiEstensioniRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.wizardExtensions);
    if (!raw) {
      return { ...STORAGE_FALLBACKS[STORAGE_KEYS.wizardExtensions] };
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function salvaEstensioni(estensioni) {
  localStorage.setItem(
    STORAGE_KEYS.wizardExtensions,
    JSON.stringify(estensioni)
  );
}

export function leggiEstensioniWizard() {
  return leggiEstensioniRaw();
}

/** @param {string} nomeCliente */
export function salvaUltimoCliente(nomeCliente) {
  if (!nomeCliente?.trim()) return;

  const estensioni = leggiEstensioniRaw();
  estensioni[WIZARD_EXTENSION_SLOTS.ultimoCliente] = {
    nome: nomeCliente.trim(),
    salvatoIl: Date.now(),
  };
  salvaEstensioni(estensioni);
}

export function leggiUltimoCliente() {
  return leggiEstensioniRaw()[WIZARD_EXTENSION_SLOTS.ultimoCliente] || null;
}

/**
 * Snapshot leggero per futura funzione "Ripeti ultimo preventivo".
 * @param {object} snapshot
 */
export function salvaUltimoPreventivo(snapshot) {
  if (!snapshot) return;

  const estensioni = leggiEstensioniRaw();
  estensioni[WIZARD_EXTENSION_SLOTS.ultimoPreventivo] = {
    ...snapshot,
    salvatoIl: Date.now(),
  };
  salvaEstensioni(estensioni);
}

export function leggiUltimoPreventivo() {
  return leggiEstensioniRaw()[WIZARD_EXTENSION_SLOTS.ultimoPreventivo] || null;
}

/**
 * Prefill generico per estensioni future (es. ripeti ultimo).
 * @param {object|null} prefill
 */
export function salvaPrefillWizard(prefill) {
  const estensioni = leggiEstensioniRaw();

  if (!prefill) {
    delete estensioni[WIZARD_EXTENSION_SLOTS.prefill];
  } else {
    estensioni[WIZARD_EXTENSION_SLOTS.prefill] = prefill;
  }

  salvaEstensioni(estensioni);
}

export function leggiPrefillWizard() {
  return leggiEstensioniRaw()[WIZARD_EXTENSION_SLOTS.prefill] || null;
}

export function clientiRecentiDaEstensioni(limit = 3) {
  const estensioni = leggiEstensioniRaw();
  const recenti = estensioni.clientiRecenti;

  if (!Array.isArray(recenti)) return [];

  return recenti.slice(0, limit);
}

/** @param {string} nomeCliente */
export function registraClienteRecente(nomeCliente, limit = 5) {
  if (!nomeCliente?.trim()) return;

  const estensioni = leggiEstensioniRaw();
  const nome = nomeCliente.trim();
  const precedenti = Array.isArray(estensioni.clientiRecenti)
    ? estensioni.clientiRecenti.filter((item) => item !== nome)
    : [];

  estensioni.clientiRecenti = [nome, ...precedenti].slice(0, limit);
  salvaEstensioni(estensioni);
}
