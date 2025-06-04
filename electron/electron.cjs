const path = require("path");
const fs = require("fs");
const https = require("https");
const { protocol } = require("electron");

const { app, BrowserWindow, ipcMain, shell } = require("electron");

const isDev = process.env.IS_DEV === "true";

// Define the video directory path
const videoDir = path.join(app.getPath("userData"), "videos");

// Ensure the directory exists
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 650,
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false, // 🚫 important for security
      webSecurity: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: "deny" };
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "../dist/index.html")}`
  );
}

app.whenReady().then(() => {
  protocol.registerFileProtocol("app", (request, callback) => {
    const url = request.url.substr(6); // remove 'app://'
    const filePath = path.normalize(`${app.getPath("userData")}/videos/${url}`);
    callback(filePath);
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// ✅ Download video file using secure_url
ipcMain.handle("download-video", async (event, { url, fileName }) => {
  const downloadPath = path.join(app.getPath("userData"), "videos");

  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }

  const filePath = path.join(downloadPath, fileName);

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(() => resolve(filePath));
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => reject(err.message));
      });
  });
});

// ❌ Delete downloaded video
ipcMain.handle("delete-video", async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    return false;
  }
});

//get downloaded files
ipcMain.handle("get-downloaded-videos", async (event) => {
  try {
    console.log("Fetching video files from directory:", videoDir);

    if (!fs.existsSync(videoDir)) {
      console.error("Directory does not exist:", videoDir);
      return [];
    }

    const files = fs.readdirSync(videoDir);
    console.log("Files found in directory:", files);

    const videoFiles = files
      .filter((file) => file.endsWith(".mp4"))
      .map((file) => ({
        public_id: path.basename(file, ".mp4"),
        localPath: path.join(videoDir, file),
      }));

    console.log("Filtered video files:", videoFiles);

    return videoFiles;
  } catch (err) {
    console.error("Error reading video directory:", err);
    return [];
  }
});
