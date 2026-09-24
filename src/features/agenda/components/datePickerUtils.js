export function aggiungiGiorniDate(data, giorni) {
  const d = new Date(data);
  d.setDate(d.getDate() + giorni);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dataItToIso(dataIt = "") {
  const m = String(dataIt).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
}

export function isoToDataIt(iso = "") {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
}
