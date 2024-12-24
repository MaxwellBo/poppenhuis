import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, useRouteError } from "react-router";
import { RouterProvider } from "react-router/dom";

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
        lazy: () => import('./routes/UsersPage.tsx').then(convert),
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
        lazy: () => import('./routes/WallLabelPage.tsx').then(convert),
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
