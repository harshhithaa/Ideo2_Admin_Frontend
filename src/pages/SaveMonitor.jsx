/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable no-sequences */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-shadow */
/* eslint-disable array-callback-return */
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import * as Yup from 'yup';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import {
  Box,
  Button,
  Checkbox,
  Container,
  TextField,
  InputLabel,
  Select,
  Typography,
  MenuItem,
  FormControlLabel,
  FormGroup,
  FormLabel,
  FormControl,
  ListSubheader
} from '@mui/material';
import { COMPONENTS } from 'src/utils/constant.jsx';
import { getUserComponentList, saveMonitor } from '../store/action/user';
import { Alert, Stack } from '@mui/material';
import { X as CloseIcon, Plus } from 'react-feather';
import Chip from '@mui/material/Chip';
import { IsValuePresentInArray } from 'src/utils/helperFunctions';
import { CancelRounded } from '@material-ui/icons';
import Snackbar from '@mui/material/Snackbar';

const SaveMonitorDetails = (props) => {
  const { component } = props || null;
  const navigate = useNavigate();
  const { state } = useLocation();
  console.log('state', state);

  const [MonitorRef, setMonitorRef] = useState(
    (state && state.MonitorRef) || ''
  );
  const [playlist, setPlaylist] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [title, setTitle] = useState((state && state.MonitorName) || '');
  const [description, setDescription] = useState(
    (state && state.Description) || ''
  );
  const [playlistData, setPlaylistData] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    (state && state.PlaylistRef) || ''
  );
  const [selectedSchedule, setSelectedSchedule] = useState([]);
  const [selectedScheduleRefs, setSelectedScheduleRefs] = useState(() => {
    const prevList = (state && state.Schedules) || [];
    return prevList
      .filter((item) => item && item.IsActive === 1 && Boolean(item.ScheduleRef))
      .map((s) => s.ScheduleRef);
  });
  const selectedScheduleObjects = useMemo(() => {
    const allSchedules = scheduleData || [];
    const fromState = (state && state.Schedules) || [];
    return selectedScheduleRefs.map((ref) =>
      allSchedules.find((s) => s.ScheduleRef === ref)
      || fromState.find((s) => s.ScheduleRef === ref)
      || { ScheduleRef: ref, Title: ref }
    );
  }, [selectedScheduleRefs, scheduleData, state]);
  const [deletedSchedules, setDeletedSchedules] = useState([]);
  const [updatedSchedules, setUpdatedSchedules] = useState([]);
  const [loader, setloader] = useState(true);
  const [scheduleloader, setScheduleloader] = useState(true);
  const [orientation, setOrientation] = useState(() => {
    if (state && typeof state.Orientation !== 'undefined' && state.Orientation !== null) {
      return state.Orientation === '90' ? 'Landscape' : 'Portrait';
    }
    return '';
  });
  const [type, settype] = useState(
    state && state.type === 'View'
      ? 'View'
      : state && state.type === 'Edit'
      ? 'Update'
      : 'Create'
  );

  const isViewMode = type === 'View';

  let [box, setbox] = useState(false);
  let [boxMessage, setboxMessage] = useState('');
  let [color, setcolor] = useState('success');
  const [checked, setChecked] = useState(false);
  let days = (state && state.Days && state.Days.split(',')) || [];
  const orientations = ['Portrait', 'Landscape'];

  const isEdit = state && state.type === 'Edit';
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const controlWidth = { xs: '100%', sm: '720px' };
  
  useEffect(() => {
    const comp = props.component || {};
    if (comp.playlistList && comp.playlistList.length) {
      setPlaylistData(comp.playlistList);
      setPlaylist(comp.playlistList);
    }
    if (comp.scheduleList && comp.scheduleList.length) {
      setScheduleData(comp.scheduleList);
      setSchedule(comp.scheduleList);
    }
  }, [props.component]);

  useEffect(() => {
    if (playlistData.length === 0) {
      const data = {
        componenttype: COMPONENTS.Playlist
      };
      props.getUserComponentList(data, (err) => {
        if (!err.exists) {
          setloader(false);
        }
      });
    }

    if (scheduleData.length === 0) {
      const dataForSchedule = {
        componenttype: COMPONENTS.Schedule
      };
      props.getUserComponentList(dataForSchedule, (err) => {
        if (!err.exists) {
          setScheduleloader(false);
        }
      });
    }
  }, []);

  function saveMonitorData() {
    const selectedSchedules = (selectedScheduleObjects || [])
      .filter((item) => item && item.ScheduleRef)
      .map((item) => ({
        ScheduleRef: item.ScheduleRef,
        IsActive: 1
      }));

    const validDeleted = (deletedSchedules || []).filter((d) => d && d.ScheduleRef);

    const saveMonitorDetails = {
      MonitorName: title,
      Description: description,
      DefaultPlaylistRef: selectedPlaylist,
      Schedules: [...selectedSchedules, ...validDeleted],
      IsActive: 1,
      Orientation: orientation === 'Landscape' ? '90' : '0'
    };
    if (MonitorRef !== '') saveMonitorDetails.MonitorRef = MonitorRef;

    console.log('saveMonitorDetails payload:', JSON.stringify(saveMonitorDetails));

    props.saveMonitor(saveMonitorDetails, (err) => {
      if (err.exists) {
        setcolor('error');
        setboxMessage(err.err || 'Failed to save monitor');
        setbox(true);
        setTimeout(() => {
          setbox(false);
        }, 3000);
      } else {
        setcolor('success');
        setboxMessage(`Monitor ${type}d Successfully!`);
        setbox(true);
        
        const activeRefs = selectedSchedules.map((s) => s.ScheduleRef);
        setSelectedScheduleRefs(activeRefs);
        setDeletedSchedules([]);

        setTimeout(() => {
          setbox(false);
          navigate('/app/monitors', { replace: true, state: { refresh: true } });
        }, 1500);
      }
    });
  }

  const handleChange = (e) => {
    const newRefs = Array.isArray(e.target.value) ? e.target.value.filter(Boolean) : [];
    const removed = selectedScheduleRefs.filter((r) => !newRefs.includes(r));
    if (removed.length > 0) {
      const addedDeleted = removed
        .filter((ref) => Boolean(ref) && !deletedSchedules.some((d) => d.ScheduleRef === ref))
        .map((ref) => ({ ScheduleRef: ref, IsActive: 0 }));
      if (addedDeleted.length) {
        setDeletedSchedules((prev) => [...prev, ...addedDeleted]);
      }
    }
    setSelectedScheduleRefs(newRefs);
  };

  const handleRemoveSchedule = (e, value) => {
    const ref = value && value.ScheduleRef;
    if (!ref) return;
    if (!deletedSchedules.some((d) => d.ScheduleRef === ref)) {
      setDeletedSchedules((prev) => [...prev, { ScheduleRef: ref, IsActive: 0 }]);
    }
    setSelectedScheduleRefs((prev) => prev.filter((r) => r !== ref));
  };

  const handleDateAndTime = () => {
    // NO CONFLICT CHECKING - Save directly
    saveMonitorData();
  };

  return (
    <>
      <Helmet>
        <title>Schedule | Ideogram</title>
      </Helmet>

      <Box
        sx={{
          backgroundColor: 'background.default',
          display: 'block',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center'
        }}
      >
        <Snackbar
          open={box}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          autoHideDuration={1800}
          onClose={() => setbox(false)}
        >
          <Alert
            onClose={() => setbox(false)}
            severity={color === 'error' ? 'error' : 'success'}
            sx={{ width: '100%' }}
          >
            {boxMessage}
          </Alert>
        </Snackbar>

        <Container
          maxWidth="md"
          sx={{
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            py: 3,
            boxSizing: 'border-box'
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: 880,
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: { xs: 2, sm: 4 },
              boxShadow: 1
            }}
          >
            <Formik
              initialValues={{
                title: '',
                description: '',
                playlist: '',
                startTime: '',
                endTime: '',
                startDate: '',
                endDate: '',
                fixedTimePlayback: false,
                days: []
              }}
              onSubmit={() => {
                navigate('/app/monitors', { replace: true });
              }}
            >
              {({ errors, handleBlur, handleSubmit, isSubmitting, touched }) => (
                <form onSubmit={handleSubmit}>
                  <Box sx={{ mb: 3, mt: 1 }}>
                    <Typography color="textPrimary" variant="h4" sx={{ fontWeight: 700, textAlign: 'center' }}>
                      {type} Monitor
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 2, justifyItems: 'center' }}>
                    <Box sx={{ width: controlWidth }}>
                      <TextField
                        error={Boolean(touched.title && errors.title)}
                        fullWidth
                        helperText={touched.title && errors.title}
                        label="Title"
                        margin="none"
                        name="title"
                        onBlur={handleBlur}
                        onChange={(e) => setTitle(e.target.value)}
                        value={title}
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ sx: { fontWeight: 600 } }}
                        disabled={isViewMode}
                      />
                    </Box>

                    <Box sx={{ width: controlWidth }}>
                      <TextField
                        error={Boolean(touched.description && errors.description)}
                        fullWidth
                        helperText={touched.description && errors.description}
                        label="Description"
                        margin="none"
                        name="description"
                        onBlur={handleBlur}
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        variant="outlined"
                        size="small"
                        InputLabelProps={{ sx: { fontWeight: 600 } }}
                        disabled={isViewMode}
                      />
                    </Box>

                    <Box sx={{ width: controlWidth }}>
                      <InputLabel id="select-playlist" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                        Default Playlist
                      </InputLabel>

                      {isViewMode ? (
                        <Box
                          sx={{
                            height: 40,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            px: 2,
                            py: 1,
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: 'action.disabledBackground'
                          }}
                        >
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {playlistData && playlistData.length > 0
                              ? (playlistData.find((p) => p.PlaylistRef === selectedPlaylist) || {}).Name || 'No Items available'
                              : 'No Items available'}
                          </Typography>
                        </Box>
                      ) : (
                        <Select
                          labelId="select-playlist"
                          id="select-playlist"
                          value={selectedPlaylist}
                          label="playlist"
                          onChange={(e) => setSelectedPlaylist(e.target.value)}
                          size="small"
                          fullWidth
                          sx={{ borderRadius: 1, '& .MuiSelect-select': { padding: '10px 12px' } }}
                          MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                        >
                          {playlistData && playlistData.length > 0 ? (
                            playlistData.map((item) => (
                              <MenuItem key={item.PlaylistRef} value={item.PlaylistRef}>
                                {item.Name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem>No Items available</MenuItem>
                          )}
                        </Select>
                      )}
                    </Box>

                    <Box sx={{ width: controlWidth }}>
                      <InputLabel id="select-orientation" sx={{ fontWeight: 600, mb: 1 }}>
                        Select Orientation
                      </InputLabel>
                      {isViewMode ? (
                        <Box
                          sx={{
                            height: 40,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            px: 2,
                            py: 1,
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: 'action.disabledBackground'
                          }}
                        >
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {orientation || 'Not set'}
                          </Typography>
                        </Box>
                      ) : (
                        <Select
                          labelId="select-orientation"
                          id="select-orientation"
                          value={orientation}
                          label="orientation"
                          onChange={(e) => setOrientation(e.target.value)}
                          size="small"
                          fullWidth
                          sx={{ '& .MuiSelect-select': { minHeight: 40, padding: '8px 12px' } }}
                        >
                          {orientations.map((value) => (
                            <MenuItem key={value} value={value}>
                              {value}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </Box>

                    <Box sx={{ width: controlWidth }}>
                      <InputLabel id="select-schedule" sx={{ fontWeight: 600, mb: 1 }}>
                        Schedule
                      </InputLabel>

                      {isViewMode ? (
                        <Box
                          sx={{
                            height: 135,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            px: 1,
                            py: 0.5,
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'flex-start',
                            bgcolor: 'action.disabledBackground'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3,
                              maxHeight: 125,
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              paddingRight: 6,
                              width: '100%'
                            }}
                          >
                            {selectedScheduleObjects && selectedScheduleObjects.length > 0 ? (
                              selectedScheduleObjects.map((value, index) => (
                                <div key={index} style={{ width: '90%' }}>
                                  <Chip
                                    label={`${value.Title} (${value.StartTime || ''} - ${value.EndTime || ''}) (${value.StartDate || ''} - ${value.EndDate || ''})`}
                                    style={{
                                      margin: 2,
                                      width: '100%',
                                      boxSizing: 'border-box',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                      position: 'relative'
                                    }}
                                  />
                                </div>
                              ))
                            ) : (
                              <Typography variant="body2">No Items available</Typography>
                            )}
                          </div>
                        </Box>
                      ) : (
                        <Select
                          labelId="select-schedule"
                          id="select-schedule"
                          multiple
                          value={selectedScheduleRefs}
                          renderValue={(selected) => (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
                                maxHeight: 125,
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                paddingRight: 6,
                                width: '100%'
                              }}
                            >
                              {selected.map((ref, index) => {
                                const value = selectedScheduleObjects.find((s) => s.ScheduleRef === ref) || { ScheduleRef: ref, Title: ref };
                                return (
                                  <div key={index} style={{ width: '90%' }}>
                                    <Chip
                                      label={`${value.Title} (${value.StartTime || ''} - ${value.EndTime || ''}) (${value.StartDate || ''} - ${value.EndDate || ''})`}
                                      style={{
                                        margin: 2,
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        position: 'relative'
                                      }}
                                      clickable
                                      onDelete={(e) => handleRemoveSchedule(e, value)}
                                      deleteIcon={
                                        <CancelRounded
                                          style={{ position: 'absolute', right: 8 }}
                                          onMouseDown={(event) => event.stopPropagation()}
                                        />
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          onChange={(e) => {
                            handleChange(e);
                          }}
                          {...(isEdit
                            ? {
                                open: scheduleOpen,
                                onOpen: () => setScheduleOpen(true),
                                onClose: () => setScheduleOpen(false)
                              }
                            : {})}
                          size="small"
                          fullWidth
                          sx={{
                            height: 135,
                            borderRadius: 1,
                            '& .MuiSelect-select': { minHeight: 40, display: 'flex', alignItems: 'center', padding: '8px 12px', overflow: 'hidden' }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                maxHeight: 300,
                                display: 'block'
                              }
                            },
                            MenuListProps: {
                              sx: {
                                maxHeight: 260,
                                overflowY: 'auto'
                              }
                            }
                          }}
                        >
                          {scheduleData && scheduleData.length > 0 ? (
                            scheduleData.map((item) => {
                              const isChecked = selectedScheduleRefs.includes(item.ScheduleRef);
                              return (
                                <MenuItem key={item.ScheduleRef} value={item.ScheduleRef}>
                                  <Checkbox checked={isChecked} size="small" sx={{ mr: 1 }} />
                                  {item.Title}
                                </MenuItem>
                              );
                            })
                          ) : (
                            <MenuItem>No Items available</MenuItem>
                          )}

                          {isEdit && (
                            <MenuItem
                              component="div"
                              disableRipple
                              sx={{
                                position: 'sticky',
                                bottom: 0,
                                zIndex: 1,
                                display: 'flex',
                                justifyContent: 'flex-end',
                                px: 1,
                                py: 0.5,
                                bgcolor: 'transparent'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'background.paper', borderRadius: 1, p: '4px' }}>
                                <Button
                                  type="button"
                                  size="small"
                                  variant="contained"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    ev.preventDefault();
                                    setScheduleOpen(false);
                                  }}
                                >
                                  Done
                                </Button>
                              </Box>
                            </MenuItem>
                          )}
                        </Select>
                      )}
                    </Box>

                    <Box sx={{ py: 2 }}>
                      {isViewMode ? (
                        <Button
                          color="primary"
                          fullWidth
                          size="large"
                          variant="contained"
                          onClick={() => navigate('/app/monitors')}
                        >
                          Back to Monitor List
                        </Button>
                      ) : (
                        <Button
                          color="primary"
                          fullWidth
                          size="large"
                          variant="contained"
                          onClick={() => {
                            handleDateAndTime();
                          }}
                        >
                          {type} Monitor
                        </Button>
                      )}
                    </Box>
                  </Box>
                </form>
              )}
            </Formik>
          </Box>
        </Container>
      </Box>
    </>
  );
};

const mapStateToProps = ({ root = {} }) => {
  const component = root.user.components;

  return {
    component
  };
};
const mapDispatchToProps = (dispatch) => ({
  getUserComponentList: (data, callback) =>
    dispatch(getUserComponentList(data, callback)),
  saveMonitor: (data, callback) => dispatch(saveMonitor(data, callback))
});
export default connect(mapStateToProps, mapDispatchToProps)(SaveMonitorDetails);