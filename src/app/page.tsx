import { redirect } from "next/navigation"

export default function Home() {
  // In a real app, check auth state here.
  // For the initial generated demo, we go straight to dashboard.
  redirect("/dashboard")
}