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
          download="plumes.usdz"
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
