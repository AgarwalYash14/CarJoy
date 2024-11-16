import { MagnifyingGlass } from "@phosphor-icons/react";

export default function List() {
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="w-1/3 h-4/5 bg-white flex items-center gap-2 rounded-full px-4">
                    <MagnifyingGlass size={25} color="#1d1616" weight="light" />
                    <input
                        type="text"
                        name=""
                        id=""
                        className="w-full h-full bg-transparent text-black outline-none py-4"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-auto w-full flex flex-col pt-1">
                <div className="w-full h-2/3 bg-violet-700 rounded-3xl"></div>
                <div className="w-full h-1/3 bg-white rounded-3xl"></div>
            </div>
        </div>
    );
}
