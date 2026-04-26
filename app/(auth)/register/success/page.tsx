import { redirect } from "next/navigation";

export default function RegisterSuccess() {
    redirect("/login");
}
