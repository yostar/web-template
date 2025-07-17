import React, { useEffect, useState } from 'react';
import { bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H1, Page, LayoutSingleColumn, PrimaryButton } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import {
  fetchPMStatus,
  authenticatePM,
  approveListing,
} from '../../extensions/PMPortal/api';

import css from './PMPortalPage.module.css';

export const PMPortalPageComponent = (props) => {
  const { scrollingDisabled, intl } = props;
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [listingId, setListingId] = useState(null);
  const [token, setToken] = useState(null);

  const title = intl.formatMessage({ id: 'PMPortalPage.title' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lId = params.get('listingId');
    const t = params.get('token');
    setListingId(lId);
    setToken(t);

    if (lId && t) {
      authenticatePM({ listingId: lId, token: t })
        .then((res) => {
          const pmStatus = res?.data?.pmStatus || 'pending';
          setStatus(pmStatus);
        })
        .catch(() => setStatus('error'));
    } else if (lId) {
      fetchPMStatus(lId)
        .then((res) => {
          const pmStatus = res?.data?.pmStatus || 'pending';
          setStatus(pmStatus);
        })
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [location.search]);

  const handleApprove = () => {
    if (!listingId || !token) {
      return;
    }
    approveListing({ listingId, token })
      .then(() => setStatus('approved'))
      .catch(() => setStatus('error'));
  };

  const statusMessages = {
    pending: { heading: 'PMPortalPage.pendingHeading', info: 'PMPortalPage.pendingInfo' },
    approved: { heading: 'PMPortalPage.approvedHeading', info: 'PMPortalPage.approvedInfo' },
    salePending: {
      heading: 'PMPortalPage.salePendingHeading',
      info: 'PMPortalPage.salePendingInfo',
    },
    scheduling: {
      heading: 'PMPortalPage.schedulingHeading',
      info: 'PMPortalPage.schedulingInfo',
    },
    scheduled: {
      heading: 'PMPortalPage.scheduledHeading',
      info: 'PMPortalPage.scheduledInfo',
    },
    finalized: {
      heading: 'PMPortalPage.finalizedHeading',
      info: 'PMPortalPage.finalizedInfo',
    },
  };

  const active = statusMessages[status];

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          {status === 'loading' ? (
            <p className={css.infoText}>
              <FormattedMessage id="PMPortalPage.loading" />
            </p>
          ) : status === 'error' || !active ? (
            <p className={css.infoText}>
              <FormattedMessage id="PMPortalPage.error" />
            </p>
          ) : (
            <>
              <H1 as="h1" className={css.heading}>
                <FormattedMessage id={active.heading} />
              </H1>
              <p className={css.infoText}>
                <FormattedMessage id={active.info} />
              </p>
              {status === 'pending' && token ? (
                <PrimaryButton onClick={handleApprove} className={css.approveButton}>
                  <FormattedMessage id="PMPortalPage.approveButton" />
                </PrimaryButton>
              ) : null}
            </>
          )}
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

PMPortalPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
  intl: intlShape.isRequired,
};

const mapStateToProps = (state) => ({
  scrollingDisabled: isScrollingDisabled(state),
});

const PMPortalPage = compose(connect(mapStateToProps), injectIntl)(PMPortalPageComponent);

export default PMPortalPage;
