import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';

import {YoutubeEmbed} from '../../../containers/PageBuilder/Primitives/YoutubeEmbed/YoutubeEmbed';
import {H2} from '../../../components';
import PlacesSearch from './PlacesSearch/PlacesSearch';

import css from './TrainingCalls.module.css';


const TrainingCalls = ({ currentUser, youtubeVideoId, onProgressUpdate, intl }) => {

    const [placeCount, setPlaceCount] = useState(() => {
        const savedCount = localStorage.getItem('placeCount');
        return savedCount ? parseInt(savedCount, 10) : 0;
    });

    const handlePlaceSelected = (place) => {
        const newCount = placeCount + 1;
        setPlaceCount(newCount);
        localStorage.setItem('placeCount', newCount);

        onProgressUpdate({
            percentage: (newCount / 10) * 100,
            message: newCount > 9 ?   intl.formatMessage({ id: "AgentTraining.callMessageComplete"}, { placeCount : newCount }) : 
                                        intl.formatMessage({ id: "AgentTraining.callMessage" }, { placeCount : newCount })
        });
    };

    const userCountry = currentUser?.attributes?.profile?.publicData?.userCountry;
    const userLocation = currentUser?.attributes?.profile?.publicData?.userLocation;
    const userEmail = currentUser?.attributes?.email;

    return (
    <div className={css.root}>
        
        <H2 as="h3"><FormattedMessage id="AgentTraining.callTitle" /></H2>

        <div className={css.youtubeContainer}>
            <YoutubeEmbed 
                youtubeVideoId={youtubeVideoId} 
                aspectRatio="16/9"
            />
        </div>

        <PlacesSearch 
            onPlaceSelected={handlePlaceSelected}
            userLocation={`${userLocation}, ${userCountry}`}
            userEmail={userEmail}
        />

    </div>
  );
};

TrainingCalls.propTypes = {
  currentUser: PropTypes.object,
  youtubeVideoId: PropTypes.string.isRequired,
  onProgressUpdate: PropTypes.func,
  intl: intlShape.isRequired,
};

export default TrainingCalls; 