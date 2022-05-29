/* eslint-disable no-shadow */
/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Formik } from 'formik';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography
} from '@material-ui/core';
import { connect } from 'react-redux';
import { storeUser } from '../store/action/user';

const Login = (props) => {
  const navigate = useNavigate();
  const { user } = props || {};

  const [email, setEmail] = useState('');
  const [error, seterror] = useState('');
  const [password, setPassword] = useState('');
  const [loader, setloader] = useState(false);

  useEffect(() => {
    if (user.valid) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [loader]);

  const signup = (data) => {
    setloader(true);
    console.log(data, 'signup');
    props.storeUser(data, (err) => {
      if (err.exits) {
        setloader(false);
        console.log('err', err);
        seterror(err.errmessage);
      } else {
        setloader(false);
      }
    });
  };

  const OnSubmit = async (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (form.checkValidity() === true) {
      event.preventDefault();
      const data = {
        Email: email,
        Password: password
      };
      signup(data);
      event.stopPropagation();
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Ideogram</title>
      </Helmet>
      <Box
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="sm">
          <Formik onSubmit={OnSubmit}>
            {({ handleBlur, handleSubmit, isSubmitting }) => (
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                  <Typography color="textPrimary" variant="h2">
                    Ideogram
                  </Typography>
                  <Typography
                    color="textSecondary"
                    gutterBottom
                    variant="body2"
                  >
                    Sign in on the internal platform
                  </Typography>
                </Box>
                <Box>
                  <Typography color="red" gutterBottom variant="body2">
                    {error}
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  label="Email Address"
                  margin="normal"
                  name="email"
                  onBlur={handleBlur}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  variant="outlined"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  margin="normal"
                  name="password"
                  onBlur={handleBlur}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  variant="outlined"
                  required
                />
                <Box
                  sx={{
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column'
                  }}
                >
                  {loader && <CircularProgress style={{ marginBottom: 10 }} />}
                  <Button
                    color="primary"
                    disabled={isSubmitting}
                    fullWidth
                    onClick={OnSubmit}
                    size="large"
                    type="submit"
                    variant="contained"
                  >
                    Sign in now
                  </Button>
                </Box>
              </form>
            )}
          </Formik>
        </Container>
      </Box>
    </>
  );
};

const mapStateToProps = ({ root = {} }) => {
  const { user } = root;

  return {
    user
  };
};
const mapDispatchToProps = (dispatch) => ({
  storeUser: (data, callback) => dispatch(storeUser(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);
