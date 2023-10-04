/* eslint-disable linebreak-style */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-sequences */
/* eslint-disable react/prop-types */
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import * as Yup from 'yup';
import { Formik } from 'formik';
import React, { useState, useEffect } from 'react';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant';
import { IsValuePresentInArray } from 'src/utils/helperFunctions';
import CardMedia from '@mui/material/CardMedia';
import { Alert, Stack } from '@mui/material';

import {
  Box,
  Button,
  Container,
  TextField,
  Typography
} from '@material-ui/core';
import { getUserComponentList, savePlaylist } from '../store/action/user';
import { TryOutlined } from '@material-ui/icons';

const CreatePlaylist = (props) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [type, settype] = useState(
    state && state.type == 'View'
      ? 'View'
      : state && state.type == 'Edit'
      ? 'Update'
      : 'Create'
  );

  const { component } = props || null;
  const [title, setTitle] = useState((state && state.Name) || '');
  const [description, setDescription] = useState(
    (state && state.Description) || ''
  );
  const [media, setMedia] = useState([]);
  const [id, setId] = useState((state && state.PlaylistRef) || '');

  const [loader, setloader] = useState(false);
  const [priority, setpriority] = useState(0);
  const [mediaData, setMediaData] = useState([]);
  const [playlistMedia, setplaylistMedia] = useState([]);
  const [deletedplaylistMedia, setdeletedplaylistMedia] = useState([]);

  let [box, setbox] = useState(false);
  let [boxMessage, setboxMessage] = useState('');
  let [color, setcolor] = useState('success');
  console.log(playlistMedia, 'playlistMedia');
  console.log(deletedplaylistMedia, 'deletedplaylistMedia');
  useEffect(() => {
    const data = {
      componenttype: COMPONENTS.Media
    };

    props.getUserComponentList(data, (err) => {
      if (err.exists) {
        console.log('err.errmessage', err.errmessage);
      } else {
        setMedia(component ? component.mediaList : []);
        setloader(true);
      }
    });
    setMediaData(media);
    let prevlist = [];

    state &&
      state.Media &&
      state.Media.map((items) => {
        if (items.IsActive == 1)
          prevlist.push({
            MediaRef: items.MediaRef,
            IsActive: 1
          });
      });
    setplaylistMedia(prevlist);
    //  console.log('outside', data);
    console.log('props', prevlist);
  }, [loader]);

  function handleSelectPlaylist(item) {
    if (
      IsValuePresentInArray(playlistMedia, 'MediaRef', item.MediaRef) === false
    ) {
      setplaylistMedia((prev) => [
        ...prev,
        { MediaRef: item.MediaRef, IsActive: 1 }
      ]);

      let deletedarr = deletedplaylistMedia.filter(
        (list) => list.MediaRef !== item.MediaRef
      );

      setdeletedplaylistMedia((prev) => [...deletedarr]);

      setpriority(priority + 1);
    } else {
      setdeletedplaylistMedia((prev) => [
        ...prev,
        { MediaRef: item.MediaRef, IsActive: 0 }
      ]);

      let updatedar = playlistMedia.filter(
        (list) => list.MediaRef !== item.MediaRef
      );
      setplaylistMedia((prev) => [...updatedar]);

      //     console.log('playlistMedia', playlistMedia);
    }
  }

  function handlePriority(mediaRef) {
    var priorityIndex =
      playlistMedia.findIndex((i) => i.MediaRef === mediaRef) + 1;

    if (priorityIndex > 0) {
      return priorityIndex;
    } else return '';
  }

  function savePlaylistDetails() {
    const savePlaylistData = {
      PlaylistName: title,
      Description: description,
      Playlist: [...playlistMedia, ...deletedplaylistMedia],
      IsActive: 1
    };
    if (id !== '') savePlaylistData.PlaylistRef = id;
    window.scrollTo(0, 0);
    props.savePlaylist(savePlaylistData, (err) => {
      if (err.exists) {
        console.log('err', err);

        setcolor('error');
        setboxMessage(err.errmessage);
        setbox(true);
      } else {
        navigate('/app/playlists', { replace: true });
        // setloader(!loader);
      }
    });
  }

  return (
    <>
      <Helmet>
        <title>Create Playlist | Ideogram</title>
      </Helmet>
      {box ? (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert severity={color}>{boxMessage}</Alert>
        </Stack>
      ) : null}
      <Box
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="md">
          <Formik
            initialValues={{
              title: title,
              description: description
            }}
          >
            {({ errors, handleBlur, handleSubmit, touched }) => (
              <form onSubmit={handleSubmit}>
                <Box sx={{ mt: 15 }}>
                  <Typography color="textPrimary" variant="h2">
                    {type} Playlist
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
                <Box sx={{ py: 2 }}>
                  <ImageList
                    sx={{
                      width: '100%',
                      height: 450,
                      // Promote the list into its own layer in Chrome. This costs memory, but helps keeping high FPS.
                      transform: 'translateZ(0)'
                    }}
                    rowHeight={200}
                    cols={window.innerWidth < 400 ? 2 : 4}
                    gap={1}
                  >
                    {media &&
                      media.map((item) => (
                        <Button
                          onClick={async () => {
                            handleSelectPlaylist(item);
                          }}
                        >
                          <ImageListItem key={item.MediaPath} cols={1} rows={1}>
                            <CardMedia
                              sx={{
                                height: 200,
                                display: 'block',
                                maxWidth: 400,
                                overflow: 'hidden',
                                width: '100%'
                              }}
                              component={
                                item.MediaType === 'image'
                                  ? 'img'
                                  : item.MediaType
                              }
                              height="400"
                              src={item.MediaPath}
                              alt={item.label}
                              controls
                            />

                            <ImageListItemBar
                              sx={{
                                background:
                                  IsValuePresentInArray(
                                    playlistMedia,
                                    'MediaRef',
                                    item.MediaRef
                                  ) === false
                                    ? 'red'
                                    : 'blue'
                              }}
                              title={item.MediaName}
                              position="top"
                              actionPosition="left"
                            />
                            <ImageListItemBar
                              sx={{
                                opacity:
                                  IsValuePresentInArray(
                                    playlistMedia,
                                    'MediaRef',
                                    item.MediaRef
                                  ) === false
                                    ? '50%'
                                    : '100%',
                                background: 'black'
                              }}
                              title={handlePriority(item.MediaRef)}
                              position="bottom"
                              actionPosition="left"
                            />
                          </ImageListItem>
                          {IsValuePresentInArray(
                            playlistMedia,
                            'MediaRef',
                            item.MediaRef
                          ) === false
                            ? ''
                            : ''}
                        </Button>
                      ))}
                  </ImageList>
                </Box>
                <Box sx={{ py: 2 }}>
                  <Button
                    color="primary"
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    onClick={() => {
                      savePlaylistDetails();
                    }}
                  >
                    {type} Playlist
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
  savePlaylist: (data, callback) => dispatch(savePlaylist(data, callback))
});
export default connect(mapStateToProps, mapDispatchToProps)(CreatePlaylist);
