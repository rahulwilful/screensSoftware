import React, { useRef, useState } from "react";

const Video = (video) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [file, setFile] = useState(null);
  const videoRef = useRef(null);

  const playAgain = () => {
    if (
      videoRef.current &&
      currentVideoIndex !== null &&
      downloadedVideos[currentVideoIndex]?.localPath
    ) {
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Error attempting to play video:", error);
        });
      }
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      const enterFullscreen =
        videoRef.current.requestFullscreen ||
        videoRef.current.webkitRequestFullscreen ||
        videoRef.current.msRequestFullscreen;

      if (enterFullscreen) {
        enterFullscreen.call(videoRef.current).catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
        });
      }
    }
  };

  return (
    <>
      <video
        key={renderKey}
        ref={videoRef}
        autoPlay
        muted
        playsInline
        src={`file://${currentVideo.localPath}`}
        onEnded={playNextVideo}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
        controls={false}
      />
    </>
  );
};

export default Video;
