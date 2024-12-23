import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import { ErrorPage, App, UserPage, ItemPage, UsersPage, CollectionPage, WallLabelPage } from './App.tsx';
import { loadUser, loadUsers, loadItem, loadCollection } from './manifest.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    // @ts-ignore
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        element: <UsersPage />,
        loader: loadUsers,
      },
      {
        path: ":userId",
        element: <UserPage />,
        // @ts-ignore
        loader: loadUser,
      },
      {
        path: ":userId/:collectionId",
        element: <CollectionPage />,
        // @ts-ignore
        loader: loadCollection,
      },
      {
        path: ":userId/:collectionId/:itemId",
        element: <ItemPage />,
        // @ts-ignore
        loader: loadItem,
      },
      {
        path: ":userId/:collectionId/:itemId/label",
        element: <WallLabelPage />,
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
