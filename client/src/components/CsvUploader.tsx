/**
 * Design: Trading Terminal - Dark fintech UI
 * File upload zone supporting CSV, Excel (.xlsx/.xls/.xml), and HTML (.htm/.html)
 * with glowing border, drag-drop support, and sample data button
 */
import { useCallback, useState, useRef, useEffect } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { generateSampleCSV } from "@/lib/sampleData";
import { isExcelFile, excelToCSV, isSupportedFile } from "@/lib/excelParser";
import { isHtmlFile, htmlToCSV } from "@/lib/htmlParser";

export default function CsvUploader() {
  const { analyzeCSV, state } = useAnalysis();
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset isReading when analysis completes or errors
  useEffect(() => {
    if (state === "done" || state === "error" || state === "idle") {
      setIsReading(false);
    }
  }, [state]);

  const handleFile = useCallback(
    (file: File) => {
      setFileError("");
      if (!isSupportedFile(file.name)) {
        setFileError(t("upload.unsupported"));
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setFileError(t("upload.tooLarge"));
        return;
      }
      setSelectedFile(file);
    },
    [t]
  );

  const isDisabled = isReading || state === "loading";

  const handleAnalyze = useCallback(() => {
    if (!selectedFile || isDisabled) return;
    setIsReading(true);

    if (isExcelFile(selectedFile.name)) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const csvText = excelToCSV(buffer);
          analyzeCSV(csvText, selectedFile.name);
        } catch (err) {
          setFileError(
            err instanceof Error
              ? err.message
              : t("upload.excelReadError")
          );
          setIsReading(false);
        }
      };
      reader.onerror = () => {
        setFileError(t("upload.fileReadError"));
        setIsReading(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    } else if (isHtmlFile(selectedFile.name)) {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const csvText = await htmlToCSV(buffer);
          analyzeCSV(csvText, selectedFile.name);
        } catch (err) {
          setFileError(
            err instanceof Error
              ? err.message
              : t("upload.htmlReadError")
          );
          setIsReading(false);
        }
      };
      reader.onerror = () => {
        setFileError(t("upload.fileReadError"));
        setIsReading(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const text = e.target?.result as string;
          analyzeCSV(text, selectedFile.name);
        } catch (err) {
          setFileError(
            err instanceof Error
              ? err.message
              : t("upload.csvReadError")
          );
          setIsReading(false);
        }
      };
      reader.onerror = () => {
        setFileError(t("upload.fileReadError"));
        setIsReading(false);
      };
      reader.readAsText(selectedFile);
    }
  }, [selectedFile, analyzeCSV, isDisabled, t]);

  const handleSampleData = useCallback(() => {
    const csv = generateSampleCSV();
    analyzeCSV(csv, "sample_data.csv");
  }, [analyzeCSV]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /** Get the appropriate icon for the selected file type */
  const getFileIcon = () => {
    if (!selectedFile)
      return <FileText className="w-5 h-5 text-[oklch(0.65_0.18_250)]" />;
    const lower = selectedFile.name.toLowerCase();
    if (
      lower.endsWith(".xlsx") ||
      lower.endsWith(".xls") ||
      lower.endsWith(".xml")
    ) {
      return (
        <FileSpreadsheet className="w-5 h-5 text-[oklch(0.72_0.19_145)]" />
      );
    }
    if (lower.endsWith(".htm") || lower.endsWith(".html")) {
      return <FileText className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />;
    }
    return <FileText className="w-5 h-5 text-[oklch(0.65_0.18_250)]" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            relative rounded-lg border-2 border-dashed p-10 text-center cursor-pointer
            transition-all duration-300 group
            ${isDragging
              ? "border-[oklch(0.82_0.18_165)] bg-[oklch(0.82_0.18_165_/_0.08)]"
              : "border-[oklch(0.3_0.02_260)] hover:border-[oklch(0.65_0.18_250_/_0.5)] bg-[oklch(0.14_0.02_260)]"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.xml,.htm,.html"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`
              w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
              ${isDragging
                  ? "bg-[oklch(0.82_0.18_165_/_0.2)]"
                  : "bg-[oklch(0.2_0.02_260)] group-hover:bg-[oklch(0.65_0.18_250_/_0.15)]"
                }
            `}
            >
              <Upload
                className={`w-7 h-7 transition-colors duration-300 ${isDragging ? "text-[oklch(0.82_0.18_165)]" : "text-muted-foreground group-hover:text-[oklch(0.65_0.18_250)]"}`}
              />
            </div>

            <div>
              <p className="text-foreground font-medium text-lg">
                {t("upload.dropzone")}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("upload.click")}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span>{t("upload.format")}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <span>{t("upload.maxSize")}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button
            id="btn-sample-data"
            variant="outline"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              handleSampleData();
            }}
            disabled={state === "loading"}
            className="text-xs gap-2 border-[oklch(0.3_0.02_260)] hover:border-[oklch(0.65_0.18_250_/_0.5)] hover:bg-[oklch(0.65_0.18_250_/_0.08)] text-muted-foreground hover:text-foreground transition-all"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            {t("upload.sample")}
          </Button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {fileError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-4 py-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {fileError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected File */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 flex items-center justify-between bg-card border border-border rounded-lg px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[oklch(0.65_0.18_250_/_0.15)] flex items-center justify-center">
                  {getFileIcon()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <Button
                onClick={e => {
                  e.stopPropagation();
                  handleAnalyze();
                }}
                disabled={isDisabled}
                className="bg-[oklch(0.82_0.18_165)] hover:bg-[oklch(0.75_0.18_165)] text-[oklch(0.13_0.02_260)] font-semibold px-6"
              >
                {isDisabled ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("upload.analyzing")}
                  </span>
                ) : (
                  t("upload.analyze")
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
