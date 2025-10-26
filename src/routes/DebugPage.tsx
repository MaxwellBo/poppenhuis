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

export default function DebugPage() {
  // Test Safari AR support
  const a = document.createElement("a");
  const safariARSupported = a.relList.supports("ar");

  // Use a sample USDZ file from the manifest
  const usdzPath = "/models/mbo/pedals/plumes.usdz";

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Debug</h1>
      
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
          <img 
            src="https://via.placeholder.com/400x300.png?text=Tap+to+view+in+AR" 
            alt="AR Preview"
            style={{ 
              maxWidth: "400px", 
              width: "100%",
              border: "2px solid #333",
              borderRadius: "8px"
            }}
          />
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
