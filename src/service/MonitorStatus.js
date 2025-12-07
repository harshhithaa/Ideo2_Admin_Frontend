import Api from './Api';
import { store } from '../store/store';

/**
 * Get live status of a specific monitor
 * @param {string} monitorRef - Monitor reference ID
 * @returns {Promise} - Monitor status data
 */
export const getMonitorLiveStatus = async (monitorRef) => {
  try {
    const token = store.getState().root.user.accesstoken;

    const response = await Api.post(
      '/admin/monitorlivestatus',
      { MonitorRef: monitorRef },
      {
        headers: {
          AuthToken: token
        }
      }
    );

    if (response.data && !response.data.Error) {
      return {
        success: true,
        data: response.data.Details
      };
    } else {
      return {
        success: false,
        error: response.data?.Error?.ErrorMessage || 'Failed to fetch monitor status'
      };
    }
  } catch (error) {
    console.error('getMonitorLiveStatus error:', error);
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};

export default {
  getMonitorLiveStatus
};