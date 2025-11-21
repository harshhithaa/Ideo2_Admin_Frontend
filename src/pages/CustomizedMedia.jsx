import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import 'tui-image-editor/dist/tui-image-editor.css';
import FileSaver from 'file-saver';
import {
  Button,
  Card,
  Modal,
  Typography,
  Container,
  Grid,
  Box,
  CardActionArea,
  CardMedia,
  Stack
} from '@mui/material';
import background1 from 'src/assets/backgrounds/1.jpg';
import background2 from 'src/assets/backgrounds/2.jpg';
import background3 from 'src/assets/backgrounds/3.jpg';
import background4 from 'src/assets/backgrounds/4.jpg';
import background5 from 'src/assets/backgrounds/5.jpg';
import { useNavigate } from 'react-router-dom';

const CustomizedMedia = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [active, setActive] = useState(false);
  const [localUploads, setLocalUploads] = useState([]); // keep uploaded files as thumbnails
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const images = [
    background1,
    background2,
    background3,
    background4,
    background5
  ];

  useEffect(() => {
    // cleanup object URLs when component unmounts
    return () => {
      localUploads.forEach((u) => {
        try { URL.revokeObjectURL(u.preview); } catch (e) {}
      });
    };
  }, [localUploads]);

  const handleClick = (img) => {
    setSelectedImage(img);
    setActive(true);
  };

  const onChooseFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const wrapper = { file, preview, name: file.name };
    setLocalUploads((prev) => [wrapper, ...prev]);
    setSelectedImage(preview);
    setActive(true);
    // clear input so same file can be selected again if needed
    e.target.value = null;
  };

  const handleProceed = () => {
    // pass a structured payload so the editor can read location.state.src (and file when available)
    const local = localUploads.find((u) => u.preview === selectedImage);
    const payload = {
      src: selectedImage,
      file: local ? local.file : null,
      preset: local ? false : true
    };
    navigate('/app/editimage', { state: payload });
  };

  return (
    <>
      <Helmet>
        <title>Create your own Media | Ideogram</title>
      </Helmet>

      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Typography
          gutterBottom
          variant="h4"
          sx={{ padding: '8px 0', color: 'text.primary', fontWeight: 600 }}
        >
          Create Media
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Select one of the preset backgrounds below or upload an image from your PC to start creating.
        </Typography>

        <Card sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            {images.map((image, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                <CardActionArea onClick={() => handleClick(image)}>
                  <CardMedia
                    component="img"
                    image={image}
                    alt={`background-${index}`}
                    sx={{ height: 120, objectFit: 'cover', borderRadius: 1 }}
                  />
                </CardActionArea>
              </Grid>
            ))}

            {/* show local uploads thumbnails in same grid */}
            {localUploads.map((u, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={`local-${idx}`}>
                <CardActionArea onClick={() => handleClick(u.preview)}>
                  <CardMedia
                    component="img"
                    image={u.preview}
                    alt={u.name || 'uploaded'}
                    sx={{ height: 120, objectFit: 'cover', borderRadius: 1 }}
                  />
                </CardActionArea>
              </Grid>
            ))}

            {/* Upload card -> navigate to editor and open file picker there */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Box
                sx={{
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: 'background.paper'
                }}
                onClick={() => navigate('/app/editimage', { state: { openPicker: true } })}
              >
                <Stack spacing={1} alignItems="center">
                  <Typography variant="subtitle1">Add your own image</Typography>
                  <Button variant="contained" size="small" onClick={() => navigate('/app/editimage', { state: { openPicker: true } })}>
                    Open Editor
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            color="primary"
            size="large"
            variant="contained"
            onClick={handleProceed}
            disabled={!selectedImage}
            sx={{ textTransform: 'none' }}
          >
            Proceed
          </Button>

          <Button
            color="secondary"
            size="large"
            variant="outlined"
            onClick={() => {
              setSelectedImage(null);
              setActive(false);
            }}
            sx={{ textTransform: 'none' }}
          >
            Clear Selection
          </Button>
        </Box>

        <Modal
          open={active}
          onClose={() => setActive(false)}
          aria-labelledby="selected-preview"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Card
            sx={{
              top: '50%',
              left: '50%',
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              maxWidth: '90%',
              maxHeight: '90%',
              p: 2,
              overflow: 'auto'
            }}
          >
            {selectedImage ? (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={selectedImage}
                  alt="background-preview"
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    color="primary"
                    size="large"
                    variant="contained"
                    onClick={handleProceed}
                  >
                    Proceed with this
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography>No preview available</Typography>
            )}
          </Card>
        </Modal>
      </Container>
    </>
  );
};

export default CustomizedMedia;
