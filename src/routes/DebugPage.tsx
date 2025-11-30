// Declare the model element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      model: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        stagemode?: string;
      }, HTMLElement>;
      source: React.DetailedHTMLProps<React.SourceHTMLAttributes<HTMLSourceElement>, HTMLSourceElement>;
    }
  }
}

import { PageHeader } from '../components/PageHeader';
import { useEffect, useState } from 'react';
import { DSStoreParser, DSStoreRecord, formatDSStoreValue, getFieldName } from '../utils/dsstore-parser';
import { extractFilePositions, filterGlbPositions, calculateBounds, FilePosition } from '../utils/dsstore-helpers';

export default function DebugPage() {
  const [dsStoreData, setDsStoreData] = useState<DSStoreRecord[] | null>(null);
  const [dsStoreError, setDsStoreError] = useState<string | null>(null);
  const [dsStoreLoading, setDsStoreLoading] = useState(true);
  const [glbPositions, setGlbPositions] = useState<FilePosition[]>([]);

  useEffect(() => {
    // Load and parse the .DS_Store file
    fetch('/assets/goldens/.DS_Store')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load .DS_Store: ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        const parser = new DSStoreParser(buffer, false);
        const records = parser.parse();
        setDsStoreData(records);
        
        // Extract GLB positions
        const allPositions = extractFilePositions(records);
        const glbs = filterGlbPositions(allPositions);
        setGlbPositions(glbs);
        
        setDsStoreLoading(false);
      })
      .catch(error => {
        setDsStoreError(error.message);
        setDsStoreLoading(false);
      });
  }, []);

  // Test Safari AR support
  const a = document.createElement("a");
  const safariARSupported = a.relList.supports("ar");

  // Use a sample USDZ file from the manifest
  const usdzPath = "/models/mbo/pedals/plumes.usdz";
  const ogPath = "/models/mbo/pedals/plumes.jpeg";

  // Calculate bounds for the map
  const bounds = glbPositions.length > 0 ? calculateBounds(glbPositions) : null;

  return (
    <article>
      <PageHeader>debug</PageHeader>

      <section style={{ marginTop: '2rem' }}>
        <h2>GLB Files Map</h2>
        {dsStoreLoading && <p>Loading .DS_Store file...</p>}
        {dsStoreError && (
          <div>
            <strong>Error:</strong> {dsStoreError}
          </div>
        )}
        {glbPositions.length > 0 && bounds && (
          <div>
            <p>
              Found <strong>{glbPositions.length}</strong> .glb files with positions
            </p>
            <div style={{ 
              position: 'relative',
              width: '100%',
              minHeight: '600px',
              overflow: 'hidden'
            }}>
              {glbPositions.map((pos, idx) => {
                // Normalize coordinates to percentage positions
                const xPercent = ((pos.x - bounds.minX) / bounds.width) * 100;
                const yPercent = ((pos.y - bounds.minY) / bounds.height) * 100;
                
                // Convert .glb filename to .jpeg for og image
                const jpegFilename = pos.filename.replace(/\.glb$/, '.jpeg');
                const imagePath = `/assets/derived/${jpegFilename}`;
                
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${xPercent}%`,
                      top: `${yPercent}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div>
                      <div>
                        {pos.filename}
                      </div>
                      <img
                        src={imagePath}
                        alt={pos.filename}
                        style={{
                          width: '96px',
                          height: '96px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          // Fallback if image doesn't exist
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        ({pos.x}, {pos.y})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <strong>Bounds:</strong> x: {bounds.minX}–{bounds.maxX} ({bounds.width}px), 
              y: {bounds.minY}–{bounds.maxY} ({bounds.height}px)
            </div>
          </div>
        )}
        {glbPositions.length === 0 && !dsStoreLoading && (
          <p>No .glb files with position data found in .DS_Store</p>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>.DS_Store Parser</h2>
        {dsStoreLoading && <p>Loading .DS_Store file...</p>}
        {dsStoreError && (
          <div>
            <strong>Error:</strong> {dsStoreError}
          </div>
        )}
        {dsStoreData && (
          <div>
            <p>
              Parsed <strong>{dsStoreData.length}</strong> records from{" "}
              <code>/assets/goldens/.DS_Store</code>
            </p>
            <div style={{ 
              maxHeight: "500px", 
              overflow: "auto"
            }}>
              {dsStoreData.map((record, idx) => (
                <div key={idx}>
                  <div>
                    {record.name || "(root)"}
                  </div>
                  <table>
                    <tbody>
                      {Object.entries(record.fields).map(([field, value]) => (
                        <tr key={field}>
                          <td>
                            <strong>{getFieldName(field)}</strong>
                            <br />
                            <span>({field})</span>
                          </td>
                          <td>
                            {formatDSStoreValue(field, value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      
      <section style={{ marginTop: '2rem' }}>
        <h2>AR Support Detection</h2>
        <p>
          <strong>safariARSupported:</strong>{" "}
          <code>
            {String(safariARSupported)}
          </code>
        </p>
        <p>
          This should be <code>true</code> on Safari iOS/iPadOS/visionOS with AR capabilities.
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>AR Link Test</h2>
        <p>
          Click the image below to open in AR (if supported):
        </p>
        <a 
          rel="ar" 
          href={usdzPath}
        >
          <img src={ogPath} alt="AR Preview" />
        </a>
        <a 
          rel="ar" 
          href={usdzPath}
        >
          <p>HELLO WORLD</p>
        </a>
        <a 
          rel="ar" 
          href={usdzPath}
        >
        </a>
        <p>
          <code>rel="ar"</code> | <code>href="{usdzPath}"</code> | <code>download="plumes.usdz"</code>
        </p>
        <p>
          Static asset (direct link):{" "}
          <a href={usdzPath} download="plumes.usdz">
            Download plumes.usdz
          </a>
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Direct USDZ Link (standard href)</h2>
        <p>
          Standard hyperlink that navigates directly to the USDZ asset:
        </p>
        <a href={usdzPath}>
          Open plumes.usdz
        </a>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Model Element Test (USDZ with fallback)</h2>
        <p>
          Using <code>&lt;model&gt;</code> element with orbit stage mode:
        </p>
        <model stagemode="orbit">
          <source src="/models/mbo/pedals/plumes.usdz" type="model/vnd.usdz+zip" />
        </model>
        <p>
          <code>stagemode="orbit"</code> | <code>type="model/vnd.usdz+zip"</code>
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Model Element Test (Multiple formats)</h2>
        <p>
          Using <code>&lt;model&gt;</code> element with multiple source formats:
        </p>
        <model>
          <source src="/models/mbo/pedals/elcap.usdz" type="model/vnd.pixar.usd" />
          <source src="/models/mbo/pedals/elcap.glb" type="model/gltf-binary" />
        </model>
        <p>
          <code>type="model/vnd.pixar.usd"</code> and <code>type="model/gltf-binary"</code>
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Model Element Test (GLB only)</h2>
        <p>
          Using <code>&lt;model&gt;</code> element with only GLB format:
        </p>
        <model>
          <source src="/models/mbo/pedals/multistomp.glb" type="model/gltf-binary" />
        </model>
        <p>
          <code>type="model/gltf-binary"</code> only
        </p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Browser Information</h2>
        <dl>
          <dt><strong>User Agent:</strong></dt>
          <dd>
            {navigator.userAgent}
          </dd>
          <dt><strong>Platform:</strong></dt>
          <dd>
            {navigator.platform}
          </dd>
        </dl>
      </section>
    </article>
  );
}
