import {
  Avatar,
  Card,
  CardContent,
  Grid,
  Typography
} from '@material-ui/core';
import {
  Calendar as CalendarIcon,
} from 'react-feather';
import { indigo } from '@material-ui/core/colors';
import { useNavigate } from 'react-router-dom';

const Schedule = (props) => {

  const navigate = useNavigate();

  return(
  <Card
    sx={{ height: '100%', cursor: "pointer" }}
    {...props}
    onClick={()=>{navigate('/app/schedules')}}
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
            SCHEDULE
          </Typography>
        </Grid>
        <Grid item>
          <Avatar
            sx={{
              backgroundColor: indigo[600],
              height: 56,
              width: 56
            }}
          >
            <CalendarIcon />
          </Avatar>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
)};

export default Schedule;
