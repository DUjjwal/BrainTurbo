"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import uuid from 'uuid-random';
import ProfileDropdown from "../components";
import { roomExist, getDBID, createRoom } from "../actions/user";
  import { ToastContainer, toast, Bounce } from 'react-toastify';

export default function Home() {
    const session = useSession()
    const [ roomId, setRoomId ] = useState("")
    
    const router = useRouter()    
    if(!session) {
        setTimeout(() => {
            router.push("/")
        }, 3000)
        return (
            <div className="flex justify-center items-center w-full h-screen text-center">
                <p className = "my-4 text-lg text-gray-500">User not authenticated <br />Redirecting...</p>

            </div>
        );
    }          
    else if(session.status === 'loading') {
        return (
            <div role="status" className = "w-full h-screen flex justify-center items-center">
            <svg aria-hidden="true" className = "w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className = "sr-only">Loading...</span>
        </div>
        )
    }
    else if(session.status === 'unauthenticated') {
        setTimeout(() => {
            router.push("/")
        }, 3000)
        return (
            <div className="flex justify-center items-center w-full h-screen text-center">
                <p className = "my-4 text-lg text-gray-500">User not authenticated <br />Redirecting...</p>

            </div>
        );
    }
    else {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <ProfileDropdown session={session.data} room={false} roomID=""/>
                <div className="w-[20%] h-auto p-2 flex flex-col justify-center gap-y-2">
                    <label className = "block text-xl font-medium text-gray-900 dark:text-white">Enter Room ID</label>
                    <input type="text" id="first_name" value={roomId} className = "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Room ID" required onChange={(e) => {
                        setRoomId(e.target.value)
                    }}/>
                    <button type="submit" className = "w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-fullpx-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={async () => {
                        //check if its a valid roomName present in DB also
                        //if yes set the roomId in localstorage
                        if(roomId === '')return;
                        if(await roomExist(roomId)) {
                            const id = await getDBID(roomId)
                            localStorage.setItem('roomid', String(id))
                            router.push("/canvas")
                        }
                        else {
                            toast.error('Room ID Invalid!', {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: false,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                            transition: Bounce,
                            });
                            setRoomId("")
                        }                     
                    }}>Join Room</button>
                    <div className = "inline-flex items-center justify-center w-full">
                        <hr className = "w-64 h-px my-2 bg-gray-200 border-0 dark:bg-gray-700"/>
                        <span className = "absolute px-3 font-medium text-gray-900 -translate-x-1/2 bg-white left-1/2 dark:text-white dark:bg-gray-900">or</span>
                    </div>
                    <button type="submit" className = "w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-fullpx-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={async () => {
                        const id = uuid()
                        const res = await createRoom(id)
                        if(res) {
                            const dbid = await getDBID(id)
                            localStorage.setItem('roomid', String(dbid))
                            router.push("/canvas")
                        }
                        else {
                            toast.error('Room Creation Failed Try Again', {
                            position: "top-right",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: false,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: "light",
                            transition: Bounce,
                            });
                        }
                    }}>Create Room</button>
                </div>
                <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
                />
            </div>
        )
    }
}