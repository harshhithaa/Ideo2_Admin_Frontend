import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Typography
} from '@material-ui/core';
import {
  PlayCircle as PlayCircleIcon,
} from 'react-feather';
import { orange } from '@material-ui/core/colors';
import { useNavigate } from 'react-router-dom';

const Monitor = (props) => {

  const navigate = useNavigate();

  return(
  <Card
    sx={{ height: '100%', cursor: "pointer" }}
    {...props}
    onClick={()=>{navigate('/app/playlists')}}
  >
    <CardContent>
      <Grid
        container
        spacing={3}
        sx={{ justifyContent: 'space-between' }}
      >
        <Grid item>
          <Typography
            color="textSecondary"
            gutterBottom
            variant="h4"
          >
            PLAYLIST
          </Typography>
        </Grid>
        <Grid item>
          <Avatar
            sx={{
              backgroundColor: orange[600],
              height: 56,
              width: 56
            }}
          >
            <PlayCircleIcon />
          </Avatar>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};

export default Monitor;
