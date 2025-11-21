import React, { useRef, useState, useEffect, useMemo } from 'react';
import ImageEditor from '@toast-ui/react-image-editor';
import { useLocation } from 'react-router-dom';
import short from 'short-uuid';
import { connect } from 'react-redux';
import { saveMedia } from '../store/action/user';
import { Button, Box, Snackbar, Alert, TextField, Grid } from '@mui/material';

const uuid = short.generate();

const EditImage = ({ saveMedia: uploadMedia }) => {
  const location = useLocation();
  const editorRef = useRef(null);
  const objUrlRef = useRef(null); // for local File objectURL cleanup
  const fileInputRef = useRef(null); // new: trigger file picker when arriving with openPicker
  const [snack, setSnack] = useState({ open: false, severity: 'success', msg: '' });

  const [mediaName, setMediaName] = useState(''); // <<-- new: name input

  // location.state may be either a string (old behavior) or object { src, file, preset }
  const incoming = location.state;
  const imagePath = (incoming && typeof incoming === 'object') ? (incoming.src || '') : (incoming || '');

  // Create an initial load path synchronously so ImageEditor mounts with the image
  // For local Files create an object URL and keep reference for cleanup.
  const initialLoadPath = useMemo(() => {
    if (incoming && typeof incoming === 'object' && incoming.file instanceof File) {
      try {
        if (objUrlRef.current) {
          URL.revokeObjectURL(objUrlRef.current);
        }
      } catch (e) {}
      objUrlRef.current = URL.createObjectURL(incoming.file);
      return objUrlRef.current;
    }
    return imagePath || '';
  }, [incoming, imagePath]);

  // Programmatically load the image and run a small UI fix so tools become active
  useEffect(() => {
    if (!initialLoadPath) return;

    let mounted = true;
    let attempts = 0;

    const tryLoad = async () => {
      const inst = editorRef.current && editorRef.current.getInstance && editorRef.current.getInstance();
      if (!inst) {
        if (attempts++ < 20 && mounted) {
          setTimeout(tryLoad, 150);
        }
        return;
      }

      try {
        // load programmatically (mirrors clicking Load)
        await inst.loadImageFromURL(initialLoadPath, (incoming && incoming.file && incoming.file.name) || uuid);

        // post-load housekeeping to ensure UI/tools are active:
        // clear undo/redo, stop any drawing mode and nudge UI menus to bind events
        try {
          if (typeof inst.clearUndoStack === 'function') inst.clearUndoStack();
          if (typeof inst.clearRedoStack === 'function') inst.clearRedoStack();
          if (typeof inst.stopDrawingMode === 'function') inst.stopDrawingMode();
        } catch (e) { /* non-critical */ }

        // force a mild menu toggle to ensure the UI attaches handlers
        try {
          if (inst.ui && typeof inst.ui.changeMenu === 'function') {
            inst.ui.changeMenu('text');
            setTimeout(() => inst.ui.changeMenu(''), 100);
          }
        } catch (e) { /* non-critical */ }
      } catch (err) {
        // console.error('Auto-load failed', err);
      }
    };

    tryLoad();

    return () => {
      mounted = false;
    };
  }, [initialLoadPath, incoming, uuid]);

  // auto-open file picker when user arrived from "Add your own image"
  useEffect(() => {
    if (incoming && incoming.openPicker && fileInputRef.current) {
      // small timeout so page/editor mounts first
      setTimeout(() => {
        try { fileInputRef.current.click(); } catch (e) {}
      }, 120);
    }
  }, [incoming]);

  // handle file chosen in editor page (either auto-opened or manual)
  const onLocalFileChosen = async (e) => {
    const file = e?.target?.files && e.target.files[0];
    if (!file) return;
    try {
      // revoke old object url
      try { if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current); } catch (err) {}
      objUrlRef.current = URL.createObjectURL(file);

      // wait for editor instance
      let attempts = 0;
      const waitAndLoad = async () => {
        const inst = editorRef.current && editorRef.current.getInstance && editorRef.current.getInstance();
        if (!inst) {
          if (attempts++ < 20) {
            setTimeout(waitAndLoad, 100);
          }
          return;
        }
        await inst.loadImageFromURL(objUrlRef.current, file.name || uuid);

        // post-load housekeeping so tools become active
        try {
          if (typeof inst.clearUndoStack === 'function') inst.clearUndoStack();
          if (typeof inst.clearRedoStack === 'function') inst.clearRedoStack();
          if (typeof inst.stopDrawingMode === 'function') inst.stopDrawingMode();
          if (inst.ui && typeof inst.ui.changeMenu === 'function') {
            inst.ui.changeMenu('text');
            setTimeout(() => inst.ui.changeMenu(''), 80);
          }
        } catch (e) { /* non-critical */ }
      };
      waitAndLoad();

      // clear file input so same file can be selected again later
      e.target.value = null;
    } catch (err) {
      console.error(err);
    }
  };

  // DOWNLOAD & SAVE: export image, download in browser and upload to server
  const handleDownloadAndUpload = async () => {
    try {
      const inst = editorRef.current && editorRef.current.getInstance && editorRef.current.getInstance();
      if (!inst) throw new Error('Editor not ready');

      const dataUrl = inst.toDataURL();
      if (!dataUrl) throw new Error('Failed to export image');

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const safeName = (mediaName && mediaName.trim()) ? mediaName.trim() : `edited_${uuid}`;
      const filename = `${safeName}.png`;

      // download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // upload
      const formdata = new FormData();
      const file = new File([blob], filename, { type: blob.type });
      formdata.append('Media', file);

      uploadMedia(formdata, (err) => {
        if (err?.exists) {
          setSnack({ open: true, severity: 'error', msg: err.err || 'Upload failed' });
        } else {
          setSnack({ open: true, severity: 'success', msg: 'Image downloaded and uploaded to media' });
        }
      });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, severity: 'error', msg: e.message || 'Operation failed' });
    }
  };

  // revoke object URL on unmount to avoid leaks
  useEffect(() => {
    return () => {
      try { if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; } } catch (e) {}
    };
  }, []);

  return (
    <Box sx={{ position: 'relative', maxWidth: 1200, mx: 'auto' }}>
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity}>
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* hidden file input used when user clicks "Add your own image" on Create Media */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onLocalFileChosen}
        style={{ display: 'none' }}
      />

      <ImageEditor
        ref={editorRef}
        includeUI={{
          // keep path empty and load programmatically above (this ensures editable state)
          loadImage: { path: '', name: uuid },
          theme: {
            'menu.normalIcon.color': '#ffffff',
            'menu.activeIcon.color': '#ffffff',
            'menu.disabledIcon.color': '#ffffff',
            'menu.hoverIcon.color': '#ffffff',
            'submenu.normalIcon.color': '#ffffff',
            'submenu.activeIcon.color': '#000000'
          },
          menu: ['text','draw','mask','rotate','crop','flip','shape','icon','filter'],
          initMenu: 'text',
          uiSize: { width: '100%', height: '600px' },
          menuBarPosition: 'right'
        }}
        cssMaxHeight={600}
        cssMaxWidth={1100}
        selectionStyle={{ cornerSize: 20, rotatingPointOffset: 70 }}
        usageStatistics={false}
      />

      {/* controls: name input (left) + Download&Save (centered with the input) */}
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={10} sm={6} md={4} lg={3}>
            <TextField
              fullWidth
              label="Name for media"
              value={mediaName}
              onChange={(e) => setMediaName(e.target.value)}
              size="small"
            />
          </Grid>

          <Grid item xs="auto">
            <Button variant="contained" color="primary" onClick={handleDownloadAndUpload}>
              DOWNLOAD & SAVE
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const mapDispatchToProps = (dispatch) => ({
  saveMedia: (data, cb) => dispatch(saveMedia(data, cb))
});

export default connect(null, mapDispatchToProps)(EditImage);
