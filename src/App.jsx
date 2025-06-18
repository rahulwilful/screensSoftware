import { useEffect, useState, useRef, useCallback } from "react";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";
import "./App.css";
import Video from "./components/notification/Video";
import DefaultVideo from "./components/notification/DefaultVideo";

function App() {
  const [playDefault, setPlayDefault] = useState(false);

  const toggleDefault = (toggle) => {
    if (toggle == true) {
      console.log("playing defaultVideo");
    } else {
      console.log("playing Videos");
    }
    setPlayDefault(toggle);
  };

  return (
    <div>
      {playDefault == true ? (
        <DefaultVideo toggleDefault={toggleDefault} playDefault={playDefault} />
      ) : (
        <Video toggleDefault={toggleDefault} playDefault={playDefault} />
      )}
    </div>
  );
}

export default App;
