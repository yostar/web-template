import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';

import {
  H2,
  Page,
  LayoutSingleColumn,
} from '../../components';


import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ProgressBar from '../../extensions/transactionProcesses/components/ProgressBar/ProgressBar.js';
import YouTubePlayer from '../../extensions/agents/VideoPlayer/VideoPlayer';


import css from './AgentTrainingPage.module.css';

export const AgentTrainingPageComponent = props => {
  const { scrollingDisabled, intl, currentUser } = props;

  const title = intl.formatMessage({ id: 'AgentTrainingPage.title' });

  const progressBarProcessName = 'AgentTraining';
  
  const progressBarSteps = [
    'Videos',
    'Quiz',
    'Calls',
    'CRM',
    'Begin',
  ];

  const userTraining = currentUser?.attributes?.profile?.publicData?.training;
  console.log('userTraining', userTraining);

  const progressBarStepInProgress = userTraining.step ? userTraining.step - 1 : 0;

  const handleProgressUpdate = (progress) => {
    console.log('Progress update:', progress);
    // Perform any additional functionality with the progress data here
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
       
       <LayoutSingleColumn
        className={css.pageRoot}
        mainColumnClassName={css.pageMainColumn}
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        
        <ProgressBar
            steps={progressBarSteps}
            stateData={{ processName: progressBarProcessName }}
            stepInProgress={progressBarStepInProgress}
        />
        
        <div className={css.root}>
          
        <H2 as="h2" className={css.title}>
            <FormattedMessage id={`ProgressStep.stepTitle.AgentTraining.${progressBarSteps[progressBarStepInProgress]}`} />
        </H2>

        <div className={css.container}>

            <YouTubePlayer 
              videoId="agentTrainingVideos" 
              playlistId="PLrinyDyRpJyXpwR9padFWotgK9ZviTmT8" 
              onProgressUpdate={handleProgressUpdate}
            />

          </div>

        </div>
      </LayoutSingleColumn>

    </Page>
  );
};

AgentTrainingPageComponent.defaultProps = {
  currentUser: null,
};


AgentTrainingPageComponent.propTypes = {
  // from injectIntl
  intl: intlShape.isRequired,
  currentUser: propTypes.currentUser,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return { currentUser };
};

const AgentTrainingPage = compose(
  connect(mapStateToProps),
  injectIntl
)(AgentTrainingPageComponent);

export default AgentTrainingPage;
