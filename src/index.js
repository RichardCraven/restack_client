import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import { BrowserRouter } from "react-router-dom";
import { BoardManager } from './utils/board-manager'

const boardManager = new BoardManager();

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App boardManager={boardManager}/>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
