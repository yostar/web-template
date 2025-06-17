import React from 'react';
import PropTypes from 'prop-types';
import css from './TrainingQuiz.module.css';

const TrainingQuiz = ({ quizId, currentUser }) => {
   
  // console.log('currentUser', currentUser);
  const formUrl = `https://form.jotform.com/${quizId}?email=${encodeURIComponent(currentUser?.attributes?.email)}`;

  return (
    <div className={css.quizContainer}>
      <iframe
        className={css.quizIframe}
        src={formUrl}
        title="Training Quiz"
        width="100%"
        height="500px"
        frameBorder="0"
      />
    </div>
  );
};

TrainingQuiz.propTypes = {
  quizId: PropTypes.string.isRequired,
  currentUser: PropTypes.object,
};

export default TrainingQuiz; 