import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from '../../../components';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { Headset} from 'lucide-react'
import css from './TopbarButton.module.css';

const AgentTrainingButton = () => {
  const history = useHistory();
  const location = useLocation();

  const handleAgentTrainingClick = () => {
    history.push('/agent/training/videos');
  };

  const isTrainingPage = location.pathname.includes('/agent/training');
  console.log("isTrainingPage", isTrainingPage);
  return (
    <div className={css.root}>
      <Button
        className={classNames(css.button, { [css.active]: isTrainingPage })}
        onClick={handleAgentTrainingClick}
      >
        <Headset/> <FormattedMessage id="TopbarButton.agentTraining"/>
      </Button>
    </div>

  );
};

export default AgentTrainingButton;
