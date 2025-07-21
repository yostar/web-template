import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useHistory } from 'react-router-dom';

import { FormattedMessage } from '../../../util/reactIntl';
import { H2, Button } from '../../../components';

import css from './TrainingQuiz.module.css';

const TrainingQuiz = ({ quizId, currentUser, onProgressUpdate }) => {
  const [attempts, setAttempts] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showQuiz, setShowQuiz] = useState(true);
  const [score, setScore] = useState(0);
   
  // console.log('currentUser', currentUser);
  const formUrl = `https://form.jotform.com/${quizId}?email=${encodeURIComponent(currentUser?.attributes?.email)}`;

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Load attempts from localStorage on component mount
  useEffect(() => {
    const score = queryParams.get('score') ? parseInt(queryParams.get('score'), 10) : 0;
    setScore(score);
    
    const storedAttempts = localStorage.getItem(`quiz_attempts_${quizId}`);
    if (storedAttempts) {
      const parsedAttempts = JSON.parse(storedAttempts);
      setAttempts(parsedAttempts);
      
      // Check if user is blocked
      if (parsedAttempts.length >= 3) {
        const lastAttempt = parsedAttempts[parsedAttempts.length - 1];
        const oneHourInMs = 60 * 60 * 1000;
        const timeSinceLastAttempt = Date.now() - lastAttempt.timestamp;
        
        if (timeSinceLastAttempt < oneHourInMs) {
          setIsBlocked(true);
          const remainingTime = oneHourInMs - timeSinceLastAttempt;
          setTimeRemaining(remainingTime);
        } else {
          // Reset attempts if more than 1 hour has passed
          localStorage.removeItem(`quiz_attempts_${quizId}`);
          setAttempts([]);
          setShowQuiz(true);
        }
      }
    }
    setIsInitialized(true);
  }, [quizId]);

  // Update countdown timer
  useEffect(() => {
    if (isBlocked && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            setIsBlocked(false);
            localStorage.removeItem(`quiz_attempts_${quizId}`);
            setAttempts([]);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, timeRemaining, quizId]);

  // Track failed attempt
  const trackFailedAttempt = () => {
    const newAttempt = {
      timestamp: Date.now(),
      score: score
    };
    
    const updatedAttempts = [...attempts, newAttempt];
    setAttempts(updatedAttempts);
    localStorage.setItem(`quiz_attempts_${quizId}`, JSON.stringify(updatedAttempts));
    
    if (updatedAttempts.length >= 3) {
      setIsBlocked(true);
      setTimeRemaining(60 * 60 * 1000); // 1 hour in milliseconds
    }
  };

  const storeLastScore = () => {
    localStorage.setItem(`last_score_${quizId}`, score);
  };

  const getLastScore = () => {
    return localStorage.getItem(`last_score_${quizId}`);
  };


  const history = useHistory();
  const rewatchVideos = () => {
    history.push("/agent/training/videos");
  };

  // Handle score changes - only track when score actually changes and is a new failed attempt
  useEffect(() => {
    // Wait until we've initialized and loaded attempts from localStorage
    if (!isInitialized) {
      return;
    }

    // Only track if:
    // 1. Score is a valid failed score (1-7)
    // 2. Not blocked
    if (score > 0 && score < 8 && !isBlocked) {
      trackFailedAttempt();
    } else if(score >= 8){
      storeLastScore();
    }
  }, [score, isBlocked, isInitialized]);

  // Remove score from URL query parameters if it exists
  useEffect(() => {
    if (queryParams.has('score')) {
      setShowQuiz(false);
      queryParams.delete('score');
      const newSearch = queryParams.toString();
      const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
      window.history.replaceState(null, '', newUrl);
    }

    const lastScore = getLastScore();
    if(lastScore){
      setScore(lastScore);
    }

    // Show success message
    if (score >= 8) {
      setTimeout(() => {
        onProgressUpdate({
          percentage: 100,
          message: "You're ready to make calls..."
        });
      }, 1000);
    }

  }, [location.pathname, location.search, score]);

  const formatTimeRemaining = (ms) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  // Show success message
  if (score >= 8) {
    return (
      <div className={css.quizSuccessContainer}>
        <H2 as="h3"><FormattedMessage id="AgentTraining.quizSuccessTitle" /></H2>
        <p><FormattedMessage id="AgentTraining.quizSuccessMessage" values={{ score: score }} /></p>
      </div>
    );
  }

  // Show blocked message
  if (isBlocked) {
    return (
      <div className={css.quizBlockedContainer}>
        <H2 as="h3"><FormattedMessage id="AgentTraining.quizBlockedTitle" /></H2>
        <p>
          <FormattedMessage 
            id="AgentTraining.quizBlockedTimeRemaining" 
            values={{ timeRemaining: formatTimeRemaining(timeRemaining) }} 
          />
        </p>
        <p>
          <FormattedMessage 
            id="AgentTraining.quizBlockedMessage" 
          />
        </p>
        <Button onClick={rewatchVideos}><FormattedMessage id="AgentTraining.quizRewatchVideos" /></Button>
      </div>
    );
  }

  // Show fail message
  if (!showQuiz && score > 0 && score < 8) {
    const attemptsLeft = 3 - attempts.length;
    return (
      <div className={css.quizFailContainer}>
        <H2 as="h3"><FormattedMessage id="AgentTraining.quizFailTitle" /></H2>
        <p><FormattedMessage id="AgentTraining.quizFailMessage" values={{ score: score }} /></p>
        <p>
          <FormattedMessage 
            id="AgentTraining.quizAttemptsLeft"  
            values={{ attemptsLeft: attemptsLeft }} 
          />
        </p>
        <Button onClick={() => setShowQuiz(true)}> <FormattedMessage id="AgentTraining.quizTryAgain" /></Button>

      </div>
    );
  }

  // Show quiz iframe
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
  onProgressUpdate: PropTypes.func,
};

export default TrainingQuiz; 