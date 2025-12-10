import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
    return (
        <>
            <Head>
                <title>Voice Reminder Service</title>
                <meta name="description" content="Schedule voice reminders to be delivered at a specific time" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="container py-16">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                            Voice Reminder Service
                        </h1>
                        <p className="text-xl text-gray-600">
                            Schedule voice reminders to be delivered at the perfect time
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <Link href="/users">
                            <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                                <div className="flex items-center mb-4">
                                    <svg className="w-12 h-12 text-blue-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <h2 className="text-2xl font-semibold text-gray-900">Manage Users</h2>
                                </div>
                                <p className="text-gray-600">
                                    Create and view users who can schedule voice reminders
                                </p>
                            </div>
                        </Link>

                        <Link href="/reminders">
                            <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-indigo-500">
                                <div className="flex items-center mb-4">
                                    <svg className="w-12 h-12 text-indigo-600 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <h2 className="text-2xl font-semibold text-gray-900">Manage Reminders</h2>
                                </div>
                                <p className="text-gray-600">
                                    Create, view, and track your scheduled voice reminders
                                </p>
                            </div>
                        </Link>
                    </div>

                    <div className="mt-16 text-center">
                        <div className="card max-w-2xl mx-auto bg-blue-50">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works</h3>
                            <ol className="text-left space-y-2 text-gray-700">
                                <li className="flex items-start">
                                    <span className="font-bold text-blue-600 mr-2">1.</span>
                                    <span>Create a user account</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold text-blue-600 mr-2">2.</span>
                                    <span>Schedule a voice reminder with phone number, message, and time</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold text-blue-600 mr-2">3.</span>
                                    <span>At the scheduled time, we&apos;ll call the number with your message</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-bold text-blue-600 mr-2">4.</span>
                                    <span>Track the status and view call transcripts</span>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
