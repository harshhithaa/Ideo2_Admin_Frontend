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
import { Helmet } from 'react-helmet';
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
  FormControl
} from '@material-ui/core';
import { COMPONENTS } from 'src/utils/constant';
import { getUserComponentList, saveSchedule } from '../store/action/user';
import { Alert, Stack } from '@mui/material';

const SaveScheduleDetails = (props) => {
  const { component } = props || null;
  const navigate = useNavigate();
  const { state } = useLocation();
  console.log(state);

  const [playlist, setPlaylist] = useState([]);
  const [title, setTitle] = useState((state && state.Title) || '');
  const [description, setDescription] = useState(
    (state && state.Description) || ''
  );
  const [MonitorRef, setMonitorRef] = useState(
    (state && state.MonitorRef) || ''
  );
  const [playlistData, setPlaylistData] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    (state && state.PlaylistRef) || ''
  );
  const [startTime, setStartTime] = useState(
    (state && state.StartTime && state.StartTime.slice(0, 5)) || ''
  );
  const [endTime, setEndTime] = useState(
    (state && state.EndTime && state.EndTime.slice(0, 5)) || ''
  );
  const [startDate, setStartDate] = useState((state && state.StartDate) || '');
  const [endDate, setEndDate] = useState((state && state.EndDate) || '');
  const [loader, setloader] = useState(true);
  const [fixedTimePlayback, setFixedTimePlayback] = useState(
    (state && state.FixedTimePlayback) || ''
  );
  const [type, settype] = useState(
    state && state.type === 'View'
      ? 'View'
      : state && state.type === 'Edit'
      ? 'Update'
      : 'Create'
  );

  const [checked, setChecked] = useState(
    (state && state.FixedTimePlayback) || false
  );
  const [disable, setDisable] = useState(false);
  let [box, setbox] = useState(false);
  let [boxMessage, setboxMessage] = useState('');
  let [color, setcolor] = useState('success');
  var [days, setdaysr] = useState(
    (state && state.Days) || ['0', '1', '2', '3', '4', '5', '6']
  );
  const [disableBlock, setDisableBlock] = useState(false);

  const [id, setId] = useState((state && state.ScheduleRef) || '');

  useEffect(() => {
    const data = {
      componenttype: COMPONENTS.Playlist
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
  }, [loader]);

  function saveScheduleData() {
    console.log('running saveScheduleData');
    console.log('---> playlist', selectedPlaylist);

    // if (fixedTimePlayback) {
    //   if(startDate>endDate){
    //     console.log('date inappropriate');
    //   }
    //   if(startTime>endTime){
    //     console.log('time inappropriate');
    //   }
    // }else{
    //   if(startDate>endDate){
    //     console.log('date inappropriate');
    //   }
    // }

    const schedule = {
      StartTime: startTime,
      EndTime: endTime,
      StartDate: startDate,
      EndDate: endDate,
      Days: days
    };

    console.log('schedule', schedule);

    const saveScheduleDetails = {
      ScheduleTitle: title,
      Description: description,
      PlaylistRef: selectedPlaylist,
      Schedule: schedule,
      FixedTimePlayback: fixedTimePlayback,
      IsActive: 1
    };
    if (id !== '') saveScheduleDetails.ScheduleRef = id;
    if (MonitorRef !== '') saveScheduleDetails.MonitorRef = MonitorRef;

    window.scrollTo(0, 0);
    // setDisable(true);
    props.saveSchedule(saveScheduleDetails, (err) => {
      if (err.exists) {
        console.log('err', err);

        setcolor('error');
        setboxMessage(err.errmessage);
        setbox(true);

        // setdisable(false);
      } else {
        navigate('/app/schedules', { replace: true });
        // setloader(!loader);
      }
    });
  }

  const handleChangeCheckbox = (event) => {
    if (days.includes(event.target.value)) {
      days = days.filter((item) => item !== event.target.value);
      console.log('days', days);
      setdaysr((e) => [...days]);
    } else {
      days.push(event.target.value);
      console.log('days', days);
      setdaysr((e) => [...days]);
    }
  };
  const handleChangeCheckboxForFTP = (event) => {
    setChecked(event.target.checked);
    if (event.target.checked) {
      setFixedTimePlayback(1);

      console.log('fixedTimePlayback', fixedTimePlayback, event.target.checked);

      if (fixedTimePlayback) {
        if (startDate > endDate || startTime > endTime) {
          setDisable(true);
          console.log('date inappropriate');
        } else {
          setDisable(false);
        }
      }
    } else {
      setFixedTimePlayback(0);

      console.log('fixedTimePlayback', fixedTimePlayback);

      if (!fixedTimePlayback) {
        if (startDate > endDate) {
          console.log('date inappropriate');
          setDisable(true);
        } else {
          setDisable(false);
        }
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Schedule | Ideogram</title>
      </Helmet>
      {box ? (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert severity={color}>{boxMessage}</Alert>
        </Stack>
      ) : null}
      <Box
        sx={{
          backgroundColor: 'background.default',
          display: 'block',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="sm">
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
              days: days
            }}
          >
            {({ errors, handleBlur, handleSubmit, isSubmitting, touched }) => (
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                  <Typography color="textPrimary" variant="h2">
                    {type} schedule
                  </Typography>
                </Box>
                <TextField
                  error={Boolean(touched.title && errors.title)}
                  fullWidth
                  helperText={touched.title && errors.title}
                  label="Title"
                  margin="normal"
                  name="title"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setTitle(e.target.value);
                  }}
                  value={title}
                  variant="outlined"
                />
                <TextField
                  error={Boolean(touched.description && errors.description)}
                  fullWidth
                  helperText={touched.description && errors.description}
                  label="Description"
                  margin="normal"
                  name="description"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                  value={description}
                  variant="outlined"
                />
                <InputLabel id="select-playlist">Playlist</InputLabel>
                <Select
                  labelId="select-playlist"
                  id="select-playlist"
                  value={selectedPlaylist}
                  label="playlist"
                  onChange={(e) => {
                    console.log('e.target.value', e.target.value);
                    setSelectedPlaylist(e.target.value);
                  }}
                >
                  {playlistData && playlistData.length > 0 ? (
                    playlistData.map((item) => (
                      <MenuItem value={item.PlaylistRef}>
                        {`${item.Name}`}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem>NoItems available</MenuItem>
                  )}
                </Select>
                <InputLabel id="select-start-date">Start Date</InputLabel>
                <TextField
                  labelId="select-start-date"
                  error={Boolean(touched.startDate && errors.startDate)}
                  fullWidth
                  helperText={touched.startDate && errors.startDate}
                  margin="normal"
                  name="date"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                  }}
                  type="date"
                  value={startDate}
                  variant="outlined"
                />
                <InputLabel id="select-start-time">Start Time</InputLabel>
                <TextField
                  error={Boolean(touched.startTime && errors.startTime)}
                  fullWidth
                  helperText={touched.startTime && errors.startTime}
                  margin="normal"
                  name="startTime"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                  }}
                  type="time"
                  value={startTime}
                  variant="outlined"
                />

                <InputLabel id="select-end-date">End Date</InputLabel>
                <TextField
                  error={Boolean(touched.endDate && errors.endDate)}
                  fullWidth
                  helperText={touched.endDate && errors.endDate}
                  margin="normal"
                  name="date"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                  }}
                  type="Date"
                  value={endDate}
                  variant="outlined"
                />

                <InputLabel id="select-end-time">End Time</InputLabel>
                <TextField
                  error={Boolean(touched.endTime && errors.endTime)}
                  fullWidth
                  helperText={touched.endTime && errors.endTime}
                  margin="normal"
                  name="time"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                  }}
                  type="time"
                  value={endTime}
                  variant="outlined"
                />

                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    ml: -1
                  }}
                >
                  <FormControl>
                    <FormLabel component="legend">Schedule Type</FormLabel>
                    <FormGroup aria-label="position" row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={fixedTimePlayback}
                            checked={checked}
                            onChange={handleChangeCheckboxForFTP}
                          />
                        }
                        label="Fixed Time Playback"
                      />
                    </FormGroup>
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    ml: -1
                  }}
                >
                  <FormControl>
                    <FormLabel component="legend">Days</FormLabel>
                    <FormGroup aria-label="position" row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={0}
                            onChange={handleChangeCheckbox}
                            checked={days.includes('0')}
                          />
                        }
                        label="Sunday"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={1}
                            onChange={handleChangeCheckbox}
                            checked={days.includes('1')}
                          />
                        }
                        label="Monday"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={2}
                            onChange={handleChangeCheckbox}
                            checked={days.includes('2')}
                          />
                        }
                        label="Tuesday"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={3}
                            onChange={handleChangeCheckbox}
                            checked={days.includes('3')}
                          />
                        }
                        label="Wednesday"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={4}
                            onChange={handleChangeCheckbox}
                            checked={days.includes('4')}
                          />
                        }
                        label="Thursday"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={5}
                            onChange={handleChangeCheckbox}
                            checked={days.includes('5')}
                          />
                        }
                        label="Friday"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            value={6}
                            onChange={handleChangeCheckbox}
                            checked={days.includes('6')}
                          />
                        }
                        label="Saturday"
                      />
                    </FormGroup>
                  </FormControl>
                </Box>
                {box ? (
                  <Stack sx={{ width: '100%' }} spacing={2}>
                    <Alert severity={color}>{boxMessage}</Alert>
                  </Stack>
                ) : null}
                <Box sx={{ py: 2 }}>
                  <Button
                    color="primary"
                    disabled={disable}
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    onClick={() => {
                      saveScheduleData();
                    }}
                  >
                    {type} Schedule
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
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
  saveSchedule: (data, callback) => dispatch(saveSchedule(data, callback))
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SaveScheduleDetails);
