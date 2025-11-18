import { useState } from "react";
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
import SwipeableViews from "react-swipeable-views";
import { autoPlay } from "react-swipeable-views-utils";

const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

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
  const maxSteps = Media.length;

  const handleClose = () => setOpen(false);
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleStepChange = (step) => setActiveStep(step);
  const handleOrientation = (event, newValue) => {
    if (newValue) setOrientation(newValue);
  };

  // orientation check
  const isVertical = orientation === "vertical";

  // FIXED — perfect preview box with proper height
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

  // FIXED — SwipeableViews style to take full height
  const swipeableContainerStyle = {
    height: "100%",
    width: "100%",
  };

  // FIXED — perfect media scaling
  const mediaStyle = {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    objectPosition: "center",
    backgroundColor: "#fff",
    display: "block",
  };

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
          <AutoPlaySwipeableViews
            index={activeStep}
            onChangeIndex={handleStepChange}
            enableMouseEvents
            style={swipeableContainerStyle}
            containerStyle={{ height: "100%" }}
          >
            {Media.map((item, index) => {
              const isImage = item.MediaType === "image";
              const mediaProps = {
                component: isImage ? "img" : "video",
                src: item.MediaPath,
                sx: mediaStyle,
                controls: !isImage,
              };

              return (
                <Box
                  key={index}
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#fff",
                  }}
                >
                  <CardMedia {...mediaProps} />
                </Box>
              );
            })}
          </AutoPlaySwipeableViews>
        </Box>

        {/* STEPPER */}
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          nextButton={
            <Button size="small" onClick={handleNext} disabled={activeStep === maxSteps - 1}>
              Next
              {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
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