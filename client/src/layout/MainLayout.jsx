import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import React from 'react'
import { Outlet } from 'react-router-dom'

const mainLayout = () => {
    return (
        <>
            {/* <Navbar /> */}
            <div>
                <Outlet></Outlet>
            </div>
            <Footer />
        </>
    )
}

export default mainLayout
