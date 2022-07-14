// image credits @https://iconscout.com/icons & @https://www.onlinewebfonts.com/icon
import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { getStroke } from "perfect-freehand";
import { ReactComponent as Eraser } from "../../assets/eraser.svg";
import { ReactComponent as Pen } from "../../assets/pen.svg";
import { ReactComponent as Rectangle } from "../../assets/rectangle.svg";
import { ReactComponent as Selection } from "../../assets/selection.svg";
import { ReactComponent as Line } from "../../assets/line.svg";
import { ReactComponent as Stroke } from "../../assets/stroke.svg";
import {
  getElementAtCursor,
  getCursorForAction,
  getResizedCoordinates,
  adjustElementCoordinates,
  adjustmentRequired,
  getSvgPathFromStroke,
} from "../../utils";
import { io } from "socket.io-client";
import { useElementState } from "../../hooks/use-element-state";
import "./styles.css";

//webrtc
export default function Canvas() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [selectedMode, setSelectedMode] = useState("pen");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [mousePressed, setMousePressed] = useState(false);
  const [strokeHover, setStrokeHover] = useState(false);
  const [elements, setElements, undo, redo] = useElementState([]);
  const [iconsClickedState, setIconsClickedState] = useState([
    true,
    ...Array(4).fill(false),
  ]);
  const [action, setAction] = useState("none");
  const [selectedElement, setSelectedElement] = useState(null);
  const [socket, setSocket] = useState();

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext("2d");
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    contextRef.current = context;
  }, [strokeWidth]);

  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || socket === undefined) return;

    socket.on("get-elements-change", (data) => {
      if (data !== null) {
        setElements(data);
      }
    });
  }, [socket]);

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
      contextRef.current.lineWidth = element.strokeWidth;
      switch (element.type) {
        case "pen":
          const stroke = getStroke(element.points, {
            size: element.strokeWidth + 3,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.55,
          });
          contextRef.current.fillStyle = element.strokeColor;
          const pathData = getSvgPathFromStroke(stroke);
          contextRef.current.fill(new Path2D(pathData));
          break;
        case "line":
          contextRef.current.lineCap = "butt";
          contextRef.current.strokeStyle = element.strokeColor;
          contextRef.current.moveTo(element.x1, element.y1);
          contextRef.current.lineTo(element.x2, element.y2);
          break;
        case "rectangle":
          contextRef.current.strokeStyle = element.strokeColor;
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
      event.preventDefault();

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

  useEffect(() => {
    const mouseDown = () => setMousePressed(true);
    const mouseUp = () => setMousePressed(false);

    document.querySelector("canvas").addEventListener("mousedown", mouseDown);
    document.querySelector("canvas").addEventListener("mouseup", mouseUp);

    return () => {
      document
        .querySelector("canvas")
        .removeEventListener("mousedown", mouseDown);
      document.querySelector("canvas").removeEventListener("mouseup", mouseUp);
    };
  }, []);

  const onMouseDownHandler = (e) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    const boundingRect = canvasRef.current.getBoundingClientRect();

    //getting mouse coordinates with respect to canvas
    const mouseX = clientX - boundingRect.left;
    const mouseY = clientY - boundingRect.top;

    if (selectedMode === "eraser") {
      const eraElement = getElementAtCursor(mouseX, mouseY, elements);
      if (eraElement && eraElement.position === "inside") {
        const newElements = elements.filter(
          (element) => element.id !== eraElement.id
        );
        setElements(newElements);

        socket.emit("elements-change", newElements);
      }
      return;
    }
    if (selectedMode === "select") {
      //getting the element at the position of cursor
      const element = getElementAtCursor(mouseX, mouseY, elements);
      if (element) {
        if (element.type === "pen") {
          const xOffsets = element.points.map((point) => mouseX - point.x);
          const yOffsets = element.points.map((point) => mouseY - point.y);
          setSelectedElement({ ...element, xOffsets, yOffsets });
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
    let element = null;
    if (selectedMode === "pen") {
      element = {
        id: elements.length,
        points: [{ x: mouseX, y: mouseY }],
        type: selectedMode,
        strokeColor: strokeColor,
        strokeWidth: strokeWidth,
      };
    } else {
      element = {
        id: elements.length,
        x1: mouseX,
        y1: mouseY,
        type: selectedMode,
        strokeColor: strokeColor,
        strokeWidth: strokeWidth,
      };
    }

    //adding new element in the elements array
    setElements([...elements, element]);
    setSelectedElement(element);
    setAction("drawing");
  };

  const onMouseMoveHandler = (e) => {
    e.preventDefault();
    const { clientX, clientY } = e;
    const boundingRect = canvasRef.current.getBoundingClientRect();
    const mouseX = clientX - boundingRect.left;
    const mouseY = clientY - boundingRect.top;

    if (selectedMode === "eraser" && mousePressed) {
      const eraElement = getElementAtCursor(mouseX, mouseY, elements);
      if (eraElement && eraElement.position === "inside") {
        const newElements = elements.filter(
          (element) => element.id !== eraElement.id
        );
        setElements(newElements);

        socket.emit("elements-change", newElements);
      }
      return;
    }

    //if user not drawing or element is not moving
    const element = getElementAtCursor(mouseX, mouseY, elements);
    if (action === "none") {
      if (selectedMode === "eraser") {
        e.target.style.cursor = element ? "pointer" : "default";
      } else if (selectedMode === "select") {
        e.target.style.cursor = element
          ? getCursorForAction(element.position)
          : "default";
      }
      return;
    }

    if (action === "drawing") {
      const id = elements.length - 1;
      updateElement({ id: id, x2: mouseX, y2: mouseY });
    } else if (action === "moving") {
      if (selectedElement.type === "pen") {
        const newPoints = selectedElement.points.map((_, index) => ({
          x: mouseX - selectedElement.xOffsets[index],
          y: mouseY - selectedElement.yOffsets[index],
        }));
        const elementsCopy = [...elements];
        elementsCopy[selectedElement.id] = {
          ...elementsCopy[selectedElement.id],
          points: newPoints,
        };
        setElements(elementsCopy, true);
      } else {
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
    } else {
      //comes here if action === "resizing"
      const { id, type, position, ...coordinates } = selectedElement;
      const { x1, y1, x2, y2 } = getResizedCoordinates(
        mouseX,
        mouseY,
        position,
        coordinates
      );
      updateElement({ id, x1, y1, x2, y2, type });
    }
  };

  const onMouseUpHandler = (e) => {
    e.preventDefault();
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
    socket.emit("elements-change", elements);
    setSelectedElement(null);
    setAction("none");
  };

  const updateElement = (element, overwriteLastElement = true) => {
    const elementsCopy = [...elements];
    let id = element.id;
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
        throw new Error("Selected Option not identified.");
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

  const onWidthClickHandler = (e, width) => {
    e.preventDefault();
    setStrokeWidth(width);
    setStrokeHover(false);
  };

  const strokeColorsArray = [
    { name: "black", value: "#000000" },
    { name: "pink", value: "#e91e63" },
    { name: "yellow", value: "#ffc107" },
    { name: "blue", value: "#00bcd4" },
    { name: "peach", value: "#FF677D" },
  ];

  const colorComp = strokeColorsArray.map((color) => {
    return (
      <div
        key={color.value}
        onClick={() => setStrokeColor(color.value)}
        className={[
          `color ${color.name}`,
          strokeColor === color.value ? "selected_color" : null,
        ].join(" ")}
      ></div>
    );
  });

  const strokeWidthArray = Array(19)
    .fill()
    .map((_, idx) => 2 + idx);
  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDownHandler}
        onMouseUp={onMouseUpHandler}
        onMouseMove={onMouseMoveHandler}
      ></canvas>

      <div
        className="options_container"
        onMouseLeave={() => setStrokeHover(false)}
      >
        <div className="color_container">{colorComp}</div>
        <div className="stroke_menu_container">
          <div
            className="svg_icon stroke"
            onMouseOver={() => setStrokeHover(true)}
          >
            <Stroke />
          </div>
          <div
            className={[
              "stroke_menu_wrapper",
              strokeHover ? "show" : null,
            ].join(" ")}
            onMouseOver={() => setStrokeHover(true)}
            onMouseLeave={() => setStrokeHover(false)}
          >
            <ul className="stroke_width_menu">
              {strokeWidthArray.map((num) => {
                return (
                  <li
                    key={num}
                    className="stroke_menu_option"
                    onClick={(e) => onWidthClickHandler(e, num)}
                  >
                    <span>{num}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
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
