export function leggiStorage(chiave, fallback = []) {
    try {
      const dato = localStorage.getItem(chiave);
      return dato ? JSON.parse(dato) : fallback;
    } catch (errore) {
      console.error("Errore localStorage:", errore);
      return fallback;
    }
  }
  
  export function salvaStorage(chiave, valore) {
    try {
      localStorage.setItem(chiave, JSON.stringify(valore));
    } catch (errore) {
      console.error("Errore salvataggio:", errore);
    }
  }