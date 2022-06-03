import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Typography
} from '@material-ui/core';
import {
  Film as FilmIcon
} from 'react-feather';
import { green } from '@material-ui/core/colors';
import { useNavigate } from 'react-router-dom';

const Monitor = (props) => {

  const navigate = useNavigate();

  return(
  <Card
    sx={{ height: '100%',cursor:'pointer' }}
    {...props}
    onClick={()=>{navigate('/app/media')}}
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
            MEDIA
          </Typography>
        </Grid>
        <Grid item>
          <Avatar
            sx={{
              backgroundColor: green[600],
              height: 56,
              width: 56
            }}
          >
            <FilmIcon />
          </Avatar>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};

export default Monitor;
