/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Box, Button, Container, Modal, Grid } from '@material-ui/core';
import PlaylistListResults from 'src/components/playlist/PlaylistListResults';
import PlaylistListToolbar from 'src/components/playlist/PlaylistListToolbar';
// import playlists from '../__mocks__/playlists';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant';

import {
  getUserComponentList,
  validateDeleteComponentList,
  deleteComponentList
} from '../store/action/user';
import { useNavigate } from 'react-router-dom';
import { Alert, Stack } from '@mui/material';

const PlaylistList = (props) => {
  const { component } = props || null;
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
          minHeight: '100%',
          py: 3
        }}
      >
        <Container maxWidth={false}>
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
            selectedPlaylist={selected}
          />

          <Box sx={{ pt: 3 }}>
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
