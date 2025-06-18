import { useEffect, useState, useRef, useCallback } from "react";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";
import "./App.css";
import Video from "./components/notification/Video";
import DefaultVideo from "./components/notification/DefaultVideo";

function App() {
  const [playDefault, setPlayDefault] = useState(false);
  const containerRef = useRef(null);

  const toggleDefault = (toggle) => {
    if (toggle == true) {
      console.log("playing defaultVideo");
    } else {
      console.log("playing Videos");
    }
    setPlayDefault(toggle);
  };

  useEffect(() => {
    const goFullScreen = () => {
      const el = containerRef.current;
      if (el) {
        const enterFullscreen =
          el.requestFullscreen ||
          el.webkitRequestFullscreen ||
          el.msRequestFullscreen;

        if (enterFullscreen) {
          enterFullscreen
            .call(el)
            .catch((err) => console.error("Fullscreen failed:", err));
        }
      }
    };

    goFullScreen(); // request fullscreen ONCE when app loads
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      {playDefault == true ? (
        <DefaultVideo toggleDefault={toggleDefault} playDefault={playDefault} />
      ) : (
        <Video toggleDefault={toggleDefault} playDefault={playDefault} />
      )}
    </div>
  );
}

export default App;
