// image credits @https://iconscout.com/icons & @https://www.onlinewebfonts.com/icon
import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { ReactComponent as Eraser } from "../../assets/eraser.svg";
import { ReactComponent as Pen } from "../../assets/pen.svg";
import { ReactComponent as Rectangle } from "../../assets/rectangle.svg";
import { ReactComponent as Selection } from "../../assets/selection.svg";
import { ReactComponent as Line } from "../../assets/line.svg";
import { getElementAtCursor } from "../../utils";
import "./styles.css";

//webrtc
export default function Canvas() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [selectedMode, setSelectedMode] = useState("pen");
  const [strokeWidth] = useState(4);
  const [elements, setElements] = useState([]);
  const [iconsClickedState, setIconsClickedState] = useState([true, false * 4]);
  const [action, setAction] = useState("none");
  const [selectedElement, setSelectedElement] = useState(null);
  // const [mousePos, setMousePos] = useState();
  const width = window.innerWidth * 0.98;
  const height = window.innerHeight * 0.95;

  // useEffect(() => {
  //   if (
  //     !canvasRef ||
  //     !canvasRef.current ||
  //     !contextRef ||
  //     !contextRef.current ||
  //     !elements
  //   )
  //     return;
  //   function setMousePosition(e) {
  //     const { clientX, clientY } = e;
  //     const boundingRect = canvasRef.current.getBoundingClientRect();

  //     const x = clientX - boundingRect.left;
  //     const y = clientY - boundingRect.top;
  //     setMousePos({ x, y });
  //   }

  //   document
  //     .querySelector("canvas")
  //     .addEventListener("mousemove", setMousePosition);
  //   return () => {
  //     document
  //       .querySelector("canvas")
  //       .removeEventListener("mousemove", setMousePosition);
  //   };
  // }, []);

  //for setting up canvas
  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.width = window.innerWidth * 0.98;
    canvas.height = window.innerHeight * 0.95;

    const context = canvas.getContext("2d");
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    contextRef.current = context;
  }, [strokeWidth]);

  //for rendering all elements present in elements array
  useLayoutEffect(() => {
    if (
      !canvasRef ||
      !canvasRef.current ||
      !contextRef ||
      !contextRef.current ||
      !elements
    )
      return;

    //clearing the canvas before every rerender
    contextRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    for (let element of elements) {
      contextRef.current.beginPath();

      switch (element.type) {
        case "pen":
          contextRef.current.lineCap = "round";
          contextRef.current.moveTo(element.x1, element.y1);
          contextRef.current.lineTo(element.x2, element.y2);
          break;
        case "eraser":
          // contextRef.current.moveTo(element.x1, element.y1);
          // contextRef.current.lineTo(element.x2, element.y2);
          break;
        case "line":
          contextRef.current.lineCap = "butt";
          contextRef.current.moveTo(element.x1, element.y1);
          contextRef.current.lineTo(element.x2, element.y2);
          break;
        case "rect":
          contextRef.current.lineCap = "butt";
          contextRef.current.strokeRect(
            element.x1,
            element.y1,
            element.x2 - element.x1,
            element.y2 - element.y1
          );
          break;
        default:
          throw new Error("Selected Option not identified.");
      }

      contextRef.current.stroke();
    }
  }, [elements]);

  //for resizing the canvas
  useEffect(() => {
    if (!canvasRef || !canvasRef.current || !contextRef || !contextRef.current)
      return;

    //creating a new canvas element and context for saving in memory
    const inMemCanvas = document.createElement("canvas");
    const inMemCtx = inMemCanvas.getContext("2d");

    inMemCanvas.width = canvasRef.current.width;
    inMemCanvas.height = canvasRef.current.height;

    //saving the new canvas in memory as image
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

  const onMouseDownHandler = (e) => {
    const { clientX, clientY } = e;
    const boundingRect = canvasRef.current.getBoundingClientRect();

    //getting mouse coordinates with respect to canvas
    const x = clientX - boundingRect.left;
    const y = clientY - boundingRect.top;

    if (selectedMode === "select") {
      //getting the element at the position of cursor
      const element = getElementAtCursor(x, y, elements);
      if (element) {
        if (element.type === "pen") {
          const xOffsets = element.points.map((point) => clientX - point.x);
          const yOffsets = element.points.map((point) => clientY - point.y);
          setSelectedElement({ ...element, xOffsets, yOffsets });
        } else {
          const offsetX = x - element.x1;
          const offsetY = y - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }

        if (element.position === "inside") {
          setAction("moving");
        }
      }

      return;
    }

    //comes here if element has to drawn
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);

    //adding new element in the elements array
    setElements([
      ...elements,
      { id: elements.length, x1: x, y1: y, type: selectedMode },
    ]);

    setAction("drawing");
  };

  const onMouseUpHandler = (e) => {
    setAction("none");
  };

  const updateElement = (element) => {
    const elementsCopy = [...elements];
    let id = element.id;
    if (id === null || id === undefined) {
      id = elements.length - 1;
    }
    const updatedElement = { ...elementsCopy[id], ...element };
    const { x2, y2, type } = updatedElement;
    switch (type) {
      case "line":
      case "rect":
        elementsCopy[id] = updatedElement;
        break;
      case "pen":
        elementsCopy[id].points = [
          ...elementsCopy[id].points,
          { x: x2, y: y2 },
        ];
        break;
      default:
        throw new Error(`Type not recognised: ${type}`);
    }

    setElements(elementsCopy);
  };

  const onMouseMoveHandler = (e) => {
    const { clientX, clientY } = e;
    const boundingRect = canvasRef.current.getBoundingClientRect();

    const x = clientX - boundingRect.left;
    const y = clientY - boundingRect.top;

    //if user not drawing or element is not moving
    if (action === "none") {
      if (selectedMode === "select") {
        //changing the cursor if user is not drawing and is in select mode
        const element = getElementAtCursor(x, y, elements);
        e.target.style.cursor = element ? "all-scroll" : "default";
      }
      return;
    }

    if (action === "drawing") {
      updateElement({ x2: x, y2: y });
    } else {
      const element = getElementAtCursor(x, y, elements);
      e.target.style.cursor = element ? "all-scroll" : "default";
      const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - boundingRect.left - offsetX;
      const newY1 = clientY - boundingRect.top - offsetY;
      updateElement({
        id,
        x1: newX1,
        y1: newY1,
        x2: newX1 + width,
        y2: newY1 + height,
        type,
      });
    }
  };

  const changeIconStateHandler = (idx) => {
    const iconStateArr = Array(iconsClickedState.length).fill(false);
    iconStateArr[idx] = true;
    setIconsClickedState(iconStateArr);

    switch (idx) {
      case 0:
        setSelectedMode("pen");
        break;
      case 1:
        setSelectedMode("eraser");
        break;
      case 2:
        setSelectedMode("line");
        break;
      case 3:
        setSelectedMode("rect");
        break;
      case 4:
        setSelectedMode("select");
        break;
      default:
        throw new Error("Selected Option not identified.");
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDownHandler}
        onMouseUp={onMouseUpHandler}
        onMouseMove={onMouseMoveHandler}
      ></canvas>

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
