import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Checkbox, Typography, LinearProgress, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const placeholderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f4f4f4',
  color: '#999',
  width: '100%',
  height: '100%'
};

const MediaGrid = ({ media = [], setselected, selected = [], columns = 6 }) => {
  const [selectedMediaRef, setSelectedMediaRef] = useState(Array.isArray(selected) ? selected : []);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState(null);

  useEffect(() => {
    setSelectedMediaRef(Array.isArray(selected) ? selected : []);
  }, [selected]);

  const openViewer = (item) => {
    setViewerItem(item);
    setViewerOpen(true);
  };
  const closeViewer = () => { setViewerOpen(false); setViewerItem(null); };

  const toggleSelection = (MediaRef) => {
    const idx = selectedMediaRef.indexOf(MediaRef);
    let newSelected = [];
    if (idx === -1) newSelected = [...selectedMediaRef, MediaRef];
    else newSelected = selectedMediaRef.filter((r) => r !== MediaRef);
    setSelectedMediaRef(newSelected);
    if (typeof setselected === 'function') setselected(newSelected);
  };

  const buildSrc = (rawPath) => {
    if (!rawPath) return null;
    let p = String(rawPath);
    p = p.replace(/\\/g, '/').trim();
    if (p.indexOf('undefined') !== -1) return null;
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/')) return `${window.location.origin}${p}`;
    try {
      return `${window.location.origin}/${encodeURI(p)}`;
    } catch (e) {
      return p;
    }
  };

  const renderTile = (item) => {
    const src = buildSrc(item?.MediaPath);
    const thumb = buildSrc(item?.Thumbnail || item?.MediaThumb || item?.Poster);
    const rawType = (item?.MediaType || '').toString().toLowerCase();
    
    const isProcessing = item.isProcessing || item.processing || false;

    // ✅ ENHANCED TYPE DETECTION
    const isGif = rawType === 'gif' || 
                  rawType.includes('gif') || 
                  (item?.MediaName || '').toLowerCase().endsWith('.gif');
    
    const isVideo = rawType === 'video' || 
                    rawType.includes('video') ||
                    (item?.MediaName || '').toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);

    const imgOnError = (e) => {
      e.currentTarget.style.display = 'none';
      const parent = e.currentTarget.parentElement;
      if (parent && !parent.querySelector('.ig-placeholder')) {
        const ph = document.createElement('div');
        ph.className = 'ig-placeholder';
        ph.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#f4f4f4;color:#999';
        ph.innerText = 'No media';
        parent.appendChild(ph);
      }
    };

    return (
      <div
        key={item.MediaRef}
        onClick={() => toggleSelection(item.MediaRef)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSelection(item.MediaRef); }}
        style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fff',
          cursor: 'pointer',
          border: selectedMediaRef.indexOf(item.MediaRef) !== -1 ? '2px solid rgba(25,118,210,0.28)' : '1px solid rgba(0,0,0,0.06)',
          transition: 'border 0.2s ease'
        }}
      >
        <Checkbox
          checked={selectedMediaRef.indexOf(item.MediaRef) !== -1}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelection(item.MediaRef)}
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            zIndex: 5,
            color: '#fff',
            '& .MuiSvgIcon-root': { fontSize: 22 },
            // No border/background!
          }}
        />

        {/* Clicking this content opens viewer; stopPropagation prevents parent selection toggle */}
        <div
          style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#f4f4f4' }}
          onClick={(e) => { e.stopPropagation(); openViewer(item); }}
        >
           {isProcessing ? (
             <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
               <div style={{ width: '80%' }}>
                 <LinearProgress variant="determinate" value={30} />
               </div>
               <Typography variant="caption" sx={{ color: 'text.secondary' }}>Processing...</Typography>
             </div>
           ) : (
             isVideo ? (
               thumb ? (
                 <img
                   src={thumb}
                   alt={item.MediaName || item.MediaRef}
                   style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                   onError={imgOnError}
                 />
               ) : src ? (
                 <video
                  src={src}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                  preload="metadata"
                  muted
                  playsInline
                  onClick={(e) => { e.stopPropagation(); openViewer(item); }}
                />
               ) : (
                 <div style={{ position: 'absolute', inset: 0 }}>
                   <div style={placeholderStyle}>No media</div>
                 </div>
               )
             ) : (
               src ? (
                 <img
                   src={src}
                   alt={item.MediaName || item.MediaRef}
                   style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                   onError={imgOnError}
                   onClick={(e) => { e.stopPropagation(); openViewer(item); }}
                 />
               ) : (
                 <div style={{ position: 'absolute', inset: 0 }}>
                   <div style={placeholderStyle}>No media</div>
                 </div>
               )
             )
           )}
         </div>

         <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 13 }}>
           {item.MediaName}
         </div>
       </div>
     );
   };

  // Viewer modal UI
  const viewerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    maxWidth: '95vw',
    height: 400,
    maxHeight: '80vh',
    outline: 'none',
    bgcolor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const renderViewerContent = () => {
    if (!viewerItem) return null;
    const src = buildSrc(viewerItem?.MediaPath);
    const thumb = buildSrc(viewerItem?.Thumbnail || viewerItem?.MediaThumb || viewerItem?.Poster);
    const rawType = (viewerItem?.MediaType || '').toString().toLowerCase();
    const isVideo = rawType.includes('video') || (viewerItem?.MediaName || '').toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);

    if (isVideo) {
      return (
        <video
          src={src || thumb}
          controls
          style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 4, background: '#000' }}
        />
      );
    }
    return (
      <img
        src={src || thumb}
        alt={viewerItem.MediaName}
        style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 4, background: '#000' }}
      />
    );
  };

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {!media || media.length === 0 ? (
        <Box sx={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
          <Typography variant="body1">No media found</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap: 2,
            width: '100%'
          }}
        >
           {media.map((it) => renderTile(it))}
         </Box>
       )}
       <Modal open={viewerOpen} onClose={() => { setViewerOpen(false); setViewerItem(null); }}>
         <Box sx={viewerStyle}>
           <Box sx={{
             position: 'relative',
             bgcolor: '#fff', // White background
             p: 1,
             borderRadius: 2,
             width: '100%',
             height: '100%',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             border: '2px solid #e0e0e0', // Light border
             boxShadow: 6 // Subtle shadow
           }}>
             <IconButton
               size="small"
               onClick={() => closeViewer()}
               sx={{ position: 'absolute', right: 6, top: 6, zIndex: 10, color: '#333' }}
             >
               <CloseIcon />
             </IconButton>
             <Box sx={{
               width: '100%',
               height: '100%',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
               {renderViewerContent()}
             </Box>
           </Box>
         </Box>
       </Modal>
      </Box>
    );
  };
  
  MediaGrid.propTypes = {
    media: PropTypes.array,
    setselected: PropTypes.func.isRequired,
    selected: PropTypes.array
   , columns: PropTypes.number
  };
  
  export default MediaGrid;
