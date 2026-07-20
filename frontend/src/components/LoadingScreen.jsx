function LoadingScreen({
  message = "Loading...",
  fullScreen = true,
}) {
  return (
    <div
      className={
        fullScreen
          ? "loading-screen loading-screen-full"
          : "loading-screen loading-screen-inline"
      }
      role="status"
      aria-live="polite"
    >
      <div className="loading-spinner" />

      <p className="loading-message">{message}</p>
    </div>
  );
}

export default LoadingScreen;