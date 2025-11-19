/* eslint-disable no-undef */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/prop-types */
/* eslint-enable no-alert, no-console */

import { Helmet } from 'react-helmet-async';
import React, { useMemo, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Grid,
  LinearProgress,
  Typography
} from '@mui/material';
import { connect } from 'react-redux';
import { saveMedia } from '../store/action/user';
import { Alert } from '@mui/material';
import imageCompression from 'browser-image-compression';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '100px',
  margin: '100px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#ffffff',
  color: '#bdbdbd',
  outline: 'double',
  transition: 'border .24s ease-in-out'
};

const activeStyle = {
  borderColor: '#2196f3'
};

const acceptStyle = {
  borderColor: '#00e676'
};

const rejectStyle = {
  borderColor: '#ff1744'
};

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 16
};

const thumb = {
  display: 'inline-flex',
  borderRadius: 2,
  border: '1px solid #eaeaea',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box'
};

const thumbInner = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden'
};

const img = {
  display: 'block',
  width: 'auto',
  height: '100%'
};

function StyledDropzone(props) {
  const [files, setFiles] = useState([]);
  const [disable, setDisable] = useState(false);
  const [box, setbox] = useState(false);
  const [boxMessage, setboxMessage] = useState('');
  const [color, setcolor] = useState('success');
  const [disableButton, setDisableButton] = useState(true);
  const [compressedFile, setCompressedFile] = useState(null);
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [success, setSuccess] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

  // New flag to avoid double showing success when we already showed at 100%
  const [isUploadCompletedLocally, setIsUploadCompletedLocally] = useState(false);

  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    accept: 'image/*, video/*',
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file)
          })
        )
      );
      setDisableButton(false);
    }
  });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }),
    [isDragActive, isDragReject, isDragAccept]
  );

  const thumbs = files.map((file) => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img src={file.preview} style={img} />
      </div>
    </div>
  ));

  useEffect(
    () => () => {
      // Make sure to revoke the data uris to avoid memory leaks
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

  function saveMediaData() {
    console.log('running saveMediaData');

    if (files.length === 0) {
      setboxMessage('Please select at least one file');
      setcolor('error');
      setbox(true);
      return;
    }

    const formdata = new FormData();

    files.forEach((i) => {
      console.log(i);
      formdata.append('Media', i);
    });

    setDisable(true);
    setUploadProgress(0);
    setIsUploadCompletedLocally(false);

    props.saveMedia(formdata, (err, progressEvent) => {
      // Progress update from axios
      if (progressEvent) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);

        // If we reach 100% of upload, show success immediately (no time gap)
        if (percent === 100 && !isUploadCompletedLocally) {
          setIsUploadCompletedLocally(true);
          setDisable(false);
          setFiles([]);
          setcolor('success');
          setboxMessage('Media Uploaded Successfully');
          setOpenSuccessSnackbar(true);
          setbox(true);
          setSuccess(true);
          setDisableButton(true);
          // keep uploadProgress at 100 until server finalizes
        }

        return; // don't process success/error here
      }

      // No progressEvent: final callback (success or error)
      // Reset or handle errors depending on whether we already showed success
      setUploadProgress(0);

      if (err?.exists) {
        // server-side error
        setFiles([]);
        setcolor('error');
        setboxMessage(err.err || 'Upload failed');
        setbox(true);
        setDisable(false);
        setSuccess(false);
        setIsUploadCompletedLocally(false);
      } else {
        // success from server
        if (!isUploadCompletedLocally) {
          // if we didn't already show immediate success, show now
          setDisable(false);
          setFiles([]);
          setcolor('success');
          setboxMessage('Media Successfully added!');
          setOpenSuccessSnackbar(true);
          setbox(true);
          setSuccess(true);
          setDisableButton(true);
        }
        // reset local flag
        setIsUploadCompletedLocally(false);
      }
    });
  }

  const handleCloseSnackBar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSuccessSnackbar(false);
  };

  return (
    <Grid container direction="column">
      <Helmet>
        <title>Add Media | Ideogram</title>
      </Helmet>

      <Snackbar
        open={openSuccessSnackbar}
        key="top"
        autoHideDuration={5000}
        onClose={handleCloseSnackBar}
      >
        {!success ? (
          <Alert onClose={handleCloseSnackBar} severity="error">
            Something Went Wrong Please Try Again
          </Alert>
        ) : (
          <Alert onClose={handleCloseSnackBar} severity="success">
            Media Uploaded Successfully
          </Alert>
        )}
      </Snackbar>

      <Grid md={10} lg={12}>
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />

          {/* PROGRESS BAR — centered inside the white box */}
          {disable && (
            <Box
              sx={{
                width: '60%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                my: 3
              }}
            >
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ width: '100%', height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" sx={{ mt: 1, color: '#2196f3' }}>
                {uploadProgress}% Uploaded
              </Typography>
            </Box>
          )}

          <p>Drag and Drop your media here, or click to select</p>

          <section className="container">
            <aside style={thumbsContainer}>{thumbs}</aside>
          </section>
        </div>
      </Grid>

      <Grid sx={{ py: 1 }} alignSelf="center">
        <Button
          color="primary"
          size="large"
          type="submit"
          variant="contained"
          onClick={() => {
            saveMediaData();
          }}
          disabled={disableButton || disable}
        >
          Upload Media
        </Button>
      </Grid>
    </Grid>
  );
}

const mapStateToProps = ({ root = {} }) => {
  const component = root.user?.components;

  return {
    component
  };
};

const mapDispatchToProps = (dispatch) => ({
  saveMedia: (data, callback) => dispatch(saveMedia(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(StyledDropzone);
