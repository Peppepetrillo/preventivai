export async function richiediPersistenzaLocale() {
  if (!("storage" in navigator) || !("persist" in navigator.storage)) {
    return false;
  }

  try {
    const giaPersistente = await navigator.storage.persisted();
    return giaPersistente || navigator.storage.persist();
  } catch (errore) {
    console.error("Persistenza locale non disponibile:", errore);
    return false;
  }
}
