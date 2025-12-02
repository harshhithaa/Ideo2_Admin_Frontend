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

  // ✅ SEPARATE STATE FOR EACH TAB
  const [imagePage, setImagePage] = useState(1);
  const [videoPage, setVideoPage] = useState(1);
  const [gifPage, setGifPage] = useState(1);

  const [imageTotalPages, setImageTotalPages] = useState(0);
  const [videoTotalPages, setVideoTotalPages] = useState(0);
  const [gifTotalPages, setGifTotalPages] = useState(0);

  const [imageTotalRecords, setImageTotalRecords] = useState(0);
  const [videoTotalRecords, setVideoTotalRecords] = useState(0);
  const [gifTotalRecords, setGifTotalRecords] = useState(0);

  const pageSize = 12;
  const [loading, setLoading] = useState(false);

  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');

  const navigate = useNavigate();

  // ✅ GET CURRENT PAGE AND TOTALS BASED ON ACTIVE TAB
  const getCurrentPage = () => {
    if (activeTab === 'IMAGES') return imagePage;
    if (activeTab === 'VIDEOS') return videoPage;
    return gifPage;
  };

  const getCurrentTotalPages = () => {
    if (activeTab === 'IMAGES') return imageTotalPages;
    if (activeTab === 'VIDEOS') return videoTotalPages;
    return gifTotalPages;
  };

  const getCurrentTotalRecords = () => {
    if (activeTab === 'IMAGES') return imageTotalRecords;
    if (activeTab === 'VIDEOS') return videoTotalRecords;
    return gifTotalRecords;
  };

  const setCurrentPage = (page) => {
    if (activeTab === 'IMAGES') setImagePage(page);
    else if (activeTab === 'VIDEOS') setVideoPage(page);
    else setGifPage(page);
  };

  const buildSrc = (rawPath) => {
    if (!rawPath) return null;
    let p = String(rawPath);
    p = p.replace(/\\/g, '/').trim();
    if (p.indexOf('undefined') !== -1) return null;
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/')) return `${window.location.origin}${p}`;
    try { return `${window.location.origin}/${encodeURI(p)}`; } catch (e) { return p; }
  };

  // ✅ UNIFIED FETCH FUNCTION WITH TAB-SPECIFIC STATE
  const fetchMediaList = async (page, mediaType, search = searchQuery) => {
    setLoading(true);

    const requestData = {
      componenttype: 1,
      searchText: search || '',
      mediaType: mediaType || null,
      isActive: 1,
      userId: null,
      pageNumber: page,
      pageSize: pageSize
    };

    return new Promise((resolve) => {
      props.getUserComponentListWithPagination(requestData, (res) => {
        setLoading(false);

        if (!res || res.exists) {
          setMedia([]);
          if (mediaType === 'image') {
            setImageTotalRecords(0);
            setImageTotalPages(0);
          } else if (mediaType === 'video') {
            setVideoTotalRecords(0);
            setVideoTotalPages(0);
          } else if (mediaType === 'gif') {
            setGifTotalRecords(0);
            setGifTotalPages(0);
          }
          resolve();
          return;
        }

        const data = res.data || {};
        const componentList = data.ComponentList || [];
        const totalRecords = componentList.length > 0 && componentList[0].TotalRecords 
          ? Number(componentList[0].TotalRecords) 
          : (data.TotalRecords || 0);

        setMedia(componentList);

        if (mediaType === 'image') {
          setImageTotalRecords(totalRecords);
          setImageTotalPages(Math.ceil(totalRecords / pageSize));
        } else if (mediaType === 'video') {
          setVideoTotalRecords(totalRecords);
          setVideoTotalPages(Math.ceil(totalRecords / pageSize));
        } else if (mediaType === 'gif') {
          setGifTotalRecords(totalRecords);
          setGifTotalPages(Math.ceil(totalRecords / pageSize));
        }

        resolve();
      });
    });
  };

  // ✅ INITIAL LOAD - IMAGES TAB
  useEffect(() => {
    fetchMediaList(1, 'image', '');
  }, []);

  // ✅ REFETCH WHEN TAB CHANGES
  useEffect(() => {
    let mediaType = '';
    if (activeTab === 'IMAGES') mediaType = 'image';
    else if (activeTab === 'VIDEOS') mediaType = 'video';
    else if (activeTab === 'GIFS') mediaType = 'gif';

    fetchMediaList(getCurrentPage(), mediaType, searchQuery);
  }, [activeTab]);

  // ✅ REFETCH WHEN PAGE CHANGES
  useEffect(() => {
    let mediaType = '';
    if (activeTab === 'IMAGES') mediaType = 'image';
    else if (activeTab === 'VIDEOS') mediaType = 'video';
    else if (activeTab === 'GIFS') mediaType = 'gif';

    fetchMediaList(getCurrentPage(), mediaType, searchQuery);
  }, [imagePage, videoPage, gifPage]);

  // ✅ HANDLE SEARCH
  const handleSearch = (query) => {
    setSearchQuery(query);
    let mediaType = '';
    if (activeTab === 'IMAGES') {
      mediaType = 'image';
      setImagePage(1);
    } else if (activeTab === 'VIDEOS') {
      mediaType = 'video';
      setVideoPage(1);
    } else if (activeTab === 'GIFS') {
      mediaType = 'gif';
      setGifPage(1);
    }
    fetchMediaList(1, mediaType, query);
  };

  // ✅ HANDLE TAB CHANGE
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setMedia([]);
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
          
          // ✅ REFRESH CURRENT TAB AFTER DELETE
          let mediaType = '';
          if (activeTab === 'IMAGES') mediaType = 'image';
          else if (activeTab === 'VIDEOS') mediaType = 'video';
          else if (activeTab === 'GIFS') mediaType = 'gif';
          
          fetchMediaList(getCurrentPage(), mediaType, searchQuery);
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
    
    // ✅ PROPER TYPE DETECTION
    const isGif = rawType === 'gif';
    const isVideo = rawType === 'video';
    const isImage = rawType === 'image';
    
    const isSelected = selected.indexOf(item.MediaRef) !== -1;

    return (
      <Box key={item.MediaRef} onClick={() => toggleSelection(item.MediaRef)}
        sx={{
          position: 'relative', borderRadius: '8px', overflow: 'hidden',
          bgcolor: '#fff', cursor: 'pointer',
          border: isSelected ? '2px solid #1976d2' : '1px solid #e5e7eb',
          transition: 'all 0.2s ease', 
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' }
        }}
      >
        <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} 
          onChange={() => toggleSelection(item.MediaRef)}
          sx={{ position: 'absolute', left: 8, top: 8, zIndex: 5, bgcolor: 'transparent' }} />
        
        <Box sx={{ width: '100%', paddingTop: '100%', position: 'relative', bgcolor: '#f4f4f4' }}>
          {isVideo ? (
            thumb ? (
              <img src={thumb} alt={item.MediaName} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : src ? (
              <video src={src} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                muted playsInline />
            ) : (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                No media
              </Box>
            )
          ) : (
            src ? (
              <img src={src} alt={item.MediaName} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                No media
              </Box>
            )
          )}
        </Box>
        
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px', bgcolor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.MediaName}
        </Box>
      </Box>
    );
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const hasSelection = Array.isArray(selected) && selected.length > 0;
  const visibleRefs = Array.isArray(mediaItem) ? mediaItem.map((it) => it.MediaRef) : [];
  const allVisibleSelected = visibleRefs.length > 0 && visibleRefs.every((r) => selected.includes(r));
  const someVisibleSelected = visibleRefs.some((r) => selected.includes(r)) && !allVisibleSelected;

  const handleSelectAllVisible = () => {
    if (visibleRefs.length === 0) return;
    if (allVisibleSelected) {
      setselected((prev) => prev.filter((r) => !visibleRefs.includes(r)));
    } else {
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
          <Modal open={showmodal} onClose={() => setModal(false)}>
            <Box sx={style}>
              <h4 style={{ marginBottom: 20 }}>Are you sure you want to delete {selected.length} item(s)?</h4>
              <Grid container spacing={2}>
                <Grid item><Button variant="contained" color="success" onClick={() => deleteComponent()}>Yes</Button></Grid>
                <Grid item><Button variant="contained" color="error" onClick={() => setModal(false)}>No</Button></Grid>
              </Grid>
            </Box>
          </Modal>

          <Modal open={showErrModal} onClose={() => setErrModal(false)}>
            <Box sx={style}>
              <h4 style={{ marginBottom: 20 }}>Cannot delete this media as it is running in these playlists:</h4>
              <ul style={{ marginBottom: 20 }}>{playlists.map((playlist, index) => <li key={index}>{playlist}</li>)}</ul>
              <Grid container><Grid item>
                <Button variant="contained" color="success" onClick={() => { setErrModal(false); setPlaylists([]); }}>Ok</Button>
              </Grid></Grid>
            </Box>
          </Modal>

          {/* Top Toolbar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0 }}>
            <Box sx={{ width: '100%', maxWidth: 1400, p: 2, bgcolor: 'transparent' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                {/* Search Box */}
                <TextField
                  size="small"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search Media"
                  sx={{ width: 220, bgcolor: 'transparent', mr: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SvgIcon fontSize="small" color="action"><SearchIcon /></SvgIcon>
                      </InputAdornment>
                    )
                  }}
                />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {/* Delete button - identical styling/behavior to ScheduleList delete button */}
                  {!hasSelection ? (
                    <Tooltip title="Select media(s) to delete" arrow>
                      <span>
                        <Button
                          sx={{ mx: 1, color: 'black', borderColor: 'error.main' }}
                          onClick={() => setModal(true)}
                          disabled={selected.length === 0}
                          variant="outlined"
                          color="error"
                          startIcon={<SvgIcon fontSize="small"><Trash2Icon /></SvgIcon>}
                        >
                          Delete
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      sx={{ mx: 1, color: 'black', borderColor: 'error.main' }}
                      onClick={() => setModal(true)}
                      disabled={selected.length === 0}
                      variant="outlined"
                      color="error"
                      startIcon={<SvgIcon fontSize="small"><Trash2Icon /></SvgIcon>}
                    >
                      Delete
                    </Button>
                  )}

                  <Button variant="contained" onClick={() => navigate('/app/savemedia')}
                    sx={{ textTransform: 'none', bgcolor: '#5b67d6', fontWeight: 500, px: 3 }}>
                    ADD MEDIA
                  </Button>
                  <Button variant="contained" onClick={() => navigate('/app/createmedia')}
                    sx={{ textTransform: 'none', bgcolor: '#5b67d6', fontWeight: 500, px: 3 }}>
                    CREATE MEDIA
                  </Button>
                  <Button variant="contained" onClick={() => navigate('/app/splitmedia')}
                    sx={{ textTransform: 'none', bgcolor: '#5b67d6', fontWeight: 500, px: 3 }}>
                    CREATE SPLIT SCREEN
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Tabs + Grid */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 1400, bgcolor: 'transparent' }}>
              <Box sx={{ borderBottom: 'none', px: 2, pt: 3, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ margin: '0 auto' }}>
                    {/* ✅ ADD GIFS TAB */}
                    <Tabs value={activeTab} onChange={handleTabChange}>
                      <Tab disableRipple label="IMAGES" value="IMAGES" />
                      <Tab disableRipple label="VIDEOS" value="VIDEOS" />
                      <Tab disableRipple label="GIFS" value="GIFS" />
                    </Tabs>
                  </Box>

                  <Box sx={{ position: 'absolute', right: 8 }}>
                    {hasSelection && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          size="small"
                          checked={allVisibleSelected}
                          indeterminate={someVisibleSelected}
                          onChange={handleSelectAllVisible}
                          sx={{ p: 0, mr: 0.5 }}
                        />
                        <Typography variant="body2">Select all</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 3, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', bgcolor: '#fff' }}>
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

              {/* ✅ TAB-SPECIFIC PAGINATION */}
              {getCurrentTotalPages() > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 1, mb: 2 }}>
                  <Pagination 
                    count={getCurrentTotalPages()} 
                    page={getCurrentPage()} 
                    onChange={handlePageChange} 
                    color="primary" 
                    showFirstButton 
                    showLastButton 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {getCurrentTotalRecords()} {activeTab === 'IMAGES' ? 'images' : activeTab === 'VIDEOS' ? 'videos' : 'gifs'}
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
