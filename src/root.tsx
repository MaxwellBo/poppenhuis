import './index.css';
import './App.css';

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

export function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 
                    ############
                      ##            ##
                    ##                ##
                  ##                    ##
                 ##    #####    #####    ##
                ##    #  x  #  #  x  #    ##
-------####---------------- #  # --------------####---------
|                           #  #                           |
|                            ##                            |
|                                                          |
|                                                          |
|                      KILROY WAS HERE                     |
|                                                          |
|                                                          |
-----------------------------------------------------------
      */}
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="description" content="a digital dollhouse" />
        <meta name="author" content="Max Bo" />
        <title>poppenhuis</title>

        <meta name="title" content="poppenhuis" />
        <meta name="description" content="a digital dollhouse" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://poppenhu.is/" />
        <meta property="og:title" content="poppenhuis" />
        <meta property="og:description" content="a digital dollhouse" />
        <meta property="og:image" content="https://poppenhu.is/og.png" />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://poppenhu.is/" />
        <meta property="twitter:title" content="poppenhuis" />
        <meta property="twitter:description" content="a digital dollhouse" />
        <meta property="twitter:image" content="https://poppenhu.is/og.png" />

        {/* Favicons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#fdf5e6" />

        <Meta />
        <Links />
      </head>
      <body>
        <div id="root">
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
        
        {/* Simple Analytics */}
        <script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
        <noscript>
          <img 
            src="https://queue.simpleanalyticscdn.com/noscript.gif" 
            alt="" 
            referrerPolicy="no-referrer-when-downgrade" 
          />
        </noscript>
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}


export function ErrorBoundary({ error }: any) {
  if (isRouteErrorResponse(error)) {
    return (
      <div id="error-page">
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div id="error-page">
        <h1>Fatal error</h1>
        <p>This page has thrown an unrecoverable error:</p>
        <br />
        <p>
          <pre>
            {error.message}
            <br />
            <br />
            {error.stack}
          </pre>
        </p>
        <br />
        <p>Please reach out to <a href="https://twitter.com/_max_bo_">me on Twitter</a>, and I'll push a fix.</p>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}