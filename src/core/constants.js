// Shared constants for debt-snowball-tracker

// Home Assistant storage dashboard URL path (hidden from sidebar)
export const STORE_URL_PATH = 'snowball-store';

// Maximum months to simulate (100 years - prevents infinite loops)
export const MAX_SIMULATION_MONTHS = 1200;

// Default strategy
export const DEFAULT_STRATEGY = 'snowball';

// Chart color palette for debt visualization
export const DEBT_CHART_COLORS = [
    { border: 'rgba(99,102,241,1)',   bg: 'rgba(99,102,241,0.08)' },   // Indigo
    { border: 'rgba(168,85,247,1)',  bg: 'rgba(168,85,247,0.08)' },   // Purple
    { border: 'rgba(236,72,153,1)',  bg: 'rgba(236,72,153,0.08)' },   // Pink
    { border: 'rgba(244,63,94,1)',   bg: 'rgba(244,63,94,0.08)' },    // Rose
    { border: 'rgba(249,115,22,1)',  bg: 'rgba(249,115,22,0.08)' },   // Orange
];
