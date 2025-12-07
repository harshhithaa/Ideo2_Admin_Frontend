/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable no-sequences */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-shadow */
/* eslint-disable array-callback-return */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import { saveSchedule } from '../store/action/user';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  Paper,
  Dialog,
  DialogContent,
  DialogContentText,
  Alert
} from '@mui/material';

// Map day names to numeric codes that the database expects
const DAY_NAME_TO_CODE = {
  monday: '1',
  tuesday: '2',
  wednesday: '3',
  thursday: '4',
  friday: '5',
  saturday: '6',
  sunday: '7'
};

// Reverse mapping for loading existing schedules (canonical — use '7' for Sunday)
const DAY_CODE_TO_NAME = {
  '7': 'sunday',
  '1': 'monday',
  '2': 'tuesday',
  '3': 'wednesday',
  '4': 'thursday',
  '5': 'friday',
  '6': 'saturday'
};

const SaveScheduleDetails = (props) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const theme = useTheme();

  const [playlistData, setPlaylistData] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    (state && state.PlaylistRef) || ''
  );
  const [scheduleRef, setScheduleRef] = useState(
    (state && state.ScheduleRef) || null
  );
  const [title, setTitle] = useState((state && state.Title) || '');
  const [description, setDescription] = useState((state && state.Description) || '');
  const [startDate, setStartDate] = useState((state && state.StartDate) || '');
  const [endDate, setEndDate] = useState((state && state.EndDate) || '');
  const [startTime, setStartTime] = useState(
    (state && state.StartTime && state.StartTime.slice(0, 5)) || ''
  );
  const [endTime, setEndTime] = useState(
    (state && state.EndTime && state.EndTime.slice(0, 5)) || ''
  );
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupSeverity, setPopupSeverity] = useState('success');

  const startTimeRef = React.useRef(null);
  const endTimeRef = React.useRef(null);
  const [timeError, setTimeError] = useState('');
  const [dateError, setDateError] = useState(''); // added

  const [days, setDays] = useState({
    sunday: false,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false
  });

  const [daysMode, setDaysMode] = useState('all');

  // Load existing days if editing and determine mode
  useEffect(() => {
    if (state && state.Days && Array.isArray(state.Days)) {
      const newDays = {
        sunday: false,
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false
      };
      
      state.Days.forEach((day) => {
        // normalize incoming codes/strings: coerce '0' to '7', accept names or codes
        let incoming = String(day).toLowerCase();
        if (incoming === '0') incoming = '7'; // normalize legacy 0 -> 7

        let dayName = incoming;
        if (DAY_CODE_TO_NAME[incoming]) {
          dayName = DAY_CODE_TO_NAME[incoming];
        }

        if (dayName in newDays) {
          newDays[dayName] = true;
        }
      });
      
      setDays(newDays);

      const allSelected = Object.values(newDays).every(Boolean);
      setDaysMode(allSelected ? 'all' : 'custom');
    } else {
      setDaysMode('all');
      setDays({
        sunday: true,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true
      });
    }
  }, []);

  useEffect(() => {
    if (props.playlists && Array.isArray(props.playlists)) {
      setPlaylistData(props.playlists);
    }
  }, [props.playlists]);

  const daysKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const selectedDaysArray = daysKeys.filter((k) => days[k]);

  // Validate end time is not before start time
  const validateTime = (start, end) => {
    if (start && end) {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);

      if (endHour < startHour || (endHour === startHour && endMin <= startMin)) {
        setTimeError('End time must be after start time');
        return false;
      }
    }
    setTimeError('');
    return true;
  };

  // Validate End Date is same or after Start Date
  const validateDate = (start, end) => {
    if (start && end) {
      // ISO date strings (YYYY-MM-DD) can be compared lexicographically safely
      if (end < start) {
        setDateError('End date must be the same or after start date');
        return false;
      }
    }
    setDateError('');
    return true;
  };

  const handleDaysToggle = (event, newSelected) => {
    const next = {};
    daysKeys.forEach((k) => {
      next[k] = Array.isArray(newSelected) ? newSelected.includes(k) : false;
    });
    setDays(next);
  };

  const handleDaysModeChange = (e) => {
    const mode = e.target.value;
    setDaysMode(mode);

    if (mode === 'all') {
      setDays({
        sunday: true,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true
      });
    } else {
      setDays({
        sunday: false,
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false
      });
    }
  };

  // Validation - all fields must be filled and at least one day selected (if custom)
  const isFormValid = () => {
    const daysValid = daysMode === 'all' ? true : selectedDaysArray.length > 0;
    return (
      title.trim() !== '' &&
      description.trim() !== '' &&
      startDate !== '' &&
      endDate !== '' &&
      startTime !== '' &&
      endTime !== '' &&
      selectedPlaylist !== '' &&
      daysValid &&
      !timeError &&
      !dateError // include date validation
    );
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();

    // ensure date validation before submit
    if (!validateDate(startDate, endDate)) {
      return;
    }

    if (!isFormValid()) {
      return;
    }

    setLoading(true);

    // Get selected day names
    const selectedDayNames = daysMode === 'all' ? daysKeys : Object.keys(days).filter((k) => days[k]);
    
    // Convert day names to numeric codes for the database
    const selectedDayCodes = selectedDayNames.map(dayName => DAY_NAME_TO_CODE[dayName]);

    const payload = {
      scheduleRef: scheduleRef || null,
      scheduleTitle: title || null,
      description: description || null,
      playlistRef: selectedPlaylist || null,
      monitorRef: null,
      isActive: 1,
      schedule: {
        StartTime: startTime || null,
        EndTime: endTime || null,
        StartDate: startDate || null,
        EndDate: endDate || null,
        Days: selectedDayCodes  // Send numeric codes instead of day names
      }
    };

    props.saveSchedule(payload, (response) => {
      setLoading(false);
      
      // If response.exists is true, it's an error. Otherwise, it's success.
      if (response && response.exists === true) {
        // Error case
        const errorMsg = response.message || response.err || 'Failed to save schedule. Please try again.';
        setPopupMessage(errorMsg);
        setPopupSeverity('error');
        setShowPopup(true);
      } else {
        // Success case
        const message = scheduleRef 
          ? 'Schedule updated successfully!' 
          : 'Schedule saved successfully!';
        
        setPopupMessage(message);
        setPopupSeverity('success');
        setShowPopup(true);

        setTimeout(() => {
          setShowPopup(false);
          navigate('/app/schedules', { replace: true, state: { refresh: true } });
        }, 1500);
      }
    });
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    if (popupSeverity === 'success') {
      navigate('/app/schedules', { replace: true, state: { refresh: true } });
    }
  };

  const labelSx = {
    fontSize: '1.05rem',
    color: theme.palette.text.primary,
    fontWeight: 700
  };
  
  return (
    <>
      <Dialog
        open={showPopup}
        onClose={handleClosePopup}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <Alert severity={popupSeverity} onClose={handleClosePopup}>
            <DialogContentText id="alert-dialog-description">
              {popupMessage}
            </DialogContentText>
          </Alert>
        </DialogContent>
      </Dialog>

      <Paper
        elevation={2}
        sx={{
          maxWidth: 900,
          mx: 'auto',
          mt: 6,
          mb: 6,
          p: { xs: 3, sm: 6 },
          borderRadius: 2
        }}
      >
        <Typography align="center" variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
          {scheduleRef ? 'Edit Schedule' : 'Create Schedule'}
        </Typography>
        <Box sx={{ maxWidth: 860, mx: 'auto', width: '100%' }}>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              {/* Row 1 — Title & Description */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  required
                  size="medium"
                  InputLabelProps={{ sx: labelSx }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  required
                  size="medium"
                  InputLabelProps={{ sx: labelSx }}
                />
              </Grid>

              {/* Row 2 — Start Date & End Date */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);

                    // If endDate is before new startDate, adjust endDate to startDate
                    if (endDate && val && endDate < val) {
                      setEndDate(val);
                      validateDate(val, val);
                    } else {
                      validateDate(val, endDate);
                    }
                  }}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  size="medium"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndDate(val);
                    validateDate(startDate, val);
                  }}
                  fullWidth
                  required
                  error={!!dateError}
                  helperText={dateError}
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  inputProps={{ min: startDate || undefined }} // disable dates before startDate
                  size="medium"
                />
              </Grid>

              {/* Row 3 — Start Time & End Time */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    validateTime(e.target.value, endTime);
                    // Auto-close when both hour and minute are set
                    if (e.target.value && e.target.value.includes(':')) {
                      setTimeout(() => {
                        if (startTimeRef.current) {
                          startTimeRef.current.blur();
                        }
                      }, 100);
                    }
                  }}
                  inputRef={startTimeRef}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  size="medium"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    validateTime(startTime, e.target.value);
                    // Auto-close when both hour and minute are set
                    if (e.target.value && e.target.value.includes(':')) {
                      setTimeout(() => {
                        if (endTimeRef.current) {
                          endTimeRef.current.blur();
                        }
                      }, 100);
                    }
                  }}
                  inputRef={endTimeRef}
                  fullWidth
                  required
                  error={!!timeError}
                  helperText={timeError}
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  size="medium"
                />
              </Grid>

              {/* Row 4 — Playlist (left) & Days dropdown (right) */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="medium" required>
                  <InputLabel id="playlist-label" sx={labelSx} shrink>
                    Playlist
                  </InputLabel>
                  <Select
                    labelId="playlist-label"
                    id="playlist-select"
                    value={selectedPlaylist}
                    label="Playlist"
                    onChange={(e) => setSelectedPlaylist(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {playlistData.map((p) => (
                      <MenuItem
                        key={p.PlaylistRef || p.id || p.PlaylistId || p.Ref}
                        value={p.PlaylistRef || p.id || p.PlaylistId || p.Ref}
                      >
                        {p.Name || p.playlistName || p.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="medium" required>
                  <InputLabel id="days-mode-label" sx={labelSx} shrink>
                    Days
                  </InputLabel>
                  <Select
                    labelId="days-mode-label"
                    id="days-mode-select"
                    value={daysMode}
                    label="Days"
                    onChange={handleDaysModeChange}
                  >
                    <MenuItem value="all">All Days</MenuItem>
                    <MenuItem value="custom">Custom Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Day buttons row — only visible when custom selected */}
              {daysMode === 'custom' && (
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    align="center"
                    gutterBottom
                    sx={{ fontWeight: 650, fontSize: '1rem' }}
                  >
                    Select Days
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      px: 1,
                      overflowX: { xs: 'auto', md: 'hidden' }
                    }}
                  >
                    <ToggleButtonGroup
                      value={selectedDaysArray}
                      onChange={handleDaysToggle}
                      aria-label="days"
                      size="small"
                      sx={{
                        flexWrap: 'nowrap',
                        gap: 1,
                        '& .MuiToggleButton-root': {
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          textTransform: 'none',
                          px: 2,
                          py: 1,
                          minWidth: 92,
                          fontSize: '0.98rem'
                        },
                        '& .MuiToggleButton-root.Mui-selected': {
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          borderColor: theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: theme.palette.primary.dark
                          }
                        }
                      }}
                    >
                      <ToggleButton value="sunday" aria-label="Sunday">Sunday</ToggleButton>
                      <ToggleButton value="monday" aria-label="Monday">Monday</ToggleButton>
                      <ToggleButton value="tuesday" aria-label="Tuesday">Tuesday</ToggleButton>
                      <ToggleButton value="wednesday" aria-label="Wednesday">Wednesday</ToggleButton>
                      <ToggleButton value="thursday" aria-label="Thursday">Thursday</ToggleButton>
                      <ToggleButton value="friday" aria-label="Friday">Friday</ToggleButton>
                      <ToggleButton value="saturday" aria-label="Saturday">Saturday</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* validation helper when custom mode and no day selected */}
                  {selectedDaysArray.length === 0 && (
                    <Typography align="center" sx={{ color: 'error.main', mt: 1, fontSize: 13 }}>
                      Please select at least one day.
                    </Typography>
                  )}
                </Grid>
              )}

              {/* Buttons */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'center',
                    mt: 4
                  }}
                >
                  <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit" 
                    disabled={!isFormValid() || loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </>
  );
};

const mapStateToProps = ({ root = {} }) => ({
  playlists:
    (root.user && root.user.components && root.user.components.playlistList) || []
});

const mapDispatchToProps = (dispatch) => ({
  saveSchedule: (data, callback) => dispatch(saveSchedule(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(SaveScheduleDetails);