/* eslint-disable no-shadow */
/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Formik } from 'formik';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { connect } from 'react-redux';
import { storeUser } from '../store/action/user';
import ideogramLogo from '../assets/logo/ideogram_logo.png';

const Login = (props) => {
  const navigate = useNavigate();
  const { user } = props || {};

  const [email, setEmail] = useState('');
  const [error, seterror] = useState('');
  const [password, setPassword] = useState('');
  const [loader, setloader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.valid) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const signup = (data) => {
    setloader(true);
    console.log(data, 'signup');
    props.storeUser(data, (err) => {
      if (err?.exists) {
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

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
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
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        {/* ✅ LEFT HALF - LOGO SECTION */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            padding: '40px',
            '@media (max-width: 960px)': {
              display: 'none'
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
          >
            <img
              src={ideogramLogo}
              alt="Ideogram Logo"
              style={{
                maxWidth: '280px',
                width: '100%',
                height: 'auto',
                marginBottom: '30px'
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#333',
                mb: 2
              }}
            >
              Welcome to Ideogram
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#666',
                lineHeight: 1.6,
                maxWidth: '300px'
              }}
            >
              Manage your digital displays with ease. Control content, schedules, and monitoring from one central platform.
            </Typography>
          </Box>
        </Box>

        {/* ✅ RIGHT HALF - LOGIN FORM SECTION */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px',
            backgroundColor: '#ffffff',
            '@media (max-width: 960px)': {
              flex: '1 1 100%'
            }
          }}
        >
          <Container maxWidth="sm" sx={{ width: '100%' }}>
            <Formik onSubmit={OnSubmit}>
              {({ handleBlur, handleSubmit, isSubmitting }) => (
                <form onSubmit={handleSubmit}>
                  {/* ✅ FORM HEADER */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      color="textPrimary"
                      variant="h3"
                      sx={{ fontWeight: 700, mb: 1 }}
                    >
                      Sign In
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="body2"
                    >
                      Enter your credentials to access the platform
                    </Typography>
                  </Box>

                  {/* ✅ ERROR MESSAGE */}
                  {error && (
                    <Box sx={{ mb: 2 }}>
                      <Typography color="error" variant="body2">
                        {error}
                      </Typography>
                    </Box>
                  )}

                  {/* ✅ EMAIL FIELD */}
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
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        height: '48px'
                      }
                    }}
                  />

                  {/* ✅ PASSWORD FIELD WITH EYE TOGGLE */}
                  <TextField
                    fullWidth
                    label="Password"
                    margin="normal"
                    name="password"
                    onBlur={handleBlur}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    required
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        height: '48px'
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                            sx={{
                              color: '#1976d2'
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  {/* ✅ SUBMIT BUTTON */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      mt: 2
                    }}
                  >
                    {loader && (
                      <CircularProgress
                        size={24}
                        sx={{ marginBottom: 2 }}
                      />
                    )}
                    <Button
                      color="primary"
                      disabled={isSubmitting || loader}
                      fullWidth
                      onClick={OnSubmit}
                      size="large"
                      type="submit"
                      variant="contained"
                      sx={{
                        height: '48px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      Sign in now
                    </Button>
                  </Box>
                </form>
              )}
            </Formik>
          </Container>
        </Box>
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
