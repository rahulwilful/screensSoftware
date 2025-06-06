import { useEffect, useState, useRef } from "react";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";
import "./App.css";

function App() {
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [playVideos, setPlayVideos] = useState(true);
  const videoRef = useRef(null);
  const [renderKey, setRenderKey] = useState(true);

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
          localStorage.setItem(video.public_id, localPath);
        } catch (err) {
          console.error(`Download failed for ${video.public_id}`, err);
          showToast(`Failed to download ${video.public_id}`, "error");
        }
      }

      console.log("downloaded: ", downloaded);
      setDownloadedVideos(downloaded);

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

  const callIntervaleAPI = async () => {
    try {
      const res = await axiosClient.get(
        `video/get/by/location/id/6830114362e775e471a0bd7d`
      );

      const videos = res?.data?.result || [];
      if (videos.length > 0) {
        for (let i in videos) {
          if (videos[i].show_adv == false) {
            handleDelete(videos[i].public_id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  const consoleLogVideoFiles = async () => {
    try {
      const existing = await window.electron.getDownloadedVideos();

      if (existing.length === 0) {
        await handleProceed();
      } else {
        setDownloadedVideos(existing);
        if (existing.length > 0) {
          setCurrentVideoIndex(0);
        }
      }
    } catch (error) {
      console.error("Error fetching existing videos:", error);
      await handleProceed();
    }
  };

  useEffect(() => {
    console.log("Existing videos:", downloadedVideos);
    if (downloadedVideos.length > 0) {
      const interval = setInterval(() => {
        callIntervaleAPI();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [downloadedVideos]);

  const playAgain = () => {
    if (
      videoRef.current &&
      currentVideoIndex !== null &&
      downloadedVideos[currentVideoIndex]?.localPath
    ) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .catch((e) => console.error("Error attempting to play video:", e));
    }
  };

  const playNextVideo = () => {
    if (downloadedVideos.length <= 1) {
      playAgain();
      console.log("current video: ", downloadedVideos[currentVideoIndex]);
    } else {
      let temp = currentVideoIndex;
      if (currentVideoIndex < downloadedVideos.length - 1) {
        setCurrentVideoIndex(currentVideoIndex + 1);
        temp = temp + 1;
      } else {
        setCurrentVideoIndex(0);
        temp = 0;
      }
      console.log("current video: ", downloadedVideos[temp]);
    }
  };

  const handleDelete = async (id) => {
    console.log("handleDelete called , id", id);
    const path = localStorage.getItem(id);
    if (!path) {
      console.log("no video is present", id);
      return;
    }
    console.log("path: ", path);

    setDownloadedVideos((prev) => prev.filter((v) => v.public_id !== id));
    try {
      const res = await axiosClient.delete(`video/delete/${id}`);
      if (!res) {
        console.log("could not delete video");
        return;
      }

      const success = await window.electron.deleteVideo(path);

      if (success) {
        if (downloadedVideos[currentVideoIndex]?.public_id === id) {
          playNextVideo();
        }
        setDownloadedVideos((prev) => prev.filter((v) => v.public_id !== id));
        localStorage.removeItem(id);
      } else {
      }
      if (downloadedVideos[currentVideoIndex]?.public_id === id) {
        playNextVideo();
      }
    } catch (error) {
      console.error("Error deleting video:", error);
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
    consoleLogVideoFiles();
  }, []);

  useEffect(() => {
    if (currentVideoIndex !== null && videoRef.current) {
      toggleFullScreen();
    }
  }, [currentVideoIndex]);

  return (
    <div className="fullscreen-video-container">
      <div
        className={`${
          downloadedVideos.length > 0 && playVideos ? "d-block" : "d-none"
        }`}
      >
        {currentVideoIndex !== null &&
          downloadedVideos[currentVideoIndex]?.localPath && (
            <video
              key={renderKey}
              ref={videoRef}
              autoPlay
              muted
              playsInline
              src={`file://${downloadedVideos[currentVideoIndex]?.localPath}`}
              onEnded={playNextVideo}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
              }}
              controls={false}
            />
          )}
      </div>
      <div
        className={`${
          downloadedVideos.length > 0 ? "d-none" : "d-block"
        } d-flex align-items-center justify-content-center vh-100 fw-bold text-secondary fs-1`}
      >
        Loading Content
      </div>
    </div>
  );
}

export default App;
