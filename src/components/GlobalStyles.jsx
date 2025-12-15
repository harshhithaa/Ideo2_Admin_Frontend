import React from 'react';
import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

export default function GlobalStyles() {
  return (
    <MuiGlobalStyles
      styles={{
        // CSS variables + global scrollbar colors for consistent app-wide appearance
        ':root': {
          '--scrollbar-track': '#f3f4f6',
          '--scrollbar-thumb': '#cbd5e1',
          '--scrollbar-thumb-hover': '#b6c2cc',
          '--scrollbar-size': '10px',
          '--scrollbar-radius': '8px'
        },
        html: {
          height: '100%',
          width: '100%'
        },
        body: {
          height: '100%',
          width: '100%',
          margin: 0,
          padding: 0,
          overflow: 'hidden', /* remove page-level vertical scroll */
          WebkitFontSmoothing: 'antialiased',
          WebkitTapHighlightColor: 'transparent'
        },
        '#root': {
          height: '100%',
          width: '100%'
        },
        // keep box-sizing rule
        '*': {
          boxSizing: 'border-box',
          /* Firefox scrollbar colors */
          scrollbarColor: 'var(--scrollbar-thumb) var(--scrollbar-track)',
          scrollbarWidth: 'thin'
        },
        /* WebKit scrollbar styling */
        '*::-webkit-scrollbar': {
          width: 'var(--scrollbar-size)',
          height: 'var(--scrollbar-size)'
        },
        '*::-webkit-scrollbar-track': {
          background: 'var(--scrollbar-track)',
          borderRadius: 'var(--scrollbar-radius)'
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'var(--scrollbar-thumb)',
          borderRadius: 'var(--scrollbar-radius)',
          border: '2px solid var(--scrollbar-track)',
          minHeight: 24
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'var(--scrollbar-thumb-hover)'
        },
        '*::-webkit-scrollbar-corner': {
          background: 'var(--scrollbar-track)'
        }
      }}
    />
  );
}
