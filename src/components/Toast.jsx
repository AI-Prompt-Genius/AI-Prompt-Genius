import { useState, useEffect } from "react";
import { CheckIcon } from "./icons/Icons.jsx";

function Toast({ message }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const toastTimer = setTimeout(() => {
      setVisible(false);
    }, 3000);

    return () => {
      clearTimeout(toastTimer);
    };
  }, []);

  return (
    <div
      className={`toast bordernone w-fit z-1000 ${visible ? "show" : "hide"}`}
    >
      <div className="alert flex bg-accent text-[#ffffff]">
        <span>
          <CheckIcon></CheckIcon>
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}

export default Toast;
