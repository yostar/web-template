import React, { useEffect, useState, useRef } from 'react';
import { FormattedMessage } from '../../../util/reactIntl';

import css from './VideoPlayer.module.css';

const YouTubePlayer = ({ videoId, playlistId, onProgressUpdate }) => {
  const [videoTitle, setVideoTitle] = useState('loading...');
  const titleRef = useRef(null);
  const [progress, setProgress] = useState({ currentVideo: 0, totalVideos: 0, percentage: 0 });
  const [showProgress, setShowProgress] = useState(false);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    let progressInterval;

    const initializePlayer = () => {
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
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
      setPlayer(newPlayer);
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
          if (titleRef.current) {
            titleRef.current.style.transition = 'opacity 1s';
            titleRef.current.style.opacity = 1;
          }

        }, 1000);
      }
      
      updateVideoTitle(event.target);
    };

    const onPlayerStateChange = (event) => {
      if (!event.target || typeof event.target.getCurrentTime !== 'function') {
        console.error('Player is not ready');
        return;
      }

      if (event.data === YT.PlayerState.PLAYING) {
        updateVideoTitle(event.target);
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

    const updateVideoTitle = (playerInstance) => {
      const videoData = playerInstance.getVideoData();
      setVideoTitle(videoData.title);
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
    //console.log('handleOverlayClick', player);
    if (player && typeof player.playVideo === 'function') {
      player.playVideo();
    }
  };

  return (
    <div className={css.root}>
      <h4 ref={titleRef} className={css.title}>{videoTitle}</h4>
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
      <div className={css.playerWrapper}>
        <div id="player" className={css.player}></div>
        <div className={css.overlayTop}></div>
        <div className={css.overlayBottom}></div>
        <div className={css.overlayMiddle} onClick={handleOverlayClick}></div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
