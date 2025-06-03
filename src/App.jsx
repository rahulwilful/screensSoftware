import { useState } from "react";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";
import "./App.css";

function App() {
  const [downloadedVideos, setDownloadedVideos] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [proceeded, setProceeded] = useState(false);

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
          showToast(`Downloaded: ${video.public_id}`);
        } catch (err) {
          console.error(`Download failed for ${video.public_id}`, err);
          showToast(`Failed to download ${video.public_id}`, "error");
        }
      }

      setDownloadedVideos(downloaded);
      setProceeded(true);
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

  return (
    <div className="container">
      {!proceeded && (
        <button onClick={handleProceed} disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Proceed"}
        </button>
      )}

      {proceeded && (
        <>
          <h2>Downloaded Videos</h2>
          {downloadedVideos.length === 0 ? (
            <p>No videos downloaded.</p>
          ) : (
            downloadedVideos.map((video) => (
              <div key={video.public_id} className="video-card">
                <video width="300" controls src={`file://${video.localPath}`} />
                <p>{video.public_id}</p>
                <button onClick={() => handleDelete(video.localPath)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default App;
