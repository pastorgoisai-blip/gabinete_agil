export const printDocument = (htmlContent: string) => {
    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Basic styles for A4 printing
    const styles = `
    @page {
      size: A4;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      padding: 2.5cm;
      margin: 0 auto;
      background: white;
      position: relative;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td, th {
      border: 1px solid #ddd;
      padding: 8px;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
      }
    }
  `;

    // Write content
    doc.open();
    doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Imprimir Documento</title>
        <style>${styles}</style>
      </head>
      <body>
        ${htmlContent}
        <script>
          window.onload = () => {
             // Delay slightly to ensure images load then print
             setTimeout(() => {
               window.print();
               // Remove iframe after print (in a timeout to allow print dialog)
               /* 
                  Note: In some browsers, removing iframe immediately stops print.
                  Ideally we keep it or listen for afterprint. 
                  For now we leave it or rely on user closing tab if it was a tab, 
                  but since it's an iframe, we just let it sit or remove after long delay.
               */
             }, 500);
          };
        </script>
      </body>
    </html>
  `);
    doc.close();
};
