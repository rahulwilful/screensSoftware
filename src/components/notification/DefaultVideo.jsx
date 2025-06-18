import { useEffect, useRef, useState, useCallback } from "react";
import defaultVideo from "../../assets/defaultVideo.mp4";
import "../../App.css";
import axiosClient from "../../axiosClient";

function DefaultVideo({ toggleDefault }) {
  const defaultVideoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullScreen = useCallback(() => {
    if (!defaultVideoRef.current) return;

    const videoElement = defaultVideoRef.current;

    // Check if already fullscreen first
    if (document.fullscreenElement === videoElement) return;

    const enterFullscreen =
      videoElement.requestFullscreen ||
      videoElement.webkitRequestFullscreen ||
      videoElement.msRequestFullscreen;

    if (enterFullscreen) {
      enterFullscreen
        .call(videoElement)
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          console.error("Fullscreen error:", err);
          setIsFullscreen(false);
        });
    }
  }, []);

  // Add event listeners for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Try fullscreen when video metadata loads
  const handleLoadedMetadata = () => {
    if (!isFullscreen) {
      toggleFullScreen();
    }
  };

  // Modified video element
  return (
    <div className="fullscreen-video-container">
      <video
        ref={defaultVideoRef}
        autoPlay
        loop
        muted
        playsInline
        src={defaultVideo}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleLoadedMetadata}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
        controls={false}
      />
    </div>
  );
}

export default DefaultVideo;
