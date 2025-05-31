import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import axiosClient from "./axiosClient";
import showToast from "./components/notification/ShowtToast";

function App() {
  const [image, setImage] = useState(null);

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!image) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("media", image);
    formData.append("client_id", "680932cc5670e44859d81c68");
    formData.append("location_id", "6830114362e775e471a0bd7d");
    formData.append("start_date", "2025-10-05");
    formData.append("end_date", "2025-10-07");

    /* let formData = {
      media: image,
      client_id: "680932cc5670e44859d81c68",
      location_id: "6830114362e775e471a0bd7d",
      start_date: "2025-10-05",
      end_date: "2025-10-07",
    }; */

    // Log the FormData entries
    /*   for (let [key, value] of formData.entries()) {
      console.log(key, value);
    } */

    try {
      console.log("formData: ", formData);
      const response = await axiosClient.post(`video/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Set the content type to multipart/form-data
        },
      });

      if (response) {
        showToast("Video Uploaded", "success");
        console.log("response: ", response);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast("Video Upload Failed", "error");
    }
  };

  return (
    <>
      <div>
        <form onSubmit={handleSubmit}>
          <input type="file" onChange={handleFileChange} />
          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
}

export default App;
