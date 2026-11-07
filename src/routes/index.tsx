import { createFileRoute, redirect } from "@tanstack/react-router";
import { Dashboard } from "./dashboard";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: Dashboard,
});
