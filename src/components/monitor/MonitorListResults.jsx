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
  SvgIcon
} from '@mui/material';
import PropTypes from 'prop-types';

const MonitorListResults = (props) => {
  const { monitors, search } = props || {};
  console.log('search', search);
  const [selectedMonitorRefs, setSelectedMonitorRefs] = useState([]);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(0);
  const [allchecked, setall] = useState(false);

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
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(
        selectedMonitorRefs,
        MonitorRef
      );
    } else if (selectedIndex === 0) {
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(
        selectedMonitorRefs.slice(1)
      );
    } else if (selectedIndex === selectedMonitorRefs.length - 1) {
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(
        selectedMonitorRefs.slice(0, -1)
      );
    } else if (selectedIndex > 0) {
      newSelectedMonitorRefs = newSelectedMonitorRefs.concat(
        selectedMonitorRefs.slice(0, selectedIndex),
        selectedMonitorRefs.slice(selectedIndex + 1)
      );
    }
    props.setselected(newSelectedMonitorRefs);
    setSelectedMonitorRefs(newSelectedMonitorRefs);
  };

  const handleLimitChange = (event) => {
    setLimit(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Card sx={{ boxShadow: 2 }}>
      <PerfectScrollbar>
        <Box sx={{ minWidth: 1050 }}>
          <Table>
            {/* ✅ IMPROVED TABLE HEAD */}
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #ddd'
                }}
              >
                <TableCell
                  padding="checkbox"
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    width: '5%' // checkbox
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Checkbox
                      checked={allchecked}
                      color="primary"
                      indeterminate={
                        selectedMonitorRefs.length > 0 &&
                        selectedMonitorRefs.length < monitors?.length &&
                        monitors?.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </Box>
                </TableCell>

                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '20%' // Monitor Name
                  }}
                >
                  Monitor Name
                </TableCell>

                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '45%' // Description (expanded)
                  }}
                >
                  Description
                </TableCell>

                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '20%' // Default Playlist (reduced)
                  }}
                >
                  Default Playlist
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '16px',
                    width: '10%' // edit button column
                  }}
                >
                  Edit
                </TableCell>
              </TableRow>
            </TableHead>

            {/* ✅ IMPROVED TABLE BODY */}
            <TableBody>
              {monitors &&
                monitors.length > 0 &&
                monitors
                  .filter((item) =>
                    item.MonitorName.toLowerCase().includes(
                      search.toLowerCase()
                    )
                  )
                  .slice(page * limit, page * limit + limit)
                  .map((monitor) => (
                    <TableRow
                      hover
                      key={monitor.MonitorRef}
                      selected={
                        selectedMonitorRefs.indexOf(monitor.MonitorRef) !== -1
                      }
                      sx={{
                        '&:hover': {
                          backgroundColor: '#f9f9f9'
                        },
                        borderBottom: '1px solid #eee',
                        height: 64
                      }}
                    >
                      {/* ✅ Checkbox cell - centered */}
                      <TableCell
                        padding="checkbox"
                        align="center"
                        sx={{ padding: '12px 16px', width: '5%' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'center'
                          }}
                        >
                          <Checkbox
                            checked={
                              selectedMonitorRefs.indexOf(monitor.MonitorRef) !==
                              -1
                            }
                            onChange={(event) =>
                              handleSelectOne(event, monitor.MonitorRef)
                            }
                            value="true"
                          />
                        </Box>
                      </TableCell>

                      {/* ✅ Monitor Name - left aligned */}
                      <TableCell
                        align="left"
                        onClick={() => props.view && props.view(monitor)}
                        sx={{
                          padding: '16px',
                          cursor: 'pointer',
                          fontWeight: 500,
                          color: '#1976d2',
                          width: '20%', // match header
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        <Box
                          sx={{
                            alignItems: 'center',
                            display: 'flex'
                          }}
                        >
                          <Typography color="textPrimary" variant="body2">
                            {monitor.MonitorName}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell
                        align="left"
                        onClick={() => props.view && props.view(monitor)}
                        sx={{
                          padding: '16px',
                          cursor: 'pointer',
                          color: '#666',
                          fontSize: '0.9rem',
                          width: '45%', // match header (expanded)
                          '&:hover': {
                            backgroundColor: '#fafafa'
                          }
                        }}
                      >
                        {monitor.Description === 'null' || !monitor.Description
                          ? '--'
                          : monitor.Description}
                      </TableCell>

                      <TableCell
                        align="left"
                        onClick={() => props.view && props.view(monitor)}
                        sx={{
                          padding: '16px',
                          cursor: 'pointer',
                          color: '#666',
                          fontSize: '0.9rem',
                          width: '20%', // match header (reduced)
                          '&:hover': {
                            backgroundColor: '#fafafa'
                          }
                        }}
                      >
                        {monitor.DefaultPlaylistName}
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ padding: '16px', width: '10%' }} // match header
                      >
                        <Button
                          sx={{
                            minWidth: 40,
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            margin: '0 auto',
                            '&:hover': {
                              backgroundColor: '#e3f2fd'
                            }
                          }}
                          onClick={() => props.editcall(monitor)}
                        >
                          <SvgIcon fontSize="small" color="primary">
                            <EditIcon />
                          </SvgIcon>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>

      {/* ✅ IMPROVED PAGINATION */}
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
