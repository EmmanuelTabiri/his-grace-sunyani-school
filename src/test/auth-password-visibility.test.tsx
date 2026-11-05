import { QueryClient } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// The sign-in form must keep the password hidden by default and only reveal it
// while the user asks for it, so a shoulder-surfing visitor cannot read it.
describe("Sign in password visibility", () => {
  afterEach(cleanup);

  async function renderAuth() {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/auth"] }),
      context: { queryClient: new QueryClient() },
    });
    render(<RouterProvider router={router} />);
    return screen.findByLabelText("Password", {}, { timeout: 5000 });
  }

  it("starts hidden, reveals on click, hides again on second click", async () => {
    const password = await renderAuth();
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
