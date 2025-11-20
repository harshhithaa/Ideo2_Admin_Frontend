/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Container,
  Button,
  Grid,
  Modal
} from '@mui/material';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant.jsx';
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
  const [selected, setselected] = useState([]);
  const [showmodal, setModal] = useState(false);
  const [showErrModal, setErrModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // new

  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');

  const navigate = useNavigate();

  // ✅ UPDATE mediaItem whenever Redux media changes
  useEffect(() => {
    if (media?.mediaList && Array.isArray(media.mediaList)) {
      setMedia(media.mediaList);
      console.log('Media updated from Redux:', media.mediaList.length, 'items');
    }
  }, [media?.mediaList]);

  // filtered media according to search query (keeps categories intact in MediaGrid)
  const filteredMedia = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') return mediaItem;
    const q = searchQuery.toLowerCase();
    return mediaItem.filter((m) => (m?.MediaName || '').toLowerCase().includes(q));
  }, [mediaItem, searchQuery]);

  // ✅ Initial fetch
  useEffect(() => {
    fetchMediaList();
  }, []);

  const fetchMediaList = () => {
    const data = { componenttype: COMPONENTS.Media };
    props.getUserComponentList(data, (err) => {
      if (err?.exists) {
        console.log(err);
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    });
  };

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

    setModal(false);

    props.validateDeleteComponentList(deleteData, (err) => {
      if (err?.exists) {
        console.log('Validation error:', err);
        setcolor('error');
        setboxMessage('Validation error occurred');
        setbox(true);
        return;
      }

      if (err?.err === 'attached') {
        console.log('Media attached to playlists');
        setPlaylists([]);
        err.componentsAttached.forEach((item) => {
          setPlaylists((prev) => [...prev, item.PlaylistName]);
        });
        setErrModal(true);
        return;
      }

      props.deleteComponentList(deleteData, (delErr) => {
        if (delErr?.exists) {
          setcolor('error');
          setboxMessage(delErr.err || delErr.errmessage || 'Delete failed');
          setbox(true);
          console.log('Delete error:', delErr);
        } else {
          setcolor('success');
          setboxMessage('Media Deleted Successfully!');
          setbox(true);
          setselected([]);

          // ✅ Refresh media list after deletion
          fetchMediaList();
        }
      });
    });
  };

  return (
    <>
      <Helmet>
        <title>Media | Ideogram</title>
      </Helmet>

      {box && (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert 
            severity={color}
            onClose={() => setbox(false)}
          >
            {boxMessage}
          </Alert>
        </Stack>
      )}

      <Box
        sx={{
          backgroundColor: 'background.default',
          height: '100vh',          // take full viewport height so only inner grid scrolls
          overflow: 'hidden',       // prevent outer scrollbar
          py: 3
        }}
      >
        <Container maxWidth={false}>
          <Modal
            open={showmodal}
            onClose={() => setModal(false)}
          >
            <Box sx={style}>
              <h4 style={{ marginBottom: 20 }}>
                Are you sure you want to delete {selected.length} item(s)?
              </h4>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => deleteComponent()}
                  >
                    Yes
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => setModal(false)}
                  >
                    No
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Modal>

          <Modal
            open={showErrModal}
            onClose={() => setErrModal(false)}
          >
            <Box sx={style}>
              <h4 style={{ marginBottom: 20 }}>
                Cannot delete this media as it is running in these playlists:
              </h4>
              <ul style={{ marginBottom: 20 }}>
                {playlists.map((playlist, index) => (
                  <li key={index}>{playlist}</li>
                ))}
              </ul>
              <Grid container>
                <Grid item>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => {
                      setErrModal(false);
                      setPlaylists([]);
                    }}
                  >
                    Ok
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Modal>

          {/* make the toolbar sticky so top buttons/search don't scroll away */}
          <Box sx={{ position: 'sticky', top: 12, zIndex: 1200, backgroundColor: 'background.default', pb: 1 }}>
            <MediaListToolbar
              media={mediaItem}            // <-- keep full media for any toolbar needs
              query={searchQuery}
              onQueryChange={setSearchQuery}
              selectedItems={selected}
              onClick={() => setModal(true)}
            />
          </Box>

          <MediaGrid media={mediaItem} setselected={setselected} query={searchQuery} />
         </Container>
       </Box>
     </>
   );
 };

const mapStateToProps = ({ root = {} }) => {
  const media = root.user?.components;
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
