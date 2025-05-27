import React, { useState, useEffect, useRef } from 'react';

interface MouseState {
  x: number;
  y: number;
  lastClickType: string | null;
  lastButtonPressed: string | null;
  lastButtonReleased: string | null;
  scrollDeltaY: number;
  isMouseDown: boolean;
  doubleClickCount: number;
  mouseInArea: boolean;
  eventLog: string[];
}

const MAX_LOG_ENTRIES = 15;

export function MouseTester() {
  const [mouseState, setMouseState] = useState<MouseState>({
    x: 0,
    y: 0,
    lastClickType: null,
    lastButtonPressed: null,
    lastButtonReleased: null,
    scrollDeltaY: 0,
    isMouseDown: false,
    doubleClickCount: 0,
    mouseInArea: false,
    eventLog: [],
  });

  const testAreaRef = useRef<HTMLDivElement>(null);

  const addToLog = (message: string) => {
    setMouseState(prevState => ({
      ...prevState,
      eventLog: [message, ...prevState.eventLog].slice(0, MAX_LOG_ENTRIES)
    }));
  };

  const getButtonName = (buttonCode: number): string => {
    switch (buttonCode) {
      case 0: return 'Left';
      case 1: return 'Middle';
      case 2: return 'Right';
      default: return `Button ${buttonCode}`;
    }
  };

  useEffect(() => {
    const testArea = testAreaRef.current;
    if (!testArea) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = testArea.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        setMouseState(prevState => ({ ...prevState, x, y, mouseInArea: true }));
        // addToLog(`Mouse Move: X=${x}, Y=${y}`); // Too noisy for log
      } else {
        setMouseState(prevState => ({ ...prevState, mouseInArea: false }));
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const buttonName = getButtonName(event.button);
      setMouseState(prevState => ({
        ...prevState,
        isMouseDown: true,
        lastButtonPressed: `${buttonName} (Code: ${event.button})`,
      }));
      addToLog(`Mouse Down: ${buttonName}`);
    };

    const handleMouseUp = (event: MouseEvent) => {
      const buttonName = getButtonName(event.button);
      setMouseState(prevState => ({
        ...prevState,
        isMouseDown: false,
        lastButtonReleased: `${buttonName} (Code: ${event.button})`,
      }));
      addToLog(`Mouse Up: ${buttonName}`);
    };

    const handleClick = (event: MouseEvent) => {
      // Simple click is usually left click, but let's be specific
      if (event.button === 0) {
        const rect = testArea.getBoundingClientRect();
        const x = Math.round(event.clientX - rect.left);
        const y = Math.round(event.clientY - rect.top);
        setMouseState(prevState => ({
          ...prevState,
          lastClickType: `Left Click at X:${x}, Y:${y}`,
        }));
        addToLog(`Left Click: X=${x}, Y=${y}`);
      }
    };
    
    const handleDoubleClick = (event: MouseEvent) => {
      if (event.button === 0) { // Typically only left button double clicks
        setMouseState(prevState => ({
          ...prevState,
          doubleClickCount: prevState.doubleClickCount + 1,
        }));
        addToLog('Double Click (Left)');
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault(); // Prevent browser context menu
      const rect = testArea.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);
      setMouseState(prevState => ({
        ...prevState,
        lastClickType: `Right Click at X:${x}, Y:${y}`,
      }));
      addToLog(`Right Click (Context Menu): X=${x}, Y=${y}`);
    };

    const handleWheel = (event: WheelEvent) => {
      setMouseState(prevState => ({
        ...prevState,
        scrollDeltaY: Math.round(event.deltaY),
      }));
      addToLog(`Scroll: DeltaY=${Math.round(event.deltaY)} (${event.deltaY < 0 ? 'Up' : 'Down'})`);
      // Reset scrollDeltaY after a short period for better UX
      setTimeout(() => setMouseState(prevState => ({ ...prevState, scrollDeltaY: 0 })), 500);
    };
    
    const handleMouseEnter = () => {
      setMouseState(prevState => ({ ...prevState, mouseInArea: true }));
      addToLog('Mouse Entered Test Area');
    };

    const handleMouseLeave = () => {
      setMouseState(prevState => ({ ...prevState, mouseInArea: false, isMouseDown: false /* reset if mouse leaves while pressed */ }));
      addToLog('Mouse Left Test Area');
    };

    // Add event listeners to the test area
    testArea.addEventListener('mousemove', handleMouseMove);
    testArea.addEventListener('mousedown', handleMouseDown);
    testArea.addEventListener('mouseup', handleMouseUp);
    testArea.addEventListener('click', handleClick);
    testArea.addEventListener('dblclick', handleDoubleClick);
    testArea.addEventListener('contextmenu', handleContextMenu);
    testArea.addEventListener('wheel', handleWheel);
    testArea.addEventListener('mouseenter', handleMouseEnter);
    testArea.addEventListener('mouseleave', handleMouseLeave);
    
    // Global listeners for mouse up (if mouse is dragged outside and released)
    // and mouse move (if not over test area initially)
    // For simplicity, we'll rely on mouse enter/leave for the test area focus.

    return () => {
      // Cleanup: remove event listeners
      testArea.removeEventListener('mousemove', handleMouseMove);
      testArea.removeEventListener('mousedown', handleMouseDown);
      testArea.removeEventListener('mouseup', handleMouseUp);
      testArea.removeEventListener('click', handleClick);
      testArea.removeEventListener('dblclick', handleDoubleClick);
      testArea.removeEventListener('contextmenu', handleContextMenu);
      testArea.removeEventListener('wheel', handleWheel);
      testArea.removeEventListener('mouseenter', handleMouseEnter);
      testArea.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">Advanced Mouse Tester</h1>
      
      <div 
        ref={testAreaRef}
        className="w-full h-80 bg-white border-2 border-blue-500 rounded-md shadow-inner cursor-crosshair mb-6 select-none relative flex items-center justify-center"
        style={{ touchAction: 'none' }} // Prevents touch interference on some devices
      >
        <p className="text-gray-500 text-lg p-4 text-center">
          Interact with your mouse in this area.
          <br />
          {mouseState.mouseInArea ? `X: ${mouseState.x}, Y: ${mouseState.y}` : "Mouse outside test area"}
        </p>
        {mouseState.isMouseDown && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
            Mouse Down
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <InfoCard title="Coordinates (within area)">
          <p>X: <span className="font-semibold text-blue-600">{mouseState.mouseInArea ? mouseState.x : 'N/A'}</span></p>
          <p>Y: <span className="font-semibold text-blue-600">{mouseState.mouseInArea ? mouseState.y : 'N/A'}</span></p>
        </InfoCard>

        <InfoCard title="Button Status">
          <p>Pressed: <span className="font-semibold text-green-600">{mouseState.lastButtonPressed || 'None'}</span></p>
          <p>Released: <span className="font-semibold text-red-600">{mouseState.lastButtonReleased || 'None'}</span></p>
          <p>Mouse Currently: <span className="font-semibold">{mouseState.isMouseDown ? 'Held Down' : 'Up'}</span></p>
        </InfoCard>

        <InfoCard title="Click Events">
          <p>Last Click: <span className="font-semibold text-purple-600">{mouseState.lastClickType || 'None'}</span></p>
          <p>Double Clicks: <span className="font-semibold text-purple-600">{mouseState.doubleClickCount}</span></p>
        </InfoCard>

        <InfoCard title="Scroll Wheel">
          <p>Last Scroll Delta Y: <span className="font-semibold text-teal-600">{mouseState.scrollDeltaY}</span></p>
          <p>Direction: <span className="font-semibold text-teal-600">
            {mouseState.scrollDeltaY === 0 ? 'None' : (mouseState.scrollDeltaY < 0 ? 'Up' : 'Down')}
          </span></p>
        </InfoCard>
      </div>

      <InfoCard title="Event Log (Last 15 Events)">
        <div className="h-48 overflow-y-auto bg-gray-50 p-2 border rounded-md text-sm">
          {mouseState.eventLog.length === 0 && <p className="text-gray-400 italic">No events yet...</p>}
          {mouseState.eventLog.map((log, index) => (
            <p key={index} className="truncate">{log}</p>
          ))}
        </div>
      </InfoCard>
      <button 
        onClick={() => setMouseState(prev => ({...prev, eventLog: [], doubleClickCount: 0, lastClickType: null, lastButtonPressed: null, lastButtonReleased: null}))}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full md:w-auto"
      >
        Clear Log & Stats
      </button>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h2 className="text-xl font-semibold text-gray-700 mb-2 border-b pb-1">{title}</h2>
    <div className="text-sm space-y-1">{children}</div>
  </div>
);
