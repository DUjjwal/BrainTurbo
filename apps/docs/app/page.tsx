"use client"
import Image from "next/image";
import { signIn } from 'next-auth/react'

export default function Page() {
  return (
    <div className="h-screen w-full flex flex-col justify-center items-center gap-y-3">
      <h1 className = "mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl">Welcome to <mark className = "px-2 text-white bg-blue-600 rounded-sm">BrainBoard</mark></h1>
      <button
        onClick={async () => await signIn("google")}
        className="mt-8 flex items-center gap-3 px-6 py-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-300"
      >
        <Image
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google Icon"
          width={20} height={20}
        />
        <span className="text-gray-700 font-medium">Get Started with Google</span>
      </button>
    </div>
  )  
}
