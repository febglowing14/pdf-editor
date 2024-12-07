"use client";

import { useState, useRef, useEffect } from "react";
import { Box, Button, Input, Typography } from "@mui/material";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { PDFDocument } from "pdf-lib";
import * as fabric from "fabric";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";

export default function Home() {
    const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const pdfWrapperRef = useRef<HTMLDivElement | null>(null);

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = () => {
                console.log("PDF Data URL set:", reader.result);
                setPdfDataUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            console.error("Invalid file type. Please upload a PDF.");
        }
    };

    const initializeFabricCanvas = () => {
        const pdfWrapper = pdfWrapperRef.current;
        if (pdfWrapper) {
            const existingCanvas = pdfWrapper.querySelector<HTMLCanvasElement>(
                "#pdf-fabric-canvas"
            );
            if (existingCanvas) existingCanvas.remove();

            const canvasElement = document.createElement("canvas");
            canvasElement.id = "pdf-fabric-canvas";
            canvasElement.style.position = "absolute";
            canvasElement.style.top = "0";
            canvasElement.style.left = "0";
            canvasElement.style.zIndex = "10";
            canvasElement.width = pdfWrapper.offsetWidth;
            canvasElement.height = pdfWrapper.offsetHeight;

            pdfWrapper.appendChild(canvasElement);

            const fabricCanvas = new fabric.Canvas(canvasElement, {
                selection: true,
            });
            fabricCanvasRef.current = fabricCanvas;

            console.log("Fabric.js canvas initialized:", fabricCanvas);
        } else {
            console.error("PDF wrapper not found.");
        }
    };

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

    const blurText = () => {
        const fabricCanvas = fabricCanvasRef.current;
        if (fabricCanvas) {
            const rect = new fabric.Rect({
                left: 100,
                top: 100,
                fill: "rgba(0, 0, 0, 0.5)",
                width: 150,
                height: 50,
                selectable: true,
            });
            fabricCanvas.add(rect);
            fabricCanvas.renderAll();
            console.log("Blur rectangle added.");
        }
    };

    const addText = () => {
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
            console.log("Text added.");
        }
    };

    const savePdf = async () => {
        if (!pdfDataUrl) {
            console.error("No PDF data URL available.");
            return;
        }
        if (!fabricCanvasRef.current) {
            console.error("No Fabric.js canvas found.");
            return;
        }

        try {
            const existingPdfBytes = await fetch(pdfDataUrl).then((res) =>
                res.arrayBuffer()
            );
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const pages = pdfDoc.getPages();

            if (currentPage < 0 || currentPage >= pages.length) {
                console.error("Invalid current page index:", currentPage);
                return;
            }

            const targetPage = pages[currentPage];
            const fabricCanvas = fabricCanvasRef.current;

            fabricCanvas.renderAll();
            const canvasDataUrl = fabricCanvas.toDataURL({
                format: "png",
                multiplier: 1,
            });

            console.log("Canvas Data URL for PDF embedding:", canvasDataUrl);

            const pngImage = await pdfDoc.embedPng(canvasDataUrl);
            const { width, height } = targetPage.getSize();

            targetPage.drawImage(pngImage, {
                x: 0,
                y: 0,
                width,
                height,
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "modified.pdf";
            link.click();

            console.log("PDF saved successfully.");
        } catch (error) {
            console.error("Error saving PDF:", error);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage((prev) => prev + 1);
            pageNavigationPluginInstance.jumpToPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage((prev) => prev - 1);
            pageNavigationPluginInstance.jumpToPage(currentPage - 1);
        }
    };

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
                    position: "relative",
                    width: "100%",
                    height: "600px",
                    overflow: "hidden",
                    border: "1px solid #ccc",
                }}
            >
                {pdfDataUrl && (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.0.279/build/pdf.worker.min.js">
                        <div style={{ width: "100%", height: "100%" }}>
                            <Viewer
                                fileUrl={pdfDataUrl}
                                plugins={[pageNavigationPluginInstance]}
                                onDocumentLoad={(e) => setTotalPages(e.doc.numPages)}
                                onPageChange={(e) => setCurrentPage(e.currentPage)}
                            />
                        </div>
                    </Worker>
                )}
            </Box>
            <Box mt={2}>
                <Button
                    variant="contained"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                    sx={{ m: 1 }}
                >
                    Previous Page
                </Button>
                <Button
                    variant="contained"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages - 1}
                    sx={{ m: 1 }}
                >
                    Next Page
                </Button>
                <Button variant="contained" color="primary" onClick={blurText} sx={{ m: 1 }}>
                    Blur Text
                </Button>
                <Button variant="contained" color="success" onClick={addText} sx={{ m: 1 }}>
                    Add Text
                </Button>
                <Button variant="contained" color="secondary" onClick={savePdf} sx={{ m: 1 }}>
                    Save PDF
                </Button>
            </Box>
        </Box>
    );
}
