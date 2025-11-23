/* eslint-disable no-undef */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/prop-types */
/* eslint-enable no-alert, no-console */

import { Helmet } from 'react-helmet-async';
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Box,
  Snackbar,
  Grid,
  LinearProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { connect } from 'react-redux';
import { saveMedia } from '../store/action/user';
import { useNavigate } from 'react-router-dom';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '48px',
  margin: 0,
  borderWidth: 2,
  borderRadius: 6,
  borderColor: '#e0e0e0',
  borderStyle: 'dashed',
  backgroundColor: '#ffffff',
  color: '#9e9e9e',
  transition: 'border .24s ease-in-out'
};

const activeStyle = { borderColor: '#1976d2' };
const acceptStyle = { borderColor: '#00e676' };
const rejectStyle = { borderColor: '#ff1744' };

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 12
};

const thumb = {
  display: 'inline-flex',
  borderRadius: 4,
  border: '1px solid #eaeaea',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box',
  background: '#fff',
  position: 'relative'
};

const thumbInner = { display: 'flex', minWidth: 0, overflow: 'hidden', width: '100%', alignItems: 'center', justifyContent: 'center' };
const imgStyle = { display: 'block', width: 'auto', height: '100%' };

/* create a poster (object URL) for a video file by drawing a frame to canvas */
const generateVideoThumbnail = (file) =>
  new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        try { URL.revokeObjectURL(url); } catch (e) {}
        try { video.removeAttribute('src'); } catch (e) {}
      };

      const capture = () => {
        try {
          const canvas = document.createElement('canvas');
          const vw = video.videoWidth || 160;
          const vh = video.videoHeight || 90;
          const maxThumbWidth = 320;
          const scale = Math.min(1, maxThumbWidth / vw);
          canvas.width = Math.round(vw * scale);
          canvas.height = Math.round(vh * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbUrl = URL.createObjectURL(blob);
              cleanup();
              resolve(thumbUrl);
            } else {
              cleanup();
              resolve(null);
            }
          }, 'image/jpeg', 0.8);
        } catch (e) {
          cleanup();
          resolve(null);
        }
      };

      video.addEventListener('loadeddata', () => {
        const seekTime = 0.1;
        if (video.duration > seekTime) {
          const onSeeked = () => {
            capture();
            video.removeEventListener('seeked', onSeeked);
          };
          video.addEventListener('seeked', onSeeked);
          try { video.currentTime = seekTime; } catch (e) { capture(); }
        } else {
          capture();
        }
      });

      video.addEventListener('error', () => {
        cleanup();
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });

function SaveMedia(props) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [disableButton, setDisableButton] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackSeverity, setSnackSeverity] = useState('success');
  const [snackMessage, setSnackMessage] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // new ref to mark when we've handled 100% locally to avoid delay / duplicate handling
  const uploadedLocallyRef = useRef(false);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
    onDrop: async (acceptedFiles) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const processed = await Promise.all(
        acceptedFiles.map(async (file) => {
          const wrapper = {
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            isVideo: file.type && file.type.startsWith('video'),
            preview: null,
            originalPreview: null
          };

          if (wrapper.isVideo) {
            const poster = await generateVideoThumbnail(file);
            const originalUrl = URL.createObjectURL(file);
            wrapper.preview = poster || originalUrl;
            wrapper.originalPreview = originalUrl;
          } else {
            wrapper.preview = URL.createObjectURL(file);
          }

          return wrapper;
        })
      );

      setFiles((prev) => {
        const existing = new Set(prev.map((p) => `${p.name}_${p.size}`));
        const merged = prev.concat(processed.filter((p) => !existing.has(`${p.name}_${p.size}`)));
        return merged;
      });
      setDisableButton(false);
    }
  });

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [isDragActive, isDragAccept, isDragReject]);

  useEffect(() => {
    return () => {
      // cleanup object URLs on unmount
      files.forEach((f) => {
        try { if (f.preview) URL.revokeObjectURL(f.preview); } catch (e) {}
        try { if (f.originalPreview) URL.revokeObjectURL(f.originalPreview); } catch (e) {}
      });
    };
  }, [files]);

  const removeFile = (name, size) => {
    setFiles((prev) => {
      const toRemove = prev.filter((p) => p.name === name && p.size === size);
      const keep = prev.filter((p) => !(p.name === name && p.size === size));
      toRemove.forEach((f) => {
        try { if (f.preview) URL.revokeObjectURL(f.preview); } catch (e) {}
        try { if (f.originalPreview) URL.revokeObjectURL(f.originalPreview); } catch (e) {}
      });
      if (keep.length === 0) setDisableButton(true);
      return keep;
    });
  };

  const thumbs = files.map((f) => (
    <div key={`${f.name}_${f.size}`} style={thumb}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); removeFile(f.name, f.size); }}
        aria-label={`Remove ${f.name}`}
        style={{
          position: 'absolute',
          right: 4,
          top: 4,
          zIndex: 4,
          border: 'none',
          background: 'rgba(0,0,0,0.6)',
          color: '#fff',
          width: 20,
          height: 20,
          borderRadius: 10,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          padding: 0
        }}
      >
        ×
      </button>

      <div style={thumbInner}>
        <img src={f.preview} style={imgStyle} alt={f.name} />
      </div>

      <div style={{ position: 'absolute', bottom: -18, left: 0, width: '100%', textAlign: 'center', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {f.name}
      </div>
    </div>
  ));

  const inputProps = getInputProps();

  // helper to go to Media list and close dialog
  const goToMediaLibrary = () => {
    setOpenSnackbar(false);

    // 1) Try to find an in-app link (sidebar/menu) that already points to Media and follow it.
    //    This is robust across apps using different base paths (SPA or hash router).
    const anchor =
      document.querySelector('a[href*="/media"]') ||
      document.querySelector('a[href*="#/media"]') ||
      document.querySelector('a[href*="media"]');

    if (anchor) {
      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('#')) {
        // hash route
        window.location.hash = href.replace(/^#/, '');
        return;
      }
      if (href.startsWith('/')) {
        // SPA route — use router navigation
        navigate(href);
        return;
      }
      // fallback to full href
      window.location.href = href;
      return;
    }

    // 2) Fallback: try common routes. Use navigate() first (SPA). If your app uses hash routing,
    //    uncomment the hash fallback below.
    try {
      navigate('/media');
      return;
    } catch (e) {
      // nothing
    }

    // last resort: attempt hash-based navigation
    window.location.href = `${window.location.origin}/#/media`;
  };

  function saveMediaData() {
    if (files.length === 0) {
      setSnackSeverity('error');
      setSnackMessage('Please select at least one file');
      setOpenSnackbar(true);
      return;
    }

    const formdata = new FormData();
    files.forEach((f) => formdata.append('Media', f.file));

    setUploading(true);
    setUploadProgress(0);
    uploadedLocallyRef.current = false; // reset flag before upload

    props.saveMedia(formdata, (err, progressEvent) => {
      // progress events come here while uploading
      if (progressEvent) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);

        // Immediately treat 100% as uploaded for UI responsiveness
        if (percent === 100 && !uploadedLocallyRef.current) {
          uploadedLocallyRef.current = true;

          // Immediate success UI
          setUploading(false);
          setUploadProgress(100);
          setSnackSeverity('success');
          setSnackMessage('Media uploaded successfully. View it in Media Library.');
          setOpenSnackbar(true);

          // cleanup previews and clear selection
          files.forEach((f) => {
            try { if (f.preview) URL.revokeObjectURL(f.preview); } catch (e) {}
            try { if (f.originalPreview) URL.revokeObjectURL(f.originalPreview); } catch (e) {}
          });
          setFiles([]);
          setDisableButton(true);
        }
        return;
      }

      // final server callback (error or final success)
      // If we already handled 100% locally, just clear the flag and return
      if (uploadedLocallyRef.current) {
        uploadedLocallyRef.current = false;
        // final server validation could still report errors; if you want to react to server errors here,
        // add logic to show error snackbar if err exists. Currently we assume server will confirm soon.
        return;
      }

      // If no local 100% handling (edge cases), handle final result here
      setUploading(false);
      setUploadProgress(0);

      if (err?.exists) {
        setSnackSeverity('error');
        setSnackMessage(err.err || 'Upload failed');
        setOpenSnackbar(true);
      } else {
        setSnackSeverity('success');
        setSnackMessage('Media uploaded successfully. View it in Media Library.');
        setOpenSnackbar(true);
        files.forEach((f) => {
          try { if (f.preview) URL.revokeObjectURL(f.preview); } catch (e) {}
          try { if (f.originalPreview) URL.revokeObjectURL(f.originalPreview); } catch (e) {}
        });
        setFiles([]);
        setDisableButton(true);
      }
    });
  }

  return (
    <Grid container direction="column" sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Helmet><title>Add Media | Ideogram</title></Helmet>

      {/* Centered result dialog (success / error). Contains optional action to go to Media Library */}
      <Dialog
        open={openSnackbar}
        onClose={() => setOpenSnackbar(false)}
        aria-labelledby="upload-result-title"
      >
        <DialogTitle id="upload-result-title" sx={{ textAlign: 'center' }}>
          {snackSeverity === 'success' ? 'Success' : 'Notice'}
        </DialogTitle>
        <DialogContent sx={{ minWidth: 320, display: 'flex', justifyContent: 'center' }}>
          <Alert severity={snackSeverity} sx={{ width: '100%', textAlign: 'center' }}>
            {snackMessage}
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          {snackSeverity === 'success' && (
            <Button onClick={goToMediaLibrary} variant="contained" color="primary" size="small">
              Go to Media Library
            </Button>
          )}
          <Button onClick={() => setOpenSnackbar(false)} variant="outlined" size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Grid md={10} lg={12}>
        <div {...getRootProps({ style })}>
          <input {...inputProps} ref={inputRef} />

          {/* center choose button when no files */}
          {files.length === 0 && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 1, mb: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => { e.stopPropagation(); if (inputRef.current) inputRef.current.click(); }}
                sx={{ textTransform: 'none', borderRadius: 1, borderColor: '#cccccc', color: '#333333', backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                Choose Media
              </Button>
            </Box>
          )}

          {uploading && (
            <Box sx={{ width: '60%', mx: 'auto', my: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="body2" sx={{ mt: 1, color: '#1976d2', textAlign: 'center' }}>{uploadProgress}% Uploaded</Typography>
            </Box>
          )}

          <p style={{ color: '#9e9e9e', textAlign: 'center' }}>Drag and Drop your media here, or click to select</p>

          {/* choose button above thumbnails when files exist */}
          {files.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => { e.stopPropagation(); if (inputRef.current) inputRef.current.click(); }}
                sx={{ textTransform: 'none', borderRadius: 1, borderColor: '#cccccc', color: '#333333', backgroundColor: 'rgba(255,255,255,0.95)' }}
              >
                Choose Media
              </Button>
            </Box>
          )}

          <section>
            <aside style={thumbsContainer}>{thumbs}</aside>
          </section>
        </div>
      </Grid>

      <Grid sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
        <Button
          color="primary"
          size="large"
          variant="contained"
          onClick={saveMediaData}
          disabled={disableButton || uploading}
          sx={{
            backgroundColor: '#1976d2',
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1,
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0px 2px 6px rgba(0,0,0,0.12)',
            '&:hover': { backgroundColor: '#1565c0' },
            '&.Mui-disabled': { backgroundColor: '#90caf9', color: '#fff', opacity: 0.8 }
          }}
        >
          Upload Media
        </Button>
      </Grid>
    </Grid>
  );
}

const mapDispatchToProps = (dispatch) => ({
  saveMedia: (data, callback) => dispatch(saveMedia(data, callback))
});

export default connect(null, mapDispatchToProps)(SaveMedia);
