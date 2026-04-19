import React, { useState, useEffect, useRef } from 'react';

const VoiceAssistant = ({ homeInfo, toggleDevice }) => {
  const [isActive, setIsActive] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  
  // Refs for access inside closures without re-triggering useEffect
  const stateRef = useRef({ homeInfo, toggleDevice });
  const recognitionRef = useRef(null);
  
  useEffect(() => {
    stateRef.current = { homeInfo, toggleDevice };
  }, [homeInfo, toggleDevice]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const processCommand = (text, hi, td) => {
     if(!hi || !hi.rooms) {
       setTimeout(() => setFeedbackText(''), 3000);
       return;
     }

     let action = null;
     if (text.includes('turn on') || text.includes('switch on') || text.includes('start')) action = true;
     else if (text.includes('turn off') || text.includes('switch off') || text.includes('stop')) action = false;
     else if (/\bon\b/.test(text)) action = true;
     else if (/\boff\b/.test(text)) action = false;

     if (action === null) {
       setFeedbackText('Action not recognized. Try "Turn on" or "Living Room Light ON".');
       setTimeout(() => setFeedbackText(''), 3000);
       return;
     }

     let matchedRoom = null;
     for (const room of hi.rooms) {
        if (text.includes(room.name.toLowerCase())) {
           matchedRoom = room;
           break;
        }
     }

     if (!matchedRoom) {
       setFeedbackText('Room not found in command.');
       setTimeout(() => setFeedbackText(''), 3000);
       return;
     }

     let matchedDevice = null;
     for (const dev of matchedRoom.devices) {
        if (text.includes(dev.name.toLowerCase())) {
           matchedDevice = dev;
           break;
        }
     }

     if (!matchedDevice) {
       setFeedbackText(`Device not found in ${matchedRoom.name}.`);
       setTimeout(() => setFeedbackText(''), 3000);
       return;
     }

     if (matchedDevice.isOn !== action) {
       td(matchedRoom._id, matchedDevice._id, matchedDevice.isOn);
       setFeedbackText(`Turning ${action ? 'ON' : 'OFF'} ${matchedDevice.name} in ${matchedRoom.name}`);
     } else {
       setFeedbackText(`${matchedDevice.name} is already ${action ? 'ON' : 'OFF'}`);
     }
     
     setTimeout(() => setFeedbackText(''), 4000);
  };

  const handleManualActivate = () => {
     if (isActive) {
        // Stop listening manually if clicked again
        if (recognitionRef.current) {
           try { recognitionRef.current.stop(); } catch(e) {}
        }
        setIsActive(false);
        setFeedbackText('');
        return;
     }

     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     if (!SpeechRecognition) {
       setFeedbackText("Speech Recognition not supported in this browser.");
       setTimeout(() => setFeedbackText(''), 4000);
       return;
     }

     setIsActive(true);
     setFeedbackText('Listening for command...');

     const recognition = new SpeechRecognition();
     recognition.continuous = false; // Only listen for a single command, no background listening
     recognition.interimResults = true; // Stream words in real-time!
     recognition.lang = 'en-US';

     recognition.onresult = (event) => {
       let interimStr = '';
       let finalStr = '';

       for (let i = event.resultIndex; i < event.results.length; ++i) {
         if (event.results[i].isFinal) {
           finalStr += event.results[i][0].transcript;
         } else {
           interimStr += event.results[i][0].transcript;
         }
       }

       if (interimStr) {
         setFeedbackText(interimStr.toLowerCase().trim() + '...');
       }

       if (finalStr) {
         const transcript = finalStr.toLowerCase().trim();
         console.log('Voice Detected Full Command:', transcript);
         setFeedbackText(transcript);
         
         const { homeInfo: hi, toggleDevice: td } = stateRef.current;
         processCommand(transcript, hi, td);
         setIsActive(false);
       }
     };

     recognition.onerror = (event) => {
         console.error('Speech recognition error', event.error);
         if (event.error !== 'no-speech') {
             setFeedbackText(`Microphone error: ${event.error}`);
             setTimeout(() => setFeedbackText(''), 3000);
         } else {
             setFeedbackText('');
         }
         setIsActive(false);
     };

     recognition.onend = () => {
       setIsActive(false);
     };

     try {
       recognition.start();
       recognitionRef.current = recognition;
     } catch (e) {
       console.error(e);
       setIsActive(false);
       setFeedbackText('Failed to start microphone.');
       setTimeout(() => setFeedbackText(''), 3000);
     }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
       {feedbackText && (
         <div className="fade-in" style={{ background: 'rgba(0,0,0,0.85)', color: '#FFF', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--accent-yellow)', backdropFilter: 'blur(10px)', fontSize: '0.95rem', maxWidth: '280px', wordWrap: 'break-word', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', fontWeight: 500, textAlign: 'right' }}>
           <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>Voice: </span>
           "{feedbackText}"
         </div>
       )}
       <button 
         onClick={handleManualActivate}
         title="Voice Command"
         style={{ 
           width: '64px', height: '64px', borderRadius: '50%', background: isActive ? 'var(--accent-yellow)' : 'rgba(15,15,15,0.95)', color: isActive ? '#000' : 'var(--accent-yellow)', border: isActive ? 'none' : '2px solid var(--accent-yellow)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isActive ? '0 0 25px var(--accent-yellow)' : '0 10px 25px rgba(0,0,0,0.8)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
         }}
       >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={isActive ? '#000' : 'transparent'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
       </button>
    </div>
  );
};

export default VoiceAssistant;
