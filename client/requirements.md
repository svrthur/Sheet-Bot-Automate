## Packages
framer-motion | Smooth animations for list items and page transitions
date-fns | Formatting timestamps for logs
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes safely

## Notes
API endpoints used:
- GET /api/logs (List logs)
- POST /api/logs (Create log - mainly for simulation/testing)
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
