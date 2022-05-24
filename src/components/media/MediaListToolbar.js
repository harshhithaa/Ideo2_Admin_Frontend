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
import CustomizedMedia from '../customizedMedia/CustomizedMedia';

const MediaListToolbar = (props) => (
  <Box {...props}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <Button sx={{ mx: 1 }} onClick={() => props.onclick()}>
        <SvgIcon fontSize="small" color="action">
          <Trash2Icon />
        </SvgIcon>
        Delete
      </Button>
      <Button
        sx={{ mx: 1 }}
        color="primary"
        variant="contained"
        onClick={() => <CustomizedMedia />}
      >
        Create Media
      </Button>
      <Button color="primary" variant="contained" href="savemedia">
        Add Media
      </Button>
    </Box>
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ maxWidth: 500 }}>
            <TextField
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SvgIcon fontSize="small" color="action">
                      <SearchIcon />
                    </SvgIcon>
                  </InputAdornment>
                )
              }}
              placeholder="Search Media"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  </Box>
);

export default MediaListToolbar;
