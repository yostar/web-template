import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from '../../../components';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { GraduationCap} from 'lucide-react';
import { trainingSteps } from '../config';

import css from './TopbarButton.module.css';

const AgentTrainingButton = ({currentStep}) => {
  const history = useHistory();
  const location = useLocation();

  const currentStepIndex =currentStep ? currentStep -1 : 0;

  const handleAgentTrainingClick = () => {
    history.push(`/agent/training/${trainingSteps[currentStepIndex].routeName}`);
  };

  const isTrainingPage = location.pathname.includes('/agent/training');
  console.log("isTrainingPage", isTrainingPage);
  return (
    <div className={css.root}>
      <Button
        className={classNames(css.button, { [css.active]: isTrainingPage })}
        onClick={handleAgentTrainingClick}
      >
        <GraduationCap/> <FormattedMessage id="TopbarButton.agentTraining"/>
      </Button>
    </div>

  );
};

export default AgentTrainingButton;
