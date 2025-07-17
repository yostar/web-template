import { postMethod, getMethod } from '../common/api';

export const sendPMInvite = body => {
  return postMethod('/api/pm/invite', body);
};

export const fetchPMStatus = listingId => {
  return getMethod(`/api/pm/status/${listingId}`);
};

export const authenticatePM = body => {
  return postMethod('/api/pm/auth', body);
};

export const approveListing = body => {
  return postMethod('/api/pm/approve', body);
};
