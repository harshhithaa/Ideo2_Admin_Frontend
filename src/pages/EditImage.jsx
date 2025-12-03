import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { saveMedia } from '../store/action/user';
import ImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';
import 'tui-color-picker/dist/tui-color-picker.css';
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
  // For keeping selected object stable across UI/layout changes
  const selectedStateRef = useRef({
    obj: null,
    normX: 0,
    normY: 0,
    scaleX: 1,
    scaleY: 1,
    canvasWidth: 0,
    canvasHeight: 0
  });
  const resizeObserverRef = useRef(null);
  const [snack, setSnack] = useState({ open: false, severity: 'success', msg: '' });
  const [mediaName, setMediaName] = useState('');
  const [editedImage, setEditedImage] = useState(null);
  
  // Layer management
  const [backgroundLayer, setBackgroundLayer] = useState(null);
  const fileInputRef = useRef(null);
  const autoPickerTriggeredRef = useRef(false);
  
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
            // ✅ Color picker theme
            'header.display': 'none',
            'menu.normalIcon.color': '#8a8a8a',
            'menu.activeIcon.color': '#555555',
            'menu.disabledIcon.color': '#434343',
            'menu.hoverIcon.color': '#e9e9e9',
            'submenu.backgroundColor': '#1e1e1e',
            'submenu.partition.color': '#858585',
            'colorpicker.button.border': '1px solid #1e1e1e',
            'colorpicker.title.color': '#fff'
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
      
      // Stabilizer: keep selected objects static when layout/toolbar changes size
      const setupCanvasStabilizer = () => {
        try {
          const canvas = editorInstance.current._graphics.getCanvas();
          // initialize stored canvas size
          selectedStateRef.current.canvasWidth = canvas.getWidth();
          selectedStateRef.current.canvasHeight = canvas.getHeight();
          
          // record normalized position / scale when selection or transform happens
          canvas.on('object:selected', function(e) {
            const obj = e.target;
            if (!obj) return;
            const cw = canvas.getWidth(), ch = canvas.getHeight();
            selectedStateRef.current.obj = obj;
            selectedStateRef.current.normX = obj.left / cw;
            selectedStateRef.current.normY = obj.top / ch;
            selectedStateRef.current.scaleX = obj.scaleX;
            selectedStateRef.current.scaleY = obj.scaleY;
            selectedStateRef.current.canvasWidth = cw;
            selectedStateRef.current.canvasHeight = ch;
          });
          
          // keep normalized values updated during moves / scales
          canvas.on('object:moving', function(e) {
            const obj = e.target;
            const cw = canvas.getWidth(), ch = canvas.getHeight();
            selectedStateRef.current.normX = obj.left / cw;
            selectedStateRef.current.normY = obj.top / ch;
            selectedStateRef.current.scaleX = obj.scaleX;
            selectedStateRef.current.scaleY = obj.scaleY;
          });
          canvas.on('object:scaling', function(e) {
            const obj = e.target;
            selectedStateRef.current.scaleX = obj.scaleX;
            selectedStateRef.current.scaleY = obj.scaleY;
          });
          
          // observe container size changes and reapply normalized position/scale
          resizeObserverRef.current = new ResizeObserver(() => {
            if (!editorInstance.current) return;
            const c = editorInstance.current._graphics.getCanvas();
            const newW = c.getWidth(), newH = c.getHeight();
            const s = selectedStateRef.current;
            if (s.obj && s.canvasWidth && s.canvasHeight) {
              const scaleFactorW = newW / s.canvasWidth;
              const scaleFactorH = newH / s.canvasHeight;
              s.obj.set({
                left: s.normX * newW,
                top: s.normY * newH,
                scaleX: s.scaleX * scaleFactorW,
                scaleY: s.scaleY * scaleFactorH
              });
              s.obj.setCoords();
              c.renderAll();
              // update stored canvas size for next change
              s.canvasWidth = newW;
              s.canvasHeight = newH;
            }
          });
          
          // observe the editor container for layout changes
          if (editorRef.current && resizeObserverRef.current) {
            resizeObserverRef.current.observe(editorRef.current);
          }
        } catch (err) {
          console.warn('Canvas stabilizer setup failed', err);
        }
      };
      
      // call stabilizer after initialization
      setupCanvasStabilizer();
      
      // Wait for editor to fully initialize
      setTimeout(() => {
        const downloadBtn = document.querySelector('.tui-image-editor-download-btn');
        if (downloadBtn) {
          downloadBtn.style.display = 'none';
        }

        // ✅ FIXED: Only trigger Load button, DON'T set up custom handler yet
        if (incoming?.openPicker && !incoming?.src) {
          const loadBtn = document.querySelector('.tui-image-editor-load-btn');
          if (loadBtn) {
            console.log('Auto-triggering Load button for file picker');
            // Guard: ensure we trigger the load button only once
            if (!autoPickerTriggeredRef.current) {
              loadBtn.click(); // triggers Toast UI's built-in load functionality
              autoPickerTriggeredRef.current = true;
            } else {
              console.log('Load button auto-trigger suppressed (already triggered)');
            }
            
            // ✅ Set up custom handler ONLY after Load button finishes (Toast UI handles first load)
            editorInstance.current.on('addText', () => {}); // Wake up event system
            editorInstance.current.on('loadImage', function handleFirstLoad() {
              console.log('First image loaded - now setting up custom handler');
              setBackgroundLayer(editorInstance.current.toDataURL());
              
              // Remove this listener so it doesn't fire again
              editorInstance.current.off('loadImage', handleFirstLoad);
              
              // NOW set up the custom handler for subsequent loads
              setTimeout(() => {
                const fileInput = document.querySelector('input[type="file"][accept="image/*"]');
                if (fileInput) {
                  fileInputRef.current = fileInput;
                  setupCustomLayerHandler(fileInput);
                }
              }, 300);
            });
          }
        } 
        // ✅ If there's already a background, set up custom handler immediately
        else if (incoming?.src) {
          const fileInput = document.querySelector('input[type="file"][accept="image/*"]');
          if (fileInput) {
            fileInputRef.current = fileInput;
            setupCustomLayerHandler(fileInput);
          }
        }
      }, 500);
    }
    
    // ✅ Custom handler function - extracted outside
    const setupCustomLayerHandler = (fileInput) => {
      console.log('Setting up custom layer handler');
      const originalOnChange = fileInput.onchange;
      
      fileInput.onchange = function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          
          reader.onload = function(event) {
            const imageUrl = event.target.result;
            
            // If background exists, add new image as a layer
            if (backgroundLayer && editorInstance.current) {
              const tempImg = new Image();
              tempImg.onload = function() {
                const canvasSize = editorInstance.current.getCanvasSize();
                const maxWidth = canvasSize.width * 0.5;
                const maxHeight = canvasSize.height * 0.5;
                
                const ratio = Math.min(maxWidth / tempImg.width, maxHeight / tempImg.height);
                const width = tempImg.width * ratio;
                const height = tempImg.height * ratio;
                
                editorInstance.current.addIcon('customIcon', {
                  left: (canvasSize.width - width) / 2,
                  top: (canvasSize.height - height) / 2,
                  fill: 'transparent',
                  stroke: 'transparent',
                  strokeWidth: 0,
                  opacity: 1
                }).then(() => {
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
                    
                    console.log('Image added as layer');
                  });
                }).catch(err => {
                  console.error('Error adding layer:', err);
                  if (originalOnChange) {
                    originalOnChange.call(fileInput, e);
                  }
                });
              };
              tempImg.src = imageUrl;
            } else {
              // No background - load as main image
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
    };

    // Cleanup on unmount
    return () => {
      if (editorInstance.current) {
        editorInstance.current.off('loadImage');
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect();
        } catch (e) {}
        resizeObserverRef.current = null;
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
             height: '100% !important',
             overflow: 'hidden !important' /* remove internal scroller */
           },
           /* Prevent internal menus/submenus from creating scrollbars */
           '& .tui-image-editor-main, & .tui-image-editor-menu-wrap, & .tui-image-editor-submenu, & .tui-image-editor-header': {
             overflow: 'visible !important',
             maxHeight: 'none !important'
           },
           position: 'relative'
         }}
       >
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
