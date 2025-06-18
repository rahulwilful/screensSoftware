import { useEffect, useRef, useState } from "react";
import defaultVideo from "../../assets/defaultVideo.mp4";
import "../../App.css";
import axiosClient from "../../axiosClient";

function DefaultVideo({ toggleDefault }) {
  const defaultVideoRef = useRef(null);

  const toggleFullScreen = () => {
    /*  if (defaultVideoRef.current) {
      const enterFullscreen =
        defaultVideoRef.current.requestFullscreen ||
        defaultVideoRef.current.webkitRequestFullscreen ||
        defaultVideoRef.current.msRequestFullscreen;

      if (enterFullscreen) {
        enterFullscreen.call(defaultVideoRef.current).catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
        });
      }
    } */
  };

  useEffect(() => {
    toggleFullScreen();
  }, []);

  const callIntervaleAPI = async () => {
    console.log("callIntervaleAPI");
    let tempVideos = [];
    try {
      const res = await axiosClient.get(
        `video/get/by/location/id/6830114362e775e471a0bd7d`
      );
      console.log("res: ", res);

      if (res?.data?.result) {
        toggleDefault(false);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      callIntervaleAPI();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fullscreen-video-container">
      <video
        ref={defaultVideoRef}
        autoPlay
        loop
        muted
        playsInline
        src={defaultVideo}
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
