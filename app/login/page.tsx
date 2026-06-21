/**
 * LoginPage — Suspense boundary wrapper for the authentication form.
 * Required because the inner form reads from useSearchParams().
 */
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
