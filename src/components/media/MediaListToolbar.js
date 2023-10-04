import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon,
  Grid
} from '@material-ui/core';
import { Search as SearchIcon, Trash2 as Trash2Icon } from 'react-feather';
import { useNavigate } from 'react-router';

const MediaListToolbar = (props) => {
  const navigate = useNavigate();
  return (
    <Box {...props}>
      <Grid
        sx={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}
        container
        lg={12}
        md={10}
        sm={2}
      >
        <Button
          sx={{ mx: 1 }}
          onClick={() => props.onclick()}
          disabled={props.selectedItems.length === 0}
        >
          <SvgIcon fontSize="small" color="action">
            <Trash2Icon />
          </SvgIcon>
          Delete
        </Button>
        <Grid>
          <Button color="primary" variant="contained" href="savemedia">
            Add Media
          </Button>
          <Button
            sx={{ mx: 1 }}
            color="primary"
            variant="contained"
            href="createmedia"
          >
            Create Media
          </Button>
          <Button
            sx={{ mt: window.innerWidth < 400 ? 1 : 0, mx: 1 }}
            color="primary"
            variant="contained"
            href="splitmedia"
          >
            Create Split Screen
          </Button>
        </Grid>
      </Grid>
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
};

export default MediaListToolbar;
