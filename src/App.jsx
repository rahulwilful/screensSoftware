import { useEffect, useState, useRef, useCallback } from "react";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";
import "./App.css";
import Video from "./components/notification/Video";
import DefaultVideo from "./components/notification/DefaultVideo";

function App() {
  const [playDefault, setPlayDefault] = useState(false);

  const toggleDefault = (toggle) => {
    setPlayDefault(toggle);
  };

  return (
    <div>
      {playDefault == true ? (
        <DefaultVideo toggleDefault={toggleDefault} />
      ) : (
        <Video toggleDefault={toggleDefault} />
      )}
    </div>
  );
}

export default App;
