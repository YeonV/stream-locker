import { useState, useEffect } from 'react';

// A simple interface for the event data we want to display
interface KeyEventInfo {
  key: string;
  code: string;
  keyCode: number;
}

export const RemoteEventLogger = () => {
  const [lastEvent, setLastEvent] = useState<KeyEventInfo | null>(null);

  useEffect(() => {
    // This is the core of the component. It listens for any keydown event on the whole window.
    const handleKeyDown = (event: KeyboardEvent) => {
      // We prevent default behavior for some keys to stop the browser from scrolling, etc.
      // This helps ensure we can capture the event cleanly.
      // if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
      //   event.preventDefault();
      // }

      // Log the full event to the console for deep inspection
      console.log('Keydown Event:', event);

      // Update our state with the most important details
      setLastEvent({
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
      });
    };

    // Attach the event listener when the component mounts
    window.addEventListener('keydown', handleKeyDown);

    // IMPORTANT: Clean up the event listener when the component unmounts to prevent memory leaks
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // The empty dependency array means this effect runs only once on mount.

  // Inline styles for the floating widget. This keeps it self-contained.
  const widgetStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    right: '20px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #4A5568',
    zIndex: 9999,
    fontFamily: 'monospace',
    fontSize: '14px',
    width: '240px',
  };

  const preStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  };

  return (
    <div style={widgetStyle}>
      <h4 style={{ margin: 0, paddingBottom: '8px', borderBottom: '1px solid #4A5568' }}>Remote Logger</h4>
      {lastEvent ? (
        <pre style={preStyle}>
          {`Key: ${lastEvent.key}\nCode: ${lastEvent.code}\nKeyCode: ${lastEvent.keyCode}`}
        </pre>
      ) : (
        <p style={{ margin: '8px 0 0' }}>Waiting for input...</p>
      )}
    </div>
  );
};