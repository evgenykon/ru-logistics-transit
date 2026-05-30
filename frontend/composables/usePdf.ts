import { jsPDF } from 'jspdf';

export function usePdf() {
  function generate(filename: string, content: string | (() => void)) {
    const doc = new jsPDF();

    if (typeof content === 'function') {
      content();
    } else {
      doc.text(content, 10, 10);
    }

    doc.save(filename);
  }

  function fromHtml(element: HTMLElement, filename: string) {
    const doc = new jsPDF();
    doc.html(element, {
      callback: (d) => d.save(filename),
    });
  }

  return { generate, fromHtml };
}
