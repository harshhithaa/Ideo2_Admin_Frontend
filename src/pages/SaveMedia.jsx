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
  justifyContent: 'center',    
  textAlign: 'center',         
  padding: '64px',           
  margin: 0,
  borderWidth: 2,
  borderRadius: 6,
  borderColor: '#e0e0e0',
  borderStyle: 'dashed',
  backgroundColor: '#ffffff',
  color: '#9e9e9e',
  transition: 'border .24s ease-in-out'
  ,
  minHeight: 320,           
  width: '100%',
  boxSizing: 'border-box'
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

  const uploadedLocallyRef = useRef(false);
  // ✅ Store uploaded media type to pass to Media List
  const uploadedMediaTypeRef = useRef(null);

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

  // ✅ Helper to determine media type from uploaded files
  const determineUploadedMediaType = () => {
    if (!files || files.length === 0) return null;

    // Check first file to determine type
    const firstFile = files[0];
    const type = (firstFile.type || '').toLowerCase();
    const name = (firstFile.name || '').toLowerCase();

    // Check for GIF
    if (type === 'image/gif' || type.includes('gif') || name.endsWith('.gif')) {
      return 'GIFS';
    }

    // Check for video
    if (type.startsWith('video/') || name.match(/\.(mp4|webm|ogg|mov)$/)) {
      return 'VIDEOS';
    }

    // Default to images
    return 'IMAGES';
  };

  // ✅ Navigate to Media Library with correct tab
  const goToMediaLibrary = () => {
    setOpenSnackbar(false);

    // Get the media type that was uploaded
    const targetTab = uploadedMediaTypeRef.current || 'IMAGES';

    // Navigate with state to tell Media List which tab to open
    navigate('/app/media', { 
      state: { 
        openTab: targetTab,
        fromUpload: true 
      } 
    });
  };

  // Update the saveMediaData function to include media type information
  function saveMediaData() {
    if (files.length === 0) {
      setSnackSeverity('error');
      setSnackMessage('Please select at least one file');
      setOpenSnackbar(true);
      return;
    }

    // Check for large files and warn user
    const largeFiles = files.filter(f => f.size > 500 * 1024 * 1024); // 500MB
    if (largeFiles.length > 0) {
      console.log(`⚠️ Uploading ${largeFiles.length} large file(s). This may take several minutes...`);
    }

    // ✅ Build placeholder metadata with correct media types
    const placeholders = files.map((f) => {
      const fileName = f.name || '';
      const fileType = (f.type || '').toLowerCase();
      
      // Determine media type based on file extension and MIME type
      let mediaType = 'image'; // default
      
      if (fileType.includes('gif') || fileName.toLowerCase().endsWith('.gif')) {
        mediaType = 'gif';
      } else if (fileType.startsWith('video/') || fileName.match(/\.(mp4|mov|avi|mkv|webm|ogg)$/i)) {
        mediaType = 'video';
      }
      
      return {
        MediaRef: `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: fileName,
        fileUrl: f.preview || null,
        fileMimetype: fileType,
        mediaType: mediaType,
        isProcessing: true,
        processingProgress: 0
      };
    });

    // ✅ CLEAR ANY EXISTING PLACEHOLDERS BEFORE SAVING NEW ONES
    try {
      localStorage.removeItem('IDEOGRAM_UPLOADED_MEDIA');
    } catch (e) {
      console.error('Error clearing old placeholders:', e);
    }

    // Store NEW placeholders in localStorage
    try {
      localStorage.setItem('IDEOGRAM_UPLOADED_MEDIA', JSON.stringify(placeholders));
    } catch (e) {
      console.error('Error saving placeholders to localStorage:', e);
    }

    // ✅ Determine and store media type before upload
    uploadedMediaTypeRef.current = determineUploadedMediaType();

    const formdata = new FormData();
    files.forEach((f) => formdata.append('Media', f.file));

    setUploading(true);
    setUploadProgress(0);
    uploadedLocallyRef.current = false;

    props.saveMedia(formdata, (err, progressEvent) => {
      if (progressEvent) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        
        // ✅ Only log every 20% to reduce console spam
        if (percent % 20 === 0 || percent === 100) {
          setUploadProgress(percent);
        }

        if (percent === 100 && !uploadedLocallyRef.current) {
          uploadedLocallyRef.current = true;
          console.log('✅ Upload complete');
          
          setUploading(false);
          setUploadProgress(100);
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
        return;
      }

      if (uploadedLocallyRef.current) {
        uploadedLocallyRef.current = false;
        return;
      }

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

      {/* Header - moved up visually without affecting layout below */}
      <div style={{ position: 'relative', top: '-60px', marginBottom: '8px', textAlign: 'center', width: '100%' }}>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 600,
            margin: 0,
            color: 'inherit',
            display: 'inline-block'
          }}
        >
          ADD MEDIA
        </h1>
      </div>

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
