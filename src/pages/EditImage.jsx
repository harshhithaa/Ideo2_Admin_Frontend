import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { saveMedia } from '../store/action/user';
import ImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';
import {
  Button,
  Box,
  Snackbar,
  Alert,
  TextField,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const EditImage = ({ saveMedia: uploadMedia }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const [snack, setSnack] = useState({ open: false, severity: 'success', msg: '' });
  const [mediaName, setMediaName] = useState('');
  const [editedImage, setEditedImage] = useState(null);
  
  // Layer management
  const [backgroundLayer, setBackgroundLayer] = useState(null);
  const fileInputRef = useRef(null);
  
  // Only show popup if NO image is pre-loaded
  const incoming = location.state;
  const hasPreloadedImage = incoming?.src;
  const [showPopup, setShowPopup] = useState(!hasPreloadedImage);

  // Initialize Toast UI Image Editor
  useEffect(() => {
    const incoming = location.state;
    
    // Store the background if provided
    if (incoming?.src) {
      setBackgroundLayer(incoming.src);
    }
    
    // Initialize editor (blank or with background)
    if (editorRef.current && !editorInstance.current) {
      const editorConfig = {
        includeUI: {
          theme: {
            'common.bi.image': '',
            'common.bisize.width': '0px',
            'common.bisize.height': '0px',
            'common.backgroundImage': 'none',
            'common.backgroundColor': '#1e1e1e',
            'common.border': '0px',
          },
          menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
          initMenu: '',
          uiSize: {
            width: '100%',
            height: '100%'
          },
          menuBarPosition: 'bottom'
        },
        cssMaxWidth: window.innerWidth - 100,
        cssMaxHeight: window.innerHeight - 200,
        usageStatistics: false,
        selectionStyle: {
          cornerSize: 20,
          rotatingPointOffset: 70
        }
      };

      // If background exists, load it
      if (incoming?.src) {
        editorConfig.includeUI.loadImage = {
          path: incoming.src,
          name: 'Background'
        };
      }

      editorInstance.current = new ImageEditor(editorRef.current, editorConfig);
      
      // Hide internal download button and intercept Load button
      setTimeout(() => {
        const downloadBtn = document.querySelector('.tui-image-editor-download-btn');
        if (downloadBtn) {
          downloadBtn.style.display = 'none';
        }

        // Intercept the Load button to add images as layers instead of replacing
        const loadBtn = document.querySelector('.tui-image-editor-load-btn');
        if (loadBtn) {
          // Find the hidden file input
          const fileInput = document.querySelector('input[type="file"][accept="image/*"]');
          if (fileInput) {
            fileInputRef.current = fileInput;
            
            // Store original handler
            const originalOnChange = fileInput.onchange;
            
            // Override with custom handler
            fileInput.onchange = function(e) {
              e.stopPropagation();
              e.preventDefault();
              
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(event) {
                  const imageUrl = event.target.result;
                  
                  // If background exists, add new image as an Icon/Image object (layer on top)
                  if (backgroundLayer && editorInstance.current) {
                    // Create a temporary image to get dimensions
                    const tempImg = new Image();
                    tempImg.onload = function() {
                      // Calculate size (max 50% of canvas)
                      const canvasSize = editorInstance.current.getCanvasSize();
                      const maxWidth = canvasSize.width * 0.5;
                      const maxHeight = canvasSize.height * 0.5;
                      
                      const ratio = Math.min(maxWidth / tempImg.width, maxHeight / tempImg.height);
                      const width = tempImg.width * ratio;
                      const height = tempImg.height * ratio;
                      
                      // Add as icon (which is treated as a movable object layer)
                      editorInstance.current.addIcon('customIcon', {
                        left: (canvasSize.width - width) / 2,
                        top: (canvasSize.height - height) / 2,
                        fill: 'transparent',
                        stroke: 'transparent',
                        strokeWidth: 0,
                        opacity: 1
                      }).then(() => {
                        // Replace the icon with actual image
                        const canvas = editorInstance.current._graphics.getCanvas();
                        const objects = canvas.getObjects();
                        const lastObject = objects[objects.length - 1];
                        
                        fabric.Image.fromURL(imageUrl, function(img) {
                          img.set({
                            left: (canvasSize.width - width) / 2,
                            top: (canvasSize.height - height) / 2,
                            scaleX: width / img.width,
                            scaleY: height / img.height,
                            selectable: true,
                            evented: true
                          });
                          
                          canvas.remove(lastObject);
                          canvas.add(img);
                          canvas.setActiveObject(img);
                          canvas.renderAll();
                          
                          console.log('Image added as layer on top of background');
                        });
                      }).catch(err => {
                        console.error('Error adding layer:', err);
                        // Fallback to original behavior
                        if (originalOnChange) {
                          originalOnChange.call(fileInput, e);
                        }
                      });
                    };
                    tempImg.src = imageUrl;
                  } else {
                    // No background - load as main image (original behavior)
                    if (editorInstance.current) {
                      editorInstance.current.loadImageFromFile(file).then(() => {
                        setBackgroundLayer(imageUrl);
                        console.log('Image loaded as background');
                      });
                    }
                  }
                  
                  // Reset file input
                  e.target.value = '';
                };
                
                reader.readAsDataURL(file);
              }
              
              return false;
            };
            
            // Also prevent default click behavior
            loadBtn.onclick = function(e) {
              e.preventDefault();
              fileInput.click();
              return false;
            };
          }
        }
      }, 500);
    }

    // Cleanup on unmount
    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [location.state, backgroundLayer]);

  // Handle save from Toast UI Editor
  const handleSave = () => {
    if (editorInstance.current) {
      const dataURL = editorInstance.current.toDataURL();
      setEditedImage(dataURL);
    }
  };

  const handleClose = () => {
    if (editorInstance.current) {
      editorInstance.current.destroy();
      editorInstance.current = null;
    }
    navigate('/app/createmedia');
  };

  // Navigate to Media Library
  const goToMediaLibrary = () => {
    setSnack({ open: false, severity: 'success', msg: '' });
    navigate('/app/media');
  };

  // Handle upload and download
  const handleDownloadAndUpload = async () => {
    try {
      if (!editedImage) {
        throw new Error('No image to save');
      }
      const res = await fetch(editedImage);
      const blob = await res.blob();
      const safeName = (mediaName && mediaName.trim()) ? mediaName.trim() : 'edited_media';
      const filename = `${safeName}.png`;

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Upload
      const formdata = new FormData();
      const file = new File([blob], filename, { type: blob.type });
      formdata.append('Media', file);

      uploadMedia(formdata, (err) => {
        if (err?.exists) {
          setSnack({ open: true, severity: 'error', msg: err.err || 'Upload failed' });
        } else {
          setSnack({ open: true, severity: 'success', msg: 'Image downloaded and uploaded to media' });
          setMediaName('');
          setEditedImage(null);
        }
      });
    } catch (e) {
      setSnack({ open: true, severity: 'error', msg: e.message || 'Operation failed' });
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#1e1e1e' }}>
      {/* Add global style to hide the internal download button */}
      <style>
        {`
          .tui-image-editor-download-btn {
            display: none !important;
          }
          .tui-image-editor-header-buttons .tui-image-editor-download-btn {
            display: none !important;
          }
        `}
      </style>

      {/* Success/Error Modal Dialog - matches SaveMedia styling */}
      <Dialog
        open={snack.open}
        onClose={() => setSnack({ open: false, severity: 'success', msg: '' })}
        aria-labelledby="upload-result-title"
      >
        <DialogTitle id="upload-result-title" sx={{ textAlign: 'center' }}>
          {snack.severity === 'success' ? 'Success' : 'Notice'}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 320, display: 'flex', justifyContent: 'center' }}>
          <Alert severity={snack.severity} sx={{ width: '100%', textAlign: 'center' }}>
            {snack.msg}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          {snack.severity === 'success' && (
            <Button onClick={goToMediaLibrary} variant="contained" color="primary" size="small">
              Go to Media Library
            </Button>
          )}
          <Button onClick={() => setSnack({ open: false, severity: 'success', msg: '' })} variant="outlined" size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top App Bar */}
      <AppBar position="relative" sx={{ backgroundColor: '#2b2b2b', color: '#e4c919ff' }}>
        <Toolbar>
          <Typography sx={{ flex: 1 }} variant="h4" component="div" fontWeight={550}>
            TOAST UI IMAGE EDITOR
          </Typography>
          <Button
            variant="text"
            onClick={handleClose}
            aria-label="close"
            sx={{
              color: '#fff',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              minWidth: 'auto',
              padding: '6px 12px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Close Editor
          </Button>
        </Toolbar>
      </AppBar>

      {/* Editor Container */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          height: 'calc(100vh - 100px)',
          maxHeight: 'calc(100vh - 100px)',
          p: 2,
          boxSizing: 'border-box',
          bgcolor: '#1e1e1e',
          overflow: 'hidden',
          '& .tui-image-editor': {
            height: '100% !important',
            display: 'flex',
            flexDirection: 'column'
          },
          '& .tui-image-editor-canvas-container': {
            height: '100% !important',
            overflow: 'hidden !important'
          },
          '& .tui-image-editor-wrap': {
            height: '100% !important'
          },
          position: 'relative'
        }}
      >
        {/* Small centered popup overlay */}
        {showPopup && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 10000
            }}
            aria-hidden={!showPopup}
          >
            <div
              role="dialog"
              aria-modal="false"
              style={{
                pointerEvents: 'auto',
                background: 'rgba(233, 214, 214, 0.84)',
                color: '#000000ff',
                padding: '12px 16px',
                borderRadius: 8,
                textAlign: 'center',
                minWidth: 220,
                boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
              }}
            >
              <div style={{ fontSize: 14, marginBottom: 8 }}>Load image to start editing</div>
              <Button
                size="small"
                variant="contained"
                onClick={() => setShowPopup(false)}
                sx={{
                  backgroundColor: '#525DDC',
                  color: '#ffffffff',
                  textTransform: 'none',
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  '&:hover': { backgroundColor: '#3b5998' }
                }}
              >
                OK
              </Button>
            </div>
          </div>
        )}

        {/* Download button */}
        <Button 
          color="primary" 
          variant="contained" 
          onClick={handleSave}
          aria-label="Download"
          sx={{ 
            position: 'absolute',
            bottom: 35,
            right: 50,
            zIndex: 20,
            textTransform: 'none'
          }}
        >
          DOWNLOAD
        </Button>

        {/* editor div */}
        <div
          ref={editorRef}
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        />
      </Box>

      {/* Preview and Save Controls */}
      {editedImage && (
        <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 3, zIndex: 9999 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <TextField
                label="Name for media"
                value={mediaName}
                onChange={(e) => setMediaName(e.target.value)}
                size="small"
                sx={{ width: 250 }}
              />
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary" onClick={handleDownloadAndUpload}>
                SAVE TO MEDIA
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

const mapDispatchToProps = (dispatch) => ({
  saveMedia: (data, cb) => dispatch(saveMedia(data, cb))
});

export default connect(null, mapDispatchToProps)(EditImage);
