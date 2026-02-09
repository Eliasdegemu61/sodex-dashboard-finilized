// Favicon - Minimal upward trending chart (tracking symbol) - Orange themed
export const FAVICON_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJvcmFuZ2VHcmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZWE2MDFhO3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmODExMztzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjI0OCIgZmlsbD0idXJsKCNvcmFuZ2VHcmFkKSIvPjxwb2x5bGluZSBwb2ludHM9IjEwMCw0MjAgMjAwLDMwMCAzMDAsMzQwIDQxMiwxNzAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMzAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==';

// Grenade image for footer (simplified 3D grenade representation)
export const GRENADE_IMAGE_DATA_URI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iMTAwIiB5PSIxMjAiIGZvbnQtc2l6ZT0iODAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZWE1ODBjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OAPC90ZXh0Pjwvc3ZnPg==';

// Helper function to create inline image data
export const createImageDataURI = (base64String: string, format: 'png' | 'jpg' | 'svg' = 'png'): string => {
  if (format === 'svg') {
    return `data:image/svg+xml;base64,${base64String}`;
  }
  return `data:image/${format};base64,${base64String}`;
};
