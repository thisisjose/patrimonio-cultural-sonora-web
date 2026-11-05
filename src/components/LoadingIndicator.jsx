import "../styles/components/LoadingIndicator.css";

function LoadingIndicator({ label }) {
  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <span className="loading-indicator-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingIndicator;
