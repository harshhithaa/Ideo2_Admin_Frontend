/* eslint-disable react/prop-types */
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  Hidden,
  IconButton,
  Toolbar,
  Modal,
  Grid,
  Button
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { connect } from 'react-redux';
import InputIcon from '@material-ui/icons/Input';
import Logo from './Logo';
import { logoutUser } from '../store/action/user';
import { useState } from 'react';

const DashboardNavbar = (props, { onMobileNavOpen }) => {
  const [showmodal, setModal] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    props.logoutUser((err) => {
      if (!err.exists) {
        setModal(false);
        localStorage.clear();
        navigate('/login', { replace: true });
        console.log('after');
      } else {
        setModal(false);
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    });
  };
  return (
    <AppBar elevation={0}>
      <Modal
        open={showmodal}
        onClose={() => setModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <h4 id="parent-modal-title" style={{ marginBottom: 20 }}>
            Are you sure you want to Logout?
          </h4>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleLogout()}
              >
                Yes{' '}
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="error"
                onClick={() => setModal(false)}
              >
                No{' '}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
      <Toolbar>
        <RouterLink to="/">
          <Logo />
        </RouterLink>
        <Box sx={{ flexGrow: 1 }} />
        <Hidden xsDown>
          <IconButton
            color="inherit"
            onClick={() => {
              setModal(true);
            }}
            size="large"
          >
            <InputIcon />
          </IconButton>
        </Hidden>
        <Hidden lgUp>
          <IconButton
            color="inherit"
            onClick={props.onMobileNavOpen}
            size="large"
          >
            <MenuIcon />
          </IconButton>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
};

DashboardNavbar.propTypes = {
  onMobileNavOpen: PropTypes.func
};

const mapDispatchToProps = (dispatch) => ({
  logoutUser: (callback) => dispatch(logoutUser(callback))
});

export default connect(null, mapDispatchToProps)(DashboardNavbar);
