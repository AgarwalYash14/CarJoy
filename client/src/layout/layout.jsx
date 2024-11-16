import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Layout() {
    return (
        <div className="w-full h-screen flex">
            <Sidebar />
            <div className="w-full h-full p-2">
                <Outlet />
            </div>
        </div>
    );
}
