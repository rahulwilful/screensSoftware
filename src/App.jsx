import { useEffect, useState, useRef } from "react";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";
import "./App.css";

function App() {
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const videoRef = useRef(null);

  const handleProceed = async () => {
    setIsProcessing(true);
    try {
      const res = await axiosClient.get(
        `video/get/by/location/id/6830114362e775e471a0bd7d`
      );
      console.log("links : ", res?.data?.result);

      const videos = res?.data?.result || [];
      const downloaded = [];

      for (const video of videos) {
        try {
          const localPath = await window.electron.downloadVideo(
            video.secure_url,
            `${video.public_id}.mp4`
          );

          console.log("localPath: ", localPath || " ");
          downloaded.push({ ...video, localPath });
          //showToast(`Downloaded: ${video.public_id}`);
        } catch (err) {
          console.error(`Download failed for ${video.public_id}`, err);
          showToast(`Failed to download ${video.public_id}`, "error");
        }
      }

      console.log("downloaded: ", downloaded);

      setDownloadedVideos(downloaded);

      // Automatically start playing videos in full view mode if there are videos
      if (downloaded.length > 0) {
        setCurrentVideoIndex(0);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      showToast("Failed to fetch videos", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (filePath) => {
    const success = await window.electron.deleteVideo(filePath);
    if (success) {
      setDownloadedVideos((prev) =>
        prev.filter((v) => v.localPath !== filePath)
      );
      showToast("Deleted successfully");
    } else {
      showToast("Failed to delete", "error");
    }
  };

  const consoleLogVideoFiles = async () => {
    try {
      const existing = await window.electron.getDownloadedVideos();
      console.log("Existing videos:", existing);
      if (existing.length === 0) {
        handleProceed();
      } else {
        setDownloadedVideos(existing);
        if (existing.length > 0) {
          setCurrentVideoIndex(0);
        }
      }
    } catch (error) {
      console.error("Error fetching existing videos:", error);
      handleProceed();
    }
  };

  const playNextVideo = () => {
    if (currentVideoIndex < downloadedVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      setCurrentVideoIndex(0); // Loop back to the first video
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
        });
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  useEffect(() => {
    console.log("useEffect triggered");
    consoleLogVideoFiles();
  }, []);

  useEffect(() => {
    if (currentVideoIndex !== null && videoRef.current) {
      toggleFullScreen();
    }
  }, [currentVideoIndex]);

  return (
    <div className="fullscreen-video-container">
      <div className={`${downloadedVideos.length > 0 ? "d-block" : "d-none"}`}>
        {currentVideoIndex !== null && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            src={`file://${downloadedVideos[currentVideoIndex].localPath}`}
            onEnded={playNextVideo}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none", // prevent any hover interaction
            }}
            controls={false}
          />
        )}
      </div>
      {/*  <div
        className={`${downloadedVideos.length > 0 ? "d-none" : "d-block"} fs-1`}
      >
        Loading Content
      </div> */}
      <div
        className={` d-flex align-items-center justify-content-center vh-100 fw-bold text-secondary fs-1`}
      >
        Loading Content
      </div>
    </div>
  );
}

export default App;
