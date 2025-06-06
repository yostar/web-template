import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '../../../util/reactIntl';

import {YoutubeEmbed} from '../../../containers/PageBuilder/Primitives/YoutubeEmbed/YoutubeEmbed';
import {H2} from '../../../components';
import PlacesSearch from './PlacesSearch/PlacesSearch';

import css from './TrainingCalls.module.css';


const TrainingCalls = ({ currentUser, youtubeVideoId, onProgressUpdate }) => {

    const [placeCount, setPlaceCount] = useState(() => {
        const savedCount = localStorage.getItem('placeCount');
        return savedCount ? parseInt(savedCount, 10) : 0;
    });

    const handlePlaceSelected = (place) => {
        //console.log('Selected place:', place);
        setPlaceCount(prevCount => {
            const newCount = prevCount + 1;
            localStorage.setItem('placeCount', newCount);
            return newCount;
        });
        //console.log('placeCount', placeCount);
        onProgressUpdate({
            percentage: (placeCount / 10) * 100,
            message: placeCount > 9 ? `${placeCount} calls made 🎉` : `${placeCount}/10 calls made`
        });
    };
;
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
            userLocation={userLocation}
            userEmail={userEmail}
        />

    </div>
  );
};

TrainingCalls.propTypes = {
  currentUser: PropTypes.object,
  youtubeVideoId: PropTypes.string.isRequired,
  onProgressUpdate: PropTypes.func,
};

export default TrainingCalls; 