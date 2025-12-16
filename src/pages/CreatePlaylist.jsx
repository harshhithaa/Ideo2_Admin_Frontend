/* eslint-disable linebreak-style */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-sequences */
/* eslint-disable react/prop-types */
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Formik } from 'formik';
import React, { useState, useEffect, useRef } from 'react';
import CardMedia from '@mui/material/CardMedia';
import { Alert, Stack, Checkbox, Snackbar } from '@mui/material';
import { Box, Button, Container, TextField, Typography, Grid, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, InputAdornment } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LockIcon from '@mui/icons-material/Lock';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant.jsx';
import MediaGrid from 'src/components/media/MediaGrid';
import { getUserComponentListWithPagination, savePlaylist } from '../store/action/user';

const VideoThumbnail = ({ videoUrl, alt }) => {
  const videoRef = React.useRef(null);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
        muted
        playsInline
      />
    </Box>
  );
};

const DESCRIPTION_MAX_LENGTH = 45;

const CreatePlaylist = (props) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [type] = useState(
    state && state.type === 'View'
      ? 'View'
      : state && state.type === 'Edit'
      ? 'Edit'
      : 'Create'
  );

  const { component } = props || {};
  const [title, setTitle] = useState((state && state.Name) || '');
  const [description, setDescription] = useState((state && state.Description) || '');
  const [media, setMedia] = useState([]);
  const [id] = useState((state && state.PlaylistRef) || '');

  // FIXED: Store complete media objects with all metadata
  const [playlistMedia, setplaylistMedia] = useState([]);
  const [deletedplaylistMedia, setdeletedplaylistMedia] = useState([]);
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [selectionCounter, setSelectionCounter] = useState(1);

  // FIXED: Global media metadata store - never reset this
  const [globalMediaMetadata, setGlobalMediaMetadata] = useState({});

  const [loader, setloader] = useState(false);
  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('image');
  const [searchQuery, setSearchQuery] = useState('');
  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');
  // legacy flag removed in favour of a message-driven snackbar so we can show both min/max messages
  // const [durationError, setDurationError] = useState(false);
  const [durationSnackbar, setDurationSnackbar] = useState({ open: false, message: '' });
  // ensure snackbar reliably re-opens every time by toggling closed->open
  const _snackTimerRef = useRef(null);
  const showDurationSnackbar = (msg) => {
    // clear any pending reopen timer
    if (_snackTimerRef.current) {
      clearTimeout(_snackTimerRef.current);
      _snackTimerRef.current = null;
    }
    // force-close first so opening same message always retriggers
    setDurationSnackbar({ open: false, message: '' });
    // small delay to allow Snackbar to actually close, then open with message
    _snackTimerRef.current = setTimeout(() => {
      setDurationSnackbar({ open: true, message: msg });
      _snackTimerRef.current = null;
    }, 50);
  };
  useEffect(() => {
    return () => {
      if (_snackTimerRef.current) {
        clearTimeout(_snackTimerRef.current);
        _snackTimerRef.current = null;
      }
    };
  }, []);

  const [durationMode, setDurationMode] = useState('Default');
  const [defaultDuration, setDefaultDuration] = useState(10);
  const [durationsValid, setDurationsValid] = useState(false);
  
  const panelBg = 'rgba(25,118,210,0.03)';
  const panelRadius = 8;
  const panelBorder = 'rgba(0,0,0,0.02)';
  const cardBorder = 'rgba(0,0,0,0.06)';

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchMedia = (page = currentPage, size = pageSize, mediaType = mediaTypeFilter, search = searchQuery) => {
    setLoading(true);
    const requestData = {
      componentType: COMPONENTS.Media,
      pageNumber: page,
      pageSize: size,
      mediaType: mediaType,
      searchText: search,
      isActive: 1,
      userId: null
    };

    props.getUserComponentListWithPagination(requestData, (res) => {
      setLoading(false);
      if (!res || res.exists) {
        setMedia([]);
        setMediaData([]);
        setTotalRecords(0);
        return;
      }
      const list = (res.data && res.data.ComponentList) || [];
      const total = (list.length && list[0].TotalRecords) ? Number(list[0].TotalRecords) : (res.data && res.data.TotalRecords) || 0;
      setMedia(list);
      setMediaData(list);
      setTotalRecords(total);

      // FIXED: Update global metadata store with new media
      const newMetadata = {};
      list.forEach((item) => {
        if (item.MediaRef) {
          newMetadata[item.MediaRef] = extractMediaMetadata(item);
        }
      });
      setGlobalMediaMetadata((prev) => ({ ...prev, ...newMetadata }));
    });
  };

  // FIXED: Extract complete metadata from media item
  const extractMediaMetadata = (item) => {
    return {
      MediaRef: item.MediaRef,
      MediaName: item.MediaName || item.fileName || item.FileName || item.Name || item.name || item.Title || item.title || 'Unknown Media',
      MediaPath: item.MediaPath || item.fileUrl || item.FileUrl || item.FileURL || item.url || '',
      // ✅ ENSURE THUMBNAIL IS PROPERLY EXTRACTED FOR VIDEOS
      Thumbnail: item.Thumbnail || item.thumbnailUrl || item.ThumbnailUrl || item.posterFrame || item.Poster || item.MediaThumb || (item.MediaType?.toLowerCase().includes('video') ? item.MediaPath : item.MediaPath) || item.fileUrl || '',
      MediaType: item.MediaType || item.FileType || item.fileMimetype || item.FileMimetype || 'unknown',
      FileMimetype: item.fileMimetype || item.FileMimetype || item.FileType || item.MediaType || '',
      DurationSeconds: item.DurationSeconds || item.durationSeconds || item.Duration || null
    };
  };

  useEffect(() => {
    fetchMedia(1, pageSize, mediaTypeFilter, '');
    setCurrentPage(1);
  }, [mediaTypeFilter]);

  useEffect(() => {
    fetchMedia(currentPage, pageSize, mediaTypeFilter, searchQuery);
  }, [currentPage, pageSize, searchQuery]);

  const isVideoRef = (mediaRef) => {
    // Safe checks against stored metadata first (guard against missing fields)
    const meta = globalMediaMetadata[mediaRef];
    if (meta && meta.MediaType) {
      const mm = String(meta.MediaType).toLowerCase();
      if (mm.includes('video')) return true;
      if (mm.includes('image')) return false;
    }

    // Fallback to current mediaData with robust string coercion
    const item = mediaData.find((m) => m.MediaRef === mediaRef);
    if (!item) return false;
    const mm2 = String(item.fileMimetype || item.FileMimetype || item.FileType || item.MediaType || '').toLowerCase();
    if (mm2.includes('video')) return true;
    if (mm2.includes('image')) return false;
    const url = String(item.fileUrl || item.FileUrl || item.FileURL || '').toLowerCase();
    if (/\.(mp4|mov|webm|mkv)$/.test(url)) return true;
    return false;
  };

  const onGridSelectionChange = (newSelected) => {
    const added = newSelected.filter((r) => !selectedRefs.includes(r));
    const removed = selectedRefs.filter((r) => !newSelected.includes(r));

    if (added.length) {
      setplaylistMedia((prev) => {
        let next = [...prev];
        added.forEach((ref) => {
          if (!next.find((p) => p.MediaRef === ref)) {
            const newSelId = selectionCounter;
            const isVideo = isVideoRef(ref);
            const durationForNew = isVideo ? null : (durationMode === 'Default' ? Number(defaultDuration) : 10);
            
            // FIXED: Store complete media object, not just ref
            const mediaItem = mediaData.find((m) => m.MediaRef === ref) || globalMediaMetadata[ref];
            const fullMediaObject = {
              MediaRef: ref,
              IsActive: 1,
              SelectionId: newSelId,
              Duration: durationForNew,
              // Store all metadata
              ...extractMediaMetadata(mediaItem || { MediaRef: ref })
            };
            
            next.push(fullMediaObject);
            setSelectionCounter((c) => c + 1);
          }
        });
        return next;
      });
    }

    if (removed.length) {
      setplaylistMedia((prev) => {
        let next = [...prev];
        removed.forEach((ref) => {
          const idx = next.findIndex((p) => p.MediaRef === ref);
          if (idx !== -1) {
            const [item] = next.splice(idx, 1);
            setdeletedplaylistMedia((d) => [...d, { 
              MediaRef: item.MediaRef, 
              IsActive: 0, 
              SelectionId: item.SelectionId, 
              Duration: item.Duration || null 
            }]);
          }
        });
        return next;
      });
    }

    setSelectedRefs(newSelected);
  };

  function removeSelection(selectionId) {
    setplaylistMedia((prev) => {
      const toRemove = prev.find((p) => p.SelectionId === selectionId);
      if (!toRemove) return prev;

      setdeletedplaylistMedia((delPrev) => [
        ...delPrev,
        { MediaRef: toRemove.MediaRef, IsActive: 0, SelectionId: selectionId, Duration: toRemove.Duration || null }
      ]);

      setSelectedRefs((s) => s.filter((r) => r !== toRemove.MediaRef));
      return prev.filter((p) => p.SelectionId !== selectionId);
    });
  }

  function adjustDuration(mediaRef, delta) {
    setplaylistMedia((prev) =>
      prev.map((p) => {
        if (p.MediaRef !== mediaRef) return p;
        if (isVideoRef(mediaRef)) return p;
        let current = Number(p.Duration || 10);
        let next = current + delta;

        if (next < 5) {
          showDurationSnackbar('Duration must be at least 5 seconds');
          next = 5;
        } else if (next > 60) {
          // show popup when attempting to go above 60 (including clicking + at 60)
          showDurationSnackbar('Duration cannot exceed 60 seconds');
          next = 60;
        }

        return { ...p, Duration: next };
      })
    );
  }

  function onDurationInputChange(mediaRef, value) {
    if (value === '') {
      setplaylistMedia((prev) =>
        prev.map((p) => (p.MediaRef === mediaRef ? { ...p, Duration: '' } : p))
      );
      return;
    }

    // allow only digits while typing — do NOT validate/correct here
    const digitsOnly = /^\d+$/.test(value);
    if (!digitsOnly) {
      return;
    }

    // store raw typed value (string) so user can finish typing
    setplaylistMedia((prev) =>
      prev.map((p) => (p.MediaRef === mediaRef ? { ...p, Duration: value } : p))
    );
  }

  function onDurationBlur(mediaRef) {
    setplaylistMedia((prev) =>
      prev.map((p) => {
        if (p.MediaRef !== mediaRef) return p;
        if (isVideoRef(mediaRef)) return p;
        let value = Number(p.Duration);
        if (isNaN(value) || value < 5) {
          showDurationSnackbar('Duration must be at least 5 seconds');
          value = 5;
        } else if (value > 60) {
          showDurationSnackbar('Duration cannot exceed 60 seconds');
          value = 60;
        }
        return { ...p, Duration: value };
      })
    );
  }

  useEffect(() => {
    if (durationMode !== 'Default') return;
    setplaylistMedia((prev) => prev.map((p) => (isVideoRef(p.MediaRef) ? { ...p, Duration: null } : { ...p, Duration: Number(defaultDuration) })));
  }, [defaultDuration, durationMode]);

  // validate all non-video durations are numeric and within 5..60
  const checkAllDurationsValid = (list) => {
    if (!Array.isArray(list) || list.length === 0) return false;
    for (const p of list) {
      if (isVideoRef(p.MediaRef)) continue;
      const val = p.Duration;
      if (val === '' || val === null || val === undefined) return false;
      const n = Number(val);
      if (Number.isNaN(n) || n < 5 || n > 60) return false;
    }
    return true;
  };

  useEffect(() => {
    setDurationsValid(checkAllDurationsValid(playlistMedia));
  }, [playlistMedia, durationMode, defaultDuration]);

  function savePlaylistDetails() {
    if (!title || title.toString().trim() === '') {
      setcolor('error');
      setboxMessage('Title is required');
      setbox(true);
      window.scrollTo(0, 0);
      return;
    }

    // enforce DB-sized description limit on frontend
    if (description && description.length > DESCRIPTION_MAX_LENGTH) {
      setbox(true);
      setcolor('error');
      setboxMessage(`Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`);
      return;
    }

    // Validate durations once at save time (and show the same error popup if corrections made)
    let anyCorrections = false;
    let anyMinCorrection = false;
    let anyMaxCorrection = false;
    const validatedMedia = playlistMedia.map((p) => {
      if (isVideoRef(p.MediaRef)) return p;
      const raw = p.Duration;
      if (raw === '' || raw === null || raw === undefined) return p;
      const n = Number(raw);
      if (Number.isNaN(n)) {
        anyCorrections = true;
        return { ...p, Duration: 10 };
      }
      if (n < 5) {
        anyCorrections = true;
        anyMinCorrection = true;
        return { ...p, Duration: 5 };
      }
      if (n > 60) {
        anyCorrections = true;
        anyMaxCorrection = true;
        return { ...p, Duration: 60 };
      }
      return { ...p, Duration: n };
    });

    if (anyCorrections) {
      if (anyMinCorrection && !anyMaxCorrection) {
        showDurationSnackbar('Duration must be at least 5 seconds');
      } else if (anyMaxCorrection && !anyMinCorrection) {
        showDurationSnackbar('Duration cannot exceed 60 seconds');
      } else {
        // mixed corrections - show a neutral informative message
        showDurationSnackbar('Some durations were corrected to valid range');
      }
    }

    const sanitizedPlaylist = validatedMedia.map((p) => {
      const isVideo = isVideoRef(p.MediaRef);
      let dur = p.Duration;
      if (isVideo) dur = null;
      else {
        const n = Number(dur || (durationMode === 'Default' ? defaultDuration : 10));
        dur = isNaN(n) ? 10 : Math.min(60, Math.max(5, n));
      }
      return { MediaRef: p.MediaRef, IsActive: p.IsActive, Duration: dur };
    });

    const savePlaylistData = {
      playlistName: title,
      description: description,
      durationMode: durationMode,  // ✅ Save duration mode
      defaultDuration: durationMode === 'Default' ? defaultDuration : null,  // ✅ Save default duration
      playlist: [
        ...sanitizedPlaylist,
        ...deletedplaylistMedia.map((p) => ({ MediaRef: p.MediaRef, IsActive: p.IsActive, Duration: p.Duration || null }))
      ],
      isActive: 1
    };
    if (id !== '') savePlaylistData.playlistRef = id;
    window.scrollTo(0, 0);
    props.savePlaylist(savePlaylistData, (err) => {
      if (err && err.exists) {
        setcolor('error');
        setboxMessage(err.errmessage || 'Error saving playlist');
        setbox(true);
      } else {
        const successMessage = (type === 'Edit' || id !== '') ? 'Playlist Edited Successfully' : 'Playlist Created Successfully';
        navigate('/app/playlists', { replace: true, state: { flashMessage: successMessage } });
      }
    });
  }

  useEffect(() => {
    if ((type === 'Edit' || type === 'View') && state && state.Media && state.Media.length > 0) {
      const initialSelections = state.Media.map((m, idx) => {
        let duration = m.Duration;
        if (duration !== undefined && duration !== null && !m.MediaType?.toLowerCase().includes('video')) {
          duration = Math.max(5, Number(duration) || 10);
        }
        
        // FIXED: Store complete media object with all metadata
        return {
          MediaRef: m.MediaRef,
          IsActive: m.IsActive !== undefined ? m.IsActive : 1,
          SelectionId: idx + 1,
          Duration: duration !== undefined ? duration : (m.MediaType && m.MediaType.toLowerCase().includes('video') ? null : 10),
          // Store all metadata
          MediaName: m.MediaName || m.fileName || m.FileName || 'Unknown',
          MediaPath: m.MediaPath || m.fileUrl || m.FileUrl || '',
          Thumbnail: m.Thumbnail || m.thumbnailUrl || m.ThumbnailUrl || m.posterFrame || m.MediaPath || '',
          MediaType: m.MediaType || m.FileType || '',
          FileMimetype: m.MediaType || m.FileType || ''
        };
      });
      
      setplaylistMedia(initialSelections.filter(sel => sel.IsActive === 1));
      setdeletedplaylistMedia(initialSelections.filter(sel => sel.IsActive === 0));
      setSelectedRefs(initialSelections.filter(sel => sel.IsActive === 1).map(sel => sel.MediaRef));
      setSelectionCounter(initialSelections.length + 1);

      // ✅ AUTO-DETECT DURATION MODE FROM EXISTING DURATIONS
      const activeImages = initialSelections.filter(sel => 
        sel.IsActive === 1 && 
        sel.MediaType && 
        !sel.MediaType.toLowerCase().includes('video')
      );
      
      if (activeImages.length > 0) {
        // Get all unique durations
        const durations = activeImages.map(img => Number(img.Duration)).filter(d => d > 0);
        const uniqueDurations = [...new Set(durations)];
        
        // If all images have the same duration, it's Default mode
        if (uniqueDurations.length === 1) {
          setDurationMode('Default');
          setDefaultDuration(uniqueDurations[0]);
        } else {
          // If images have different durations, it's Custom mode
          setDurationMode('Custom');
        }
      }

      // Update global metadata
      const metadataMap = {};
      initialSelections.forEach((m) => {
        if (m.MediaRef) {
          metadataMap[m.MediaRef] = extractMediaMetadata(m);
        }
      });
      setGlobalMediaMetadata((prev) => ({ ...prev, ...metadataMap }));
    }
  }, [type, state]);

  const isViewMode = type === 'View';

  return (
    <>
      <Helmet>
        <title>{type} Playlist | Ideogram</title>
      </Helmet>

      {box && (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert severity={color}>{boxMessage}</Alert>
        </Stack>
      )}

      <Snackbar
        open={durationSnackbar.open}
        autoHideDuration={5000} 
        onClose={() => setDurationSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setDurationSnackbar({ open: false, message: '' })} severity="warning" sx={{ width: '100%' }}>
          {durationSnackbar.message}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%'
        }}
      >
        <Box
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100%',
            py: 3,
            // Explicitly ensure scrollbar styling is applied
            '&::-webkit-scrollbar': {
              width: '10px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f3f4f6',
              borderRadius: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#cbd5e1',
              borderRadius: '8px',
              border: '2px solid #f3f4f6'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#b6c2cc'
            }
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Formik initialValues={{ title, description }}>
              {({ errors, handleBlur, handleSubmit, touched }) => (
                <form onSubmit={handleSubmit}>
                  {/* Top area - heading and fields */}
                  <Box sx={{ mb: 1, py: 0.5 }}>
                    {/* Heading styled similar to "Create Split Screen" */}
                    <Typography variant="h4" sx={{ textAlign: 'left', fontSize: '26px', fontWeight: 700, mb: 1 }}>
                      {type} Playlist
                    </Typography>

                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <TextField
                          error={Boolean(touched.title && errors.title)}
                          fullWidth
                          helperText={touched.title && errors.title}
                          label="Title"
                          margin="dense"
                          name="title"
                          onBlur={handleBlur}
                          onChange={(e) => setTitle(e.target.value)}
                          value={title}
                          variant="outlined"
                          disabled={isViewMode}
                          InputLabelProps={{ sx: { color: 'text.primary', fontWeight: 550, fontSize: '1rem' } }}
                          sx={{ '& .MuiInputBase-input': { color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }, mt: 0.5 }}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          error={Boolean(touched.description && errors.description)}
                          fullWidth
                          label="Description"
                          margin="dense"
                          name="description"
                          onBlur={handleBlur}
                          onChange={(e) => setDescription((e.target.value || '').slice(0, DESCRIPTION_MAX_LENGTH))}
                          value={description}
                          variant="outlined"
                          disabled={isViewMode}
                          InputLabelProps={{ sx: { color: 'text.primary', fontWeight: 550, fontSize: '1rem' } }}
                          inputProps={{ maxLength: DESCRIPTION_MAX_LENGTH }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end" sx={{ mr: 1, pointerEvents: 'none' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {description.length}/{DESCRIPTION_MAX_LENGTH}
                                </Typography>
                              </InputAdornment>
                            )
                          }}
                          sx={{ '& .MuiInputBase-input': { color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }, mt: 0.5 }}
                        />
                      </Grid>

                      {/* Duration mode controls */}
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small" margin="dense" disabled={isViewMode}>
                          <InputLabel id="duration-mode-label">Duration Mode</InputLabel>
                          <Select
                            labelId="duration-mode-label"
                            value={durationMode}
                            label="Duration Mode"
                            onChange={(e) => setDurationMode(e.target.value)}
                          >
                            <MenuItem value="Default">Default</MenuItem>
                            <MenuItem value="Custom">Custom</MenuItem>
                          </Select>
                        </FormControl>

                        {durationMode === 'Default' && (
                          <FormControl fullWidth size="small" margin="dense" disabled={isViewMode}>
                            <InputLabel id="default-duration-label">Default Duration</InputLabel>
                            <Select
                              labelId="default-duration-label"
                              value={defaultDuration}
                              label="Default duration"
                              onChange={(e) => setDefaultDuration(Number(e.target.value))}
                              sx={{ mt: 0.5 }}
                            >
                              {Array.from({ length: 11 }).map((_, i) => {
                                const val = (i + 2) * 5;
                                return <MenuItem key={val} value={val}>{val} sec</MenuItem>;
                              })}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Media area - hide in view mode */}
                  {!isViewMode && (
                    <Box sx={{ pt: 1, pb: 1 }}>
                      <Box sx={{
                        borderRadius: `${panelRadius}px`,
                        backgroundColor: panelBg,
                        p: 1,
                        position: 'relative',
                        border: `1px solid ${panelBorder}`,
                        mt: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '60vh',
                        boxSizing: 'border-box',
                        minHeight: 'auto'
                      }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                          <Box sx={{ flex: 1 }} />

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant={mediaTypeFilter === 'image' ? 'contained' : 'outlined'} onClick={() => { setMediaTypeFilter('image'); }}>
                              IMAGES
                            </Button>
                            <Button variant={mediaTypeFilter === 'video' ? 'contained' : 'outlined'} onClick={() => { setMediaTypeFilter('video'); }}>
                              VIDEOS
                            </Button>
                            <Button variant={mediaTypeFilter === 'gif' ? 'contained' : 'outlined'} onClick={() => { setMediaTypeFilter('gif'); }}>
                              GIFS
                            </Button>
                          </Box>

                          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <TextField
                              size="small"
                              placeholder="Search media"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              sx={{ width: 240 }}
                            />
                          </Box>
                        </Box>

                        <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5,
                          '&::-webkit-scrollbar': {
                            width: '10px'
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#f3f4f6',
                            borderRadius: '8px'
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#cbd5e1',
                            borderRadius: '8px',
                            border: '2px solid #f3f4f6'
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            backgroundColor: '#b6c2cc'
                          }
                        }}>
                          <MediaGrid media={media} setselected={onGridSelectionChange} selected={selectedRefs} columns={6} />
                        </Box>

                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                          <Button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <Typography variant="body2">Page {currentPage} — {totalRecords} items</Typography>
                          <Button disabled={(currentPage * pageSize) >= totalRecords} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Selection summary / badges with duration controls */}
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Selected items ({playlistMedia.length})</Typography>
                    <Grid container spacing={1.5}>
                      {playlistMedia.map((p, idx) => {
                        const mediaName = p.MediaName || 'Unknown Media';
                        const isVideo = isVideoRef(p.MediaRef);
                        const thumbnailUrl = p.Thumbnail || p.MediaPath || '';

                        return (
                          <Grid item xs={12} md={6} key={p.SelectionId}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, border: `1px solid ${cardBorder}`, p: 1, borderRadius: 1 }}>
                              {/* ✅ FIXED: Show video poster using the same method as MediaGrid */}
                              <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: 'hidden', background: '#f9f9f9', flexShrink: 0 }}>
                                {isVideo ? (
                                  <VideoThumbnail videoUrl={p.MediaPath || thumbnailUrl} alt={mediaName} />
                                ) : thumbnailUrl ? (
                                  <CardMedia 
                                    component="img" 
                                    image={thumbnailUrl} 
                                    alt={mediaName} 
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                ) : (
                                  <Box sx={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    background: '#eee', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center' 
                                  }}>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '10px', fontWeight: 600 }}>
                                      ?
                                    </Typography>
                                  </Box>
                                )}
                              </Box>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }} noWrap>
                                  {mediaName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Priority: {idx + 1} — {isVideo ? 'Video (full length)' : `Image`}
                                </Typography>
                              </Box>

                              {/* duration controls (images only) */}
                              {!isVideo ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                  {durationMode === 'Default' ? (
                                    <>
                                      {/* Default mode: only show locked duration + lock icon */}
                                      <TextField
                                        size="small"
                                        value={Number(defaultDuration)}
                                        inputProps={{ style: { width: 44, textAlign: 'center' }, readOnly: true }}
                                        disabled
                                      />

                                      <Tooltip title="Uses the selected default duration" arrow>
                                        <Box sx={{ ml: 0.5, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                          <LockIcon fontSize="small" />
                                        </Box>
                                      </Tooltip>
                                    </>
                                  ) : (
                                    <>
                                      {/* Custom mode — fully editable with +/- */}
                                      <IconButton size="small" onClick={() => adjustDuration(p.MediaRef, -1)} disabled={isViewMode}>
                                        <RemoveIcon fontSize="small" />
                                      </IconButton>

                                      <TextField
                                        size="small"
                                        value={p.Duration === '' ? '' : (p.Duration || 10)}
                                        onChange={(e) => onDurationInputChange(p.MediaRef, e.target.value)}
                                        onBlur={() => onDurationBlur(p.MediaRef)}
                                        inputProps={{ style: { width: 44, textAlign: 'center' } }}
                                        disabled={isViewMode}
                                      />

                                      <IconButton size="small" onClick={() => adjustDuration(p.MediaRef, +1)} disabled={isViewMode}>
                                        <AddIcon fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1, flexShrink: 0 }}>Plays full video</Typography>
                              )}

                              {!isViewMode && (
                                <IconButton color="error" onClick={() => removeSelection(p.SelectionId)} sx={{ flexShrink: 0 }}>
                                  <RemoveCircleOutlineIcon />
                                </IconButton>
                              )}
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
   
                  {/* Action button - change based on mode */}
                  <Box sx={{ mt: 0.5, mb: 8.5, display: 'flex', justifyContent: 'center' }}>
                    {isViewMode ? (
                      <Button
                        color="primary"
                        size="large"
                        type="button"
                        variant="contained"
                        onClick={() => navigate('/app/playlists')}
                      >
                        Back to PlaylistList
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        size="large"
                        type="button"
                        variant="contained"
                        onClick={() => savePlaylistDetails()}
                        // When Default mode, button should always be enabled (only title required).
                        // When Custom mode, require durationsValid as before.
                        disabled={
                          !title || title.toString().trim() === '' || (durationMode === 'Custom' && !durationsValid)
                        }
                      >
                        {type} Playlist
                      </Button>
                    )}
                  </Box>
                </form>
              )}
            </Formik>
          </Container>
        </Box>
      </Box>
    </>
  );
};

const mapStateToProps = ({ root = {} }) => {
  const component = root.user?.components;
  return { component };
};

const mapDispatchToProps = (dispatch) => ({
  getUserComponentListWithPagination: (data, callback) => dispatch(getUserComponentListWithPagination(data, callback)),
  savePlaylist: (data, callback) => dispatch(savePlaylist(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(CreatePlaylist);
