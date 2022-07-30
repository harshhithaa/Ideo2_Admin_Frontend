/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon
} from '@material-ui/core';
import { Search as SearchIcon, Trash2 as Trash2Icon } from 'react-feather';

const PlaylistToolbar = (props) => (
  <Box {...props}>
    {console.log('props in pl toolbar', props)}
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <Button
        sx={{ mx: 1 }}
        onClick={() => props.onclick()}
        disabled={props.selectedPlaylist.length === 0}
      >
        <SvgIcon fontSize="small" color="action">
          <Trash2Icon />
        </SvgIcon>
        Delete
      </Button>
      <Button color="primary" variant="contained" href="createplaylist">
        Add Playlist
      </Button>
    </Box>
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 500 }}>
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
              placeholder="Search Playlist"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  </Box>
);

export default PlaylistToolbar;
