import React, { useState, useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useParams, useHistory } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { IconSpinner } from '../../components';

import {
  H1,
  H2,
  Page,
  LayoutSingleColumn,
  SecondaryButton,
} from '../../components';

import { isScrollingDisabled } from '../../ducks/ui.duck';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ProgressBar from '../../extensions/transactionProcesses/components/ProgressBar/ProgressBar.js';
import YouTubePlayer from '../../extensions/agents/VideoPlayer/VideoPlayer';
import TrainingQuiz from '../../extensions/agents/TrainingQuiz/TrainingQuiz';
import TrainingCalls from '../../extensions/agents/TrainingCalls/TrainingCalls';
import TrainingCRM from '../../extensions/agents/TrainingCRM/TrainingCRM';
import TrainingComplete from '../../extensions/agents/TrainingComplete/TrainingComplete';

import NextStepButton from '../../extensions/agents/NextStepButton/NextStepButton';
import { trainingSteps, externalIds } from '../../extensions/agents/config';

import css from './AgentTrainingPage.module.css';

export const AgentTrainingPageComponent = props => {
  
  const { scrollingDisabled, intl, currentUser } = props;
  const { step } = useParams();

  const title = intl.formatMessage({ id: 'AgentTrainingPage.title' });

  const progressBarProcessName = 'AgentTraining';
  
  const steps = trainingSteps;
  
  const progressBarSteps = steps.map(step => step.displayName);

  const userTraining = currentUser?.attributes?.profile?.publicData?.training;
  //console.log('userTraining', userTraining);

  const progressBarStepInProgress = steps.findIndex(s => s.routeName === step);

  // Check if progressBarStepInProgress is undefined
  if (progressBarStepInProgress === -1) {
    return (
      <Page title="404 Not Found" scrollingDisabled={scrollingDisabled}>
        <LayoutSingleColumn
          className={css.pageRoot}
          mainColumnClassName={css.pageMainColumn}
          topbar={<TopbarContainer />}
          footer={<FooterContainer />}
        >
          <div className={css.root}>
            <H1 as="h1" className={css.heading}>404</H1>
            <H2 as="h2" className={css.title}>
              <FormattedMessage id="AgentTrainingPage.notFound" defaultMessage="Training Step Not Found" />
            </H2>
          </div>
        </LayoutSingleColumn>
      </Page>
    );
  }

  const currentStepNumber = steps.findIndex(s => s.routeName === step) + 1;
  
  const [nextStepReady, setNextStepReady] = useState(userTraining?.step > currentStepNumber); 
  const [progressMessage, setProgressMessage] = useState('');
  const [progressSpinner, setProgressSpinner] = useState(false);
  
  //console.log('nextStepReady', nextStepReady, userTraining?.step, currentStepNumber);
  //console.log('Current step from URL:', step);

  const history = useHistory();
  const handleBackClick = () => {
    const previousStep = steps[currentStepNumber - 2].routeName;
    setProgressMessage('');
    history.push(`/agent/training/${previousStep}`);
  };

  useEffect(() => {
    if (
      userTraining?.step > currentStepNumber || 
      (step === 'crm' && currentUser?.attributes?.profile?.privateData?.training?.closeApiKey)
    ) {
      setNextStepReady(true);
    } else {
      setNextStepReady(false);
    }

    //don't allow users in a step they havent reached
    if(userTraining?.step < currentStepNumber){
      //redirect user back to their correct current step
      const currentStep = steps[userTraining?.step - 1].routeName;
      history.push(`/agent/training/${currentStep}`);

    }

  }, [userTraining, currentStepNumber, step]);

  const handleProgressUpdate = (newProgress) => {
    console.log('Progress update:', newProgress);
    if(newProgress.percentage > 95 ){
      setNextStepReady(true);
    }
    if(newProgress.message){
      setProgressMessage(newProgress.message)
    }
    if(newProgress.clearMessage){
      setProgressMessage('')
      setProgressSpinner(false);
    }
    setProgressSpinner(newProgress.spinner || false);
    
  };

  

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
       
       <LayoutSingleColumn
        className={css.pageRoot}
        mainColumnClassName={css.pageMainColumn}
        topbar={<TopbarContainer />}
      >
        
        <ProgressBar
            steps={progressBarSteps}
            stateData={{ processName: progressBarProcessName }}
            stepInProgress={progressBarStepInProgress}
        />
        
        <div className={css.root}>

        <div className={css.container}>
            
            {step === 'videos' && (
                <YouTubePlayer 
                    videoId="agentTrainingVideos" 
                    playlistId={externalIds.youtubePlaylist}
                    onProgressUpdate={handleProgressUpdate}
                    userTraining={userTraining}
                />
            )}

            {step === 'quiz' && (
                <TrainingQuiz 
                    quizId={externalIds.jotformQuiz} 
                    currentUser={currentUser}
                    onProgressUpdate={handleProgressUpdate}
                />
            )}

            {step === 'calls' && (
              <TrainingCalls
                currentUser={currentUser}
                jotformId={externalIds.jotformCall}
                youtubeVideoId={externalIds.youtubeCall}
                onProgressUpdate={handleProgressUpdate}
                intl={intl}
              />

            )}

            {step === 'crm' && (
              <TrainingCRM
                currentUser={currentUser}
                onProgressUpdate={handleProgressUpdate}
                youtubeVideoId={externalIds.youtubeCRM}
                intl={intl}
              />
            )}

            {step === 'complete' && (
              <TrainingComplete
                youtubeVideoId={externalIds.youtubeComplete}
                intl={intl}
              />
            )}

            <div className={css.navButtonsContainer}>
              <div className={css.navButtons}>
                  
                  <SecondaryButton 
                  disabled={currentStepNumber === 1} 
                  className={css.backButton}
                  onClick={handleBackClick}
                  > 
                    <ChevronLeft /> <FormattedMessage id="AgentTraining.backButtonLabel" />

                  </SecondaryButton> 
                  
                  {progressMessage.length > 0 && (
                  <div className={css.progressMessage}>
                  
                    {progressSpinner && <IconSpinner className={css.progressSpinner} />}
                    {progressMessage}
                    
                  </div>
                  )}
                  
                  <div className={css.nextButton}>
                    <NextStepButton
                      nextStepReady={nextStepReady} 
                      currentStep={step} 
                      currentUser={currentUser} 
                      onProgressUpdate={handleProgressUpdate}
                    />
                  </div>
              </div>
            </div>

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
  return { currentUser, scrollingDisabled: isScrollingDisabled(state) };
};

const AgentTrainingPage = compose(
  connect(mapStateToProps),
  injectIntl
)(AgentTrainingPageComponent);

export default AgentTrainingPage;
