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
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  TextField,
  Snackbar,
  Alert,
  Chip,
  MenuItem,
  Select,
  Modal,
  Typography,
  SvgIcon,
  Container,
  InputLabel,
  Checkbox
} from '@mui/material';
import { COMPONENTS } from 'src/utils/constant.jsx';
import { getUserComponentList, saveMonitor } from '../store/action/user';
import { X as CloseIcon, Plus } from 'react-feather';
import { IsValuePresentInArray } from 'src/utils/helperFunctions';
import { CancelRounded } from '@material-ui/icons';

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

  // ==================== ADD CONFLICT DETECTION FUNCTIONS ====================
  
  // Convert time string (HH:MM) to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Normalize day codes/names to standard day codes ('1'-'7')
  const normalizeDaysToCodes = (daysInput) => {
    const result = new Set();
    if (!daysInput) return result;

    const arr = Array.isArray(daysInput) ? daysInput : String(daysInput).split(',').map(s => s.trim());
    
    // Day name to code mapping
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
    
    arr.forEach((day) => {
      if (!day) return;
      
      const dayStr = String(day).toLowerCase().trim();
      
      // If it's already a code
      if (DAY_CODE_TO_NAME[dayStr]) {
        result.add(dayStr);
      }
      // If it's a day name
      else if (DAY_NAME_TO_CODE[dayStr]) {
        result.add(DAY_NAME_TO_CODE[dayStr]);
      }
      // Handle '0' as Sunday ('7')
      else if (dayStr === '0') {
        result.add('7');
      }
    });
    
    return result;
  };

  // Check if two time ranges overlap
  const timesOverlap = (start1, end1, start2, end2) => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    
    // Times overlap if: start1 < end2 AND start2 < end1
    return s1 < e2 && s2 < e1;
  };

  // Check if two date ranges overlap
  const dateRangesOverlap = (start1, end1, start2, end2) => {
    if (!start1 || !end1 || !start2 || !end2) return true; // If any date is missing, assume overlap
    
    // Convert to Date objects for comparison
    const d1Start = new Date(start1);
    const d1End = new Date(end1);
    const d2Start = new Date(start2);
    const d2End = new Date(end2);
    
    // Ranges overlap if: start1 <= end2 AND start2 <= end1
    return d1Start <= d2End && d2Start <= d1End;
  };

  // Find conflicting schedules for a monitor
  const findConflictsForMonitor = (schedulesToAssign, monitorSchedules) => {
    const conflicts = [];
    
    // Check each schedule being assigned against all existing active schedules on this monitor
    for (const newSchedule of schedulesToAssign) {
      const newDayCodes = normalizeDaysToCodes(newSchedule.Days);
      
      for (const existing of monitorSchedules) {
        // Skip inactive schedules
        if (existing.IsActive === 0) {
          continue;
        }

        // Skip if comparing with itself (when editing)
        if (newSchedule.ScheduleRef && existing.ScheduleRef === newSchedule.ScheduleRef) {
          continue;
        }

        // Get existing schedule's days
        const existingDayCodes = normalizeDaysToCodes(existing.Days);
        
        // Check if they share ANY common day
        const hasCommonDay = [...newDayCodes].some(day => existingDayCodes.has(day));
        
        if (!hasCommonDay) {
          continue; // No common days = no conflict
        }

        // Check if date ranges overlap
        if (!dateRangesOverlap(
          newSchedule.StartDate,
          newSchedule.EndDate,
          existing.StartDate,
          existing.EndDate
        )) {
          continue; // Date ranges don't overlap = no conflict
        }

        // Check if time ranges overlap
        if (!timesOverlap(
          newSchedule.StartTime,
          newSchedule.EndTime,
          existing.StartTime,
          existing.EndTime
        )) {
          continue; // Time ranges don't overlap = no conflict
        }

        // If we reach here, there's a conflict
        conflicts.push({
          newSchedule: newSchedule,
          existingSchedule: existing
        });
      }
    }
    
    return conflicts;
  };

  // ==================== END CONFLICT DETECTION FUNCTIONS ====================

  // ==================== ADD CONFLICT MODAL STATE ====================
  const [conflictModal, setConflictModal] = useState({
    open: false,
    title: '',
    message: '',
    conflicts: []
  });
  // ==================================================================

  function saveMonitorData() {
    // Build schedules list from selected schedule refs WITH full data for conflict detection
    const schedulesToAssign = selectedScheduleRefs
      .map((ref) => {
        const scheduleObj = scheduleData.find((s) => s.ScheduleRef === ref);
        if (scheduleObj && scheduleObj.ScheduleRef) {
          return {
            ScheduleRef: scheduleObj.ScheduleRef,
            IsActive: 1,
            StartTime: scheduleObj.StartTime,
            EndTime: scheduleObj.EndTime,
            StartDate: scheduleObj.StartDate,
            EndDate: scheduleObj.EndDate,
            Days: scheduleObj.Days,
            Title: scheduleObj.Title
          };
        }
        return null;
      })
      .filter(Boolean);

    const validDeleted = (deletedSchedules || []).filter((d) => d && d.ScheduleRef);

    // ==================== COMPREHENSIVE CONFLICT DETECTION ====================
    
    // STEP 1: Check conflicts among the schedules being assigned (against each other)
    const internalConflicts = [];
    for (let i = 0; i < schedulesToAssign.length; i++) {
      for (let j = i + 1; j < schedulesToAssign.length; j++) {
        const schedule1 = schedulesToAssign[i];
        const schedule2 = schedulesToAssign[j];
        
        const days1 = normalizeDaysToCodes(schedule1.Days);
        const days2 = normalizeDaysToCodes(schedule2.Days);
        
        // Check if they share any common day
        const hasCommonDay = [...days1].some(day => days2.has(day));
        
        if (hasCommonDay &&
            dateRangesOverlap(schedule1.StartDate, schedule1.EndDate, schedule2.StartDate, schedule2.EndDate) &&
            timesOverlap(schedule1.StartTime, schedule1.EndTime, schedule2.StartTime, schedule2.EndTime)) {
          internalConflicts.push({
            newSchedule: schedule1,
            existingSchedule: schedule2
          });
        }
      }
    }

    // STEP 2: Check conflicts with existing schedules on this monitor
    const existingMonitorSchedules = state && state.Schedules 
      ? state.Schedules.filter((s) => s && s.ScheduleRef && s.IsActive === 1)
      : [];

    const externalConflicts = findConflictsForMonitor(schedulesToAssign, existingMonitorSchedules);

    // Combine all conflicts
    const allConflicts = [...internalConflicts, ...externalConflicts];

    if (allConflicts.length > 0) {
      // Build detailed conflict information
      const DAY_CODE_TO_NAME = {
        '7': 'Sunday',
        '1': 'Monday',
        '2': 'Tuesday',
        '3': 'Wednesday',
        '4': 'Thursday',
        '5': 'Friday',
        '6': 'Saturday'
      };

      const conflictDetails = allConflicts.map(c => {
        const newSch = c.newSchedule;
        const existingSch = c.existingSchedule;
        const newDays = normalizeDaysToCodes(newSch.Days);
        const existingDays = normalizeDaysToCodes(existingSch.Days);
        
        const commonDays = [...newDays].filter(day => existingDays.has(day));
        const commonDayNames = commonDays.map(code => DAY_CODE_TO_NAME[code] || code).join(', ');

        return {
          schedule1: newSch.Title || 'Untitled Schedule',
          schedule2: existingSch.Title || 'Untitled Schedule',
          days: commonDayNames,
          time1: `${newSch.StartTime} - ${newSch.EndTime}`,
          time2: `${existingSch.StartTime} - ${existingSch.EndTime}`,
          dateRange1: `${newSch.StartDate} to ${newSch.EndDate}`,
          dateRange2: `${existingSch.StartDate} to ${existingSch.EndDate}`
        };
      });

      // Show centered modal with detailed conflict information
      setConflictModal({
        open: true,
        title: 'Schedule Conflict Detected',
        message: 'Cannot save monitor. The following schedules have overlapping time slots:',
        conflicts: conflictDetails
      });
      
      return; // BLOCK SAVE
    }

    // ==================== END CONFLICT DETECTION ====================

    // No conflicts - build clean payload for backend
    const cleanSchedulesForBackend = [
      ...schedulesToAssign.map(s => ({
        ScheduleRef: s.ScheduleRef,
        IsActive: 1
      })),
      ...validDeleted.map(d => ({
        ScheduleRef: d.ScheduleRef,
        IsActive: 0
      }))
    ];

    const saveMonitorDetails = {
      MonitorName: title,
      Description: description,
      DefaultPlaylistRef: selectedPlaylist,
      Schedules: cleanSchedulesForBackend,
      IsActive: 1,
      Orientation: orientation === 'Landscape' ? '90' : '0'
    };
    
    if (MonitorRef !== '') {
      saveMonitorDetails.MonitorRef = MonitorRef;
    }

    console.log('saveMonitorDetails payload:', JSON.stringify(saveMonitorDetails, null, 2));

    props.saveMonitor(saveMonitorDetails, (err) => {
      if (err.exists) {
        const errorMessage = err.err || err.errmessage || 'Failed to save monitor';
        
        // Show error in modal
        setConflictModal({
          open: true,
          title: 'Failed to Save Monitor',
          message: 'An error occurred while saving the monitor:',
          conflicts: [{
            schedule1: 'Error',
            schedule2: '',
            days: errorMessage,
            time1: '',
            time2: '',
            dateRange1: '',
            dateRange2: 'Please check your inputs and try again.'
          }]
        });
      } else {
        setcolor('success');
        setboxMessage(`Monitor ${type}d Successfully!`);
        setbox(true);
        
        const activeRefs = schedulesToAssign.map((s) => s.ScheduleRef);
        setSelectedScheduleRefs(activeRefs);
        setDeletedSchedules([]);

        setTimeout(() => {
          setbox(false);
          navigate('/app/monitors', { replace: true, state: { refresh: true } });
        }, 1500);
      }
    });
  }

  // ==================== ADD CONFLICT MODAL HANDLER ====================
  const handleCloseConflictModal = () => {
    setConflictModal({
      open: false,
      title: '',
      message: '',
      conflicts: []
    });
  };
  // ====================================================================

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
              boxShadow: 1,
              maxHeight: 'calc(100vh - 96px)',
              overflowY: 'auto',
              overflowX: 'hidden',
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
                            border: '1px solid rgba(0, 0, 0, 0.23)',
                            px: 2,
                            py: 1,
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: '#fff'
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 400,
                              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                              lineHeight: 1.5,
                              letterSpacing: '0.00938em',
                              color: 'rgba(0, 0, 0, 0.87)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
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
                            border: '1px solid rgba(0, 0, 0, 0.23)',
                            px: 2,
                            py: 1,
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: '#fff'
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 400,
                              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                              lineHeight: 1.5,
                              letterSpacing: '0.00938em',
                              color: 'rgba(0, 0, 0, 0.87)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
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
                            border: '1px solid rgba(0, 0, 0, 0.23)',
                            px: 1,
                            py: 0.5,
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'flex-start',
                            bgcolor: '#fff'
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
                                    sx={{
                                      margin: 0.5,
                                      width: '100%',
                                      boxSizing: 'border-box',
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                      position: 'relative',
                                      '& .MuiChip-label': {
                                        fontSize: '1rem',
                                        fontWeight: 400,
                                        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                        lineHeight: 1.5,
                                        letterSpacing: '0.00938em',
                                        color: 'rgba(0, 0, 0, 0.87)',
                                        padding: '6px 12px'
                                      }
                                    }}
                                  />
                                </div>
                              ))
                            ) : (
                              <Typography
                                sx={{
                                  fontSize: '1rem',
                                  fontWeight: 400,
                                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                                  lineHeight: 1.5,
                                  letterSpacing: '0.00938em',
                                  color: 'rgba(0, 0, 0, 0.6)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  px: 1
                                }}
                              >
                                No Items available
                              </Typography>
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

      {/* ==================== ADD CONFLICT MODAL ====================*/}
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
          {/* Header with Error Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SvgIcon sx={{ color: '#d32f2f', fontSize: 40, mr: 2 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </SvgIcon>
            <Typography id="conflict-modal-title" variant="h5" component="h2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
              {conflictModal.title}
            </Typography>
          </Box>

          {/* Main Message */}
          <Typography id="conflict-modal-description" sx={{ mb: 3, fontSize: '1rem', color: '#333' }}>
            {conflictModal.message}
          </Typography>

          {/* Conflict Details */}
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
                  <strong>"{conflict.schedule1}"</strong> and <strong>"{conflict.schedule2}"</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#666', ml: 2 }}>
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

          {/* Action Guidance */}
          <Typography sx={{ mb: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 1, fontSize: '0.95rem' }}>
            <strong>To resolve this issue:</strong> Please remove one of the conflicting schedules from this monitor, 
            or edit the schedules to use different days, times, or date ranges so they don't overlap.
          </Typography>

          {/* Close Button */}
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
              OK, I'll Fix This
            </Button>
          </Box>
        </Box>
      </Modal>
      {/* ==================== END CONFLICT MODAL ====================*/}
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