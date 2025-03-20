// pages/NotFoundPage.jsx

import React from "react";

export const NotFound = () => {
    return (
        <>
            <div className="flex items-center justify-center h-screen text-center">
                <div>
                    <h1 className="text-3xl font-bold text-purple-500">
                        Error 404 - How Did You End Up Here ???
                    </h1>
                    <p className="text-lg mt-2 text-purple-400">
                        The page you are looking for does not exist
                    </p>
                </div>
            </div>
        </>
    );
};