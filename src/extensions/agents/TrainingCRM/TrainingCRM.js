import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import {YoutubeEmbed} from '../../../containers/PageBuilder/Primitives/YoutubeEmbed/YoutubeEmbed';
import { updateTrainingProfile } from '../../../ducks/user.duck'; 
import { useDispatch } from 'react-redux';

import { H2, H4, Button } from '../../../components';
import { externalEndpoints } from '../config';

import css from './TrainingCRM.module.css';

const TrainingCRM = ({ currentUser, youtubeVideoId, onProgressUpdate, intl }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();

  const handleCrmApiKey = () => {
   
    if(!apiKey) {
        alert("Please enter your API key");
        return;
    }
    
    console.log("API Key:", apiKey);
    setIsLoading(true);

    onProgressUpdate({
        percentage: 50,
        message: intl.formatMessage({ id: 'AgentTraining.crmApiKeyLoading' })
    });
    
    dispatch(updateTrainingProfile({private: {closeApiKey: apiKey}}));

    
   setTimeout(() => {
    onProgressUpdate({
        percentage: 100,
        message: intl.formatMessage({ id: 'AgentTraining.crmApiKeySuccess' })
    });
  }, 2000);

  };

  return (
    <div className={css.root}>
        <H2 as="h3"><FormattedMessage id="AgentTraining.crmTitle" /></H2>
      
        <div className={css.youtubeContainer}>
            <YoutubeEmbed 
                youtubeVideoId={youtubeVideoId} 
                aspectRatio="16/9"
            />
        </div>

        <H4 as="h3"><FormattedMessage id="AgentTraining.crmSignupTitle" /></H4>
        <div className={css.signupSteps}>
            <ol>
                <li><a href={externalEndpoints.closeReferralLink} target="_blank" rel="noopener noreferrer">Sign up for a free 14 day trial</a></li>
                <li>After signing up, navigate to the <a href="https://app.close.com/settings/developer/api-keys/" target="_blank" rel="noopener noreferrer">API settings</a> page</li>
                <li>Create an API Key, then copy and paste it into the field below and click "Connect"</li>
            </ol>
        </div>

        <H4 as="h4"><FormattedMessage id="AgentTraining.crmApiKeyTitle" /></H4>
        <div className={css.apiKeyContainer}>

            <input
                className={css.apiKeyInput}
                type="text"
                name="crmApiKey"
                label="API Key"
                disabled={isLoading}
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
            type="submit" 
            className={css.apiKeyButton} 
            onClick={handleCrmApiKey}
            disabled={isLoading}
            ><FormattedMessage id="AgentTraining.crmApiKeyButton" /></Button>
        </div>
    </div>
  );
};

TrainingCRM.propTypes = {
  currentUser: PropTypes.object,
  onProgressUpdate: PropTypes.func,
  intl: intlShape.isRequired,
};

export default TrainingCRM; 