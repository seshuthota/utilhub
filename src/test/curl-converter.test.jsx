import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Converter from "../app/tools/curl/Converter";

const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("@/hooks/useUrlState", async (importOriginal) => {
  const React = await import("react");
  return {
    useUrlState: (key, initial) => React.useState(initial),
  };
});

vi.mock("@/components/common/CodeEditor", () => {
  return {
    __esModule: true,
    default: ({
      value,
      onChange,
      placeholder,
      readOnly,
      "data-testid": testId,
    }) => (
      <textarea
        data-testid={testId || (readOnly ? "output-editor" : "input-editor")}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    ),
  };
});

vi.mock("@/components/Toast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock("curlconverter", () => ({
  toPython: (curl) => {
    if (curl.includes("error")) throw new Error("Parse error");
    return "requests.get('https://example.com')";
  },
  toNodeFetch: () => "fetch('https://example.com')",
  toGo: () => 'http.Get("https://example.com")',
  toNodeAxios: () => "axios.get('https://example.com')",
  toRust: () => "reqwest::blocking::Client::new()",
  toPhp: () => "$client = new GuzzleHttp\\Client();",
  toJava: () => "OkHttpClient client = new OkHttpClient();",
  toDart: () =>
    "var response = await http.get(Uri.parse('https://example.com'));",
  toElixir: () => 'HTTPoison.get!("https://example.com")',
  toAnsible: () => "- uri: url: https://example.com",
  toJsonString: () => '{"method":"GET","url":"https://example.com"}',
}));

describe("Curl Converter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the converter interface with input and output editors", () => {
    render(<Converter />);

    expect(screen.getByText("cURL Command")).toBeInTheDocument();
    expect(screen.getByText("Python (requests) Output")).toBeInTheDocument();
    expect(screen.getByTestId("input-editor")).toBeInTheDocument();
    expect(screen.getByTestId("output-editor")).toBeInTheDocument();
  });

  it("converts curl command to Python by default", () => {
    render(<Converter />);

    const input = screen.getByTestId("input-editor");

    act(() => {
      fireEvent.change(input, {
        target: { value: "curl https://example.com" },
      });
    });

    expect(screen.getByTestId("output-editor")).toHaveValue(
      "requests.get('https://example.com')",
    );
  });

  it("converts curl to different languages when selected", () => {
    render(<Converter />);

    const input = screen.getByTestId("input-editor");
    const select = screen.getByLabelText("Target Language");

    act(() => {
      fireEvent.change(input, {
        target: { value: "curl https://example.com" },
      });
    });

    act(() => {
      fireEvent.change(select, { target: { value: "go" } });
    });

    expect(screen.getByTestId("output-editor")).toHaveValue(
      'http.Get("https://example.com")',
    );
  });

  it("displays error message for invalid curl command", () => {
    render(<Converter />);

    const input = screen.getByTestId("input-editor");

    act(() => {
      fireEvent.change(input, { target: { value: "curl error" } });
    });

    expect(screen.getByText(/Invalid cURL command/i)).toBeInTheDocument();
  });

  it("clears output when input is empty", () => {
    render(<Converter />);

    const input = screen.getByTestId("input-editor");

    act(() => {
      fireEvent.change(input, {
        target: { value: "curl https://example.com" },
      });
    });

    expect(screen.getByTestId("output-editor")).toHaveValue(
      "requests.get('https://example.com')",
    );

    act(() => {
      fireEvent.change(input, { target: { value: "" } });
    });

    expect(screen.getByTestId("output-editor")).toHaveValue("");
  });

  it("has language selector with all options", () => {
    render(<Converter />);

    const select = screen.getByLabelText("Target Language");
    expect(select).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: "Python (requests)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Node.js (fetch)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Go" })).toBeInTheDocument();
  });
});
