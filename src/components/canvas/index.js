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
  const [penClick, setPenClick] = useState(false);
  const [iconsClickedState, setIconsClickedState] = useState([true, false * 4]);

  const width = window.innerWidth * 0.98;
  const height = window.innerHeight * 0.95;

  const penSizes = [];
  for (let i = 2; i <= 20; ++i) {
    penSizes.push(i);
  }
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.98;
    canvas.height = window.innerHeight * 0.95;
    const context = canvas.getContext("2d");
    context.lineWidth = strokeWidth;
    contextRef.current = context;
  }, [strokeWidth]);

  useEffect(() => {
    if (!canvasRef || !canvasRef.current || !contextRef || !contextRef.current)
      return;
    const inMemCanvas = document.createElement("canvas");
    const inMemCtx = inMemCanvas.getContext("2d");
    inMemCanvas.width = canvasRef.current.width;
    inMemCanvas.height = canvasRef.current.height;
    inMemCtx.drawImage(canvasRef.current, 0, 0);
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.98;
    canvas.height = window.innerHeight * 0.95;
    const dx = canvas.width - inMemCanvas.width;
    const dy = canvas.height - inMemCanvas.height;

    contextRef.current.lineWidth = strokeWidth;
    if (dx > 0) {
      contextRef.current.drawImage(
        inMemCanvas,
        dx > 0 ? dx / 2 : 0,
        dy > 0 ? dy / 2 : 0
      );
    } else {
      contextRef.current.drawImage(
        inMemCanvas,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  }, [width, height, strokeWidth]);

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
        <button onClick={() => setPenClick(!penClick)}>Click</button>
      </div>
    </>
  );
}
