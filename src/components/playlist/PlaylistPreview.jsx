import { useState, useRef, useEffect } from "react";
import {
  Box,
  Modal,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  MobileStepper,
  CardMedia,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: 24,
  p: 2,
  width: "90%",
  maxWidth: 600,
  outline: "none",
};

export default function PreviewModal({ Media }) {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [orientation, setOrientation] = useState("vertical");
  const videoRef = useRef(null);

  // Simple in-memory cache for loaded media URLs to avoid re-downloads
  const loadedCache = useRef(new Set());
  // keep created <link rel="preload"> elements to remove later if needed
  const preloadLinks = useRef([]);

  const [loaded, setLoaded] = useState(false); // UI flag to know when current media has been loaded

  const maxSteps = (Media && Media.length) || 0;

  const handleClose = () => setOpen(false);
  const handleNext = () => {
    setActiveStep((prev) => Math.min(maxSteps - 1, prev + 1));
  };
  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };
  const handleOrientation = (event, newValue) => {
    if (newValue) setOrientation(newValue);
  };

  // helper to derive best source url for an item
  const getSrc = (item) =>
    (item?.MediaPath || item?.fileUrl || item?.FileUrl || item?.url || "").toString();

  // preload helper: for images use Image(), for videos use <link rel="preload">
  const preloadUrl = (url) => {
    if (!url) return;
    if (loadedCache.current.has(url)) return;
    // video file detection
    const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(url);
    if (isVideo) {
      try {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = url;
        link.as = "video";
        // hint high priority for immediate preview
        link.fetchPriority = "high";
        document.head.appendChild(link);
        preloadLinks.current.push(link);
        // we won't wait onload for videos; assume browser will warm cache
        loadedCache.current.add(url);
      } catch (e) {
        /* ignore */
      }
    } else {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = url;
      img.onload = () => {
        loadedCache.current.add(url);
      };
      img.onerror = () => {
        // don't keep failing urls in cache
      };
    }
  };

  // Aggressive prefetch to speed up first-time preview:
  // - Preload thumbnails/images immediately
  // - For videos try a small ranged fetch to warm the connection/cache (best-effort, will silently fail if server/CORS doesn't allow)
  // - Limit to first N items to avoid overfetching
  const aggressivePrefetch = async (items, limit = 3) => {
    if (!items || !items.length) return;
    const toPrefetch = items.slice(0, limit);
    for (const item of toPrefetch) {
      const url = getSrc(item);
      if (!url || loadedCache.current.has(url)) continue;

      const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(url) ||
        ((item?.MediaType || '').toString().toLowerCase().includes('video'));

      // always preload thumbnail first if available
      const thumb = item?.Thumbnail;
      if (thumb) {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = thumb;
        img.onload = () => loadedCache.current.add(thumb);
      }

      if (isVideo) {
        // add <link rel="preload"> hint
        try {
          const link = document.createElement("link");
          link.rel = "preload";
          link.href = url;
          link.as = "video";
          link.fetchPriority = "high";
          document.head.appendChild(link);
          preloadLinks.current.push(link);
        } catch (e) {
          /* ignore */
        }

        // try a small ranged fetch to warm up connection & cache (best-effort)
        try {
          // Request first 256KB; server may respond with 206 Partial Content
          await fetch(url, {
            method: "GET",
            headers: { Range: "bytes=0-262143" },
            mode: "cors",
            cache: "force-cache"
          });
          loadedCache.current.add(url);
        } catch (e) {
          // fallback: try a normal fetch without Range (still best-effort)
          try {
            await fetch(url, { method: "GET", mode: "cors", cache: "force-cache" });
            loadedCache.current.add(url);
          } catch (e2) {
            /* ignore */
          }
        }
      } else {
        // image warm-up
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = url;
        img.onload = () => loadedCache.current.add(url);
        img.onerror = () => {};
      }
    }
  };

  useEffect(() => {
    // Whenever Media list is provided/changes, kick off aggressive prefetch for the first few items
    if (!Media || !Media.length) return;
    aggressivePrefetch(Media, 4).catch(() => {});
  }, [Media]);

  useEffect(() => {
    // Whenever active item changes, reset media and attempt playback for videos.
    if (!Media || Media.length === 0) return;
    const current = Media[activeStep] || {};
    const src = getSrc(current);

    // reset loaded flag; if cached mark loaded immediately
    if (loadedCache.current.has(src)) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }

    // cleanup any existing video playback
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (e) {
        /* ignore */
      }
    }

    // If current item looks like a video, try to autoplay (browsers may block autoplay).
    const isVideo = (current?.MediaType || "")
      .toString()
      .toLowerCase()
      .includes("video") || /\.(mp4|mov|webm|mkv)$/i.test(src);

    // attempt to preload current and adjacent items to make navigation instant
    preloadUrl(src);
    preloadUrl(getSrc(Media[activeStep + 1] || {}));
    preloadUrl(getSrc(Media[activeStep - 1] || {}));

    if (isVideo && videoRef.current) {
      // attempt to play; muting increases chance autoplay works and allows the browser to download early
      videoRef.current.muted = true;
      // use 'auto' to warm up the video stream for quick playback on user action
      videoRef.current.preload = "auto";
      videoRef.current.play().catch(() => {
        /* ignored: browser autoplay policies */
      });
    }
  }, [activeStep, Media]);

  // remove any injected preload links on unmount
  useEffect(() => {
    return () => {
      preloadLinks.current.forEach((l) => {
        if (l && l.parentNode) l.parentNode.removeChild(l);
      });
      preloadLinks.current = [];
    };
  }, []);

  // orientation check
  const isVertical = orientation === "vertical";

  const previewBoxStyle = {
    width: "100%",
    height: isVertical ? "75vh" : "45vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    borderRadius: "8px",
    overflow: "hidden",
    border: "2px solid #ddd",
    position: "relative",
  };

  // Make media use the full preview area while preserving aspect ratio
  const mediaStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    display: "block",
    backgroundColor: "#fff",
  };

  if (!Media || Media.length === 0) {
    return null;
  }

  const current = Media[activeStep] || {};
  const currentSrc = getSrc(current);
  const currentIsVideo =
    (current?.MediaType || "").toString().toLowerCase().includes("video") ||
    /\.(mp4|mov|webm|mkv)$/i.test(currentSrc);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        {/* Header + Orientation Toggle */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Playlist Preview
          </Typography>

          <ToggleButtonGroup
            value={orientation}
            exclusive
            onChange={handleOrientation}
            size="small"
          >
            <ToggleButton value="vertical">Portrait</ToggleButton>
            <ToggleButton value="horizontal">Landscape</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* PREVIEW BOX */}
        <Box sx={previewBoxStyle}>
          {/* Render only the active media item — NO auto-slide/timer logic */}
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#fff",
            }}
          >
            {currentIsVideo ? (
              <CardMedia
                component="video"
                src={currentSrc}
                sx={mediaStyle}
                controls
                ref={videoRef}
                onLoadedData={() => {
                  // mark cached/loaded so subsequent opens are instant
                  if (currentSrc) loadedCache.current.add(currentSrc);
                  setLoaded(true);
                }}
                onEnded={() => {
                  // Intentionally do NOT auto-advance. Do not change activeStep here.
                  // This ensures video plays fully and preview does not auto-slide.
                }}
                // Attempt autoplay; browsers may block it, but playback is manual-only for navigation.
                autoPlay
                // help autoplay and preload behavior
                muted
                playsInline
                preload="auto"
                // show thumbnail immediately while video loads
                poster={current.Thumbnail || ""}
              />
            ) : (
              <CardMedia
                component="img"
                src={current.Thumbnail || currentSrc}
                sx={mediaStyle}
                alt={current.MediaName || ""}
                // encourage immediate loading for the visible preview
                loading="eager"
                decoding="async"
                fetchpriority="high"
                onLoad={() => {
                  if (currentSrc) loadedCache.current.add(currentSrc);
                  setLoaded(true);
                }}
              />
            )}
          </Box>
        </Box>

        {/* STEPPER - manual navigation only */}
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          nextButton={
            <Button size="small" onClick={handleNext} disabled={activeStep >= maxSteps - 1}>
              Next
              {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep <= 0}>
              {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
              Back
            </Button>
          }
          sx={{ mt: 2 }}
        />
      </Box>
    </Modal>
  );
}