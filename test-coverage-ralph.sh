#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

# Ensure progress file exists
touch test-coverage-progress.txt

for ((i=1; i<=$1; i++)); do
  echo "Starting iteration $i..."
  
  result=$(opencode run --model "minimax/MiniMax-M2.1" "@test-coverage-progress.txt \
WHAT MAKES A GREAT TEST (Next.js/React): \
A great test covers behavior users depend on. It tests a feature that, if broken, would frustrate or block users. \
It validates real workflows — not implementation details. It catches regressions before users do. \
Do NOT write tests just to increase coverage. Use coverage as a guide to find UNTESTED USER-FACING BEHAVIOR. \
If uncovered code is not worth testing (boilerplate, unreachable error branches, internal plumbing), \
add /* v8 ignore next */ comments instead of writing low-value tests. \
\
PROCESS: \
1. Run 'npx vitest run --coverage' to see which files have low coverage. \
2. Read the uncovered lines and identify the most important USER-FACING FEATURE that lacks tests. \
3. Prioritize: error handling users will hit, user interactions (clicks, inputs), prop updates. \
4. Deprioritize: internal utilities, styling only files, layout wrappers, next.config.mjs. \
5. Write ONE meaningful test file (e.g. src/test/Feature.test.jsx) that validates the feature works. \
   - Use 'vitest' describes/it/expect. \
   - Use '@testing-library/react' (render, screen, fireEvent/userEvent). \
   - Mock external dependencies like 'next/navigation' or 'lucide-react' if needed. \
6. Run 'npx vitest run' to verify the new test passes. \
7. Append super-concise notes to test-coverage-progress.txt: what you tested, coverage %, any learnings. \
\
ONLY WRITE ONE TEST FILE PER ITERATION. \
If statement coverage reaches 100% or you believe all meaningful code is covered, output <promise>COMPLETE</promise>. \
")

  echo "$result"
  
  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "Coverage goal reached, exiting."
    notify-send "UtilHub: Tests completed after $i iterations"
    exit 0
  fi
done
