"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Download,
  RefreshCw,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  Palette,
  Sun,
  Contrast,
  Droplet,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { formatBytes } from "@/hooks/useInputSize";
import styles from "./page.module.css";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const HEAVY_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface Filter {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const FILTERS: Filter[] = [
  { id: "none", name: "Original", icon: <ImageIcon size={16} /> },
  { id: "grayscale", name: "Grayscale", icon: <Contrast size={16} /> },
  { id: "sepia", name: "Sepia", icon: <Palette size={16} /> },
  { id: "invert", name: "Invert", icon: <RefreshCw size={16} /> },
  { id: "brighten", name: "Brighten", icon: <Sun size={16} /> },
  { id: "saturate", name: "Saturate", icon: <Droplet size={16} /> },
  { id: "blur", name: "Blur", icon: <Sparkles size={16} /> },
];

function SizeWarning({
  fileSize,
  processing,
}: {
  fileSize: number;
  processing: boolean;
}) {
  if (!fileSize) return null;

  const isHeavy = fileSize > HEAVY_FILE_SIZE;
  const isOverLimit = fileSize > MAX_FILE_SIZE;

  if (isOverLimit) {
    return (
      <div
        className={styles.warningBanner}
        style={{
          background: "var(--error-bg)",
          borderColor: "var(--error-color)",
          color: "var(--error-color)",
        }}
      >
        <AlertTriangle size={16} />
        <span>
          File too large ({formatBytes(fileSize)}). Maximum size is{" "}
          {formatBytes(MAX_FILE_SIZE)}.
        </span>
      </div>
    );
  }

  if (isHeavy) {
    return (
      <div
        className={styles.warningBanner}
        style={{
          background: "rgba(255, 165, 0, 0.15)",
          borderColor: "orange",
          color: "orange",
        }}
      >
        <AlertTriangle size={16} />
        <span>
          Large file ({formatBytes(fileSize)}). Using WebAssembly acceleration.
        </span>
        {processing && (
          <span className={styles.processing}>
            <Loader2 size={14} className="animate-spin" /> Processing...
          </span>
        )}
      </div>
    );
  }

  return null;
}

export default function ImageTool() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filteredPreview, setFilteredPreview] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [quality, setQuality] = useState(0.9);
  const [format, setFormat] = useState("image/jpeg");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [photon, setPhoton] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState("none");
  const [filterIntensity, setFilterIntensity] = useState(50);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Lazy load Photon Wasm
  /* v8 ignore next 3 */
  useEffect(() => {
    const loadPhoton = async () => {
      try {
        const photonModule = await import("photon-web");
        await photonModule.default();
        setPhoton(photonModule);
      } catch (e) {
        console.error("Failed to load Photon Wasm:", e);
      }
    };
    loadPhoton();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        showToast("File too large. Maximum size is 20MB.", "error");
        return;
      }

      setFileSize(file.size);
      setActiveFilter("none");

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setWidth(img.width);
        setHeight(img.height);
        setAspectRatio(img.width / img.height);
        setPreview(url);
        setFilteredPreview(null);
        showToast("Image loaded successfully", "success");
      };
      img.onerror = () => {
        showToast("Failed to load image", "error");
        setFileSize(0);
      };
      img.src = url;
    },
    [showToast],
  );

  const handleWidthChange = useCallback(
    (val: number) => {
      setWidth(val);
      if (lockAspectRatio && aspectRatio) {
        setHeight(Math.round(val / aspectRatio));
      }
    },
    [lockAspectRatio, aspectRatio],
  );

  const handleHeightChange = useCallback(
    (val: number) => {
      setHeight(val);
      if (lockAspectRatio && aspectRatio) {
        setWidth(Math.round(val * aspectRatio));
      }
    },
    [lockAspectRatio, aspectRatio],
  );

  const applyFilter = useCallback(
    async (filterId: string) => {
      if (!image || !photon || !canvasRef.current) return;

      setIsProcessing(true);
      setActiveFilter(filterId);

      try {
        const canvas = canvasRef.current;
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(image, 0, 0);

        if (filterId === "none") {
          setFilteredPreview(null);
          setIsProcessing(false);
          return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const photonImage = photon.PhotonImage.new_from_raw_pixels(
          new Uint8Array(imageData.data),
          canvas.width,
          canvas.height,
        );

        const intensity = filterIntensity / 100;

        switch (filterId) {
          case "grayscale":
            photon.grayscale(photonImage);
            break;
          case "sepia":
            photon.sepia(photonImage);
            break;
          case "invert":
            photon.invert(photonImage);
            break;
          case "brighten":
            photon.inc_brightness(photonImage, Math.floor(intensity * 50));
            break;
          case "saturate":
            photon.saturate(photonImage, intensity * 0.5);
            break;
          case "blur":
            photon.box_blur(photonImage);
            break;
        }

        const newData = photonImage.get_raw_pixels();
        const newImageData = new ImageData(
          new Uint8ClampedArray(newData),
          canvas.width,
          canvas.height,
        );
        ctx.putImageData(newImageData, 0, 0);

        setFilteredPreview(canvas.toDataURL(format, quality));
        showToast(`Applied ${filterId} filter`, "success");
      } catch (e: any) {
        console.error("Filter error:", e);
        showToast("Failed to apply filter", "error");
      } finally {
        setIsProcessing(false);
      }
    },
    [image, photon, filterIntensity, format, quality, showToast],
  );

  const processImage = useCallback(() => {
    if (!image && !filteredPreview) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setIsProcessing(false);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        if (filteredPreview) {
          const filteredImg = new Image();
          filteredImg.onload = () => {
            ctx.drawImage(filteredImg, 0, 0, width, height);
            downloadCanvas();
          };
          filteredImg.src = filteredPreview;
          return;
        } else if (image) {
          ctx.drawImage(image, 0, 0, width, height);
          downloadCanvas();
        }
      }
    } catch (error) {
      console.error("Image processing error:", error);
      showToast("Failed to process image", "error");
      setIsProcessing(false);
    }
  }, [image, filteredPreview, width, height, format, quality, showToast]);

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL(format, quality);
    const link = document.createElement("a");
    link.download = `processed.${format.split("/")[1]}`;
    link.href = dataUrl;
    link.click();
    showToast("Image processed and downloaded!", "success");
    setIsProcessing(false);
  };

  const resetImage = useCallback(() => {
    setImage(null);
    setPreview(null);
    setFilteredPreview(null);
    setFileSize(0);
    setWidth(0);
    setHeight(0);
    setAspectRatio(0);
    setActiveFilter("none");
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Image Editor
          <span className={styles.wasmBadge}>Wasm</span>
        </h1>
        {image && (
          <button onClick={resetImage} className={styles.button}>
            <RotateCcw size={16} /> Reset
          </button>
        )}
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
        disabled={isProcessing}
      />

      <SizeWarning fileSize={fileSize} processing={isProcessing} />

      <div className={styles.grid}>
        <div className={styles.controls}>
          <div
            className={styles.uploadBox}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} />
            <span>Upload Image</span>
            {fileSize > 0 && (
              <span className={styles.fileSize}>{formatBytes(fileSize)}</span>
            )}
          </div>

          {image && (
            <>
              <div className={styles.filterSection}>
                <h3 className={styles.sectionTitle}>
                  <Palette size={16} /> Filters
                </h3>
                <div className={styles.filterGrid}>
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      className={`${styles.filterBtn} ${activeFilter === filter.id ? styles.filterBtnActive : ""}`}
                      onClick={() => applyFilter(filter.id)}
                      disabled={isProcessing || !photon}
                    >
                      {filter.icon}
                      {filter.name}
                    </button>
                  ))}
                </div>
                {(activeFilter === "brighten" ||
                  activeFilter === "saturate") && (
                  <div className={styles.intensitySlider}>
                    <label>Intensity: {filterIntensity}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filterIntensity}
                      onChange={(e) =>
                        setFilterIntensity(Number(e.target.value))
                      }
                    />
                  </div>
                )}
              </div>

              <div className={styles.settings}>
                <h3 className={styles.sectionTitle}>Resize</h3>
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="lockRatio"
                    checked={lockAspectRatio}
                    onChange={(e) => setLockAspectRatio(e.target.checked)}
                    disabled={isProcessing}
                  />
                  <label htmlFor="lockRatio">Lock Aspect Ratio</label>
                </div>
                <div className={styles.inputRow}>
                  <div className={styles.group}>
                    <label>Width</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) =>
                        handleWidthChange(Number(e.target.value))
                      }
                      className={styles.input}
                      disabled={isProcessing}
                    />
                  </div>
                  <div className={styles.group}>
                    <label>Height</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) =>
                        handleHeightChange(Number(e.target.value))
                      }
                      className={styles.input}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                <div className={styles.inputRow}>
                  <div className={styles.group}>
                    <label>Quality</label>
                    <input
                      type="number"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className={styles.input}
                      disabled={isProcessing}
                    />
                  </div>
                  <div className={styles.group}>
                    <label>Format</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className={styles.select}
                      disabled={isProcessing}
                    >
                      <option value="image/jpeg">JPEG</option>
                      <option value="image/png">PNG</option>
                      <option value="image/webp">WEBP</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={processImage}
                className={styles.processBtn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Download size={18} /> Download
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <div className={styles.previewArea}>
          {preview ? (
            <img
              src={filteredPreview || preview}
              alt="Preview"
              className={styles.previewImg}
            />
          ) : (
            <div className={styles.placeholder}>
              <ImageIcon size={48} />
              <p>No image selected</p>
              <p className={styles.hint}>Supports JPG, PNG, WebP up to 20MB</p>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      </div>
    </div>
  );
}
