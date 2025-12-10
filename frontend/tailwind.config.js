module.exports = {
    content: [
        './pages/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                'status-scheduled': '#3b82f6',
                'status-processing': '#eab308',
                'status-called': '#22c55e',
                'status-failed': '#ef4444',
            },
        },
    },
    plugins: [],
}
