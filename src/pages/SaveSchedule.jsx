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
import { connect } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogContent,
  DialogContentText,
  Alert,
  Modal,
  SvgIcon,
  useTheme
} from '@mui/material';
import { saveSchedule, getUserComponentList } from '../store/action/user';
import { COMPONENTS } from 'src/utils/constant.jsx';

// Map day names to numeric codes
const DAY_NAME_TO_CODE = {
  monday: '1',
  tuesday: '2',
  wednesday: '3',
  thursday: '4',
  friday: '5',
  saturday: '6',
  sunday: '7'
};

const DAY_CODE_TO_NAME = {
  '7': 'sunday',
  '1': 'monday',
  '2': 'tuesday',
  '3': 'wednesday',
  '4': 'thursday',
  '5': 'friday',
  '6': 'saturday'
};

const DAY_CODE_TO_NAME_DISPLAY = {
  '7': 'Sunday',
  '1': 'Monday',
  '2': 'Tuesday',
  '3': 'Wednesday',
  '4': 'Thursday',
  '5': 'Friday',
  '6': 'Saturday'
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
  const [dateError, setDateError] = useState('');

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

  const [conflictModal, setConflictModal] = useState({
    open: false,
    conflicts: []
  });

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
        const dayStr = String(day).toLowerCase().trim();
        if (DAY_CODE_TO_NAME[dayStr]) {
          const dayName = DAY_CODE_TO_NAME[dayStr];
          newDays[dayName] = true;
        } else if (newDays.hasOwnProperty(dayStr)) {
          newDays[dayStr] = true;
        }
      });
      
      setDays(newDays);

      const allSelected = Object.values(newDays).every(Boolean);
      setDaysMode(allSelected ? 'all' : 'custom');
    } else {
      setDaysMode('all');
    }
  }, []);

  useEffect(() => {
    if (props.playlists && Array.isArray(props.playlists)) {
      setPlaylistData(props.playlists);
    }
  }, [props.playlists]);

  const daysKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const selectedDaysArray = daysKeys.filter((k) => days[k]);

  const validateTime = (start, end) => {
    if (start && end) {
      if (start >= end) {
        setTimeError('End time must be after start time');
        return false;
      }
    }
    setTimeError('');
    return true;
  };

  const validateDate = (start, end) => {
    if (start && end) {
      if (new Date(start) > new Date(end)) {
        setDateError('End date must be on or after start date');
        return false;
      }
    }
    setDateError('');
    return true;
  };

  const handleDaysToggle = (event, newSelected) => {
    const next = {};
    daysKeys.forEach((k) => {
      next[k] = newSelected.includes(k);
    });
    setDays(next);
  };

  const handleDaysModeChange = (e) => {
    const mode = e.target.value;
    setDaysMode(mode);

    if (mode === 'all') {
      const allDays = {};
      daysKeys.forEach((k) => { allDays[k] = true; });
      setDays(allDays);
    } else {
      const noDays = {};
      daysKeys.forEach((k) => { noDays[k] = false; });
      setDays(noDays);
    }
  };

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
      !dateError
    );
  };

  // ==================== HELPER FUNCTIONS ====================
  
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

const normalizeDaysToCodes = (daysInput) => {
  console.log('🔍 normalizeDaysToCodes INPUT:', daysInput, 'TYPE:', typeof daysInput);
  
  const result = new Set();
  if (!daysInput) {
    console.log('   ⚠️ Days input is null/undefined');
    return result;
  }

  // Handle if it's already an array
  if (Array.isArray(daysInput)) {
    console.log('   ✓ Days is array, length:', daysInput.length);
    daysInput.forEach((day) => {
      if (!day) return;
      const dayStr = String(day).toLowerCase().trim();
      
      if (DAY_CODE_TO_NAME[dayStr]) {
        result.add(dayStr);
      } else if (DAY_NAME_TO_CODE[dayStr]) {
        result.add(DAY_NAME_TO_CODE[dayStr]);
      } else if (dayStr === '0') {
        result.add('7');
      }
    });
  } 
  // Handle if it's a string
  else if (typeof daysInput === 'string') {
    console.log('   ✓ Days is string');
    const arr = daysInput.split(',').map(s => s.trim());
    arr.forEach((day) => {
      if (!day) return;
      const dayStr = day.toLowerCase().trim();
      
      if (DAY_CODE_TO_NAME[dayStr]) {
        result.add(dayStr);
      } else if (DAY_NAME_TO_CODE[dayStr]) {
        result.add(DAY_NAME_TO_CODE[dayStr]);
      } else if (dayStr === '0') {
        result.add('7');
      }
    });
  }
  
  console.log('   → Result Set:', Array.from(result));
  return result;
};

  const timesOverlap = (start1, end1, start2, end2) => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
  };

  const dateRangesOverlap = (start1, end1, start2, end2) => {
    if (!start1 || !end1 || !start2 || !end2) return true;
    const d1Start = new Date(start1);
    const d1End = new Date(end1);
    const d2Start = new Date(start2);
    const d2End = new Date(end2);
    return d1Start <= d2End && d2Start <= d1End;
  };

  const handleCloseConflictModal = () => {
    setConflictModal({
      open: false,
      conflicts: []
    });
  };

  // ==================== SAVE TO DATABASE FUNCTION ====================
  const performSave = (selectedDayCodes) => {
    console.log('💾 SAVING TO DATABASE...');
    setLoading(true);

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
        Days: selectedDayCodes
      }
    };

    props.saveSchedule(payload, (response) => {
      setLoading(false);
      
      if (response && response.exists === true) {
        const errorMsg = response.message || response.err || 'Failed to save schedule. Please try again.';
        console.log('❌ Save failed:', errorMsg);
        setPopupMessage(errorMsg);
        setPopupSeverity('error');
        setShowPopup(true);
      } else {
        const message = scheduleRef 
          ? 'Schedule updated successfully!' 
          : 'Schedule saved successfully!';
        
        console.log('✅ Save successful!');
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

  // ==================== MAIN SUBMIT HANDLER ====================
  const handleSubmit = async (e) => {
    e && e.preventDefault();

    console.log('🚀 SUBMIT HANDLER CALLED');

    if (!validateDate(startDate, endDate)) {
      console.log('❌ Date validation failed');
      return;
    }

    if (!isFormValid()) {
      console.log('❌ Form validation failed');
      setPopupMessage('Please fill in all required fields correctly.');
      setPopupSeverity('error');
      setShowPopup(true);
      return;
    }

    // Get selected day names and convert to codes
    const selectedDayNames = daysMode === 'all' ? daysKeys : Object.keys(days).filter((k) => days[k]);
    const selectedDayCodes = selectedDayNames.map(dayName => DAY_NAME_TO_CODE[dayName]);

    // ==================== CASE 1: CREATING NEW SCHEDULE ====================
    if (!scheduleRef) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ CASE 1: CREATING NEW SCHEDULE - NO CONFLICT CHECK');
      console.log('═══════════════════════════════════════════════════════\n');
      performSave(selectedDayCodes);
      return; // ✅ STOP HERE - DO NOT CONTINUE
    }

    // ==================== CASE 2 & 3: EDITING EXISTING SCHEDULE ====================
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 EDITING EXISTING SCHEDULE - CHECKING MONITOR ASSIGNMENT');
    console.log('═══════════════════════════════════════════════════════');

    try {
      // ========== STEP 1: FETCH MONITORS AND CHECK ASSIGNMENT ==========
      console.log('\n📋 STEP 1: Fetching monitors...');
      
      await new Promise((resolve) => {
        props.getUserComponentList({ componenttype: COMPONENTS.Monitor }, (err) => {
          resolve();
        });
      });

      const allMonitors = props.monitors || [];
      console.log(`   ✓ Fetched ${allMonitors.length} total monitors from database`);

      const monitorsWithThisSchedule = allMonitors.filter(monitor => {
        if (!monitor.Schedules || !Array.isArray(monitor.Schedules)) return false;
        return monitor.Schedules.some(s => s.ScheduleRef === scheduleRef && s.IsActive === 1);
      });

      console.log(`   ✓ This schedule is assigned to ${monitorsWithThisSchedule.length} monitor(s)`);

      // ========== CASE 2: SCHEDULE NOT ASSIGNED TO ANY MONITORS ==========
      if (monitorsWithThisSchedule.length === 0) {
        console.log('\n   ✅ CASE 2: Schedule NOT assigned to any monitors');
        console.log('   ✅ ACTION: Skipping conflict check, saving directly...');
        console.log('═══════════════════════════════════════════════════════\n');
        performSave(selectedDayCodes);
        return; // ✅ STOP HERE - DO NOT CONTINUE
      }

      // ========== CASE 3: SCHEDULE IS ASSIGNED - CHECK FOR CONFLICTS ==========
      console.log('\n   ⚠️  CASE 3: Schedule IS assigned to monitors');
      console.log('   → Proceeding to conflict detection...\n');

      console.log('📋 STEP 2: Getting other schedules on those monitors...');
      
      const conflictsArray = [];

      for (const monitor of monitorsWithThisSchedule) {
        console.log(`\n   🖥️  Monitor: "${monitor.MonitorName}"`);
        
        const allSchedulesOnMonitor = monitor.Schedules || [];
        console.log(`      - Total schedules: ${allSchedulesOnMonitor.length}`);
        
        const otherSchedules = allSchedulesOnMonitor.filter(s => 
          s.ScheduleRef !== scheduleRef && s.IsActive === 1
        );
        
        console.log(`      - Other schedules to check: ${otherSchedules.length}`);

        // --- NEW: merge full schedule details from props.schedules so Days is present ---
        for (let i = 0; i < otherSchedules.length; i++) {
          const sRef = otherSchedules[i] && otherSchedules[i].ScheduleRef;
          if (!sRef) {
            console.log(`   ⚠️ Other schedule at index ${i} has no ScheduleRef`);
            continue;
          }
          const full = (props.schedules || []).find(s => s.ScheduleRef === sRef);
          if (full) {
            console.log(`   📝 Found full schedule data for "${otherSchedules[i].Title || full.Title || sRef}":`, full.Days);
            otherSchedules[i] = {
              ...otherSchedules[i],
              Days: full.Days !== undefined ? full.Days : otherSchedules[i].Days,
              StartTime: full.StartTime || otherSchedules[i].StartTime,
              EndTime: full.EndTime || otherSchedules[i].EndTime,
              StartDate: full.StartDate || otherSchedules[i].StartDate,
              EndDate: full.EndDate || otherSchedules[i].EndDate,
              Title: otherSchedules[i].Title || full.Title
            };
          } else {
            console.log(`   ⚠️ WARNING: Could not find full schedule data for ScheduleRef ${sRef}`);
          }
        }

        console.log('\n   📋 STEP 3: Checking for conflicts...');
        
        const editedScheduleDays = new Set(selectedDayCodes);
        console.log(`      - Edited schedule: [${Array.from(editedScheduleDays).map(c => DAY_CODE_TO_NAME_DISPLAY[c]).join(', ')}] ${startTime}-${endTime} (${startDate} to ${endDate})`);

        for (const otherSch of otherSchedules) {
          console.log(`\n      🔍 Checking against: "${otherSch.Title || 'Untitled'}"`);

          const otherSchDays = normalizeDaysToCodes(otherSch.Days);
          console.log(`         - Other schedule: [${Array.from(otherSchDays).map(c => DAY_CODE_TO_NAME_DISPLAY[c]).join(', ')}] ${otherSch.StartTime}-${otherSch.EndTime} (${otherSch.StartDate} to ${otherSch.EndDate})`);
          
          // CONDITION 1: DAYS OVERLAP
          const commonDays = [...editedScheduleDays].filter(day => otherSchDays.has(day));
          const daysOverlap = commonDays.length > 0;
          
          console.log(`\n         📅 CONDITION 1 (Days): ${daysOverlap ? '✓ OVERLAP' : '✗ NO OVERLAP'}`);
          if (daysOverlap) {
            console.log(`            Common: [${commonDays.map(c => DAY_CODE_TO_NAME_DISPLAY[c]).join(', ')}]`);
          }
          
          if (!daysOverlap) {
            console.log('            → Skipping (no day overlap)');
            continue;
          }

          // CONDITION 2: TIMES OVERLAP
          const timeOverlap = timesOverlap(startTime, endTime, otherSch.StartTime, otherSch.EndTime);
          
          console.log(`         ⏰ CONDITION 2 (Times): ${timeOverlap ? '✓ OVERLAP' : '✗ NO OVERLAP'}`);
          
          if (!timeOverlap) {
            console.log('            → Skipping (no time overlap)');
            continue;
          }

          // CONDITION 3: DATES OVERLAP
          const datesOverlap = dateRangesOverlap(startDate, endDate, otherSch.StartDate, otherSch.EndDate);
          
          console.log(`         📆 CONDITION 3 (Dates): ${datesOverlap ? '✓ OVERLAP' : '✗ NO OVERLAP'}`);
          
          if (!datesOverlap) {
            console.log('            → Skipping (no date overlap)');
            continue;
          }

          // ALL 3 CONDITIONS TRUE = CONFLICT!
          console.log('\n         ❌❌❌ CONFLICT DETECTED! ALL 3 CONDITIONS TRUE ❌❌❌');
          
          const commonDayNames = commonDays.map(code => DAY_CODE_TO_NAME_DISPLAY[code]).join(', ');
          
          conflictsArray.push({
            monitorName: monitor.MonitorName,
            schedule1: title,
            schedule2: otherSch.Title || 'Untitled Schedule',
            days: commonDayNames,
            time1: `${startTime} - ${endTime}`,
            time2: `${otherSch.StartTime} - ${otherSch.EndTime}`,
            dateRange1: `${startDate} to ${endDate}`,
            dateRange2: `${otherSch.StartDate} to ${otherSch.EndDate}`
          });
        }
      }

      // ========== STEP 4: PROCESS RESULTS ==========
      console.log('\n\n📋 STEP 4: Processing results...');
      console.log(`   Total conflicts: ${conflictsArray.length}`);
      
      if (conflictsArray.length > 0) {
        console.log('\n   ❌❌❌ CONFLICTS EXIST - BLOCKING SAVE ❌❌❌');
        console.log('   ✗ NOT saving to database');
        console.log('   ✗ NOT redirecting');
        console.log('   ✓ Showing conflict modal');
        console.log('═══════════════════════════════════════════════════════\n');
        
        setConflictModal({
          open: true,
          conflicts: conflictsArray
        });
        
        return; // ❌ BLOCK SAVE - STOP HERE
      }

      console.log('\n   ✅✅✅ NO CONFLICTS - PROCEEDING TO SAVE ✅✅✅');
      console.log('═══════════════════════════════════════════════════════\n');
      
      performSave(selectedDayCodes);
      
    } catch (error) {
      console.error('❌ ERROR during conflict detection:', error);
      setPopupMessage('An error occurred while checking for conflicts. Please try again.');
      setPopupSeverity('error');
      setShowPopup(true);
      return; // ❌ DO NOT SAVE IF ERROR OCCURS
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    if (popupSeverity === 'success') {
      navigate('/app/schedules');
    }
  };

  const labelSx = {
    fontSize: '1.05rem',
    color: theme.palette.text.primary,
    fontWeight: 700
  };
  
  return (
    <>
      <Helmet>
        <title>Schedule | Ideogram</title>
      </Helmet>

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

      <Modal
        open={conflictModal.open}
        onClose={handleCloseConflictModal}
        aria-labelledby="conflict-modal-title"
        aria-describedby="conflict-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 600, md: 700 },
          maxWidth: '90vw',
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          overflow: 'auto'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SvgIcon sx={{ color: '#d32f2f', fontSize: 40, mr: 2 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </SvgIcon>
            <Typography id="conflict-modal-title" variant="h5" component="h2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
              Schedule Conflict Detected
            </Typography>
          </Box>

          <Typography id="conflict-modal-description" sx={{ mb: 3, fontSize: '1rem', color: '#333' }}>
            Cannot save schedule. The following schedules have overlapping time slots:
          </Typography>

          <Box sx={{ mb: 3 }}>
            {conflictModal.conflicts.map((conflict, idx) => (
              <Box 
                key={idx} 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: '#fff3e0', 
                  borderLeft: '4px solid #ff9800',
                  borderRadius: 1
                }}
              >
                <Typography sx={{ fontWeight: 600, mb: 1, color: '#e65100' }}>
                  Conflict {idx + 1}:
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', mb: 0.5 }}>
                  <strong>"{conflict.schedule1}"</strong> and <strong>"{conflict.schedule2}"</strong> on monitor <strong>"{conflict.monitorName}"</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#666', ml: 2, mt: 1 }}>
                  • Common days: <strong>{conflict.days}</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#666', ml: 2 }}>
                  • "{conflict.schedule1}" runs: <strong>{conflict.time1}</strong> ({conflict.dateRange1})
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#666', ml: 2 }}>
                  • "{conflict.schedule2}" runs: <strong>{conflict.time2}</strong> ({conflict.dateRange2})
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, fontSize: '0.95rem' }}>
            <strong>To resolve this issue:</strong> Please change the days, times, or date ranges so they don't overlap.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleCloseConflictModal}
              sx={{
                bgcolor: '#1976d2',
                '&:hover': { bgcolor: '#1565c0' },
                px: 4,
                py: 1
              }}
            >
              OK
            </Button>
          </Box>
        </Box>
      </Modal>

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
  <Typography
    variant="h4"
    sx={{
      fontWeight: 600,
      mb: 3,
      textAlign: 'center'
    }}
  >
    {scheduleRef ? 'Edit Schedule' : 'Create Schedule'}
  </Typography>
  <Box sx={{ maxWidth: 860, mx: 'auto', width: '100%' }}>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
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

              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (endDate && val && endDate < val) {
                      setDateError('End date must be on or after start date');
                    } else {
                      setDateError('');
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
                  inputProps={{ min: startDate || undefined }}
                  size="medium"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    validateTime(e.target.value, endTime);
                    if (e.target.value && e.target.value.includes(':')) {
                      if (endTimeRef.current) {
                        endTimeRef.current.focus();
                      }
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
                    if (e.target.value && e.target.value.includes(':')) {
                      if (endTimeRef.current) {
                        endTimeRef.current.blur();
                      }
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

              {daysMode === 'custom' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" align="center" gutterBottom sx={{ fontWeight: 650, fontSize: '1rem' }}>
                    Select Days
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'center', px: 1, overflowX: { xs: 'auto', md: 'hidden' } }}>
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

                  {selectedDaysArray.length === 0 && (
                    <Typography align="center" sx={{ color: 'error.main', mt: 1, fontSize: 13 }}>
                      Please select at least one day.
                    </Typography>
                  )}
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
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
  playlists: (root.user && root.user.components && root.user.components.playlistList) || [],
  schedules: (root.user && root.user.components && root.user.components.scheduleList) || [],
  monitors: (root.user && root.user.components && root.user.components.list) || []
});

const mapDispatchToProps = (dispatch) => ({
  saveSchedule: (data, callback) => dispatch(saveSchedule(data, callback)),
  getUserComponentList: (data, callback) => dispatch(getUserComponentList(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(SaveScheduleDetails);