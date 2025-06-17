import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../../components';
import { useHistory } from 'react-router-dom';
import { updateTrainingProfile } from '../../../ducks/user.duck'; // Adjust the import path as needed
import { useDispatch } from 'react-redux';
import { trainingSteps } from '../config';
import { ChevronRight } from 'lucide-react';
import { FormattedMessage } from '../../../util/reactIntl';
import { externalEndpoints } from '../config';

const NextStepButton = ({ nextStepReady, currentStep, currentUser, onProgressUpdate }) => {

  const history = useHistory();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);

  const lastStep = currentStep === 'complete';

  if(lastStep){
    nextStepReady = true;
  }

  const handleClick = async () => {
    
    setIsLoading(true);
    if (!nextStepReady) return;

    const currentStepIndex = trainingSteps.findIndex(s => s.routeName === currentStep);
    const nextStepIndex = currentStepIndex + 1;
    
    const nextStepRouteName = lastStep ? '/listings' : `/agent/training/${trainingSteps[nextStepIndex].routeName}`;

    const userTraining = currentUser?.attributes?.profile?.publicData?.training || { step: 0 };

    //there's no need to update database nor zapier if user is just revisiting the same step
    if (userTraining.completed || userTraining.step > currentStepIndex + 1) {
      console.log('user is just revisiting the same step');
      history.push(nextStepRouteName);
      onProgressUpdate({
        clearMessage: true
      });
      setIsLoading(false);
      return;
    }


    if (nextStepIndex < trainingSteps.length) {

      // Update user's publicData.training step
      if (userTraining.step === currentStepIndex + 1) {
        userTraining.step = nextStepIndex + 1;
      }

    } else {

      // Mark training as complete
      userTraining.completed = true;
      console.log('Training complete');

    }

    try {
      dispatch(updateTrainingProfile({public: userTraining}));
    
    } catch (error) {
      console.error('Error updating training profile:', error);
      // Handle the error, e.g., show a notification to the user
    }

    history.push(nextStepRouteName);
    onProgressUpdate({
      clearMessage: true
    });
    setIsLoading(false);

    //call zapier silent webhook inclusive of all the user data
    const userData = {
      email: currentUser?.attributes?.email,
      id: currentUser?.id.uuid,
      firstName: currentUser?.attributes?.profile?.firstName,
      lastName: currentUser?.attributes?.profile?.lastName,
      location: currentUser?.attributes?.profile?.publicData?.userLocation,
      phoneNumber: currentUser?.attributes?.profile?.protectedData?.phoneNumber,
      trainingStepName: currentStep, //the step we just completed
      trainingStepNumber: userTraining.step - 1, //the step we just completed
      trainingCompleted: userTraining.completed,
    };

    const params = new URLSearchParams(userData).toString();
    const zapierURL = `${externalEndpoints.zapierWebhook}?${params}`;
    console.log('sending zapier userData', zapierURL);

    fetch(zapierURL, {
      method: "GET",
      mode: "no-cors" // critical!
    });

  };

  return (
    <Button disabled={!nextStepReady || isLoading} onClick={handleClick}>
      {lastStep ?
      <>
        <FormattedMessage id="AgentTraining.nextButtonCompleteLabel" /> <ChevronRight />
        </>
       : 
        <>
          <FormattedMessage id="AgentTraining.nextButtonLabel" /> <ChevronRight />
        </>
      }
    </Button>
  );
};

NextStepButton.propTypes = {
  nextStepReady: PropTypes.bool.isRequired,
  currentStep: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
  onProgressUpdate: PropTypes.func.isRequired
};

export default NextStepButton; 