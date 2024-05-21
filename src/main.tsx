import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorPage, App, loadUser, loadUsers, User, loadItem, Item, Users, loadCollection, Collection } from './App.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    // @ts-ignore
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <Users />,
        // @ts-ignore
        loader: loadUsers,
      },
      {
        path: ":userId",
        element: <User />,
        // @ts-ignore
        loader: loadUser,
      },
      {
        path: ":userId/:collectionId",
        element: <Collection />,
        // @ts-ignore
        loader: loadCollection,
      },
      {
        path: ":userId/:collectionId/:itemId",
        element: <Item />,
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
