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
  OutlinedInput,
  Tooltip
} from '@mui/material';
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

  // helper to show selected playlist name
  const selectedPlaylistName = props.playlistList?.find((p) => p.PlaylistRef === selectedPlaylist)?.Name || '';

  return (
    (() => {
      const { selectedItems, ...rest } = props;

      return (
        <Box {...rest}>
          <Snackbar
            open={openSnackbar}
            key={'error-snackbar'}
            autoHideDuration={5000}
            onClose={handleCloseSnackBar}
          >
            <Alert onClose={handleCloseSnackBar} severity="error">
              Something Went Wrong, Please Try Again
            </Alert>
          </Snackbar>

          <Snackbar
            open={openSuccessSnackbar}
            key={'success-snackbar'}
            autoHideDuration={5000}
            onClose={handleCloseSnackBar}
          >
            <Alert onClose={handleCloseSnackBar} severity="success">
              Successfully Pushed To Selected Monitors
            </Alert>
          </Snackbar>

          {/* Toolbar: single-row, no white Card background; matched spacing & sizes */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '100%',
              pr: 1,
              mt: 2,
              mb: 1
            }}
          >
            <TextField
              size="small"
              value={props.search || ''}
              onChange={(e) => props.onSearch && props.onSearch(e.target.value)}
              placeholder="Search Monitor"
              sx={{ width: 220, bgcolor: 'transparent', mr: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon fontSize="small" color="action">
                      <SearchIcon />
                    </SvgIcon>
                  </InputAdornment>
                )
              }}
              variant="outlined"
              aria-label="Search monitor"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* <Typography fontSize={16} sx={{ display: { xs: 'none', sm: 'block' } }}>
                Select Playlist:
              </Typography> */}

              <Select
                labelId="select-playlist"
                id="select-playlist"
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
                displayEmpty
                size="small"
                renderValue={(value) => {
                  if (!value) {
                    return <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.95rem' }}>SELECT DEFAULT PLAYLIST</span>;
                  }
                  return selectedPlaylistName;
                }}
                sx={{
                  height: 40,
                  minWidth: 220,
                  bgcolor: 'transparent',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    fontSize: '0.95rem'
                  }
                }}
                aria-label="Select default playlist"
              >
                {/* placeholder option for keyboard / accessibility */}
                <MenuItem value="">
                  <em>Select playlist</em>
                </MenuItem>
                {props.playlistList?.map((playlist) => (
                  <MenuItem key={playlist.PlaylistRef} value={playlist.PlaylistRef}>
                    {playlist.Name}
                  </MenuItem>
                ))}
              </Select>

              {/* Tooltip shown only when no monitors are selected */}
              {(!props.selectedMonitorList || props.selectedMonitorList.length === 0) ? (
                <Tooltip title="Select monitors and a default playlist" arrow>
                  <span>
                    <Button
                      onClick={() => { setModal(true); }}
                      color="primary"
                      variant="contained"
                      disabled={
                        selectedPlaylist === "" ||
                        !props.selectedMonitorList ||
                        props.selectedMonitorList.length === 0
                      }
                    >
                      Push To Monitors
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button
                  onClick={() => { setModal(true); }}
                  color="primary"
                  variant="contained"
                  disabled={selectedPlaylist === ""}
                >
                  Push To Monitors
                </Button>
              )}
            </Box>
          </Box>

          {/* Modal remains unchanged */}
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
                    Yes{" "}
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => setModal(false)}
                  >
                    No{" "}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Modal>
        </Box>
      );
    })()
  );
};

const mapDispatchToProps = (dispatch) => ({
  updateAllMonitors: (data, callback) =>
    dispatch(updateAllMonitors(data, callback))
});

export default connect(null, mapDispatchToProps)(MonitorListToolbar);
