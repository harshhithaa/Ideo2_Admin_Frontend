/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stack,
  Typography,
  Snackbar,
  Alert,
  Modal,
  Grid,
  OutlinedInput
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import { Search as SearchIcon, Trash2 as Trash2Icon } from 'react-feather';
import { connect } from 'react-redux';
import { updateAllMonitors } from '../../store/action/user';

const MonitorListToolbar = (props) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [showmodal, setModal] = useState(false);

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: window.innerWidth < 500 ? 350 : 500,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
  };

  const handleCloseSnackBar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
    setOpenSuccessSnackbar(false);
  };

  const handlePushToAll = () => {
    const data = {
      MonitorList: props.selectedMonitorList,
      PlaylistRef: selectedPlaylist
    };

    props.updateAllMonitors(data, (callback) => {
      if (!callback.Error) {
        setOpenSuccessSnackbar(true);
        setModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setModal(false);
      }
    });
  };

  return (
    <Box {...props}>
      <Snackbar
        open={openSnackbar}
        key={'top'}
        autoHideDuration={5000}
        onClose={handleCloseSnackBar}
      >
        <Alert onClose={handleCloseSnackBar} severity="error">
          Something Went Wrong, Please Try Again
        </Alert>
      </Snackbar>
      <Snackbar
        open={openSuccessSnackbar}
        key={'top'}
        autoHideDuration={5000}
        onClose={handleCloseSnackBar}
      >
        <Alert onClose={handleCloseSnackBar} severity="success">
          Successfully Pushed To Selected Monitors
        </Alert>
      </Snackbar>
      <Box sx={{ mt: 3 }}>
        <Modal
          open={showmodal}
          onClose={() => setModal(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <h4 id="parent-modal-title" style={{ marginBottom: 20 }}>
              Are you sure you want to Push to the Selected Monitors?
            </h4>
            <Grid container spacing={2}>
              <Grid item>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handlePushToAll()}
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
        <Card>
          <CardContent>
            {/* <Box display="flex" justifyContent="space-between"> */}
            <Grid
              container
              justifyContent={'space-between'}
              columnGap={2}
              alignItems="center"
            >
              <Grid item md={4} lg={4} sx={{ marginBottom: 2 }}>
                <TextField
                  fullWidth
                  onChange={(e) => props.onsearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SvgIcon fontSize="small" color="action">
                          <SearchIcon />
                        </SvgIcon>
                      </InputAdornment>
                    )
                  }}
                  placeholder="Search Monitor"
                  variant="outlined"
                />
              </Grid>
              <Grid item container md={6} lg={6} alignItems={'center'} gap={2}>
                <Typography fontSize={16}>Select Playlist:</Typography>
                <Select
                  labelId="select-playlist"
                  id="select-playlist"
                  value={selectedPlaylist}
                  label="Select Playlist"
                  // input={<OutlinedInput sx={{ fontSize: 10 }} label="Tag" />}
                  onChange={(e) => {
                    console.log('e.target.value', e.target.value);
                    setSelectedPlaylist(e.target.value);
                  }}
                  sx={{ height: 40 }}
                  autoWidth
                >
                  {props.playlistList?.map((playlist) => (
                    <MenuItem value={playlist.PlaylistRef}>
                      {playlist.Name}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  onClick={() => {
                    setModal(true);
                  }}
                  color="primary"
                  variant="contained"
                  disabled={
                    selectedPlaylist == '' ||
                    props.selectedMonitorList.length == 0
                  }
                >
                  Push To Monitors
                </Button>
              </Grid>
            </Grid>
            {/* </Box> */}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

const mapDispatchToProps = (dispatch) => ({
  updateAllMonitors: (data, callback) =>
    dispatch(updateAllMonitors(data, callback))
});

export default connect(null, mapDispatchToProps)(MonitorListToolbar);
