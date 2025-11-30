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
  const mapWidth = 800;
  const mapHeight = 600;
  const padding = 50;

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <PageHeader>debug</PageHeader>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>GLB Files Map</h2>
        {dsStoreLoading && <p>Loading .DS_Store file...</p>}
        {dsStoreError && (
          <div style={{ padding: "1rem", background: "#f8d7da", color: "#721c24", borderRadius: "4px" }}>
            <strong>Error:</strong> {dsStoreError}
          </div>
        )}
        {glbPositions.length > 0 && bounds && (
          <div>
            <p style={{ marginBottom: "1rem" }}>
              Found <strong>{glbPositions.length}</strong> .glb files with positions
            </p>
            <div style={{ 
              background: "white", 
              border: "2px solid #333",
              borderRadius: "4px",
              overflow: "hidden",
              display: "inline-block"
            }}>
              <svg 
                width={mapWidth} 
                height={mapHeight}
                style={{ display: "block" }}
              >
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />
                
                {/* Plot GLB files */}
                {glbPositions.map((pos, idx) => {
                  // Normalize coordinates to fit in the SVG
                  const x = ((pos.x - bounds.minX) / bounds.width) * (mapWidth - 2 * padding) + padding;
                  const y = ((pos.y - bounds.minY) / bounds.height) * (mapHeight - 2 * padding) + padding;
                  
                  return (
                    <g key={idx}>
                      {/* Point */}
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="6" 
                        fill="#0066cc"
                        stroke="white"
                        strokeWidth="2"
                      />
                      {/* Label */}
                      <text
                        x={x}
                        y={y - 12}
                        fontSize="11"
                        fontFamily="monospace"
                        fill="#333"
                        textAnchor="middle"
                      >
                        {pos.filename}
                      </text>
                      {/* Coordinates */}
                      <text
                        x={x}
                        y={y + 20}
                        fontSize="9"
                        fontFamily="monospace"
                        fill="#666"
                        textAnchor="middle"
                      >
                        ({pos.x}, {pos.y})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
              <strong>Bounds:</strong> x: {bounds.minX}–{bounds.maxX} ({bounds.width}px), 
              y: {bounds.minY}–{bounds.maxY} ({bounds.height}px)
            </div>
          </div>
        )}
        {glbPositions.length === 0 && !dsStoreLoading && (
          <p>No .glb files with position data found in .DS_Store</p>
        )}
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>.DS_Store Parser</h2>
        {dsStoreLoading && <p>Loading .DS_Store file...</p>}
        {dsStoreError && (
          <div style={{ padding: "1rem", background: "#f8d7da", color: "#721c24", borderRadius: "4px" }}>
            <strong>Error:</strong> {dsStoreError}
          </div>
        )}
        {dsStoreData && (
          <div>
            <p style={{ marginBottom: "1rem" }}>
              Parsed <strong>{dsStoreData.length}</strong> records from{" "}
              <code>/assets/goldens/.DS_Store</code>
            </p>
            <div style={{ 
              maxHeight: "500px", 
              overflow: "auto", 
              background: "white", 
              padding: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}>
              {dsStoreData.map((record, idx) => (
                <div key={idx} style={{ 
                  marginBottom: "1.5rem", 
                  paddingBottom: "1rem",
                  borderBottom: idx < dsStoreData.length - 1 ? "1px solid #eee" : "none"
                }}>
                  <div style={{ 
                    fontWeight: "bold", 
                    fontSize: "1.1rem",
                    marginBottom: "0.5rem",
                    color: "#0066cc"
                  }}>
                    {record.name || "(root)"}
                  </div>
                  <table style={{ width: "100%", fontSize: "0.9rem" }}>
                    <tbody>
                      {Object.entries(record.fields).map(([field, value]) => (
                        <tr key={field}>
                          <td style={{ 
                            padding: "0.25rem 0.5rem",
                            verticalAlign: "top",
                            width: "200px",
                            color: "#666"
                          }}>
                            <strong>{getFieldName(field)}</strong>
                            <br />
                            <span style={{ fontSize: "0.8rem", color: "#999" }}>({field})</span>
                          </td>
                          <td style={{ 
                            padding: "0.25rem 0.5rem",
                            verticalAlign: "top",
                            wordBreak: "break-all"
                          }}>
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
      
      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>AR Support Detection</h2>
        <p>
          <strong>safariARSupported:</strong>{" "}
          <code style={{ 
            padding: "0.25rem 0.5rem", 
            background: safariARSupported ? "#d4edda" : "#f8d7da",
            color: safariARSupported ? "#155724" : "#721c24",
            borderRadius: "4px"
          }}>
            {String(safariARSupported)}
          </code>
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          This should be <code>true</code> on Safari iOS/iPadOS/visionOS with AR capabilities.
        </p>
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>AR Link Test</h2>
        <p style={{ marginBottom: "1rem" }}>
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
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          <code>rel="ar"</code> | <code>href="{usdzPath}"</code> | <code>download="plumes.usdz"</code>
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
          Static asset (direct link):{" "}
          <a href={usdzPath} download="plumes.usdz" style={{ color: "#0066cc" }}>
            Download plumes.usdz
          </a>
        </p>
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>Direct USDZ Link (standard href)</h2>
        <p style={{ marginBottom: "1rem" }}>
          Standard hyperlink that navigates directly to the USDZ asset:
        </p>
        <a href={usdzPath} style={{ color: "#0066cc", fontWeight: 600 }}>
          Open plumes.usdz
        </a>
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>Model Element Test (USDZ with fallback)</h2>
        <p style={{ marginBottom: "1rem" }}>
          Using <code>&lt;model&gt;</code> element with orbit stage mode:
        </p>
        <model stagemode="orbit">
          <source src="/models/mbo/pedals/plumes.usdz" type="model/vnd.usdz+zip" />
        </model>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          <code>stagemode="orbit"</code> | <code>type="model/vnd.usdz+zip"</code>
        </p>
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>Model Element Test (Multiple formats)</h2>
        <p style={{ marginBottom: "1rem" }}>
          Using <code>&lt;model&gt;</code> element with multiple source formats:
        </p>
        <model>
          <source src="/models/mbo/pedals/elcap.usdz" type="model/vnd.pixar.usd" />
          <source src="/models/mbo/pedals/elcap.glb" type="model/gltf-binary" />
        </model>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          <code>type="model/vnd.pixar.usd"</code> and <code>type="model/gltf-binary"</code>
        </p>
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>Model Element Test (GLB only)</h2>
        <p style={{ marginBottom: "1rem" }}>
          Using <code>&lt;model&gt;</code> element with only GLB format:
        </p>
        <model>
          <source src="/models/mbo/pedals/multistomp.glb" type="model/gltf-binary" />
        </model>
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
          <code>type="model/gltf-binary"</code> only
        </p>
      </section>

      <section style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0" }}>
        <h2>Browser Information</h2>
        <dl>
          <dt><strong>User Agent:</strong></dt>
          <dd style={{ marginLeft: "1rem", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
            {navigator.userAgent}
          </dd>
          <dt><strong>Platform:</strong></dt>
          <dd style={{ marginLeft: "1rem", fontSize: "0.85rem" }}>
            {navigator.platform}
          </dd>
        </dl>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <a href="/" style={{ color: "#0066cc" }}>← Back to home</a>
      </section>
    </div>
  );
}
