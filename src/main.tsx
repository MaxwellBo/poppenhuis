import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, useRouteError } from "react-router";
import { RouterProvider } from "react-router/dom";
import App from './routes/App.tsx';
import { FixedSpinner } from "./components/FixedSpinner.tsx";
import UsersPage, { loader as usersPageLoader } from './routes/UsersPage.tsx';
import UserPage, { loader as userPageLoader } from './routes/UserPage.tsx';
import CollectionPage, { loader as collectionPageLoader } from './routes/CollectionPage.tsx';
import ItemPage, { loader as itemPageLoader } from './routes/ItemPage.tsx';
import WallLabelPage, { loader as wallLabelPageLoader } from './routes/WallLabelPage.tsx';
import EmbedPage, { loader as embedPageLoader } from './routes/EmbedPage.tsx';

const router = createBrowserRouter([
  {
    path: ":userId/:collectionId/:itemId/embed",
    element: <EmbedPage />,
    // @ts-ignore
    loader: embedPageLoader
  },
  {
    path: ":userId/:collectionId/:itemId/label",
    element: <WallLabelPage />,
    // @ts-ignore
    loader: wallLabelPageLoader
  },
  {
    path: "/",
    errorElement: <ErrorPage />,
    element: <App />,
    children: [
      {
        path: "",
        element: <UsersPage />,
        loader: usersPageLoader,
      },
      {
        path: ":userId",
        element: <UserPage />,
        // @ts-ignore
        loader: userPageLoader,
      },
      {
        path: ":userId/:collectionId",
        element: <CollectionPage />,
        // @ts-ignore
        loader: collectionPageLoader,
      },
      {
        path: ":userId/:collectionId/:itemId",
        element: <ItemPage />,
        // @ts-ignore
        loader: itemPageLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <FixedSpinner />
  </React.StrictMode>
)


export function ErrorPage() {
  const error: any = useRouteError();

  return (
    <div id="error-page">
      <h1>Fatal error</h1>
      <p>This page has thrown an unrecoverable error:</p>
      <br />
      <pre>
        {error.statusText || error.message}
        <br />
        <br />
        {error.stack}
      </pre>
      <br />
      <p>Please reach out to <a href="https://twitter.com/_max_bo_">me on Twitter</a>, and I'll push a fix.</p>
    </div>
  );
}
