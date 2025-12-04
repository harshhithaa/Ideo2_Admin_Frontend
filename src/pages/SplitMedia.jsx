import React, { useEffect, useState } from "react";
import Api from "../service/Api";
import { store } from "../store/store";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Predefined model data
const MODELS = [
  // ✅ ALL LAYOUTS NOW USE SAME ASPECT RATIO (2400×2400 square canvas like 2×2)
  // Only the internal grid structure (blocksX, blocksY) differs
  { id: "12", name: "1 × 2", blocksX: 1, blocksY: 2, finalW: 2400, finalH: 2400 },
  { id: "21", name: "2 × 1", blocksX: 2, blocksY: 1, finalW: 2400, finalH: 2400 },
  { id: "22", name: "2 × 2", blocksX: 2, blocksY: 2, finalW: 2400, finalH: 2400 },
];

const maxImagesForModel = (modelId) => {
  if (modelId === "12") return 2;
  if (modelId === "21") return 2; // 2×1 supports 2 images
  if (modelId === "22") return 4;
  return 4;
};

const SplitScreenApp = () => {
  const HEADER_HEIGHT = 72;
  const LEFT_MENU_WIDTH = 280;
  const [orientation, setOrientation] = useState("landscape");
  const [selectedModel, setSelectedModel] = useState("22");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [splitName, setSplitName] = useState("");
  const [leftOffset, setLeftOffset] = useState(LEFT_MENU_WIDTH);
  const [availableHeight, setAvailableHeight] = useState(
    Math.max(window.innerHeight - HEADER_HEIGHT, 420)
  );
  const [placedAssignments, setPlacedAssignments] = useState([]);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const navigate = useNavigate();

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

  // Re-init builder whenever layout or placed assignments change
  useEffect(() => {
    initializeBuilder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation, selectedModel, uploadedImages, availableHeight, placedAssignments]);

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
    
    // ✅ SWAP DIMENSIONS BASED ON ORIENTATION
    // Portrait: swap width/height to make canvas taller than wide
    // Landscape: use original dimensions (wider than tall)
    if (orientation === "portrait") {
      bgCanvas.width = model.finalH;  // swap: use height as width
      bgCanvas.height = model.finalW; // swap: use width as height
    } else {
      bgCanvas.width = model.finalW;
      bgCanvas.height = model.finalH;
    }

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

    // Compute new assignments for this grid from previously placed images,
    // preserving order and redistributing sequentially.
    const totalLayers = model.blocksX * model.blocksY;
    const prevFlat = (placedAssignments || []).filter(Boolean);
    const assignedLocal = Array(totalLayers).fill(null);
    for (let i = 0; i < Math.min(prevFlat.length, totalLayers); i++) {
      assignedLocal[i] = prevFlat[i];
    }

    // If previous placedAssignments length doesn't match new total, update state (idempotent)
    const needUpdatePlaced =
      placedAssignments.length !== assignedLocal.length ||
      placedAssignments.some((v, i) => (v || null) !== (assignedLocal[i] || null));
    if (needUpdatePlaced) {
      // avoid infinite loop: only set if different
      setPlacedAssignments(assignedLocal);
    }

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

        // If we have an assigned image for this layer, draw it now
        const index = y * model.blocksX + x;
        const assignedSrc = assignedLocal[index];
        if (assignedSrc) {
          const image = new Image();
          // preserve cross-origin display behavior in case of external images
          image.crossOrigin = "anonymous";
          image.onload = () => {
            const cw = layerCanvas.width;
            const ch = layerCanvas.height;
            const iw = image.width;
            const ih = image.height;
            const scale = Math.max(cw / iw, ch / ih); // cover
            const dw = iw * scale;
            const dh = ih * scale;
            const dx = (cw - dw) / 2;
            const dy = (ch - dh) / 2;
            const lctx = layerCanvas.getContext("2d");
            lctx.clearRect(0, 0, cw, ch);
            lctx.drawImage(image, 0, 0, iw, ih, dx, dy, dw, dh);
          };
          image.src = assignedSrc;
        }
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

          // update assignment mapping (swap)
          const partsSrc = srcCanvas.id.split("-");
          const partsDst = canvas.id.split("-");
          const srcIndex = parseInt(partsSrc[2], 10) * (parseInt(partsSrc[1], 10) ? 1 : 1); // fallback
          // compute indices robustly: index = y*blocksX + x
          const model = MODELS.find((m) => m.id === selectedModel);
          const srcX = parseInt(partsSrc[1], 10);
          const srcY = parseInt(partsSrc[2], 10);
          const dstX = parseInt(partsDst[1], 10);
          const dstY = parseInt(partsDst[2], 10);
          const srcIdx = srcY * model.blocksX + srcX;
          const dstIdx = dstY * model.blocksX + dstX;

          setPlacedAppointmentsSwap(srcIdx, dstIdx);
          return;
        }

        // Otherwise assume it's an <img> thumbnail id -> draw image into layer, fit and center
        const img = srcEl;
        if (!img || img.tagName !== "IMG") return;

        const image = new Image();
        image.crossOrigin = "anonymous";
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

          // update placedAssignments for this canvas
          const parts = canvas.id.split("-");
          const lx = parseInt(parts[1], 10);
          const ly = parseInt(parts[2], 10);
          const model = MODELS.find((m) => m.id === selectedModel);
          const index = ly * model.blocksX + lx;
          setPlacedAssignments((prev) => {
            const copy = Array.from(prev || []);
            // ensure length
            const needed = model.blocksX * model.blocksY;
            while (copy.length < needed) copy.push(null);
            copy[index] = img.src;
            return copy;
          });
        };
        image.src = img.src;
      });
    });
  }

  // helper to swap two indices in placedAssignments (keeps order)
  function setPlacedAppointmentsSwap(i, j) {
    setPlacedAssignments((prev) => {
      const copy = Array.from(prev || []);
      const maxLen = Math.max(i, j) + 1;
      while (copy.length < maxLen) copy.push(null);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
      return copy;
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
      
      // ✅ APPLY SAME ORIENTATION SWAP FOR FINAL EXPORT
      if (orientation === "portrait") {
        finalCanvas.width = model.finalH;
        finalCanvas.height = model.finalW;
      } else {
        finalCanvas.width = model.finalW;
        finalCanvas.height = model.finalH;
      }
      
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
        // do NOT revoke immediately; keep blob URL for preview placeholder
        // URL.revokeObjectURL(url);

        // ✅ SHOW SUCCESS MODAL IMMEDIATELY AFTER DOWNLOAD STARTS
        setOpenSuccessModal(true);

        // also upload automatically to media endpoint (in background)
        try {
          const token = store.getState().root.user?.accesstoken;
          const fd = new FormData();
          // include filename / name for server
          fd.append("Media", blob, filename);
          fd.append("MediaName", filename);

          // Create a temporary placeholder so MediaList will show progress immediately
          try {
            const tmpRef = `tmp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
            const placeholder = {
              MediaRef: tmpRef,
              fileName: filename,
              fileUrl: url,
              fileSize: blob.size || null,
              fileMimetype: "image/png",
              isProcessing: true,
              processingProgress: 0,
              createdAt: new Date().toISOString()
            };

            const KEY = "IDEOGRAM_UPLOADED_MEDIA";
            try {
              const raw = localStorage.getItem(KEY);
              const existing = raw ? JSON.parse(raw) : [];
              // put newest first, dedupe by MediaRef
              const map = new Map();
              [placeholder, ...existing].forEach((p) => { if (!map.has(p.MediaRef)) map.set(p.MediaRef, p); });
              localStorage.setItem(KEY, JSON.stringify(Array.from(map.values())));
            } catch (e) {
              console.warn("write placeholder failed", e);
            }

            // tell UI about new placeholder (progress 0)
            try {
              window.dispatchEvent(new CustomEvent("ideogram:uploadProgress", { detail: { progress: 0, placeholders: [placeholder] } }));
            } catch (e) { /* ignore */ }

            // perform upload with progress reporting
            Api.post("/admin/savemedia", fd, {
              headers: {
                "Content-Type": "multipart/form-data",
                AuthToken: token
              },
              onUploadProgress: (ev) => {
                try {
                  // compute percent (guard zero total)
                  const loaded = ev?.loaded || 0;
                  const total = ev?.total || placeholder.fileSize || 1;
                  let pct = Math.round((loaded / total) * 100);
                  if (pct >= 100) pct = 99; // reserve 100 for server confirmation
                  window.dispatchEvent(new CustomEvent("ideogram:uploadProgress", { detail: { progress: pct, placeholders: [placeholder] } }));
                } catch (err) { /* ignore */ }
              }
            })
              .then((res) => {
                // on server success, remove placeholder and notify final state
                try {
                  if (!res.data.Error) {
                    // remove matching placeholder by name/ref from localStorage
                    const KEY2 = "IDEOGRAM_UPLOADED_MEDIA";
                    try {
                      const raw2 = localStorage.getItem(KEY2);
                      const existing2 = raw2 ? JSON.parse(raw2) : [];
                      const filtered = existing2.filter((p) => {
                        const nameMatches = (p.fileName || p.MediaName || "") !== filename;
                        const refMatches = p.MediaRef !== tmpRef;
                        return nameMatches && refMatches;
                      });
                      localStorage.setItem(KEY2, JSON.stringify(filtered));
                    } catch (e) { /* ignore */ }

                    // final progress + complete event with server Details (server may return Details or Data)
                    try { window.dispatchEvent(new CustomEvent("ideogram:uploadProgress", { detail: { progress: 100, placeholders: [placeholder] } })); } catch (e) {}
                    try { window.dispatchEvent(new CustomEvent("ideogram:uploadComplete", { detail: { uploadedMedia: res.data.Details ? res.data.Details.Media || [] : [] } })); } catch (e) {}
                    console.log("Split-screen uploaded to media successfully");
                  } else {
                    console.warn("Upload returned error:", res.data.Error);
                  }
                } finally {
                  // free object URL after short delay
                  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 30000);
                }
              })
              .catch((err) => {
                console.error("Automatic upload failed:", err);
                // cleanup placeholder on error (optional)
                try {
                  const KEY3 = "IDEOGRAM_UPLOADED_MEDIA";
                  const raw3 = localStorage.getItem(KEY3);
                  const existing3 = raw3 ? JSON.parse(raw3) : [];
                  const filtered3 = existing3.filter((p) => p.MediaRef !== tmpRef);
                  localStorage.setItem(KEY3, JSON.stringify(filtered3));
                } catch (e) { /* ignore */ }
              });
          } catch (e) {
            console.error("placeholder/upload flow failed", e);
          }
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
    // remove from uploadedImages, and remove any placements of this image from placedAssignments
    const found = uploadedImages.find((it) => it.id === id);
    const srcToRemove = found?.src;
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));

    if (srcToRemove) {
      setPlacedAssignments((prev) => {
        const prevArr = Array.from(prev || []);
        // filter out occurrences of this src and re-sequence remaining placed images
        const filtered = prevArr.filter((v) => v && v !== srcToRemove);
        const newArr = Array(prevArr.length).fill(null);
        for (let i = 0; i < filtered.length && i < newArr.length; i++) {
          newArr[i] = filtered[i];
        }
        return newArr;
      });
    }
  };

  // ✅ ADD NAVIGATION HANDLER
  const goToMediaLibrary = () => {
    setOpenSuccessModal(false);
    navigate('/app/media', { 
      state: { 
        openTab: 'IMAGES',
        fromUpload: true 
      } 
    });
  };

  // Derived validation: whether save button should be enabled
  const selectedModelObj = MODELS.find((m) => m.id === selectedModel) || null;
  const totalSlots = selectedModelObj ? selectedModelObj.blocksX * selectedModelObj.blocksY : 0;

  const countFilledSlots = (() => {
    if (!placedAssignments || !selectedModelObj) return 0;
    let count = 0;
    for (let i = 0; i < totalSlots; i++) {
      if (placedAssignments[i]) count++;
    }
    return count;
  })();

  const allSlotsFilled = totalSlots > 0 && countFilledSlots === totalSlots;
  const nameValid = (splitName || "").trim().length > 0;
  const orientationSelected = !!orientation;
  const gridSelected = !!selectedModel;

  const isReadyForSave = orientationSelected && gridSelected && nameValid && allSlotsFilled;

  const getMissingReasons = () => {
    const reasons = [];
    if (!orientationSelected) reasons.push("Orientation not selected");
    if (!gridSelected) reasons.push("Grid matrix not selected");
    if (!nameValid) reasons.push("Split screen name is empty");
    if (!allSlotsFilled) {
      const missing = totalSlots - countFilledSlots;
      reasons.push(`${missing} preview slot${missing === 1 ? "" : "s"} empty`);
    }
    return reasons;
  };

  return (
    <>
      <Dialog
        open={openSuccessModal}
        onClose={() => setOpenSuccessModal(false)}
        aria-labelledby="upload-result-title"
      >
        <DialogTitle id="upload-result-title" sx={{ textAlign: 'center' }}>
          Success
        </DialogTitle>
        <DialogContent sx={{ minWidth: 320, display: 'flex', justifyContent: 'center' }}>
          <Alert severity="success" sx={{ width: '100%', textAlign: 'center' }}>
            Media uploaded successfully. View it in Media Library.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={goToMediaLibrary} variant="contained" color="primary" size="small">
            GO TO MEDIA LIBRARY
          </Button>
          <Button onClick={() => setOpenSuccessModal(false)} variant="outlined" size="small">
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

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
          backgroundColor: "transparent",
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
                  minHeight: 14, // keep original look
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
                 disabled={!isReadyForSave}
                 title={!isReadyForSave ? getMissingReasons().join(" · ") : "Download & Upload to Media"}
                 style={{
                   width: "100%",
                   padding: "10px",
                   background: "#6366f1",
                   border: "none",
                   borderRadius: "6px",
                   color: "#fff",
                   fontSize: "13px",
                   fontWeight: "600",
                   cursor: isReadyForSave ? "pointer" : "not-allowed",
                   alignSelf: "stretch",
                   opacity: isReadyForSave ? 1 : 0.55,
                 }}
               >
                 {`Download & Upload to Media${splitName ? ` as "${splitName.trim()}.png"` : ""}`}
               </button>

               {/* helper text when disabled listing missing items */}
               {!isReadyForSave && (
                 <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }} aria-hidden>
                   {getMissingReasons().join(" · ")}
                 </div>
               )}
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