import { DocumentEditor } from "@onlyoffice/document-editor-react";
import React, { useRef } from "react";

function onDocumentReady(event) {
  console.log("Document is loaded");
}

function onLoadComponentError(errorCode, errorDescription) {
  switch (errorCode) {
    case -1: // Unknown error loading component
      console.log(errorDescription);
      break;

    case -2: // Error load DocsAPI from http://documentserver/
      console.log(errorDescription);
      break;

    case -3: // DocsAPI is not defined
      console.log(errorDescription);
      break;
  }
}

export default function App() {
  return (
    <DocumentEditor
      id="docxEditor"
      documentServerUrl="https://office.gabineteonline.online/"
      config={{
        document: {
          fileType: "docx",
          key: "Khirz6zTPdfd7",
          title: "Example Document Title.docx",
          url: "https://example.com/url-to-example-document.docx",
        },
        documentType: "word",
        editorConfig: {
          callbackUrl: "https://example.com/url-to-callback.ashx",
        },
      }}
      events_onDocumentReady={onDocumentReady}
      onLoadComponentError={onLoadComponentError}
    />
  )
}