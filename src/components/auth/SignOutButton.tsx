import { signOut } from "@/app/actions/account";

export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOut}>
      <button type="submit" className={`text-[15px] font-medium text-accent ${className}`}>
        Sign out
      </button>
    </form>
  );
}
