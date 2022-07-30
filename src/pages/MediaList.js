/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Box,
  Container,
  Pagination,
  Button,
  Grid,
  Modal
} from '@material-ui/core';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant';
import MediaListToolbar from '../components/media/MediaListToolbar';
import MediaGrid from '../components/media/MediaGrid';
import {
  getUserComponentList,
  validateDeleteComponentList,
  deleteComponentList
} from '../store/action/user';
import { useNavigate } from 'react-router-dom';
import { Alert, Stack } from '@mui/material';

const MediaList = (props) => {
  const { media } = props || {};
  const [mediaItem, setMedia] = useState([]);
  const [loader, setLoader] = useState(false);
  const [selected, setselected] = useState([]);
  const [showmodal, setModal] = useState(false);
  const [showErrModal, setErrModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);

  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');

  const navigate = useNavigate();

  useEffect(() => {
    const data = {
      componenttype: COMPONENTS.Media
    };
    props.getUserComponentList(data, (err) => {
      if (err.exists) {
        console.log(err);
      } else {
        setMedia(media ? media.mediaList : []);
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
      ComponentType: COMPONENTS.Media,
      ComponentList: selected
    };
    // console.log('delete medialist selected:', selected);
    setModal(false);
    props.validateDeleteComponentList(deleteData, (err) => {
      if (err.exists) {
        console.log(err);
      } else {
        if (err.err === 'attached') {
          console.log(err.componentsAttached);
          // setPlaylists(err.playlistsAttached);
          err.componentsAttached.forEach((item) => {
            setPlaylists((prev) => [...prev, item.PlaylistName]);
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
              setboxMessage('Media Deleted Successfully!');
              setbox(true);
              setLoader(false);
            }
          });
        }
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Media | Ideogram</title>
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
                Cannot delete this media as it is running in{' '}
                {playlists.map((playlist) => playlist)} playlist
              </h4>
              <Grid container>
                <Grid item>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => (setErrModal(false), setPlaylists([]))}
                  >
                    Ok
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Modal>
          <MediaListToolbar
            selectedItems={selected}
            onclick={() => setModal(true)}
          />

          <MediaGrid media={mediaItem} setselected={setselected} />
        </Container>
      </Box>
    </>
  );
};

const mapStateToProps = ({ root = {} }) => {
  const media = root.user.components;
  return {
    media
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

export default connect(mapStateToProps, mapDispatchToProps)(MediaList);
