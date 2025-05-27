"use client";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
export default function ImageToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
    onDrop: (acceptedFiles) => {
      setError(null);
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const convertToPdf = async () => {
    setIsLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const imageBytes = await file.arrayBuffer();
        const image = file.type.includes("jpeg")
          ? await pdfDoc.embedJpg(imageBytes)
          : await pdfDoc.embedPng(imageBytes);

        const page = pdfDoc.addPage([image.width, image.height]);
        const { width, height } = page.getSize();
        const scale = Math.min(width / image.width, height / image.height);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width * scale,
          height: image.height * scale,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `converted-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error(error);
      setError("Conversion failed. Please try again with valid images.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-card rounded-xl max-w-[800px] mx-auto shadow-lg p-6 sm:p-8 w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Free Image to PDF Converter</h1>
        <p>
          Convert multiple images to a single PDF file instantly in your browser
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`mb-8 p-8 border-2 border-dashed rounded-lg 
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
      >
        <input {...getInputProps()} />
        <p>
          {isDragActive
            ? "Drop images here"
            : "Drag & drop images, or click to select"}
        </p>
        <p className="text-sm mt-2">Supports: JPEG, PNG</p>
      </div>

      {files.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Selected Images ({files.length})
            </h2>
            <button
              onClick={() => setFiles([])}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group aspect-square">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full 
                    p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="default"
        onClick={convertToPdf}
        disabled={!files.length || isLoading}
        className="w-full py-6 font-semibold transition-colors"
      >
        {isLoading ? "Creating PDF..." : "Convert Now"}
      </Button>

      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>100% secure - Files never leave your browser</p>
      </div>
    </div>
  );
}
