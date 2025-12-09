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
  const { monitors, search } = props || {};
  const [selectedMonitorRefs, setSelectedMonitorRefs] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);
  const [allchecked, setall] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState({});
  const [monitorStatuses, setMonitorStatuses] = useState({});

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
    setLoadingStatus(prev => ({ ...prev, [monitorRef]: true }));
    
    try {
      await props.getMonitorStatusRealtime(monitorRef, (response) => {
        if (!response.Error) {
          setMonitorStatuses(prev => ({
            ...prev,
            [monitorRef]: response.Details || { error: 'No response' }
          }));
        } else {
          setMonitorStatuses(prev => ({
            ...prev,
            [monitorRef]: { error: response.Message || 'Failed to fetch status' }
          }));
        }
        setLoadingStatus(prev => ({ ...prev, [monitorRef]: false }));
      });
    } catch (error) {
      console.error('Error fetching status:', error);
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
          <Typography variant="caption">Checking...</Typography>
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
              bgcolor: '#e0e0e0',
              color: '#666'
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
        <Tooltip title={status.error} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label="Offline" 
              size="small"
              sx={{ 
                bgcolor: '#ffebee',
                color: '#c62828'
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
    }

    // Online status with details
    const tooltipContent = (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
          Current Playlist: {status.currentPlaylist || 'N/A'}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Type: {status.playlistType || 'N/A'}
        </Typography>
        {status.currentMedia && (
          <Typography variant="caption" sx={{ display: 'block' }}>
            Media: {status.currentMedia}
          </Typography>
        )}
        {status.mediaIndex !== undefined && status.totalMedia !== undefined && (
          <Typography variant="caption" sx={{ display: 'block' }}>
            Progress: {status.mediaIndex + 1}/{status.totalMedia}
          </Typography>
        )}
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
          Last Update: {new Date(status.timestamp).toLocaleString()}
        </Typography>
      </Box>
    );

    return (
      <Tooltip title={tooltipContent} arrow placement="left">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label="Online" 
            size="small"
            sx={{ 
              bgcolor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 500
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
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                {name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Time: {schedule?.StartTime || 'N/A'} - {schedule?.EndTime || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Dates: {schedule?.StartDate || 'N/A'} to {schedule?.EndDate || 'N/A'}
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
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    {name}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    Time: {schedule?.StartTime || 'N/A'} - {schedule?.EndTime || 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem' }}>
                    Dates: {schedule?.StartDate || 'N/A'} to {schedule?.EndDate || 'N/A'}
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

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '30%' }}>
                  Description
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '15%' }}>
                  Scheduled Playlists
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '15%' }}>
                  Default Playlist
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '12%' }}>
                  Status
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
  getMonitorStatusRealtime: PropTypes.func
};

export default MonitorListResults;
