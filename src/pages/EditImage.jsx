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
  Typography
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

  // Initialize Toast UI Image Editor immediately when component mounts
  useEffect(() => {
    const incoming = location.state;
    
    // If user came from "Open Editor" button, initialize blank editor
    if (incoming?.openPicker && editorRef.current && !editorInstance.current) {
      editorInstance.current = new ImageEditor(editorRef.current, {
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
          initMenu: 'filter',
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
      });
    } 
    // If an image was passed, load it
    else if (incoming?.src && editorRef.current && !editorInstance.current) {
      editorInstance.current = new ImageEditor(editorRef.current, {
        includeUI: {
          loadImage: {
            path: incoming.src,
            name: 'EditImage'
          },
          theme: {
            'common.bi.image': '',
            'common.bisize.width': '0px',
            'common.bisize.height': '0px',
            'common.backgroundImage': 'none',
            'common.backgroundColor': '#1e1e1e',
            'common.border': '0px',
          },
          menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
          initMenu: 'filter',
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
      });
    }

    // Cleanup on unmount
    return () => {
      if (editorInstance.current) {
        editorInstance.current.destroy();
        editorInstance.current = null;
      }
    };
  }, [location.state]);

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
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity}>
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* Top App Bar */}
      <AppBar position="relative" sx={{ backgroundColor: '#2b2b2b', color: '#fff' }}>
        <Toolbar>
          <Typography sx={{ flex: 1 }} variant="h6" component="div">
            TOAST UI Image Editor
          </Typography>
          <Button 
            color="primary" 
            variant="contained" 
            onClick={handleSave}
            sx={{ mr: 2 }}
          >
            Download
          </Button>
          <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Editor Container - Full Screen */}
      <Box 
        sx={{ 
          flex: 1, 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden',
          bgcolor: '#1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          '& .tui-image-editor-canvas-container': {
            overflow: 'hidden !important'
          },
          '& .tui-image-editor': {
            overflow: 'hidden !important'
          }
        }}
      >
        <div ref={editorRef} style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', overflow: 'hidden' }} />
      </Box>

      {/* Preview and Save Controls - Only show after save */}
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
