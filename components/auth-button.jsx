import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { ThemeSwitcher } from "./theme-switcher";

export async function AuthButton() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="lg" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="lg" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
        <ThemeSwitcher className="border border-black" />
      </div>
    );
  }

  const { data: profile, error } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    // fallback to just email
    // return (
    //   <div className="flex items-center gap-4">
    //     Hey, {user.email}!
    //     <LogoutButton />
    //     <ThemeSwitcher className="border border-black" />
    //   </div>
    // );
  }

  return (
    <div className="flex items-center gap-4">
      Hey, {profile?.username ?? user.email}!
      <LogoutButton />
      <ThemeSwitcher className="border border-black" />
    </div>
  );
}
