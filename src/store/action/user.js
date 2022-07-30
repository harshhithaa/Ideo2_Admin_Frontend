/* eslint-disable linebreak-style */
/* eslint-disable import/prefer-default-export */
/* eslint-disable linebreak-style */
import localStorage from 'local-storage';
import { ErrorCode, COMPONENTS } from 'src/utils/constant';
import {
  GETUSERCOMPONENTLIST,
  GETUSERPLAYLISTLIST,
  GETUSERSCHEDULELIST,
  GETUSERMEDIALIST,
  STOREUSER,
  REMOVEUSER,
  SAVEPLAYLIST,
  SAVESCHEDULE,
  SAVEMEDIA,
  DELETECOMPONENTLIST,
  GETUSERMEDIADETAILS,
  GETUSERSCHEDULEDETAILS,
  GETUSERPLAYLISTDETAILS,
  GETUSERMONITORDETAILS,
  SAVEMONITOR
} from './actionTypes';
import Api from '../../service/Api';
import { store } from '../store';

export const storeUser = (data, callback) => (dispatch) => {
  let accesstoken;
  try {
    Api.post('/authentication/login', data)
      .then((res) => {
        if (!res.data.Error) {
          accesstoken = res.data.Details.AuthToken;
          const { UserRef } = res.data.Details;

          dispatch({
            type: STOREUSER,
            payload: {
              accesstoken,
              valid: true,
              UserRef
            }
          });
          callback({ exits: false, data: res.data.Details });
        } else {
          if (res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials) {
            localStorage.clear();
          }
          callback({ exits: true, errmessage: res.data.Error.ErrorMessage });
        }
      })
      .catch((err) => {
        callback({ exits: true, err: `${err}` });
      });
  } catch (err) {
    console.log(err);
  }
};
export const getUserComponentList = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  try {
    Api.get(
      '/admin/componentlist',

      {
        params: data,
        headers: {
          AuthToken: token
        }
      }
    )
      .then((res) => {
        if (!res.data.Error) {
          const dataObj = res.data.Details;

          console.log('getUserComponentList', dataObj);
          if (data.componenttype === COMPONENTS.Monitor) {
            dispatch({
              type: GETUSERCOMPONENTLIST,
              payload: dataObj.ComponentList
            });
          } else if (data.componenttype === COMPONENTS.Playlist) {
            dispatch({
              type: GETUSERPLAYLISTLIST,
              payload: dataObj.ComponentList
            });
          } else if (data.componenttype === COMPONENTS.Schedule) {
            dispatch({
              type: GETUSERSCHEDULELIST,
              payload: dataObj.ComponentList
            });
          } else if (data.componenttype === COMPONENTS.Media) {
            dispatch({
              type: GETUSERMEDIALIST,
              payload: dataObj.ComponentList
            });
          }
          callback({ exists: false });
        } else {
          if (res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials) {
            localStorage.clear();
          }
          console.log(
            'es.data.Error.ErrorMessage,',
            res.data.Error.ErrorMessage
          );
          callback({ exists: true, errmessage: res.data.Error.ErrorMessage });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

export const savePlaylist = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  try {
    if (data.id) {
      //add edit code here
    } else {
      Api.post('/admin/saveplaylist', data, {
        headers: {
          'Content-Type': 'application/json',
          AuthToken: token
        }
      })
        .then((res) => {
          if (!res.data.Error) {
            dispatch({
              type: SAVEPLAYLIST,
              payload: res.data.Details
            });
            callback({ exists: false });
          } else {
            if (
              res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials
            ) {
              localStorage.clear();
            }
            callback({ exists: true, errmessage: res.data.Error.ErrorMessage });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
  }
};
export const saveSchedule = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  console.log(data);

  try {
    if (data.id) {
      //add edit code here
    } else {
      Api.post('/admin/saveschedule', data, {
        headers: {
          'Content-Type': 'application/json',
          AuthToken: token
        }
      })
        .then((res) => {
          if (!res.data.Error) {
            dispatch({
              type: SAVESCHEDULE,
              payload: res.data.Details
            });
            callback({ exists: false });
          } else {
            if (
              res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials
            ) {
              localStorage.clear();
            }
            callback({ exists: true, errmessage: res.data.Error.ErrorMessage });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
  }
};
export const saveMonitor = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  console.log(data);

  try {
    if (data.id) {
      //add edit code here
    } else {
      Api.post('/admin/savemonitor', data, {
        headers: {
          'Content-Type': 'application/json',
          AuthToken: token
        }
      })
        .then((res) => {
          if (!res.data.Error) {
            dispatch({
              type: SAVEMONITOR,
              payload: res.data.Details
            });
            callback({ exists: false });
          } else {
            if (
              res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials
            ) {
              localStorage.clear();
            }
            callback({ exists: true, errmessage: res.data.Error.ErrorMessage });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    console.log(err);
  }
};

export const logoutUser = (callback) => (dispatch) => {
  // console.log('inlogout user', store.getState().root.user.accesstoken);
  try {
    // const token = store.getState().root.user.accesstoken;
    Api.post(
      '/authentication/logout',
      {},
      {
        headers: {
          AuthToken: store.getState().root.user.accesstoken
        }
      }
    )
      .then((res) => {
        if (!res.data.Error) {
          dispatch({
            type: REMOVEUSER,
            payload: false
          });
          callback({ exits: false });
        } else {
          if (res.data.Error.ErrorCode === 10002) {
            localStorage.clear();
            this.props.history.push({ pathname: '/login' });
          }
          callback({ exits: true, err: res.data.Error.ErrorMessage });
        }
      })
      .catch((errr) => {
        callback({ exits: false, err: 'error', errr });
      });
  } catch (error) {
    console.log(error);
  }
};

export const saveMedia = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  try {
    Api.post('/admin/savemedia', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
        type: 'formData',
        AuthToken: token
      }
    })
      .then((res) => {
        if (!res.data.Error) {
          dispatch({
            type: SAVEMEDIA,
            payload: false
          });
          callback({ exists: false });
        } else {
          if (res.data.Error) {
            localStorage.clear();
            this.props.history.push({ pathname: '/login' });
          }
          callback({ exits: true, err: res.data.Error.ErrorMessage });
        }
      })
      .catch((errr) => {
        callback({ exits: false, err: 'error', errr });
      });
  } catch (error) {
    console.log(error);
  }
};

export const validateDeleteComponentList = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;

  try {
    Api.post('/admin/validatedeletecomponentlist', data, {
      headers: {
        'Content-Type': 'application/json',
        AuthToken: token
      }
    })
      .then((res) => {
        console.log(res.data, 'Delete comp');
        if (!res.data.Error) {
          if (res.data.Details.IsComponentDeletable) {
            dispatch({
              type: DELETECOMPONENTLIST,
              payload: false
            });
            callback({ exits: false });
          } else {
            callback({
              exits: true,
              err: 'attached',
              componentsAttached: res.data.Details.ActiveComponents
            });
          }
        } else {
          if (res.data.Error.ErrorCode === 10002) {
            // localStorage.clear();
            this.props.history.push({ pathname: '/login' });
          }
          callback({ exits: true, err: res.data.Error.ErrorMessage });
        }
      })
      .catch((errr) => {
        callback({ exits: false, err: 'error', errr });
      });
  } catch (error) {
    console.log(error);
  }
};

export const deleteComponentList = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;

  try {
    Api.post('/admin/deletecomponentlist', data, {
      headers: {
        'Content-Type': 'application/json',
        AuthToken: token
      }
    })
      .then((res) => {
        if (!res.data.Error) {
          dispatch({
            type: DELETECOMPONENTLIST,
            payload: false
          });
          callback({ exits: false });
        } else {
          if (res.data.Error.ErrorCode === 10002) {
            // localStorage.clear();
            this.props.history.push({ pathname: '/login' });
          }
          callback({ exits: true, err: res.data.Error.ErrorMessage });
        }
      })
      .catch((errr) => {
        callback({ exits: false, err: 'error', errr });
      });
  } catch (error) {
    console.log(error);
  }
};

export const getUserComponentDetails = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  try {
    Api.get(
      '/admin/componentdetails',

      {
        params: data,
        headers: {
          AuthToken: token
        }
      }
    )
      .then((res) => {
        if (!res.data.Error) {
          const dataObj = res.data.Details;

          console.log('dataObj', dataObj);
          if (data.ComponentType === COMPONENTS.Monitor) {
            dispatch({
              type: GETUSERMONITORDETAILS,
              payload: dataObj
            });
          } else if (data.ComponentType === COMPONENTS.Playlist) {
            dispatch({
              type: GETUSERPLAYLISTDETAILS,
              payload: dataObj
            });
          } else if (data.ComponentType === COMPONENTS.Schedule) {
            dispatch({
              type: GETUSERSCHEDULEDETAILS,
              payload: dataObj
            });
          } else if (data.ComponentType === COMPONENTS.Media) {
            dispatch({
              type: GETUSERMEDIADETAILS,
              payload: dataObj
            });
          }
          callback({ exists: false });
        } else {
          if (res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials) {
            localStorage.clear();
          }
          console.log(
            'es.data.Error.ErrorMessage,',
            res.data.Error.ErrorMessage
          );
          callback({ exists: true, errmessage: res.data.Error.ErrorMessage });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};
