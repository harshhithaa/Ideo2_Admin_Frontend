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
} from '@material-ui/core';
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

    if (event.target.checked) {
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
    <Card>
      <PerfectScrollbar>
        <Box sx={{ minWidth: 1050 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allchecked}
                    color="primary"
                    indeterminate={
                      selectedMonitorRefs.length > 0 &&
                      selectedMonitorRefs.length < monitors.length
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Monitor Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Current Schedule</TableCell>
                <TableCell>Default Playlist</TableCell>
                <TableCell>Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monitors &&
                monitors.length > 0 &&
                monitors
                  .filter((item) =>
                    item.MonitorName.toLowerCase().includes(
                      search.toLowerCase()
                    )
                  )
                  .slice(0, limit)
                  .map((monitor) => (
                    <TableRow
                      hover
                      key={monitor.MonitorRef}
                      selected={
                        selectedMonitorRefs.indexOf(monitor.MonitorRef) !== -1
                      }
                    >
                      <TableCell padding="checkbox">
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
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            alignItems: 'center',
                            display: 'flex'
                          }}
                        >
                          <Typography color="textPrimary" variant="body1">
                            {monitor.MonitorName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {monitor.Description === 'null'
                          ? '--'
                          : monitor.Description}
                      </TableCell>
                      <TableCell>
                        {`${monitor.ScheduleName}` == 'null'
                          ? '--'
                          : `${monitor.ScheduleName}`}
                      </TableCell>
                      <TableCell>{monitor.DefaultPlaylistName}</TableCell>
                      <TableCell>
                        <Button
                          sx={{ mx: 1 }}
                          onClick={() => props.editcall(monitor)}
                        >
                          <SvgIcon fontSize="small" color="action">
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
      <TablePagination
        component="div"
        count={monitors && monitors.length}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
};

MonitorListResults.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  monitors: PropTypes.array
};

export default MonitorListResults;
