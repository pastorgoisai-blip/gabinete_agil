export const printHtml = (content: string, styles: string = '') => {
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

    // Base styles for A4 printing + User custom styles
    const baseStyles = `
    @page {
      size: A4;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Times New Roman', serif; /* Default to official font */
      -webkit-print-color-adjust: exact;
      background-color: white;
    }
    .a4-page {
      width: 210mm;
      min-height: 297mm;
      padding: 3cm 1.5cm 2cm 3cm; /* Margens Oficiais */
      margin: 0 auto;
      background: white;
      position: relative;
    }
    /* Page Break Logic */
    .page-break {
        break-after: page;
        height: 0;
        margin: 0;
        border: none;
    }
    /* Signature Protection */
    .signature-block {
        page-break-inside: avoid;
        break-inside: avoid;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    /* Print Utility Classes */
    @media print {
       body {
         -webkit-print-color-adjust: exact;
       }
       .page-break {
          break-after: page;
       }
    }
    ${styles}
  `;

    // Write content
    doc.open();
    doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Imprimir Documento</title>
        <style>${baseStyles}</style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = () => {
             // Delay to ensure images/fonts load
             setTimeout(() => {
               window.print();
               // Optional: remove iframe after print dialog closes (approx)
               // setTimeout(() => { document.body.removeChild(window.frameElement); }, 1000);
             }, 500);
          };
        </script>
      </body>
    </html>
  `);
    doc.close();
};
