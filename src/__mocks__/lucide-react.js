// Mock lucide-react icons for Jest tests
// This avoids ESM compatibility issues with the lucide-react package
/* eslint-disable @typescript-eslint/no-require-imports */

const React = require('react');

// Create a simple mock component for all icons
const IconMock = React.forwardRef(function IconMock(props, ref) {
    return React.createElement('svg', {
        ...props,
        ref,
        'data-testid': 'icon-mock',
        'aria-hidden': 'true'
    });
});

// Use Proxy to handle any icon import from lucide-react
module.exports = new Proxy({}, {
    get: (target, prop) => {
        // Return the mock for any icon name
        if (prop === '__esModule') return true;
        return IconMock;
    }
});
