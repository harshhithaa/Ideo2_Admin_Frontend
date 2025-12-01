/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { Box, Container, Button, Modal, Grid } from '@mui/material';
import ScheduleListResults from 'src/components/schedule/ScheduleListResults';
import ScheduleListToolbar from 'src/components/schedule/ScheduleListToolbar';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant.jsx';
import {
  getUserComponentList,
  validateDeleteComponentList,
  deleteComponentList
} from '../store/action/user';
import { useNavigate } from 'react-router-dom';
import { Alert, Stack } from '@mui/material';

const ScheduleList = (props) => {
  const { schedule } = props || {};
  const [scheduleItem, setSchedules] = useState([]);
  const [loader, setLoader] = useState(false);
  const [selected, setselected] = useState([]);
  const [showmodal, setModal] = useState(false);
  const [showErrModal, setErrModal] = useState(false);
  const [search, setsearch] = useState('');
  const [monitor, setMonitor] = useState([]);

  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');

  let navigate = useNavigate();
  
  useEffect(() => {
    const data = {
      componenttype: COMPONENTS.Schedule
    };
    props.getUserComponentList(data, (err) => {
      if (err.exists) {
        console.log(err);
      } else {
        setSchedules(schedule ? schedule.scheduleList : []);
        setLoader(true);
      }
    });
  }, [loader]);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
  };

  const deleteComponent = () => {
    const deleteData = {
      ComponentType: COMPONENTS.Schedule,
      ComponentList: selected
    };

    console.log('selected', selected);
    setModal(false);
    props.validateDeleteComponentList(deleteData, (err) => {
      if (err.exists) {
        console.log(err);
      } else {
        if (err.err === 'attached') {
          console.log(err.componentsAttached);
          err.componentsAttached.forEach((item) => {
            setMonitor((prev) => [...prev, item.MonitorName]);
          });
          setErrModal(true);
        } else {
          props.deleteComponentList(deleteData, (err) => {
            if (err.exists) {
              setcolor('error');
              setboxMessage(err.err);
              setbox(true);
              console.log(err.errmessage);
            } else {
              // Immediately remove deleted items from UI
              setSchedules((prevSchedules) => {
                return prevSchedules.filter((schedule) => {
                  const scheduleId = schedule.Id || schedule.id || schedule.ScheduleId;
                  return !selected.includes(scheduleId);
                });
              });

              // Clear selection after deletion
              setselected([]);

              // Show success message
              setcolor('success');
              setboxMessage('Schedule Deleted Successfully!');
              setbox(true);

              // Auto-hide success message after 3 seconds
              setTimeout(() => {
                setbox(false);
              }, 3000);
            }
          });
        }
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Schedules | Ideogram</title>
      </Helmet>
      {box ? (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert severity={color}>{boxMessage}</Alert>
        </Stack>
      ) : null}
      <Box
        sx={{
          backgroundColor: 'background.default',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          py: 3,
          boxSizing: 'border-box'
        }}
      >
        <Container maxWidth={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
           <Modal
             open={showmodal}
             onClose={() => setModal(false)}
             aria-labelledby="modal-modal-title"
             aria-describedby="modal-modal-description"
           >
             <Box sx={style}>
               <h4 id="parent-modal-title" style={{ marginBottom: 20 }}>
                 Are you sure you want to delete?
               </h4>
               <Grid container spacing={2}>
                 <Grid item>
                   <Button
                     variant="contained"
                     color="success"
                     onClick={() => deleteComponent()}
                   >
                     Yes{' '}
                   </Button>
                 </Grid>
                 <Grid item>
                   <Button
                     variant="contained"
                     color="error"
                     onClick={() => setModal(false)}
                   >
                     No{' '}
                   </Button>
                 </Grid>
               </Grid>
             </Box>
           </Modal>
           <Modal
             open={showErrModal}
             onClose={() => setErrModal(false)}
             aria-labelledby="modal-modal-title"
             aria-describedby="modal-modal-description"
           >
             <Box sx={style}>
               <h4 id="parent-modal-title" style={{ marginBottom: 20 }}>
                 Cannot delete this Schedule as it is running in{' '}
                 {monitor.map((monitor) => monitor)} monitor
               </h4>
               <Grid container>
                 <Grid item>
                   <Button
                     variant="contained"
                     color="success"
                     onClick={() => (setErrModal(false), setMonitor([]))}
                   >
                     Ok
                   </Button>
                 </Grid>
               </Grid>
             </Box>
           </Modal>
          <ScheduleListToolbar
            onsearch={(e) => setsearch(e)}
            search={search}
            onclick={() => setModal(true)}
            selectedSchedules={selected}
          />

          <Box sx={{ pt: 3, flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
            <ScheduleListResults
              Schedules={scheduleItem}
              setselected={setselected}
              search={search}
              view={(e) =>
                navigate('/app/saveschedule', { state: { ...e, type: 'View' } })
              }
              editcall={(e) =>
                navigate('/app/saveschedule', { state: { ...e, type: 'Edit' } })
              }
            />
          </Box>
         </Container>
       </Box>
     </>
   );
 };

const mapStateToProps = ({ root = {} }) => {
  const schedule = root.user.components;
  return {
    schedule
  };
 };

const mapDispatchToProps = (dispatch) => ({
  getUserComponentList: (data, callback) =>
    dispatch(getUserComponentList(data, callback)),
  validateDeleteComponentList: (data, callback) =>
    dispatch(validateDeleteComponentList(data, callback)),
  deleteComponentList: (data, callback) =>
    dispatch(deleteComponentList(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(ScheduleList);
