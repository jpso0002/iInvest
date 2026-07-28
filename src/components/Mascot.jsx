import { useState } from 'react';
import mascotImg from '../assets/mascot-coach.png';
import './Mascot.css';

/**
 * Mascot coach that displays a contextual tip in a speech bubble.
 * Props:
 *  - tip: string (message shown in the bubble)
 *  - name: optional string (coach name displayed above the message)
 *  - dismissible: boolean (show close button)
 *  - variant: 'inline' | 'floating'
 */
export default function Mascot({
  tip,
  name = 'Coach',
  dismissible = true,
  variant = 'inline',
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className={`mascot mascot--${variant}`}>
      <img
        src={mascotImg}
        alt="Coach mascotte"
        className="mascot__avatar"
        width={512}
        height={512}
        loading="lazy"
      />
      <div className="mascot__bubble" role="status">
        <div className="mascot__bubble-head">
          <span className="mascot__name">{name}</span>
          {dismissible && (
            <button
              type="button"
              className="mascot__close"
              aria-label="Fermer le conseil"
              onClick={() => setVisible(false)}
            >
              ×
            </button>
          )}
        </div>
        <p className="mascot__tip">{tip}</p>
      </div>
    </div>
  );
}