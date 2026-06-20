"use client"; // Required in Next.js App Router so this runs in the browser, not the server

import { useEffect } from "react";

export default function ConsoleGreeting() {
  useEffect(() => {
    // We use String.raw so the slashes and backslashes don't break the code
    const asciiArt = String.raw`
  ____  _____  ____  _____  ___  _____ __   __ ____  
 / ___|| ____||  _ \|_   _||_ _||  ___|\ \ / /|  _ \ 
| |    |  _|  | |_) |  | |  | | | |_    \ V / | | | |
| |___ | |___ |  _ <   | |  | | |  _|    | |  | |_| |
 \____||_____||_| \_\  |_| |___||_|      |_|  |____/ 
                                                 .in
    `;

    // The %c tells the browser console to apply CSS styling to the text
    const style1 = "color: #00D4A8; font-weight: bold; font-size: 14px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);";
    const style2 = "color: #8B949E; font-size: 12px; font-family: monospace;";
    const style3 = "color: #00D4A8; font-size: 12px; font-weight: bold; text-decoration: underline;";

    // We wrap it in a try-catch just in case a strict browser blocks console access
    try {
      console.log(`%c${asciiArt}`, style1);
      console.log("%cBuilding the data engine for India's tech careers.", style2);
      console.log("%cWait, you're looking under the hood? We should talk: founders@certifyd.in", style3);
    } catch (e) {
      // Ignore silently
    }
  }, []); // Empty dependency array ensures this only prints once on initial load

  // This component doesn't render anything to the actual screen
  return null; 
}
