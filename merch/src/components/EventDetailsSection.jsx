// Event details section (Festival Grounds) - date, time, location, map link
import React from "react";
import FadeInSection from "./ui/FadeInSection";

const CALENDAR_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const PACKAGE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const TICKET_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 17v2" />
    <path d="M13 11v2" />
  </svg>
);
const MAP_PIN_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function EventDetailsSection({ eventDetails, eventTitle }) {
  if (!eventDetails || (!eventDetails.event_date && !eventDetails.event_location && !eventDetails.event_gmaps_url)) {
    return null;
  }

  const hasMap = eventDetails.event_gmaps_url;

  return (
    <FadeInSection className="festival-grounds">
      <h2 className="festival-grounds__title">THE FESTIVAL GROUNDS</h2>
      <div className="festival-grounds__grid">
        <div className="festival-grounds__map-col">
          {hasMap ? (
            <a
              href={eventDetails.event_gmaps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="festival-grounds__map-link"
              aria-label="Open location in Google Maps"
            >
              <div className="festival-grounds__map-placeholder">
                <span className="festival-grounds__map-pin">{MAP_PIN_ICON}</span>
                <span className="festival-grounds__map-text">View on Google Maps</span>
              </div>
            </a>
          ) : (
            <div className="festival-grounds__map-placeholder festival-grounds__map-placeholder--no-link">
              <span className="festival-grounds__map-pin">{MAP_PIN_ICON}</span>
              <span className="festival-grounds__map-text">Location</span>
            </div>
          )}
        </div>
        <div className="festival-grounds__info-col">
          {eventDetails.event_date && (
            <div className="festival-grounds__info-item">
              <span className="festival-grounds__icon festival-grounds__icon--orange">{CALENDAR_ICON}</span>
              <div>
                <strong>Date & Time</strong>
                <p>{eventDetails.event_date}{eventDetails.event_time ? ` · ${eventDetails.event_time}` : ''}</p>
              </div>
            </div>
          )}
          {eventDetails.merch_popup && (
            <div className="festival-grounds__info-item">
              <span className="festival-grounds__icon festival-grounds__icon--orange">{PACKAGE_ICON}</span>
              <div>
                <strong>Merch Pop-up</strong>
                <p>{eventDetails.merch_popup}</p>
              </div>
            </div>
          )}
          {eventDetails.entry_policy && (
            <div className="festival-grounds__info-item">
              <span className="festival-grounds__icon festival-grounds__icon--orange">{TICKET_ICON}</span>
              <div>
                <strong>Entry Policy</strong>
                <p>{eventDetails.entry_policy}</p>
              </div>
            </div>
          )}
          {eventDetails.event_location && !eventDetails.merch_popup && (
            <div className="festival-grounds__info-item">
              <span className="festival-grounds__icon festival-grounds__icon--orange">{MAP_PIN_ICON}</span>
              <div>
                <strong>Location</strong>
                <p>{eventDetails.event_location}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </FadeInSection>
  );
}
