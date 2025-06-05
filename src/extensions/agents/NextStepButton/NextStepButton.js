import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../../components';
import { useHistory } from 'react-router-dom';
import { updateTrainingProfile } from '../../../ducks/user.duck'; // Adjust the import path as needed
import { useDispatch } from 'react-redux';
import { trainingSteps } from '../config';
import { ChevronRight } from 'lucide-react';
import { FormattedMessage } from '../../../util/reactIntl';

const NextStepButton = ({ nextStepReady, currentStep, currentUser }) => {
  const history = useHistory();
  const dispatch = useDispatch();

  const handleClick = () => {
    if (!nextStepReady) return;

    const currentStepIndex = trainingSteps.findIndex(s => s.routeName === currentStep);
    const nextStepIndex = currentStepIndex + 1;

    const userTraining = currentUser?.attributes?.profile?.publicData?.training || { step: 0 };

    if (nextStepIndex < trainingSteps.length) {
      const nextStep = trainingSteps[nextStepIndex].routeName;

      // Update user's publicData.training step
      if (userTraining.step === currentStepIndex + 1) {
        userTraining.step = nextStepIndex + 1;
      }

      // Redirect to the next step
      //history.push(`/agent/training/${nextStep}`);
      document.location.href = `/agent/training/${nextStep}`;
    } else {
      // Mark training as complete
      userTraining.complete = true;
      console.log('Training complete');
    }

    // Dispatch the updateTrainingProfile action
    dispatch(updateTrainingProfile(userTraining));
  };

  return (
    <Button disabled={!nextStepReady} onClick={handleClick}>
      <FormattedMessage id="AgentTraining.nextButtonLabel" /> <ChevronRight />
    </Button>
  );
};

NextStepButton.propTypes = {
  nextStepReady: PropTypes.bool.isRequired,
  currentStep: PropTypes.string.isRequired,
  currentUser: PropTypes.object
};

export default NextStepButton; 