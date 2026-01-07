/* eslint-disable linebreak-style */
/* eslint-disable import/prefer-default-export */
/* eslint-disable linebreak-style */
// Use browser localStorage (safe fallback for SSR)
const localStorage = (typeof window !== 'undefined' && window.localStorage)
  ? window.localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} };

import { ErrorCode, COMPONENTS } from 'src/utils/constant.jsx';
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
    // Return the promise so callers can await it
    return Api.get('/admin/componentlist', {
      params: data,
      headers: {
        AuthToken: token
      }
    })
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

          if (typeof callback === 'function') callback({ exists: false, data: dataObj });
          return dataObj;
        }

        // error handling
        if (res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials) {
          dispatch({
            type: STOREUSER,
            payload: {
              vaild: false,
              accesstoken: null
            }
          });
        }
        if (typeof callback === 'function') callback({ exists: true, errmessage: res.data.Error.ErrorMessage });
        return Promise.reject(res.data.Error);
      })
      .catch((err) => {
        console.error('getUserComponentList error:', err);
        if (typeof callback === 'function') callback({ exists: true, err: err });
        throw err;
      });
  } catch (err) {
    if (typeof callback === 'function') callback({ exists: true, err });
    return Promise.reject(err);
  }
};

// Add new action for paginated list
export const getUserComponentListWithPagination = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  try {
    return Api.get('/admin/componentlistpaginated', {
      params: data,
      headers: {
        AuthToken: token
      }
    })
      .then((res) => {
        if (!res.data.Error) {
          const dataObj = res.data.Details;
          console.log('getUserComponentListWithPagination', dataObj);

          // Dispatch based on component type with pagination data
          if (data.componenttype === COMPONENTS.Monitor) {
            dispatch({
              type: GETUSERCOMPONENTLIST,
              payload: {
                list: dataObj.ComponentList,
                totalRecords: dataObj.TotalRecords,
                pageNumber: dataObj.PageNumber,
                pageSize: dataObj.PageSize,
                totalPages: dataObj.TotalPages
              }
            });
          } else if (data.componenttype === COMPONENTS.Playlist) {
            dispatch({
              type: GETUSERPLAYLISTLIST,
              payload: {
                list: dataObj.ComponentList,
                totalRecords: dataObj.TotalRecords,
                pageNumber: dataObj.PageNumber,
                pageSize: dataObj.PageSize,
                totalPages: dataObj.TotalPages
              }
            });
          } else if (data.componenttype === COMPONENTS.Schedule) {
            dispatch({
              type: GETUSERSCHEDULELIST,
              payload: {
                list: dataObj.ComponentList,
                totalRecords: dataObj.TotalRecords,
                pageNumber: dataObj.PageNumber,
                pageSize: dataObj.PageSize,
                totalPages: dataObj.TotalPages
              }
            });
          } else if (data.componenttype === COMPONENTS.Media) {
            dispatch({
              type: GETUSERMEDIALIST,
              payload: {
                list: dataObj.ComponentList,
                totalRecords: dataObj.TotalRecords,
                pageNumber: dataObj.PageNumber,
                pageSize: dataObj.PageSize,
                totalPages: dataObj.TotalPages
              }
            });
          }

          if (typeof callback === 'function') callback({ exists: false, data: dataObj });
          return dataObj;
        }

        if (res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials) {
          dispatch({
            type: STOREUSER,
            payload: {
              valid: false,
              accesstoken: null
            }
          });
        }
        if (typeof callback === 'function') callback({ exists: true, errmessage: res.data.Error.ErrorMessage });
        return Promise.reject(res.data.Error);
      })
      .catch((err) => {
        console.error('getUserComponentListWithPagination error:', err);
        if (typeof callback === 'function') callback({ exists: true, err: err });
        throw err;
      });
  } catch (err) {
    if (typeof callback === 'function') callback({ exists: true, err });
    return Promise.reject(err);
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
            // localStorage.clear();
            // this.props.history.push({ pathname: '/login' });
            dispatch({
              type: STOREUSER,
              payload: {
                vaild: false,
                accesstoken: null
              }
            });
            callback({ exits: true, err: res.data.Error.ErrorMessage });
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

export const saveMedia = (data, callback) => async (dispatch) => {
  const token = store.getState().root.user.accesstoken;

  try {
    // --- NEW: create immediate placeholders from FormData files before upload ---
    try {
      const key = 'IDEOGRAM_UPLOADED_MEDIA';
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];

      const files = [];
      if (data instanceof FormData) {
        for (const pair of data.entries()) {
          const v = pair[1];
          if (v instanceof File) files.push(v);
          else if (Array.isArray(v) && v.length && v[0] instanceof File) files.push(...v);
        }
      }

      const placeholders = files.map((file) => {
        const tmpRef = `tmp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const url = URL.createObjectURL(file);
        // revoke after 60s to avoid memory leak
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch (e) {} }, 60000);
        return {
          MediaRef: tmpRef,
          fileName: file.name,
          fileMimetype: (file.type && file.type.split('/')[0]) || 'file',
          fileUrl: url,
          isProcessing: true,
          createdAt: new Date().toISOString()
        };
      });

      if (placeholders.length) {
        // merge with existing placeholders (keep newest first) and dedupe by MediaRef
        const map = new Map();
        placeholders.concat(existing).forEach((it) => { if (!map.has(it.MediaRef)) map.set(it.MediaRef, it); });
        localStorage.setItem(key, JSON.stringify(Array.from(map.values())));
      }
    } catch (e) {
      console.warn('pre-upload placeholder write failed', e);
    }

    const res = await Api.post('/admin/savemedia', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
        AuthToken: token
      },
      timeout: 600000, // 10 minutes for large uploads
      onUploadProgress: (progressEvent) => {
        if (progressEvent && progressEvent.lengthComputable) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
          if (typeof callback === 'function') callback(null, progressEvent);
        }
      }
    });

    if (!res.data.Error) {
      const uploadedMedia = res.data.Details && res.data.Details.Media ? res.data.Details.Media : [];

      // --- remove temp placeholders (existing) ---
      try {
        const key = 'IDEOGRAM_UPLOADED_MEDIA';
        const existingRaw = localStorage.getItem(key);
        let existing = [];
        if (existingRaw) {
          existing = JSON.parse(existingRaw) || [];
        }

        const uploadedNames = new Set(
          uploadedMedia.map((p) => (p.fileName || p.MediaName || '').toString())
        );

        const filtered = existing.filter((ph) => {
          const name = (ph.fileName || ph.MediaName || '').toString();
          return !uploadedNames.has(name);
        });

        localStorage.setItem(key, JSON.stringify(filtered));
      } catch (e) {
        console.warn('persist uploaded placeholder failed', e);
      }

      // --- NEW: notify UI that upload completed with server results ---
      try {
        window.dispatchEvent(new CustomEvent('ideogram:uploadComplete', { detail: { uploadedMedia } }));
      } catch (e) {
        // ignore if window not available
      }

      // try to refresh list (best-effort)
      try {
        dispatch(getUserComponentList({ componenttype: COMPONENTS.Media }));
      } catch (e) { /* ignore */ }

      if (typeof callback === 'function') callback(null, null, res.data.Details);
    } else {
      if (typeof callback === 'function') callback({ exists: true, err: res.data.Error.ErrorMessage || 'Upload failed' });
    }
  } catch (err) {
    // ✅ ENHANCED ERROR HANDLING
    let errorMessage = 'Upload failed';
    
    if (err.response) {
      // Backend returned error response
      if (err.response.status === 413) {
        errorMessage = 'File too large. Maximum file size is 2GB per file.';
      } else if (err.response.status === 415) {
        errorMessage = 'Unsupported file type. Only images and videos are allowed.';
      } else if (err.response.data && err.response.data.Error) {
        errorMessage = err.response.data.Error.ErrorDescription || 
                      err.response.data.Error.ErrorMessage || 
                      errorMessage;
      }
    } else if (err.request) {
      // Network error (no response received)
      errorMessage = 'Network error. Please check your connection and try again.';
    } else {
      // Client-side error
      errorMessage = err.message || errorMessage;
    }
    
    if (typeof callback === 'function') {
      callback({ exists: true, err: errorMessage });
    }
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
            // this.props.history.push({ pathname: '/login' });
            dispatch({
              type: STOREUSER,
              payload: {
                vaild: false,
                accesstoken: null
              }
            });
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
            // this.props.history.push({ pathname: '/login' });
            dispatch({
              type: STOREUSER,
              payload: {
                vaild: false,
                accesstoken: null
              }
            });
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
            dispatch({
              type: STOREUSER,
              payload: {
                vaild: false,
                accesstoken: null
              }
            });
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

export const updateAllMonitors = (data, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  Api.post('/admin/updateallmonitors', data, {
    headers: {
      'Content-Type': 'application/json',
      AuthToken: token
    }
  })
    .then((res) => {
      if (!res.data.Error) callback(res.data.Details);
      else {
        callback(res.data.Error);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

export const getMonitorStatus = (adminRef, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  try {
    return Api.get('/monitor/fetchadminmonitorsstatus', {
      params: { AdminRef: adminRef },
      headers: {
        AuthToken: token
      }
    })
      .then((res) => {
        console.log('getMonitorStatus raw response:', res.data);
        
        if (!res.data.Error) {
          // Handle both array and nested array responses
          let statusData = res.data.Details;
          
          // If Details is array of arrays, flatten it
          if (Array.isArray(statusData) && statusData.length > 0 && Array.isArray(statusData[0])) {
            statusData = statusData[0];
          }
          
          console.log('Monitor Status Data (processed):', statusData);
          
          if (typeof callback === 'function') {
            callback({ exists: false, data: statusData });
          }
          return statusData;
        }

        // error handling
        if (res.data.Error && res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials) {
          dispatch({
            type: STOREUSER,
            payload: {
              valid: false,
              accesstoken: null
            }
          });
        }
        if (typeof callback === 'function') {
          callback({ exists: true, errmessage: res.data.Error?.ErrorMessage });
        }
        return Promise.reject(res.data.Error);
      })
      .catch((err) => {
        console.error('getMonitorStatus error:', err);
        if (typeof callback === 'function') {
          callback({ exists: true, err: err });
        }
        throw err;
      });
  } catch (err) {
    if (typeof callback === 'function') {
      callback({ exists: true, err });
    }
    return Promise.reject(err);
  }
};

export const getMonitorStatusRealtime = (monitorRef, callback) => (dispatch) => {
  const token = store.getState().root.user.accesstoken;
  try {
    return Api.post('/admin/monitor/fetchmonitorstatus', 
      { MonitorRef: monitorRef }, // ✅ This is correct
      {
        headers: {
          AuthToken: token
        },
        timeout: 10000
      }
    )
      .then((res) => {
        if (!res.data.Error) {
          const statusData = res.data.Details;
          console.log('Monitor Status Realtime:', statusData);
          
          if (typeof callback === 'function') {
            callback({ exists: false, data: statusData }); // ✅ Changed to match your callback pattern
          }
          return statusData;
        }

        if (res.data.Error && res.data.Error.ErrorCode === ErrorCode.Invalid_User_Credentials) {
          dispatch({
            type: STOREUSER,
            payload: {
              valid: false,
              accesstoken: null
            }
          });
        }
        
        if (typeof callback === 'function') {
          callback({ exists: true, errmessage: res.data.Error?.ErrorMessage }); // ✅ Changed to match pattern
        }
        return Promise.reject(res.data.Error);
      })
      .catch((err) => {
        console.error('getMonitorStatusRealtime error:', err);
        if (typeof callback === 'function') {
          callback({ exists: true, err: err.message || 'Failed to fetch status' }); // ✅ Fixed
        }
        throw err;
      });
  } catch (err) {
    console.error('getMonitorStatusRealtime exception:', err);
    if (typeof callback === 'function') {
      callback({ exists: true, err: err.message || 'Failed to fetch status' }); // ✅ Fixed
    }
    return Promise.reject(err);
  }
};
