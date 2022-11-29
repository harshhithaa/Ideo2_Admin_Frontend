/* eslint-disable react/prop-types */
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router';
import PropTypes from 'prop-types';
import { AppBar, Box, Hidden, IconButton, Toolbar } from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import { connect } from 'react-redux';
import InputIcon from '@material-ui/icons/Input';
import Logo from './Logo';
import { logoutUser } from '../store/action/user';

const DashboardNavbar = (props, { onMobileNavOpen }) => {
  const navigate = useNavigate();
  return (
    <AppBar elevation={0}>
      <Toolbar>
        <RouterLink to="/">
          <Logo />
        </RouterLink>
        <Box sx={{ flexGrow: 1 }} />
        <Hidden xsDown>
          <IconButton
            color="inherit"
            onClick={() => {
              console.log('before');
              props.logoutUser((err) => {
                if (!err.exists) {
                  localStorage.clear();
                  navigate('/login', { replace: true });
                  console.log('after');
                } else {
                  localStorage.clear();
                  navigate('/login', { replace: true });
                }
              });
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
