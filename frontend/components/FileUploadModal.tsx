"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: string[][]) => void;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
}: FileUploadModalProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = useCallback(
    (text: string) => {
      const rows = text
        .trim()
        .split("\n")
        .map((row) => row.split(",").map((cell) => cell.trim()));
      setPreview(rows);
      return rows;
    },
    []
  );

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(f);
    },
    [parseCSV]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith(".csv")) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleSubmit = () => {
    if (preview) {
      onUpload(preview);
      onClose();
      setFile(null);
      setPreview(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">{t("upload.title")}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drop zone */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors ${
              isDragging
                ? "border-teal bg-teal/5"
                : "border-gray-200 hover:border-teal/50 hover:bg-gray-50"
            }`}
          >
            <Upload
              className={`h-10 w-10 ${isDragging ? "text-teal" : "text-gray-300"}`}
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium text-gray-500">
              {t("upload.dragDrop")}
            </p>
            <p className="text-xs text-gray-400">{t("upload.orClick")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        ) : (
          <>
            {/* File info */}
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-teal/5 px-4 py-3">
              <FileText className="h-5 w-5 text-teal" strokeWidth={1.5} />
              <span className="text-sm font-medium text-navy">{file.name}</span>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600"
              >
                {t("upload.remove")}
              </button>
            </div>

            {/* Preview table */}
            {preview && (
              <div className="mb-4 max-h-48 overflow-auto rounded-lg border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {preview[0]?.map((header, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left font-medium text-gray-500"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1, 6).map((row, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-gray-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
            >
              {t("upload.submit")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
