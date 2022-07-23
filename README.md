# Drawboard

## Introduction

[Drawboard](https://drawboardapp.netlify.app) is a collaborative digital drawing and notes taking web application which helps people across the globe to connect and exchange information via this platform.

It is not simply a drawing software but it also has a feature to share your drawings and other work that you draw on the canvas with other people across the globe in real time.

## How To Use

To clone and run this application you'll need [Git](https://git-scm.com), [NodeJS](https://nodejs.org/en) and [Yarn](https://yarnpkg.com) installed on your system. Commands to run after installing these dependencies :

```bash
# Clone this repository
$ git clone https://github.com/jatinkh25/drawboard_frontend

# Go to the repository folder
$ cd drawboard_frontend

# Install dependencies
$ yarn install

# Run the app
$ yarn dev

```

## Key Technologies

### Frontend

- Drawboard is made using [ReactJS](https://reactjs.org) as a frontend framework. ( actually a library ).
- It uses the HTML [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) element for providing the canvas/whiteboard for drawing various shapes and other things on it.
- It uses [Socket.IO](https://socket.io) library both in frontend and backend for real time transmission of data between users on the same link.

### Backend

- Backend of Drawboard is made using [ExpressJS]() as a backend framework.
- It uses [MongoDB](https://www.mongodb.com) as a database management system for storing the information of elements present on the canvas.

## Key Features

Users can :

1. Do freehand drawing as well as draw elements such as lines and rectangles.
2. Change color and width of stroke of the drawing.
3. Resize and change position of elements after drawing using 'Select' option.
4. Undo and Redo their changes done on the canvas.
5. Collaborate with other people and exchange information between users on same link in real time.

For smooth and rich drawing experience Drawboard uses [`perfect-freehand`](https://www.npmjs.com/package/perfect-freehand) package.

## Credits

1. Icon Credits - [Icons8](https://icons8.com/)
2. Color Credits - [Pigment Plate](https://pigmentplate.web.app)

## Future Plans

- Include Authentication for users.
- Attach documents to user accounts.
