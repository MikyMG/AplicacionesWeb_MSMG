// Utilities to export data (JSON/XML/PDF) from containers
export function downloadFile(content, filename, type = 'application/octet-stream') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toXML(obj, tagName = 'item') {
  let xml = `<${tagName}>`;
  Object.keys(obj).forEach(k => {
    const v = obj[k] == null ? '' : String(obj[k]).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    xml += `<${k}>${v}</${k}>`;
  });
  xml += `</${tagName}>`;
  return xml;
}

export function exportJSON(item, filename) {
  downloadFile(JSON.stringify(item, null, 2), filename || `item.json`, 'application/json');
}

export function exportAllJSON(list, filename = 'items.json') {
  downloadFile(JSON.stringify(list || [], null, 2), filename, 'application/json');
}

export function exportXML(item, tagName = 'item', filename) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` + toXML(item, tagName);
  downloadFile(xml, filename || `${tagName}.xml`, 'application/xml');
}

export function exportAllXML(list, tagName = 'item', filename = null) {
  const items = (list || []).map(i => toXML(i, tagName)).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${tagName}s>\n${items}\n</${tagName}s>`;
  downloadFile(xml, filename || `${tagName}s.xml`, 'application/xml');
}

export function ensureJsPDF() {
  return new Promise((resolve) => {
    const existing = window.jspdf || window.jspdf?.jsPDF || window.jspdf?.default;
    if (existing) { const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null; resolve(jsPDF); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => { const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null; resolve(jsPDF); };
    document.body.appendChild(script);
  });
}

export async function getDataUrlFromUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

export default {
  downloadFile,
  toXML,
  exportJSON,
  exportAllJSON,
  exportXML,
  exportAllXML,
  ensureJsPDF,
  getDataUrlFromUrl,
};