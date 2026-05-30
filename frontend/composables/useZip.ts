import JSZip from 'jszip';

export function useZip() {
  const zip = new JSZip();

  function addFile(name: string, data: Blob | string | ArrayBuffer) {
    zip.file(name, data);
  }

  async function download(filename = 'archive.zip') {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { zip, addFile, download };
}
