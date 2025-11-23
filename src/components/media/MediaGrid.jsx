import React, { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Tabs,
  Tab,
  Checkbox,
  Typography,
  Button
} from '@mui/material';

const placeholderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f4f4f4',
  color: '#999',
  width: '100%',
  height: '100%'
};

const MediaGrid = ({ media = [], setselected, query = '', selected = [] }) => {
  const [selectedMediaRef, setSelectedMediaRef] = useState(Array.isArray(selected) ? selected : []);
  const [activeTab, setActiveTab] = useState('images'); // default tab

  // refs for animated indicator
  const tabsWrapperRef = useRef(null);
  const rafRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  // keep internal selection in sync with parent selected prop
  useEffect(() => {
    setSelectedMediaRef(Array.isArray(selected) ? selected : []);
  }, [selected]);

  const handleSelectOne = (event, MediaRef) => {
    event.stopPropagation();
    const selectedIndex = selectedMediaRef.indexOf(MediaRef);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedMediaRef, MediaRef);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedMediaRef.slice(1));
    } else if (selectedIndex === selectedMediaRef.length - 1) {
      newSelected = newSelected.concat(selectedMediaRef.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedMediaRef.slice(0, selectedIndex),
        selectedMediaRef.slice(selectedIndex + 1)
      );
    }
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

  // categorize once (memoized).
  const { images, videos, gifs } = useMemo(() => {
    const imgs = [], vids = [], gfs = [];
    if (!Array.isArray(media)) return { images: imgs, videos: vids, gifs: gfs };

    const q = (query || '').toString().trim().toLowerCase();
    const source = q === '' ? media : media.filter((m) => (m?.MediaName || '').toString().toLowerCase().includes(q));

    source.forEach((item) => {
      const rawType = (item?.MediaType || '').toString().toLowerCase();
      const name = (item?.MediaName || '').toLowerCase();
      const isGif = rawType.includes('gif') || name.endsWith('.gif');
      const isVideo = rawType.startsWith('video') || name.match(/\.(mp4|webm|ogg|mov)$/);
      const isImage = rawType.startsWith('image') && !isGif;

      if (isGif) gfs.push(item);
      else if (isVideo) vids.push(item);
      else if (isImage) imgs.push(item);
      else {
        if (name.endsWith('.gif')) gfs.push(item);
        else if (name.match(/\.(mp4|webm|ogg|mov)$/)) vids.push(item);
        else imgs.push(item);
      }
    });

    return { images: imgs, videos: vids, gifs: gfs };
  }, [media, query]);

  // Auto-switch rules
  useEffect(() => {
    const q = (query || '').toString().trim();
    if (q === '') return;
    const nonEmpty = [
      images && images.length > 0 ? 'images' : null,
      videos && videos.length > 0 ? 'videos' : null,
      gifs && gifs.length > 0 ? 'gifs' : null
    ].filter(Boolean);
    if (nonEmpty.length === 1 && activeTab !== nonEmpty[0]) {
      setActiveTab(nonEmpty[0]);
    }
  }, [query, images, videos, gifs, activeTab]);

  const renderTile = (item) => {
    const src = buildSrc(item?.MediaPath);
    const thumb = buildSrc(item?.Thumbnail || item?.MediaThumb || item?.Poster || item?.ThumbPath || item?.Cover);
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
        style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fff'
        }}
      >
        <Checkbox
          style={{ position: 'absolute', left: 8, top: 8, zIndex: 5, background: 'transparent' }}
          checked={selectedMediaRef.indexOf(item.MediaRef) !== -1}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleSelectOne(e, item.MediaRef)}
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

  const currentList = activeTab === 'images' ? images : activeTab === 'videos' ? videos : gifs;

  // visual constants
  const panelBg = 'rgba(25,118,210,0.03)';
  const activePanelBg = 'rgba(25,118,210,0.10)';
  const panelBorder = 'rgba(0,0,0,0.12)';
  const panelRadius = 8; // px

  // content area left transparent so only the animated rounded indicator shows.
  // This removes the large light rectangle behind the tabs.
  const contentWrapperSx = () => ({
    borderRadius: `${panelRadius}px`,
    backgroundColor: 'transparent',
    p: 2,
    border: 'none',
    mt: 0,
    overflow: 'visible',
    boxSizing: 'border-box',
    minHeight: 120
  });

  // measure tabs and update indicator
  useEffect(() => {
    const measure = () => {
      const wrapper = tabsWrapperRef.current;
      if (!wrapper) {
        setIndicator((s) => ({ ...s, opacity: 0 }));
        return;
      }
      const tabNodes = wrapper.querySelectorAll('[role="tab"]');
      const tabValues = ['images', 'videos', 'gifs'];
      const idx = Math.max(0, tabValues.indexOf(activeTab));
      const el = tabNodes[idx];
      if (el) {
        const containerRect = wrapper.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        const left = rect.left - containerRect.left + wrapper.scrollLeft;
        const width = rect.width;
        setIndicator({ left, width, opacity: 1 });
      } else {
        setIndicator((s) => ({ ...s, opacity: 0 }));
      }
    };

    // measure on next paint
    rafRef.current = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', measure);
    };
  }, [activeTab, media, query]);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Box
          sx={{
            width: '100%',
            maxWidth: 1100,
            borderRadius: 2,
            backgroundColor: 'transparent',
            p: 0,
            overflow: 'hidden',
            boxShadow: 'none'
          }}
        >
          {/* tabs area (moved down slightly) */}
          <Box sx={{ px: 2, pt: 1, mt: 2, position: 'relative' }}>
            <Box ref={tabsWrapperRef} sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                aria-label="media type tabs"
                textColor="primary"
                indicatorColor="primary"
                centered
                sx={{
                  mb: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  '& .MuiTabs-indicator': { display: 'none' }
                }}
              >
                <Tab
                  disableRipple
                  label="IMAGES"
                  value="images"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    mx: 1,
                    px: 2,
                    borderRadius: `${panelRadius}px ${panelRadius}px 0 0`,
                    zIndex: 3,
                    // force transparent selected bg so only the animated pill is visible
                    '&.Mui-selected': {
                      backgroundColor: 'transparent',
                      color: 'primary.main'
                    }
                  }}
                />
                <Tab
                  disableRipple
                  label="VIDEOS"
                  value="videos"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    mx: 1,
                    px: 2,
                    borderRadius: `${panelRadius}px ${panelRadius}px 0 0`,
                    zIndex: 3,
                    '&.Mui-selected': {
                      backgroundColor: 'transparent',
                      color: 'primary.main'
                    }
                  }}
                />
                <Tab
                  disableRipple
                  label="GIFs"
                  value="gifs"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    mx: 1,
                    px: 2,
                    borderRadius: `${panelRadius}px ${panelRadius}px 0 0`,
                    zIndex: 3,
                    '&.Mui-selected': {
                      backgroundColor: 'transparent',
                      color: 'primary.main'
                    }
                  }}
                />
              </Tabs>

              {/* animated pill indicator behind tabs */}
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  bottom: 6,
                  left: indicator.opacity ? `${indicator.left}px` : 0,
                  width: indicator.opacity ? `${indicator.width}px` : 0,
                  height: 36,
                  borderRadius: `${panelRadius}px`,
                  backgroundColor: activePanelBg,
                  transition: 'left 260ms cubic-bezier(.2,.8,.2,1), width 260ms cubic-bezier(.2,.8,.2,1), opacity 160ms ease-in-out',
                  opacity: indicator.opacity,
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />
            </Box>

            {/* Select all toggle — appears when there is at least one selected */}
            {selectedMediaRef && selectedMediaRef.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const visibleRefs = currentList.map((i) => i.MediaRef).filter(Boolean);
                  const allSelected = visibleRefs.length > 0 && visibleRefs.every((r) => selectedMediaRef.includes(r));
                  if (allSelected) {
                    const remaining = selectedMediaRef.filter((r) => !visibleRefs.includes(r));
                    setSelectedMediaRef(remaining);
                    if (typeof setselected === 'function') setselected(remaining);
                  } else {
                    const merged = Array.from(new Set([...selectedMediaRef, ...visibleRefs]));
                    setSelectedMediaRef(merged);
                    if (typeof setselected === 'function') setselected(merged);
                  }
                }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  minWidth: 84,
                  textTransform: 'none',
                  fontSize: 12,
                  zIndex: 3
                }}
              >
                Select all
              </Button>
            )}
          </Box>

          {/* Content area */}
          <Box sx={{ mt: 0, ...contentWrapperSx(activeTab) }}>
            <Box
              sx={{
                maxHeight: 'calc(100vh - 340px)',
                overflowY: 'auto',
                pr: 2,
                pb: 2
              }}
            >
              {currentList.length === 0 ? (
                <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>No matches found</Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 2,
                    width: '100%'
                  }}
                >
                  {currentList.map((it) => renderTile(it))}
                </Box>
              )}
             </Box>
           </Box>
         </Box>
       </Box>
     </Box>
   );
 };

MediaGrid.propTypes = {
  media: PropTypes.array,
  setselected: PropTypes.func.isRequired,
  query: PropTypes.string,
  selected: PropTypes.array
};

export default MediaGrid;