import React, { useEffect, useState } from 'react';
import { bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H1, Page, LayoutSingleColumn } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import { fetchPMStatus, approveListing } from '../../extensions/PMPortal/api';

import css from './PMPortalPage.module.css';

export const PMPortalPageComponent = (props) => {
  const { scrollingDisabled, intl } = props;
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [listingId, setListingId] = useState(null);
  const [token, setToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const title = intl.formatMessage({ id: 'PMPortalPage.title' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('listingId');
    const tok = params.get('token');

    setListingId(id);
    setToken(tok);

    if (id && tok) {
      fetchPMStatus(id, tok)
        .then(res => {
          const pmStatus = res?.data?.pmStatus || 'pending';
          setStatus(pmStatus);
        })
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [location.search]);

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
              {status === 'pending' && (
                <button
                  className={css.button}
                  disabled={submitting}
                  onClick={() => {
                    setSubmitting(true);
                    approveListing({ listingId, token })
                      .then(() => setStatus('approved'))
                      .catch(() => setStatus('error'))
                      .finally(() => setSubmitting(false));
                  }}
                >
                  {submitting ? (
                    <FormattedMessage id="PMPortalPage.approving" />
                  ) : (
                    <FormattedMessage id="PMPortalPage.approveButton" />
                  )}
                </button>
              )}
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
