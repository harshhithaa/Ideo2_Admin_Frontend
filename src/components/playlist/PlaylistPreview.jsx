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

  useEffect(() => {
    // Whenever active item changes, reset media and attempt playback for videos.
    if (!Media || Media.length === 0) return;
    const current = Media[activeStep] || {};
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } catch (e) {
        /* ignore */
      }
    }

    // If current item looks like a video, try to autoplay (browsers may block autoplay).
    const isVideo = (current?.MediaType || "").toString().toLowerCase().includes("video")
      || /\.(mp4|mov|webm|mkv)$/i.test((current?.MediaPath || current?.fileUrl || "").toString());

    if (isVideo && videoRef.current) {
      // attempt to play; if blocked user can use controls
      videoRef.current.play().catch(() => {});
    }
  }, [activeStep, Media]);

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
  const currentIsVideo = (current?.MediaType || "").toString().toLowerCase().includes("video") ||
    /\.(mp4|mov|webm|mkv)$/i.test((current?.MediaPath || current?.fileUrl || "").toString());

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
                src={current.MediaPath || current.fileUrl || current.FileUrl || current.url || ''}
                sx={mediaStyle}
                controls
                ref={videoRef}
                onEnded={() => {
                  // Intentionally do NOT auto-advance. Do not change activeStep here.
                  // This ensures video plays fully and preview does not auto-slide.
                }}
                // Attempt autoplay; browsers may block it, but playback is manual-only for navigation.
                autoPlay
              />
            ) : (
              <CardMedia
                component="img"
                src={current.Thumbnail || current.MediaPath || current.fileUrl || ''}
                sx={mediaStyle}
                alt={current.MediaName || ""}
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