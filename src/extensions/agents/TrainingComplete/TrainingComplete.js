import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import { YoutubeEmbed } from '../../../containers/PageBuilder/Primitives/YoutubeEmbed/YoutubeEmbed';
import { H2} from '../../../components';
import css from './TrainingComplete.module.css';

const TrainingComplete = ({ youtubeVideoId, intl }) => {
  
  useEffect(() => {

    //clear last position and video index so if they return to videos they start from the beginning
    if(localStorage.getItem('lastPosition') || localStorage.getItem('lastVideoIndex')){
      localStorage.removeItem('lastPosition');
      localStorage.removeItem('lastVideoIndex');
    }

  }, []);
  return (
    <div className={css.root}>
      <H2 as="h3"><FormattedMessage id="AgentTraining.completeTitle" /></H2>
      
      <div className={css.youtubeContainer}>
        <YoutubeEmbed 
          youtubeVideoId={youtubeVideoId} 
          aspectRatio="16/9"
        />
      </div>


      <p><FormattedMessage id="AgentTraining.completeMessage" /></p>
      
    </div>
  );
};

TrainingComplete.propTypes = {
  youtubeVideoId: PropTypes.string.isRequired,
  intl: intlShape.isRequired,
};

export default TrainingComplete; 