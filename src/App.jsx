import { useEffect, useState, useRef, useCallback } from "react";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";
import "./App.css";
import defaultVideo from "./assets/defaultVideo.mp4";
import Video from "./components/notification/Video";

function App() {
  return (
    <div>
      <Video />
    </div>
  );
}

export default App;
