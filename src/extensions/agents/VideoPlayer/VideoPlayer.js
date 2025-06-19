import React, { useEffect, useState, useRef } from 'react';
import { FormattedMessage } from '../../../util/reactIntl';

import { SecondaryButton } from '../../../components';

import css from './VideoPlayer.module.css';

const YouTubePlayer = ({ videoId, playlistId, onProgressUpdate }) => {
  const [videoTitle, setVideoTitle] = useState('loading...');
  const titleRef = useRef(null);
  const [progress, setProgress] = useState({ currentVideo: 0, totalVideos: 0, percentage: 0 });
  const [showProgress, setShowProgress] = useState(false);
  const [player, setPlayer] = useState(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let progressInterval;

    const initializePlayer = () => {
      console.log('initializePlayer', videoId, playlistId);
      
      // Check if we've already tried reloading too many times
      const reloadAttempts = parseInt(localStorage.getItem('youtubeReloadAttempts') || '0');
      if (reloadAttempts >= 2) {
        console.log('Too many reload attempts, showing fallback');
        setShowFallback(true);
        localStorage.removeItem('youtubeReloadAttempts');
        return;
      }
      
      // Validate video ID before creating player
      if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
        console.error('Invalid video ID provided');
        return;
      }

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
          
          // Increment reload attempts
          const currentAttempts = parseInt(localStorage.getItem('youtubeReloadAttempts') || '0');
          localStorage.setItem('youtubeReloadAttempts', (currentAttempts + 1).toString());
          
          // Clear YouTube cookies
          clearYouTubeCookies();
          
          // Reload the page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          // For other errors, just show the fallback
          setShowFallback(true);
        }
      }
    };

    const clearYouTubeCookies = () => {
      try {
        // Get all cookies on the current domain
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const [name] = cookie.split('=');
          const cookieName = name.trim();
          
          // Clear the specific YouTube cookies that are most likely to cause the "Invalid video id" error
          if (cookieName && (
            cookieName.startsWith('__Secure-') ||
            cookieName.startsWith('VISITOR_INFO') ||
            cookieName.startsWith('LOGIN_INFO') ||
            cookieName === 'GPS' ||
            cookieName === 'PREF' ||
            cookieName === 'YSC' ||
            cookieName === 'VISITOR_PRIVACY_METADATA'
          )) {
            // Delete cookie by setting expiration to past date on current domain
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
          }
        });
        
        console.log('YouTube cookies cleared from current domain');
      } catch (e) {
        console.warn('Error clearing YouTube cookies:', e);
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
    if (player && typeof player.playVideo === 'function') {
      player.playVideo();
    }
  };

  const handleFallbackClick = () => {
    window.open(`https://www.youtube.com/playlist?list=${playlistId}`, '_blank');
    onProgressUpdate({ percentage: 100, message: 'Continue when you are done watching the videos on YouTube' });
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
      {showFallback && (
        <div className={css.fallback}>
          We had a problem loading the video. 
          <SecondaryButton onClick={handleFallbackClick}>
            Watching the videos on YouTube
          </SecondaryButton>
        </div>
      )}
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
