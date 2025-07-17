import { postMethod, getMethod } from '../common/api';

export const sendPMInvite = body => {
  return postMethod('/api/pm/invite', body);
};

export const fetchPMStatus = (listingId, token) => {
  return getMethod(`/api/pm/status/${listingId}`, { token });
};

export const fetchInviteStatus = listingId => {
  return getMethod(`/api/pm/invite-status/${listingId}`);
};

export const resendPMInvite = listingId => {
  return postMethod('/api/pm/invite/resend', { listingId });
};

export const approveListing = body => {
  return postMethod('/api/pm/approve', body);
};
