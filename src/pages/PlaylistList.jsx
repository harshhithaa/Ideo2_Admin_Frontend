/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

import { Box, Button, Container, Modal, Grid } from '@mui/material';
import PlaylistListResults from 'src/components/playlist/PlaylistListResults';
import PlaylistListToolbar from 'src/components/playlist/PlaylistListToolbar';
// import playlists from '../__mocks__/playlists';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant.jsx';

import {
  getUserComponentList,
  validateDeleteComponentList,
  deleteComponentList
} from '../store/action/user';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, Stack } from '@mui/material';

const PlaylistList = (props) => {
  const { component } = props || null;
  const location = useLocation();
  const [playlists, setplaylists] = useState([]);
  const [loader, setloader] = useState(false);
  const [selected, setselected] = useState([]);
  const [showmodal, setModal] = useState(false);
  const [showErrModal, setErrModal] = useState(false);
  const [search, setsearch] = useState('');
  const [schedule, setSchedules] = useState([]);
  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');

  // Show flash message when navigated here after creating a playlist
  useEffect(() => {
    if (location && location.state && location.state.flashMessage) {
      setcolor('success');
      setboxMessage(location.state.flashMessage);
      setbox(true);
    }
  }, [location]);

  // Auto-dismiss the top-center popup after 2 seconds
  useEffect(() => {
    if (!box) return undefined;
    const t = setTimeout(() => setbox(false), 2000);
    return () => clearTimeout(t);
  }, [box]);
  
  console.log('props', selected);
  let navigate = useNavigate();
  useEffect(() => {
    const data = {
      componenttype: COMPONENTS.Playlist
    };
    props.getUserComponentList(data, (err) => {
      if (err.exists) {
        console.log(err.errmessage);
      } else {
        setplaylists(component ? component.playlistList : []);
        setloader(true);
      }
    });
  }, [loader]);
  const style = {
    // show popup at top center
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 500,
    maxWidth: '90%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    zIndex: 1400
  };

  const deleteplaylist = () => {
    setModal(false);

    const deleteData = {
      ComponentType: COMPONENTS.Playlist,
      ComponentList: selected
    };

    console.log('selected', selected);
    props.validateDeleteComponentList(deleteData, (err) => {
      if (err.exists) {
        console.log(err);
      } else {
        if (err.err === 'attached') {
          console.log(err.componentsAttached);
          err.componentsAttached.forEach((item) => {
            setSchedules((prev) => [...prev, item.ScheduleName]);
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
              setcolor('success');
              setboxMessage('Playlist Deleted Successfully!');
              setbox(true);
              setloader(false);
            }
          });
        }
      }
    });
  };
  return (
    <>
      <Helmet>
        <title>Playlists | Ideogram</title>
      </Helmet>
      {box ? (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert severity={color}>{boxMessage}</Alert>
        </Stack>
      ) : null}
      <Box
        sx={{
          backgroundColor: 'background.default',
          height: '100%',                 // fill available layout height
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
                     onClick={() => deleteplaylist()}
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
                 Cannot delete this playlist as it running in{' '}
                 {schedule.map((schedule) => schedule)} schedule
               </h4>
               <Grid container spacing={1}>
                 <Grid item>
                   <Button
                     variant="contained"
                     color="success"
                     onClick={() => (setErrModal(false), setSchedules([]))}
                   >
                     Ok
                   </Button>
                 </Grid>
               </Grid>
             </Box>
           </Modal>
          <PlaylistListToolbar
            onclick={() => setModal(true)}
            onsearch={(e) => setsearch(e)}
            search={search}
            selectedPlaylist={selected}
          />

          {/* results area — internal scroll only */}
          <Box sx={{ pt: 3, flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
            <PlaylistListResults
              search={search}
              playlists={playlists}
              setselected={setselected}
              view={(e) =>
                navigate('/app/createplaylist', {
                  state: { ...e, type: 'View' }
                })
              }
              editcall={(e) =>
                navigate('/app/createplaylist', {
                  state: { ...e, type: 'Edit' }
                })
              }
            />
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
  validateDeleteComponentList: (data, callback) =>
    dispatch(validateDeleteComponentList(data, callback)),
  deleteComponentList: (data, callback) =>
    dispatch(deleteComponentList(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(PlaylistList);
