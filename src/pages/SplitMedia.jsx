import React, { useEffect, useState } from "react";

// Predefined model data
const MODELS = [
  { id: "11", name: "1 × 1", blocksX: 1, blocksY: 1, finalW: 1200, finalH: 1200 },
  { id: "21", name: "2 × 1", blocksX: 2, blocksY: 1, finalW: 2400, finalH: 1200 },
  { id: "12", name: "1 × 2", blocksX: 1, blocksY: 2, finalW: 1200, finalH: 2400 },
  { id: "22", name: "2 × 2", blocksX: 2, blocksY: 2, finalW: 2400, finalH: 2400 },
];

const SplitScreenApp = () => {
  const [orientation, setOrientation] = useState("landscape");
  const [selectedModel, setSelectedModel] = useState("22");
  const [uploadedImages, setUploadedImages] = useState([]);

  useEffect(() => {
    initializeBuilder();
  }, [orientation, selectedModel]);

  function initializeBuilder() {
    const model = MODELS.find((m) => m.id === selectedModel);
    if (!model) return;

    const photoDiv = document.getElementById("photo");
    if (!photoDiv) return;

    photoDiv.innerHTML = '<canvas id="background"></canvas>';

    const bgCanvas = document.getElementById("background");
    const ctx = bgCanvas.getContext("2d");

    bgCanvas.width = model.finalW;
    bgCanvas.height = model.finalH;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    const blockW = bgCanvas.width / model.blocksX;
    const blockH = bgCanvas.height / model.blocksY;

    // Draw grid
    for (let y = 0; y < model.blocksY; y++) {
      for (let x = 0; x < model.blocksX; x++) {
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 3;
        ctx.strokeRect(x * blockW, y * blockH, blockW, blockH);

        const id = `layer-${x}-${y}`;
        const layerCanvas = document.createElement("canvas");
        layerCanvas.id = id;
        layerCanvas.width = blockW;
        layerCanvas.height = blockH;
        layerCanvas.style.position = "absolute";
        layerCanvas.style.left = `${x * blockW}px`;
        layerCanvas.style.top = `${y * blockH}px`;
        layerCanvas.style.zIndex = 5;
        layerCanvas.style.cursor = "pointer";

        photoDiv.appendChild(layerCanvas);
      }
    }

    enableDragToLayer();
    enableImageReposition();
    enableSave(model);
  }

  function enableDragToLayer() {
    const layers = document.querySelectorAll("canvas[id^='layer']");
    layers.forEach((canvas) => {
      canvas.addEventListener("dragover", (e) => {
        e.preventDefault();
        canvas.style.opacity = "0.7";
      });
      
      canvas.addEventListener("dragleave", (e) => {
        canvas.style.opacity = "1";
      });
      
      canvas.addEventListener("drop", (e) => {
        e.preventDefault();
        canvas.style.opacity = "1";
        const id = e.dataTransfer.getData("text");
        const img = document.getElementById(id);
        if (!img) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      });
    });
  }

  function enableImageReposition() {
    const layers = document.querySelectorAll("canvas[id^='layer']");
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
      ctx.drawImage(bg, 0, 0);

      document.querySelectorAll("canvas[id^='layer-']").forEach((layer) => {
        const x = parseInt(layer.id.split("-")[1]);
        const y = parseInt(layer.id.split("-")[2]);
        const blockW = model.finalW / model.blocksX;
        const blockH = model.finalH / model.blocksY;

        ctx.drawImage(layer, x * blockW, y * blockH);
      });

      const link = document.createElement("a");
      link.download = "split-media.png";
      link.href = finalCanvas.toDataURL();
      link.click();
    };
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (uploadedImages.length + files.length > 4) {
      alert("Maximum 4 images allowed!");
      return;
    }

    files.forEach((file) => {
      if (file.type.indexOf("image/") === 0) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const id = Math.random().toString(36).substr(2, 9);
          setUploadedImages((prev) => [
            ...prev,
            { id, src: event.target.result },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text", id);
  };

  const removeImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#f9fafb", 
      padding: "20px",
      paddingLeft: "280px"
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ 
          fontSize: "28px", 
          fontWeight: "600",
          margin: 0,
          color: "#111827"
        }}>
          Split Screen
        </h1>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: "flex",
        gap: "20px",
        maxWidth: "1400px"
      }}>
        
        {/* LEFT SIDE - Controls */}
        <div style={{ width: "350px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Upload Section */}
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "20px"
          }}>
            <h3 style={{ 
              fontSize: "16px", 
              fontWeight: "600",
              marginTop: 0,
              marginBottom: "15px",
              color: "#111827"
            }}>
              Upload Images
            </h3>
            
            <label htmlFor="file-upload" style={{
              display: "block",
              padding: "40px 20px",
              backgroundColor: "#f9fafb",
              border: "2px dashed #d1d5db",
              borderRadius: "8px",
              textAlign: "center",
              cursor: "pointer"
            }}>
              <div style={{ color: "#6b7280", fontSize: "14px" }}>
                Click to upload or drag & drop<br/>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Maximum 4 images
                </span>
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

            {/* Uploaded Images Grid */}
            {uploadedImages.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px"
                }}>
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: "6px",
                        overflow: "hidden",
                        border: "2px solid #e5e7eb",
                        cursor: "grab",
                        backgroundColor: "#fff"
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, img.id)}
                    >
                      <img
                        id={img.id}
                        src={img.src}
                        alt="upload"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                        draggable="false"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        style={{
                          position: "absolute",
                          top: "5px",
                          right: "5px",
                          backgroundColor: "#fff",
                          border: "1px solid #d1d5db",
                          borderRadius: "4px",
                          color: "#6b7280",
                          width: "24px",
                          height: "24px",
                          cursor: "pointer",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <p style={{ 
                  fontSize: "12px", 
                  color: "#9ca3af", 
                  marginTop: "10px",
                  marginBottom: 0 
                }}>
                  Drag images to canvas cells
                </p>
              </div>
            )}
          </div>

          {/* Options Section */}
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "20px"
          }}>
            <h3 style={{ 
              fontSize: "16px", 
              fontWeight: "600",
              marginTop: 0,
              marginBottom: "15px",
              color: "#111827"
            }}>
              Layout Options
            </h3>

            {/* Orientation */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "14px",
                color: "#374151",
                marginBottom: "8px",
                fontWeight: "500"
              }}>
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#111827",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>

            {/* Grid Matrix */}
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "14px",
                color: "#374151",
                marginBottom: "8px",
                fontWeight: "500"
              }}>
                Grid Matrix
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  color: "#111827",
                  fontSize: "14px",
                  cursor: "pointer"
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

          {/* Download Button */}
          <button
            id="btn-download"
            style={{
              width: "100%",
              padding: "12px",
              background: "#6366f1",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Download Split Media
          </button>
        </div>

        {/* RIGHT SIDE - Canvas Preview */}
        <div style={{
          flex: 1,
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          padding: "20px",
          display: "flex",
          flexDirection: "column"
        }}>
          <h3 style={{ 
            fontSize: "16px", 
            fontWeight: "600",
            marginTop: 0,
            marginBottom: "15px",
            color: "#111827"
          }}>
            Canvas Preview
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
              backgroundColor: "#f9fafb",
              borderRadius: "6px"
            }}
          >
            <canvas id="background" style={{ 
              maxWidth: "100%", 
              maxHeight: "100%",
              height: "auto",
              width: "auto"
            }}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitScreenApp;