/* eslint-disable no-unused-vars */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable linebreak-style */
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Button, Modal, Grid } from '@material-ui/core';
import MonitorListResults from 'src/components/monitor/MonitorListResults';
import MonitorListToolbar from 'src/components/monitor/MonitorListToolbar';
// import monitors from '../__mocks__/monitors';
import { connect } from 'react-redux';
import { COMPONENTS } from 'src/utils/constant';
import { getUserComponentList } from '../store/action/user';
import { useNavigate } from 'react-router-dom';

const MonitorList = (props) => {
  const { monitorlist } = props || null;
  const [monitors, setmonitors] = useState([]);
  const [selected, setselected] = useState([]);
  const [showmodal, setModal] = useState(false);
  const [loader, setLoader] = useState(false);
  const [search, setsearch] = useState('');

  let navigate = useNavigate();
  useEffect(() => {
    const data = {
      componenttype: COMPONENTS.Monitor
    };
    props.getUserComponentList(data, (err) => {
      if (err.exists) {
        console.log(err.errmessage);
      } else {
        console.log(monitorlist);
        setmonitors(monitorlist ? monitorlist.list : []);
        setLoader(true);
      }
    });
  }, [loader]);
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4
  };

  const deleteplaylist = () => {
    setModal(false);
    props.deleteplaylist(selected, (err) => {
      if (err.exists) {
        console.log(err.errmessage);
      } else {
        console.log('selected', selected);
      }
    });
  };
  return (
    <>
      <Helmet>
        <title>Monitors | Ideogram</title>
      </Helmet>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100%',
          py: 3
        }}
      >
        <Container maxWidth={false}>
          <Modal
            open={showmodal}
            onClose={() => setModal(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              <h2 id="parent-modal-title" style={{ marginBottom: 20 }}>
                Are you sure you want to delete?
              </h2>
              <Grid container spacing={2}>
                <Grid item>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => deleteplaylist()}
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
          <MonitorListToolbar
            onsearch={(e) => setsearch(e)}
            onclick={() => setModal(true)}
          />
          <Box sx={{ pt: 3 }}>
            <MonitorListResults
              setselected={setselected}
              search={search}
              monitors={monitors}
              view={(e) =>
                navigate('/app/savemonitor', { state: { ...e, type: 'View' } })
              }
              editcall={(e) =>
                navigate('/app/savemonitor', { state: { ...e, type: 'Edit' } })
              }
            />
          </Box>
        </Container>
      </Box>
    </>
  );
};
const mapStateToProps = ({ root = {} }) => {
  const monitorlist = root.user.components;

  return {
    monitorlist
  };
};
const mapDispatchToProps = (dispatch) => ({
  getUserComponentList: (data, callback) =>
    dispatch(getUserComponentList(data, callback))
});

export default connect(mapStateToProps, mapDispatchToProps)(MonitorList);
