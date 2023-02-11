import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import { BrowserRouter } from "react-router-dom";
import { BoardManager } from './utils/board-manager'
import { InventoryManager } from './utils/inventory-manager'
import { MapMaker } from './utils/map-maker'

const boardManager = new BoardManager();
const inventoryManager = new InventoryManager();
const mapMaker = new MapMaker();

ReactDOM.render(
  // <React.StrictMode>
    <BrowserRouter>
      <App boardManager={boardManager} inventoryManager={inventoryManager} mapMaker={mapMaker}/>
    </BrowserRouter>,
  // </React.StrictMode>,
  document.getElementById('root')
);
