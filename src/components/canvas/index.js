import React, { useRef, useEffect, useState } from "react";
import { ReactComponent as Eraser } from "../../assets/eraser.svg";
import { ReactComponent as Pen } from "../../assets/pen.svg";
import { ReactComponent as Rectangle } from "../../assets/rectangle.svg";
import { ReactComponent as Selection } from "../../assets/selection.svg";
import { ReactComponent as Line } from "../../assets/line.svg";
import "./styles.css";

//https://iconscout.com/icons/
export default function Canvas() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedMode, setSelectedMode] = useState("pen");
  const [strokeWidth] = useState(4);
  // const [penClick, setPenClick] = useState(false);
  const [iconsClickedState, setIconsClickedState] = useState([true, false * 4]);

  const penSizes = [];
  for (let i = 2; i <= 20; ++i) {
    penSizes.push(i);
  }
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.lineWidth = strokeWidth;
    contextRef.current = context;
  }, [strokeWidth]);

  const startDrawing = (e) => {
    const { clientX, clientY } = e;
    contextRef.current.beginPath();
    const boundingRect = canvasRef.current.getBoundingClientRect();
    contextRef.current.moveTo(
      clientX - boundingRect.left,
      clientY - boundingRect.top
    );
    setIsDrawing(true);
  };

  const endDrawing = (e) => {
    setIsDrawing(false);
  };

  const draw = (e) => {
    if (!isDrawing) {
      return;
    }

    switch (selectedMode) {
      case "pen":
        contextRef.current.strokeStyle = "black";
        contextRef.current.lineWidth = strokeWidth;
        break;
      case "eraser":
        contextRef.current.strokeStyle = "white";
        contextRef.current.lineWidth = 25;
        break;
      default:
        contextRef.current.strokeStyle = "black";
        contextRef.current.lineWidth = strokeWidth;
    }

    const { clientX, clientY } = e;
    const boundingRect = canvasRef.current.getBoundingClientRect();
    contextRef.current.lineTo(
      clientX - boundingRect.left,
      clientY - boundingRect.top
    );
    contextRef.current.lineCap = "round";
    contextRef.current.stroke();
  };

  const changeIconStateHandler = (idx) => {
    const iconStateArr = Array(iconsClickedState.length).fill(false);
    iconStateArr[idx] = true;
    setIconsClickedState(iconStateArr);
    if (idx === 0) {
      setSelectedMode("pen");
    } else if (idx === 1) {
      setSelectedMode("eraser");
    } else if (idx === 1) {
      setSelectedMode("line");
    } else if (idx === 1) {
      setSelectedMode("rect");
    } else {
      setSelectedMode("select");
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
        width={window.innerWidth * 0.98}
        height={window.innerHeight * 0.95}
      ></canvas>

      {/* credits @images https://www.onlinewebfonts.com/icon */}
      <div className="options_container">
        <div
          className={
            iconsClickedState[0] ? "svg_icon pen click" : "svg_icon pen"
          }
          onClick={() => changeIconStateHandler(0)}
        >
          <Pen
            stroke={iconsClickedState[0] ? "#fff" : null}
            fill={iconsClickedState[0] ? "#fff" : "#000"}
          />
        </div>
        <div
          className={
            iconsClickedState[1] ? "svg_icon eraser click" : "svg_icon eraser"
          }
          onClick={() => changeIconStateHandler(1)}
        >
          <Eraser stroke={iconsClickedState[1] ? "#fff" : null} />
        </div>
        <div
          className={
            iconsClickedState[2] ? "svg_icon line click" : "svg_icon line"
          }
          onClick={() => changeIconStateHandler(2)}
        >
          <Line fill={iconsClickedState[2] ? "#fff" : "#000"} />
        </div>
        <div
          className={
            iconsClickedState[3] ? "svg_icon rect click" : "svg_icon rect"
          }
          onClick={() => changeIconStateHandler(3)}
        >
          <Rectangle
            stroke={iconsClickedState[3] ? "#fff" : "#000"}
            strokeWidth="15px"
            fill={iconsClickedState[3] ? "#fff" : "#000"}
          />
        </div>
        <div
          className={
            iconsClickedState[4] ? "svg_icon select click" : "svg_icon select"
          }
          onClick={() => changeIconStateHandler(4)}
        >
          <Selection
            color={iconsClickedState[4] ? "#fff" : "#000"}
            stroke={iconsClickedState[4] ? "#fff" : null}
            fill={iconsClickedState[4] ? "#fff" : "#000"}
          />
        </div>
      </div>
    </>
  );
}
