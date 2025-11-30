import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Checkbox, Typography } from '@mui/material';

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

  useEffect(() => {
    setSelectedMediaRef(Array.isArray(selected) ? selected : []);
  }, [selected]);

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
    const isVideo = rawType.startsWith('video') || (item?.MediaName || '').toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);

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
          style={{ position: 'absolute', left: 8, top: 8, zIndex: 5, background: 'transparent' }}
          checked={selectedMediaRef.indexOf(item.MediaRef) !== -1}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelection(item.MediaRef)}
        />

        <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: '#f4f4f4' }}>
          {isVideo ? (
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
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0 }}>
                <div style={placeholderStyle}>No media</div>
              </div>
            )
          )}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px', background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: 13 }}>
          {item.MediaName}
        </div>
      </div>
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
 