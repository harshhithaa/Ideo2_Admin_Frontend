/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import { useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Edit as EditIcon, RefreshCw as RefreshIcon } from 'react-feather';
import {
  Box,
  Button,
  Card,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  SvgIcon,
  Chip,
  Tooltip,
  CircularProgress,
  IconButton
} from '@mui/material';
import PropTypes from 'prop-types';

const MonitorListResults = (props) => {
  const { monitors, search, playlists } = props || {};
  const [selectedMonitorRefs, setSelectedMonitorRefs] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);
  const [allchecked, setall] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState({});
  const [monitorStatuses, setMonitorStatuses] = useState({});

  // Helper to format date from YYYY-MM-DD (or any parseable date) to DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Try native Date parse first
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    // Fallback for YYYY-MM-DD or similar
    const parts = String(dateStr).split(/[-\/]/);
    if (parts.length >= 3) {
      const [y, m, d2] = parts;
      return `${String(d2).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    return dateStr;
  };

  // Helper to format "Last seen" without seconds (HH:MM AM/PM)
  const formatLastSeen = (ts) => {
    if (!ts) return 'N/A';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return String(ts);
      
      // Format date part
      const datePart = d.toLocaleDateString(undefined, { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Format time part without seconds
      const timePart = d.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      return `${datePart}, ${timePart}`;
    } catch (e) {
      return String(ts);
    }
  };

  const filtered = monitors
    ? monitors.filter((item) =>
        (item.MonitorName || item.Name || '').toString().toLowerCase().includes((search || '').toLowerCase())
      )
    : [];

  const handleSelectAll = (event) => {
    let newSelectedMonitorRefs;
    setall(event.target.checked);

    if (monitors && monitors.length > 0 && event.target.checked) {
      newSelectedMonitorRefs = monitors.map((monitor) => monitor.MonitorRef);
    } else {
      newSelectedMonitorRefs = [];
    }
    props.setselected(newSelectedMonitorRefs);
    setSelectedMonitorRefs(newSelectedMonitorRefs);
  };

  const handleSelectOne = (event, MonitorRef) => {
    const selectedIndex = selectedMonitorRefs.indexOf(MonitorRef);
    let newSelectedMonitorRefs = [];

    if (selectedIndex === -1) {
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(selectedMonitorRefs, MonitorRef);
    } else if (selectedIndex === 0) {
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(selectedMonitorRefs.slice(1));
    } else if (selectedIndex === selectedMonitorRefs.length - 1) {
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(selectedMonitorRefs.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(
        selectedMonitorRefs.slice(0, selectedIndex),
        selectedMonitorRefs.slice(selectedIndex + 1)
      );
    }
    props.setselected(newSelectedMonitorRefs);
    setSelectedMonitorRefs(newSelectedMonitorRefs);
  };

  // Fetch status for a single monitor
  const handleRefreshStatus = async (monitorRef) => {
    console.log('🔵 handleRefreshStatus called for:', monitorRef);
    setLoadingStatus(prev => ({ ...prev, [monitorRef]: true }));
    
    try {
      await props.getMonitorStatusRealtime(monitorRef, (response) => {
        console.log('🔵 Raw callback response:', response);
        
        // ✅ FIX: Handle the actual response structure {exists, data}
        if (response && response.data && !response.Error) {
          console.log('✅ Setting status for', monitorRef, 'with data:', response.data);
          setMonitorStatuses(prev => {
            const newState = {
              ...prev,
              [monitorRef]: response.data
            };
            console.log('✅ New monitorStatuses state:', newState);
            return newState;
          });
        } else if (response && response.Details) {
          // Fallback for standard API response format
          console.log('✅ Setting status (Details format) for', monitorRef);
          setMonitorStatuses(prev => ({
            ...prev,
            [monitorRef]: response.Details
          }));
        } else {
          console.log('⚠️ No data in response');
          setMonitorStatuses(prev => ({
            ...prev,
            [monitorRef]: { error: 'No data available' }
          }));
        }
        setLoadingStatus(prev => ({ ...prev, [monitorRef]: false }));
      });
    } catch (error) {
      console.error('❌ Exception caught:', error);
      setMonitorStatuses(prev => ({
        ...prev,
        [monitorRef]: { error: error.message || 'Failed to fetch status' }
      }));
      setLoadingStatus(prev => ({ ...prev, [monitorRef]: false }));
    }
  };

  // Render status cell with current info
  const renderStatusCell = (monitor) => {
    const status = monitorStatuses[monitor.MonitorRef];
    const isLoading = loadingStatus[monitor.MonitorRef];

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
        </Box>
      );
    }

    if (!status) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="Unknown"
            size="small"
            sx={{ 
              bgcolor: '#f5f5f5',
              color: '#999',
              fontWeight: 600,
              minWidth: '80px'
            }}
          />
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshStatus(monitor.MonitorRef);
            }}
            sx={{ padding: '4px' }}
          >
            <SvgIcon fontSize="small">
              <RefreshIcon />
            </SvgIcon>
          </IconButton>
        </Box>
      );
    }

    if (status.error) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="Error"
            size="small"
            sx={{ 
              bgcolor: '#ffebee',
              color: '#c62828',
              fontWeight: 600,
              minWidth: '80px'
            }}
          />
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshStatus(monitor.MonitorRef);
            }}
            sx={{ padding: '4px' }}
          >
            <SvgIcon fontSize="small">
              <RefreshIcon />
            </SvgIcon>
          </IconButton>
        </Box>
      );
    }

    // Check online/offline FIRST
    const isOnline = status.Status === 'online';

    if (!isOnline) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="Offline"
            size="small"
            sx={{ 
              bgcolor: '#ffebee',
              color: '#c62828',
              fontWeight: 600,
              minWidth: '80px'
            }}
          />
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshStatus(monitor.MonitorRef);
            }}
            sx={{ padding: '4px' }}
          >
            <SvgIcon fontSize="small">
              <RefreshIcon />
            </SvgIcon>
          </IconButton>
        </Box>
      );
    }

    // Get playlist name - this ONLY affects display, not schedule execution
    // If device reports the literal "Default", prefer monitor.DefaultPlaylistName (fallback)
    const rawPlaylistName = status.CurrentPlaylist || status.currentPlaylist || '';
    const playlistName =
      (rawPlaylistName && rawPlaylistName.toString().toLowerCase() === 'default' && monitor.DefaultPlaylistName)
        ? monitor.DefaultPlaylistName
        : (rawPlaylistName || 'Unknown');

    const playlistType = status.PlaylistType || status.playlistType || 'Default';
    // Resolve media display name: prefer friendly file/name, fall back to ID
    const currentMediaRaw = status.CurrentMedia || status.currentMedia;
    const resolveMediaDisplayName = (mediaValue) => {
      if (!mediaValue) return null;
      const val = String(mediaValue);

      // If it looks like a UUID/Ref (contains dash and length), try to lookup in playlists
      const maybeRef = /[0-9a-fA-F\-]{8,}/.test(val);
      if (maybeRef && Array.isArray(playlists)) {
        for (const pl of playlists) {
          const candidateArrays = [
            pl.MediaList,
            pl.Media,
            pl.Medias,
            pl.Items,
            pl.files,
            pl.list,
            pl.Files
          ];
          for (const arr of candidateArrays) {
            if (!Array.isArray(arr)) continue;
            for (const item of arr) {
              if (!item) continue;
              // common id field names to match ref
              const refs = [item.MediaRef, item.MediaID, item.Id, item.IdRef, item.FileRef].filter(Boolean).map(String);
              if (refs.includes(val)) {
                return item.Name || item.FileName || item.Filename || item.MediaName || item.Path || item.Url || val;
              }
            }
          }
        }
      }

      // If not a ref or not found, try to return basename if it looks like a path/filename
      try {
        const nameParts = val.split(/[\\/]/);
        const last = nameParts[nameParts.length - 1];
        return last;
      } catch (e) {
        return val;
      }
    };
    const currentMedia = resolveMediaDisplayName(currentMediaRaw);
    const mediaIndex = status.MediaIndex ?? status.mediaIndex;
    const totalMedia = status.TotalMedia ?? status.totalMedia;
    const healthStatus = status.HealthStatus || status.healthStatus;
    const screenState = status.ScreenState || status.screenState;
    const isProgressing = status.IsProgressing ?? status.isProgressing;
    const errors = status.Errors || status.errors;
    const isCachedPlaylist = status.IsCachedPlaylist ?? status.isCachedPlaylist;
    const cacheAge = status.CacheAge ?? status.cacheAge;

    const hasHealthIssues = 
      healthStatus === 'warning' || 
      healthStatus === 'error' ||
      (screenState && screenState !== 'active') ||
      (errors && errors.length > 0) ||
      isProgressing === false;

    const tooltipContent = (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
          Current Playlist: {playlistName}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Type: {playlistType}
        </Typography>
        {currentMedia && (
          <Typography variant="caption" sx={{ display: 'block' }}>
            Media: {currentMedia}
          </Typography>
        )}
        {mediaIndex !== undefined && totalMedia !== undefined && (
          <Typography variant="caption" sx={{ display: 'block' }}>
            Progress: {mediaIndex + 1}/{totalMedia}
          </Typography>
        )}
        {isCachedPlaylist && (
          <Typography variant="caption" sx={{ display: 'block', color: '#ff9800', fontWeight: 600, mt: 0.5 }}>
            ⚠️ Using Cached Playlist
            {cacheAge !== null && ` (${cacheAge} days old)`}
          </Typography>
        )}
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
          Last Update: {new Date(status.LastUpdate).toLocaleString()}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
          ({status.SecondsSinceUpdate}s ago)
        </Typography>
        
        {healthStatus && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            Health: {healthStatus}
          </Typography>
        )}
        {screenState && screenState !== 'active' && (
          <Typography variant="caption" sx={{ display: 'block', color: '#ff9800' }}>
            Screen State: {screenState}
          </Typography>
        )}
        {isProgressing === false && (
          <Typography variant="caption" sx={{ display: 'block', color: '#ff9800' }}>
            ⚠️ Media playback not progressing
          </Typography>
        )}
        {errors && errors.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#f44336' }}>
              {errors.some(e => e.severity === 'error') ? 'Errors:' : 'Warnings:'}
            </Typography>
            {errors.map((error, idx) => (
              <Typography key={idx} variant="caption" sx={{ 
                display: 'block', 
                fontSize: '0.7rem', 
                color: error.severity === 'error' ? '#f44336' : '#ff9800'
              }}>
                {error.severity === 'error' ? '❌' : '⚠️'} {error.message || error.type}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );

    return (
      <Tooltip title={tooltipContent} arrow placement="left">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={hasHealthIssues ? `${playlistName} ⚠️` : playlistName}
            size="small"
            sx={{ 
              bgcolor: hasHealthIssues ? '#fff3e0' : '#e8f5e9',
              color: hasHealthIssues ? '#e65100' : '#2e7d32',
              fontWeight: 600,
              minWidth: '80px'
            }}
          />
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleRefreshStatus(monitor.MonitorRef);
            }}
            sx={{ padding: '4px' }}
          >
            <SvgIcon fontSize="small">
              <RefreshIcon />
            </SvgIcon>
          </IconButton>
        </Box>
      </Tooltip>
    );
  };

  const renderScheduledPlaylists = (monitor) => {
    let schedules = [];
    if (Array.isArray(monitor.Schedules)) {
      schedules = monitor.Schedules.filter(Boolean);
    } else if (monitor.ScheduleList && Array.isArray(monitor.ScheduleList)) {
      schedules = monitor.ScheduleList.filter(Boolean);
    }

    if (!schedules || schedules.length === 0) {
      return (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontStyle: 'italic',
            fontSize: '0.9rem'
          }}
        >
          No Schedules
        </Typography>
      );
    }

    const getScheduleName = (s) => {
      return s?.Title || s?.ScheduleName || s?.Name || s?.title || 'Untitled Schedule';
    };

    if (schedules.length === 1) {
      const schedule = schedules[0];
      const name = getScheduleName(schedule);

      return (
        <Tooltip
          title={
            <Box sx={{ p: 0.5, maxHeight: '400px', overflowY: 'auto' }}>
              {/* Show schedule name with explicit label */}
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Schedule Name: {name}
              </Typography>

              {/* DATES first (DD/MM/YYYY) */}
              <Typography variant="caption" sx={{ display: 'block' }}>
                Dates: {formatDate(schedule?.StartDate) || 'N/A'} to {formatDate(schedule?.EndDate) || 'N/A'}
              </Typography>

              {/* TIME after dates */}
              <Typography variant="caption" sx={{ display: 'block' }}>
                Time: {schedule?.StartTime || 'N/A'} - {schedule?.EndTime || 'N/A'}
              </Typography>

              {schedule?.Days && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Days: {Array.isArray(schedule.Days) ? schedule.Days.join(', ') : schedule.Days}
                </Typography>
              )}
            </Box>
          }
          arrow
          placement="bottom"
        >
          <Chip
            label={name}
            size="small"
            sx={{
              bgcolor: '#e3f2fd',
              color: '#1976d2',
              fontWeight: 500,
              cursor: 'pointer',
              maxWidth: '180px',
              '&:hover': {
                bgcolor: '#bbdefb'
              }
            }}
          />
        </Tooltip>
      );
    }

    return (
      <Tooltip
        title={
          <Box sx={{ p: 0.5, maxHeight: '400px', overflowY: 'auto' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              Assigned Schedules:
            </Typography>
            {schedules.map((schedule, idx) => {
              const name = getScheduleName(schedule);
              return (
                <Box
                  key={idx}
                  sx={{
                    mb: 1,
                    pb: 1,
                    borderBottom: idx < schedules.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                  }}
                >
                  {/* Show schedule name with explicit label */}
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    Schedule Name: {name}
                  </Typography>

                  {/* DATES first (DD/MM/YYYY) */}
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    Dates: {formatDate(schedule?.StartDate) || 'N/A'} to {formatDate(schedule?.EndDate) || 'N/A'}
                  </Typography>

                  {/* TIME after dates */}
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    Time: {schedule?.StartTime || 'N/A'} - {schedule?.EndTime || 'N/A'}
                  </Typography>

                  {schedule?.Days && (
                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                      Days: {Array.isArray(schedule.Days) ? schedule.Days.join(', ') : schedule.Days}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        }
        arrow
        placement="bottom"
      >
        <Chip
          label={`${schedules.length} Schedule${schedules.length > 1 ? 's' : ''}`}
          size="small"
          sx={{
            bgcolor: '#e8f5e9',
            color: '#2e7d32',
            fontWeight: 500,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#c8e6c9'
            }
          }}
        />
      </Tooltip>
    );
  };

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Try to locate a playlist that contains the given media filename.
  const findPlaylistContainingMedia = (mediaName) => {
    if (!mediaName || !Array.isArray(playlists)) return null;
    const target = String(mediaName).toLowerCase();

    for (const pl of playlists) {
      // Common possible media arrays used in different API shapes
      const candidateArrays = [
        pl.MediaList,
        pl.Media,
        pl.Media,
        pl.Medias,
        pl.Items,
        pl.files,
        pl.list
      ];

      for (const arr of candidateArrays) {
        if (!Array.isArray(arr)) continue;
        for (const item of arr) {
          if (!item) continue;
          // possible filename fields
          const names = [
            item.Name,
            item.FileName,
            item.File,
            item.MediaName,
            item.Filename,
            item.Source,
            item.Url,
            item.Path
          ].filter(Boolean);

          if (names.some(n => String(n).toLowerCase() === target || String(n).toLowerCase().endsWith(target))) {
            return pl;
          }
        }
      }

      // Some playlist objects may carry a flat list of file names
      if (Array.isArray(pl.Files)) {
        if (pl.Files.some(f => String(f).toLowerCase() === target || String(f).toLowerCase().endsWith(target))) {
          return pl;
        }
      }
    }

    return null;
  };

  return (
    <Card sx={{ boxShadow: 2 }}>
      <PerfectScrollbar style={{ maxHeight: '60vh' }}>
        <Box sx={{ width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          <Table stickyHeader sx={{ tableLayout: 'fixed', '& th, & td': { fontSize: '0.95rem' } }}>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #ddd'
                }}
              >
                <TableCell padding="checkbox" align="center" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, width: '5%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                      checked={allchecked}
                      color="primary"
                      indeterminate={
                        selectedMonitorRefs.length > 0 &&
                        selectedMonitorRefs.length < (monitors?.length || 0) &&
                        (monitors?.length || 0) > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </Box>
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '15%' }}>
                  Monitor Name
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '20%' }}>
                  Description
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '15%' }}>
                  Schedule Names
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '15%' }}>
                  Default Playlist
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '12%' }}>
                  Status (Playlist Name)
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '8%' }}>
                  Edit
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(() => {
                if (!filtered || filtered.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No matches found
                      </TableCell>
                    </TableRow>
                  );
                }

                return filtered
                  .slice(page * limit, page * limit + limit)
                  .map((monitor) => (
                    <TableRow
                      hover
                      key={monitor.MonitorRef}
                      selected={selectedMonitorRefs.indexOf(monitor.MonitorRef) !== -1}
                      sx={{
                        '&:hover': { backgroundColor: '#f9f9f9' },
                        borderBottom: '1px solid #eee',
                        height: 64
                      }}
                    >
                      <TableCell padding="checkbox" align="center" sx={{ padding: '12px 16px', width: '5%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <Checkbox
                            checked={selectedMonitorRefs.indexOf(monitor.MonitorRef) !== -1}
                            onChange={(event) => handleSelectOne(event, monitor.MonitorRef)}
                            value="true"
                          />
                        </Box>
                      </TableCell>

                      <TableCell align="left" onClick={() => props.view && props.view(monitor)} sx={{ padding: '16px', cursor: 'pointer', fontWeight: 500, color: '#1976d2', width: '15%', '&:hover': { textDecoration: 'underline' } }}>
                        <Box sx={{ alignItems: 'center', display: 'flex' }}>
                          <Typography color="textPrimary" variant="body2" noWrap sx={{ fontSize: '0.95rem' }}>
                            {monitor.MonitorName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="left" onClick={() => props.view && props.view(monitor)} sx={{ padding: '16px', cursor: 'pointer', color: '#666', fontSize: '0.9rem', width: '30%', '&:hover': { backgroundColor: '#fafafa' } }}>
                        <Typography noWrap sx={{ fontSize: '0.95rem', color: '#666' }}>
                          {monitor.Description === 'null' || !monitor.Description ? '--' : monitor.Description}
                        </Typography>
                      </TableCell>

                      <TableCell align="left" sx={{ padding: '16px', width: '15%' }}>
                        {renderScheduledPlaylists(monitor)}
                      </TableCell>

                      <TableCell align="left" onClick={() => props.view && props.view(monitor)} sx={{ padding: '16px', cursor: 'pointer', color: '#666', fontSize: '0.9rem', width: '15%', '&:hover': { backgroundColor: '#fafafa' } }}>
                        {monitor.DefaultPlaylistName}
                      </TableCell>

                      <TableCell align="left" sx={{ padding: '16px', width: '12%' }}>
                        {renderStatusCell(monitor)}
                      </TableCell>
                      
                      <TableCell align="center" sx={{ padding: '16px', width: '8%' }}>
                        <Button
                          sx={{
                            minWidth: 40,
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            margin: '0 auto',
                            '&:hover': { backgroundColor: '#e3f2fd' }
                          }}
                          onClick={() => props.editcall && props.editcall(monitor)}
                        >
                          <SvgIcon fontSize="small" color="primary">
                            <EditIcon />
                          </SvgIcon>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ));
              })()}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>

      <TablePagination
        component="div"
        count={monitors && monitors.length > 0 ? monitors.length : 0}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{
          borderTop: '2px solid #eee',
          backgroundColor: '#f9f9f9'
        }}
      />
    </Card>
  );
};

MonitorListResults.propTypes = {
  monitors: PropTypes.array,
  getMonitorStatusRealtime: PropTypes.func,
  playlists: PropTypes.array
};

export default MonitorListResults;

// --- IGNORE ---