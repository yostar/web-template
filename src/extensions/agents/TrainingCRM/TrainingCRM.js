import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import {YoutubeEmbed} from '../../../containers/PageBuilder/Primitives/YoutubeEmbed/YoutubeEmbed';
import { updateTrainingProfile } from '../../../ducks/user.duck'; 
import { useDispatch } from 'react-redux';
import { Check, Info, TriangleAlert } from 'lucide-react';

import { H2, H4, Button } from '../../../components';
import { externalEndpoints } from '../config';

import css from './TrainingCRM.module.css';

const TrainingCRM = ({ currentUser, youtubeVideoId, onProgressUpdate, intl }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);

  const alreadyConnected = currentUser?.attributes?.profile?.privateData?.training?.closeApiKey && !wasSubmitted ? true : false;

  const dispatch = useDispatch();
  
  const handleCrmApiKey = async () => {
    
    
    if(!apiKey) {
        alert("Please enter your API key");
        return;
    }
    
    // Validate Close CRM API key format
    const apiKeyRegex = /^api_[a-zA-Z0-9]{18,22}\.[a-zA-Z0-9]{18,22}$/;
    if (!apiKeyRegex.test(apiKey)) {
        alert("Please enter a valid Close CRM API key. \n\nFormat: api_xxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxx\n\nYou have to use the 'copy to clipboard' feature right after creating the key. \n\nIf you closed the modal that displays the key, please create a new key.");
        return;
    }
    
    console.log("API Key:", apiKey);
    setIsLoading(true);
    setWasSubmitted(true);

    onProgressUpdate({
        percentage: 0,
        message: "Connecting to Close CRM...", 
        spinner: true
    });

    setTimeout(() => {
    onProgressUpdate({
            percentage: 50,
            message: "Adding your free leads...", 
            spinner: true
        });
    }, 5000);

    await assignLeadsToClose(apiKey, currentUser?.attributes?.email);

    onProgressUpdate({
        percentage: 80,
        message: "Finishing up...", 
        spinner: true
    });
    
    await dispatch(updateTrainingProfile({private: {closeApiKey: apiKey}}));

    
   setTimeout(() => {
    onProgressUpdate({
        percentage: 100,
        message: intl.formatMessage({ id: 'AgentTraining.crmApiKeySuccess' }),
        spinner: false
    });
  }, 100);

  };

  const assignLeadsToClose = async (apiKey, email) => {
    const endpoint = externalEndpoints.googleAppsScript;

    if(!apiKey || !email) {
        alert("Invalid API key and/or email");
        return;
    }
  
    try {
        const response = await fetch(externalEndpoints.closeLeadsWorker, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey, email })
          });
  
        const text = await response.text(); 

        if (!response.ok) {
        throw new Error(`Request failed: ${response.status} - ${text}`);
        }

    } catch (err) {
        console.error("❌ Error assigning leads:", err);
        alert("Something went wrong with gifting leads: " + err.message);
    }
  }

  return (
    <div className={css.root}>
        <H2 as="h3" className={css.title}><FormattedMessage id="AgentTraining.crmTitle" /></H2>
      
        <div className={css.youtubeContainer}>
            <YoutubeEmbed 
                youtubeVideoId={youtubeVideoId} 
                aspectRatio="16/9"
            />
        </div>

        {!alreadyConnected && (
            <>
            <H4 as="h4"><FormattedMessage id="AgentTraining.crmSignupTitle" /> <img className={css.crmLogo} src="https://cdn.prod.website-files.com/61717799a852418a278cfa9b/66267ac89a71da7e5c4cc963_logo-dark-nav.svg" alt="Close CRM Logo"  /></H4>
            <div className={css.signupSteps}>
                <ol>
                    <li><a href={externalEndpoints.closeReferralLink} target="_blank" rel="noopener noreferrer">Sign up for a free 14 day trial</a></li>
                    <li>After signing up, navigate to the <a href="https://app.close.com/settings/developer/api-keys/" target="_blank" rel="noopener noreferrer">API settings</a> page</li>
                    <li>Create an API Key, then copy and paste it into the field below</li>
                    <div className={css.important}>
                        <TriangleAlert/> 
                        <p><strong>You have to use the 'copy to clipboard' feature right after creating the key.</strong><br/> If you closed the modal that displays the key and forgot to copy it, create a new key.</p>
                    </div>
                </ol>
                
            </div>

            <H4 as="h4"><FormattedMessage id="AgentTraining.crmApiKeyTitle" /></H4>
            </>
        )}
        <div className={css.apiKeyContainer}>

            <input
                className={css.apiKeyInput}
                type="text"
                name="crmApiKey"
                label="API Key"
                disabled={isLoading || alreadyConnected}
                placeholder="api_xxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
            type="submit" 
            className={css.apiKeyButton} 
            onClick={handleCrmApiKey}
            disabled={isLoading || alreadyConnected}
            ><FormattedMessage id="AgentTraining.crmApiKeyButton" /></Button>
        </div>

        {alreadyConnected && (
            <>
            <div className={css.alreadyConnected}>
                <p><Check/> You already connected your Close CRM account.</p>
            </div>
            <p className={css.crmInfo}><Info /> Your workflows and emails will be set up within 24 hours if not already.</p>
            </>
        )}
    </div>
  );
};

TrainingCRM.propTypes = {
  currentUser: PropTypes.object,
  onProgressUpdate: PropTypes.func,
  intl: intlShape.isRequired,
};

export default TrainingCRM; 