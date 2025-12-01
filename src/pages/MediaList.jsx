/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Button,
  Grid,
  Modal,
  Pagination,
  Stack,
  Alert,
  TextField,
  InputAdornment,
  Checkbox,
  Typography,
  Tabs,
  Tab,
  SvgIcon,
  Tooltip
} from '@mui/material';
import { Search as SearchIcon, Trash2 as Trash2Icon } from 'react-feather';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant.jsx';
import {
  getUserComponentListWithPagination,
  validateDeleteComponentList,
  deleteComponentList
} from '../store/action/user';
import { useNavigate } from 'react-router-dom';

const MediaList = (props) => {
  const [mediaItem, setMedia] = useState([]);
  const [selected, setselected] = useState([]);
  const [showmodal, setModal] = useState(false);
  const [showErrModal, setErrModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('IMAGES');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filter states
  // default to images so initial load shows image count
  const [mediaTypeFilter, setMediaTypeFilter] = useState('image');

  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');

  const navigate = useNavigate();

  const buildSrc = (rawPath) => {
    if (!rawPath) return null;
    let p = String(rawPath);
    p = p.replace(/\\/g, '/').trim();
    if (p.indexOf('undefined') !== -1) return null;
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/')) return `${window.location.origin}${p}`;
    try { return `${window.location.origin}/${encodeURI(p)}`; } catch (e) { return p; }
  };

  const fetchMediaList = async (page = currentPage, size = pageSize, search = searchQuery, mediaType = mediaTypeFilter) => {
    setLoading(true);

    const aggregateFiltered = [];
    let requestPage = page;
    let reachedEnd = false;
    let serverTotalRecords = null;

    // keep fetching subsequent server pages until we have 'size' filtered items or no more server data
    while (aggregateFiltered.length < size && !reachedEnd) {
      const requestData = {
        componenttype: 1,
        searchText: search || '',
        mediaType: mediaType || null,
        isActive: 1,
        userId: null,
        pageNumber: requestPage,
        pageSize: size // request same size from server per page
      };

      // wrap the callback-based action in a promise to use async/await
      // eslint-disable-next-line no-await-in-loop
      const response = await new Promise((resolve) => {
        props.getUserComponentListWithPagination(requestData, (res) => resolve(res));
      });

      if (!response || response.exists) {
        reachedEnd = true;
        break;
      }

      const data = response.data || {};
      const componentList = data.ComponentList || [];

      // capture server total if provided
      if (serverTotalRecords === null && Number.isFinite(Number(data.TotalRecords))) {
        serverTotalRecords = Number(data.TotalRecords);
      }

      // Stronger filtering to ensure GIFs don't show under IMAGES
      const filteredPage = componentList.filter((item) => {
        const mt = (item?.MediaType || '').toString().toLowerCase();
        const name = (item?.MediaName || '').toString().toLowerCase();
        const path = (item?.MediaPath || '').toString().toLowerCase();

        const isGif = mt.includes('gif') || name.endsWith('.gif') || path.includes('.gif');
        const isVideo = mt.startsWith('video') || mt.includes('video') ||
          name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/) || path.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/);

        // Debug logging - remove after fixing
        if (name.includes('.gif')) {
          console.log('GIF detected:', { name, mt, path, isGif, mediaType, willShow: mediaType === 'gif' ? isGif : false });
        }

        if (mediaType === 'gif') return isGif;
        if (mediaType === 'video') return isVideo && !isGif;
        // For images, exclude both gifs and videos
        return !isGif && !isVideo;
      });

      aggregateFiltered.push(...filteredPage);

      // if server returned fewer items than requested, we've reached the backend end
      if (componentList.length < size) {
        reachedEnd = true;
      } else {
        // prepare to fetch next server page only if needed
        requestPage += 1;
      }
    }

    setLoading(false);

    // final displayed list: exactly 'size' items (or fewer if total available < size)
    const finalList = aggregateFiltered.slice(0, size);
    setMedia(finalList);

    // determine totalRecords: prefer server-provided total if available, else use aggregated filtered count
    const finalTotal = Number.isFinite(Number(serverTotalRecords)) ? serverTotalRecords : aggregateFiltered.length;
    setTotalRecords(finalTotal);
    setTotalPages(Math.ceil(finalTotal / size));
  };

  // initial load
  useEffect(() => { fetchMediaList(1, pageSize, searchQuery, mediaTypeFilter); }, []);

  useEffect(() => {
    // when filters or page changes refetch
    fetchMediaList(currentPage, pageSize, searchQuery, mediaTypeFilter);
  }, [currentPage, pageSize, mediaTypeFilter]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchMediaList(1, pageSize, query, mediaTypeFilter);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    let type = '';
    if (newValue === 'VIDEOS') type = 'video';
    else if (newValue === 'GIFs') type = 'gif';
    else if (newValue === 'IMAGES') type = 'image';
    setMediaTypeFilter(type);
    setCurrentPage(1);
    // clear previous numbers immediately to avoid showing old counts briefly
    setTotalRecords(0);
    setTotalPages(0);
    setMedia([]);
    fetchMediaList(1, pageSize, searchQuery, type);
  };

  const style = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)', width: 500,
    bgcolor: 'background.paper', border: '2px solid #000',
    boxShadow: 24, p: 4
  };

  const deleteComponent = () => {
    const deleteData = { ComponentType: COMPONENTS.Media, ComponentList: selected };
    setModal(false);
    props.validateDeleteComponentList(deleteData, (err) => {
      if (err?.exists) {
        setcolor('error'); setboxMessage('Validation error occurred'); setbox(true); return;
      }
      if (err?.err === 'attached') {
        setPlaylists([]); err.componentsAttached.forEach((item) => { setPlaylists((prev) => [...prev, item.PlaylistName]); });
        setErrModal(true); return;
      }
      props.deleteComponentList(deleteData, (delErr) => {
        if (delErr?.exists) {
          setcolor('error'); setboxMessage(delErr.err || delErr.errmessage || 'Delete failed'); setbox(true);
        } else {
          setcolor('success'); setboxMessage('Media Deleted Successfully!'); setbox(true); setselected([]);
          fetchMediaList(currentPage, pageSize, searchQuery, mediaTypeFilter);
        }
      });
    });
  };

  const toggleSelection = (MediaRef) => {
    const idx = selected.indexOf(MediaRef);
    let newSelected = [];
    if (idx === -1) newSelected = [...selected, MediaRef];
    else newSelected = selected.filter((r) => r !== MediaRef);
    setselected(newSelected);
  };

  const renderMediaCard = (item) => {
    const src = buildSrc(item?.MediaPath);
    const thumb = buildSrc(item?.Thumbnail || item?.MediaThumb || item?.Poster);
    const rawType = (item?.MediaType || '').toString().toLowerCase();
    const isVideo = rawType.startsWith('video') || (item?.MediaName || '').toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
    const isSelected = selected.indexOf(item.MediaRef) !== -1;

    return (
      <Box key={item.MediaRef} onClick={() => toggleSelection(item.MediaRef)}
        sx={{
          position: 'relative', borderRadius: '8px', overflow: 'hidden',
          bgcolor: '#fff', cursor: 'pointer',
          border: isSelected ? '2px solid #1976d2' : '1px solid #e5e7eb',
          transition: 'all 0.2s ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' }
        }}
      >
        <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={() => toggleSelection(item.MediaRef)}
          sx={{ position: 'absolute', left: 8, top: 8, zIndex: 5, bgcolor: 'transparent', borderRadius: 0, padding: 0, '&:hover': { bgcolor: 'transparent' } }} />
        <Box sx={{ width: '100%', paddingTop: '100%', position: 'relative', bgcolor: '#f4f4f4' }}>
          {isVideo ? (
            thumb ? (
              <img src={thumb} alt={item.MediaName} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : src ? (
              <video src={src} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
            ) : (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No media</Box>
            )
          ) : (
            src ? (
              <img src={src} alt={item.MediaName} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No media</Box>
            )
          )}
        </Box>
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.MediaName}</Box>
      </Box>
    );
  };

  const handlePageChange = (event, value) => { setCurrentPage(value); fetchMediaList(value, pageSize, searchQuery, mediaTypeFilter); };

  // helper to know whether delete button should be enabled
  const hasSelection = Array.isArray(selected) && selected.length > 0;

  // visible items on current page/grid
  const visibleRefs = Array.isArray(mediaItem) ? mediaItem.map((it) => it.MediaRef) : [];
  const allVisibleSelected = visibleRefs.length > 0 && visibleRefs.every((r) => selected.includes(r));
  const someVisibleSelected = visibleRefs.some((r) => selected.includes(r)) && !allVisibleSelected;

  const handleSelectAllVisible = () => {
    if (visibleRefs.length === 0) return;
    if (allVisibleSelected) {
      // unselect all visible
      setselected((prev) => prev.filter((r) => !visibleRefs.includes(r)));
    } else {
      // add all visible to selection (avoid duplicates)
      setselected((prev) => Array.from(new Set([...(prev || []), ...visibleRefs])));
    }
  };

  return (
    <>
      <Helmet><title>Media | Ideogram</title></Helmet>

      {box && (
        <Stack sx={{ position: 'fixed', top: 10, left: 870, zIndex: 9999, width: 'auto', maxWidth: 400 }} spacing={2}>
          <Alert severity={color} onClose={() => setbox(false)}>{boxMessage}</Alert>
        </Stack>
      )}

      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
        <Container maxWidth={false}>
          <Modal open={showmodal} onClose={() => setModal(false)}><Box sx={style}>
            <h4 style={{ marginBottom: 20 }}>Are you sure you want to delete {selected.length} item(s)?</h4>
            <Grid container spacing={2}><Grid item>
              <Button variant="contained" color="success" onClick={() => deleteComponent()}>Yes</Button>
            </Grid><Grid item>
              <Button variant="contained" color="error" onClick={() => setModal(false)}>No</Button>
            </Grid></Grid>
          </Box></Modal>

          <Modal open={showErrModal} onClose={() => setErrModal(false)}><Box sx={style}>
            <h4 style={{ marginBottom: 20 }}>Cannot delete this media as it is running in these playlists:</h4>
            <ul style={{ marginBottom: 20 }}>{playlists.map((playlist, index) => <li key={index}>{playlist}</li>)}</ul>
            <Grid container><Grid item>
              <Button variant="contained" color="success" onClick={() => { setErrModal(false); setPlaylists([]); }}>Ok</Button>
            </Grid></Grid>
          </Box></Modal>

          {/* Top Toolbar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0 }}>
            <Box sx={{ width: '100%', maxWidth: 1400, p: 2, bgcolor: 'transparent', borderRadius: 0, boxShadow: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                {/* Search Box */}
                <TextField
                  size="small"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search Media"
                  sx={{
                    width: 220,
                    bgcolor: 'transparent',
                    mr: 2
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SvgIcon fontSize="small" color="action">
                          <SearchIcon />
                        </SvgIcon>
                      </InputAdornment>
                    )
                  }}
                  variant="outlined"
                  aria-label="Search media"
                />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {/* Delete button - identical styling/behavior to ScheduleList delete button */}
                  {!hasSelection ? (
                    <Tooltip title="Select media(s) to delete" arrow>
                      <span>
                        <Button
                          sx={{
                            mx: 1,
                            cursor: 'pointer',
                            color: 'black',
                            borderColor: 'error.main',
                            '&:hover': { backgroundColor: 'rgba(211,47,47,0.08)' },
                            '& .MuiSvgIcon-root': { color: 'error.main' }
                          }}
                          onClick={() => setModal(true)}
                          disabled={selected.length === 0}
                          variant="outlined"
                          color="error"
                          startIcon={
                            <SvgIcon fontSize="small">
                              <Trash2Icon />
                            </SvgIcon>
                          }
                          aria-label="Delete selected media"
                        >
                          Delete
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      sx={{
                        mx: 1,
                        cursor: 'pointer',
                        color: 'black',
                        borderColor: 'error.main',
                        '&:hover': { backgroundColor: 'rgba(211,47,47,0.08)' },
                        '& .MuiSvgIcon-root': { color: 'error.main' }
                      }}
                      onClick={() => setModal(true)}
                      disabled={selected.length === 0}
                      variant="outlined"
                      color="error"
                      startIcon={
                        <SvgIcon fontSize="small">
                          <Trash2Icon />
                        </SvgIcon>
                      }
                      aria-label="Delete selected media"
                    >
                      Delete
                    </Button>
                  )}

                  <Button variant="contained" onClick={() => navigate('/app/savemedia')}
                    sx={{ textTransform: 'none', bgcolor: '#5b67d6', fontWeight: 500, px: 3, borderRadius: '6px', boxShadow: 'none', '&:hover': { bgcolor: '#4c5bc6', boxShadow: 'none' } }}>
                    ADD MEDIA
                  </Button>

                  <Button variant="contained" onClick={() => navigate('/app/createmedia')}
                    sx={{ textTransform: 'none', bgcolor: '#5b67d6', fontWeight: 500, px: 3, borderRadius: '6px', boxShadow: 'none', '&:hover': { bgcolor: '#4c5bc6', boxShadow: 'none' } }}>
                    CREATE MEDIA
                  </Button>

                  <Button variant="contained" onClick={() => navigate('/app/splitmedia')}
                    sx={{ textTransform: 'none', bgcolor: '#5b67d6', fontWeight: 500, px: 3, borderRadius: '6px', boxShadow: 'none', '&:hover': { bgcolor: '#4c5bc6', boxShadow: 'none' } }}>
                    CREATE SPLIT SCREEN
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Tabs + Grid */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 1400, bgcolor: 'transparent', borderRadius: '8px', boxShadow: 'none', overflow: 'hidden' }}>
              <Box sx={{ borderBottom: 'none', px: 2, pt: 3, display: 'flex', justifyContent: 'center', bgcolor: 'transparent' }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  {/* Tabs kept centered (unchanged visuals) */}
                  <Box sx={{ margin: '0 auto' }}>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
                      sx={{
                        minHeight: 48,
                        position: 'relative',
                        '& .MuiTabs-flexContainer': { gap: 1, alignItems: 'center' },
                        '& .MuiButtonBase-root, & .MuiTab-root': {
                          bgcolor: 'transparent !important',
                          boxShadow: 'none !important',
                        },
                        '& .MuiButtonBase-root.Mui-focusVisible': { bgcolor: 'transparent !important' },
                        '& .MuiTab-root:focus': { outline: 'none', bgcolor: 'transparent !important' },
                        '& .MuiTab-root': {
                          height: 36,
                          padding: '0 18px',
                          borderRadius: '999px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '14px',
                          color: '#6b7280',
                          transition: 'color 200ms ease',
                          zIndex: 3,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        },
                        '& .MuiTab-root .MuiTab-wrapper': { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
                        '& .MuiTab-root.Mui-selected': { bgcolor: 'transparent !important', color: '#1976d2', zIndex: 3 },
                        '& .MuiTabs-indicator': {
                          position: 'absolute',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: 36,
                          transition: 'left 300ms cubic-bezier(0.4,0,0.2,1), width 300ms cubic-bezier(0.4,0,0.2,1)',
                          borderRadius: '999px',
                          zIndex: 2,
                          backgroundColor: 'transparent',
                          pointerEvents: 'none'
                        },
                        '& .MuiTabs-indicatorSpan': {
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#e3f2fd',
                          borderRadius: '999px',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      <Tab disableRipple label="IMAGES" value="IMAGES" />
                      <Tab disableRipple label="VIDEOS" value="VIDEOS" />
                    </Tabs>
                  </Box>

                  {/* Select all - extreme right of tabs bar, unchanged placement */}
                  <Box sx={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center' }}>
                    {hasSelection && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <Checkbox
                          size="small"
                          checked={allVisibleSelected}
                          indeterminate={someVisibleSelected}
                          onChange={handleSelectAllVisible}
                          inputProps={{ 'aria-label': 'Select all visible media' }}
                          sx={{ p: 0, mr: 0.5 }}
                        />
                        <Typography variant="body2" sx={{ userSelect: 'none' }}>Select all</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
               </Box>

              <Box sx={{ p: 3, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', bgcolor: '#fff', borderRadius: '0 0 8px 8px' }}>
                {!mediaItem || mediaItem.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                    <Typography variant="body1" color="text.secondary">No media found</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
                    {mediaItem.map((item) => renderMediaCard(item))}
                  </Box>
                )}
              </Box>

              {/* pagination placed just below the media grid (outside the scrollable area) */}
              {totalPages > 0 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  mt: 1,
                  mb: 2,
                  // lift it a bit up so it doesn't get clipped by the viewport/footer
                  transform: 'translateY(-8px)',
                  zIndex: 2
                }}>
                  <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" size="medium" showFirstButton showLastButton />
                  <Typography variant="body2" color="text.secondary">
                    {totalRecords} {activeTab === 'IMAGES' ? 'images' : activeTab === 'VIDEOS' ? 'videos' : 'gifs'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

const mapStateToProps = ({ root = {} }) => ({});
const mapDispatchToProps = (dispatch) => ({
  getUserComponentListWithPagination: (data, callback) => dispatch(getUserComponentListWithPagination(data, callback)),
  validateDeleteComponentList: (data, callback) => dispatch(validateDeleteComponentList(data, callback)),
  deleteComponentList: (data, callback) => dispatch(deleteComponentList(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(MediaList);
