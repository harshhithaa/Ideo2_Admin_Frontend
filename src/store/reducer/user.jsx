/* eslint-disable linebreak-style */
import {
  STOREUSER,
  REMOVEUSER,
  GETUSERCOMPONENTLIST,
  GETUSERPLAYLISTLIST,
  GETUSERMEDIALIST,
  GETUSERSCHEDULELIST,
  GETUSERMEDIADETAILS,
  GETUSERSCHEDULEDETAILS,
  GETUSERPLAYLISTDETAILS,
  GETUSERMONITORDETAILS,
  SAVEMEDIA
} from '../action/actionTypes';

const initialState = {
  user: { valid: false, accesstoken: null },
  playlistDetails: {
    playlistRef: null,
    playlistName: null,
    description: null,
    media: [],
    isActive: 0,
  },
  scheduleDetails: {
    scheduleRef: null,
    scheduleTitle: null,
    description: null,
    playlistRef: null,
    playlistName: null,
    schedule: {
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
      days: []
    },
    isActive: 0,
  }
};

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case STOREUSER: {
      return { ...state, user: action.payload };
    }
    case GETUSERCOMPONENTLIST: {
      return {
        ...state,
        user: {
          ...state.user,
          components: {
            ...state.user.components,
            list: action.payload.list || action.payload,
            totalRecords: action.payload.totalRecords || 0,
            pageNumber: action.payload.pageNumber || 1,
            pageSize: action.payload.pageSize || 10,
            totalPages: action.payload.totalPages || 0
          }
        }
      };
    }
    case GETUSERPLAYLISTLIST: {
      return {
        ...state,
        user: {
          ...state.user,
          components: {
            ...state.user.components,
            playlistList: action.payload.list || action.payload,
            playlistTotalRecords: action.payload.totalRecords || 0,
            playlistPageNumber: action.payload.pageNumber || 1,
            playlistPageSize: action.payload.pageSize || 10,
            playlistTotalPages: action.payload.totalPages || 0
          }
        }
      };
    }
    case GETUSERMEDIALIST: {
      return {
        ...state,
        user: {
          ...state.user,
          components: {
            ...state.user.components,
            mediaList: action.payload.list || action.payload,
            mediaTotalRecords: action.payload.totalRecords || 0,
            mediaPageNumber: action.payload.pageNumber || 1,
            mediaPageSize: action.payload.pageSize || 10,
            mediaTotalPages: action.payload.totalPages || 0
          }
        }
      };
    }
    case GETUSERSCHEDULELIST: {
      return {
        ...state,
        user: {
          ...state.user,
          components: {
            ...state.user.components,
            scheduleList: action.payload.list || action.payload,
            scheduleTotalRecords: action.payload.totalRecords || 0,
            schedulePageNumber: action.payload.pageNumber || 1,
            schedulePageSize: action.payload.pageSize || 10,
            scheduleTotalPages: action.payload.totalPages || 0
          }
        }
      };
    }
    case GETUSERMEDIADETAILS: {
      return {
        ...state,
        user: {
          ...state.user,
          components: {
            ...state.user.components,
            scheduleList: action.payload
          }
        }
      };
    }

    // ✅ FIX: Handle SAVEMEDIA to add new media to list
    case SAVEMEDIA: {
      return {
        ...state,
        user: {
          ...state.user,
          components: {
            ...state.user.components,
            mediaList: action.payload // payload should be updated media list from backend
          }
        }
      };
    }
    case GETUSERPLAYLISTDETAILS: {
      return {
        ...state,
        playlistDetails: {
          ...state.playlistDetails,
          playlistRef: action.payload.Playlist.PlaylistRef,
          playlistName: action.payload.Playlist.Name,
          description: action.payload.Playlist.Description,
          media: action.payload.Media,
          isActive: action.payload.Playlist.IsActive,
        }
      };
    }
    case GETUSERSCHEDULEDETAILS: {
      return {
        ...state,
        scheduleDetails: {
          ...state.scheduleDetails,

          scheduleRef: action.payload.ScheduleData.ScheduleRef,
          scheduleTitle: action.payload.ScheduleData.Title,
          description: action.payload.ScheduleData.Description,
          playlistRef: action.payload.ScheduleData.PlaylistRef,
          playlistName: action.payload.ScheduleData.PlaylistName,
          schedule: {
            startDate: action.payload.ScheduleData.StartDate,
            endDate: action.payload.ScheduleData.EndDate,
            startTime: action.payload.ScheduleData.StartTime,
            endTime: action.payload.ScheduleData.EndTime,
            days: action.payload.ScheduleData.Days
          },
          isActive: action.payload.ScheduleData.IsActive,
        }
      };
    }
    case GETUSERMONITORDETAILS: {
      return {
        ...state,
        user: {
          ...state.user,
          components: {
            ...state.user.components,
            monitorDetails: action.payload.Monitor,
            monitorSchedules: action.payload.Schedules
          }
        }
      };
    }
    
    case REMOVEUSER: {
      return  {
        initialState,
        user: { valid: false, accesstoken: null },
      }
    }

    default:
      return state;
  }
}
