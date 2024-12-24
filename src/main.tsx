import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import {
  createBrowserRouter,
  useRouteError,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import CollectionPage from './routes/CollectionPage.tsx';
import ItemPage from './routes/ItemPage.tsx';

function convert(m: any) {
  let {
    default: Component,
    ...rest
  } = m;
  return {
    ...rest,
    Component,
  };
}

const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import('./routes/App.tsx').then(convert),
    errorElement: <ErrorPage />,
    children: [
      {
        path: "",
        lazy: () => import('./routes/App.tsx').then(convert),
      },
      {
        path: ":userId",
        lazy: () => import('./routes/UserPage.tsx').then(convert),
      },
      {
        path: ":userId/:collectionId",
        lazy: () => import('./routes/CollectionPage.tsx').then(convert),
      },
      {
        path: ":userId/:collectionId/:itemId",
        lazy: () => import('./routes/ItemPage.tsx').then(convert),
      },
      {
        path: ":userId/:collectionId/:itemId/label",
        lazy: () => import('./routes/LabelPage.tsx').then(convert),
      },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

