/* eslint-disable linebreak-style */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-sequences */
/* eslint-disable react/prop-types */
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Formik } from 'formik';
import React, { useState, useEffect } from 'react';
import CardMedia from '@mui/material/CardMedia';
import { Alert, Stack, Checkbox, Snackbar } from '@mui/material';
import { Box, Button, Container, TextField, Typography, Grid, MenuItem, Select, FormControl, InputLabel, IconButton } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant.jsx';
import MediaGrid from 'src/components/media/MediaGrid';
import { getUserComponentListWithPagination, savePlaylist } from '../store/action/user';

const CreatePlaylist = (props) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [type] = useState(
    state && state.type === 'View'
      ? 'View'
      : state && state.type === 'Edit'
      ? 'Edit'   // show "Edit Playlist" instead of "Update Playlist"
      : 'Create'
  );

  const { component } = props || {};
  const [title, setTitle] = useState((state && state.Name) || '');
  const [description, setDescription] = useState((state && state.Description) || '');
  const [media, setMedia] = useState([]);
  const [id] = useState((state && state.PlaylistRef) || '');

  // Add: initial playlist media state for edit/view
  const [playlistMedia, setplaylistMedia] = useState([]);
  const [deletedplaylistMedia, setdeletedplaylistMedia] = useState([]);
  const [selectedRefs, setSelectedRefs] = useState([]);
  const [selectionCounter, setSelectionCounter] = useState(1);

  const [loader, setloader] = useState(false);
  const [mediaData, setMediaData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState('image'); // images by default
  const [searchQuery, setSearchQuery] = useState('');
  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');
  const [durationError, setDurationError] = useState(false);

  // Duration controls
  const [durationMode, setDurationMode] = useState('Default'); // 'Default' | 'Custom'
  const [defaultDuration, setDefaultDuration] = useState(10); // 10..60 (removed 5)

  // visual constants matched to Media page
  const panelBg = 'rgba(25,118,210,0.03)';
  const panelRadius = 8;
  const panelBorder = 'rgba(0,0,0,0.02)';
  const cardBorder = 'rgba(0,0,0,0.06)';

  // pagination / tab (image / video) like Media page
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // match Media page: 12 items per batch
  const [totalRecords, setTotalRecords] = useState(0);

  // fetch paginated media (re-uses server paginated endpoint used by media page)
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
      // try to get total records from first row if SP returned it per-row
      const total = (list.length && list[0].TotalRecords) ? Number(list[0].TotalRecords) : (res.data && res.data.TotalRecords) || 0;
      setMedia(list);
      setMediaData(list);
      setTotalRecords(total);
      // keep playlistMedia unchanged - no preselection
    });
  };

  // initial load & when filters change
  useEffect(() => {
    fetchMedia(1, pageSize, mediaTypeFilter, '');
    setCurrentPage(1);
    // reset selections in the grid when changing tab
    setSelectedRefs([]);
  }, [mediaTypeFilter]);

  useEffect(() => {
    fetchMedia(currentPage, pageSize, mediaTypeFilter, searchQuery);
  }, [currentPage, pageSize, searchQuery]);

  // Helper: determine if a mediaRef corresponds to a video
  const isVideoRef = (mediaRef) => {
    const item = mediaData.find((m) => m.MediaRef === mediaRef);
    if (!item) return false;
    // check various common fields
    const mm = (item.fileMimetype || item.FileMimetype || item.FileType || item.MediaType || '').toString().toLowerCase();
    if (mm.includes('video')) return true;
    if (mm.includes('image')) return false;
    // fallback: try extension in file url
    const url = (item.fileUrl || item.FileUrl || item.FileURL || '').toString().toLowerCase();
    if (url.match(/\.(mp4|mov|webm|mkv)$/)) return true;
    return false;
  };

  // When MediaGrid selection changes (it returns array of MediaRef strings)
  const onGridSelectionChange = (newSelected) => {
    // compute additions and removals relative to selectedRefs
    const added = newSelected.filter((r) => !selectedRefs.includes(r));
    const removed = selectedRefs.filter((r) => !newSelected.includes(r));

    // add newly selected items to playlistMedia with defaults
    if (added.length) {
      setplaylistMedia((prev) => {
        let next = [...prev];
        added.forEach((ref) => {
          if (!next.find((p) => p.MediaRef === ref)) {
            const newSelId = selectionCounter;
            const isVideo = isVideoRef(ref);
            // Minimum duration is 5 for images
            const durationForNew = isVideo ? null : (durationMode === 'Default' ? Number(defaultDuration) : 10);
            next.push({ MediaRef: ref, IsActive: 1, SelectionId: newSelId, Duration: durationForNew });
            setSelectionCounter((c) => c + 1);
          }
        });
        return next;
      });
    }

    // for removals, move them to deleted list (to preserve edit behavior)
    if (removed.length) {
      setplaylistMedia((prev) => {
        let next = [...prev];
        removed.forEach((ref) => {
          const idx = next.findIndex((p) => p.MediaRef === ref);
          if (idx !== -1) {
            const [item] = next.splice(idx, 1);
            setdeletedplaylistMedia((d) => [...d, { MediaRef: item.MediaRef, IsActive: 0, SelectionId: item.SelectionId, Duration: item.Duration || null }]);
          }
        });
        return next;
      });
    }

    setSelectedRefs(newSelected);
  };

  // Toggle selection: only one selection per media allowed.
  function handleSelectPlaylist(item) {
    setplaylistMedia((prev) => {
      const existing = prev.find((p) => p.MediaRef === item.MediaRef);
      if (existing) {
        // unselect: move to deleted list (for edits) and remove from active
        setdeletedplaylistMedia((delPrev) => [
          ...delPrev,
          { MediaRef: existing.MediaRef, IsActive: 0, SelectionId: existing.SelectionId, Duration: existing.Duration || null }
        ]);
        setSelectedRefs((s) => s.filter((r) => r !== item.MediaRef));
        return prev.filter((p) => p.SelectionId !== existing.SelectionId);
      }

      // select: remove any deleted record for this media then add new selection
      setdeletedplaylistMedia((delPrev) => delPrev.filter((d) => d.MediaRef !== item.MediaRef));
      const newId = selectionCounter;
      setSelectionCounter((c) => c + 1);
      const isVideo = isVideoRef(item.MediaRef);
      // Minimum duration is 5 for images
      const durationForNew = isVideo ? null : (durationMode === 'Default' ? Number(defaultDuration) : 10);
      setSelectedRefs((s) => [...s, item.MediaRef]);
      // default Duration based on mode
      return [...prev, { MediaRef: item.MediaRef, IsActive: 1, SelectionId: newId, Duration: durationForNew }];
    });
  }

  // Remove a specific selection badge (by SelectionId) — used by badge click (keeps deleted list behavior)
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

  // adjust duration (delta can be +1 / -1) for images only
  function adjustDuration(mediaRef, delta) {
    setplaylistMedia((prev) =>
      prev.map((p) => {
        if (p.MediaRef !== mediaRef) return p;
        // skip videos
        if (isVideoRef(mediaRef)) return p;
        let next = Number(p.Duration || 10) + delta;
        if (next < 5) {
          setDurationError(true); // immediate feedback for button presses
          next = 5; // Minimum 5 seconds
        }
        if (next > 60) next = 60; // clamp to 60
        return { ...p, Duration: next };
      })
    );
  }

  function onDurationInputChange(mediaRef, value) {
    // allow typing but validate on change
    // If empty string while typing, allow it temporarily
    if (value === '') {
      setplaylistMedia((prev) =>
        prev.map((p) => (p.MediaRef === mediaRef ? { ...p, Duration: '' } : p))
      );
      return;
    }

    // Only accept pure digit input; ignore other characters (do not show error for non-numeric input)
    const digitsOnly = /^\d+$/.test(value);
    if (!digitsOnly) {
      return;
    }

    const parsed = parseInt(value, 10);

    // If numeric and below minimum, immediately show popup and coerce to 5
    let next = parsed;
    if (parsed < 5) {
      setDurationError(true); // show popup only when numeric value < 5
      next = 5;
    }

    if (next > 60) next = 60;

    setplaylistMedia((prev) =>
      prev.map((p) => (p.MediaRef === mediaRef ? { ...p, Duration: next } : p))
    );
  }

  function onDurationBlur(mediaRef) {
    setplaylistMedia((prev) =>
      prev.map((p) => {
        if (p.MediaRef !== mediaRef) return p;
        // videos should keep null
        if (isVideoRef(mediaRef)) return p;
        let value = Number(p.Duration);
        // Enforce minimum 5 seconds on blur
        if (isNaN(value) || value < 5) {
          setDurationError(true);
          value = 5;
        }
        if (value > 60) value = 60;
        return { ...p, Duration: value };
      })
    );
  }

  function handlePriority(mediaRef) {
    const priorityIndex = playlistMedia.findIndex((i) => i.MediaRef === mediaRef) + 1;
    return priorityIndex > 0 ? priorityIndex : '';
  }

  // When defaultDuration changes and mode is Default — apply to all images in playlist
  useEffect(() => {
    if (durationMode !== 'Default') return;
    setplaylistMedia((prev) => prev.map((p) => (isVideoRef(p.MediaRef) ? { ...p, Duration: null } : { ...p, Duration: Number(defaultDuration) })));
  }, [defaultDuration, durationMode]); // eslint-disable-line

  function savePlaylistDetails() {
    // client-side required validation for playlist name
    if (!title || title.toString().trim() === '') {
      setcolor('error');
      setboxMessage('Title is required');
      setbox(true);
      window.scrollTo(0, 0);
      return;
    }
    // before save: sanitize durations (set numeric defaults for images, null for videos)
    const sanitizedPlaylist = playlistMedia.map((p) => {
      const isVideo = isVideoRef(p.MediaRef);
      let dur = p.Duration;
      if (isVideo) dur = null;
      else {
        const n = Number(dur || (durationMode === 'Default' ? defaultDuration : 10));
        // Enforce minimum 5 seconds on save
        dur = isNaN(n) ? 10 : Math.min(60, Math.max(5, n));
      }
      return { MediaRef: p.MediaRef, IsActive: p.IsActive, Duration: dur };
    });

    // send keys that match backend validation (lowercase top-level names)
    const savePlaylistData = {
      playlistName: title,
      description: description,
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
        navigate('/app/playlists', { replace: true });
      }
    });
  }

  // Add new state to store full media metadata for selected items
  const [selectedMediaMetadata, setSelectedMediaMetadata] = useState({});

  // Pre-populate playlist media selections on Edit/View
  useEffect(() => {
    if ((type === 'Edit' || type === 'View') && state && state.Media && state.Media.length > 0) {
      // Map playlist media to selection objects
      const initialSelections = state.Media.map((m, idx) => {
        let duration = m.Duration;
        // Enforce minimum 5 seconds for loaded playlist items
        if (duration !== undefined && duration !== null && !m.MediaType?.toLowerCase().includes('video')) {
          duration = Math.max(5, Number(duration) || 10);
        }
        return {
          MediaRef: m.MediaRef,
          IsActive: m.IsActive !== undefined ? m.IsActive : 1,
          SelectionId: idx + 1,
          Duration: duration !== undefined ? duration : (m.MediaType && m.MediaType.toLowerCase().includes('video') ? null : 10)
        };
      });
      setplaylistMedia(initialSelections.filter(sel => sel.IsActive === 1));
      setdeletedplaylistMedia(initialSelections.filter(sel => sel.IsActive === 0));
      setSelectedRefs(initialSelections.filter(sel => sel.IsActive === 1).map(sel => sel.MediaRef));
      setSelectionCounter(initialSelections.length + 1);

      // Store metadata from state.Media if it has MediaName and MediaPath
      const metadataMap = {};
      state.Media.forEach((m) => {
        if (m.MediaRef) {
          metadataMap[m.MediaRef] = {
            MediaRef: m.MediaRef,
            MediaName: m.MediaName || m.fileName || m.FileName || 'Unknown',
            MediaPath: m.MediaPath || m.fileUrl || m.FileUrl || '',
            Thumbnail: m.Thumbnail || m.thumbnailUrl || m.ThumbnailUrl || '',
            MediaType: m.MediaType || m.FileType || ''
          };
        }
      });
      setSelectedMediaMetadata(metadataMap);
    }
  }, [type, state]);

  // Do NOT reset selectedRefs when switching tabs if editing
  useEffect(() => {
    if (type === 'Create') {
      setSelectedRefs([]);
      setplaylistMedia([]);
      setdeletedplaylistMedia([]);
      setSelectionCounter(1);
    }
    // For Edit/View, keep selections
  }, [mediaTypeFilter, type]);

  return (
    <>
      <Helmet>
        <title>Create Playlist | Ideogram</title>
      </Helmet>

      {box && (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert severity={color}>{boxMessage}</Alert>
        </Stack>
      )}

      <Snackbar
        open={durationError}
        autoHideDuration={2000}
        onClose={() => setDurationError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setDurationError(false)} severity="warning" sx={{ width: '100%' }}>
          Duration must be at least 5 seconds
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
            py: 3
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
                    <Typography variant="h4" sx={{ textAlign: 'left', fontWeight: 700, mb: 1 }}>
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
                          InputLabelProps={{ sx: { color: 'text.primary', fontWeight: 550, fontSize: '1rem' } }}
                          sx={{ '& .MuiInputBase-input': { color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }, mt: 0.5 }}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          error={Boolean(touched.description && errors.description)}
                          fullWidth
                          helperText={touched.description && errors.description}
                          label="Description"
                          margin="dense"
                          name="description"
                          onBlur={handleBlur}
                          onChange={(e) => setDescription(e.target.value)}
                          value={description}
                          variant="outlined"
                          InputLabelProps={{ sx: { color: 'text.primary', fontWeight: 550, fontSize: '1rem' } }}
                          sx={{ '& .MuiInputBase-input': { color: 'text.primary', fontSize: '1rem', lineHeight: 1.2 }, mt: 0.5 }}
                        />
                      </Grid>

                      {/* Duration mode controls */}
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small" margin="dense">
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
                          <FormControl fullWidth size="small" margin="dense">
                            <InputLabel id="default-duration-label">Default (images)</InputLabel>
                            <Select
                              labelId="default-duration-label"
                              value={defaultDuration}
                              label="Default (images)"
                              onChange={(e) => setDefaultDuration(Number(e.target.value))}
                              sx={{ mt: 0.5 }}
                            >
                              {/* Start from 10 seconds (removed 5 seconds option) */}
                              {Array.from({ length: 11 }).map((_, i) => {
                                const val = (i + 2) * 5; // Starts at 10 (2*5), goes to 60 (12*5)
                                return <MenuItem key={val} value={val}>{val} sec</MenuItem>;
                              })}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Media area - match Media page styling exactly */}
                  <Box sx={{ pt: 1, pb: 1 }}>
                    {/* content wrapper matched to MediaList/MediaGrid */ }
                    <Box sx={{
                      borderRadius: `${panelRadius}px`,
                      backgroundColor: panelBg,
                      p: 1,
                      position: 'relative',
                      border: `1px solid ${panelBorder}`,
                      mt: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      // limit panel overall height and allow the inner grid to scroll
                      maxHeight: '60vh',
                      boxSizing: 'border-box',
                      minHeight: 'auto'
                    }}>
                      {/* Tabs for Images / Videos like Media page */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }} />

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button variant={mediaTypeFilter === 'image' ? 'contained' : 'outlined'} onClick={() => { setMediaTypeFilter('image'); }}>
                            IMAGES
                          </Button>
                          <Button variant={mediaTypeFilter === 'video' ? 'contained' : 'outlined'} onClick={() => { setMediaTypeFilter('video'); }}>
                            VIDEOS
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

                      {/* Reuse MediaGrid (same component used on Media page).
                          Inner scroller keeps pagination visible at the panel bottom. */}
                      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
                        <MediaGrid media={media} setselected={onGridSelectionChange} selected={selectedRefs} columns={6} />
                      </Box>

                      {/* simple footer pagination controls kept visible below the scrolling grid */}
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <Button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Prev</Button>
                        <Typography variant="body2">Page {currentPage} — {totalRecords} items</Typography>
                        <Button disabled={(currentPage * pageSize) >= totalRecords} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
                      </Box>
                     </Box>
                   </Box>

                  {/* Selection summary / badges with duration controls */}
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Selected items ({playlistMedia.length})</Typography>
                    <Grid container spacing={1}>
                      {playlistMedia.map((p, idx) => {
                        // Try to find in current mediaData first, then fall back to selectedMediaMetadata
                        let mediaItem = mediaData.find(m => m.MediaRef === p.MediaRef);
                        
                        if (!mediaItem && selectedMediaMetadata[p.MediaRef]) {
                          mediaItem = selectedMediaMetadata[p.MediaRef];
                        }
                        
                        if (!mediaItem) {
                          mediaItem = {};
                        }

                        const isVideo = isVideoRef(p.MediaRef);
                        
                        // Extract media name from various possible field names
                        const mediaName = mediaItem.MediaName || 
                                         mediaItem.fileName || 
                                         mediaItem.FileName || 
                                         mediaItem.Name || 
                                         mediaItem.name ||
                                         mediaItem.Title || 
                                         mediaItem.title ||
                                         p.MediaRef; // fallback to MediaRef only if absolutely nothing else
                        
                        // Extract thumbnail URL from various possible field names
                        const thumbnailUrl = mediaItem.MediaPath || 
                                            mediaItem.fileUrl || 
                                            mediaItem.FileUrl || 
                                            mediaItem.FileURL ||
                                            mediaItem.url ||
                                            mediaItem.Thumbnail ||
                                            mediaItem.thumbnailUrl ||
                                            mediaItem.ThumbnailUrl ||
                                            '';

                        return (
                          <Grid item xs={12} md={6} key={p.SelectionId}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, border: `1px solid ${cardBorder}`, p: 1, borderRadius: 1 }}>
                              <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: 'hidden', background: '#f9f9f9', flexShrink: 0 }}>
                                {thumbnailUrl ? (
                                  <CardMedia 
                                    component="img" 
                                    image={thumbnailUrl} 
                                    alt={mediaName} 
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                ) : (
                                  <Box sx={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography variant="caption" sx={{ color: '#999', fontSize: '10px' }}>?</Typography>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                  <IconButton size="small" onClick={() => adjustDuration(p.MediaRef, -1)}><RemoveIcon fontSize="small" /></IconButton>
                                  <TextField
                                    size="small"
                                    value={p.Duration === '' ? '' : (p.Duration || 10)}
                                    onChange={(e) => onDurationInputChange(p.MediaRef, e.target.value)}
                                    onBlur={() => onDurationBlur(p.MediaRef)}
                                    inputProps={{ style: { width: 44, textAlign: 'center' } }}
                                  />
                                  <IconButton size="small" onClick={() => adjustDuration(p.MediaRef, +1)}><AddIcon fontSize="small" /></IconButton>
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1, flexShrink: 0 }}>Plays full video</Typography>
                              )}

                              <IconButton color="error" onClick={() => removeSelection(p.SelectionId)} sx={{ flexShrink: 0 }}>
                                <RemoveCircleOutlineIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
   
                  {/* existing primary action kept here — fully outside the media panel, non-overlapping */}
                  <Box sx={{ mt: 0.5, mb: 8.5, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      color="primary"
                      size="large"
                      type="button"
                      variant="contained"
                      onClick={() => savePlaylistDetails()}
                      disabled={!title || title.toString().trim() === ''}
                    >
                      {type} Playlist
                    </Button>
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
