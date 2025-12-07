/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import { useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Edit as EditIcon } from 'react-feather';
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
  Tooltip
} from '@mui/material';
import PropTypes from 'prop-types';

const MonitorListResults = (props) => {
  const { monitors, search } = props || {};
  const [selectedMonitorRefs, setSelectedMonitorRefs] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);
  const [allchecked, setall] = useState(false);

  // make filtering behavior match PlaylistListResults (case-insensitive)
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

  // Render scheduled playlists cell (copied from reference, exact styling & tooltip)
  const renderScheduledPlaylists = (monitor) => {
    // Normalize schedules: accept null/undefined/empty/array; filter falsy entries
    let schedules = [];
    if (Array.isArray(monitor.Schedules)) {
      schedules = monitor.Schedules.filter(Boolean);
    } else if (monitor.ScheduleList && Array.isArray(monitor.ScheduleList)) {
      schedules = monitor.ScheduleList.filter(Boolean);
    }

    // If no valid schedules -> explicit "No Schedules"
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

    // helper to pick schedule name from multiple possible properties
    const getScheduleName = (s) => {
      return s?.Title || s?.ScheduleName || s?.Name || s?.title || 'Untitled Schedule';
    };

    // Single schedule -> show chip + tooltip with name + details
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

    // Multiple schedules -> show count chip with detailed tooltip including names
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
      {/* constrain the table area so the page doesn't scroll;
          PerfectScrollbar will handle the inner scrolling area */}
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

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '20%' }}>
                  Monitor Name
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '45%' }}>
                  Description
                </TableCell>

                {/* MOVED: Scheduled Playlists column - placed between Description and Default Playlist */}
                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '15%' }}>
                  Scheduled Playlists
                </TableCell>

                <TableCell align="left" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '20%' }}>
                  Default Playlist
                </TableCell>

                <TableCell align="center" sx={{ fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: 0.5, padding: '16px', width: '10%' }}>
                  Edit
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(() => {
                // show friendly "No matches found" inside the table when filter returns nothing
                if (!filtered || filtered.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
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

                      <TableCell align="left" onClick={() => props.view && props.view(monitor)} sx={{ padding: '16px', cursor: 'pointer', fontWeight: 500, color: '#1976d2', width: '20%', '&:hover': { textDecoration: 'underline' } }}>
                        <Box sx={{ alignItems: 'center', display: 'flex' }}>
                          <Typography color="textPrimary" variant="body2" noWrap sx={{ fontSize: '0.95rem' }}>
                            {monitor.MonitorName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="left" onClick={() => props.view && props.view(monitor)} sx={{ padding: '16px', cursor: 'pointer', color: '#666', fontSize: '0.9rem', width: '45%', '&:hover': { backgroundColor: '#fafafa' } }}>
                        <Typography noWrap sx={{ fontSize: '0.95rem', color: '#666' }}>
                          {monitor.Description === 'null' || !monitor.Description ? '--' : monitor.Description}
                        </Typography>
                      </TableCell>

                      {/* Scheduled Playlists cell (moved) */}
                      <TableCell align="left" sx={{ padding: '16px', width: '15%' }}>
                        {renderScheduledPlaylists(monitor)}
                      </TableCell>

                      <TableCell align="left" onClick={() => props.view && props.view(monitor)} sx={{ padding: '16px', cursor: 'pointer', color: '#666', fontSize: '0.9rem', width: '20%', '&:hover': { backgroundColor: '#fafafa' } }}>
                        {monitor.DefaultPlaylistName}
                      </TableCell>
                      
                      <TableCell align="center" sx={{ padding: '16px', width: '10%' }}>
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
  monitors: PropTypes.array
};

export default MonitorListResults;
