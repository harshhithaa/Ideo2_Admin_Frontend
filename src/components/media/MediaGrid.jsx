import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Tabs,
  Tab,
  Checkbox,
  Typography
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

const MediaGrid = ({ media = [], setselected, query = '' }) => {
  const [selectedMediaRef, setSelectedMediaRef] = useState([]);
  const [activeTab, setActiveTab] = useState('images'); // default tab

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
    setselected(newSelected);
  };

  const buildSrc = (rawPath) => {
    if (!rawPath) return null;
    let p = String(rawPath);
    // normalize backslashes and trim
    p = p.replace(/\\/g, '/').trim();
    // skip obvious placeholders
    if (p.indexOf('undefined') !== -1) return null;
    // if already absolute
    if (/^https?:\/\//i.test(p)) return p;
    // if path is root relative
    if (p.startsWith('/')) return `${window.location.origin}${p}`;
    // if path looks like a relative URL, try to use origin as base
    try {
      return `${window.location.origin}/${encodeURI(p)}`;
    } catch (e) {
      return p;
    }
  };

  // categorize once (memoized).
  // If `query` is present, filter the source list by name first so search covers ALL categories,
  // then categorize — this allows auto-switching to "videos" when only videos match, etc.
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

  // Auto-switch rules:
  // - When a search is active and exactly one category has results, switch the active tab to it.
  // - When the query is cleared, do not keep a stale tab — optionally reset to 'images'.
  useEffect(() => {
    const q = (query || '').toString().trim();
    if (q === '') {
      // keep whatever tab user left (or optionally set to default)
      return;
    }

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
    // prefer server-provided thumbnail fields if present
    const thumb = buildSrc(item?.Thumbnail || item?.MediaThumb || item?.Poster || item?.ThumbPath || item?.Cover);
    const rawType = (item?.MediaType || '').toString().toLowerCase();
    const isVideo = rawType.startsWith('video') || (item?.MediaName || '').toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);

    const imgOnError = (e) => {
      // replace broken images with a simple placeholder div by hiding image
      e.currentTarget.style.display = 'none';
      const parent = e.currentTarget.parentElement;
      if (parent) {
        // insert placeholder node if not already
        if (!parent.querySelector('.ig-placeholder')) {
          const ph = document.createElement('div');
          ph.className = 'ig-placeholder';
          ph.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#f4f4f4;color:#999';
          ph.innerText = 'No media';
          parent.appendChild(ph);
        }
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
              // fallback: attempt to show first frame via video tag's poster when available;
              // if browser doesn't show frame, display a neutral placeholder with play icon overlay.
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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tab bar only (initial view like Google) */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        aria-label="media type tabs"
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderRadius: 1, bgcolor: 'transparent', mb: 2 }}
      >
        <Tab label="IMAGES" value="images" />
        <Tab label="VIDEOS" value="videos" />
        <Tab label="GIFs" value="gifs" />
      </Tabs>

      {/* Content panel */}
      <Box>
        {query && query.toString().trim() !== '' ? (
          (() => {
            const categoriesWithResults = [
              images && images.length > 0 ? 'images' : null,
              videos && videos.length > 0 ? 'videos' : null,
              gifs && gifs.length > 0 ? 'gifs' : null
            ].filter(Boolean);

            // If only one category matches, show that category (activeTab was auto-set by effect).
            if (categoriesWithResults.length === 1) {
              const list = activeTab === 'images' ? images : activeTab === 'videos' ? videos : gifs;
              return list.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">No {activeTab.toUpperCase()} found for "{query}".</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', pr: 2 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 2,
                      width: '100%'
                    }}
                  >
                    {list.map((it) => renderTile(it))}
                  </Box>
                </Box>
              );
            }

            // Multiple categories match -> show all sections
            return (
              <>
                {/* Images */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>IMAGES</Typography>
                  {images.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="body2">No IMAGES found for "{query}".</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', pr: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 2,
                          width: '100%'
                        }}
                      >
                        {images.map((it) => renderTile(it))}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Videos */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>VIDEOS</Typography>
                  {videos.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="body2">No VIDEOS found for "{query}".</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', pr: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 2,
                          width: '100%'
                        }}
                      >
                        {videos.map((it) => renderTile(it))}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* GIFs */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ mb: 1, color: 'text.primary', fontWeight: 600 }}>GIFs</Typography>
                  {gifs.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography variant="body2">No GIFs found for "{query}".</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', pr: 2 }}>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 2,
                          width: '100%'
                        }}
                      >
                        {gifs.map((it) => renderTile(it))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </>
            );
          })()
        ) : (
          (currentList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body1">No {activeTab.toUpperCase()} uploaded yet.</Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', pr: 2 }}>
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
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
};

MediaGrid.propTypes = {
  media: PropTypes.array,
  setselected: PropTypes.func.isRequired,
  query: PropTypes.string
};

export default MediaGrid;