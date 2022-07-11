export const getDistance = (a, b) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

export const isPointNearLine = (x1, y1, x2, y2, x, y, maxDistance = 1) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };
  const offset = getDistance(a, b) - (getDistance(a, c) + getDistance(b, c));
  return Math.abs(offset) < maxDistance ? "inside" : null;
};

export const isCursorWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;
  switch (type) {
    case "line":
      return isPointNearLine(x1, y1, x2, y2, x, y);
    case "rect":
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      const maxX = Math.max(x1, x2);
      const maxY = Math.max(y1, y2);
      const inside =
        x >= minX && x <= maxX && y >= minY && y <= maxY ? "inside" : null;
      return inside;
    case "pen":
      const betweenAnyPoint = element.points.some((point, index) => {
        const nextPoint = element.points[index + 1];
        if (!nextPoint) return false;
        return (
          isPointNearLine(
            point.x,
            point.y,
            nextPoint.x,
            nextPoint.y,
            x,
            y,
            5
          ) != null
        );
      });
      return betweenAnyPoint ? "inside" : null;
    case "text":
      return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    default:
      throw new Error(`Type not recognised: ${type}`);
  }
};

export const getElementAtCursor = (x, y, elements) => {
  return elements
    .map((element) => ({
      ...element,
      position: isCursorWithinElement(x, y, element),
    }))
    .find((element) => element.position !== null);
};
