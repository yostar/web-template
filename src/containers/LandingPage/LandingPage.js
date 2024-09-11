import React from 'react';
import loadable from '@loadable/component';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { camelize } from '../../util/string';
import { propTypes } from '../../util/types';

import FallbackPage from './FallbackPage';
import { ASSET_NAME } from './LandingPage.duck';

import { H1 } from '../../components';

const PageBuilder = loadable(() =>
  import(/* webpackChunkName: "PageBuilder" */ '../PageBuilder/PageBuilder')
);

const CustomH1 = props => <H1 {...props} className="my-custom-h1-class">Hello</H1>;

export const LandingPageComponent = props => {
  const { pageAssetsData, inProgress, error } = props;

  const pageBuilderContent = pageAssetsData?.[camelize(ASSET_NAME)]?.data;
  console.log('pageBuilderContent', pageBuilderContent);
  console.log('pageBuilderContent type', typeof pageBuilderContent);

  return (
    <PageBuilder
      pageAssetsData={pageBuilderContent}
      inProgress={inProgress}
      options={{
        AdBanner: {
          show: true,
        },
        H1: {
          component: CustomH1,
        },
      }}
      error={error}
      fallbackPage={<FallbackPage error={error} />}
    />
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const LandingPage = compose(connect(mapStateToProps))(LandingPageComponent);

export default LandingPage;
