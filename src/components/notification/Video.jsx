import { useEffect, useState, useRef, useCallback } from "react";

import "../../App.css";
import defaultVideo from "../../assets/defaultVideo.mp4";
import axiosClient from "../../axiosClient";
import showToast from "./ShowtToast";

function Video() {
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [playVideos, setPlayVideos] = useState(false);
  const [loadingContent, setLoadingContent] = useState(null);
  const videoRef = useRef(null);
  const defaultVideoRef = useRef(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [playDefault, setPlayDefault] = useState(false);

  const reStart = () => {
    // Reset your application state if necessary
    setDownloadedVideos([]);
    setCurrentVideoIndex(null);
    setPlayVideos(false);
    setLoadingContent(null);
    setCurrentVideo(null);
    setPlayDefault(false);

    // Send a message to the main process to restart the app
    ipcRenderer.send("restart_app");
  };

  const handleProceed = async () => {
    setLoadingContent(true);
    setPlayDefault(false);
    setPlayVideos(false);
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
      setPlayDefault(true);
      showToast("Failed to fetch videos", "error");
    } finally {
    }
    setPlayVideos(true);
    setLoadingContent(false);
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

  const addVideoToQue = async (videos) => {
    console.log("videos: ", videos ? videos : "[]");
    if (!videos) return;
    let tempDownloaded = downloadedVideos;

    console.log("tempDownloaded before loop: ", tempDownloaded);
    let flag = 0;

    for (const video of videos) {
      const tempPath = localStorage.getItem(video.public_id) || null;
      console.log("video: ", video, " tempPath: ", tempPath);
      if (video.show_adv == true && !tempPath) {
        const localPath = await downloadVideos(
          video.secure_url,
          video.public_id
        );

        if (localPath) {
          video.localPath = localPath;
          tempDownloaded.push(video);
          localStorage.setItem(video.public_id, localPath);
          flag = 1;
        }
      }
    }

    console.log("tempDownloaded after loop: ", tempDownloaded);
    if (downloadVideos.length == 0 && flag == 1) {
      //reStart();
      setCurrentVideo(tempDownloaded[0]);
      setCurrentVideoIndex(0);
    }

    setDownloadedVideos(tempDownloaded);

    if (flag == 1) {
      setPlayDefault(false);
      setPlayVideos(true);
    }
  };

  const callIntervaleAPI = async () => {
    console.log("callIntervaleAPI");
    let tempVideos = [];
    try {
      const res = await axiosClient.get(
        `video/get/by/location/id/6830114362e775e471a0bd7d`
      );

      const videos = res?.data?.result || [];

      tempVideos = videos;
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

    addVideoToQue(tempVideos);
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

    const interval = setInterval(() => {
      callIntervaleAPI();
    }, 10000);
    return () => clearInterval(interval);
  }, [downloadedVideos]);

  const playVideo = useCallback(async () => {
    if (!videoRef.current || !currentVideo) return;

    try {
      videoRef.current.currentTime = 0; // Reset to start
      await videoRef.current.play();
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

    for (let i in downloadedVideos) {
      const path = await localStorage.getItem(downloadedVideos[i].public_id);
      if (!path) {
        deleteVideoLocally(
          downloadedVideos[i].public_id,
          downloadedVideos[i].localPath
        );
      }
    }

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
        setDownloadedVideos((prev) => prev.filter((v) => v.public_id !== id));
      }
    } catch (error) {
      console.error("Error deleting video:", error);
    }
    setPlayVideos(true);

    toggleFullScreen();

    return;
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
    console.log("downloadedVideos: ", downloadedVideos);

    if (downloadedVideos.length > 0 && !playVideos) {
      console.log("switching to downloaded videos");
      setPlayVideos(true);
      setPlayDefault(false);
      setCurrentVideo(downloadedVideos[0]);
      setCurrentVideoIndex(0);
      toggleFullScreen();
    } else {
      console.log("switching to default videos");
      setPlayVideos(true);
      setPlayDefault(true);
      toggleFullScreenForDefault();
      setCurrentVideo(defaultVideo);
    }
  }, [downloadedVideos]);

  useEffect(() => {
    if (downloadedVideos.length >= 1 && playDefault === true) {
      console.log("Switching from default video to real video");
      setPlayVideos(true);
      setPlayDefault(false);
      setCurrentVideo(downloadedVideos[0]);
      setCurrentVideoIndex(0);
      toggleFullScreen();
    }
  }, [downloadedVideos, playDefault]);

  useEffect(() => {
    console.log("playVideos: ", playVideos);
    console.log("playDefault: ", playDefault);
    console.log("loadingContent: ", loadingContent);
  }, [playVideos, playDefault, loadingContent]);

  const toggleFullScreenForDefault = () => {
    if (defaultVideoRef.current) {
      const enterFullscreen =
        defaultVideoRef.current.requestFullscreen ||
        defaultVideoRef.current.webkitRequestFullscreen ||
        defaultVideoRef.current.msRequestFullscreen;

      if (enterFullscreen) {
        enterFullscreen.call(defaultVideoRef.current).catch((err) => {
          console.error("Error attempting to enable full-screen mode:", err);
        });
      }
    }
  };

  useEffect(() => {
    console.log("downloadedVideos: ", downloadedVideos);
  }, [downloadedVideos]);

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
              src={
                downloadVideos.length > 0
                  ? `file://${currentVideo?.localPath}`
                  : defaultVideo
              }
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
          downloadedVideos.length <= 0 &&
          playVideos == true &&
          playDefault == true
            ? "d-block"
            : "d-none"
        }`}
      >
        <video
          key={defaultVideo}
          ref={defaultVideoRef}
          autoPlay
          muted
          playsInline
          src={currentVideo}
          loop
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            pointerEvents: "none",
          }}
          controls={false}
        />
      </div>
      <div
        className={`${
          loadingContent == true &&
          downloadedVideos.length == 0 &&
          playVideos == false &&
          playDefault == false
            ? "d-none"
            : "d-block"
        } d-flex align-items-center justify-content-center vh-100 fw-bold text-secondary fs-1`}
        key={loadingContent}
      >
        Want To Grow Your Business Call On 1234567890
      </div>
    </div>
  );
}

export default Video;
