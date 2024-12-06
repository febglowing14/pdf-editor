"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Button, Input, Typography } from "@mui/material";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import * as fabric from "fabric";
import "@react-pdf-viewer/core/lib/styles/index.css";

export default function Home() {
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const pdfWrapperRef = useRef<HTMLDivElement | null>(null);

  // Handle file upload
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () => {
        setPdfDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize Fabric.js canvas
  const initializeFabricCanvas = () => {
    const pdfWrapper = pdfWrapperRef.current;
    if (pdfWrapper) {
      // Remove existing Fabric.js canvas if present
      const existingCanvas = pdfWrapper.querySelector<HTMLCanvasElement>(
        "#pdf-fabric-canvas"
      );
      if (existingCanvas) {
        existingCanvas.remove();
      }

      // Create a new canvas
      const canvasElement = document.createElement("canvas");
      canvasElement.id = "pdf-fabric-canvas";
      canvasElement.style.position = "absolute";
      canvasElement.style.top = "0";
      canvasElement.style.left = "0";
      canvasElement.style.zIndex = "10"; // Ensure it is above the PDF viewer
      canvasElement.width = pdfWrapper.offsetWidth;
      canvasElement.height = pdfWrapper.offsetHeight;

      pdfWrapper.appendChild(canvasElement);

      // Initialize Fabric.js
      const fabricCanvas = new fabric.Canvas(canvasElement, {
        selection: true,
      });
      fabricCanvasRef.current = fabricCanvas;

      console.log("Fabric.js canvas initialized.");
    }
  };

  // Synchronize Fabric.js canvas size with the PDF viewer
  const resizeCanvas = () => {
    const pdfWrapper = pdfWrapperRef.current;
    if (pdfWrapper && fabricCanvasRef.current) {
      const canvasElement = pdfWrapper.querySelector<HTMLCanvasElement>(
        "#pdf-fabric-canvas"
      );
      if (canvasElement) {
        canvasElement.width = pdfWrapper.offsetWidth;
        canvasElement.height = pdfWrapper.offsetHeight;
        fabricCanvasRef.current.setWidth(pdfWrapper.offsetWidth);
        fabricCanvasRef.current.setHeight(pdfWrapper.offsetHeight);
      }
    }
  };

  // Add blur rectangle
  const blurText = () => {
    console.log("clicked blurtext");
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: "rgba(0, 0, 0, 0.5)", // Semi-transparent black for blur
        width: 150,
        height: 50,
        selectable: true,
      });
      fabricCanvas.add(rect);
      fabricCanvas.renderAll(); // Ensure the rectangle is rendered
      console.log("Blur rectangle added:", rect);
    }
  };

  // Add sample text
  const addText = () => {
    console.log("clicked addtext");
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      const text = new fabric.Textbox("Sample Text", {
        left: 150,
        top: 200,
        fontSize: 20,
        fill: "blue",
        width: 200,
      });
      fabricCanvas.add(text);
      console.log("Text added:", text);
    }
  };

  // Clean up the canvas when unmounting
  useEffect(() => {
    if (pdfDataUrl) {
      initializeFabricCanvas();
      window.addEventListener("resize", resizeCanvas);
    }
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [pdfDataUrl]);

  return (
    <Box p={5} position="relative">
      <Typography variant="h4">PDF Editor</Typography>
      <Input
        type="file"
        inputProps={{ accept: "application/pdf" }}
        onChange={onFileChange}
        sx={{ my: 3 }}
      />
      <Box
        ref={pdfWrapperRef}
        style={{
          position: "relative", // This is crucial
          width: "100%",
          height: "600px",
          overflow: "hidden",
          border: "1px solid #ccc",
        }}
      >
        {pdfDataUrl && (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.min.js">
            <div style={{ width: "100%", height: "100%" }}>
              <Viewer fileUrl={pdfDataUrl} />
            </div>
          </Worker>
        )}
      </Box>
      <Box mt={2}>
        <Button variant="contained" color="primary" onClick={blurText} sx={{ m: 1 }}>
          Blur Text
        </Button>
        <Button variant="contained" color="success" onClick={addText} sx={{ m: 1 }}>
          Add Text
        </Button>
      </Box>
    </Box>
  );
}
