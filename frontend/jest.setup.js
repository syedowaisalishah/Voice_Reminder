// jest.setup.js
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        pathname: '/',
        query: {},
        asPath: '/',
    }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
    return ({ children, href }) => {
        return <a href={href}>{children}</a>;
    };
});

// Mock Next.js Head
jest.mock('next/head', () => {
    return {
        __esModule: true,
        default: ({ children }) => {
            return <>{children}</>;
        },
    };
});
