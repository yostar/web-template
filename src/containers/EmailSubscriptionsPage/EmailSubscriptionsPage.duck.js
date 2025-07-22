import { storableError } from '../../util/errors';
import { fetchEmailSubscriptions, updateEmailSubscription } from '../../util/api';

// ================ Action types ================ //
export const FETCH_SUBSCRIPTIONS_REQUEST = 'app/EmailSubscriptionsPage/FETCH_SUBSCRIPTIONS_REQUEST';
export const FETCH_SUBSCRIPTIONS_SUCCESS = 'app/EmailSubscriptionsPage/FETCH_SUBSCRIPTIONS_SUCCESS';
export const FETCH_SUBSCRIPTIONS_ERROR = 'app/EmailSubscriptionsPage/FETCH_SUBSCRIPTIONS_ERROR';

export const UPDATE_SUBSCRIPTION_REQUEST = 'app/EmailSubscriptionsPage/UPDATE_SUBSCRIPTION_REQUEST';
export const UPDATE_SUBSCRIPTION_SUCCESS = 'app/EmailSubscriptionsPage/UPDATE_SUBSCRIPTION_SUCCESS';
export const UPDATE_SUBSCRIPTION_ERROR = 'app/EmailSubscriptionsPage/UPDATE_SUBSCRIPTION_ERROR';

// ================ Reducer ================ //
const initialState = {
  subscriptions: [],
  fetchInProgress: false,
  fetchError: null,
  updateInProgress: false,
  updateError: null,
  updatingBubbles: {}, // Track individual bubble states
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_SUBSCRIPTIONS_REQUEST:
      return { ...state, fetchInProgress: true, fetchError: null };
    case FETCH_SUBSCRIPTIONS_SUCCESS:
      return { ...state, fetchInProgress: false, subscriptions: payload };
    case FETCH_SUBSCRIPTIONS_ERROR:
      return { ...state, fetchInProgress: false, fetchError: payload };
    case UPDATE_SUBSCRIPTION_REQUEST: {
      const { tag } = payload;
      return { 
        ...state, 
        updateInProgress: true, 
        updateError: null,
        updatingBubbles: { ...state.updatingBubbles, [tag]: true }
      };
    }
    case UPDATE_SUBSCRIPTION_SUCCESS: {
      const { tag, active } = payload;
      let subs = state.subscriptions.slice();
      if (active) {
        if (!subs.includes(tag)) subs.push(tag);
      } else {
        subs = subs.filter((t) => t !== tag);
      }
      const { [tag]: removed, ...remainingUpdatingBubbles } = state.updatingBubbles;
      return { 
        ...state, 
        updateInProgress: false, 
        subscriptions: subs,
        updatingBubbles: remainingUpdatingBubbles
      };
    }
    case UPDATE_SUBSCRIPTION_ERROR: {
      const { tag } = payload;
      const { [tag]: removed, ...remainingUpdatingBubbles } = state.updatingBubbles;
      return { 
        ...state, 
        updateInProgress: false, 
        updateError: payload,
        updatingBubbles: remainingUpdatingBubbles
      };
    }
    default:
      return state;
  }
}

// ================ Action creators ================ //
export const fetchSubscriptionsRequest = () => ({ type: FETCH_SUBSCRIPTIONS_REQUEST });
export const fetchSubscriptionsSuccess = (tags) => ({
  type: FETCH_SUBSCRIPTIONS_SUCCESS,
  payload: tags,
});
export const fetchSubscriptionsError = (e) => ({
  type: FETCH_SUBSCRIPTIONS_ERROR,
  error: true,
  payload: e,
});

export const updateSubscriptionRequest = (tag) => ({ 
  type: UPDATE_SUBSCRIPTION_REQUEST, 
  payload: { tag } 
});
export const updateSubscriptionSuccess = (payload) => ({
  type: UPDATE_SUBSCRIPTION_SUCCESS,
  payload,
});
export const updateSubscriptionError = (e, tag) => ({
  type: UPDATE_SUBSCRIPTION_ERROR,
  error: true,
  payload: { ...e, tag },
});

// ================ Thunks ================ //
export const fetchSubscriptions = () => (dispatch) => {
  dispatch(fetchSubscriptionsRequest());
  return fetchEmailSubscriptions()
    .then((data) => dispatch(fetchSubscriptionsSuccess(data.data.tags || data.tags || [])))
    .catch((e) => dispatch(fetchSubscriptionsError(storableError(e))));
};

export const updateSubscription = (tag, active) => (dispatch) => {
  dispatch(updateSubscriptionRequest(tag));
  return updateEmailSubscription({ tag, active })
    .then(() => dispatch(updateSubscriptionSuccess({ tag, active })))
    .catch((e) => dispatch(updateSubscriptionError(storableError(e), tag)));
};

export const loadData = () => fetchSubscriptions();
