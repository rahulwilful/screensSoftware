import { toast } from "react-toastify";
import "./ShowToast.css";

const showToast = (message, type = "default", duration = 1500) => {
  switch (type) {
    case "success":
      toast.success(message, {
        autoClose: duration,
      });
      break;
    case "error":
      toast.error(message, {
        autoClose: duration,
      });
      break;
    case "info":
      toast.info(message, {
        autoClose: duration,
      });
      break;
    case "warning":
      toast.warning(message, {
        autoClose: duration,
      });
      break;
    default:
      toast(message, {
        autoClose: duration,
      });
      break;
  }
};

export default showToast;
