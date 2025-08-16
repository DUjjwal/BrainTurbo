"use client";
import { Menu, Transition } from "@headlessui/react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import Image from "next/image";
import { Fragment } from "react";

interface Props {
  session: Session | null;
  room: boolean;
  roomID: string;
}

export default function ProfileDropdown({ session, room, roomID }: Props) {
  return (
    <Menu>
      <div className="fixed inline-block text-left outline-none top-1 left-1">
        <Menu.Button className="focus:outline-none">
          <Image
            className="p-1 rounded-full ring-2 ring-gray-300 cursor-pointer"
            src={session?.user?.image ?? "/default-avatar.png"}
            alt="User Avatar"
            width={40}
            height={40}
          />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 top-full mt-1 w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-gray-300 focus:outline-none z-50">
            <div className="py-1">
              {room && (
                <Menu.Item>
                  {({ active }: { active: boolean }) => (
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(roomID);
                        alert(`Room ID ${roomID} copied to clipboard`);
                      }}
                      className={`${
                        active ? "bg-gray-100" : ""
                      } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      Copy Room ID
                    </button>
                  )}
                </Menu.Item>
              )}

              <Menu.Item>
                {({ active }: { active: boolean }) => (
                  <button
                    type="button"
                    onClick={async () => {
                      localStorage.removeItem("roomid");
                      await signOut();
                    }}
                    className={`${
                      active ? "bg-gray-100" : ""
                    } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                  >
                    Sign Out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </div>
    </Menu>
  );
}