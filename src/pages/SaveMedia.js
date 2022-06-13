/* eslint-disable no-undef */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/prop-types */
/* eslint-enable no-alert, no-console */

import { Helmet } from 'react-helmet';
import React, { useMemo, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Box, CircularProgress } from '@material-ui/core';
import { connect } from 'react-redux';
import { saveMedia } from '../store/action/user';
import { Alert, Stack } from '@mui/material';
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
  // let navigate =useNavigate()
  const [files, setFiles] = useState([]);
  const [disable, setDisable] = useState(false);
  let [box, setbox] = useState(false);
  let [boxMessage, setboxMessage] = useState('');
  let [color, setcolor] = useState('success');
  const [disableButton, setDisableButton] = useState(true);
  const [compressedFile, setCompressedFile] = useState(null);
  // const [inactive, setinactive] = useState(false);

  const options = {
    maxSizeMB: 1,
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
  console.log(props);

  useEffect(
    () => () => {
      // Make sure to revoke the data uris to avoid memory leaks
      files.forEach((file) => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

  useEffect(() => {
    files.map((file) => {
      if (file.type.split('/')[0] === 'image') {
        imageCompression(file, options).then((compressedFile) => {
          var newFile = new File([compressedFile], compressedFile.name, {
            type: 'image/jpeg'
          });
          setCompressedFile(newFile);
          setDisableButton(false);
        });
      } else if (file.type.split('/')[0] === 'video') {
        setDisableButton(false);
      }
    });
  }, [files]);

  function saveMediaData() {
    console.log('running saveMediaData');

    const formdata = new FormData();

    files.forEach((i) => {
      console.log(i);
      if (i.type.split('/')[0] === 'image') {
        formdata.append('Media', compressedFile);
      } else if (i.type.split('/')[0] === 'video') {
        formdata.append('Media', i);
      }
    });

    setDisable(true);
    props.saveMedia(formdata, (err) => {
      console.log('err', err);
      if (err.exists) {
        setcolor('error');
        setboxMessage(err.err);
        setbox(true);
        setDisable(false);
      } else {
        setDisable(false);
        setFiles([]);
        // navigate('/app/media', { replace: true });
        console.log('Success');
        setcolor('success');
        setboxMessage('Media Successfully added!');
        setbox(true);
      }
      setDisableButton(true);
    });
  }

  return (
    <div className="container">
      <Helmet>
        <title>Add Media | Ideogram</title>
      </Helmet>
      {box ? (
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Alert severity={color}>{boxMessage}</Alert>
        </Stack>
      ) : null}
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p>Drag and Drop your media here, or click to select</p>
        <section className="container">
          <aside style={thumbsContainer}>{thumbs}</aside>
        </section>
      </div>

      <Box sx={{ py: 1, ml: 80 }}>{disable && <CircularProgress />}</Box>
      <Box sx={{ py: 1, ml: 70 }}>
        <Button
          color="primary"
          size="large"
          type="submit"
          variant="contained"
          onClick={() => {
            saveMediaData();
          }}
          disabled={disableButton}
        >
          Upload Media
        </Button>
      </Box>
    </div>
  );
}

<StyledDropzone />;

const mapStateToProps = ({ root = {} }) => {
  const component = root.user.components;

  return {
    component
  };
};
const mapDispatchToProps = (dispatch) => ({
  saveMedia: (data, callback) => dispatch(saveMedia(data, callback))
});
export default connect(mapStateToProps, mapDispatchToProps)(StyledDropzone);
