import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Typography
} from '@material-ui/core';
import {
  Monitor as MonitorIcon,
} from 'react-feather';
import { red } from '@material-ui/core/colors';
import { useNavigate } from 'react-router-dom';



const Monitor = (props) => {

  const navigate = useNavigate();
  return(
  <Card
    sx={{ height: '100%', cursor:"pointer" }}
    {...props}
    onClick={()=>{navigate('/app/monitors')}}
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
            MONITORS
          </Typography>
        </Grid>
        <Grid item>
          <Avatar
            sx={{
              backgroundColor: red[600],
              height: 56,
              width: 56
            }}
          >
            <MonitorIcon />
          </Avatar>
        </Grid>
      </Grid>
    </CardContent>
  </Card>)
};

export default Monitor;
