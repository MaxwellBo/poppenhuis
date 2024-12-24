import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, useRouteError } from "react-router";
import { RouterProvider } from "react-router/dom";
import UsersPage, { loader as usersPageLoader } from './routes/UsersPage.tsx';
import UserPage, { loader as userPageLoader } from './routes/UserPage.tsx';
import CollectionPage, { loader as collectionPageLoader } from './routes/CollectionPage.tsx';
import ItemPage, { loader as itemPageLoader } from './routes/ItemPage.tsx';
import WallLabelPage, { loader as wallLabelPageLoader } from './routes/WallLabelPage.tsx';

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
      {
        path: ":userId/:collectionId/:itemId/label",
        element: <WallLabelPage />,
        // @ts-ignore
        loader: wallLabelPageLoader
      },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
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
      <p>Please reach out to gi<a href="https://twitter.com/_max_bo_">me on Twitter</a>, and I'll push a fix.</p>
    </div>
  );
}
