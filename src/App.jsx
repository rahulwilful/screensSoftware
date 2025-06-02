import { useEffect, useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import axiosClient from './axiosClient';
import showToast from './components/notification/ShowtToast';

function App() {
  const [image, setImage] = useState(null);

  const handleFileChange = event => {
    setImage(event.target.files[0]);
  };

  const getVideos = async () => {
    try {
      const res = await axiosClient.get(`video/get/by/location/id/6830114362e775e471a0bd7d`);

      console.log('res: ', res);
    } catch (error) {
      console.log('error: ', error);
    }
  };

  useEffect(() => {
    getVideos();
  }, []);

  return (
    <>
      <div>
        <form>
          <button type="button" onClick={getVideos}>
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
