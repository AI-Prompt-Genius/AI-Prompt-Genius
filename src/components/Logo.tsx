import type { ReactNode } from "react"
import logo from "../images/logo.png"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Logo(_props: { className?: string; children?: ReactNode }) {
    return <img className="p-4 pb-0 w-[80px]" src={logo} alt="Logo" />
}
