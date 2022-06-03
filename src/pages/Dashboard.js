import { Helmet } from 'react-helmet';
import { Box, Container, Grid } from '@material-ui/core';
import Monitor from '../components/dashboard/Monitor';
import Playlist from '../components/dashboard/Playlist';
import Media from '../components/dashboard/Media';
import Schedule from '../components/dashboard/Schedule';

const Dashboard = () => (
  <>
    <Helmet>
      <title>Dashboard | Ideogram</title>
    </Helmet>
    <Box
      sx={{
        backgroundColor: 'background.default',
        minHeight: '100%',
        py: 3
      }}
    >
      <Container maxWidth={false}>
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
            lg={3}
            sm={6}
            xl={3}
            xs={12}
          >
            <Monitor />
          </Grid>
          <Grid
            item
            lg={3}
            sm={6}
            xl={3}
            xs={12}
          >
            <Media />
          </Grid>
          <Grid
            item
            lg={3}
            sm={6}
            xl={3}
            xs={12}
          >
            <Playlist />
          </Grid>
          <Grid
            item
            lg={3}
            sm={6}
            xl={3}
            xs={12}
          >
            <Schedule />
          </Grid>
        </Grid>
      </Container>
    </Box>
  </>
);

export default Dashboard;
