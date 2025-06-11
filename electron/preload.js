const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  downloadVideo: (url, fileName) =>
    ipcRenderer.invoke("download-video", { url, fileName }),
  deleteVideo: (filePath) => ipcRenderer.invoke("delete-video", filePath),
  getDownloadedVideos: () => ipcRenderer.invoke("get-downloaded-videos"),
  restartApp: () => ipcRenderer.send("restart_app"),
});
