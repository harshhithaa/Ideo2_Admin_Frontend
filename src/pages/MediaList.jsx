/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { useNavigate, useLocation, useNavigationType } from "react-router-dom";
// replace aliased imports with relative paths
import Api from "../service/Api";

const ACTIVE_TAB_KEY = 'mediaList_activeTab';

const UPLOADED_MEDIA_KEY = 'IDEOGRAM_UPLOADED_MEDIA';
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 20;

const MediaList = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  // detect navigation kind to decide whether this load is a "fresh navigation" or a refresh/back
  const navigationType = useNavigationType();

  // ✅ CHECK FOR NAVIGATION STATE (from upload) BEFORE LOCALSTORAGE / PUSH handling
  const getInitialTab = () => {
    // Priority 1: Check if navigated from upload with a specific tab
    if (location.state?.openTab && location.state?.fromUpload) {
      const requestedTab = location.state.openTab;
      if (['IMAGES', 'VIDEOS', 'GIFS'].includes(requestedTab)) {
        return requestedTab;
      }
    }

    // Priority 2: If this load is a PUSH (user clicked a link from another page), treat as fresh navigation -> default to IMAGES
    // This ensures Dashboard/Playlist/etc. links always open IMAGES
    if (navigationType === 'PUSH') {
      return 'IMAGES';
    }

    // Priority 3: For non-PUSH (refresh/back), restore from localStorage if available
    try {
      const saved = localStorage.getItem(ACTIVE_TAB_KEY);
      if (saved && ['IMAGES', 'VIDEOS', 'GIFS'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.error('Error reading active tab from localStorage:', e);
    }

    // Default fallback
    return 'IMAGES';
  };

  const [mediaItem, setMedia] = useState([]);
  const [selected, setselected] = useState([]);
  const [showmodal, setModal] = useState(false);
  const [showErrModal, setErrModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [prevActiveTab, setPrevActiveTab] = useState(null);

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

  // Auto-dismiss top-centered notification for success messages
  useEffect(() => {
    if (!box) return undefined;
    const timer = setTimeout(() => setbox(false), 1500); // auto-dismiss after 1.5s
    return () => clearTimeout(timer);
  }, [box]);

  // ✅ CLEAR NAVIGATION STATE AFTER READING IT (only when coming from upload)
  useEffect(() => {
    if (location.state?.fromUpload) {
      // Clear the navigation state to prevent tab switching on subsequent visits
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // ✅ PERSIST ACTIVE TAB TO LOCALSTORAGE WHENEVER IT CHANGES (used for refresh/back)
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    } catch (e) {
      console.error('Error saving active tab to localStorage:', e);
    }
  }, [activeTab]);

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
  // Options: { setDisplay: boolean } - when true, update mediaItem to returned list
  const fetchMediaList = async (page, mediaType, search = searchQuery, options = {}) => {
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
          // clear totals for this mediaType
          if (mediaType === 'image') { setImageTotalRecords(0); setImageTotalPages(0); }
          else if (mediaType === 'video') { setVideoTotalRecords(0); setVideoTotalPages(0); }
          else if (mediaType === 'gif') { setGifTotalRecords(0); setGifTotalPages(0); }

          setMedia((prev) => {
            // keep placeholders on top if any
            const placeholders = placeholdersRef.current || [];
            const serverList = [];
            return [...placeholders, ...serverList];
          });

          resolve({ componentList: [], totalRecords: 0, mediaType });
          return;
        }

        const data = res.data || {};
        const componentList = data.ComponentList || [];
        const totalRecords = componentList.length > 0 && componentList[0].TotalRecords
          ? Number(componentList[0].TotalRecords)
          : (data.TotalRecords || 0);

        if (mediaType === 'image') { setImageTotalRecords(totalRecords); setImageTotalPages(Math.ceil(totalRecords / pageSize)); }
        else if (mediaType === 'video') { setVideoTotalRecords(totalRecords); setVideoTotalPages(Math.ceil(totalRecords / pageSize)); }
        else if (mediaType === 'gif') { setGifTotalRecords(totalRecords); setGifTotalPages(Math.ceil(totalRecords / pageSize)); }

        // Merge placeholders with server list: placeholders not present on server remain on top
        const placeholders = placeholdersRef.current || [];
        const serverList = Array.isArray(componentList) ? componentList : [];
        const serverRefs = new Set(serverList.map((i) => i.MediaRef));
        const missingPlaceholders = (placeholders || []).filter((p) => !serverRefs.has(p.MediaRef));
        setMedia([...missingPlaceholders, ...serverList]);

        resolve({ componentList: serverList, totalRecords, mediaType });
      });
    });
  };

  // ✅ INITIAL LOAD - FETCH FOR RESTORED ACTIVE TAB
  useEffect(() => {
    let mediaType = '';
    if (activeTab === 'IMAGES') mediaType = 'image';
    else if (activeTab === 'VIDEOS') mediaType = 'video';
    else if (activeTab === 'GIFS') mediaType = 'gif';

    fetchMediaList(1, mediaType, '', { setDisplay: true });
  }, []);

  // ✅ REFETCH WHEN TAB CHANGES -> display for that tab
  useEffect(() => {
    let mediaType = '';
    if (activeTab === 'IMAGES') mediaType = 'image';
    else if (activeTab === 'VIDEOS') mediaType = 'video';
    else if (activeTab === 'GIFS') mediaType = 'gif';

    // when switching tab normally, show results for that tab
    fetchMediaList(getCurrentPage(), mediaType, searchQuery, { setDisplay: true });
    // clear selection when tab changes
    setselected([]);
  }, [activeTab]);

  // ✅ REFETCH WHEN PAGE CHANGES -> display for current tab
  useEffect(() => {
    let mediaType = '';
    if (activeTab === 'IMAGES') mediaType = 'image';
    else if (activeTab === 'VIDEOS') mediaType = 'video';
    else if (activeTab === 'GIFS') mediaType = 'gif';

    fetchMediaList(getCurrentPage(), mediaType, searchQuery, { setDisplay: true });
  }, [imagePage, videoPage, gifPage]);

  // ✅ HANDLE GLOBAL SEARCH
  const handleSearch = async (query) => {
    // save/restore previous active tab when search begins/ends
    const trimmed = String(query || '').trim();
    if (trimmed && !searchQuery) {
      setPrevActiveTab(activeTab);
    }

    setSearchQuery(trimmed);

    // if search cleared -> restore previous tab (or default) and fetch
    if (!trimmed) {
      const restoreTab = prevActiveTab || 'IMAGES';
      setActiveTab(restoreTab);
      // ensure we fetch data for restored tab and display it
      let mediaType = restoreTab === 'IMAGES' ? 'image' : restoreTab === 'VIDEOS' ? 'video' : 'gif';
      // set page to 1 for restored tab
      if (restoreTab === 'IMAGES') setImagePage(1);
      if (restoreTab === 'VIDEOS') setVideoPage(1);
      if (restoreTab === 'GIFS') setGifPage(1);
      await fetchMediaList(1, mediaType, '', { setDisplay: true });
      setPrevActiveTab(null);
      return;
    }

    // run search across all three tabs concurrently (page 1)
    const [imgRes, vidRes, gifRes] = await Promise.all([
      fetchMediaList(1, 'image', trimmed, { setDisplay: false }),
      fetchMediaList(1, 'video', trimmed, { setDisplay: false }),
      fetchMediaList(1, 'gif', trimmed, { setDisplay: false })
    ]);

    // decide which tab to show: priority Images -> Videos -> GIFs when any matches;
    // fallback to highest match count if multiple match; otherwise don't change tab (keep prev)
    const imgCount = imgRes?.totalRecords || 0;
    const vidCount = vidRes?.totalRecords || 0;
    const gifCount = gifRes?.totalRecords || 0;

    let targetTab = null;

    if (imgCount > 0) targetTab = 'IMAGES';
    else if (vidCount > 0) targetTab = 'VIDEOS';
    else if (gifCount > 0) targetTab = 'GIFS';

    // If multiple tabs have matches, choose priority above; (alternative: pick highest count)
    if (!targetTab) {
      // no matches in any tab -> clear displayed results (show "No matches found")
      setMedia([]);
      // keep user on previous tab (do not switch) - prevActiveTab was saved earlier
      return;
    }

    // switch to target tab and display its componentList
    setActiveTab(targetTab);
    setselected([]);
    // reset page for that tab to 1
    if (targetTab === 'IMAGES') setImagePage(1);
    if (targetTab === 'VIDEOS') setVideoPage(1);
    if (targetTab === 'GIFS') setGifPage(1);

    // display the results for the chosen tab
    if (targetTab === 'IMAGES') setMedia(imgRes.componentList || []);
    if (targetTab === 'VIDEOS') setMedia(vidRes.componentList || []);
    if (targetTab === 'GIFS') setMedia(gifRes.componentList || []);
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
          
          fetchMediaList(getCurrentPage(), mediaType, searchQuery, { setDisplay: true });
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

  // Poll for a single media Ref until DB returns actual record, then replace placeholder
  const pollForMedia = async (mediaRef, attemptsLeft = POLL_MAX_ATTEMPTS) => {
    if (!mediaRef || attemptsLeft <= 0) {
      // give up
      return;
    }
    try {
      // Let Api client handle auth headers (avoid direct store import here)
      const resp = await Api.get('/admin/fetchmedia', {
        params: { MediaRef: mediaRef }
      });
      if (!resp.data.Error && resp.data.Details) {
        const serverItem = resp.data.Details;
        // robust replace: match by MediaRef OR by name/path (covers tmp blobs)
        setMedia((prev) => {
          let list = Array.isArray(prev) ? prev.slice() : [];
          const idx = list.findIndex((m) =>
            m.MediaRef === mediaRef ||
            (m.MediaRef && serverItem.MediaRef && m.MediaRef === serverItem.MediaRef) ||
            (m.MediaName && serverItem.MediaName && m.MediaName === serverItem.MediaName) ||
            (m.MediaPath && serverItem.MediaPath && m.MediaPath === serverItem.MediaPath)
          );

          if (idx !== -1) {
            list[idx] = { ...serverItem };
          } else {
            // remove matching placeholders (same name/path) before inserting
            list = list.filter((m) =>
              !(m.isProcessing && ((m.MediaName && serverItem.MediaName && m.MediaName === serverItem.MediaName) ||
                (m.MediaPath && serverItem.MediaPath && m.MediaPath === serverItem.MediaPath)))
            );
            list.unshift(serverItem);
          }

          return list;
        });

        // remove placeholder entries from ref (match by name/path or tmp ref)
        placeholdersRef.current = (placeholdersRef.current || []).filter((p) =>
          !(p.MediaRef === mediaRef ||
            (p.MediaName && serverItem.MediaName && p.MediaName === serverItem.MediaName) ||
            (p.MediaPath && serverItem.MediaPath && p.MediaPath === serverItem.MediaPath))
        );
        return;
      }
    } catch (err) {
      // ignore transient errors and try again
    }
    // schedule next try
    setTimeout(() => pollForMedia(mediaRef, attemptsLeft - 1), POLL_INTERVAL_MS);
  };

  // -------------------------
  // Placeholder handling: read persisted placeholders once on mount and keep in a ref.
  // This ensures placeholders are available immediately and merged with server results.
  // -------------------------
  const placeholdersRef = useRef([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(UPLOADED_MEDIA_KEY);
      if (raw) {
        const placeholders = JSON.parse(raw);
        if (Array.isArray(placeholders) && placeholders.length > 0) {
          const phItems = placeholders.map((p) => ({
            MediaRef: p.MediaRef || (`tmp_${Date.now()}_${Math.random().toString(36).substr(2,5)}`),
            MediaName: p.fileName || p.MediaName || 'Processing...',
            MediaPath: p.fileUrl || p.FileUrl || null,
            Thumbnail: p.fileUrl || p.Thumbnail || null,
            MediaType: p.fileMimetype || (p.fileUrl && p.fileUrl.toLowerCase().includes('.gif') ? 'gif' : 'image'),
            isProcessing: true,
            processingProgress: 0
          }));

          placeholdersRef.current = phItems;
          // show placeholders immediately
          setMedia((prev) => [...phItems, ...(Array.isArray(prev) ? prev : [])]);
          // clear persisted placeholders so we don't reinsert later
          localStorage.removeItem(UPLOADED_MEDIA_KEY);
          // start polling each placeholder for final DB record
          phItems.forEach((it) => { if (it.MediaRef) pollForMedia(it.MediaRef); });
        }
      }
    } catch (e) {
      console.error('Error reading uploaded placeholder from localStorage', e);
    }
  }, []); // run once on mount

  // listen for upload progress events (update placeholders' processingProgress)
  useEffect(() => {
    const progressHandler = (ev) => {
      const { progress = 0, placeholders = [] } = ev?.detail || {};
      if (!Array.isArray(placeholders) || placeholders.length === 0) {
        // if no placeholders provided, just update any processing items to progress
        setMedia((prev) => {
          return (Array.isArray(prev) ? prev.map((m) => (m.isProcessing ? { ...m, processingProgress: progress } : m)) : prev);
        });
        return;
      }

      // update placeholders in state/ref by matching MediaRef or fileName
      setMedia((prev) => {
        let list = Array.isArray(prev) ? prev.slice() : [];
        placeholders.forEach((ph) => {
          const name = ph.fileName || ph.MediaName;
          const tmpRef = ph.MediaRef;
          const idx = list.findIndex((m) =>
            m.MediaRef === tmpRef || (m.MediaName && name && m.MediaName === name) || (m.MediaPath && ph.fileUrl && m.MediaPath === ph.fileUrl)
          );
          if (idx !== -1) {
            list[idx] = { ...list[idx], isProcessing: true, processingProgress: progress };
          } else {
            // if not yet in list, insert placeholder at top with progress
            const newPh = {
              MediaRef: tmpRef,
              MediaName: name || 'Processing...',
              MediaPath: ph.fileUrl || null,
              Thumbnail: ph.fileUrl || null,
              isProcessing: true,
              processingProgress: progress
            };
            list.unshift(newPh);
          }
        });
        return list;
      });

      // keep placeholdersRef in sync so pollForMedia won't re-add them
      placeholdersRef.current = (placeholdersRef.current || []).slice();
      placeholders.forEach((p) => {
        const existing = placeholdersRef.current.find((x) => x.MediaRef === p.MediaRef || x.fileName === p.fileName);
        if (!existing) placeholdersRef.current.push(p);
      });
    };

    window.addEventListener('ideogram:uploadProgress', progressHandler);
    return () => window.removeEventListener('ideogram:uploadProgress', progressHandler);
  }, []);

  const renderMediaCard = (item) => {
    const src = buildSrc(item?.MediaPath);
    const thumb = buildSrc(item?.Thumbnail || item?.MediaThumb || item?.Poster);
    const rawType = (item?.MediaType || '').toString().toLowerCase();

    const isProcessing = item.isProcessing || item.processing || item.isProcessing === true;
    const progressPct = Math.min(100, Number(item.processingProgress || 0));

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
          {isProcessing ? (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <Box sx={{ width: '80%', bgcolor: '#e0e0e0', height: 10, borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ width: `${progressPct}%`, height: '100%', bgcolor: '#5b67d6', transition: 'width 0.3s' }} />
              </Box>
              {/* show only label (no percentage) */}
              <Typography variant="caption" color="text.secondary">
                {progressPct >= 100 ? 'Finalizing...' : 'Processing...'}
              </Typography>
            </Box>
          ) : (
            isVideo ? (
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

  // Quick helper to render tab label with optional counts during search
  const tabLabel = (label, count) => {
    if (searchQuery) return `${label} (${count || 0})`;
    return label;
  };

  // helper to map activeTab to mediaType used by fetchMediaList
  const activeTabToMediaType = (tab) => {
    if (!tab) return null;
    const t = tab.toString().toLowerCase();
    if (t.includes('video')) return 'video';
    if (t.includes('gif')) return 'gif';
    return 'image';
  };

  // listen for upload complete events and refresh current page immediately
  useEffect(() => {
    const handler = (ev) => {
      const uploaded = ev?.detail?.uploadedMedia || [];

      // Replace matching placeholders with server items (match by name or path) to avoid duplicates
      if (uploaded.length > 0) {
        setMedia((prev) => {
          let list = Array.isArray(prev) ? prev.slice() : [];
          uploaded.forEach((si) => {
            const serverName = si.fileName || si.MediaName;
            const serverPath = si.fileUrl || si.MediaPath;

            // find existing entry by MediaRef OR by name/path (covers tmp placeholders)
            const idx = list.findIndex((m) =>
              m.MediaRef === si.MediaRef ||
              (m.MediaName && serverName && m.MediaName === serverName) ||
              (m.MediaPath && serverPath && m.MediaPath === serverPath)
            );

            const serverItem = {
              ...si,
              MediaName: serverName || si.MediaName,
              MediaPath: serverPath || si.MediaPath,
              MediaType: si.fileMimetype || si.MediaType
            };

            if (idx !== -1) {
              list[idx] = serverItem;
            } else {
              // remove placeholders with same name/path then add server item on top
              list = list.filter((m) =>
                !(m.isProcessing && ((m.MediaName && serverName && m.MediaName === serverName) || (m.MediaPath && serverPath && m.MediaPath === serverPath)))
              );
              list.unshift(serverItem);
            }
          });
          return list;
        });

        // remove those placeholders from ref so poll won't keep them
        placeholdersRef.current = (placeholdersRef.current || []).filter((p) =>
          !uploaded.some((si) => {
            const serverName = si.fileName || si.MediaName;
            const serverPath = si.fileUrl || si.MediaPath;
            return (p.MediaName && serverName && p.MediaName === serverName) || (p.MediaPath && serverPath && p.MediaPath === serverPath);
          })
        );
      }

      // also refresh counts / server data to stay consistent
      const mediaType = activeTabToMediaType(activeTab);
      fetchMediaList(getCurrentPage(), mediaType, searchQuery, { setDisplay: true }).catch(() => {});
    };

    window.addEventListener('ideogram:uploadComplete', handler);
    return () => window.removeEventListener('ideogram:uploadComplete', handler);
  }, [activeTab, imagePage, videoPage, gifPage, searchQuery]);

  return (
    <>
      <Helmet><title>Media | Ideogram</title></Helmet>

      {box && (
        <Stack
          sx={{
            position: 'fixed',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'auto',
            maxWidth: 400
          }}
          spacing={2}
        >
          <Alert severity={color}>
            {boxMessage}
          </Alert>
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
                  sx={{ width: 320, bgcolor: 'transparent', mr: 2 }}
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
                    <Tabs value={activeTab} onChange={handleTabChange}>
                      <Tab disableRipple label={tabLabel('IMAGES', imageTotalRecords)} value="IMAGES" />
                      <Tab disableRipple label={tabLabel('VIDEOS', videoTotalRecords)} value="VIDEOS" />
                      <Tab disableRipple label={tabLabel('GIFS', gifTotalRecords)} value="GIFS" />
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
                {(!mediaItem || mediaItem.length === 0) ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchQuery ? 'No matches found' : 'No media found'}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
                    {mediaItem.map((item) => renderMediaCard(item))}
                  </Box>
                )}
              </Box>

              {/* TAB-SPECIFIC PAGINATION */}
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
