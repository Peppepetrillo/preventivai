/**
 * Proiezione Distinta Materiali → materiali Cantiere (Sprint 13 Step 6).
 *
 * La Distinta resta autonoma. Il cantiere riceve uno snapshot soft-linked.
 * Nessuna ownership circolare: distinta.collegamenti.cantiereId +
 * materiale.distintaVoceId / distintaId.
 */

function creaMaterialeDaVoceDistinta(voce, distintaId) {
  const materiale = {
    id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: String(voce.nome || "").trim(),
    quantita: Number(voce.quantita) || 0,
    unita: String(voce.unita || "pz").trim() || "pz",
    distintaId: String(distintaId),
    distintaVoceId: String(voce.id),
    origine: "distinta",
    distintaOrfana: false,
  };

  if (voce.famigliaId) materiale.famigliaId = String(voce.famigliaId);
  if (voce.varianteId) materiale.varianteId = String(voce.varianteId);
  if (voce.note) materiale.note = String(voce.note).trim();
  if (voce.parentVoceId) materiale.parentVoceId = String(voce.parentVoceId);
  if (voce.origineAccessorio) {
    materiale.origineAccessorio = String(voce.origineAccessorio);
  }
  if (
    voce.prezzoUnitario != null &&
    Number.isFinite(Number(voce.prezzoUnitario))
  ) {
    materiale.prezzoUnitario = Number(voce.prezzoUnitario);
  }

  return materiale;
}

/**
 * @param {object[]} materialiEsistenti
 * @param {import("./distintaMaterialiTypes").DistintaMateriali} distinta
 * @returns {object[]}
 */
export function proiettaVociDistintaSuMaterialiCantiere(
  materialiEsistenti = [],
  distinta
) {
  if (!distinta || !distinta.id) {
    return Array.isArray(materialiEsistenti) ? [...materialiEsistenti] : [];
  }

  const materiali = Array.isArray(materialiEsistenti)
    ? materialiEsistenti.map((m) => ({ ...m }))
    : [];
  const voci = Array.isArray(distinta.voci) ? distinta.voci : [];
  const voceIdsAttive = new Set(
    voci.map((v) => String(v.id)).filter(Boolean)
  );

  for (const voce of voci) {
    if (!voce?.id || !voce?.nome) continue;

    const idx = materiali.findIndex(
      (m) =>
        m.distintaVoceId &&
        String(m.distintaVoceId) === String(voce.id) &&
        String(m.distintaId || distinta.id) === String(distinta.id)
    );

    const snapshot = {
      nome: String(voce.nome).trim(),
      quantita: Number(voce.quantita) || 0,
      unita: String(voce.unita || "pz").trim() || "pz",
      note: voce.note ? String(voce.note).trim() : undefined,
      famigliaId: voce.famigliaId ? String(voce.famigliaId) : undefined,
      varianteId: voce.varianteId ? String(voce.varianteId) : undefined,
      parentVoceId: voce.parentVoceId ? String(voce.parentVoceId) : undefined,
      origineAccessorio: voce.origineAccessorio
        ? String(voce.origineAccessorio)
        : undefined,
      distintaId: String(distinta.id),
      distintaVoceId: String(voce.id),
      origine: "distinta",
      distintaOrfana: false,
    };

    if (idx >= 0) {
      const esistente = materiali[idx];
      // Non sovrascrivere modifiche manuali sul cantiere.
      if (esistente.modificatoManualmente) {
        materiali[idx] = {
          ...esistente,
          distintaId: snapshot.distintaId,
          distintaVoceId: snapshot.distintaVoceId,
          origine: esistente.origine || "distinta",
          distintaOrfana: false,
        };
        continue;
      }

      materiali[idx] = {
        ...esistente,
        ...snapshot,
        id: esistente.id,
        acquistato: esistente.acquistato,
      };
      continue;
    }

    materiali.push(creaMaterialeDaVoceDistinta(voce, distinta.id));
  }

  // Voce rimossa dalla distinta: soft orphan, mai cancellazione automatica.
  for (let i = 0; i < materiali.length; i += 1) {
    const m = materiali[i];
    if (
      m.distintaId &&
      String(m.distintaId) === String(distinta.id) &&
      m.distintaVoceId &&
      !voceIdsAttive.has(String(m.distintaVoceId))
    ) {
      materiali[i] = { ...m, distintaOrfana: true };
    }
  }

  return materiali;
}

/**
 * @param {object} materialeCantiere
 * @param {object} patch
 */
export function applicaModificaManualeMateriale(materialeCantiere, patch = {}) {
  if (!materialeCantiere) return null;
  return {
    ...materialeCantiere,
    ...patch,
    modificatoManualmente: true,
  };
}
