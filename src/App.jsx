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
  const [currentVideo, setCurrentVideo] = useState(null);

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

  const playNextVideo = async () => {
    let tempVideos = [...downloadedVideos];

    console.log("playNextVideo tempVideos before loop: ", tempVideos);

    // Filter out videos without a local path
    tempVideos = tempVideos.filter((video) => {
      const path = localStorage.getItem(video?.public_id);
      return path !== null;
    });

    console.log(
      " tempVideos.length ",
      tempVideos.length,
      "playNextVideo tempVideos after loop: ",
      tempVideos
    );

    if (tempVideos.length <= 1) {
      setCurrentVideo(tempVideos[0]);

      playAgain();
      console.log("current video: ", tempVideos[0]);
    } else {
      let tempIndex = currentVideoIndex;
      if (currentVideoIndex < tempVideos.length - 1) {
        tempIndex += 1;
      } else {
        tempIndex = 0;
      }

      // Ensure the video at tempIndex is defined
      if (tempVideos[tempIndex]) {
        setCurrentVideoIndex(tempIndex);
        setCurrentVideo(tempVideos[tempIndex]);
        console.log("current video: ", tempVideos[tempIndex]);
      } else {
        console.error("Video at index is undefined:", tempIndex);
      }
    }

    setDownloadedVideos(tempVideos);
  };

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
