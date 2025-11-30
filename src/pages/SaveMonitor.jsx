/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable no-sequences */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-shadow */
/* eslint-disable array-callback-return */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
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
  const [deletedSchedules, setDeletedSchedules] = useState([]);
  const [updatedSchedules, setUpdatedSchedules] = useState([]);
  const [loader, setloader] = useState(true);
  const [scheduleloader, setScheduleloader] = useState(true);
  const [orientation, setOrientation] = useState(() => {
    // only derive a default when the location state actually contains Orientation
    if (state && typeof state.Orientation !== 'undefined' && state.Orientation !== null) {
      return state.Orientation === '90' ? 'Landscape' : 'Portrait';
    }
    return ''; // no default so user can choose
  });
  const [type, settype] = useState(
    state && state.type === 'View'
      ? 'View'
      : state && state.type === 'Edit'
      ? 'Update'
      : 'Create'
  );
  let [box, setbox] = useState(false);
  let [boxMessage, setboxMessage] = useState('');
  let [color, setcolor] = useState('success');
  const [checked, setChecked] = useState(false);
  // const [disable, setDisable] = useState([]);
  let days = (state && state.Days && state.Days.split(',')) || [];
  const orientations = ['Portrait', 'Landscape'];
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [clashingSchedulesError, setClashingSchedulesError] = useState('');

  // only apply auto-close behavior for Edit monitors page
  const isEdit = state && state.type === 'Edit';
  const [scheduleOpen, setScheduleOpen] = useState(false);
  
  var clashingSchedules = [];

  // slide interval removed per request
  // const min = 5;
  // const max = 60;
  // const step = 5;

  // consistent control width for all form inputs
  const controlWidth = { xs: '100%', sm: '720px' };
  
  useEffect(() => {
    const data = {
      componenttype: COMPONENTS.Playlist
    };
    const dataForSchedule = {
      componenttype: COMPONENTS.Schedule
    };

    console.log('outside', data);
    props.getUserComponentList(data, (err) => {
      console.log('data', data);
      console.log('err', err);
      if (err.exists) {
        console.log('err.errmessage', err.errmessage);
      } else {
        console.log('props', props, 'component', component);
        setPlaylist(component.playlistList);
        setloader(false);
        console.log('playlist', playlist);
      }
    });
    setPlaylistData(playlist);

    props.getUserComponentList(dataForSchedule, (err) => {
      console.log('data', dataForSchedule);
      console.log('err', err);
      if (err.exists) {
        console.log('err.errmessage', err.errmessage);
      } else {
        console.log('props', props, 'component', component);
        setSchedule(component.scheduleList);
        setScheduleloader(false);
        console.log('schedule', schedule);
      }
    });

    setScheduleData(schedule);
    const prevList = [];

    state &&
      state.Schedules &&
      state.Schedules.map((item) => {
        if (item.IsActive === 1) {
          prevList.push(item);
        }
      });

    setSelectedSchedule(prevList);
    console.log('prevList', prevList);
  }, [loader, scheduleloader]);

  // const saveData = () => {
  //   console.log(selectedSchedule);
  //   console.log(deletedSchedules);
  //   // saveMonitorData();
  // };

  function saveMonitorData() {
    const selectedSchedules = selectedSchedule.map((item) => ({
      ScheduleRef: item.ScheduleRef,
      IsActive: item.IsActive
    }));

    const saveMonitorDetails = {
      MonitorName: title,
      Description: description,
      DefaultPlaylistRef: selectedPlaylist,
      Schedules: [...selectedSchedules, ...deletedSchedules],
      IsActive: 1,
      Orientation: orientation === 'Landscape' ? '90' : '0'
      // SlideTime removed
    };
    if (MonitorRef !== '') saveMonitorDetails.MonitorRef = MonitorRef;

    console.log('saveMonitorDetails Request', saveMonitorDetails);

    // setDisable(true);
    props.saveMonitor(saveMonitorDetails, (err) => {
      if (err.exists) {
        window.scrollTo(0, 0);
        setcolor('error');
        setboxMessage(err.err);
        setbox(true);
      } else {
        navigate('/app/monitors', { replace: true });
      }
    });
  }

  const handleChange = (e) => {
    console.log('Schedule Changed', e.target.value);
    setSelectedSchedule(e.target.value);
    let deletedarr = [];
    e.target.value.map((item) => {
      if (
        IsValuePresentInArray(deletedSchedules, 'ScheduleRef', item.ScheduleRef)
      ) {
        deletedarr = deletedSchedules.filter(
          (deletedSchedule) => deletedSchedule.IsActive === item.IsActive
        );
      }
    });
    setDeletedSchedules(deletedarr);
  };

  const handleRemoveSchedule = (e, value) => {
    if (
      !IsValuePresentInArray(deletedSchedules, 'ScheduleRef', value.ScheduleRef)
    ) {
      deletedSchedules.push({ ScheduleRef: value.ScheduleRef, IsActive: 0 });
      console.log('Removed schedule', deletedSchedules);
    }
    setSelectedSchedule(
      selectedSchedule.filter((item) => item.ScheduleRef !== value.ScheduleRef)
    );
  };

  const handleDateAndTime = () => {
    let isClashing;

    for (let i = 0; i < selectedSchedule.length; i++) {
      for (let j = i + 1; j < selectedSchedule.length; j++) {
        if (selectedSchedule[i].StartTime < selectedSchedule[j].StartTime) {
          if (selectedSchedule[i].EndTime < selectedSchedule[j].StartTime) {
            console.log('Pass 1', selectedSchedule[i], selectedSchedule[j]);
            // saveMonitorData();
          } else {
            if (selectedSchedule[i].StartDate < selectedSchedule[j].StartDate) {
              if (selectedSchedule[i].EndDate < selectedSchedule[j].StartDate) {
                console.log('Pass 2', selectedSchedule[i], selectedSchedule[j]);
                // saveMonitorData();
              } else {
                // setOpenSnackbar(true);
                isClashing = true;
                if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                  clashingSchedules.push(selectedSchedule[i].Title);
                }
                if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                  clashingSchedules.push(selectedSchedule[j].Title);
                }
                console.log(
                  'Clash 1',
                  selectedSchedule[i],
                  selectedSchedule[j]
                );
              }
            } else if (
              selectedSchedule[i].StartDate > selectedSchedule[j].StartDate
            ) {
              if (selectedSchedule[i].StartDate > selectedSchedule[j].EndDate) {
                console.log('Pass 3', selectedSchedule[i], selectedSchedule[j]);
                // saveMonitorData();
              } else {
                // setOpenSnackbar(true);
                isClashing = true;
                if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                  clashingSchedules.push(selectedSchedule[i].Title);
                }
                if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                  clashingSchedules.push(selectedSchedule[j].Title);
                }
                console.log(
                  'Clash 2',
                  selectedSchedule[i],
                  selectedSchedule[j]
                );
              }
            } else if (
              selectedSchedule[i].StartDate === selectedSchedule[j].StartDate
            ) {
              isClashing = true;
              if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                clashingSchedules.push(selectedSchedule[i].Title);
              }
              if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                clashingSchedules.push(selectedSchedule[j].Title);
              }
              console.log('Clash 3', selectedSchedule[i], selectedSchedule[j]);
            }
          }
        } else if (
          selectedSchedule[i].StartTime > selectedSchedule[j].StartTime
        ) {
          if (selectedSchedule[i].StartTime > selectedSchedule[j].EndTime) {
            console.log('Pass 4', selectedSchedule[i], selectedSchedule[j]);
            // saveMonitorData();
          } else {
            if (selectedSchedule[i].StartDate < selectedSchedule[j].StartDate) {
              if (selectedSchedule[i].EndDate < selectedSchedule[j].StartDate) {
                console.log('Pass 5', selectedSchedule[i], selectedSchedule[j]);
                // saveMonitorData();
              } else {
                // setOpenSnackbar(true);
                isClashing = true;
                if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                  clashingSchedules.push(selectedSchedule[i].Title);
                }
                if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                  clashingSchedules.push(selectedSchedule[j].Title);
                }
                console.log(
                  'Clash 4',
                  selectedSchedule[i],
                  selectedSchedule[j]
                );
              }
            } else if (
              selectedSchedule[i].StartDate > selectedSchedule[j].StartDate
            ) {
              if (selectedSchedule[i].StartDate > selectedSchedule[j].EndDate) {
                console.log('Pass 6', selectedSchedule[i], selectedSchedule[j]);
                // saveMonitorData();
              } else {
                // setOpenSnackbar(true);
                isClashing = true;
                if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                  clashingSchedules.push(selectedSchedule[i].Title);
                }
                if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                  clashingSchedules.push(selectedSchedule[j].Title);
                }
                console.log(
                  'Clash 5',
                  selectedSchedule[i],
                  selectedSchedule[j]
                );
              }
            } else if (
              selectedSchedule[i].StartDate === selectedSchedule[j].StartDate
            ) {
              isClashing = true;
              if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                clashingSchedules.push(selectedSchedule[i].Title);
              }
              if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                clashingSchedules.push(selectedSchedule[j].Title);
              }
              console.log('Clash 6', selectedSchedule[i], selectedSchedule[j]);
            }
          }
        } else if (
          selectedSchedule[i].StartTime === selectedSchedule[j].StartTime
        ) {
          if (selectedSchedule[i].StartDate < selectedSchedule[j].StartDate) {
            if (selectedSchedule[i].EndDate < selectedSchedule[j].StartDate) {
              console.log('Pass 7', selectedSchedule[i], selectedSchedule[j]);
              // saveMonitorData();
            } else {
              // setOpenSnackbar(true);
              isClashing = true;
              if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                clashingSchedules.push(selectedSchedule[i].Title);
              }
              if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                clashingSchedules.push(selectedSchedule[j].Title);
              }
              console.log('Clash 7', selectedSchedule[i], selectedSchedule[j]);
            }
          } else if (
            selectedSchedule[i].StartDate > selectedSchedule[j].StartDate
          ) {
            if (selectedSchedule[i].StartDate > selectedSchedule[j].EndDate) {
              console.log('Pass 8', selectedSchedule[i], selectedSchedule[j]);
              // saveMonitorData();
            } else {
              // setOpenSnackbar(true);
              isClashing = true;
              if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
                clashingSchedules.push(selectedSchedule[i].Title);
              }
              if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
                clashingSchedules.push(selectedSchedule[j].Title);
              }
              console.log('Clash 8', selectedSchedule[i], selectedSchedule[j]);
            }
          } else if (
            selectedSchedule[i].StartDate === selectedSchedule[j].StartDate
          ) {
            isClashing = true;
            if (!clashingSchedules.includes(selectedSchedule[i].Title)) {
              clashingSchedules.push(selectedSchedule[i].Title);
            }
            if (!clashingSchedules.includes(selectedSchedule[j].Title)) {
              clashingSchedules.push(selectedSchedule[j].Title);
            }

            console.log('Clash 9', selectedSchedule[i], selectedSchedule[j]);
          }
        }
      }
    }

    if (isClashing) {
      setClashingSchedulesError(clashingSchedules.join(' '));
      setOpenSnackbar(true);
    } else {
      saveMonitorData();
    }
  };

  const handleCloseSnackBar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    clashingSchedules = [];
    setOpenSnackbar(false);
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
          open={openSnackbar}
          key={'top'}
          autoHideDuration={5000}
          onClose={handleCloseSnackBar}
        >
          <Alert onClose={handleCloseSnackBar} severity="error">
            {clashingSchedulesError} Schedules Are Clashing
          </Alert>
        </Snackbar>

        {/* Centered content area with equal horizontal margins and lifted heading */}
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
          {/* Constrain form width and visually separate from page edges */}
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
                    {/* Heading moved slightly down, now centered */}
                    <Typography color="textPrimary" variant="h4" sx={{ fontWeight: 700, textAlign: 'center' }}>
                      {type} Monitor
                    </Typography>
                  </Box>

                  {/* Use a vertical stack via Box with consistent spacing for controls.
                      All controls share the same visual width via controlWidth. */}
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
                      />
                    </Box>

                    <Box sx={{ width: controlWidth }}>
                      <InputLabel id="select-playlist" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                        Default Playlist
                      </InputLabel>

                      {/* In View mode show a read-only boxed value (no dropdown). Otherwise keep Select unchanged. */}
                      {state && state.type === 'View' ? (
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
                            alignItems: 'center'
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

                    {/* Orientation moved above Schedule */}
                    <Box sx={{ width: controlWidth }}>
                      <InputLabel id="select-orientation" sx={{ fontWeight: 600, mb: 1 }}>
                        Select Orientation
                      </InputLabel>
                      {state && state.type === 'View' ? (
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
                            alignItems: 'center'
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

                    {/* Schedule remains at the bottom and aligned with other controls */}
                    <Box sx={{ width: controlWidth }}>
                      <InputLabel id="select-schedule" sx={{ fontWeight: 600, mb: 1 }}>
                        Schedule
                      </InputLabel>

                      {/* If View mode, show read-only chips (no dropdown). Otherwise keep existing Select. */}
                      {state && state.type === 'View' ? (
                        // keep the same boxed appearance as the editable Select field,
                        // without changing chip styles or layout
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
                            alignItems: 'flex-start'
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
                            {selectedSchedule && selectedSchedule.length > 0 ? (
                              selectedSchedule.map((value, index) => (
                                <div key={index} style={{ width: '90%' }}>
                                  <Chip
                                    label={`${value.Title} (${value.StartTime} - ${value.EndTime}) (${value.StartDate} - ${value.EndDate})`}
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
                          value={selectedSchedule}
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
                              {selected.map((value, index) => (
                                <div key={index} style={{ width: '90%' }}>
                                  <Chip
                                    label={`${value.Title} (${value.StartTime} - ${value.EndTime}) (${value.StartDate} - ${value.EndDate})`}
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
                              ))}
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
                              const isChecked = selectedSchedule.some(
                                (s) => s && s.ScheduleRef === item.ScheduleRef
                              );
                              return (
                                <MenuItem key={item.ScheduleRef} value={item}>
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
                      <Button
                        color="primary"
                        fullWidth
                        size="large"
                        variant="contained"
                        onClick={() => {
                          handleDateAndTime();
                        }}
                        /* slide interval removed: always enabled (can add validation later) */
                      >
                        {type} Monitor
                      </Button>
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
