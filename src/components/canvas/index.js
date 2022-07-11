// image credits @https://iconscout.com/icons & @https://www.onlinewebfonts.com/icon
import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { ReactComponent as Eraser } from "../../assets/eraser.svg";
import { ReactComponent as Pen } from "../../assets/pen.svg";
import { ReactComponent as Rectangle } from "../../assets/rectangle.svg";
import { ReactComponent as Selection } from "../../assets/selection.svg";
import { ReactComponent as Line } from "../../assets/line.svg";
import {
  getElementAtCursor,
  getCursorForAction,
  getResizedCoordinates,
  adjustElementCoordinates,
  adjustmentRequired,
} from "../../utils";
import { useElementState } from "../../hooks/element_state";
import "./styles.css";

//webrtc
export default function Canvas() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [selectedMode, setSelectedMode] = useState("pen");
  const [strokeWidth] = useState(4);
  const [elements, setElements, undo, redo] = useElementState([]);
  const [iconsClickedState, setIconsClickedState] = useState([
    true,
    ...Array(4).fill(false),
  ]);
  const [action, setAction] = useState("none");
  const [selectedElement, setSelectedElement] = useState(null);
  const width = window.innerWidth * 0.98;
  const height = window.innerHeight * 0.95;

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.width = window.innerWidth * 0.98;
    canvas.height = window.innerHeight * 0.95;

    const context = canvas.getContext("2d");
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    contextRef.current = context;
  }, [strokeWidth]);

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
        case "rectangle":
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

  useEffect(() => {
    const undoRedoFunction = (event) => {
      if (event.ctrlKey) {
        if (event.key === "z") {
          undo();
        } else if (event.key === "y") {
          redo();
        }
      }
    };
    document.addEventListener("keydown", undoRedoFunction);
    return () => {
      document.removeEventListener("keydown", undoRedoFunction);
    };
  }, [undo, redo]);

  const onMouseDownHandler = (e) => {
    const { clientX, clientY } = e;
    const boundingRect = canvasRef.current.getBoundingClientRect();

    //getting mouse coordinates with respect to canvas
    const mouseX = clientX - boundingRect.left;
    const mouseY = clientY - boundingRect.top;

    if (selectedMode === "select") {
      //getting the element at the position of cursor
      const element = getElementAtCursor(mouseX, mouseY, elements);
      if (element) {
        if (element.type === "pen") {
        } else {
          const offsetX = mouseX - element.x1;
          const offsetY = mouseY - element.y1;
          setSelectedElement({ ...element, offsetX, offsetY });
        }

        if (element.position === "inside") {
          setAction("moving");
          setElements(elements);
        } else {
          setAction("resizing");
          setElements(elements);
        }
      }
      return;
    }

    //comes here if element has to drawn
    contextRef.current.beginPath();
    contextRef.current.moveTo(mouseX, mouseY);
    const element = {
      id: elements.length,
      x1: mouseX,
      y1: mouseY,
      type: selectedMode,
    };
    //adding new element in the elements array
    setElements([...elements, element]);
    // setSelectedElement(element);
    setAction("drawing");
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
        e.target.style.cursor = element
          ? getCursorForAction(element.position)
          : "default";
      }
      return;
    }

    if (action === "drawing") {
      updateElement({ x2: x, y2: y });
    } else if (action === "moving") {
      // const element = getElementAtCursor(x, y, elements);
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
    } else {
      //comes here if action === "resizing"
      const { id, type, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = getResizedCoordinates(
        x,
        y,
        position,
        coordinates
      );
      updateElement({ id, x1, y1, x2, y2, type });
    }
  };

  const onMouseUpHandler = (e) => {
    if (selectedElement === null) {
      setAction("none");
      return;
    }
    const index = selectedElement.id;
    const { id, type } = elements[index];
    if (
      (action === "drawing" || action === "resizing") &&
      adjustmentRequired(type)
    ) {
      const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
      updateElement({ id, x1, y1, x2, y2, type });
    }
    setAction("none");
    setSelectedElement(null);
  };

  const updateElement = (element, overwriteLastElement = true) => {
    const elementsCopy = [...elements];
    let id = element.id;
    if (id === null || id === undefined) {
      id = elements.length - 1;
    }
    const updatedElement = { ...elementsCopy[id], ...element };
    const { x2, y2, type } = updatedElement;
    switch (type) {
      case "line":
      case "rectangle":
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

    setElements(elementsCopy, overwriteLastElement);
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
        setSelectedMode("rectangle");
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
            iconsClickedState[3]
              ? "svg_icon rectangle click"
              : "svg_icon rectangle"
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
