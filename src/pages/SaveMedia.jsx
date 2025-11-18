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
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

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
    setShowProgressBar(true);
    setUploadComplete(false);

    props.saveMedia(formdata, (err, progressEvent) => {
      // ✅ FIX: Handle progress updates
      if (progressEvent) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percent);
        console.log('Upload progress:', percent + '%');

        // ✅ KEY FIX: When progress reaches 100%, show success immediately
        if (percent === 100) {
          setUploadComplete(true);
          setDisable(false);
          setFiles([]);
          setcolor('success');
          setboxMessage('Media Successfully added!');
          setOpenSuccessSnackbar(true);
          setbox(true);
          setSuccess(true);

          // ✅ Hide progress bar after 1 second
          setTimeout(() => {
            setShowProgressBar(false);
            setUploadProgress(0);
            setUploadComplete(false);
          }, 1000);
        }
        return;
      }

      // ✅ Handle error from API (if upload fails before reaching 100%)
      if (err?.exists) {
        setFiles([]);
        setcolor('error');
        setboxMessage(err.err || 'Upload failed');
        setbox(true);
        setDisable(false);
        setSuccess(false);
        setShowProgressBar(false);
        setUploadProgress(0);
      }

      setDisableButton(true);
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

          {/* ✅ FIXED PROGRESS BAR - Shows success immediately at 100% */}
          {showProgressBar && (
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
                sx={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  transition: 'all 0.3s ease-in-out',
                  backgroundColor: uploadProgress === 100 ? '#e8f5e9' : '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: uploadProgress === 100 ? '#4caf50' : '#2196f3',
                    transition: 'background-color 0.3s ease-in-out'
                  }
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: uploadProgress === 100 ? '#4caf50' : '#2196f3',
                  fontWeight: uploadProgress === 100 ? 700 : 400,
                  fontSize: uploadProgress === 100 ? '1rem' : '0.875rem',
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                {uploadProgress}% {uploadProgress === 100 ? '✓ Complete' : 'Uploading'}
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
          disabled={disableButton || disable || uploadComplete}
        >
          {uploadComplete ? 'Upload Complete' : 'Upload Media'}
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
