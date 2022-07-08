import React, { useRef, useEffect, useState } from "react";
import "./styles.css";

//https://iconscout.com/icons/
export default function Canvas() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedMode, setSelectedMode] = useState("pen");
  const [strokeWidth, setStrokeWidth] = useState(4);

  const toolbarOptions = [
    { id: "pen", value: "Pen" },
    { id: "eraser", value: "Erase" },
    { id: "select", value: "Select" },
  ];

  const penSizes = [];
  for (let i = 2; i <= 20; ++i) {
    penSizes.push(i);
  }
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.strokeStyle = "salmon";
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
    contextRef.current.stroke();
  };

  const toolbarComp = toolbarOptions.map((option) => {
    return (
      <span key={option.id} onClick={() => setSelectedMode(option.id)}>
        {option.value}
      </span>
    );
  });

  const strokeSizesComp = penSizes.map((option) => {
    return (
      <option key={option} value={option}>
        {option}
      </option>
    );
  });
  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
        width={window.innerWidth * 0.98}
        height={window.innerHeight * 0.95}
        style={{ strokeLinecap: "round" }}
      ></canvas>
      <div className="options_container">
        {toolbarComp}
        <select
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(e.target.value)}
        >
          {strokeSizesComp}
        </select>
      </div>
    </>
  );
}
