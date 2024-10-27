import React from 'react';
import { Tooltip } from 'react-tooltip';
import { v4 as uuidv4 } from 'uuid';

function InfoIcon({ text, info }) {
  const tooltipId = uuidv4();

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {text}
      <span
        data-tooltip-id={tooltipId}
        data-tooltip-html={info}
        style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '2px',
        }}
      >
        <InfoIconSvg />
        <Tooltip id={tooltipId} place="right" effect="solid" />
      </span>
    </div>
  );
}

function InfoIconSvg() {
  return (
    <svg style={{ marginLeft: '2px' }} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.50002 5.1665V5.74984M7.50002 7.20817V9.83317M7.50002 13.3332C10.7217 13.3332 13.3334 10.7215 13.3334 7.49984C13.3334 4.27818 10.7217 1.6665 7.50002 1.6665C4.27836 1.6665 1.66669 4.27818 1.66669 7.49984C1.66669 10.7215 4.27836 13.3332 7.50002 13.3332Z" stroke="#858697" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default InfoIcon;
