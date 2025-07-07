import React from "react";
import { Outlet, useLocation, useNavigation } from "react-router";
import { FixedSpinner } from "../components/FixedSpinner";

const commit = import.meta.env.COMMIT_REF?.slice(0, 7) || "HEAD";
const deployId = import.meta.env.DEPLOY_ID || ""
let context = (import.meta.env.CONTEXT || 'local');
if (context === 'production') {
  context = 'prod';
}

export default function App() {
  return (
    <div>
      <LoadingStatus />
      <ScrollToTop />
      <div id='content-container'>
        <main>
          <Outlet />
        </main>
        <footer className='no-print'>
            <small style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
              <div>
                🎎 c. 2025, <a href="https://maxbo.me">Max Bo</a>, <a href="https://github.com/MaxwellBo/poppenhuis">source code</a>, <a href="https://dashboard.simpleanalytics.com/poppenhu.is">analytics</a>
                <VelocityDesignComfort />
              </div>
              <div>
                <a id="env" className={`pill ${context}`} href={`https://app.netlify.com/projects/poppenhuis/deploys/${deployId}`}>
                  {context}
                </a>
                <a id="commit" className="pill" href={`https://github.com/MaxwellBo/poppenhuis/commit/${commit}`}>
                  {commit}
                </a>
              </div>
            </small>
        </footer>
      </div>
    </div>
  )
}

function VelocityDesignComfort() {
  const [displayScene, setDisplayScene] = React.useState(false);

  return (<>
    <div id="velocity-design-comfort-checkbox" className='no-print'>
      <label>
        V:D:C.
      </label>
      <input
        type="checkbox"
        checked={displayScene}
        onChange={e => setDisplayScene(e.currentTarget.checked)} />
    </div>
    <div id="velocity-design-comfort-scene" className={displayScene ? 'display-scene no-print' : 'no-print'}>
      <svg id="plane" width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 0 0 0 10" fill="none" stroke="gray" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="SkyBlue" strokeWidth="3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <svg id="rainbow" width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(500, 0)">
          <rect x="-450" y="0" width="50" height="1000" fill="red" />
          <rect x="-400" y="0" width="50" height="1000" fill="orange" />
          <rect x="-350" y="0" width="50" height="1000" fill="yellow" />
          <rect x="-300" y="0" width="50" height="1000" fill="lime" />
          <rect x="-250" y="0" width="50" height="1000" fill="cyan" />
          <rect x="-200" y="0" width="50" height="1000" fill="blue" />
          <rect x="-150" y="0" width="50" height="1000" fill="magenta" />
        </g>
      </svg>
    </div>
  </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function LoadingStatus() {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return isLoading ? <FixedSpinner /> : null;
}

