import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorPage, App, ItemPage, ItemsListing, loadItem, loadItems } from './App.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { 
        path: "/", 
        element: <ItemsListing />, 
        loader: loadItems },
      {
        path: "items/:id",
        element: <ItemPage />,
        // @ts-ignore
        loader: loadItem,
      },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
