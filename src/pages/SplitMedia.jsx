import React, { useEffect, useState } from "react";
import Api from "../service/Api";
import { store } from "../store/store";

// Predefined model data
const MODELS = [
  { id: "11", name: "1 × 1", blocksX: 1, blocksY: 1, finalW: 1200, finalH: 1200 },
  // removed 2 × 1 model as requested
  { id: "12", name: "1 × 2", blocksX: 1, blocksY: 2, finalW: 1200, finalH: 2400 },
  { id: "22", name: "2 × 2", blocksX: 2, blocksY: 2, finalW: 2400, finalH: 2400 },
];

const maxImagesForModel = (modelId) => {
  if (modelId === "11") return 1;
  if (modelId === "12") return 2;
  if (modelId === "22") return 4;
  return 4;
};

const SplitScreenApp = () => {
  const HEADER_HEIGHT = 72; // adjust if your app header differs
  const LEFT_MENU_WIDTH = 280; // keep consistent with app
  const [orientation, setOrientation] = useState("landscape");
  const [selectedModel, setSelectedModel] = useState("22");
  const [uploadedImages, setUploadedImages] = useState([]);
  // no default name — show placeholder only
  const [splitName, setSplitName] = useState("");
  const [leftOffset, setLeftOffset] = useState(LEFT_MENU_WIDTH);
  const [availableHeight, setAvailableHeight] = useState(
    Math.max(window.innerHeight - HEADER_HEIGHT, 420)
  );

  useEffect(() => {
    const calcOffset = () => {
      const w = window.innerWidth;
      setLeftOffset(w < 960 ? 0 : LEFT_MENU_WIDTH);
      setAvailableHeight(Math.max(window.innerHeight - HEADER_HEIGHT, 420));
    };
    calcOffset();
    window.addEventListener("resize", calcOffset);
    return () => window.removeEventListener("resize", calcOffset);
  }, []);

  // Trim uploaded images when model changes (enforce allowed count)
  useEffect(() => {
    const allowed = maxImagesForModel(selectedModel);
    setUploadedImages((prev) => (prev.length > allowed ? prev.slice(0, allowed) : prev));
  }, [selectedModel]);

  useEffect(() => {
    initializeBuilder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation, selectedModel, uploadedImages, availableHeight]);

  function initializeBuilder() {
    const model = MODELS.find((m) => m.id === selectedModel);
    if (!model) return;

    const photoDiv = document.getElementById("photo");
    if (!photoDiv) return;

    // clear existing canvases/children before recreating
    photoDiv.innerHTML = "";

    // required for absolute layer canvases
    photoDiv.style.position = "relative";
    photoDiv.style.display = "flex";
    photoDiv.style.justifyContent = "center";
    photoDiv.style.alignItems = "center";

    const bgCanvas = document.createElement("canvas");
    bgCanvas.id = "background";
    // internal pixel size for high quality export
    bgCanvas.width = model.finalW;
    bgCanvas.height = model.finalH;

    // responsive sizing: choose sizing strategy by orientation
    if (orientation === "portrait") {
      bgCanvas.style.width = "auto";
      bgCanvas.style.height = "100%";
      bgCanvas.style.maxHeight = "100%";
      bgCanvas.style.maxWidth = "100%";
    } else {
      bgCanvas.style.maxWidth = "100%";
      bgCanvas.style.width = "100%";
      bgCanvas.style.height = "auto";
      bgCanvas.style.maxHeight = `${availableHeight - 120}px`;
    }
    bgCanvas.style.display = "block";
    bgCanvas.style.borderRadius = "8px";

    photoDiv.appendChild(bgCanvas);

    const ctx = bgCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    // calculate block size using internal pixel dimensions
    const blockW = bgCanvas.width / model.blocksX;
    const blockH = bgCanvas.height / model.blocksY;

    // create layer canvases (internal pixel size = block size)
    for (let y = 0; y < model.blocksY; y++) {
      for (let x = 0; x < model.blocksX; x++) {
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 3;
        ctx.strokeRect(x * blockW, y * blockH, blockW, blockH);

        const id = `layer-${x}-${y}`;
        const layerCanvas = document.createElement("canvas");
        layerCanvas.id = id;

        // internal pixel size matches block
        layerCanvas.width = blockW;
        layerCanvas.height = blockH;

        layerCanvas.style.position = "absolute";
        layerCanvas.style.zIndex = 5;
        layerCanvas.style.cursor = "pointer";
        layerCanvas.style.boxSizing = "border-box";
        layerCanvas.setAttribute("draggable", "true");

        photoDiv.appendChild(layerCanvas);
      }
    }

    // ensure CSS sizes/positions of layer canvases match background rendered size
    function syncLayerCss() {
      const bgRect = bgCanvas.getBoundingClientRect();
      const displayW = bgRect.width;
      const displayH = bgRect.height;

      document.querySelectorAll("canvas[id^='layer-']").forEach((layer) => {
        const parts = layer.id.split("-");
        const lx = parseInt(parts[1], 10);
        const ly = parseInt(parts[2], 10);

        const leftPx = (lx / model.blocksX) * displayW + bgRect.left - photoDiv.getBoundingClientRect().left;
        const topPx = (ly / model.blocksY) * displayH + bgRect.top - photoDiv.getBoundingClientRect().top;
        const wPx = displayW / model.blocksX;
        const hPx = displayH / model.blocksY;

        // apply pixel-perfect CSS size/position so layer always sits exactly over bg
        layer.style.left = `${leftPx}px`;
        layer.style.top = `${topPx}px`;
        layer.style.width = `${wPx}px`;
        layer.style.height = `${hPx}px`;
      });
    }

    // call now and on resize / orientation changes
    syncLayerCss();
    window.requestAnimationFrame(() => syncLayerCss());
    const resizeObserver = new ResizeObserver(syncLayerCss);
    resizeObserver.observe(bgCanvas);
    window.addEventListener("resize", syncLayerCss);

    // store observer so we can disconnect later if needed
    bgCanvas._syncCleanup = () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncLayerCss);
    };

    enableDragToLayer();
    enableImageReposition();
    enableSave(model);
  }

  function enableDragToLayer() {
    const layers = document.querySelectorAll("canvas[id^='layer-']");
    layers.forEach((canvas) => {
      // enable swapping between layers and dropping thumbnails
      canvas.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text", canvas.id);
      });

      canvas.addEventListener("dragover", (e) => {
        e.preventDefault();
        canvas.style.opacity = "0.7";
      });

      canvas.addEventListener("dragleave", () => {
        canvas.style.opacity = "1";
      });

      canvas.addEventListener("drop", (e) => {
        e.preventDefault();
        canvas.style.opacity = "1";
        const id = e.dataTransfer.getData("text");
        const srcEl = document.getElementById(id);
        if (!srcEl) return;

        const ctx = canvas.getContext("2d");

        // If dropped a layer canvas -> swap (keeps images inside grid bounds)
        if (srcEl.tagName === "CANVAS") {
          const srcCanvas = srcEl;
          const tmp1 = document.createElement("canvas");
          tmp1.width = srcCanvas.width;
          tmp1.height = srcCanvas.height;
          tmp1.getContext("2d").drawImage(srcCanvas, 0, 0);

          const tmp2 = document.createElement("canvas");
          tmp2.width = canvas.width;
          tmp2.height = canvas.height;
          tmp2.getContext("2d").drawImage(canvas, 0, 0);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tmp1, 0, 0, canvas.width, canvas.height);

          const srcCtx = srcCanvas.getContext("2d");
          srcCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);
          srcCtx.drawImage(tmp2, 0, 0, srcCanvas.width, srcCanvas.height);
          return;
        }

        // Otherwise assume it's an <img> thumbnail id -> draw image into layer, fit and center
        const img = srcEl;
        if (!img || img.tagName !== "IMG") return;

        const image = new Image();
        image.onload = () => {
          // draw with "cover" behaviour but keep within canvas boundaries
          const cw = canvas.width;
          const ch = canvas.height;
          const iw = image.width;
          const ih = image.height;
          const scale = Math.max(cw / iw, ch / ih); // cover
          const dw = iw * scale;
          const dh = ih * scale;
          const dx = (cw - dw) / 2;
          const dy = (ch - dh) / 2;

          ctx.clearRect(0, 0, cw, ch);
          ctx.drawImage(image, 0, 0, iw, ih, dx, dy, dw, dh);
        };
        image.src = img.src;
      });
    });
  }

  function enableImageReposition() {
    const layers = document.querySelectorAll("canvas[id^='layer-']");
    layers.forEach((canvas) => {
      const ctx = canvas.getContext("2d");
      let dragging = false;
      let lastX = 0;
      let lastY = 0;

      canvas.addEventListener("mousedown", (e) => {
        dragging = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
      });

      canvas.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        const dx = e.offsetX - lastX;
        const dy = e.offsetY - lastY;

        const temp = document.createElement("canvas");
        temp.width = canvas.width;
        temp.height = canvas.height;
        temp.getContext("2d").drawImage(canvas, 0, 0);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(temp, dx, dy);

        lastX = e.offsetX;
        lastY = e.offsetY;
      });

      canvas.addEventListener("mouseup", () => (dragging = false));
      canvas.addEventListener("mouseleave", () => (dragging = false));
    });
  }

  function enableSave(model) {
    const btn = document.getElementById("btn-download");
    if (!btn) return;

    btn.onclick = function () {
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = model.finalW;
      finalCanvas.height = model.finalH;
      const ctx = finalCanvas.getContext("2d");

      const bg = document.getElementById("background");
      if (bg) {
        const bgInternal = document.createElement("canvas");
        bgInternal.width = bg.width;
        bgInternal.height = bg.height;
        bgInternal.getContext("2d").drawImage(bg, 0, 0);
        ctx.drawImage(bgInternal, 0, 0);
      }

      document.querySelectorAll("canvas[id^='layer-']").forEach((layer) => {
        const parts = layer.id.split("-");
        const x = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        const blockW = model.finalW / model.blocksX;
        const blockH = model.finalH / model.blocksY;

        const tmp = document.createElement("canvas");
        tmp.width = layer.width;
        tmp.height = layer.height;
        tmp.getContext("2d").drawImage(layer, 0, 0);

        ctx.drawImage(tmp, x * blockW, y * blockH, blockW, blockH);
      });

      // download locally and upload automatically to media endpoint
      finalCanvas.toBlob((blob) => {
        if (!blob) return;

        // read current input value (avoid stale closure), sanitize and fallback name
        const nameInput = document.getElementById("split-name");
        const rawName = (nameInput?.value || "split-media").trim();
        const safeName = rawName.replace(/[^a-zA-Z0-9_\-]/g, "-") || "split-media";
        const filename = `${safeName}.png`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        // also upload automatically to media endpoint
        try {
          const token = store.getState().root.user?.accesstoken;
          const fd = new FormData();
          // include filename / name for server
          fd.append("Media", blob, filename);
          fd.append("MediaName", filename);

          Api.post("/admin/savemedia", fd, {
            headers: {
              "Content-Type": "multipart/form-data",
              AuthToken: token
            }
          })
            .then((res) => {
              // optional: show toast in UI — here just console
              if (!res.data.Error) {
                console.log("Split-screen uploaded to media successfully");
              } else {
                console.warn("Upload returned error:", res.data.Error);
              }
            })
            .catch((err) => {
              console.error("Automatic upload failed:", err);
            });
        } catch (err) {
          console.error("Upload exception:", err);
        }
      }, "image/png");
    };
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const allowedTotal = maxImagesForModel(selectedModel);
    const already = uploadedImages.length;
    const canAdd = Math.max(0, allowedTotal - already);

    if (canAdd === 0) {
      alert(`This layout allows only ${allowedTotal} image(s). Remove one to add new.`);
      return;
    }

    if (files.length > canAdd) {
      alert(`You can add only ${canAdd} more image(s) for the selected grid.`);
    }

    const filesToAdd = files.slice(0, canAdd);

    filesToAdd.forEach((file) => {
      if (file.type.indexOf("image/") === 0) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const id = Math.random().toString(36).substr(2, 9);
          setUploadedImages((prev) => [...prev, { id, src: event.target.result }]);
        };
        reader.readAsDataURL(file);
      }
    });

    // reset input so same file can be chosen again if needed
    e.target.value = "";
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text", id);
  };

  const removeImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <>
      {/* container positioned to cover entire app area to the right of left menu */}
      <div
        style={{
          position: "absolute",
          top: HEADER_HEIGHT,
          left: leftOffset,
          right: 0,
          bottom: 0,
          padding: "16px",
          boxSizing: "border-box",
          overflow: "hidden",
          backgroundColor: "transparent" /* keep your theme */,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "12px" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "600",
              margin: 0,
              color: "inherit",
            }}
          >
            Create Split Screen
          </h1>
        </div>

        {/* Main Content: left controls fixed width, right canvas fills remaining space */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            width: "100%",
            height: "calc(100% - 48px)", // header area removed
            overflow: "hidden",
            alignItems: "stretch",
          }}
        >
          {/* LEFT SIDE - Controls (scroll only internally if needed) */}
          <div
            style={{
              width: "360px",
              flex: "0 0 360px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              height: "100%",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* Upload / Options / Button - keep same visual but allow internal scroll */}
            <div
              style={{
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: "var(--card-bg, #ffffff)",
                border: "1px solid var(--card-border, #e5e7eb)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                /* keep overall upload card fixed size so other boxes don't move;
                   thumbnails scroll internally while helper dotted box stays visible */
                height: 300,
                overflowY: "auto",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  margin: 0,
                  color: "inherit",
                }}
              >
                Upload Images
              </h3>

              {/* dotted upload area — keep original larger size, center helper text */}
              <label
                htmlFor="file-upload"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "12px",
                  backgroundColor: "var(--upload-bg, #f9fafb)",
                  border: "2px dashed var(--upload-border, #d1d5db)",
                  borderRadius: "8px",
                  textAlign: "center",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  minHeight: 140, // keep original look
                  /* keep helper dotted box visible when user scrolls thumbnails */
                  position: "sticky",
                  top: 12,
                  zIndex: 2,
                }}
              >
                <div style={{ color: "var(--muted, #6b7280)", fontSize: "13px", lineHeight: 1.1 }}>
                  Click to upload or drag & drop
                  <div style={{ fontSize: "11px", color: "var(--muted-2, #9ca3af)", marginTop: 6 }}>
                    Maximum {maxImagesForModel(selectedModel)} images
                  </div>
                </div>
              </label>

              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />

              {/* thumbnails BELOW dotted box — sized so up to allowed count fit per row and will not overlap */}
              {uploadedImages.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    alignItems: "center",
                    justifyContent: "flex-start",
                    boxSizing: "border-box",
                  }}
                >
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, img.id)}
                      style={{
                        flex: `0 0 calc(${100 / Math.min(maxImagesForModel(selectedModel), 4)}% - 6px)`,
                        maxWidth: `calc(${100 / Math.min(maxImagesForModel(selectedModel), 4)}% - 6px)`,
                        height: 72,
                        borderRadius: 6,
                        overflow: "hidden",
                        border: "1px solid var(--thumb-border, #e5e7eb)",
                        backgroundColor: "var(--thumb-bg, #fff)",
                        position: "relative",
                        boxSizing: "border-box",
                      }}
                    >
                      <img
                        id={img.id}
                        src={img.src}
                        alt="upload"
                        draggable="false"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          removeImage(img.id);
                        }}
                        aria-label="Remove image"
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          border: "none",
                          background: "rgba(255,255,255,0.95)",
                          cursor: "pointer",
                          fontSize: 12,
                          lineHeight: "16px",
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: "var(--card-bg, #ffffff)",
                border: "1px solid var(--card-border, #e5e7eb)",
                boxSizing: "border-box",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  marginTop: 0,
                  marginBottom: "8px",
                  color: "inherit",
                }}
              >
                Layout Options
              </h3>

              <div style={{ marginBottom: "8px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "var(--label, #374151)",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}
                >
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                  }}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "var(--label, #374151)",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}
                >
                  Grid Matrix
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "6px",
                  }}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* name input for the split-screen file */}
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--label, #374151)" }}>
                Split Screen Name
              </label>
               <input
                 id="split-name" // <-- added id so handler reads current value at click time
                 value={splitName}
                 onChange={(e) => setSplitName(e.target.value)}
                 placeholder="Enter split screen name"
                 style={{
                   width: "100%",
                   padding: "8px 10px",
                   borderRadius: 6,
                   border: "1px solid #d1d5db",
                   boxSizing: "border-box",
                 }}
               />

               <button
                 id="btn-download"
                 style={{
                   width: "100%",
                   padding: "10px",
                   background: "#6366f1",
                   border: "none",
                   borderRadius: "6px",
                   color: "#fff",
                   fontSize: "13px",
                   fontWeight: "600",
                   cursor: "pointer",
                   alignSelf: "stretch",
                 }}
               >
                 {`Download & Upload${splitName ? ` as "${splitName.trim()}.png"` : ""}`}
               </button>
             </div>
          </div>

          {/* RIGHT SIDE - Canvas Preview occupies all remaining area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              height: "100%",
              minHeight: 0,
              boxSizing: "border-box",
              overflow: "hidden",
              backgroundColor: "var(--card-bg, #ffffff)",
              borderRadius: "8px",
              border: "1px solid var(--card-border, #e5e7eb)",
              padding: "12px",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "600",
                margin: 0,
                color: "inherit",
              }}
            >
              {`Split Screen Preview (${orientation === "portrait" ? "Portrait" : "Landscape"})`}
            </h3>

            <div
              id="photo"
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                minHeight: 0,
                backgroundColor: "var(--preview-bg, #f9fafb)",
                borderRadius: "6px",
                width: "100%",
                height: "100%",
              }}
            >
              {/* background canvas will be created by script; keep responsive */}
              <canvas
                id="background"
                style={{
                  maxWidth: "100%",
                  width: "100%",
                  height: "100%",
                  display: "block",
                  borderRadius: 6,
                }}
              />
            </div>
          </div>
        </div>

        <style>{`
          /* prevent page scroll and hide scrollbars visually while preserving internal scroll where allowed */
          html, body {
            overflow: hidden;
          }
          /* keep left controls internal scroll (if overflow) but hide native scrollbar visuals */
          ::-webkit-scrollbar { width: 0; height: 0; }
          /* ensure apps that rely on 100vh work correctly on mobile as well */
          @media (max-height: 600px) {
            div[style*="position: absolute"][style*="top"] { padding: 8px; }
          }
        `}</style>
      </div>
    </>
  );
};

export default SplitScreenApp;