import React from 'react'
import { Link } from 'react-router-dom'

const HomePageSkeleton = () => {
    return (
        <>

            {/* Header Section */}
            <div className="h-16 bg-white border-b fixed top-0 left-0 right-0 z-10">
                {/* Desktop Navbar */}
                <div className="md:flex max-w-7xl mx-auto hidden justify-between h-full">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mt-3">
                        <div className="bg-gray-300 h-8 w-8 rounded-full"></div>
                        <div className="hidden md:block font-bold text-xl bg-gray-300 w-24 h-6 rounded"></div>
                    </div>

                    {/* User and DarkMode */}
                    <div className="flex items-center gap-8">
                        <div className="bg-gray-300 h-8 w-24 rounded-full"></div>
                        <div className="bg-gray-300 h-8 w-24 rounded-full"></div>
                    </div>
                </div>

                {/* Mobile Navbar */}
                <div className="md:hidden flex justify-between px-4 h-full">
                    <div className="font-bold text-lg bg-gray-300 h-6 w-28 rounded"></div>
                    <div className="bg-gray-300 h-6 w-6 rounded-full"></div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative bg-gray-200 py-24 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gray-300 h-8 w-60 mx-auto rounded mb-4"></div>
                    <div className="bg-gray-300 h-4 w-80 mx-auto rounded mb-8"></div>

                    {/* Search Form */}
                    <div className="flex items-center bg-gray-300 rounded-full max-w-xl mx-auto mb-6 p-3">
                        <div className="bg-gray-200 h-8 w-full rounded-l-full"></div>
                        <div className="bg-gray-400 h-8 w-24 rounded-r-full"></div>
                    </div>
                    <div className="bg-gray-300 h-8 w-40 mx-auto rounded-full"></div>
                </div>
            </div>

            {/* Courses Section */}
            <div className="bg-gray-50 py-10">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="bg-gray-300 h-8 w-60 mx-auto rounded mb-10"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Skeleton Cards */}
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                                <div className="bg-gray-300 h-40 w-full rounded mb-4"></div>
                                <div className="bg-gray-300 h-6 w-3/4 rounded mb-2"></div>
                                <div className="bg-gray-300 h-4 w-1/2 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>


    )
}

export default HomePageSkeleton
