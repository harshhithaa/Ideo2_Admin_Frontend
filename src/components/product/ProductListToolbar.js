import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  SvgIcon
} from '@material-ui/core';
import { Search as SearchIcon } from 'react-feather';
import { useNavigate } from 'react-router';

const ProductListToolbar = (props) => {
  const navigate = useNavigate();
  return (
    <Box {...props}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <Button sx={{ mx: 1 }}>Delete</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            navigate('/app/savemedia');
          }}
        >
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
};

export default ProductListToolbar;
