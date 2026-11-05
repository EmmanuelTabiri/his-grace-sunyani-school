import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterContextProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { Route as AuthRoute } from "@/routes/auth";

// The sign-in form must keep the password hidden by default and only reveal it
// while the user asks for it, so a shoulder-surfing visitor cannot read it.
describe("Sign in password visibility", () => {
  afterEach(cleanup);

  function renderAuth() {
    const queryClient = new QueryClient();
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/auth"] }),
      context: { queryClient },
    });
    const component = AuthRoute.options.component;
    if (!component) throw new Error("auth route has no component to render");
    const element = createElement(component);

    render(
      <RouterContextProvider router={router}>
        <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
      </RouterContextProvider>,
    );
  }

  it("starts hidden, reveals on click, hides again on second click", () => {
    renderAuth();

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
