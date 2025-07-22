import React, { useEffect } from 'react';
import { bool, func, object, arrayOf, string } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { propTypes } from '../../util/types';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';
import { H3, Page, UserNav, LayoutSideNavigation } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import { regions } from '../../config/regions';
import { fetchSubscriptions, updateSubscription } from './EmailSubscriptionsPage.duck';
import css from './EmailSubscriptionsPage.module.css';

const EmailSubscriptionsPageComponent = (props) => {
  const {
    currentUser,
    subscriptions,
    fetchSubscriptionsInProgress,
    fetchSubscriptionsError,
    updateInProgress,
    updateError,
    updatingBubbles,
    onFetchSubscriptions,
    onUpdateSubscription,
    scrollingDisabled,
    intl,
  } = props;

  useEffect(() => {
    onFetchSubscriptions();
  }, [onFetchSubscriptions]);

  const user = ensureCurrentUser(currentUser);
  const title = intl.formatMessage({ id: 'EmailSubscriptionsPage.title' });

  const handleBubbleClick = (tag, checked) => {
    // Only allow click if this specific bubble is not currently updating
    if (!updatingBubbles[tag]) {
      onUpdateSubscription(tag, !checked);
    }
  };

  // Group regions by country
  const regionsByCountry = regions
    .filter((r) => r.option !== 'Other')
    .reduce((acc, region) => {
      const country = region.country || 'Other';
      if (!acc[country]) {
        acc[country] = [];
      }
      acc[country].push(region);
      return acc;
    }, {});

  const bubbleGroups = Object.entries(regionsByCountry).map(([country, countryRegions]) => {
    const countryBubbles = countryRegions.map((r) => {
      const tag = `Alert:${r.option}`;
      const checked = subscriptions.includes(tag);
      const isUpdating = updatingBubbles[tag];
      return (
        <button
          key={r.option}
          type="button"
          className={`${css.bubble} ${checked ? css.bubbleChecked : ''} ${isUpdating ? css.bubbleDisabled : ''}`}
          onClick={() => handleBubbleClick(tag, checked)}
          disabled={isUpdating}
          aria-pressed={checked}
        >
          {r.label}
        </button>
      );
    });

    return (
      <div key={country} className={css.countryGroup}>
        <h4 className={css.countryTitle}>{country}</h4>
        <div className={css.bubbleList}>{countryBubbles}</div>
      </div>
    );
  });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav currentPage="EmailSubscriptionsPage" />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        currentPage="EmailSubscriptionsPage"
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1">
            <FormattedMessage id="EmailSubscriptionsPage.heading" />
          </H3>
          <p className={css.description}><FormattedMessage id="EmailSubscriptionsPage.description" /></p>

          {fetchSubscriptionsError ? (
            <p className={css.error}>{fetchSubscriptionsError.message}</p>
          ) : null}
          {updateError ? <p className={css.error}>{updateError.message}</p> : null}
          <div className={css.bubbleGroupsContainer}>{bubbleGroups}</div>
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

EmailSubscriptionsPageComponent.defaultProps = {
  currentUser: null,
  fetchSubscriptionsError: null,
  updateError: null,
  subscriptions: [],
};

EmailSubscriptionsPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  subscriptions: arrayOf(string),
  fetchSubscriptionsInProgress: bool.isRequired,
  fetchSubscriptionsError: object,
  updateInProgress: bool.isRequired,
  updateError: object,
  updatingBubbles: object,
  onFetchSubscriptions: func.isRequired,
  onUpdateSubscription: func.isRequired,
  scrollingDisabled: bool.isRequired,
  intl: intlShape.isRequired,
};

const mapStateToProps = (state) => {
  const { currentUser } = state.user;
  const { subscriptions, fetchInProgress, fetchError, updateInProgress, updateError, updatingBubbles } =
    state.EmailSubscriptionsPage;
  return {
    currentUser,
    subscriptions,
    fetchSubscriptionsInProgress: fetchInProgress,
    fetchSubscriptionsError: fetchError,
    updateInProgress,
    updateError,
    updatingBubbles,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = (dispatch) => ({
  onManageDisableScrolling: (componentId, disable) =>
    dispatch(manageDisableScrolling(componentId, disable)),
  onFetchSubscriptions: () => dispatch(fetchSubscriptions()),
  onUpdateSubscription: (tag, active) => dispatch(updateSubscription(tag, active)),
});

const EmailSubscriptionsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(EmailSubscriptionsPageComponent);

export default EmailSubscriptionsPage;
