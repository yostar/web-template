import React, { useEffect, useState, useRef } from 'react';
import { FormattedMessage } from '../../../util/reactIntl';

import css from './VideoPlayer.module.css';

const YouTubePlayer = ({ videoId, playlistId, onProgressUpdate, userTraining }) => {
  const [progress, setProgress] = useState({ currentVideo: 0, totalVideos: 0, percentage: 0 });
  const [showProgress, setShowProgress] = useState(false);
  const [player, setPlayer] = useState(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let progressInterval;

    const initializePlayer = () => {
      console.log('initializePlayer', videoId, playlistId);
      
      

      try {
        const newPlayer = new YT.Player('player', {
          videoId: videoId,
          playerVars: {
            listType: 'playlist',
            list: playlistId,
            enablejsapi: 1,
            rel: 0,
            controls: 1,
            showinfo: 0,
            loop: 0,
            modestbranding: 1,
            playsinline: 1,
            autoplay: 0,
            origin: window.location.origin,
            host: 'https://www.youtube-nocookie.com',
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
          }
        });
        setPlayer(newPlayer);
        
        // Clear reload attempts on successful initialization
        localStorage.removeItem('youtubeReloadAttempts');
      } catch (err) {
        console.error('Error initializing YouTube player:', err);
        
        // Check if this is the specific "Invalid video id" error
        if (err.message && err.message.includes('Invalid video id')) {
          console.log('Detected "Invalid video id" error, clearing YouTube cookies and reloading...');
         
          setShowFallback(true);

          //only force next step if necessary
          if(userTraining?.step === 1){
            setTimeout(() => {
              onProgressUpdate({ percentage: 100, message: 'Please watch all 20 videos before continuing' });
            }, 10000);
          }
        }

      }
    };


    const onPlayerError = (event) => {
      console.error('YouTube player error event:', event);
      
      // Silently retry once after a short delay
      setTimeout(() => {
        if (player) {
          try {
            player.destroy();
          } catch (e) {
            console.warn('Error destroying player:', e);
          }
        }
        setPlayer(null);
        initializePlayer();
      }, 3000);
    };

    const onPlayerReady = (event) => {
      if (!event.target || typeof event.target.getCurrentTime !== 'function') {
        console.error('Player is not ready');
        return;
      }

      const lastPosition = localStorage.getItem('lastPosition');
      const lastVideoIndex = localStorage.getItem('lastVideoIndex');
      if (lastVideoIndex) {
        event.target.playVideoAt(parseInt(lastVideoIndex, 10));
      }
      if (lastPosition) {
        setTimeout(() => {
          event.target.seekTo(parseFloat(lastPosition), true);
        }, 1000);
      }
    };

    const onPlayerStateChange = (event) => {
      if (!event.target || typeof event.target.getCurrentTime !== 'function') {
        console.error('Player is not ready');
        return;
      }

      if (event.data === YT.PlayerState.PLAYING) {
        updateProgress(event.target);

        // Start interval to update progress continuously
        progressInterval = setInterval(() => {
          updateProgress(event.target);
        }, 1000);
      } else {
        // Clear interval when video is paused or ended
        clearInterval(progressInterval);
        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
          const currentTime = event.target.getCurrentTime();
          const currentVideoIndex = event.target.getPlaylistIndex();
          localStorage.setItem('lastPosition', currentTime);
          localStorage.setItem('lastVideoIndex', currentVideoIndex);
        }
      }
    };


    const updateProgress = (playerInstance) => {
      const totalVideos = playerInstance.getPlaylist().length;
      const currentVideoIndex = playerInstance.getPlaylistIndex();
      const currentVideo = currentVideoIndex + 1;

      const currentTime = playerInstance.getCurrentTime();
      const duration = playerInstance.getDuration();

      // Calculate the progress within the current video
      const currentVideoProgress = currentTime / duration;
      const percentage = Math.ceil(((currentVideoIndex + currentVideoProgress) / totalVideos) * 100);

      const newProgress = { currentVideo, totalVideos, percentage };
      setProgress(newProgress);

      // Update showProgress based on the new progress values
      setShowProgress(currentVideo > 0 && totalVideos > 0 && percentage > 0);

      // Call the callback function to send progress data to the parent
      if (onProgressUpdate) {
        onProgressUpdate(newProgress);
      }
    };

    if (window.YT && window.YT.Player) {
      console.log('YT.Player is defined, initializing player');
      initializePlayer();
    } else {
      console.log('YT.Player is not defined, loading API');
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    }

    const playerElement = document.getElementById('player');
    
    return () => {
      if (player) {
        player.destroy();
      }
      clearInterval(progressInterval);
    };
  }, [videoId, playlistId, onProgressUpdate]);

  const handleOverlayClick = () => {
    if (player && typeof player.playVideo === 'function') {
      player.playVideo();
    }
  };

  return (
    <div className={css.root}>
      
      <div className={css.progress}>
            {showProgress && (
                <>
                <label>
                    <FormattedMessage 
                        id="VideoPlayer.videoCountLabel" 
                        values={{ currentVideo: progress.currentVideo, totalVideos: progress.totalVideos }} 
                    />
                </label>
                <label>
                    <FormattedMessage 
                        id="VideoPlayer.progressLabel" 
                        values={{ percentage: progress.percentage }}
                    />
                </label>
                </>
            )}
      </div>
      {showFallback && (
        <div className={css.playerWrapper}>
          <iframe 
            className={css.player}
            src={`https://www.youtube.com/embed/videoseries?si=6VHWq40Ap---Jdxb&amp;list=${playlistId}&rel=0&autoplay=1&modestbranding=1`} title="YouTube video player" 
            frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
          </div>
      )}

      <div className={showFallback ? css.hide : css.playerWrapper}>
        <div id="player" className={css.player}></div>
        <div className={css.overlayTop}></div>
        <div className={css.overlayBottom}></div>
        <div className={css.overlayMiddle} onClick={handleOverlayClick}></div>
      </div>
      
      
    </div>
  );
};

export default YouTubePlayer;
