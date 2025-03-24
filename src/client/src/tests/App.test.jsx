import { render, screen, act } from "@testing-library/react";
import App from "../App";

test("App renders without crashing", async () => {
    await act(async () => {
        render(<App />);
    });
});
