// components/Sidebar.jsx
import {
    HourglassSimple,
    House,
    ListBullets,
    PlusCircle,
    SignOut,
} from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Sidebar() {
    const { logout } = useAuth();

    const navLinks = [
        {
            icon: (
                <House
                    size={38}
                    color="#F1F1F1"
                    weight="bold"
                    className="p-2 rounded-full"
                />
            ),
            text: "Home",
            path: "/",
        },
        {
            icon: (
                <PlusCircle
                    size={38}
                    color="#F1F1F1"
                    weight="bold"
                    className="p-2 rounded-full"
                />
            ),
            text: "Add",
            path: "/add",
        },
        {
            icon: (
                <ListBullets
                    size={38}
                    color="#F1F1F1"
                    weight="bold"
                    className="p-2 rounded-full"
                />
            ),
            text: "List",
            path: "/list",
        },
    ];

    return (
        <div className="h-full flex flex-col items-center justify-between px-4 py-10">
            <HourglassSimple
                size={50}
                color="#F1F1F1"
                weight="fill"
                className="m-0"
            />

            <div className="flex flex-col items-center gap-4">
                {navLinks.map((link, index) => (
                    <NavLink
                        key={index}
                        to={link.path}
                        className={(navClass) =>
                            navClass.isActive
                                ? "bg-indigo-700 rounded-full p-0.5"
                                : "hover:bg-blue-200 hover:bg-opacity-55 rounded-full p-0.5"
                        }
                    >
                        {link.icon}
                    </NavLink>
                ))}
            </div>
            <button
                onClick={logout}
                className="border border-[#f1f1f1] rounded-full hover:bg-red-600"
            >
                <SignOut
                    size={45}
                    color="#F1F1F1"
                    weight="bold"
                    className="p-3"
                />
            </button>
        </div>
    );
}
