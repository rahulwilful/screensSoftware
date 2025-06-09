import { useEffect, useState, useRef, useCallback } from "react";
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
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

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
        const localPath = await downloadVideos(
          video.secure_url,
          video.public_id
        );

        if (localPath) {
          console.log("localPath: ", localPath || " ");
          downloaded.push({ ...video, localPath });
          localStorage.setItem(video.public_id, localPath);
        }
      }

      console.log("downloaded: ", downloaded);
      setCurrentVideo(downloaded[0]);
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

  const downloadVideos = async (secure_url, public_id) => {
    try {
      const localPath = await window.electron.downloadVideo(
        secure_url,
        `${public_id}.mp4`
      );

      return localPath;
    } catch (err) {
      console.error(`Download failed for ${video.public_id}`, err);
      showToast(`Failed to download ${video.public_id}`, "error");
      return null;
    }
  };

  const callIntervaleAPI = async () => {
    console.log("callIntervaleAPI");
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
        setCurrentVideo(existing[0]);
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

  const playVideo = useCallback(async () => {
    if (!videoRef.current || !currentVideo) return;

    try {
      videoRef.current.currentTime = 0; // Reset to start
      await videoRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback error:", err);
      // If playback fails, try again after a short delay
      setTimeout(playVideo, 1000);
    }
  }, [currentVideo]);

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

  // Improved playNextVideo that handles single video case
  const playNextVideo = useCallback(async () => {
    if (downloadedVideos.length === 0) return;

    const availableVideos = downloadedVideos.filter((v) =>
      localStorage.getItem(v.public_id)
    );

    if (availableVideos.length === 0) {
      setCurrentVideo(null);
      return;
    }

    // If only one video remains, keep playing it
    if (availableVideos.length === 1) {
      setCurrentVideo(availableVideos[0]);
      await playVideo();
      return;
    }

    // For multiple videos, play next in sequence
    const currentIndex = availableVideos.findIndex(
      (v) => v.public_id === currentVideo?.public_id
    );
    const nextIndex = (currentIndex + 1) % availableVideos.length;
    setCurrentVideo(availableVideos[nextIndex]);

    console.log(
      "(",
      currentIndex,
      " + 1) % ",
      availableVideos.length,
      " = ",
      (currentIndex + 1) % availableVideos.length
    );

    console.log(
      "availableVideos.length: ",
      availableVideos.length,
      "  currentIndex: ",
      currentIndex,
      " nextIndex: ",
      nextIndex
    );
  }, [downloadedVideos, currentVideo, playVideo]);

  const deleteVideoLocally = async (id, path) => {
    setPlayVideos(false);
    setIsProcessing(true);
    console.log("handleDelete called , id", id);

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
      } else {
      }
      if (downloadedVideos[currentVideoIndex]?.public_id === id) {
        playNextVideo();
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    }
    setPlayVideos(true);
    setIsProcessing(true);
    toggleFullScreen();
  };

  const handleDelete = async (id, path) => {
    console.log("handleDelete called , id", id);

    localStorage.removeItem(id);
  };

  useEffect(() => {
    consoleLogVideoFiles();
  }, []);

  useEffect(() => {
    if (currentVideoIndex !== null && videoRef.current) {
      toggleFullScreen();
    }
  }, [currentVideoIndex]);

  useEffect(() => {
    console.log("currentVideo: ", currentVideo);
  }, [currentVideo]);

  return (
    <div className="fullscreen-video-container">
      <div
        className={`${
          downloadedVideos.length > 0 && playVideos == true
            ? "d-block"
            : "d-none"
        }`}
      >
        {currentVideo &&
          currentVideoIndex !== null &&
          currentVideo?.localPath && (
            <video
              key={currentVideo}
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
