import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Delete, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CalculatorState {
  display: string;
  previousValue: string;
  operation: string | null;
  waitingForNewValue: boolean;
  history: string[];
}

const SUPABASE_URL = "https://ovlidaggrndegijtysvr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bGlkYWdncm5kZWdpanR5c3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDI4MzYsImV4cCI6MjEwNDcxODgzNn0.XtXlGYCN7FqxxcF2ObjES15JUOGCHWGbmeRUVx1ItnI";

const ScientificCalculator = () => {
  const [state, setState] = useState<CalculatorState>({
    display: "0",
    previousValue: "",
    operation: null,
    waitingForNewValue: false,
    history: [],
  });
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleNumber = (num: string) => {
    setState((prev) => ({
      ...prev,
      display:
        prev.waitingForNewValue || prev.display === "0"
          ? num
          : prev.display + num,
      waitingForNewValue: false,
    }));
  };

  const handleDecimal = () => {
    setState((prev) => {
      if (prev.waitingForNewValue) {
        return { ...prev, display: "0.", waitingForNewValue: false };
      }
      if (prev.display.includes(".")) return prev;
      return { ...prev, display: prev.display + "." };
    });
  };

  const handleOperation = (op: string) => {
    const currentValue = parseFloat(state.display);

    if (state.operation && !state.waitingForNewValue) {
      const result = calculate(
        parseFloat(state.previousValue),
        currentValue,
        state.operation
      );
      setState((prev) => ({
        ...prev,
        display: formatResult(result),
        previousValue: String(result),
        operation: op,
        waitingForNewValue: true,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        previousValue: prev.display,
        operation: op,
        waitingForNewValue: true,
      }));
    }
  };

  const handleEquals = () => {
    if (!state.operation || state.waitingForNewValue) return;

    const result = calculate(
      parseFloat(state.previousValue),
      parseFloat(state.display),
      state.operation
    );

    const expression = `${state.previousValue} ${state.operation} ${state.display} = ${formatResult(result)}`;

    setState((prev) => ({
      ...prev,
      display: formatResult(result),
      previousValue: "",
      operation: null,
      waitingForNewValue: true,
      history: [expression, ...prev.history.slice(0, 9)],
    }));
  };

  const handleScientific = (func: string) => {
    const value = parseFloat(state.display);
    let result: number;

    switch (func) {
      case "sin":
        result = Math.sin((value * Math.PI) / 180);
        break;
      case "cos":
        result = Math.cos((value * Math.PI) / 180);
        break;
      case "tan":
        result = Math.tan((value * Math.PI) / 180);
        break;
      case "sqrt":
        result = Math.sqrt(value);
        break;
      case "cbrt":
        result = Math.cbrt(value);
        break;
      case "square":
        result = value * value;
        break;
      case "cube":
        result = value * value * value;
        break;
      case "log":
        result = Math.log10(value);
        break;
      case "ln":
        result = Math.log(value);
        break;
      case "exp":
        result = Math.exp(value);
        break;
      case "factorial":
        result = factorial(Math.floor(value));
        break;
      case "reciprocal":
        result = 1 / value;
        break;
      case "percent":
        result = value / 100;
        break;
      case "pi":
        result = Math.PI;
        break;
      case "e":
        result = Math.E;
        break;
      case "negate":
        result = -value;
        break;
      default:
        result = value;
    }

    setState((prev) => ({
      ...prev,
      display: formatResult(result),
      waitingForNewValue: true,
    }));
  };

  const handleClear = () => {
    setState({
      display: "0",
      previousValue: "",
      operation: null,
      waitingForNewValue: false,
      history: [],
    });
  };

  const handleBackspace = () => {
    setState((prev) => ({
      ...prev,
      display:
        prev.display.length === 1 ? "0" : prev.display.slice(0, -1),
    }));
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+":
        return prev + current;
      case "-":
        return prev - current;
      case "×":
        return prev * current;
      case "÷":
        return prev / current;
      case "^":
        return Math.pow(prev, current);
      case "mod":
        return prev % current;
      default:
        return current;
    }
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const formatResult = (num: number): string => {
    if (!isFinite(num)) return "Error";
    if (Math.abs(num) > 1e10) return num.toExponential(6);
    return parseFloat(num.toPrecision(12)).toString();
  };

  const handleAICalculate = async () => {
    if (!aiInput.trim()) return;

    setAiLoading(true);
    setAiResult(null);

    try {
      // Use OpenRouter API (free tier available)
      const response = await fetch(
        "https://openrouter.io/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href,
            "X-Title": "Scientific Calculator",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-2-7b-chat:free",
            messages: [
              {
                role: "user",
                content: `You are a math calculator. Solve this problem and return ONLY the numerical answer or brief result. Problem: ${aiInput}`,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setAiResult(`Error: ${data.error?.message || "Failed to calculate"}`);
      } else {
        const resultText =
          data.choices?.[0]?.message?.content || "No result";
        const resultValue = parseFloat(resultText);
        const finalResult = isNaN(resultValue)
          ? resultText
          : formatResult(resultValue);

        setAiResult(finalResult);
        if (!isNaN(resultValue)) {
          setState((prev) => ({
            ...prev,
            display: formatResult(resultValue),
            waitingForNewValue: true,
          }));
        }
      }
    } catch (error) {
      setAiResult(
        `Error: ${error instanceof Error ? error.message : "Failed to calculate"}`
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <h1 className="text-white text-2xl font-bold">Scientific Calculator</h1>
          </div>

          {/* Display */}
          <div className="bg-slate-900 p-6 border-b border-slate-700">
            <div className="bg-slate-950 rounded-lg p-4 mb-2">
              <div className="text-right text-slate-400 text-sm h-6">
                {state.previousValue && state.operation
                  ? `${state.previousValue} ${state.operation}`
                  : ""}
              </div>
              <div className="text-right text-white text-4xl font-mono font-bold break-words">
                {state.display}
              </div>
            </div>
            {state.history.length > 0 && (
              <div className="text-slate-400 text-xs mt-2 max-h-16 overflow-y-auto">
                <div className="opacity-60">{state.history[0]}</div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="p-6 bg-slate-800 space-y-3">
            {/* Row 1: Clear and Operations */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={handleClear}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold col-span-2"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                onClick={handleBackspace}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              >
                <Delete className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleOperation("÷")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
              >
                ÷
              </Button>
            </div>

            {/* Row 2: Scientific Functions */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleScientific("sin")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                sin
              </Button>
              <Button
                onClick={() => handleScientific("cos")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                cos
              </Button>
              <Button
                onClick={() => handleScientific("tan")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                tan
              </Button>
              <Button
                onClick={() => handleScientific("sqrt")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                √
              </Button>
            </div>

            {/* Row 3: More Scientific */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleScientific("log")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                log
              </Button>
              <Button
                onClick={() => handleScientific("ln")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                ln
              </Button>
              <Button
                onClick={() => handleScientific("pi")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                π
              </Button>
              <Button
                onClick={() => handleScientific("e")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                e
              </Button>
            </div>

            {/* Row 4: Numbers and Operations */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleNumber("7")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                7
              </Button>
              <Button
                onClick={() => handleNumber("8")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                8
              </Button>
              <Button
                onClick={() => handleNumber("9")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                9
              </Button>
              <Button
                onClick={() => handleOperation("×")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
              >
                ×
              </Button>
            </div>

            {/* Row 5: Numbers and Operations */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleNumber("4")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                4
              </Button>
              <Button
                onClick={() => handleNumber("5")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                5
              </Button>
              <Button
                onClick={() => handleNumber("6")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                6
              </Button>
              <Button
                onClick={() => handleOperation("-")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
              >
                -
              </Button>
            </div>

            {/* Row 6: Numbers and Operations */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleNumber("1")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                1
              </Button>
              <Button
                onClick={() => handleNumber("2")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                2
              </Button>
              <Button
                onClick={() => handleNumber("3")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                3
              </Button>
              <Button
                onClick={() => handleOperation("+")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
              >
                +
              </Button>
            </div>

            {/* Row 7: Special Functions and Equals */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleScientific("square")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                x²
              </Button>
              <Button
                onClick={() => handleNumber("0")}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                0
              </Button>
              <Button
                onClick={handleDecimal}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg"
              >
                .
              </Button>
              <Button
                onClick={handleEquals}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-lg"
              >
                =
              </Button>
            </div>

            {/* Row 8: More Functions */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleScientific("cube")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                x³
              </Button>
              <Button
                onClick={() => handleOperation("^")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              >
                x^y
              </Button>
              <Button
                onClick={() => handleScientific("factorial")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                n!
              </Button>
              <Button
                onClick={() => handleScientific("reciprocal")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                1/x
              </Button>
            </div>

            {/* Row 9: Additional Functions */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => handleScientific("cbrt")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                ∛
              </Button>
              <Button
                onClick={() => handleOperation("mod")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              >
                mod
              </Button>
              <Button
                onClick={() => handleScientific("percent")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                %
              </Button>
              <Button
                onClick={() => handleScientific("negate")}
                className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold"
              >
                +/-
              </Button>
            </div>

            {/* AI Button */}
            <Button
              onClick={() => setShowAIModal(true)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              AI Calculation
            </Button>
          </div>

          {/* Footer */}
          <div className="bg-slate-900 px-6 py-4 border-t border-slate-700 text-center text-slate-400 text-sm">
            <p>All trigonometric functions use degrees</p>
          </div>
        </div>

        {/* AI Modal */}
        <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                AI Math Solver
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">
                  Describe your math problem:
                </label>
                <Input
                  placeholder="e.g., What is the square root of 144? or Calculate 25% of 200"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAICalculate();
                  }}
                  className="bg-slate-900 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
              {aiResult && (
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                  <div className="text-slate-400 text-sm mb-1">Result:</div>
                  <div className="text-white text-2xl font-mono font-bold">
                    {aiResult}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleAICalculate}
                  disabled={aiLoading || !aiInput.trim()}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold disabled:opacity-50"
                >
                  {aiLoading ? "Calculating..." : "Calculate"}
                </Button>
                <Button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiInput("");
                    setAiResult(null);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ScientificCalculator;
